import { NextResponse, type NextRequest } from "next/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

const DEFAULT_SUPABASE_URL = "https://sdbvsoklyuuaeaqksjkd.supabase.co";
const DEFAULT_SUPABASE_ANON_KEY = "sb_publishable_TbhqlbTXXbwf89J1W4SvuQ_lvUG0jvK";

// Caché de presencia en memoria (rápido y sin lecturas constantes a BD)
const presenciaMemoria: Record<string, { ultima_conexion: number; rol?: string }> = {};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const usuarioId = searchParams.get("usuario_id");

    const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || DEFAULT_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || DEFAULT_SUPABASE_ANON_KEY;
    const supabaseUrl = rawUrl.replace(/\/rest\/v1\/?$/, "").replace(/\/+$/, "");
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    const client = createSupabaseClient(supabaseUrl, serviceRoleKey || supabaseAnonKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const ahora = Date.now();
    const UMBRAL_EN_LINEA_MS = 2.5 * 60 * 1000; // 2.5 minutos

    if (usuarioId) {
      // Comprobar memoria primero
      const reg = presenciaMemoria[usuarioId];
      if (reg && ahora - reg.ultima_conexion < UMBRAL_EN_LINEA_MS) {
        return NextResponse.json({
          en_linea: true,
          ultima_conexion: new Date(reg.ultima_conexion).toISOString(),
        });
      }

      // Si no en memoria, verificar en disponibilidad de perfiles
      const { data: perfil } = await client
        .from("perfiles")
        .select("disponibilidad")
        .eq("id", usuarioId)
        .maybeSingle();

      const ultimaConexionDb = perfil?.disponibilidad?.ultima_conexion;
      if (ultimaConexionDb) {
        const diff = ahora - new Date(ultimaConexionDb).getTime();
        if (diff < UMBRAL_EN_LINEA_MS) {
          return NextResponse.json({
            en_linea: true,
            ultima_conexion: ultimaConexionDb,
          });
        }
        return NextResponse.json({
          en_linea: false,
          ultima_conexion: ultimaConexionDb,
        });
      }

      return NextResponse.json({ en_linea: false, ultima_conexion: null });
    }

    // Si no se pasa usuario_id, devolver el estado de todos los especialistas
    const { data: psicos } = await client
      .from("perfiles")
      .select("id, nombre_completo, email, rol, avatar_url, disponibilidad")
      .in("rol", ["psicologo", "admin", "superadmin"]);

    const estados = (psicos || []).map((p: any) => {
      const mem = presenciaMemoria[p.id];
      const ultima = mem?.ultima_conexion
        ? new Date(mem.ultima_conexion).toISOString()
        : p.disponibilidad?.ultima_conexion || null;

      const enLinea = ultima ? ahora - new Date(ultima).getTime() < UMBRAL_EN_LINEA_MS : false;

      return {
        id: p.id,
        nombre: p.nombre_completo || p.email.split("@")[0],
        email: p.email,
        rol: p.rol,
        en_linea: enLinea,
        ultima_conexion: ultima,
      };
    });

    return NextResponse.json({ success: true, especialistas: estados });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Error al consultar presencia." },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { usuario_id, rol } = body;

    if (!usuario_id) {
      return NextResponse.json(
        { error: "usuario_id es requerido." },
        { status: 400 }
      );
    }

    const ahora = Date.now();
    presenciaMemoria[usuario_id] = {
      ultima_conexion: ahora,
      rol: rol || "usuario",
    };

    const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || DEFAULT_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || DEFAULT_SUPABASE_ANON_KEY;
    const supabaseUrl = rawUrl.replace(/\/rest\/v1\/?$/, "").replace(/\/+$/, "");
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    // Actualizar periódicamente en la base de datos (en segundo plano)
    try {
      const client = createSupabaseClient(supabaseUrl, serviceRoleKey || supabaseAnonKey, {
        auth: { autoRefreshToken: false, persistSession: false },
      });

      const { data: perfil } = await client
        .from("perfiles")
        .select("disponibilidad")
        .eq("id", usuario_id)
        .maybeSingle();

      const dispActual = perfil?.disponibilidad || {};
      dispActual.ultima_conexion = new Date(ahora).toISOString();
      dispActual.en_linea = true;

      await client
        .from("perfiles")
        .update({ disponibilidad: dispActual })
        .eq("id", usuario_id);
    } catch {
      // Ignorar si falla la persistencia secundaria en BD
    }

    return NextResponse.json({ success: true, en_linea: true, timestamp: ahora });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Error al actualizar presencia." },
      { status: 500 }
    );
  }
}
