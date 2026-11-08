import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/portal";

  if (code) {
    const supabase = await createClient();
    if (supabase) {
      const { data, error } = await supabase.auth.exchangeCodeForSession(code);
      if (!error && data.user) {
        // Redirigir a panel de psicóloga si corresponde
        const { data: perfil } = await supabase
          .from("perfiles")
          .select("rol")
          .eq("id", data.user.id)
          .single();

        if (
          perfil?.rol === "psicologo" ||
          data.user.email?.toLowerCase().includes("alejandra") ||
          data.user.email?.toLowerCase().includes("admin")
        ) {
          return NextResponse.redirect(`${origin}/admin`);
        }

        return NextResponse.redirect(`${origin}${next}`);
      }
    }
  }

  // Si hubo error o no hay código, redirigir al login con mensaje
  return NextResponse.redirect(`${origin}/login?error=auth_failed`);
}

