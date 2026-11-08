import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

const DEFAULT_SUPABASE_URL = "https://sdbvsoklyuuaeaqksjkd.supabase.co";
const DEFAULT_SUPABASE_ANON_KEY = "sb_publishable_TbhqlbTXXbwf89J1W4SvuQ_lvUG0jvK";

export async function GET(request: NextRequest) {
  try {
    const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || DEFAULT_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || DEFAULT_SUPABASE_ANON_KEY;
    const supabaseUrl = rawUrl.replace(/\/rest\/v1\/?$/, "").replace(/\/+$/, "");
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    // 1. Validar autenticación del solicitante
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

    // Si no hay callerUser o no es admin/superadmin, verificar si es master email
    const esMasterEmail = callerUser?.email?.toLowerCase() === "brayancamilo2407@gmail.com";
    if (!esMasterEmail && callerUser) {
      const checkClient = createSupabaseClient(supabaseUrl, serviceRoleKey || supabaseAnonKey, {
        auth: { autoRefreshToken: false, persistSession: false },
      });
      const { data: perfil } = await checkClient
        .from("perfiles")
        .select("rol")
        .eq("id", callerUser.id)
        .single();

      if (perfil?.rol !== "admin" && perfil?.rol !== "superadmin" && perfil?.rol !== "psicologo") {
        return NextResponse.json({ error: "Acceso denegado" }, { status: 403 });
      }
    }

    // 2. Si contamos con Service Role, listar directamente desde auth.users y combinar con perfiles
    if (serviceRoleKey) {
      const adminClient = createSupabaseClient(supabaseUrl, serviceRoleKey, {
        auth: { autoRefreshToken: false, persistSession: false },
      });

      const { data: authData, error: authErr } = await adminClient.auth.admin.listUsers();
      if (authErr) {
        throw authErr;
      }

      // Intentar obtener filas de public.perfiles si la tabla existe
      let perfilesMap: Record<string, any> = {};
      try {
        const { data: perfilesData } = await adminClient.from("perfiles").select("*");
        if (perfilesData) {
          perfilesData.forEach((p) => {
            perfilesMap[p.id] = p;
          });
        }
      } catch {
        // La tabla perfiles puede no estar creada aún
      }

      const lista = authData.users.map((u) => {
        const p = perfilesMap[u.id];
        const isMaster = u.email?.toLowerCase() === "brayancamilo2407@gmail.com";

        return {
          id: u.id,
          email: u.email || "",
          nombre_completo:
            p?.nombre_completo ||
            u.user_metadata?.full_name ||
            u.user_metadata?.name ||
            (u.email ? u.email.split("@")[0] : "Usuario"),
          avatar_url: p?.avatar_url || u.user_metadata?.avatar_url || "",
          telefono: p?.telefono || u.user_metadata?.telefono || "",
          rol: isMaster
            ? "superadmin"
            : p?.rol || u.user_metadata?.rol || "paciente",
          creado_en: p?.creado_en || u.created_at,
        };
      });

      return NextResponse.json({ success: true, usuarios: lista });
    }

    // Fallback: Si no hay serviceRoleKey, consultar tabla perfiles con anon key
    const client = createSupabaseClient(supabaseUrl, supabaseAnonKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const { data: perfilesData, error: perfilesErr } = await client
      .from("perfiles")
      .select("*")
      .order("creado_en", { ascending: false });

    if (perfilesErr) {
      return NextResponse.json({ success: true, usuarios: [] });
    }

    return NextResponse.json({ success: true, usuarios: perfilesData || [] });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Error al listar usuarios" },
      { status: 500 }
    );
  }
}
