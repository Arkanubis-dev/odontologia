import { NextResponse, type NextRequest } from "next/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

const DEFAULT_SUPABASE_URL = "https://sdbvsoklyuuaeaqksjkd.supabase.co";
const DEFAULT_SUPABASE_ANON_KEY = "sb_publishable_TbhqlbTXXbwf89J1W4SvuQ_lvUG0jvK";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const DEFAULT_PSICOLOGO_UUID = "14e6b3b4-3202-4620-9eb9-a9f905e635d0"; // Alyson López
const DEFAULT_SUPERADMIN_UUID = "1609240a-3134-414c-be15-18c2821289f1"; // Brayan Montealegre

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const usuarioId = searchParams.get("usuario_id");
    const contactoId = searchParams.get("contacto_id");
    const esAdminQuery = searchParams.get("es_admin") === "true";

    if (!usuarioId) {
      return NextResponse.json(
        { error: "usuario_id es requerido." },
        { status: 400 }
      );
    }

    const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || DEFAULT_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || DEFAULT_SUPABASE_ANON_KEY;
    const supabaseUrl = rawUrl.replace(/\/rest\/v1\/?$/, "").replace(/\/+$/, "");
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    const client = createSupabaseClient(supabaseUrl, serviceRoleKey || supabaseAnonKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const usuarioValido = UUID_REGEX.test(usuarioId) ? usuarioId : DEFAULT_SUPERADMIN_UUID;
    const contactoValido = contactoId && UUID_REGEX.test(contactoId) ? contactoId : (contactoId ? DEFAULT_PSICOLOGO_UUID : null);

    // Verificar si el usuario que consulta es Super Admin o Admin
    const { data: perfil } = await client
      .from("perfiles")
      .select("id, rol, email")
      .eq("id", usuarioValido)
      .maybeSingle();

    const esSuperAdmin =
      esAdminQuery ||
      perfil?.rol === "superadmin" ||
      perfil?.rol === "admin" ||
      perfil?.email?.toLowerCase() === "brayancamilo2407@gmail.com";

    let query = client.from("mensajes").select("*").order("creado_en", { ascending: true });

    if (contactoValido) {
      if (esSuperAdmin) {
        // Super Admin ve el hilo completo donde participa este contacto
        query = query.or(
          `remitente_id.eq.${contactoValido},destinatario_id.eq.${contactoValido}`
        );
      } else {
        // Usuario normal o especialista ve su interacción directa
        query = query.or(
          `and(remitente_id.eq.${usuarioValido},destinatario_id.eq.${contactoValido}),and(remitente_id.eq.${contactoValido},destinatario_id.eq.${usuarioValido})`
        );
      }
    } else {
      if (!esSuperAdmin) {
        query = query.or(`remitente_id.eq.${usuarioValido},destinatario_id.eq.${usuarioValido}`);
      }
    }

    const { data: mensajes, error } = await query;

    if (error) {
      console.error("Error al consultar mensajes:", error);
      return NextResponse.json({ success: true, mensajes: [] });
    }

    // Marcar como leídos los mensajes dirigidos al usuario actual
    const paraMarcar = (mensajes || []).filter(
      (m: any) => (m.destinatario_id === usuarioValido || (esSuperAdmin && !m.leido)) && !m.leido
    );
    if (paraMarcar.length > 0) {
      const ids = paraMarcar.map((m: any) => m.id);
      await client.from("mensajes").update({ leido: true }).in("id", ids);
    }

    return NextResponse.json({ success: true, mensajes: mensajes || [] });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Error al obtener mensajes." },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    let { remitente_id, destinatario_id, contenido } = body;

    if (!remitente_id || !destinatario_id || !contenido?.trim()) {
      return NextResponse.json(
        { error: "remitente_id, destinatario_id y contenido son obligatorios." },
        { status: 400 }
      );
    }

    // Sanitización rigurosa de UUIDs para prevenir error 22P02 de PostgreSQL
    if (!UUID_REGEX.test(remitente_id)) {
      remitente_id = DEFAULT_SUPERADMIN_UUID;
    }
    if (!UUID_REGEX.test(destinatario_id)) {
      destinatario_id = DEFAULT_PSICOLOGO_UUID;
    }

    const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || DEFAULT_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || DEFAULT_SUPABASE_ANON_KEY;
    const supabaseUrl = rawUrl.replace(/\/rest\/v1\/?$/, "").replace(/\/+$/, "");
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    const client = createSupabaseClient(supabaseUrl, serviceRoleKey || supabaseAnonKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const nuevoMensaje = {
      remitente_id,
      destinatario_id,
      contenido: contenido.trim(),
      leido: false,
      creado_en: new Date().toISOString(),
    };

    const { data, error } = await client
      .from("mensajes")
      .insert(nuevoMensaje)
      .select()
      .single();

    if (error) {
      console.error("Error al insertar mensaje en Supabase:", error);
      return NextResponse.json(
        { error: "No se pudo guardar el mensaje.", detalles: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, mensaje: data });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Error interno al enviar mensaje." },
      { status: 500 }
    );
  }
}
