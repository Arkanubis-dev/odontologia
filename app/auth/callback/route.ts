import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = requestUrl.searchParams.get("next") ?? "/portal";

  // Determinar la URL base pública real.
  // En Vercel / producción, request.url suele resolver a localhost internamente,
  // por lo que debemos usar x-forwarded-host o el dominio oficial en producción.
  const forwardedHost = request.headers.get("x-forwarded-host");
  const forwardedProto = request.headers.get("x-forwarded-proto") || "https";
  const isDev = process.env.NODE_ENV === "development";

  let baseUrl = "https://psicologia-aleja.vercel.app";
  if (isDev && requestUrl.origin.includes("localhost")) {
    baseUrl = requestUrl.origin;
  } else if (forwardedHost) {
    baseUrl = `${forwardedProto}://${forwardedHost}`;
  }

  // Asegurar que no tenga barra al final
  baseUrl = baseUrl.replace(/\/+$/, "");

  if (code) {
    const supabase = await createClient();
    if (supabase) {
      const { data, error } = await supabase.auth.exchangeCodeForSession(code);
      if (!error && data.user) {
        // Redirigir a panel de psicóloga / admin si corresponde
        const { data: perfil } = await supabase
          .from("perfiles")
          .select("rol")
          .eq("id", data.user.id)
          .single();

        if (
          perfil?.rol === "psicologo" ||
          perfil?.rol === "admin" ||
          perfil?.rol === "superadmin" ||
          data.user.email?.toLowerCase() === "brayancamilo2407@gmail.com" ||
          data.user.email?.toLowerCase().includes("alejandra") ||
          data.user.email?.toLowerCase().includes("admin")
        ) {
          return NextResponse.redirect(`${baseUrl}/admin`);
        }

        return NextResponse.redirect(`${baseUrl}${next}`);
      }
    }
  }

  // Si hubo error o no hay código, redirigir al login con mensaje
  return NextResponse.redirect(`${baseUrl}/login?error=auth_failed`);
}
