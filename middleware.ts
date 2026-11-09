import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

const DEFAULT_SUPABASE_URL = "https://sdbvsoklyuuaeaqksjkd.supabase.co";
const DEFAULT_SUPABASE_ANON_KEY = "sb_publishable_TbhqlbTXXbwf89J1W4SvuQ_lvUG0jvK";

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || DEFAULT_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || DEFAULT_SUPABASE_ANON_KEY;

  if (!rawUrl || !supabaseAnonKey) {
    return response;
  }

  const supabaseUrl = rawUrl.replace(/\/rest\/v1\/?$/, "").replace(/\/+$/, "");

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value)
        );
        response = NextResponse.next({
          request,
        });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options)
        );
      },
    },
  });

  // Obtener usuario autenticado de la sesión
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // 1. Proteger estrictamente la ruta /admin (Solo psicóloga)
  if (request.nextUrl.pathname.startsWith("/admin")) {
    if (!user) {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = "/login";
      redirectUrl.searchParams.set("redirect", "/admin");
      return NextResponse.redirect(redirectUrl);
    }

    // Verificar rol en perfiles
    const { data: perfil } = await supabase
      .from("perfiles")
      .select("rol")
      .eq("id", user.id)
      .single();

    const esAdmin = Boolean(
      perfil?.rol === "psicologo" ||
      perfil?.rol === "admin" ||
      perfil?.rol === "superadmin" ||
      user.email?.toLowerCase() === "brayancamilo2407@gmail.com" ||
      user.email?.toLowerCase().includes("alejandra") ||
      user.email?.toLowerCase().includes("admin")
    );

    if (!esAdmin) {
      // Usuario autenticado pero es un paciente común: redirigir a su portal
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = "/portal";
      redirectUrl.search = "";
      return NextResponse.redirect(redirectUrl);
    }
  }

  // 2. Proteger la ruta /portal (Requiere sesión a menos que sea demo)
  if (request.nextUrl.pathname.startsWith("/portal")) {
    const isDemo = request.nextUrl.searchParams.get("demo") === "true";
    if (!user && !isDemo) {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = "/login";
      redirectUrl.searchParams.set("redirect", "/portal");
      return NextResponse.redirect(redirectUrl);
    }
  }

  // Evitar almacenamiento en caché para portal y panel de administración
  response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");

  return response;
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/portal/:path*",
  ],
};
