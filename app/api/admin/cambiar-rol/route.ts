import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

const DEFAULT_SUPABASE_URL = "https://sdbvsoklyuuaeaqksjkd.supabase.co";
const DEFAULT_SUPABASE_ANON_KEY = "sb_publishable_TbhqlbTXXbwf89J1W4SvuQ_lvUG0jvK";

export async function POST(request: NextRequest) {
  try {
    const { usuarioId, nuevoRol } = await request.json();

    if (!usuarioId || !nuevoRol) {
      return NextResponse.json(
        { error: "usuarioId y nuevoRol son requeridos" },
        { status: 400 }
      );
    }

    const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || DEFAULT_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || DEFAULT_SUPABASE_ANON_KEY;
    const supabaseUrl = rawUrl.replace(/\/rest\/v1\/?$/, "").replace(/\/+$/, "");
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    // Validar autorización
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

    const esMaster = callerUser?.email?.toLowerCase() === "brayancamilo2407@gmail.com";
    if (!esMaster && callerUser) {
      const checkClient = createSupabaseClient(supabaseUrl, serviceRoleKey || supabaseAnonKey, {
        auth: { autoRefreshToken: false, persistSession: false },
      });
      const { data: perfil } = await checkClient
        .from("perfiles")
        .select("rol")
        .eq("id", callerUser.id)
        .single();

      if (perfil?.rol !== "admin" && perfil?.rol !== "superadmin") {
        return NextResponse.json({ error: "Acceso denegado" }, { status: 403 });
      }
    }

    // Actualizar en auth.users y perfiles usando Service Role si está disponible
    if (serviceRoleKey) {
      const adminClient = createSupabaseClient(supabaseUrl, serviceRoleKey, {
        auth: { autoRefreshToken: false, persistSession: false },
      });

      // 1. Actualizar metadata de auth.users
      await adminClient.auth.admin.updateUserById(usuarioId, {
        user_metadata: { rol: nuevoRol },
      });

      // 2. Intentar actualizar en public.perfiles
      try {
        await adminClient
          .from("perfiles")
          .update({ rol: nuevoRol, actualizado_en: new Date().toISOString() })
          .eq("id", usuarioId);
      } catch {
        // Ignorar si perfiles no existe
      }

      return NextResponse.json({ success: true, rol: nuevoRol });
    }

    // Fallback: usar cliente servidor con RLS
    const cookieStore = await cookies();
    const serverSupabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll() {},
      },
    });

    const { error: err } = await serverSupabase
      .from("perfiles")
      .update({ rol: nuevoRol })
      .eq("id", usuarioId);

    if (err) throw err;

    return NextResponse.json({ success: true, rol: nuevoRol });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Error al actualizar rol" },
      { status: 500 }
    );
  }
}

