import { NextResponse, type NextRequest } from "next/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

const DEFAULT_SUPABASE_URL = "https://sdbvsoklyuuaeaqksjkd.supabase.co";
const DEFAULT_SUPABASE_ANON_KEY = "sb_publishable_TbhqlbTXXbwf89J1W4SvuQ_lvUG0jvK";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const usuarioId = searchParams.get("usuario_id");

    if (!usuarioId) {
      return NextResponse.json(
        { error: "usuario_id es requerido." },
        { status: 400 }
      );
    }

    const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || DEFAULT_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || DEFAULT_SUPABASE_ANON_KEY;
    const supabaseUrl = rawUrl.replace(/\/rest\/v1\/?$/, "").replace(/\/+$/, "");
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    const client = createSupabaseClient(supabaseUrl, serviceRoleKey || supabaseAnonKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // 1. Obtener todos los mensajes donde participa el usuario
    const { data: mensajes, error: msgError } = await client
      .from("mensajes")
      .select("*")
      .or(`remitente_id.eq.${usuarioId},destinatario_id.eq.${usuarioId}`)
      .order("creado_en", { ascending: false });

    if (msgError) {
      return NextResponse.json({ success: true, conversaciones: [] });
    }

    // 2. Obtener lista de perfiles para enriquecer
    const { data: perfiles } = await client
      .from("perfiles")
      .select("id, nombre_completo, email, rol, avatar_url, disponibilidad");

    const mapaPerfiles: Record<string, any> = {};
    (perfiles || []).forEach((p: any) => {
      mapaPerfiles[p.id] = p;
    });

    // 3. Agrupar por contacto
    const contactosMap: Record<string, {
      contacto: any;
      ultimo_mensaje: any;
      no_leidos: number;
    }> = {};

    (mensajes || []).forEach((msg: any) => {
      const otroId = msg.remitente_id === usuarioId ? msg.destinatario_id : msg.remitente_id;
      if (!otroId) return;

      if (!contactosMap[otroId]) {
        contactosMap[otroId] = {
          contacto: mapaPerfiles[otroId] || {
            id: otroId,
            nombre_completo: "Usuario",
            email: "consultante@plataforma.com",
            rol: "paciente",
          },
          ultimo_mensaje: msg,
          no_leidos: !msg.leido && msg.destinatario_id === usuarioId ? 1 : 0,
        };
      } else if (!msg.leido && msg.destinatario_id === usuarioId) {
        contactosMap[otroId].no_leidos += 1;
      }
    });

    const conversaciones = Object.values(contactosMap);

    return NextResponse.json({ success: true, conversaciones });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Error al obtener conversaciones." },
      { status: 500 }
    );
  }
}

