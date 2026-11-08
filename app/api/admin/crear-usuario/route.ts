import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

const DEFAULT_SUPABASE_URL = "https://sdbvsoklyuuaeaqksjkd.supabase.co";
const DEFAULT_SUPABASE_ANON_KEY = "sb_publishable_TbhqlbTXXbwf89J1W4SvuQ_lvUG0jvK";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, nombre_completo, rol, telefono } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: "Correo electrónico y contraseña son obligatorios." },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "La contraseña debe tener al menos 6 caracteres." },
        { status: 400 }
      );
    }

    const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || DEFAULT_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || DEFAULT_SUPABASE_ANON_KEY;
    const supabaseUrl = rawUrl.replace(/\/rest\/v1\/?$/, "").replace(/\/+$/, "");
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    // 1. Verificar autorización del usuario solicitante
    let callerUser = null;

    // Intentar por Bearer Token en header
    const authHeader = request.headers.get("Authorization");
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.replace("Bearer ", "");
      const checkClient = createSupabaseClient(supabaseUrl, supabaseAnonKey, {
        auth: { autoRefreshToken: false, persistSession: false },
      });
      const { data: tokenData } = await checkClient.auth.getUser(token);
      callerUser = tokenData?.user;
    }

    // Si no vino por Bearer, intentar por cookies de sesión
    let serverSupabase: any = null;
    if (!callerUser) {
      const cookieStore = await cookies();
      serverSupabase = createServerClient(supabaseUrl, supabaseAnonKey, {
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

    if (!callerUser) {
      return NextResponse.json(
        { error: "No autenticado. Por favor inicia sesión como administrador." },
        { status: 401 }
      );
    }

    // Verificar si es Super Admin (brayancamilo2407@gmail.com o rol admin/superadmin)
    const esMasterEmail = callerUser.email?.toLowerCase() === "brayancamilo2407@gmail.com";
    let esAdminDb = false;

    if (!esMasterEmail) {
      const checkSupabase = serverSupabase || createSupabaseClient(supabaseUrl, supabaseAnonKey, {
        auth: { autoRefreshToken: false, persistSession: false },
      });
      const { data: perfilCaller } = await checkSupabase
        .from("perfiles")
        .select("rol")
        .eq("id", callerUser.id)
        .single();

      if (perfilCaller?.rol === "admin" || perfilCaller?.rol === "superadmin") {
        esAdminDb = true;
      }
    }

    if (!esMasterEmail && !esAdminDb) {
      return NextResponse.json(
        { error: "Acceso denegado. Solo el Super Administrador puede crear usuarios locales." },
        { status: 403 }
      );
    }

    // 2. Crear usuario en Supabase Auth
    let newUserId: string | null = null;
    let newUserEmail: string | null = null;

    if (serviceRoleKey) {
      // Si está disponible el Service Role Key, creamos con email auto-confirmado
      const adminClient = createSupabaseClient(supabaseUrl, serviceRoleKey, {
        auth: { autoRefreshToken: false, persistSession: false },
      });

      const { data: adminNewUser, error: adminErr } = await adminClient.auth.admin.createUser({
        email: email.trim().toLowerCase(),
        password: password,
        email_confirm: true,
        user_metadata: {
          full_name: nombre_completo?.trim() || email.split("@")[0],
        },
      });

      if (adminErr) {
        return NextResponse.json({ error: adminErr.message }, { status: 400 });
      }

      newUserId = adminNewUser.user?.id || null;
      newUserEmail = adminNewUser.user?.email || null;

      // Actualizar perfil directamente con Service Role
      if (newUserId) {
        await adminClient.from("perfiles").upsert({
          id: newUserId,
          email: newUserEmail || email.trim().toLowerCase(),
          nombre_completo: nombre_completo?.trim() || email.split("@")[0],
          rol: rol || "paciente",
          telefono: telefono?.trim() || null,
          actualizado_en: new Date().toISOString(),
        });
      }
    } else {
      // Cliente temporal aislado con Anon Key (sin persistencia de sesión)
      const tempClient = createSupabaseClient(supabaseUrl, supabaseAnonKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
          detectSessionInUrl: false,
        },
      });

      const { data: createdData, error: signUpErr } = await tempClient.auth.signUp({
        email: email.trim().toLowerCase(),
        password: password,
        options: {
          data: {
            full_name: nombre_completo?.trim() || email.split("@")[0],
          },
        },
      });

      if (signUpErr) {
        if (signUpErr.message.toLowerCase().includes("rate limit")) {
          return NextResponse.json(
            {
              error:
                "Límite de correos de Supabase alcanzado. Ve a Supabase Dashboard ➔ Authentication ➔ Providers ➔ Email y desmarca la casilla 'Confirm email'.",
            },
            { status: 400 }
          );
        }
        return NextResponse.json({ error: signUpErr.message }, { status: 400 });
      }

      newUserId = createdData.user?.id || null;
      newUserEmail = createdData.user?.email || null;

      // Actualizar perfil usando la sesión del Super Admin
      if (newUserId && serverSupabase) {
        // Pequeño retardo para asegurar que el trigger on_auth_user_created haya corrido
        await new Promise((resolve) => setTimeout(resolve, 350));

        const { error: updateErr } = await serverSupabase
          .from("perfiles")
          .update({
            rol: rol || "paciente",
            telefono: telefono?.trim() || null,
            nombre_completo: nombre_completo?.trim() || email.split("@")[0],
            actualizado_en: new Date().toISOString(),
          })
          .eq("id", newUserId);

        // Si falló el update (por ejemplo si el trigger no creó la fila a tiempo), intentar upsert
        if (updateErr) {
          await serverSupabase.from("perfiles").upsert({
            id: newUserId,
            email: newUserEmail || email.trim().toLowerCase(),
            nombre_completo: nombre_completo?.trim() || email.split("@")[0],
            rol: rol || "paciente",
            telefono: telefono?.trim() || null,
            actualizado_en: new Date().toISOString(),
          });
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: "¡Usuario local creado exitosamente!",
      user: {
        id: newUserId,
        email: newUserEmail || email.trim().toLowerCase(),
        nombre_completo: nombre_completo?.trim() || email.split("@")[0],
        rol: rol || "paciente",
        telefono: telefono?.trim() || "",
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Error interno del servidor al crear usuario." },
      { status: 500 }
    );
  }
}

