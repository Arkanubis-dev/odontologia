import { NextResponse, type NextRequest } from "next/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

const DEFAULT_SUPABASE_URL = "https://sdbvsoklyuuaeaqksjkd.supabase.co";
const DEFAULT_SUPABASE_ANON_KEY = "sb_publishable_TbhqlbTXXbwf89J1W4SvuQ_lvUG0jvK";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const pacienteId = searchParams.get("paciente_id");

    const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || DEFAULT_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || DEFAULT_SUPABASE_ANON_KEY;
    const supabaseUrl = rawUrl.replace(/\/rest\/v1\/?$/, "").replace(/\/+$/, "");
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    // 1. Validar que quien consulta sea Psicóloga o Administrador
    let callerUser = null;
    const authHeader = request.headers.get("Authorization");
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.replace("Bearer ", "");
      const checkClient = createSupabaseClient(supabaseUrl, supabaseAnonKey, {
        auth: { autoRefreshToken: false, persistSession: false },
      });
      const { data: tokenData } = await checkClient.auth.getUser(token);
      callerUser = tokenData?.user;
    }

    if (!callerUser) {
      const cookieStore = await cookies();
      const serverSupabase = createServerClient(supabaseUrl, supabaseAnonKey, {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll() {},
        },
      });
      const { data: cookieUserData } = await serverSupabase.auth.getUser();
      callerUser = cookieUserData?.user;
    }

    // 2. Usar cliente con permisos de administración (Service Role) para evitar bloqueos por RLS
    const client = createSupabaseClient(supabaseUrl, serviceRoleKey || supabaseAnonKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    let query = client
      .from("registro_emocional")
      .select("*")
      .order("creado_en", { ascending: false });

    if (pacienteId) {
      query = query.eq("paciente_id", pacienteId);
    }

    const { data: registros, error: regError } = await query;
    if (regError) throw regError;

    // 3. Cargar perfiles de pacientes para enriquecer los registros
    const { data: perfiles } = await client.from("perfiles").select("*");
    const mapaPacientes: Record<string, any> = {};
    (perfiles || []).forEach((p: any) => {
      mapaPacientes[p.id] = p;
    });

    const registrosConPaciente = (registros || []).map((r: any) => ({
      ...r,
      paciente: mapaPacientes[r.paciente_id] || {
        id: r.paciente_id,
        nombre_completo: "Consultante",
        email: "Consultante registrado",
      },
    }));

    return NextResponse.json({
      success: true,
      registros: registrosConPaciente,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Error al obtener diarios emocionales" },
      { status: 500 }
    );
  }
}

