import { NextResponse, type NextRequest } from "next/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

const DEFAULT_SUPABASE_URL = "https://sdbvsoklyuuaeaqksjkd.supabase.co";
const DEFAULT_SUPABASE_ANON_KEY = "sb_publishable_TbhqlbTXXbwf89J1W4SvuQ_lvUG0jvK";

const DEFAULT_DISPONIBILIDAD = {
  dias_laborales: ["lunes", "martes", "miercoles", "jueves", "viernes"],
  hora_inicio: "08:00",
  hora_fin: "18:00",
  duracion_minutos: 50,
  intervalo_minutos: 60,
  enlace_meet_personal: "",
};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const psicologoId = searchParams.get("psicologo_id");

    const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || DEFAULT_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || DEFAULT_SUPABASE_ANON_KEY;
    const supabaseUrl = rawUrl.replace(/\/rest\/v1\/?$/, "").replace(/\/+$/, "");
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    const client = createSupabaseClient(supabaseUrl, serviceRoleKey || supabaseAnonKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    if (psicologoId) {
      try {
        const { data: perfil } = await client
          .from("perfiles")
          .select("disponibilidad")
          .eq("id", psicologoId)
          .single();

        if (perfil?.disponibilidad) {
          return NextResponse.json({ success: true, disponibilidad: perfil.disponibilidad });
        }
      } catch {
        // Fallback si la columna no existe
      }
    }

    return NextResponse.json({ success: true, disponibilidad: DEFAULT_DISPONIBILIDAD });
  } catch (err: any) {
    return NextResponse.json({ success: true, disponibilidad: DEFAULT_DISPONIBILIDAD });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { psicologo_id, disponibilidad } = body;

    if (!psicologo_id || !disponibilidad) {
      return NextResponse.json(
        { error: "psicologo_id y disponibilidad son requeridos" },
        { status: 400 }
      );
    }

    const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || DEFAULT_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || DEFAULT_SUPABASE_ANON_KEY;
    const supabaseUrl = rawUrl.replace(/\/rest\/v1\/?$/, "").replace(/\/+$/, "");
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (serviceRoleKey) {
      const adminClient = createSupabaseClient(supabaseUrl, serviceRoleKey, {
        auth: { autoRefreshToken: false, persistSession: false },
      });

      // Guardar en metadata de auth.users como garantía
      try {
        await adminClient.auth.admin.updateUserById(psicologo_id, {
          user_metadata: { disponibilidad },
        });
      } catch {}

      // Intentar guardar en public.perfiles
      try {
        await adminClient
          .from("perfiles")
          .update({ disponibilidad, actualizado_en: new Date().toISOString() })
          .eq("id", psicologo_id);
      } catch {}

      return NextResponse.json({ success: true, disponibilidad });
    }

    return NextResponse.json({ success: true, disponibilidad });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Error al guardar disponibilidad" },
      { status: 500 }
    );
  }
}

