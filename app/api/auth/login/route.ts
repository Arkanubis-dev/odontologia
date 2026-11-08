import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

const DEFAULT_SUPABASE_URL = "https://sdbvsoklyuuaeaqksjkd.supabase.co";
const DEFAULT_SUPABASE_ANON_KEY = "sb_publishable_TbhqlbTXXbwf89J1W4SvuQ_lvUG0jvK";

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Correo electrónico y contraseña son obligatorios." },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();
    const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || DEFAULT_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || DEFAULT_SUPABASE_ANON_KEY;
    const supabaseUrl = rawUrl.replace(/\/rest\/v1\/?$/, "").replace(/\/+$/, "");
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    // Cliente administrativo (para auto-confirmar correos y asegurar perfiles sin bloqueos)
    const adminClient = serviceRoleKey
      ? createSupabaseClient(supabaseUrl, serviceRoleKey, {
          auth: { autoRefreshToken: false, persistSession: false },
        })
      : null;

    const cookieStore = await cookies();
    const serverSupabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        },
      },
    });

    let { data: signInData, error: signInError } =
      await serverSupabase.auth.signInWithPassword({
        email: cleanEmail,
        password,
      });

    // Si Supabase devuelve que el correo no ha sido confirmado, auto-confirmarlo con Service Role
    if (
      signInError &&
      signInError.message.toLowerCase().includes("not confirmed") &&
      adminClient
    ) {
      const { data: usersList } = await adminClient.auth.admin.listUsers();
      const targetUser = usersList?.users?.find(
        (u) => u.email?.toLowerCase() === cleanEmail
      );
      if (targetUser) {
        await adminClient.auth.admin.updateUserById(targetUser.id, {
          email_confirm: true,
        });

        // Reintentar inicio de sesión
        const retry = await serverSupabase.auth.signInWithPassword({
          email: cleanEmail,
          password,
        });
        signInData = retry.data;
        signInError = retry.error;
      }
    }

    if (signInError || !signInData?.user) {
      let mensajeAmigable = "Correo o contraseña incorrectos.";
      if (signInError?.message.toLowerCase().includes("invalid login credentials")) {
        mensajeAmigable = "Credenciales incorrectas. Verifica tu correo y contraseña.";
      } else if (signInError?.message) {
        mensajeAmigable = signInError.message;
      }
      return NextResponse.json({ error: mensajeAmigable }, { status: 401 });
    }

    const user = signInData.user;

    // Asegurar que exista el perfil en la tabla 'perfiles'
    let userRole = "paciente";
    if (adminClient) {
      const { data: perfil } = await adminClient
        .from("perfiles")
        .select("rol, nombre_completo")
        .eq("id", user.id)
        .maybeSingle();

      if (!perfil) {
        const isMaster = cleanEmail === "brayancamilo2407@gmail.com";
        const isAleja = cleanEmail.includes("alejandra") || cleanEmail.includes("alyson");
        const defaultRole = isMaster ? "superadmin" : isAleja ? "psicologo" : "paciente";
        const fullName =
          user.user_metadata?.full_name ||
          user.user_metadata?.name ||
          cleanEmail.split("@")[0];

        await adminClient.from("perfiles").upsert({
          id: user.id,
          email: cleanEmail,
          nombre_completo: fullName,
          rol: defaultRole,
          actualizado_en: new Date().toISOString(),
        });
        userRole = defaultRole;
      } else {
        userRole = perfil.rol;
      }
    }

    const esAdmin =
      userRole === "psicologo" ||
      userRole === "admin" ||
      userRole === "superadmin" ||
      cleanEmail === "brayancamilo2407@gmail.com" ||
      cleanEmail.includes("alejandra") ||
      cleanEmail.includes("alyson") ||
      cleanEmail.includes("admin");

    const redirectTo = esAdmin ? "/admin" : "/portal";

    return NextResponse.json({
      success: true,
      redirectTo,
      session: {
        access_token: signInData.session?.access_token,
        refresh_token: signInData.session?.refresh_token,
      },
      user: {
        id: user.id,
        email: user.email,
        rol: userRole,
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Error al procesar el inicio de sesión." },
      { status: 500 }
    );
  }
}

