import { NextResponse, type NextRequest } from "next/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { generarEnlaceMeet } from "@/lib/utils/meet";

const DEFAULT_SUPABASE_URL = "https://sdbvsoklyuuaeaqksjkd.supabase.co";
const DEFAULT_SUPABASE_ANON_KEY = "sb_publishable_TbhqlbTXXbwf89J1W4SvuQ_lvUG0jvK";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { paciente_id, fecha_hora, modalidad, notas_paciente, psicologo_id } = body;

    if (!paciente_id || !fecha_hora) {
      return NextResponse.json(
        { error: "paciente_id y fecha_hora son obligatorios" },
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

    // Obtener o generar enlace de Google Meet si es modalidad virtual
    const esVirtual = modalidad !== "presencial";
    let enlace_reunion: string | null = null;

    if (esVirtual) {
      // 1. Revisar si el especialista tiene configurada su sala oficial de Google Meet
      if (psicologo_id) {
        try {
          const { data: perfilPsico } = await client
            .from("perfiles")
            .select("disponibilidad")
            .eq("id", psicologo_id)
            .single();

          if (perfilPsico?.disponibilidad?.enlace_meet_personal) {
            enlace_reunion = perfilPsico.disponibilidad.enlace_meet_personal;
          }
        } catch {}
      }

      // 2. Si no tiene sala permanente configurada, generar un enlace de Google Meet
      if (!enlace_reunion) {
        enlace_reunion = generarEnlaceMeet();
      }
    }

    // Intentar insertar con psicologo_id
    const payloadConPsico: any = {
      paciente_id,
      fecha_hora,
      modalidad: esVirtual ? "virtual" : "presencial",
      enlace_reunion,
      estado: "confirmada",
      notas_paciente: notas_paciente || null,
      psicologo_id: psicologo_id || null,
    };

    let { data: citaData, error: insertError } = await client
      .from("citas")
      .insert(payloadConPsico)
      .select()
      .single();

    // Si falló porque la columna psicologo_id no existe en la base de datos, reintentar sin ella
    if (insertError && insertError.message.includes("psicologo_id")) {
      const { psicologo_id: _, ...payloadSinPsico } = payloadConPsico;
      const resFallback = await client
        .from("citas")
        .insert(payloadSinPsico)
        .select()
        .single();

      if (resFallback.error) throw resFallback.error;
      citaData = resFallback.data;
    } else if (insertError) {
      throw insertError;
    }

    return NextResponse.json({
      success: true,
      cita: {
        ...citaData,
        psicologo_id: psicologo_id || null,
        enlace_reunion,
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Error al registrar cita" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || DEFAULT_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || DEFAULT_SUPABASE_ANON_KEY;
    const supabaseUrl = rawUrl.replace(/\/rest\/v1\/?$/, "").replace(/\/+$/, "");
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    const client = createSupabaseClient(supabaseUrl, serviceRoleKey || supabaseAnonKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { data: citas, error } = await client
      .from("citas")
      .select("*")
      .order("fecha_hora", { ascending: false });

    if (error) throw error;

    return NextResponse.json({ success: true, citas: citas || [] });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Error al obtener citas" },
      { status: 500 }
    );
  }
}

