import { NextResponse, type NextRequest } from "next/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

const DEFAULT_SUPABASE_URL = "https://sdbvsoklyuuaeaqksjkd.supabase.co";
const DEFAULT_SUPABASE_ANON_KEY = "sb_publishable_TbhqlbTXXbwf89J1W4SvuQ_lvUG0jvK";

// Caché en memoria como fallback si la tabla mensajes aún no ha sido creada en Supabase
const memoriaMensajes: Array<{
  id: string;
  remitente_id: string;
  destinatario_id: string;
  contenido: string;
  leido: boolean;
  creado_en: string;
}> = [];

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const usuarioId = searchParams.get("usuario_id");
    const contactoId = searchParams.get("contacto_id");

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

    try {
      let query = client.from("mensajes").select("*").order("creado_en", { ascending: true });

      if (contactoId) {
        query = query.or(
          `and(remitente_id.eq.${usuarioId},destinatario_id.eq.${contactoId}),and(remitente_id.eq.${contactoId},destinatario_id.eq.${usuarioId})`
        );
      } else {
        query = query.or(`remitente_id.eq.${usuarioId},destinatario_id.eq.${usuarioId}`);
      }

      const { data, error } = await query;
      if (!error && data) {
        return NextResponse.json({ success: true, mensajes: data });
      }
    } catch {
      // Si la tabla aún no existe en Supabase, responder con el buffer en memoria
    }

    // Filtrar desde memoria
    const filtrados = memoriaMensajes.filter((m) => {
      if (contactoId) {
        return (
          (m.remitente_id === usuarioId && m.destinatario_id === contactoId) ||
          (m.remitente_id === contactoId && m.destinatario_id === usuarioId)
        );
      }
      return m.remitente_id === usuarioId || m.destinatario_id === usuarioId;
    });

    return NextResponse.json({ success: true, mensajes: filtrados });
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
    const { remitente_id, destinatario_id, contenido } = body;

    if (!remitente_id || !destinatario_id || !contenido?.trim()) {
      return NextResponse.json(
        { error: "remitente_id, destinatario_id y contenido son obligatorios." },
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

    const nuevoMensaje = {
      remitente_id,
      destinatario_id,
      contenido: contenido.trim(),
      leido: false,
      creado_en: new Date().toISOString(),
    };

    try {
      const { data, error } = await client
        .from("mensajes")
        .insert(nuevoMensaje)
        .select()
        .single();

      if (!error && data) {
        return NextResponse.json({ success: true, mensaje: data });
      }
    } catch {
      // Fallback memoria
    }

    const mensajeMemoria = {
      id: "msg-" + Date.now() + "-" + Math.random().toString(36).substring(2, 7),
      ...nuevoMensaje,
    };
    memoriaMensajes.push(mensajeMemoria);

    return NextResponse.json({ success: true, mensaje: mensajeMemoria });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Error al enviar mensaje." },
      { status: 500 }
    );
  }
}
