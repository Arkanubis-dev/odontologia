import { NextResponse, type NextRequest } from "next/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

const DEFAULT_SUPABASE_URL = "https://sdbvsoklyuuaeaqksjkd.supabase.co";
const DEFAULT_SUPABASE_ANON_KEY = "sb_publishable_TbhqlbTXXbwf89J1W4SvuQ_lvUG0jvK";

export async function GET(request: NextRequest) {
  try {
    const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || DEFAULT_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || DEFAULT_SUPABASE_ANON_KEY;
    const supabaseUrl = rawUrl.replace(/\/rest\/v1\/?$/, "").replace(/\/+$/, "");
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    const client = createSupabaseClient(supabaseUrl, serviceRoleKey || supabaseAnonKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { searchParams } = new URL(request.url);
    const pacienteId = searchParams.get("paciente_id");
    const todas = searchParams.get("todas") === "true" || searchParams.get("admin") === "true";

    let query = client
      .from("calificaciones")
      .select("*")
      .order("creado_en", { ascending: false });

    if (pacienteId) {
      query = query.eq("paciente_id", pacienteId);
    } else if (!todas) {
      query = query.eq("es_publico", true).limit(9);
    }

    const { data, error } = await query;
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(data || []);
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Error al obtener calificaciones." },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { cita_id, paciente_id, estrellas, comentario, nombre_mostrar } = body;

    if (!cita_id || !estrellas) {
      return NextResponse.json(
        { error: "cita_id y estrellas son obligatorios." },
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

    // Verificar si ya existe calificación para esta cita
    const { data: existing } = await client
      .from("calificaciones")
      .select("id")
      .eq("cita_id", cita_id)
      .maybeSingle();

    let result;
    if (existing) {
      result = await client
        .from("calificaciones")
        .update({
          estrellas: Number(estrellas),
          comentario: comentario?.trim() || "",
          nombre_mostrar: nombre_mostrar?.trim() || "Consultante",
          es_publico: true,
        })
        .eq("id", existing.id)
        .select()
        .single();
    } else {
      result = await client
        .from("calificaciones")
        .insert({
          cita_id,
          paciente_id,
          estrellas: Number(estrellas),
          comentario: comentario?.trim() || "",
          nombre_mostrar: nombre_mostrar?.trim() || "Consultante",
          servicio: "Sesión Terapéutica",
          es_publico: true,
        })
        .select()
        .single();
    }

    if (result.error) {
      return NextResponse.json({ error: result.error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, calificacion: result.data });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Error al guardar calificación." },
      { status: 500 }
    );
  }
}

