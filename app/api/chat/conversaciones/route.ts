import { NextResponse, type NextRequest } from "next/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

const DEFAULT_SUPABASE_URL = "https://sdbvsoklyuuaeaqksjkd.supabase.co";
const DEFAULT_SUPABASE_ANON_KEY = "sb_publishable_TbhqlbTXXbwf89J1W4SvuQ_lvUG0jvK";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const usuarioId = searchParams.get("usuario_id");
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

    // Conectar con service role key para acceso completo
    const client = createSupabaseClient(supabaseUrl, serviceRoleKey || supabaseAnonKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // 1. Obtener perfil del solicitante para verificar si es Super Admin
    const { data: perfilUsuario } = await client
      .from("perfiles")
      .select("id, rol, email")
      .eq("id", usuarioId)
      .maybeSingle();

    const esSuperAdmin =
      esAdminQuery ||
      perfilUsuario?.rol === "superadmin" ||
      perfilUsuario?.rol === "admin" ||
      perfilUsuario?.email?.toLowerCase() === "brayancamilo2407@gmail.com";

    // 2. Obtener lista de perfiles para enriquecer
    const { data: perfiles } = await client
      .from("perfiles")
      .select("id, nombre_completo, email, rol, avatar_url, disponibilidad");

    const mapaPerfiles: Record<string, any> = {};
    (perfiles || []).forEach((p: any) => {
      mapaPerfiles[p.id] = p;
    });

    // 3. Obtener mensajes según el rol
    let query = client.from("mensajes").select("*").order("creado_en", { ascending: false });

    if (!esSuperAdmin) {
      // Usuario normal o psicóloga ve solo los mensajes en que participa directamente
      query = query.or(`remitente_id.eq.${usuarioId},destinatario_id.eq.${usuarioId}`);
    }

    const { data: mensajes, error: msgError } = await query;

    if (msgError) {
      console.error("Error al obtener mensajes en conversaciones:", msgError);
      return NextResponse.json({ success: true, conversaciones: [] });
    }

    // 4. Agrupar por contacto
    const contactosMap: Record<
      string,
      {
        contacto: any;
        ultimo_mensaje: any;
        no_leidos: number;
        especialista?: any;
      }
    > = {};

    (mensajes || []).forEach((msg: any) => {
      let otroId: string;
      let especialistaAsociado: any = null;

      if (esSuperAdmin) {
        // En vista Super Admin: si el mensaje involucra a un paciente, el contacto es el paciente
        const remitente = mapaPerfiles[msg.remitente_id];
        const destinatario = mapaPerfiles[msg.destinatario_id];

        if (remitente?.rol === "paciente" && destinatario?.rol !== "paciente") {
          otroId = msg.remitente_id;
          especialistaAsociado = destinatario;
        } else if (destinatario?.rol === "paciente" && remitente?.rol !== "paciente") {
          otroId = msg.destinatario_id;
          especialistaAsociado = remitente;
        } else {
          // Si ambos son del equipo o ambos son pacientes
          otroId = msg.remitente_id === usuarioId ? msg.destinatario_id : msg.remitente_id;
          especialistaAsociado = mapaPerfiles[msg.remitente_id === usuarioId ? msg.destinatario_id : msg.remitente_id];
        }
      } else {
        otroId = msg.remitente_id === usuarioId ? msg.destinatario_id : msg.remitente_id;
      }

      if (!otroId) return;

      const otroPerfil = mapaPerfiles[otroId] || {
        id: otroId,
        nombre_completo: otroId.startsWith("14e6b") ? "Alyson López Sánchez" : "Consultante",
        email: otroId.startsWith("14e6b") ? "alysonlopezsanchez@gmail.com" : "consultante@plataforma.com",
        rol: otroId.startsWith("14e6b") ? "psicologo" : "paciente",
      };

      if (!contactosMap[otroId]) {
        contactosMap[otroId] = {
          contacto: otroPerfil,
          ultimo_mensaje: msg,
          no_leidos: !msg.leido && msg.destinatario_id === usuarioId ? 1 : 0,
          especialista: especialistaAsociado,
        };
      } else if (!msg.leido && msg.destinatario_id === usuarioId) {
        contactosMap[otroId].no_leidos += 1;
      }
    });

    const conversaciones = Object.values(contactosMap);

    return NextResponse.json({ success: true, conversaciones, es_superadmin: esSuperAdmin });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Error al obtener conversaciones." },
      { status: 500 }
    );
  }
}
