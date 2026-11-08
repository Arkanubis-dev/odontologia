import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

const DEFAULT_SUPABASE_URL = "https://sdbvsoklyuuaeaqksjkd.supabase.co";
const DEFAULT_SUPABASE_ANON_KEY = "sb_publishable_TbhqlbTXXbwf89J1W4SvuQ_lvUG0jvK";

export async function POST(request: NextRequest) {
  try {
    const { usuarioId } = await request.json();

    if (!usuarioId) {
      return NextResponse.json(
        { error: "usuarioId es requerido para eliminar" },
        { status: 400 }
      );
    }

    const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || DEFAULT_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || DEFAULT_SUPABASE_ANON_KEY;
    const supabaseUrl = rawUrl.replace(/\/rest\/v1\/?$/, "").replace(/\/+$/, "");
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    // 1. Validar que el solicitante sea Super Admin
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
        return NextResponse.json(
          { error: "Acceso denegado. Solo el Super Administrador puede eliminar usuarios." },
          { status: 403 }
        );
      }
    }

    if (!callerUser) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    // 2. Prohibir auto-eliminación de la cuenta maestra
    if (serviceRoleKey) {
      const adminClient = createSupabaseClient(supabaseUrl, serviceRoleKey, {
        auth: { autoRefreshToken: false, persistSession: false },
      });

      const { data: targetUser } = await adminClient.auth.admin.getUserById(usuarioId);
      if (targetUser?.user?.email?.toLowerCase() === "brayancamilo2407@gmail.com") {
        return NextResponse.json(
          { error: "No es posible eliminar la cuenta principal de Super Administrador." },
          { status: 400 }
        );
      }

      // Eliminar registros asociados en perfiles y citas
      try {
        await adminClient.from("citas").delete().eq("paciente_id", usuarioId);
        await adminClient.from("tareas_terapia").delete().eq("paciente_id", usuarioId);
        await adminClient.from("registro_emocional").delete().eq("paciente_id", usuarioId);
        await adminClient.from("calificaciones").delete().eq("paciente_id", usuarioId);
        await adminClient.from("perfiles").delete().eq("id", usuarioId);
      } catch {
        // Ignorar si las tablas no tienen RLS abierto
      }

      // Eliminar usuario de Supabase Auth
      const { error: deleteAuthErr } = await adminClient.auth.admin.deleteUser(usuarioId);
      if (deleteAuthErr) {
        return NextResponse.json({ error: deleteAuthErr.message }, { status: 400 });
      }

      return NextResponse.json({
        success: true,
        message: "Usuario eliminado correctamente de la base de datos.",
      });
    }

    return NextResponse.json(
      { error: "Se requiere SUPABASE_SERVICE_ROLE_KEY para eliminar usuarios de autenticación." },
      { status: 500 }
    );
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Error al eliminar usuario" },
      { status: 500 }
    );
  }
}

