import { NextResponse, type NextRequest } from "next/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { generarEnlaceMeet } from "@/lib/utils/meet";

const DEFAULT_SUPABASE_URL = "https://sdbvsoklyuuaeaqksjkd.supabase.co";
const DEFAULT_SUPABASE_ANON_KEY = "sb_publishable_TbhqlbTXXbwf89J1W4SvuQ_lvUG0jvK";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { fecha_hora, estado, modalidad, generar_nuevo_meet, enlace_reunion, notas_paciente } = body;

    const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || DEFAULT_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || DEFAULT_SUPABASE_ANON_KEY;
    const supabaseUrl = rawUrl.replace(/\/rest\/v1\/?$/, "").replace(/\/+$/, "");
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    const client = createSupabaseClient(supabaseUrl, serviceRoleKey || supabaseAnonKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const updateData: any = {};
    if (fecha_hora) updateData.fecha_hora = fecha_hora;
    if (estado) updateData.estado = estado;
    if (modalidad) updateData.modalidad = modalidad;
    if (notas_paciente !== undefined) updateData.notas_paciente = notas_paciente;

    if (generar_nuevo_meet) {
      updateData.enlace_reunion = generarEnlaceMeet();
    } else if (enlace_reunion !== undefined) {
      updateData.enlace_reunion = enlace_reunion;
    }

    const { data: citaActualizada, error } = await client
      .from("citas")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, cita: citaActualizada });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Error al actualizar cita" },
      { status: 500 }
    );
  }
}

