import { NextResponse, type NextRequest } from "next/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

const DEFAULT_SUPABASE_URL = "https://sdbvsoklyuuaeaqksjkd.supabase.co";
const DEFAULT_SUPABASE_ANON_KEY = "sb_publishable_TbhqlbTXXbwf89J1W4SvuQ_lvUG0jvK";

export async function POST(request: NextRequest) {
  try {
    const { email, password, full_name } = await request.json();

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

    if (serviceRoleKey) {
      const adminClient = createSupabaseClient(supabaseUrl, serviceRoleKey, {
        auth: { autoRefreshToken: false, persistSession: false },
      });

      const { data: newUser, error: createError } = await adminClient.auth.admin.createUser({
        email: email.trim().toLowerCase(),
        password,
        email_confirm: true,
        user_metadata: {
          full_name: full_name || email.split("@")[0],
          rol: "paciente",
        },
      });

      if (createError) {
        if (createError.message.toLowerCase().includes("already")) {
          return NextResponse.json(
            { error: "Ya existe una cuenta con este correo electrónico. Por favor inicia sesión." },
            { status: 400 }
          );
        }
        return NextResponse.json({ error: createError.message }, { status: 400 });
      }

      // Asegurar perfil
      if (newUser?.user?.id) {
        await adminClient.from("perfiles").upsert({
          id: newUser.user.id,
          email: email.trim().toLowerCase(),
          nombre_completo: full_name || email.split("@")[0],
          rol: "paciente",
          actualizado_en: new Date().toISOString(),
        });
      }

      return NextResponse.json({ success: true, user: newUser.user });
    }

    // Fallback con Anon Key
    const tempClient = createSupabaseClient(supabaseUrl, supabaseAnonKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { data: signUpData, error: signUpError } = await tempClient.auth.signUp({
      email: email.trim().toLowerCase(),
      password,
      options: {
        data: {
          full_name: full_name || email.split("@")[0],
        },
      },
    });

    if (signUpError) {
      return NextResponse.json({ error: signUpError.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, user: signUpData.user });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Error al registrar usuario." },
      { status: 500 }
    );
  }
}
