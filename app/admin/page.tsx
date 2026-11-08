"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Brain,
  Calendar,
  ClipboardList,
  Smile,
  Users,
  LogOut,
  Video,
  MapPin,
  CheckCircle2,
  Clock,
  Plus,
  Star,
  ShieldCheck,
  Search,
  Check,
  ArrowLeft,
  Sparkles,
  Phone,
  Mail,
  AlertCircle,
  Lock,
  Crown,
  UserCheck,
  User,
  UserPlus,
  Key,
  Eye,
  EyeOff,
  Copy,
  Trash2,
  CalendarDays,
  ExternalLink,
  Settings,
  RefreshCw,
  X,
  MessageSquare,
  Send,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface Perfil {
  id: string;
  email: string;
  nombre_completo?: string;
  avatar_url?: string;
  telefono?: string;
  rol: "paciente" | "psicologo" | "admin" | "superadmin";
  creado_en: string;
}

interface Cita {
  id: string;
  paciente_id: string;
  psicologo_id?: string;
  fecha_hora: string;
  modalidad: "virtual" | "presencial";
  enlace_reunion?: string;
  estado: "pendiente" | "confirmada" | "completada" | "cancelada" | "finalizado";
  notas_paciente?: string;
  paciente?: Perfil;
  psicologo?: Perfil;
}

interface Tarea {
  id: string;
  paciente_id: string;
  titulo: string;
  descripcion: string;
  fecha_limite?: string;
  completada: boolean;
  reflexion_paciente?: string;
  creado_en: string;
  paciente?: Perfil;
}

interface RegistroEmocional {
  id: string;
  paciente_id: string;
  nivel_animo: number;
  emocion_principal: string;
  notas: string;
  creado_en: string;
  paciente?: Perfil;
}

interface Calificacion {
  id: string;
  cita_id: string;
  paciente_id: string;
  estrellas: number;
  comentario: string;
  nombre_mostrar?: string;
  servicio?: string;
  creado_en: string;
}

function AdminContent() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [esPsicologa, setEsPsicologa] = useState(false);
  const [esSuperAdmin, setEsSuperAdmin] = useState(false);

  // Estados de datos
  const [citas, setCitas] = useState<Cita[]>([]);
  const [pacientes, setPacientes] = useState<Perfil[]>([]);
  const [tareas, setTareas] = useState<Tarea[]>([]);
  const [emocionales, setEmocionales] = useState<RegistroEmocional[]>([]);
  const [calificaciones, setCalificaciones] = useState<Calificacion[]>([]);

  // Pestaña activa
  const [tabActiva, setTabActiva] = useState<"citas" | "pacientes" | "tareas" | "calificaciones" | "roles" | "crear-usuario" | "emocional" | "chat">("citas");
  const [filtroCitas, setFiltroCitas] = useState<string>("todas");
  const [filtroPsicologo, setFiltroPsicologo] = useState<string>("todos");
  const [filtroPacienteEmocional, setFiltroPacienteEmocional] = useState<string>("todos");
  const [busqueda, setBusqueda] = useState<string>("");
  const [busquedaUsuarios, setBusquedaUsuarios] = useState<string>("");

  // Estados para Messenger / Chat en Panel de Psicóloga
  const [pacienteChatSeleccionado, setPacienteChatSeleccionado] = useState<Perfil | null>(null);
  const [mensajesChat, setMensajesChat] = useState<any[]>([]);
  const [conversacionesChat, setConversacionesChat] = useState<any[]>([]);
  const [textoMensajeChat, setTextoMensajeChat] = useState("");
  const [enviandoMensajeChat, setEnviandoMensajeChat] = useState(false);
  const [busquedaChat, setBusquedaChat] = useState("");

  // Perfil del usuario actual autenticado
  const [currentUserPerfil, setCurrentUserPerfil] = useState<Perfil | null>(null);

  // Modal para Reprogramar / Editar Cita
  const [citaParaReprogramar, setCitaParaReprogramar] = useState<Cita | null>(null);
  const [reprogramarFecha, setReprogramarFecha] = useState("");
  const [reprogramarHora, setReprogramarHora] = useState("");
  const [reprogramarEstado, setReprogramarEstado] = useState("");
  const [reprogramarEnlace, setReprogramarEnlace] = useState("");
  const [guardandoReprogramacion, setGuardandoReprogramacion] = useState(false);

  // Modal para Configuración de Disponibilidad y Horarios del Psicólogo
  const [mostrarModalDisponibilidad, setMostrarModalDisponibilidad] = useState(false);
  const [diasLaborales, setDiasLaborales] = useState<string[]>(["lunes", "martes", "miercoles", "jueves", "viernes"]);
  const [horaInicioLab, setHoraInicioLab] = useState("08:00");
  const [horaFinLab, setHoraFinLab] = useState("18:00");
  const [duracionLab, setDuracionLab] = useState(50);
  const [enlaceMeetPersonal, setEnlaceMeetPersonal] = useState("");
  const [guardandoDisponibilidad, setGuardandoDisponibilidad] = useState(false);

  // Estados para Creador de Usuarios Locales (Super Admin)
  const [formUsuario, setFormUsuario] = useState({
    nombre: "",
    email: "",
    password: "",
    rol: "paciente" as "paciente" | "psicologo" | "admin",
    telefono: "",
  });
  const [mostrarPassword, setMostrarPassword] = useState(false);
  const [creandoUsuario, setCreandoUsuario] = useState(false);
  const [usuarioCreadoResultado, setUsuarioCreadoResultado] = useState<{
    nombre: string;
    email: string;
    password: string;
    rol: string;
    telefono?: string;
  } | null>(null);
  const [credencialesCopiadas, setCredencialesCopiadas] = useState(false);

  // Modal para asignar nueva tarea terapéutica
  const [mostrarModalTarea, setMostrarModalTarea] = useState(false);
  const [pacienteSeleccionado, setPacienteSeleccionado] = useState<string>("");
  const [tituloTarea, setTituloTarea] = useState("");
  const [descripcionTarea, setDescripcionTarea] = useState("");
  const [fechaLimiteTarea, setFechaLimiteTarea] = useState("");
  const [guardandoTarea, setGuardandoTarea] = useState(false);

  // Modal para editar enlace de reunión
  const [citaParaEditar, setCitaParaEditar] = useState<Cita | null>(null);
  const [nuevoEnlace, setNuevoEnlace] = useState("");

  // Inicializar y cargar datos
  useEffect(() => {
    async function init() {
      const supabase = createClient();
      if (!supabase) {
        setLoading(false);
        return;
      }

      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        setLoading(false);
        setEsPsicologa(false);
        setEsSuperAdmin(false);
        router.replace("/login?redirect=/admin");
        return;
      }

      // Verificar rol en perfiles
      const { data: perfil } = await supabase
        .from("perfiles")
        .select("*")
        .eq("id", user.id)
        .single();

      // Verificar si es Super Admin (Camilo o rol admin/superadmin)
      const esSuper = Boolean(
        user.email?.toLowerCase() === "brayancamilo2407@gmail.com" ||
        perfil?.rol === "admin" ||
        perfil?.rol === "superadmin"
      );
      setEsSuperAdmin(esSuper);

      // Permitir acceso si es Super Admin, psicóloga, o correo autorizado
      const esAdmin = Boolean(
        esSuper ||
        perfil?.rol === "psicologo" ||
        user.email?.toLowerCase().includes("alejandra") ||
        user.email?.toLowerCase().includes("admin")
      );

      if (!esAdmin) {
        setLoading(false);
        setEsPsicologa(false);
        setEsSuperAdmin(false);
        router.replace("/portal");
        return;
      }

      setCurrentUser(user);
      setCurrentUserPerfil(perfil);
      setEsPsicologa(true);

      await recargarDatos(supabase);
      setLoading(false);
    }

    init();
  }, [router]);

  async function recargarDatos(supabase: any) {
    try {
      // 1. Cargar pacientes / usuarios desde API segura (consulta auth.users + perfiles)
      let listaPacientes: Perfil[] = [];
      try {
        const session = supabase ? (await supabase.auth.getSession()).data.session : null;
        const resUsers = await fetch("/api/admin/usuarios", {
          headers: {
            ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
          },
        });
        if (resUsers.ok) {
          const jsonUsers = await resUsers.json();
          if (jsonUsers.usuarios) {
            listaPacientes = jsonUsers.usuarios;
          }
        }
      } catch {
        // Fallback a consulta directa
      }

      if (listaPacientes.length === 0) {
        const { data: dataPacientes } = await supabase
          .from("perfiles")
          .select("*")
          .order("creado_en", { ascending: false });
        listaPacientes = dataPacientes || [];
      }

      // Deduplicar estrictamente por id para garantizar que ningún usuario aparezca doble
      const mapaUnicos = new Map<string, Perfil>();
      listaPacientes.forEach((p) => {
        if (p.id) mapaUnicos.set(p.id, p);
      });
      const pacientesUnicos = Array.from(mapaUnicos.values());

      setPacientes(pacientesUnicos);

      // Mapa de pacientes para asociar nombres rápidamente
      const mapaPacientes: Record<string, Perfil> = {};
      listaPacientes.forEach((p) => {
        mapaPacientes[p.id] = p;
      });

      // 2. Cargar citas con API robusta
      let rawCitas: any[] = [];
      try {
        const resCitas = await fetch("/api/citas");
        if (resCitas.ok) {
          const jsonCitas = await resCitas.json();
          if (jsonCitas.citas) rawCitas = jsonCitas.citas;
        }
      } catch {}

      if (rawCitas.length === 0) {
        const { data: dataCitas } = await supabase
          .from("citas")
          .select("*")
          .order("fecha_hora", { ascending: false });
        if (dataCitas) rawCitas = dataCitas;
      }

      setCitas(
        rawCitas.map((c: any) => ({
          ...c,
          paciente: mapaPacientes[c.paciente_id],
          psicologo: mapaPacientes[c.psicologo_id],
        }))
      );

      // 3. Cargar tareas terapéuticas
      const { data: dataTareas } = await supabase
        .from("tareas_terapia")
        .select("*")
        .order("creado_en", { ascending: false });

      if (dataTareas) {
        setTareas(
          dataTareas.map((t: any) => ({
            ...t,
            paciente: mapaPacientes[t.paciente_id],
          }))
        );
      }

      // 4. Cargar registros emocionales de consultantes (vía API con permisos de administración)
      let rawEmocionales: any[] = [];
      try {
        const session = supabase ? (await supabase.auth.getSession()).data.session : null;
        const resEmocional = await fetch("/api/admin/diario-emocional", {
          headers: {
            ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
          },
        });
        if (resEmocional.ok) {
          const jsonEmocional = await resEmocional.json();
          if (jsonEmocional.registros) rawEmocionales = jsonEmocional.registros;
        }
      } catch {}

      if (rawEmocionales.length === 0) {
        const { data: dataEmocionales } = await supabase
          .from("registro_emocional")
          .select("*")
          .order("creado_en", { ascending: false });

        if (dataEmocionales) {
          rawEmocionales = dataEmocionales.map((e: any) => ({
            ...e,
            paciente: mapaPacientes[e.paciente_id],
          }));
        }
      }

      setEmocionales(rawEmocionales);

      // 5. Cargar calificaciones reales
      try {
        const califRes = await fetch("/api/calificaciones?admin=true");
        if (califRes.ok) {
          const califData = await califRes.json();
          if (Array.isArray(califData)) {
            setCalificaciones(califData);
          }
        }
      } catch {
        const { data: dataCalificaciones } = await supabase
          .from("calificaciones")
          .select("*")
          .order("creado_en", { ascending: false });

        if (dataCalificaciones) {
          setCalificaciones(dataCalificaciones);
        }
      }
    } catch (err) {
      console.error("Error al cargar datos en panel de psicóloga:", err);
    }
  }

  // Heartbeat de presencia de especialista en línea
  useEffect(() => {
    if (!currentUser?.id) return;
    const reportarPresencia = async () => {
      try {
        const rolActual = esSuperAdmin ? "superadmin" : esPsicologa ? "psicologo" : "admin";
        await fetch("/api/chat/presencia", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ usuario_id: currentUser.id, rol: rolActual }),
        });
      } catch {}
    };

    reportarPresencia();
    const interval = setInterval(reportarPresencia, 30000);
    return () => clearInterval(interval);
  }, [currentUser?.id, esSuperAdmin, esPsicologa]);

  // Cargar lista de conversaciones activas e historial
  useEffect(() => {
    if (!currentUser?.id) return;

    const cargarConversaciones = async () => {
      try {
        const esAdminParam = esSuperAdmin ? "&es_admin=true" : "";
        const res = await fetch(`/api/chat/conversaciones?usuario_id=${currentUser.id}${esAdminParam}`, {
          cache: "no-store",
        });
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data.conversaciones)) {
            setConversacionesChat(data.conversaciones);
            // Si no hay paciente seleccionado, auto-seleccionar el que tenga mensaje más reciente
            setPacienteChatSeleccionado((actual) => {
              if (!actual && data.conversaciones.length > 0) {
                return data.conversaciones[0].contacto;
              }
              return actual;
            });
          }
        }
      } catch {}
    };

    cargarConversaciones();
    const interval = setInterval(cargarConversaciones, 2500);
    return () => clearInterval(interval);
  }, [currentUser?.id, esSuperAdmin]);

  // Cargar mensajes en tiempo real cuando se selecciona un paciente (polling rápido cada 2s)
  useEffect(() => {
    if (!pacienteChatSeleccionado?.id || !currentUser?.id) return;

    const cargarMensajesAdmin = async () => {
      try {
        const esAdminParam = esSuperAdmin ? "&es_admin=true" : "";
        const res = await fetch(
          `/api/chat/mensajes?usuario_id=${currentUser.id}&contacto_id=${pacienteChatSeleccionado.id}${esAdminParam}`,
          { cache: "no-store" }
        );
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data.mensajes)) {
            setMensajesChat(data.mensajes);
          }
        }
      } catch {}
    };

    cargarMensajesAdmin();
    const interval = setInterval(cargarMensajesAdmin, 2000);
    return () => clearInterval(interval);
  }, [pacienteChatSeleccionado?.id, currentUser?.id, esSuperAdmin]);

  // Enviar mensaje a paciente desde panel de especialista
  const handleEnviarMensajeAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!textoMensajeChat.trim() || !pacienteChatSeleccionado?.id || !currentUser?.id || enviandoMensajeChat) return;

    const contenido = textoMensajeChat.trim();
    setEnviandoMensajeChat(true);

    const tempMsg = {
      id: "temp-" + Date.now(),
      remitente_id: currentUser.id,
      destinatario_id: pacienteChatSeleccionado.id,
      contenido,
      leido: false,
      creado_en: new Date().toISOString(),
    };

    setMensajesChat((prev) => [...prev, tempMsg]);
    setTextoMensajeChat("");

    try {
      const res = await fetch("/api/chat/mensajes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          remitente_id: currentUser.id,
          destinatario_id: pacienteChatSeleccionado.id,
          contenido,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.mensaje) {
          setMensajesChat((prev) =>
            prev.map((m) => (m.id === tempMsg.id ? data.mensaje : m))
          );
        }
      }
    } catch (err) {
      console.error("Error al enviar mensaje:", err);
    } finally {
      setEnviandoMensajeChat(false);
    }
  };

  // Cambiar estado de una cita (Finalizar servicio para desbloquear calificación)
  const handleCambiarEstadoCita = async (
    citaId: string,
    nuevoEstado: "confirmada" | "finalizado" | "cancelada"
  ) => {
    const supabase = createClient();
    if (!supabase) return;

    try {
      const { error } = await supabase
        .from("citas")
        .update({ estado: nuevoEstado })
        .eq("id", citaId);

      if (error) throw error;

      // Actualizar estado local
      setCitas((prev) =>
        prev.map((c) => (c.id === citaId ? { ...c, estado: nuevoEstado } : c))
      );

      if (nuevoEstado === "finalizado") {
        alert(
          "¡Sesión marcada como FINALIZADA con éxito! Tu consultante ya tiene habilitado el botón para calificar de 1 a 5 estrellas."
        );
      }
    } catch (err: any) {
      alert("Error al actualizar estado de la cita: " + err.message);
    }
  };

  // Guardar enlace de reunión virtual
  const handleGuardarEnlace = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!citaParaEditar) return;

    const supabase = createClient();
    if (!supabase) return;

    try {
      const { error } = await supabase
        .from("citas")
        .update({ enlace_reunion: nuevoEnlace })
        .eq("id", citaParaEditar.id);

      if (error) throw error;

      setCitas((prev) =>
        prev.map((c) =>
          c.id === citaParaEditar.id ? { ...c, enlace_reunion: nuevoEnlace } : c
        )
      );

      setCitaParaEditar(null);
      setNuevoEnlace("");
    } catch (err: any) {
      alert("Error al guardar enlace: " + err.message);
    }
  };

  // Asignar nueva tarea terapéutica a un paciente
  const handleCrearTarea = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pacienteSeleccionado || !tituloTarea) {
      alert("Por favor selecciona un paciente y escribe el título de la tarea.");
      return;
    }

    setGuardandoTarea(true);
    const supabase = createClient();
    if (!supabase) {
      setGuardandoTarea(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("tareas_terapia")
        .insert({
          paciente_id: pacienteSeleccionado,
          titulo: tituloTarea,
          descripcion: descripcionTarea,
          fecha_limite: fechaLimiteTarea || null,
          completada: false,
        })
        .select()
        .single();

      if (error) throw error;

      // Asociar paciente
      const pacienteObj = pacientes.find((p) => p.id === pacienteSeleccionado);
      setTareas((prev) => [{ ...data, paciente: pacienteObj }, ...prev]);

      alert("¡Tarea terapéutica asignada al consultante exitosamente!");
      setMostrarModalTarea(false);
      setTituloTarea("");
      setDescripcionTarea("");
      setFechaLimiteTarea("");
      setPacienteSeleccionado("");
    } catch (err: any) {
      alert("Error al asignar tarea: " + err.message);
    } finally {
      setGuardandoTarea(false);
    }
  };

  // Cambiar rol de un usuario (Función exclusiva de Super Admin)
  const handleCambiarRol = async (
    usuarioId: string,
    nuevoRol: "paciente" | "psicologo" | "admin"
  ) => {
    try {
      const supabase = createClient();
      const session = supabase ? (await supabase.auth.getSession()).data.session : null;

      const res = await fetch("/api/admin/cambiar-rol", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
        },
        body: JSON.stringify({ usuarioId, nuevoRol }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "No se pudo actualizar el rol");

      setPacientes((prev) =>
        prev.map((p) => (p.id === usuarioId ? { ...p, rol: nuevoRol } : p))
      );

      const u = pacientes.find((p) => p.id === usuarioId);
      alert(
        `¡Rol actualizado con éxito! ${
          u?.nombre_completo || u?.email
        } ahora tiene el rol de: ${nuevoRol.toUpperCase()}`
      );
    } catch (err: any) {
      alert("Error al actualizar rol: " + err.message);
    }
  };

  // Generar contraseña segura aleatoria
  const generarPasswordSegura = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%";
    let pwd = "";
    for (let i = 0; i < 10; i++) {
      pwd += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormUsuario((prev) => ({ ...prev, password: pwd }));
    setMostrarPassword(true);
  };

  // Crear usuario local vía API endpoint (Exclusivo Super Admin)
  const handleCrearUsuarioLocal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formUsuario.email || !formUsuario.password) {
      alert("Por favor ingresa correo y contraseña.");
      return;
    }
    if (formUsuario.password.length < 6) {
      alert("La contraseña debe tener al menos 6 caracteres.");
      return;
    }

    setCreandoUsuario(true);
    setUsuarioCreadoResultado(null);

    try {
      const supabase = createClient();
      const session = supabase ? (await supabase.auth.getSession()).data.session : null;

      const res = await fetch("/api/admin/crear-usuario", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
        },
        body: JSON.stringify({
          email: formUsuario.email,
          password: formUsuario.password,
          nombre_completo: formUsuario.nombre,
          rol: formUsuario.rol,
          telefono: formUsuario.telefono,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "No se pudo crear el usuario");
      }

      setUsuarioCreadoResultado({
        nombre: formUsuario.nombre || formUsuario.email.split("@")[0],
        email: formUsuario.email,
        password: formUsuario.password,
        rol: formUsuario.rol,
        telefono: formUsuario.telefono,
      });

      // Recargar la lista de perfiles y pacientes en el panel
      if (supabase) {
        await recargarDatos(supabase);
      }

      // Limpiar campos del formulario
      setFormUsuario({
        nombre: "",
        email: "",
        password: "",
        rol: "paciente",
        telefono: "",
      });
    } catch (err: any) {
      alert("Error al crear usuario local: " + err.message);
    } finally {
      setCreandoUsuario(false);
    }
  };

  const handleCopiarCredenciales = () => {
    if (!usuarioCreadoResultado) return;
    const texto = `📋 Credenciales de Acceso - Dra. Alejandra Bedoya Psicología\n👤 Nombre: ${usuarioCreadoResultado.nombre}\n📧 Correo: ${usuarioCreadoResultado.email}\n🔑 Contraseña: ${usuarioCreadoResultado.password}\n🏷️ Rol: ${usuarioCreadoResultado.rol.toUpperCase()}\n🌐 Iniciar Sesión: https://psicologia-aleja.vercel.app/login`;
    navigator.clipboard.writeText(texto);
    setCredencialesCopiadas(true);
    setTimeout(() => setCredencialesCopiadas(false), 3000);
  };

  // Eliminar usuario permanentemente (Exclusivo Super Admin)
  const handleEliminarUsuario = async (usuarioId: string, nombreOEmail: string) => {
    if (
      !confirm(
        `¿Estás seguro de que deseas eliminar permanentemente a:\n"${nombreOEmail}"?\n\nEsta acción borrará su cuenta de acceso, su perfil y todas sus citas de forma irreversible.`
      )
    ) {
      return;
    }

    try {
      const supabase = createClient();
      const session = supabase ? (await supabase.auth.getSession()).data.session : null;

      const res = await fetch("/api/admin/eliminar-usuario", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
        },
        body: JSON.stringify({ usuarioId }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "No se pudo eliminar el usuario");

      setPacientes((prev) => prev.filter((p) => p.id !== usuarioId));
      alert("¡Usuario eliminado exitosamente del sistema!");
    } catch (err: any) {
      alert("Error al eliminar usuario: " + err.message);
    }
  };

  // Asignar o crear Google Meet real para una cita existente
  const handleGenerarMeet = async (citaId: string) => {
    let enlaceAUsar = enlaceMeetPersonal.trim();

    if (!enlaceAUsar && currentUser?.id) {
      try {
        const res = await fetch(`/api/admin/disponibilidad?psicologo_id=${currentUser.id}`);
        if (res.ok) {
          const json = await res.json();
          if (json.disponibilidad?.enlace_meet_personal) {
            enlaceAUsar = json.disponibilidad.enlace_meet_personal.trim();
            setEnlaceMeetPersonal(enlaceAUsar);
          }
        }
      } catch {}
    }

    if (enlaceAUsar) {
      try {
        const res = await fetch(`/api/citas/${citaId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ enlace_reunion: enlaceAUsar }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "No se pudo asignar el enlace Meet");

        setCitas((prev) =>
          prev.map((c) => (c.id === citaId ? { ...c, enlace_reunion: enlaceAUsar } : c))
        );
        alert("¡Tu sala oficial de Google Meet ha sido asignada a esta cita!");
        return;
      } catch (err: any) {
        alert("Error al asignar Meet: " + err.message);
        return;
      }
    }

    // Si aún no tiene sala permanente configurada, abrir modal para editar y ofrecer crear sala real
    const citaObj = citas.find((c) => c.id === citaId);
    if (citaObj) {
      setCitaParaEditar(citaObj);
      setNuevoEnlace("");
    }
  };

  // Guardar reprogramación o edición de cita
  const handleGuardarReprogramacion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!citaParaReprogramar) return;

    setGuardandoReprogramacion(true);
    try {
      let fechaFinal = citaParaReprogramar.fecha_hora;
      if (reprogramarFecha && reprogramarHora) {
        fechaFinal = new Date(`${reprogramarFecha}T${reprogramarHora}:00`).toISOString();
      }

      const res = await fetch(`/api/citas/${citaParaReprogramar.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fecha_hora: fechaFinal,
          estado: reprogramarEstado || citaParaReprogramar.estado,
          enlace_reunion: reprogramarEnlace,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "No se pudo actualizar la cita");

      setCitas((prev) =>
        prev.map((c) => (c.id === citaParaReprogramar.id ? { ...c, ...data.cita } : c))
      );
      setCitaParaReprogramar(null);
      alert("¡Cita reprogramada / actualizada exitosamente!");
    } catch (err: any) {
      alert("Error al actualizar cita: " + err.message);
    } finally {
      setGuardandoReprogramacion(false);
    }
  };

  // Cargar y abrir configuración de horarios y Google Meet del especialista
  const abrirModalDisponibilidad = async () => {
    if (currentUser?.id) {
      try {
        const res = await fetch(`/api/admin/disponibilidad?psicologo_id=${currentUser.id}`);
        if (res.ok) {
          const json = await res.json();
          if (json.disponibilidad) {
            if (json.disponibilidad.dias_laborales) setDiasLaborales(json.disponibilidad.dias_laborales);
            if (json.disponibilidad.hora_inicio) setHoraInicioLab(json.disponibilidad.hora_inicio);
            if (json.disponibilidad.hora_fin) setHoraFinLab(json.disponibilidad.hora_fin);
            if (json.disponibilidad.duracion_minutos) setDuracionLab(json.disponibilidad.duracion_minutos);
            if (json.disponibilidad.enlace_meet_personal) setEnlaceMeetPersonal(json.disponibilidad.enlace_meet_personal);
          }
        }
      } catch {}
    }
    setMostrarModalDisponibilidad(true);
  };

  // Guardar configuración de horarios de atención y Google Meet
  const handleGuardarDisponibilidad = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser?.id) return;

    setGuardandoDisponibilidad(true);
    try {
      const payload = {
        dias_laborales: diasLaborales,
        hora_inicio: horaInicioLab,
        hora_fin: horaFinLab,
        duracion_minutos: duracionLab,
        enlace_meet_personal: enlaceMeetPersonal.trim(),
      };

      const res = await fetch("/api/admin/disponibilidad", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          psicologo_id: currentUser.id,
          disponibilidad: payload,
        }),
      });

      if (!res.ok) throw new Error("No se pudo guardar la configuración");

      setMostrarModalDisponibilidad(false);
      alert("¡Configuración de disponibilidad y sala Google Meet guardada exitosamente!");
    } catch (err: any) {
      alert("Error al guardar: " + err.message);
    } finally {
      setGuardandoDisponibilidad(false);
    }
  };

  const handleCerrarSesion = async () => {
    const supabase = createClient();
    if (supabase) {
      await supabase.auth.signOut();
    }
    router.push("/login");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FBF8F1] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#468189] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm font-semibold text-[#031926]">
            Verificando credenciales de seguridad...
          </p>
        </div>
      </div>
    );
  }

  // BLOQUEO ABSOLUTO: Si no está autenticada o no tiene rol de psicóloga, NO renderizar el panel
  if (!currentUser || !esPsicologa) {
    return (
      <div className="min-h-screen bg-[#FBF8F1] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-rose-200 shadow-xl text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto shadow-xs">
            <Lock className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-[#031926]">Acceso Restringido</h2>
          <p className="text-xs text-[#031926]/70 leading-relaxed">
            Esta sección es confidencial y de uso exclusivo para la especialista <strong>Alejandra Bedoya</strong>. Se requiere autenticación autorizada para ingresar.
          </p>
          <div className="pt-2 flex flex-col gap-2">
            <Link
              href="/login"
              className="w-full py-2.5 px-4 rounded-xl bg-[#468189] hover:bg-[#031926] text-white font-semibold text-xs shadow-md transition"
            >
              Iniciar Sesión como Especialista
            </Link>
            <Link
              href="/"
              className="w-full py-2.5 px-4 rounded-xl border border-[#9DBEBB]/60 text-xs text-[#031926]/70 font-semibold hover:bg-[#FBF8F1] transition"
            >
              Volver a la Página Principal
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Nombre del usuario activo actual para saludo y encabezado dinámico
  const nombreActivo =
    currentUserPerfil?.nombre_completo ||
    currentUser?.user_metadata?.full_name ||
    currentUser?.email?.split("@")[0] ||
    (esSuperAdmin ? "Camilo" : "Especialista");

  // Lista de psicólogas registradas
  const psicologasRegistradas = pacientes.filter(
    (p) => p.rol === "psicologo" || p.email.toLowerCase().includes("alejandra")
  );

  // Citas filtradas por estado y por especialista
  const citasFiltradas = citas.filter((c) => {
    // Si NO es Super Admin, la especialista (ej: Alyson o Alejandra) SOLO ve sus propias citas o sin asignar
    if (!esSuperAdmin && currentUser?.id) {
      if (c.psicologo_id && c.psicologo_id !== currentUser.id) {
        return false;
      }
    } else if (esSuperAdmin && filtroPsicologo !== "todos") {
      if (c.psicologo_id !== filtroPsicologo) {
        return false;
      }
    }

    if (filtroCitas === "finalizadas") return c.estado === "finalizado" || c.estado === "completada";
    if (filtroCitas === "pendientes") return c.estado === "pendiente";
    if (filtroCitas === "confirmadas") return c.estado === "confirmada";
    return true;
  });

  const caritasInfo = [
    { nivel: 1, emoji: "😔", etiqueta: "Muy bajo" },
    { nivel: 2, emoji: "😐", etiqueta: "Bajo / Cansado" },
    { nivel: 3, emoji: "🙂", etiqueta: "Tranquilo" },
    { nivel: 4, emoji: "😊", etiqueta: "Bien" },
    { nivel: 5, emoji: "🌟", etiqueta: "Excelente" },
  ];

  const emocionalesFiltrados = emocionales.filter((e) => {
    if (filtroPacienteEmocional !== "todos" && e.paciente_id !== filtroPacienteEmocional) {
      return false;
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-[#FBF8F1] text-[#031926] font-sans selection:bg-[#9DBEBB]/40 selection:text-[#031926]">
      {/* 1. Header Superior del Panel de la Psicóloga */}
      <header className="border-b border-[#9DBEBB]/30 bg-white/95 backdrop-blur-md sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="w-11 h-11 rounded-2xl overflow-hidden border-2 border-[#77ACA2]/50 shadow-md shadow-[#468189]/20 shrink-0 bg-[#031926] text-white flex items-center justify-center font-bold text-sm">
                {currentUser?.email?.toLowerCase().includes("alejandra") ? (
                  <img
                    src="/alejandra-bedoya.jpg"
                    alt="Alejandra Bedoya"
                    className="w-full h-full object-cover object-top"
                  />
                ) : (
                  <span>{nombreActivo.charAt(0).toUpperCase()}</span>
                )}
              </div>
              <div>
                <h1 className="text-sm sm:text-base font-bold text-[#031926] leading-tight">
                  {nombreActivo}
                </h1>
                <div className="flex items-center gap-1.5 mt-0.5">
                  {esSuperAdmin ? (
                    <>
                      <Crown className="w-3.5 h-3.5 text-amber-500" />
                      <p className="text-[11px] text-[#468189] font-bold">
                        Super Administrador Master
                      </p>
                    </>
                  ) : (
                    <>
                      <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      <p className="text-[11px] text-[#468189] font-bold">
                        Panel Especialista en Psicología
                      </p>
                    </>
                  )}
                </div>
              </div>
            </Link>
          </div>

          <div className="flex items-center gap-3 sm:gap-4">
            <Link
              href="/portal"
              className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-[#031926]/80 hover:bg-[#9DBEBB]/20 border border-[#9DBEBB]/40 transition"
            >
              <span>Ver Portal Consultante</span>
            </Link>

            <button
              onClick={handleCerrarSesion}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-[#031926]/70 hover:text-rose-600 hover:bg-rose-50 border border-[#9DBEBB]/40 transition cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Cerrar Sesión</span>
            </button>
          </div>
        </div>
      </header>

      {/* 2. Contenedor Principal */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Banner de Bienvenida con Estadísticas en Rich Black (#031926) */}
        <div className="bg-[#031926] rounded-3xl p-6 sm:p-8 text-white shadow-xl shadow-[#031926]/10 border border-[#468189]/30">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
            <div className="space-y-1.5 max-w-xl">
              <span className="inline-block px-3 py-1 bg-[#468189]/40 backdrop-blur-md rounded-full text-xs font-semibold uppercase tracking-wider text-[#9DBEBB] border border-[#77ACA2]/30">
                {esSuperAdmin ? "👑 Modo Super Administrador" : "Panel Clínico • Especialista"}
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                Bienvenid@, {nombreActivo.split(" ")[0]} 👋
              </h2>
              <p className="text-[#9DBEBB] text-xs sm:text-sm leading-relaxed">
                {esSuperAdmin
                  ? "Panel de control maestro: supervisa citas de todos los especialistas, asigna roles y gestiona usuarios."
                  : `Hola ${nombreActivo}, aquí gestionas tus sesiones clínicas con tus pacientes, asignas tareas terapéuticas y programas tu disponibilidad.`}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <button
                onClick={abrirModalDisponibilidad}
                className="inline-flex items-center gap-2 px-4 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-extrabold text-xs sm:text-sm border border-white/20 transition cursor-pointer shrink-0"
              >
                <Settings className="w-4 h-4 text-[#9DBEBB]" />
                <span>Mis Horarios & Google Meet</span>
              </button>

              {esSuperAdmin && (
                <>
                  <button
                    onClick={() => setTabActiva("crear-usuario")}
                    className="inline-flex items-center gap-2 px-4 py-3 rounded-xl bg-emerald-600 text-white font-extrabold text-xs sm:text-sm shadow-md hover:bg-emerald-500 transition cursor-pointer shrink-0"
                  >
                    <UserPlus className="w-4 h-4" />
                    Creador de Usuarios
                  </button>
                  <button
                    onClick={() => setTabActiva("roles")}
                    className="inline-flex items-center gap-2 px-4 py-3 rounded-xl bg-white text-[#031926] font-extrabold text-xs sm:text-sm shadow-md hover:bg-[#F4E9CD] transition cursor-pointer shrink-0"
                  >
                    <Crown className="w-4 h-4 text-amber-500" />
                    Gestionar Roles
                  </button>
                </>
              )}
              <button
                onClick={() => setMostrarModalTarea(true)}
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-[#F4E9CD] text-[#031926] font-extrabold text-xs sm:text-sm shadow-md hover:bg-white transition cursor-pointer shrink-0"
              >
                <Plus className="w-4 h-4 text-[#468189]" />
                Asignar Tarea
              </button>
            </div>
          </div>

          {/* Tarjetas de Métricas Resumen */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mt-6 pt-6 border-t border-[#468189]/30">
            <div className="bg-white/5 p-4 rounded-2xl border border-white/10">
              <span className="text-[11px] font-semibold text-[#9DBEBB] block">Total Consultantes</span>
              <span className="text-2xl font-black text-white mt-1 block">
                {pacientes.filter((p) => p.rol !== "psicologo").length}
              </span>
            </div>

            <div className="bg-white/5 p-4 rounded-2xl border border-white/10">
              <span className="text-[11px] font-semibold text-[#9DBEBB] block">Citas Pendientes / Hoy</span>
              <span className="text-2xl font-black text-[#F4E9CD] mt-1 block">
                {citas.filter((c) => c.estado === "pendiente" || c.estado === "confirmada").length}
              </span>
            </div>

            <div className="bg-white/5 p-4 rounded-2xl border border-white/10">
              <span className="text-[11px] font-semibold text-[#9DBEBB] block">Sesiones Finalizadas</span>
              <span className="text-2xl font-black text-[#77ACA2] mt-1 block">
                {citas.filter((c) => c.estado === "finalizado" || c.estado === "completada").length}
              </span>
            </div>

            <div className="bg-white/5 p-4 rounded-2xl border border-white/10">
              <span className="text-[11px] font-semibold text-[#9DBEBB] block">Reseñas Recibidas</span>
              <span className="text-2xl font-black text-amber-400 mt-1 block flex items-center gap-1.5">
                <Star className="w-5 h-5 fill-amber-400" />
                {calificaciones.length}
              </span>
            </div>
          </div>
        </div>

        {/* 3. Navegación por Pestañas */}
        <div className="flex border-b border-[#9DBEBB]/30 gap-2 overflow-x-auto pb-1">
          <button
            onClick={() => setTabActiva("citas")}
            className={`inline-flex items-center gap-2 py-3 px-4 text-xs sm:text-sm font-semibold rounded-xl transition cursor-pointer shrink-0 ${
              tabActiva === "citas"
                ? "bg-[#468189] text-white shadow-sm"
                : "text-[#031926]/70 hover:text-[#031926] hover:bg-[#9DBEBB]/20"
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>Gestión de Citas ({citas.length})</span>
          </button>

          <button
            onClick={() => setTabActiva("pacientes")}
            className={`inline-flex items-center gap-2 py-3 px-4 text-xs sm:text-sm font-semibold rounded-xl transition cursor-pointer shrink-0 ${
              tabActiva === "pacientes"
                ? "bg-[#468189] text-white shadow-sm"
                : "text-[#031926]/70 hover:text-[#031926] hover:bg-[#9DBEBB]/20"
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Consultantes ({pacientes.filter((p) => p.rol !== "psicologo").length})</span>
          </button>

          <button
            onClick={() => setTabActiva("tareas")}
            className={`inline-flex items-center gap-2 py-3 px-4 text-xs sm:text-sm font-semibold rounded-xl transition cursor-pointer shrink-0 ${
              tabActiva === "tareas"
                ? "bg-[#468189] text-white shadow-sm"
                : "text-[#031926]/70 hover:text-[#031926] hover:bg-[#9DBEBB]/20"
            }`}
          >
            <ClipboardList className="w-4 h-4" />
            <span>Tareas Asignadas ({tareas.length})</span>
          </button>

          <button
            onClick={() => setTabActiva("calificaciones")}
            className={`inline-flex items-center gap-2 py-3 px-4 text-xs sm:text-sm font-semibold rounded-xl transition cursor-pointer shrink-0 ${
              tabActiva === "calificaciones"
                ? "bg-[#468189] text-white shadow-sm"
                : "text-[#031926]/70 hover:text-[#031926] hover:bg-[#9DBEBB]/20"
            }`}
          >
            <Star className="w-4 h-4" />
            <span>Calificaciones ({calificaciones.length})</span>
          </button>

          <button
            onClick={() => setTabActiva("emocional")}
            className={`inline-flex items-center gap-2 py-3 px-4 text-xs sm:text-sm font-semibold rounded-xl transition cursor-pointer shrink-0 ${
              tabActiva === "emocional"
                ? "bg-[#468189] text-white shadow-sm"
                : "text-[#031926]/70 hover:text-[#031926] hover:bg-[#9DBEBB]/20"
            }`}
          >
            <Smile className="w-4 h-4 text-emerald-400" />
            <span>Diario Emocional ({emocionales.length})</span>
          </button>

          <button
            onClick={() => setTabActiva("chat")}
            className={`inline-flex items-center gap-2 py-3 px-4 text-xs sm:text-sm font-semibold rounded-xl transition cursor-pointer shrink-0 ${
              tabActiva === "chat"
                ? "bg-[#468189] text-white shadow-sm"
                : "text-[#031926]/70 hover:text-[#031926] hover:bg-[#9DBEBB]/20"
            }`}
          >
            <MessageSquare className="w-4 h-4 text-sky-400" />
            <span>Messenger / Chat</span>
            {conversacionesChat.reduce((acc, c) => acc + (c.no_leidos || 0), 0) > 0 && (
              <span className="px-1.5 py-0.5 rounded-full bg-rose-500 text-white font-extrabold text-[10px] animate-pulse">
                {conversacionesChat.reduce((acc, c) => acc + (c.no_leidos || 0), 0)}
              </span>
            )}
          </button>

          {esSuperAdmin && (
            <>
              <button
                onClick={() => setTabActiva("roles")}
                className={`inline-flex items-center gap-2 py-3 px-4 text-xs sm:text-sm font-semibold rounded-xl transition cursor-pointer shrink-0 ${
                  tabActiva === "roles"
                    ? "bg-[#031926] text-white shadow-md border border-[#F4E9CD]/40"
                    : "text-[#031926]/70 hover:text-[#031926] hover:bg-[#9DBEBB]/20"
                }`}
              >
                <Crown className="w-4 h-4 text-amber-400" />
                <span>Gestión de Roles ({pacientes.length})</span>
              </button>

              <button
                onClick={() => setTabActiva("crear-usuario")}
                className={`inline-flex items-center gap-2 py-3 px-4 text-xs sm:text-sm font-semibold rounded-xl transition cursor-pointer shrink-0 ${
                  tabActiva === "crear-usuario"
                    ? "bg-[#031926] text-white shadow-md border border-emerald-400/40"
                    : "text-[#031926]/70 hover:text-[#031926] hover:bg-[#9DBEBB]/20"
                }`}
              >
                <UserPlus className="w-4 h-4 text-emerald-400" />
                <span>Creador de Usuarios</span>
              </button>
            </>
          )}
        </div>

        {/* 4. PESTAÑA: CITAS */}
        {tabActiva === "citas" && (
          <div className="space-y-4">
            {/* Filtros de Citas */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-semibold text-[#031926]/70">Filtrar:</span>
                {["todas", "pendientes", "confirmadas", "finalizadas"].map((filtro) => (
                  <button
                    key={filtro}
                    onClick={() => setFiltroCitas(filtro)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold capitalize transition cursor-pointer ${
                      filtroCitas === filtro
                        ? "bg-[#031926] text-white"
                        : "bg-white border border-[#9DBEBB]/40 text-[#031926]/70 hover:bg-[#FBF8F1]"
                    }`}
                  >
                    {filtro}
                  </button>
                ))}

                {esSuperAdmin && psicologasRegistradas.length > 0 && (
                  <div className="flex items-center gap-1.5 sm:ml-2">
                    <span className="text-xs font-semibold text-[#031926]/70">Especialista:</span>
                    <select
                      value={filtroPsicologo}
                      onChange={(e) => setFiltroPsicologo(e.target.value)}
                      className="px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-white border border-[#9DBEBB]/60 text-[#031926] cursor-pointer"
                    >
                      <option value="todos">Todos los Especialistas</option>
                      {psicologasRegistradas.map((psi) => (
                        <option key={psi.id} value={psi.id}>
                          {psi.nombre_completo || psi.email}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              <span className="text-xs text-[#031926]/60">
                Mostrando {citasFiltradas.length} cita(s)
              </span>
            </div>

            {/* Listado de Citas */}
            {citasFiltradas.length === 0 ? (
              <div className="bg-white rounded-3xl p-12 text-center border border-[#9DBEBB]/40">
                <Calendar className="w-12 h-12 text-[#9DBEBB] mx-auto mb-3" />
                <h3 className="text-base font-bold text-[#031926]">
                  No hay citas con este filtro
                </h3>
                <p className="text-xs text-[#031926]/70 mt-1">
                  Las citas agendadas por tus pacientes aparecerán aquí para tu gestión.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {citasFiltradas.map((cita) => {
                  const fechaObj = new Date(cita.fecha_hora);
                  const fechaFormateada = fechaObj.toLocaleDateString("es-ES", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  });
                  const horaFormateada = fechaObj.toLocaleTimeString("es-ES", {
                    hour: "2-digit",
                    minute: "2-digit",
                  });

                  const esFinalizada =
                    cita.estado === "finalizado" || cita.estado === "completada";

                  return (
                    <div
                      key={cita.id}
                      className="bg-white rounded-3xl p-6 border border-[#9DBEBB]/40 shadow-xs hover:shadow-md transition space-y-4"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${
                              cita.modalidad === "virtual"
                                ? "bg-[#9DBEBB]/25 text-[#031926] border border-[#77ACA2]/40"
                                : "bg-[#F4E9CD] text-[#031926] border border-[#77ACA2]/40"
                            }`}
                          >
                            {cita.modalidad === "virtual" ? (
                              <Video className="w-3.5 h-3.5 text-[#468189]" />
                            ) : (
                              <MapPin className="w-3.5 h-3.5 text-[#468189]" />
                            )}
                            <span className="capitalize">{cita.modalidad}</span>
                          </span>

                          <span
                            className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                              esFinalizada
                                ? "bg-[#77ACA2]/25 text-[#031926] border border-[#77ACA2]/50"
                                : cita.estado === "confirmada"
                                ? "bg-[#9DBEBB]/30 text-[#031926]"
                                : "bg-[#F4E9CD] text-[#031926]"
                            }`}
                          >
                            {cita.estado.toUpperCase()}
                          </span>
                        </div>
                      </div>

                      {/* Datos del Paciente */}
                      <div className="p-3.5 rounded-2xl bg-[#FBF8F1] border border-[#9DBEBB]/30">
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-semibold text-[#468189]">Consultante:</p>
                          {cita.psicologo ? (
                            <span className="text-[10px] font-bold text-[#468189] bg-[#9DBEBB]/20 px-2 py-0.5 rounded-md border border-[#77ACA2]/30 flex items-center gap-1">
                              <span>🩺</span> {cita.psicologo.nombre_completo || cita.psicologo.email}
                            </span>
                          ) : (
                            <span className="text-[10px] font-semibold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-md">
                              Especialista: {nombreActivo}
                            </span>
                          )}
                        </div>
                        <h4 className="text-sm font-bold text-[#031926] mt-0.5">
                          {cita.paciente?.nombre_completo || "Paciente sin nombre registrado"}
                        </h4>
                        <div className="flex flex-wrap items-center gap-3 text-[11px] text-[#031926]/70 mt-1">
                          <span className="flex items-center gap-1">
                            <Mail className="w-3 h-3 text-[#77ACA2]" />
                            {cita.paciente?.email || "Sin correo"}
                          </span>
                          {cita.paciente?.telefono && (
                            <span className="flex items-center gap-1">
                              <Phone className="w-3 h-3 text-[#77ACA2]" />
                              {cita.paciente.telefono}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Fecha y Hora */}
                      <div>
                        <p className="text-xs text-[#031926]/60 font-medium">Horario Agendado:</p>
                        <p className="text-sm font-bold text-[#031926] capitalize">
                          {fechaFormateada}
                        </p>
                        <p className="text-xs font-semibold text-[#468189] flex items-center gap-1.5 mt-0.5">
                          <Clock className="w-3.5 h-3.5" />
                          {horaFormateada}
                        </p>
                      </div>

                      {/* Notas previas del paciente */}
                      {cita.notas_paciente && (
                        <div className="text-xs text-[#031926]/80 p-3 bg-white border border-[#9DBEBB]/30 rounded-xl">
                          <span className="font-bold block mb-0.5">Motivo del consultante:</span>
                          "{cita.notas_paciente}"
                        </div>
                      )}

                      {/* Enlace de reunión virtual con Google Meet */}
                      {cita.modalidad === "virtual" && (
                        <div className="flex flex-wrap items-center gap-2 pt-1">
                          {cita.enlace_reunion ? (
                            <a
                              href={cita.enlace_reunion}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex-1 inline-flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition shadow-xs"
                            >
                              <Video className="w-4 h-4 text-emerald-100" />
                              <span>Unirse a Google Meet</span>
                              <ExternalLink className="w-3 h-3 opacity-80" />
                            </a>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleGenerarMeet(cita.id)}
                              className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition cursor-pointer"
                            >
                              <Video className="w-4 h-4" />
                              <span>Generar Google Meet</span>
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => {
                              setCitaParaEditar(cita);
                              setNuevoEnlace(cita.enlace_reunion || "");
                            }}
                            className="px-3 py-2 rounded-xl border border-[#9DBEBB]/50 text-xs font-semibold text-[#031926]/75 hover:bg-[#FBF8F1] transition cursor-pointer"
                          >
                            {cita.enlace_reunion ? "Editar Enlace" : "+ Añadir Enlace"}
                          </button>
                        </div>
                      )}

                      {/* Botones de Acción: Reprogramar y Finalizar */}
                      <div className="pt-2 border-t border-[#9DBEBB]/30 flex flex-wrap items-center justify-between gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setCitaParaReprogramar(cita);
                            const d = new Date(cita.fecha_hora);
                            setReprogramarFecha(d.toISOString().split("T")[0]);
                            setReprogramarHora(d.toTimeString().slice(0, 5));
                            setReprogramarEstado(cita.estado);
                            setReprogramarEnlace(cita.enlace_reunion || "");
                          }}
                          className="py-2 px-3 rounded-xl border border-[#9DBEBB]/60 text-xs font-semibold text-[#031926] hover:bg-[#FBF8F1] transition cursor-pointer flex items-center gap-1.5"
                        >
                          <RefreshCw className="w-3.5 h-3.5 text-[#468189]" />
                          <span>Reprogramar / Editar</span>
                        </button>

                        {esFinalizada ? (
                          <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200">
                            <Check className="w-4 h-4 text-emerald-600" />
                            <span>Servicio Finalizado</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            {cita.estado !== "confirmada" && (
                              <button
                                onClick={() => handleCambiarEstadoCita(cita.id, "confirmada")}
                                className="py-2 px-3 rounded-xl border border-[#468189] text-[#468189] hover:bg-[#468189] hover:text-white font-semibold text-xs transition cursor-pointer"
                              >
                                Confirmar
                              </button>
                            )}
                            <button
                              onClick={() => handleCambiarEstadoCita(cita.id, "finalizado")}
                              className="py-2 px-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 text-white font-bold text-xs shadow-md shadow-emerald-200 hover:brightness-105 transition cursor-pointer flex items-center gap-1.5"
                            >
                              <CheckCircle2 className="w-4 h-4" />
                              <span>Finalizar</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* 5. PESTAÑA: CONSULTANTES */}
        {tabActiva === "pacientes" && (
          <div className="space-y-4">
            <div className="bg-white rounded-3xl p-6 border border-[#9DBEBB]/40 shadow-xs">
              <h3 className="text-base font-bold text-[#031926] mb-1">
                Expedientes de Consultantes Registrados
              </h3>
              <p className="text-xs text-[#031926]/70 mb-4">
                Personas que se han registrado en tu plataforma para tomar consulta contigo.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {pacientes
                  .filter((p) => p.rol !== "psicologo")
                  .map((p) => {
                    const citasPaciente = citas.filter((c) => c.paciente_id === p.id);
                    const tareasPaciente = tareas.filter((t) => t.paciente_id === p.id);
                    const emocionalesPaciente = emocionales.filter(
                      (e) => e.paciente_id === p.id
                    );

                    return (
                      <div
                        key={p.id}
                        className="p-5 rounded-2xl bg-[#FBF8F1] border border-[#9DBEBB]/30 space-y-3"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-[#9DBEBB]/40 text-[#031926] font-bold text-sm flex items-center justify-center border border-[#77ACA2]/50">
                            {p.nombre_completo?.charAt(0).toUpperCase() || "P"}
                          </div>
                          <div>
                            <h4 className="text-xs font-bold text-[#031926]">
                              {p.nombre_completo || "Sin nombre"}
                            </h4>
                            <p className="text-[11px] text-[#031926]/60 truncate max-w-[180px]">
                              {p.email}
                            </p>
                          </div>
                        </div>

                        <div className="grid grid-cols-3 gap-1 pt-2 border-t border-[#9DBEBB]/20 text-center">
                          <div className="bg-white p-2 rounded-xl">
                            <span className="text-[10px] text-[#031926]/60 block">Citas</span>
                            <span className="text-xs font-bold text-[#468189]">
                              {citasPaciente.length}
                            </span>
                          </div>
                          <div className="bg-white p-2 rounded-xl">
                            <span className="text-[10px] text-[#031926]/60 block">Tareas</span>
                            <span className="text-xs font-bold text-[#77ACA2]">
                              {tareasPaciente.length}
                            </span>
                          </div>
                          <div className="bg-white p-2 rounded-xl">
                            <span className="text-[10px] text-[#031926]/60 block">Diario</span>
                            <span className="text-xs font-bold text-[#031926]">
                              {emocionalesPaciente.length}
                            </span>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            setFiltroPacienteEmocional(p.id);
                            setTabActiva("emocional");
                          }}
                          className="w-full inline-flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-xl bg-white border border-emerald-300 text-emerald-800 hover:bg-emerald-600 hover:text-white text-xs font-semibold transition cursor-pointer shadow-2xs"
                        >
                          <Smile className="w-3.5 h-3.5" />
                          <span>Ver Diario Emocional ({emocionalesPaciente.length})</span>
                        </button>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              setPacienteSeleccionado(p.id);
                              setMostrarModalTarea(true);
                            }}
                            className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-white border border-[#468189]/50 text-[#468189] hover:bg-[#468189] hover:text-white text-xs font-semibold transition cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Asignar Tarea</span>
                          </button>
                          {esSuperAdmin && p.email.toLowerCase() !== "brayancamilo2407@gmail.com" && (
                            <button
                              type="button"
                              onClick={() => handleEliminarUsuario(p.id, p.nombre_completo || p.email)}
                              className="p-2 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 text-xs transition cursor-pointer shrink-0"
                              title="Eliminar consultante"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>
        )}

        {/* 6. PESTAÑA: TAREAS TERAPÉUTICAS */}
        {tabActiva === "tareas" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-[#031926]">
                  Tareas y Ejercicios Asignados
                </h3>
                <p className="text-xs text-[#031926]/70">
                  Herramientas y actividades que has dejado a tus consultantes entre sesiones.
                </p>
              </div>

              <button
                onClick={() => setMostrarModalTarea(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#468189] text-white text-xs font-bold hover:bg-[#031926] transition cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                Nueva Tarea
              </button>
            </div>

            {tareas.length === 0 ? (
              <div className="bg-white rounded-3xl p-12 text-center border border-[#9DBEBB]/40">
                <ClipboardList className="w-12 h-12 text-[#9DBEBB] mx-auto mb-3" />
                <h3 className="text-base font-bold text-[#031926]">
                  Aún no has asignado tareas
                </h3>
                <p className="text-xs text-[#031926]/70 mt-1">
                  Haz clic en "+ Asignar Tarea" para dejar un ejercicio práctico a un consultante.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {tareas.map((t) => (
                  <div
                    key={t.id}
                    className="bg-white rounded-3xl p-6 border border-[#9DBEBB]/40 shadow-xs space-y-3"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-[#468189] bg-[#9DBEBB]/20 px-2.5 py-1 rounded-full">
                          {t.paciente?.nombre_completo || "Consultante"}
                        </span>
                        {t.fecha_limite && (
                          <span className="text-[11px] font-semibold text-[#031926]/70 bg-[#F4E9CD] px-2 py-0.5 rounded-md">
                            Límite: {t.fecha_limite}
                          </span>
                        )}
                      </div>

                      <span
                        className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                          t.completada
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {t.completada ? "COMPLETADA" : "PENDIENTE"}
                      </span>
                    </div>

                    <div>
                      <h4 className="text-sm font-bold text-[#031926]">{t.titulo}</h4>
                      <p className="text-xs text-[#031926]/75 mt-1 leading-relaxed">
                        {t.descripcion}
                      </p>
                    </div>

                    {t.reflexion_paciente && (
                      <div className="p-3 bg-[#FBF8F1] rounded-xl border border-[#9DBEBB]/30 text-xs">
                        <span className="font-bold text-[#031926] block mb-0.5">
                          Reflexión compartida por el paciente:
                        </span>
                        "{t.reflexion_paciente}"
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 7. PESTAÑA: CALIFICACIONES REALES */}
        {tabActiva === "calificaciones" && (
          <div className="space-y-4">
            <div className="bg-white rounded-3xl p-6 border border-[#9DBEBB]/40 shadow-xs">
              <h3 className="text-base font-bold text-[#031926] mb-1">
                Calificaciones y Reseñas de tus Consultantes
              </h3>
              <p className="text-xs text-[#031926]/70 mb-6">
                Evaluaciones registradas exclusivamente por pacientes que completaron su sesión contigo.
              </p>

              {calificaciones.length === 0 ? (
                <div className="text-center py-10">
                  <Star className="w-12 h-12 text-[#9DBEBB] mx-auto mb-3" />
                  <h4 className="text-sm font-bold text-[#031926]">
                    Aún no hay calificaciones registradas (0)
                  </h4>
                  <p className="text-xs text-[#031926]/60 mt-1 max-w-md mx-auto">
                    Cuando finalices una sesión en la pestaña "Gestión de Citas", tu consultante podrá calificar el servicio recibido de 1 a 5 estrellas.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {calificaciones.map((cal) => (
                    <div
                      key={cal.id}
                      className="p-5 rounded-2xl bg-[#FBF8F1] border border-[#9DBEBB]/40 space-y-2.5"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1 text-amber-500">
                          {[...Array(cal.estrellas)].map((_, i) => (
                            <Star key={i} className="w-4 h-4 fill-amber-400" />
                          ))}
                          <span className="text-xs font-bold text-[#031926] ml-1.5">
                            {cal.estrellas}.0
                          </span>
                        </div>
                        <span className="text-[10px] text-[#031926]/50">
                          {new Date(cal.creado_en).toLocaleDateString("es-ES")}
                        </span>
                      </div>

                      <p className="text-xs font-bold text-[#031926]">
                        {cal.nombre_mostrar || "Consultante Anónimo"}
                      </p>

                      {cal.comentario && (
                        <p className="text-xs text-[#031926]/80 italic bg-white p-3 rounded-xl border border-[#9DBEBB]/30">
                          "{cal.comentario}"
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* 8. PESTAÑA: SEGUIMIENTO Y DIARIO EMOCIONAL DE CONSULTANTES */}
        {tabActiva === "emocional" && (
          <div className="space-y-6">
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#9DBEBB]/40 shadow-xs space-y-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-[#9DBEBB]/30">
                <div>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                      <Smile className="w-4 h-4 text-emerald-700" />
                    </div>
                    <h3 className="text-base sm:text-lg font-bold text-[#031926]">
                      Diario Emocional y Estados de Ánimo
                    </h3>
                  </div>
                  <p className="text-xs text-[#031926]/70 mt-1">
                    Registros, reflexiones cotidianas y niveles de ánimo compartidos por tus consultantes en tiempo real.
                  </p>
                </div>

                {/* Filtro por Paciente */}
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <span className="text-xs font-semibold text-[#031926]/70 whitespace-nowrap">
                    Consultante:
                  </span>
                  <select
                    value={filtroPacienteEmocional}
                    onChange={(e) => setFiltroPacienteEmocional(e.target.value)}
                    className="p-2 sm:p-2.5 rounded-xl border border-[#9DBEBB]/60 text-xs font-semibold text-[#031926] bg-white hover:border-[#468189] focus:outline-none focus:ring-2 focus:ring-[#468189] cursor-pointer shadow-xs w-full sm:w-64"
                  >
                    <option value="todos">Todos los Consultantes ({emocionales.length} registros)</option>
                    {pacientes
                      .filter((p) => p.rol !== "psicologo")
                      .map((p) => {
                        const cant = emocionales.filter((e) => e.paciente_id === p.id).length;
                        return (
                          <option key={p.id} value={p.id}>
                            {p.nombre_completo || p.email} ({cant})
                          </option>
                        );
                      })}
                  </select>
                </div>
              </div>

              {/* Métricas rápidas de ánimo */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3.5 rounded-2xl bg-[#FBF8F1] border border-[#9DBEBB]/30">
                  <span className="text-[10px] text-[#031926]/60 font-semibold block">Total Registros</span>
                  <span className="text-xl font-bold text-[#468189] mt-0.5 block">{emocionales.length}</span>
                </div>
                <div className="p-3.5 rounded-2xl bg-[#FBF8F1] border border-[#9DBEBB]/30">
                  <span className="text-[10px] text-[#031926]/60 font-semibold block">Promedio de Ánimo</span>
                  <span className="text-xl font-bold text-emerald-600 mt-0.5 block">
                    {emocionales.length > 0
                      ? (emocionales.reduce((acc, curr) => acc + (curr.nivel_animo || 3), 0) / emocionales.length).toFixed(1) + " / 5.0"
                      : "N/A"}
                  </span>
                </div>
                <div className="p-3.5 rounded-2xl bg-[#FBF8F1] border border-[#9DBEBB]/30">
                  <span className="text-[10px] text-[#031926]/60 font-semibold block">Último Estado</span>
                  <span className="text-xs font-bold text-[#031926] mt-1 block truncate">
                    {emocionales.length > 0 ? emocionales[0].emocion_principal : "Sin registros"}
                  </span>
                </div>
                <div className="p-3.5 rounded-2xl bg-[#FBF8F1] border border-[#9DBEBB]/30">
                  <span className="text-[10px] text-[#031926]/60 font-semibold block">Consultantes Activos</span>
                  <span className="text-xl font-bold text-[#031926] mt-0.5 block">
                    {new Set(emocionales.map((e) => e.paciente_id)).size}
                  </span>
                </div>
              </div>

              {/* Lista de Registros Emocionales */}
              {emocionalesFiltrados.length === 0 ? (
                <div className="text-center py-12 border border-dashed border-[#9DBEBB]/60 rounded-3xl p-8">
                  <Smile className="w-12 h-12 text-[#9DBEBB] mx-auto mb-3" />
                  <h4 className="text-sm font-bold text-[#031926]">
                    No hay registros emocionales aún
                  </h4>
                  <p className="text-xs text-[#031926]/60 mt-1 max-w-md mx-auto">
                    Cuando tus consultantes anoten cómo se sienten en su sección "Mi Diario Emocional" dentro de su portal, verás sus entradas, notas y niveles de ánimo aquí en tiempo real.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {emocionalesFiltrados.map((reg) => {
                    const carita = caritasInfo.find((c) => c.nivel === reg.nivel_animo) || caritasInfo[2];
                    const fechaObj = new Date(reg.creado_en);
                    const fechaFormateada = fechaObj.toLocaleDateString("es-ES", {
                      weekday: "short",
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    });
                    const horaFormateada = fechaObj.toLocaleTimeString("es-ES", {
                      hour: "2-digit",
                      minute: "2-digit",
                    });

                    return (
                      <div
                        key={reg.id}
                        className="p-5 rounded-2xl bg-[#FBF8F1] border border-[#9DBEBB]/40 shadow-xs hover:shadow-md transition space-y-3"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-2xl bg-white text-[#031926] font-bold text-sm flex items-center justify-center border border-[#77ACA2]/40 shadow-xs">
                              {reg.paciente?.nombre_completo?.charAt(0).toUpperCase() || "P"}
                            </div>
                            <div>
                              <h5 className="text-xs sm:text-sm font-bold text-[#031926]">
                                {reg.paciente?.nombre_completo || reg.paciente?.email || "Consultante"}
                              </h5>
                              <p className="text-[11px] text-[#031926]/60">
                                {fechaFormateada} • {horaFormateada}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white border border-[#9DBEBB]/40 shadow-xs shrink-0">
                            <span className="text-lg">{carita.emoji}</span>
                            <span className="text-xs font-bold text-[#031926]">{reg.nivel_animo}.0</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#9DBEBB]/25 text-[#468189] border border-[#77ACA2]/30">
                            {reg.emocion_principal || "Estado general"}
                          </span>
                          <span className="text-[11px] text-gray-500 font-medium">
                            ({carita.etiqueta})
                          </span>
                        </div>

                        {reg.notas ? (
                          <div className="p-3 bg-white rounded-xl border border-[#9DBEBB]/30 text-xs text-[#031926]/85 leading-relaxed">
                            <span className="font-semibold text-gray-500 block mb-0.5 text-[10px] uppercase">
                              Reflexión del consultante:
                            </span>
                            "{reg.notas}"
                          </div>
                        ) : (
                          <p className="text-[11px] text-gray-400 italic">
                            Sin notas adicionales registradas.
                          </p>
                        )}

                        <div className="pt-2 border-t border-[#9DBEBB]/20 flex items-center justify-between">
                          <span className="text-[10px] text-gray-400">
                            {reg.paciente?.email}
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              setPacienteSeleccionado(reg.paciente_id);
                              setMostrarModalTarea(true);
                            }}
                            className="inline-flex items-center gap-1 text-[11px] font-bold text-[#468189] hover:underline cursor-pointer"
                          >
                            <Plus className="w-3 h-3" />
                            <span>Asignar Tarea</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* 9. PESTAÑA: GESTIÓN DE ROLES (EXCLUSIVO SUPER ADMIN) */}
        {tabActiva === "roles" && esSuperAdmin && (
          <div className="space-y-4">
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#9DBEBB]/40 shadow-xs space-y-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-[#9DBEBB]/30">
                <div>
                  <div className="flex items-center gap-2">
                    <Crown className="w-5 h-5 text-amber-500" />
                    <h3 className="text-base sm:text-lg font-bold text-[#031926]">
                      Control Maestro de Roles y Accesos
                    </h3>
                  </div>
                  <p className="text-xs text-[#031926]/70 mt-1">
                    Como Super Administrador ({currentUser?.email}), puedes promover o degradar usuarios para que actúen como Consultante, Psicóloga o Administrador.
                  </p>
                </div>

                <div className="w-full sm:w-64 relative">
                  <Search className="w-4 h-4 text-[#77ACA2] absolute left-3 top-3" />
                  <input
                    type="text"
                    placeholder="Buscar usuario o correo..."
                    value={busquedaUsuarios}
                    onChange={(e) => setBusquedaUsuarios(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 rounded-xl border border-[#9DBEBB]/50 text-xs text-[#031926] focus:outline-none focus:ring-2 focus:ring-[#468189]"
                  />
                </div>
              </div>

              {/* Guía Rápida de Roles */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3.5 rounded-2xl bg-[#FBF8F1] border border-[#9DBEBB]/30 text-xs">
                  <span className="font-bold text-[#031926] flex items-center gap-1.5 mb-1">
                    <span>👤 Consultante (Paciente)</span>
                  </span>
                  <p className="text-[11px] text-[#031926]/70">
                    Solo accede a su portal privado: agenda citas, realiza tareas terapéuticas y califica cuando su sesión sea finalizada.
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-[#9DBEBB]/20 border border-[#77ACA2]/40 text-xs">
                  <span className="font-bold text-[#031926] flex items-center gap-1.5 mb-1">
                    <span>🩺 Psicóloga (Especialista)</span>
                  </span>
                  <p className="text-[11px] text-[#031926]/70">
                    Accede al panel profesional: atiende sesiones, asigna tareas terapéuticas y marca citas como "Finalizadas".
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-[#F4E9CD] border border-[#77ACA2]/30 text-xs">
                  <span className="font-bold text-[#031926] flex items-center gap-1.5 mb-1">
                    <span>👑 Administrador</span>
                  </span>
                  <p className="text-[11px] text-[#031926]/70">
                    Control total del sistema: supervisa todas las citas y puede asignar roles a cualquier usuario registrado.
                  </p>
                </div>
              </div>

              {/* Lista de Usuarios */}
              <div className="space-y-3 pt-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#468189]">
                  Usuarios Registrados en el Sistema ({pacientes.length})
                </h4>

                <div className="grid grid-cols-1 gap-3">
                  {pacientes
                    .filter((p) => {
                      if (!busquedaUsuarios) return true;
                      const q = busquedaUsuarios.toLowerCase();
                      return (
                        p.email.toLowerCase().includes(q) ||
                        p.nombre_completo?.toLowerCase().includes(q)
                      );
                    })
                    .map((p) => {
                      const esEsteSuperAdmin =
                        p.email.toLowerCase() === "brayancamilo2407@gmail.com";

                      return (
                        <div
                          key={p.id}
                          className="p-4 sm:p-5 rounded-2xl bg-[#FBF8F1] border border-[#9DBEBB]/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:shadow-xs transition"
                        >
                          <div className="flex items-center gap-3.5">
                            <div className="w-11 h-11 rounded-2xl bg-white text-[#031926] font-bold text-sm flex items-center justify-center border border-[#77ACA2]/40 shadow-xs shrink-0">
                              {p.nombre_completo?.charAt(0).toUpperCase() || p.email.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <h5 className="text-xs sm:text-sm font-bold text-[#031926]">
                                  {p.nombre_completo || "Usuario sin nombre"}
                                </h5>
                                {esEsteSuperAdmin && (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 text-[10px] font-extrabold border border-amber-300">
                                    <Crown className="w-3 h-3 text-amber-600" />
                                    SUPER ADMIN
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-[#031926]/70 flex items-center gap-1.5 mt-0.5">
                                <Mail className="w-3 h-3 text-[#77ACA2]" />
                                {p.email}
                              </p>
                              <p className="text-[10px] text-[#031926]/50 mt-0.5">
                                Registrado el: {new Date(p.creado_en).toLocaleDateString("es-ES")}
                              </p>
                            </div>
                          </div>

                          {/* Selector de Rol */}
                          <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end pt-2 sm:pt-0 border-t sm:border-t-0 border-[#9DBEBB]/30">
                            <div className="text-left sm:text-right">
                              <span className="text-[10px] text-[#031926]/60 font-semibold block">
                                Rol Asignado:
                              </span>
                              <span
                                className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase mt-0.5 ${
                                  p.rol === "admin" || p.rol === "superadmin"
                                    ? "bg-amber-100 text-amber-900 border border-amber-200"
                                    : p.rol === "psicologo"
                                    ? "bg-[#468189] text-white"
                                    : "bg-white text-[#031926] border border-[#9DBEBB]/60"
                                }`}
                              >
                                {p.rol === "psicologo"
                                  ? "🩺 Psicóloga"
                                  : p.rol === "admin" || p.rol === "superadmin"
                                  ? "👑 Admin"
                                  : "👤 Consultante"}
                              </span>
                            </div>

                            <div className="shrink-0 flex items-center gap-2">
                              <select
                                value={p.rol || "paciente"}
                                disabled={esEsteSuperAdmin}
                                onChange={(e) =>
                                  handleCambiarRol(
                                    p.id,
                                    e.target.value as "paciente" | "psicologo" | "admin"
                                  )
                                }
                                className="p-2 sm:p-2.5 rounded-xl border border-[#9DBEBB]/60 text-xs font-semibold text-[#031926] bg-white hover:border-[#468189] focus:outline-none focus:ring-2 focus:ring-[#468189] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-xs"
                              >
                                <option value="paciente">👤 Consultante</option>
                                <option value="psicologo">🩺 Psicóloga / Especialista</option>
                                <option value="admin">👑 Administrador</option>
                              </select>

                              {!esEsteSuperAdmin && (
                                <button
                                  type="button"
                                  onClick={() => handleEliminarUsuario(p.id, p.nombre_completo || p.email)}
                                  className="p-2 sm:p-2.5 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-bold transition cursor-pointer flex items-center gap-1.5 shadow-xs"
                                  title="Eliminar usuario permanentemente"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                  <span className="hidden sm:inline">Eliminar</span>
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 6. PESTAÑA: CREADOR DE USUARIOS LOCALES (SUPER ADMIN) */}
        {tabActiva === "crear-usuario" && esSuperAdmin && (
          <div className="space-y-6">
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#9DBEBB]/40 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#9DBEBB]/30">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center shadow-xs">
                    <UserPlus className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-lg sm:text-xl font-black text-[#031926] flex items-center gap-2">
                      Creador de Usuarios Locales
                      <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 text-[10px] font-extrabold border border-amber-300">
                        SUPER ADMIN
                      </span>
                    </h3>
                    <p className="text-xs text-[#031926]/70 mt-0.5">
                      Crea cuentas de acceso inmediato con correo y contraseña para consultantes, psicólogas o administradores.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setTabActiva("roles")}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-[#468189] hover:bg-[#9DBEBB]/20 border border-[#9DBEBB]/40 transition self-start sm:self-auto cursor-pointer"
                >
                  <Users className="w-4 h-4" />
                  <span>Ver lista de usuarios ({pacientes.length})</span>
                </button>
              </div>

              {/* Tarjeta de Éxito al Crear Usuario */}
              {usuarioCreadoResultado && (
                <div className="mt-6 p-5 sm:p-6 rounded-2xl bg-emerald-50/90 border border-emerald-300 text-[#031926] space-y-4 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-xs">
                        <Check className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-sm sm:text-base font-extrabold text-emerald-950">
                          ¡Usuario Creado Exitosamente!
                        </h4>
                        <p className="text-xs text-emerald-800">
                          La cuenta ha sido dada de alta en Supabase y ya puede iniciar sesión en la plataforma.
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setUsuarioCreadoResultado(null)}
                      className="text-emerald-700 hover:text-emerald-950 text-xs font-bold px-2 py-1 cursor-pointer"
                    >
                      ✕
                    </button>
                  </div>

                  {/* Resumen de credenciales */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 bg-white p-4 rounded-xl border border-emerald-200">
                    <div>
                      <span className="text-[10px] font-bold text-gray-500 uppercase block">Nombre:</span>
                      <span className="text-xs font-bold text-[#031926] truncate block">{usuarioCreadoResultado.nombre}</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-gray-500 uppercase block">Correo de Acceso:</span>
                      <span className="text-xs font-bold text-[#031926] truncate block">{usuarioCreadoResultado.email}</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-gray-500 uppercase block">Contraseña:</span>
                      <span className="text-xs font-mono font-bold text-[#468189] block">{usuarioCreadoResultado.password}</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-gray-500 uppercase block">Rol Asignado:</span>
                      <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-emerald-100 text-emerald-900 border border-emerald-300">
                        {usuarioCreadoResultado.rol === "psicologo"
                          ? "🩺 Psicóloga"
                          : usuarioCreadoResultado.rol === "admin"
                          ? "👑 Admin"
                          : "👤 Consultante"}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                    <button
                      onClick={handleCopiarCredenciales}
                      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition cursor-pointer"
                    >
                      {credencialesCopiadas ? (
                        <>
                          <Check className="w-4 h-4 text-emerald-200" />
                          <span>¡Copiado al Portapapeles!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4" />
                          <span>Copiar Credenciales para Enviar</span>
                        </>
                      )}
                    </button>

                    <button
                      onClick={() => setTabActiva("roles")}
                      className="text-xs font-bold text-emerald-900 hover:underline inline-flex items-center gap-1 cursor-pointer"
                    >
                      <span>Gestionar rol en tabla</span> →
                    </button>
                  </div>
                </div>
              )}

              {/* Formulario de Creación */}
              <form onSubmit={handleCrearUsuarioLocal} className="mt-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Columna 1: Información de Contacto */}
                  <div className="space-y-4">
                    <h4 className="text-xs font-extrabold text-[#468189] uppercase tracking-wider">
                      1. Información del Usuario
                    </h4>

                    <div>
                      <label className="block text-xs font-bold text-[#031926] mb-1.5">
                        Nombre Completo <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative">
                        <User className="w-4 h-4 text-[#77ACA2] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <input
                          type="text"
                          required
                          placeholder="Ej: Dra. Alejandra Bedoya"
                          value={formUsuario.nombre}
                          onChange={(e) =>
                            setFormUsuario({ ...formUsuario, nombre: e.target.value })
                          }
                          className="w-full pl-10 pr-3.5 py-3 rounded-xl border border-[#9DBEBB]/60 text-xs text-[#031926] focus:outline-none focus:ring-2 focus:ring-[#468189] bg-white shadow-xs"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-[#031926] mb-1.5">
                        Correo Electrónico (Usuario de Acceso) <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative">
                        <Mail className="w-4 h-4 text-[#77ACA2] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <input
                          type="email"
                          required
                          placeholder="ejemplo@correo.com"
                          value={formUsuario.email}
                          onChange={(e) =>
                            setFormUsuario({ ...formUsuario, email: e.target.value })
                          }
                          className="w-full pl-10 pr-3.5 py-3 rounded-xl border border-[#9DBEBB]/60 text-xs text-[#031926] focus:outline-none focus:ring-2 focus:ring-[#468189] bg-white shadow-xs"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-[#031926] mb-1.5">
                        Teléfono / WhatsApp (Opcional)
                      </label>
                      <div className="relative">
                        <Phone className="w-4 h-4 text-[#77ACA2] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <input
                          type="tel"
                          placeholder="+57 300 123 4567"
                          value={formUsuario.telefono}
                          onChange={(e) =>
                            setFormUsuario({ ...formUsuario, telefono: e.target.value })
                          }
                          className="w-full pl-10 pr-3.5 py-3 rounded-xl border border-[#9DBEBB]/60 text-xs text-[#031926] focus:outline-none focus:ring-2 focus:ring-[#468189] bg-white shadow-xs"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Columna 2: Seguridad y Rol */}
                  <div className="space-y-4">
                    <h4 className="text-xs font-extrabold text-[#468189] uppercase tracking-wider">
                      2. Seguridad y Permisos
                    </h4>

                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="block text-xs font-bold text-[#031926]">
                          Contraseña de Acceso <span className="text-rose-500">*</span>
                        </label>
                        <button
                          type="button"
                          onClick={generarPasswordSegura}
                          className="text-[11px] font-bold text-[#468189] hover:text-[#031926] hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          <Sparkles className="w-3 h-3 text-amber-500" />
                          Generar Contraseña
                        </button>
                      </div>

                      <div className="relative">
                        <Key className="w-4 h-4 text-[#77ACA2] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <input
                          type={mostrarPassword ? "text" : "password"}
                          required
                          minLength={6}
                          placeholder="Mínimo 6 caracteres"
                          value={formUsuario.password}
                          onChange={(e) =>
                            setFormUsuario({ ...formUsuario, password: e.target.value })
                          }
                          className="w-full pl-10 pr-10 py-3 rounded-xl border border-[#9DBEBB]/60 text-xs text-[#031926] focus:outline-none focus:ring-2 focus:ring-[#468189] bg-white shadow-xs font-mono"
                        />
                        <button
                          type="button"
                          onClick={() => setMostrarPassword(!mostrarPassword)}
                          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
                        >
                          {mostrarPassword ? (
                            <EyeOff className="w-4 h-4" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                      <p className="text-[10px] text-gray-500 mt-1">
                        El usuario podrá usar esta contraseña para iniciar sesión en la web.
                      </p>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-[#031926] mb-2">
                        Rol Inicial a Asignar <span className="text-rose-500">*</span>
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                        <label
                          className={`p-3 rounded-xl border flex flex-col justify-between cursor-pointer transition ${
                            formUsuario.rol === "paciente"
                              ? "bg-[#FBF8F1] border-[#468189] ring-2 ring-[#468189]/30"
                              : "border-[#9DBEBB]/40 hover:bg-gray-50"
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <input
                              type="radio"
                              name="rolUsuario"
                              value="paciente"
                              checked={formUsuario.rol === "paciente"}
                              onChange={() =>
                                setFormUsuario({ ...formUsuario, rol: "paciente" })
                              }
                              className="accent-[#468189]"
                            />
                            <span className="text-xs font-bold text-[#031926]">Consultante</span>
                          </div>
                          <span className="text-[10px] text-gray-500 mt-1.5">
                            Acceso básico: reservar citas, portal personal y tareas.
                          </span>
                        </label>

                        <label
                          className={`p-3 rounded-xl border flex flex-col justify-between cursor-pointer transition ${
                            formUsuario.rol === "psicologo"
                              ? "bg-[#FBF8F1] border-[#468189] ring-2 ring-[#468189]/30"
                              : "border-[#9DBEBB]/40 hover:bg-gray-50"
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <input
                              type="radio"
                              name="rolUsuario"
                              value="psicologo"
                              checked={formUsuario.rol === "psicologo"}
                              onChange={() =>
                                setFormUsuario({ ...formUsuario, rol: "psicologo" })
                              }
                              className="accent-[#468189]"
                            />
                            <span className="text-xs font-bold text-[#031926]">🩺 Psicóloga</span>
                          </div>
                          <span className="text-[10px] text-gray-500 mt-1.5">
                            Panel clínico: gestión de citas, consultantes y tareas.
                          </span>
                        </label>

                        <label
                          className={`p-3 rounded-xl border flex flex-col justify-between cursor-pointer transition ${
                            formUsuario.rol === "admin"
                              ? "bg-amber-50/50 border-amber-400 ring-2 ring-amber-400/30"
                              : "border-[#9DBEBB]/40 hover:bg-gray-50"
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <input
                              type="radio"
                              name="rolUsuario"
                              value="admin"
                              checked={formUsuario.rol === "admin"}
                              onChange={() =>
                                setFormUsuario({ ...formUsuario, rol: "admin" })
                              }
                              className="accent-amber-600"
                            />
                            <span className="text-xs font-bold text-amber-900">👑 Admin</span>
                          </div>
                          <span className="text-[10px] text-amber-800/80 mt-1.5">
                            Permisos completos de administración y control de roles.
                          </span>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Botón de Envío */}
                <div className="pt-4 border-t border-[#9DBEBB]/30 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>El usuario se creará en el servicio de autenticación y en la tabla de perfiles.</span>
                  </div>

                  <button
                    type="submit"
                    disabled={creandoUsuario}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl bg-[#031926] text-white font-extrabold text-xs sm:text-sm hover:bg-[#468189] transition shadow-md disabled:opacity-50 cursor-pointer"
                  >
                    {creandoUsuario ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Creando Usuario en Supabase...</span>
                      </>
                    ) : (
                      <>
                        <UserPlus className="w-4 h-4 text-emerald-400" />
                        <span>Crear y Registrar Usuario</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
        {/* 8. PESTAÑA: MESSENGER / CHAT EN VIVO CON PACIENTES */}
        {tabActiva === "chat" && (
          <div className="bg-white rounded-3xl border border-[#9DBEBB]/40 shadow-sm overflow-hidden h-[680px] max-h-[80vh] flex flex-col md:flex-row">
            {/* Panel Izquierdo: Lista de Consultantes */}
            <div className="w-full md:w-80 border-r border-[#9DBEBB]/30 flex flex-col bg-[#FBF8F1]/40">
              <div className="p-4 border-b border-[#9DBEBB]/30 bg-white">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-base font-bold text-[#031926] flex items-center gap-2">
                    <MessageSquare className="w-5 h-5 text-[#468189]" />
                    Conversaciones
                  </h3>
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full border border-emerald-300">
                    🟢 En línea
                  </span>
                </div>

                <div className="relative">
                  <Search className="w-4 h-4 text-[#77ACA2] absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={busquedaChat}
                    onChange={(e) => setBusquedaChat(e.target.value)}
                    placeholder="Buscar consultante..."
                    className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-[#9DBEBB]/60 bg-[#FBF8F1] text-[#031926] focus:outline-none focus:ring-2 focus:ring-[#468189]"
                  />
                </div>
              </div>

              <div className="flex-1 overflow-y-auto divide-y divide-[#9DBEBB]/20">
                {/* 1. Conversaciones con mensajes previos */}
                {conversacionesChat
                  .filter((conv) => {
                    const c = conv.contacto;
                    if (!c) return false;
                    return busquedaChat
                      ? (c.nombre_completo || "").toLowerCase().includes(busquedaChat.toLowerCase()) ||
                        (c.email || "").toLowerCase().includes(busquedaChat.toLowerCase())
                      : true;
                  })
                  .map((conv) => {
                    const c = conv.contacto;
                    const seleccionado = pacienteChatSeleccionado?.id === c.id;
                    const horaUltimo = conv.ultimo_mensaje?.creado_en
                      ? new Date(conv.ultimo_mensaje.creado_en).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : "";

                    return (
                      <button
                        key={c.id}
                        onClick={() => setPacienteChatSeleccionado(c)}
                        className={`w-full text-left p-3.5 flex items-center gap-3 transition cursor-pointer ${
                          seleccionado
                            ? "bg-[#468189]/15 border-l-4 border-[#468189]"
                            : "hover:bg-white/60"
                        }`}
                      >
                        <div className="relative shrink-0">
                          <div className="w-10 h-10 rounded-2xl bg-[#031926] text-white flex items-center justify-center font-bold text-xs shadow-xs">
                            {(c.nombre_completo || c.email || "U").charAt(0).toUpperCase()}
                          </div>
                          {conv.no_leidos > 0 && (
                            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-white font-extrabold text-[9px] flex items-center justify-center shadow-xs animate-bounce">
                              {conv.no_leidos}
                            </span>
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1">
                            <span className="text-xs font-bold text-[#031926] truncate block">
                              {c.nombre_completo || c.email?.split("@")[0]}
                            </span>
                            <span className="text-[10px] text-gray-400 shrink-0">
                              {horaUltimo}
                            </span>
                          </div>
                          <p className="text-[11px] text-[#468189] font-medium truncate mt-0.5">
                            {conv.ultimo_mensaje?.contenido || c.email}
                          </p>
                          {conv.especialista && conv.especialista.id !== c.id && (
                            <span className="inline-block text-[9px] text-[#77ACA2] font-semibold mt-0.5">
                              Con: {conv.especialista.nombre_completo || conv.especialista.email?.split("@")[0]}
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })}

                {/* 2. Otros usuarios registrados sin mensajes previos */}
                {pacientes
                  .filter((p) => p.id !== currentUser?.id)
                  .filter((p) => !conversacionesChat.some((c) => c.contacto?.id === p.id))
                  .filter((p) =>
                    busquedaChat
                      ? (p.nombre_completo || "").toLowerCase().includes(busquedaChat.toLowerCase()) ||
                        p.email.toLowerCase().includes(busquedaChat.toLowerCase())
                      : true
                  )
                  .map((p) => {
                    const seleccionado = pacienteChatSeleccionado?.id === p.id;
                    return (
                      <button
                        key={p.id}
                        onClick={() => setPacienteChatSeleccionado(p)}
                        className={`w-full text-left p-3.5 flex items-center gap-3 transition cursor-pointer ${
                          seleccionado
                            ? "bg-[#468189]/15 border-l-4 border-[#468189]"
                            : "hover:bg-white/60 opacity-80"
                        }`}
                      >
                        <div className="w-10 h-10 rounded-2xl bg-[#77ACA2]/40 text-[#031926] flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
                          {(p.nombre_completo || p.email).charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-[#031926] truncate block">
                              {p.nombre_completo || p.email.split("@")[0]}
                            </span>
                            <span className="text-[9px] uppercase px-1.5 py-0.2 rounded-md bg-[#9DBEBB]/30 text-[#031926]/70">
                              {p.rol}
                            </span>
                          </div>
                          <p className="text-[11px] text-[#031926]/50 truncate mt-0.5">
                            {p.email}
                          </p>
                        </div>
                      </button>
                    );
                  })}
              </div>
            </div>

            {/* Panel Derecho: Hilo de Chat */}
            <div className="flex-1 flex flex-col bg-white">
              {pacienteChatSeleccionado ? (
                <>
                  {/* Cabecera del hilo de conversación */}
                  <div className="p-4 border-b border-[#9DBEBB]/30 flex items-center justify-between bg-white shadow-xs">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-[#468189] text-white flex items-center justify-center font-bold text-sm shadow-xs">
                        {(pacienteChatSeleccionado.nombre_completo || pacienteChatSeleccionado.email).charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h4 className="text-sm font-extrabold text-[#031926]">
                          {pacienteChatSeleccionado.nombre_completo || pacienteChatSeleccionado.email.split("@")[0]}
                        </h4>
                        <p className="text-[11px] text-[#031926]/60">
                          {pacienteChatSeleccionado.rol === "psicologo"
                            ? "🩺 Psicóloga Especialista"
                            : pacienteChatSeleccionado.rol === "superadmin"
                            ? "👑 Super Admin"
                            : "👤 Consultante"} · {pacienteChatSeleccionado.email}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-[#468189] bg-[#77ACA2]/15 px-3 py-1 rounded-full font-semibold border border-[#77ACA2]/30">
                        Sesión Privada
                      </span>
                    </div>
                  </div>

                  {/* Feed de Mensajes */}
                  <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3 bg-[#FBF8F1]/40">
                    {mensajesChat.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center text-center p-8 text-[#031926]/60">
                        <div className="w-12 h-12 rounded-2xl bg-[#9DBEBB]/20 text-[#468189] flex items-center justify-center mb-3">
                          <MessageSquare className="w-6 h-6" />
                        </div>
                        <h5 className="text-sm font-bold text-[#031926]">
                          Aún no hay mensajes con este consultante
                        </h5>
                        <p className="text-xs text-[#031926]/70 mt-1 max-w-sm">
                          Envía un mensaje de bienvenida o responde a las preguntas de tu paciente sobre sus tareas y citas.
                        </p>
                      </div>
                    ) : (
                      mensajesChat.map((msg) => {
                        // Es saliente si lo envió el usuario actual o si fue dirigido al paciente consultado
                        const esSaliente =
                          msg.remitente_id === currentUser?.id ||
                          msg.destinatario_id === pacienteChatSeleccionado?.id;

                        const remitenteNombre =
                          msg.remitente_id === currentUser?.id
                            ? "Tú"
                            : (pacientes.find((p) => p.id === msg.remitente_id)?.nombre_completo ||
                               (msg.remitente_id.startsWith("14e6b") ? "Dra. Alyson López" : "Especialista"));

                        const hora = new Date(msg.creado_en).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        });

                        return (
                          <div
                            key={msg.id}
                            className={`flex flex-col ${esSaliente ? "items-end" : "items-start"}`}
                          >
                            <div
                              className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-xs sm:text-sm leading-relaxed shadow-xs ${
                                esSaliente
                                  ? "bg-[#468189] text-white rounded-br-xs"
                                  : "bg-white text-[#031926] border border-[#9DBEBB]/40 rounded-bl-xs"
                              }`}
                            >
                              {msg.contenido}
                            </div>
                            <span className="text-[10px] text-gray-400 mt-1 px-1 flex items-center gap-1">
                              <span>{remitenteNombre} · {hora}</span>
                              {esSaliente && <Check className="w-3 h-3 text-[#77ACA2]" />}
                            </span>
                          </div>
                        );
                      })
                    )}
                  </div>

                  {/* Formulario de Respuesta */}
                  <form
                    onSubmit={handleEnviarMensajeAdmin}
                    className="p-3.5 bg-white border-t border-[#9DBEBB]/30 flex items-center gap-2"
                  >
                    <input
                      type="text"
                      value={textoMensajeChat}
                      onChange={(e) => setTextoMensajeChat(e.target.value)}
                      placeholder={`Escribe un mensaje para ${pacienteChatSeleccionado.nombre_completo || "el consultante"}...`}
                      className="flex-1 bg-[#FBF8F1] border border-[#9DBEBB]/50 rounded-2xl px-4 py-2.5 text-xs sm:text-sm text-[#031926] focus:outline-none focus:ring-2 focus:ring-[#468189]"
                    />
                    <button
                      type="submit"
                      disabled={enviandoMensajeChat || !textoMensajeChat.trim()}
                      className="px-5 py-2.5 rounded-2xl bg-[#031926] hover:bg-[#468189] text-white text-xs sm:text-sm font-bold flex items-center gap-2 transition disabled:opacity-40 cursor-pointer shrink-0 shadow-md"
                    >
                      <Send className="w-4 h-4" />
                      <span>Enviar</span>
                    </button>
                  </form>
                </>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center p-8 text-[#031926]/60">
                  <div className="w-14 h-14 rounded-3xl bg-[#F4E9CD] text-[#468189] flex items-center justify-center mb-3">
                    <MessageSquare className="w-7 h-7" />
                  </div>
                  <h4 className="text-base font-extrabold text-[#031926]">
                    Messenger / Chat con Consultantes
                  </h4>
                  <p className="text-xs text-[#031926]/70 mt-1.5 max-w-sm leading-relaxed">
                    Selecciona un paciente de la lista izquierda para ver el historial y responder sus dudas en tiempo real.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* MODAL: ASIGNAR TAREA TERAPÉUTICA */}
      {mostrarModalTarea && (
        <div className="fixed inset-0 z-50 bg-[#031926]/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl border border-[#9DBEBB]/40">
            <h3 className="text-lg font-bold text-[#031926] mb-1">
              Asignar Tarea Terapéutica
            </h3>
            <p className="text-xs text-[#031926]/70 mb-4">
              El consultante verá esta actividad en su portal y podrá marcarla como completada.
            </p>

            <form onSubmit={handleCrearTarea} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#031926] mb-1">
                  Seleccionar Consultante
                </label>
                <select
                  value={pacienteSeleccionado}
                  onChange={(e) => setPacienteSeleccionado(e.target.value)}
                  required
                  className="w-full p-2.5 rounded-xl border border-[#9DBEBB]/60 text-xs text-[#031926] focus:outline-none focus:ring-2 focus:ring-[#468189] bg-white"
                >
                  <option value="">-- Elige un consultante --</option>
                  {pacientes
                    .filter((p) => p.rol !== "psicologo")
                    .map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.nombre_completo || p.email} ({p.email})
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#031926] mb-1">
                  Título de la Tarea / Ejercicio
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Registro de pensamientos automáticos en situaciones de estrés"
                  value={tituloTarea}
                  onChange={(e) => setTituloTarea(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-[#9DBEBB]/60 text-xs text-[#031926] focus:outline-none focus:ring-2 focus:ring-[#468189]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#031926] mb-1">
                  Instrucciones o Guía para el paciente
                </label>
                <textarea
                  rows={3}
                  placeholder="Explica detalladamente cómo debe realizar el ejercicio y qué aspectos debe observar..."
                  value={descripcionTarea}
                  onChange={(e) => setDescripcionTarea(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-[#9DBEBB]/60 text-xs text-[#031926] focus:outline-none focus:ring-2 focus:ring-[#468189]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#031926] mb-1">
                  Fecha Límite (Opcional)
                </label>
                <input
                  type="date"
                  value={fechaLimiteTarea}
                  onChange={(e) => setFechaLimiteTarea(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-[#9DBEBB]/60 text-xs text-[#031926] focus:outline-none focus:ring-2 focus:ring-[#468189]"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setMostrarModalTarea(false)}
                  className="w-1/2 py-2.5 rounded-xl border border-[#9DBEBB]/60 text-[#031926]/70 font-semibold text-xs hover:bg-[#FBF8F1] transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={guardandoTarea}
                  className="w-1/2 py-2.5 rounded-xl bg-[#468189] hover:bg-[#031926] text-white font-semibold text-xs shadow-md shadow-[#468189]/20 transition cursor-pointer disabled:opacity-60"
                >
                  {guardandoTarea ? "Asignando..." : "Asignar Tarea"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: EDITAR ENLACE DE REUNIÓN VIRTUAL */}
      {citaParaEditar && (
        <div className="fixed inset-0 z-50 bg-[#031926]/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-3xl p-6 sm:p-7 shadow-2xl border border-[#9DBEBB]/40 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#9DBEBB]/30">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-200 shadow-2xs">
                  <Video className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#031926]">
                    Enlace de Sesión Virtual (Google Meet)
                  </h3>
                  <p className="text-xs text-[#031926]/70">
                    Consultante: {citaParaEditar.paciente?.nombre_completo || citaParaEditar.paciente?.email || "Paciente"}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setCitaParaEditar(null)}
                className="text-gray-400 hover:text-[#031926] p-1.5 cursor-pointer rounded-xl hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Opciones rápidas para enlaces 100% reales de Google Meet */}
            <div className="p-3.5 rounded-2xl bg-[#FBF8F1] border border-[#9DBEBB]/40 space-y-2.5">
              <span className="text-[11px] font-bold text-[#468189] uppercase tracking-wider block">
                Generar o asignar reunión auténtica:
              </span>
              <div className="flex flex-wrap gap-2">
                {enlaceMeetPersonal && (
                  <button
                    type="button"
                    onClick={() => setNuevoEnlace(enlaceMeetPersonal)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition cursor-pointer shadow-2xs"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Usar mi sala oficial de Meet</span>
                  </button>
                )}

                <a
                  href="https://meet.google.com/new"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition cursor-pointer shadow-2xs"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Crear nueva sala en Google Meet ↗</span>
                </a>
              </div>
              <p className="text-[10px] text-gray-500 leading-relaxed">
                💡 Haz clic en <strong>"Crear nueva sala"</strong> para abrir Google Meet en tu cuenta de Google. Google generará una reunión real; copia el enlace de la barra del navegador y pégalo abajo.
              </p>
            </div>

            <form onSubmit={handleGuardarEnlace} className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-[#031926]">
                    Enlace de Google Meet para la Sesión
                  </label>
                  {nuevoEnlace && (
                    <a
                      href={nuevoEnlace}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] font-bold text-emerald-700 hover:underline flex items-center gap-1"
                    >
                      <span>Probar enlace</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
                <div className="relative">
                  <Video className="w-4 h-4 text-[#77ACA2] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="url"
                    required
                    placeholder="https://meet.google.com/xxx-yyyy-zzz"
                    value={nuevoEnlace}
                    onChange={(e) => setNuevoEnlace(e.target.value)}
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-[#9DBEBB]/60 text-xs text-[#031926] focus:outline-none focus:ring-2 focus:ring-[#468189] font-mono bg-white"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-2 border-t border-[#9DBEBB]/30">
                <button
                  type="button"
                  onClick={() => setCitaParaEditar(null)}
                  className="w-1/2 py-2.5 rounded-xl border border-[#9DBEBB]/60 text-[#031926]/70 font-semibold text-xs hover:bg-[#FBF8F1] transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-2.5 rounded-xl bg-[#468189] hover:bg-[#031926] text-white font-semibold text-xs shadow-md shadow-[#468189]/20 transition cursor-pointer"
                >
                  Guardar Enlace
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: REPROGRAMAR / EDITAR CITA */}
      {citaParaReprogramar && (
        <div className="fixed inset-0 z-50 bg-[#031926]/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-3xl p-6 shadow-2xl border border-[#9DBEBB]/40 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#9DBEBB]/30">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#9DBEBB]/20 text-[#468189] flex items-center justify-center">
                  <RefreshCw className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#031926]">
                    Reprogramar / Gestionar Cita
                  </h3>
                  <p className="text-xs text-[#031926]/70">
                    Consultante: {citaParaReprogramar.paciente?.nombre_completo || citaParaReprogramar.paciente?.email || "Paciente"}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setCitaParaReprogramar(null)}
                className="text-gray-400 hover:text-[#031926] p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleGuardarReprogramacion} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#031926] mb-1">
                    Nueva Fecha
                  </label>
                  <input
                    type="date"
                    required
                    value={reprogramarFecha}
                    onChange={(e) => setReprogramarFecha(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-[#9DBEBB]/60 text-xs text-[#031926] focus:outline-none focus:ring-2 focus:ring-[#468189]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#031926] mb-1">
                    Nueva Hora
                  </label>
                  <input
                    type="time"
                    required
                    value={reprogramarHora}
                    onChange={(e) => setReprogramarHora(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-[#9DBEBB]/60 text-xs text-[#031926] focus:outline-none focus:ring-2 focus:ring-[#468189]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#031926] mb-1">
                  Estado de la Cita
                </label>
                <select
                  value={reprogramarEstado}
                  onChange={(e) => setReprogramarEstado(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-[#9DBEBB]/60 text-xs text-[#031926] focus:outline-none focus:ring-2 focus:ring-[#468189] bg-white"
                >
                  <option value="pendiente">Pendiente</option>
                  <option value="confirmada">Confirmada</option>
                  <option value="finalizado">Finalizada (Habilitar Calificación)</option>
                  <option value="cancelada">Cancelada</option>
                </select>
              </div>

              {citaParaReprogramar.modalidad === "virtual" && (
                <div className="space-y-2 p-3.5 bg-[#FBF8F1] rounded-2xl border border-[#9DBEBB]/40">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <label className="block text-xs font-bold text-[#031926]">
                      Enlace de Google Meet (Reunión Virtual)
                    </label>
                    <div className="flex items-center gap-2">
                      {enlaceMeetPersonal && (
                        <button
                          type="button"
                          onClick={() => setReprogramarEnlace(enlaceMeetPersonal)}
                          className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 hover:underline cursor-pointer"
                        >
                          <Check className="w-3 h-3 text-emerald-600" />
                          <span>Usar mi Meet oficial</span>
                        </button>
                      )}
                      <a
                        href="https://meet.google.com/new"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 hover:underline cursor-pointer"
                        title="Abre Google Meet para generar una sala auténtica"
                      >
                        <ExternalLink className="w-3 h-3" />
                        <span>Crear sala en Google Meet ↗</span>
                      </a>
                    </div>
                  </div>

                  <div className="relative">
                    <Video className="w-4 h-4 text-[#77ACA2] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="url"
                      value={reprogramarEnlace}
                      onChange={(e) => setReprogramarEnlace(e.target.value)}
                      placeholder="https://meet.google.com/xxx-yyyy-zzz"
                      className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-[#9DBEBB]/60 text-xs text-[#031926] focus:outline-none focus:ring-2 focus:ring-[#468189] font-mono bg-white"
                    />
                  </div>

                  {reprogramarEnlace && (
                    <div className="flex items-center justify-between text-[10px] text-gray-500 pt-0.5">
                      <span>Verifica que la reunión funcione:</span>
                      <a
                        href={reprogramarEnlace}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-emerald-700 font-bold hover:underline flex items-center gap-1"
                      >
                        <span>Probar enlace de Google Meet</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  )}
                </div>
              )}

              <div className="flex gap-2 pt-2 border-t border-[#9DBEBB]/30">
                <button
                  type="button"
                  onClick={() => setCitaParaReprogramar(null)}
                  className="w-1/2 py-2.5 rounded-xl border border-[#9DBEBB]/60 text-[#031926]/70 font-semibold text-xs hover:bg-[#FBF8F1] transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={guardandoReprogramacion}
                  className="w-1/2 py-2.5 rounded-xl bg-[#468189] hover:bg-[#031926] text-white font-semibold text-xs shadow-md transition cursor-pointer disabled:opacity-60"
                >
                  {guardandoReprogramacion ? "Guardando..." : "Guardar Cambios"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CONFIGURAR HORARIOS Y DISPONIBILIDAD */}
      {mostrarModalDisponibilidad && (
        <div className="fixed inset-0 z-50 bg-[#031926]/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-3xl p-6 shadow-2xl border border-[#9DBEBB]/40 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#9DBEBB]/30">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#F4E9CD] text-[#031926] flex items-center justify-center">
                  <CalendarDays className="w-5 h-5 text-[#468189]" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#031926]">
                    Mis Horarios y Disponibilidad
                  </h3>
                  <p className="text-xs text-[#031926]/70">
                    Define tus días laborales y franja horaria para las reservas de tus pacientes.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setMostrarModalDisponibilidad(false)}
                className="text-gray-400 hover:text-[#031926] p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleGuardarDisponibilidad} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#031926] mb-2">
                  Días de Atención Semanal
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {[
                    { id: "lunes", label: "Lunes" },
                    { id: "martes", label: "Martes" },
                    { id: "miercoles", label: "Miércoles" },
                    { id: "jueves", label: "Jueves" },
                    { id: "viernes", label: "Viernes" },
                    { id: "sabado", label: "Sábado" },
                  ].map((dia) => {
                    const activo = diasLaborales.includes(dia.id);
                    return (
                      <button
                        key={dia.id}
                        type="button"
                        onClick={() => {
                          if (activo) {
                            setDiasLaborales(diasLaborales.filter((d) => d !== dia.id));
                          } else {
                            setDiasLaborales([...diasLaborales, dia.id]);
                          }
                        }}
                        className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center justify-between cursor-pointer transition ${
                          activo
                            ? "bg-[#468189] text-white border-[#468189]"
                            : "bg-white text-[#031926]/70 border-[#9DBEBB]/50 hover:bg-[#FBF8F1]"
                        }`}
                      >
                        <span>{dia.label}</span>
                        {activo && <Check className="w-3.5 h-3.5" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#031926] mb-1">
                    Hora Inicio
                  </label>
                  <input
                    type="time"
                    value={horaInicioLab}
                    onChange={(e) => setHoraInicioLab(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-[#9DBEBB]/60 text-xs text-[#031926] focus:outline-none focus:ring-2 focus:ring-[#468189]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#031926] mb-1">
                    Hora Fin
                  </label>
                  <input
                    type="time"
                    value={horaFinLab}
                    onChange={(e) => setHoraFinLab(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-[#9DBEBB]/60 text-xs text-[#031926] focus:outline-none focus:ring-2 focus:ring-[#468189]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#031926] mb-1">
                  Duración de cada sesión
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[45, 50, 60].map((dur) => (
                    <button
                      key={dur}
                      type="button"
                      onClick={() => setDuracionLab(dur)}
                      className={`p-2 rounded-xl border text-xs font-bold transition cursor-pointer ${
                        duracionLab === dur
                          ? "bg-[#031926] text-white border-[#031926]"
                          : "bg-white text-[#031926]/70 border-[#9DBEBB]/50"
                      }`}
                    >
                      {dur} minutos
                    </button>
                  ))}
                </div>
              </div>

              {/* Conexión de Sala Permanente de Google Meet */}
              <div className="p-4 rounded-2xl bg-emerald-50/90 border border-emerald-300 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Video className="w-4 h-4 text-emerald-700" />
                    <label className="block text-xs font-bold text-emerald-950">
                      Tu Sala Permanente de Google Meet
                    </label>
                  </div>
                  <span className="text-[10px] bg-emerald-200/70 text-emerald-900 font-extrabold px-2 py-0.5 rounded-full">
                    REUNIÓN VÁLIDA
                  </span>
                </div>
                <p className="text-[11px] text-emerald-800 leading-relaxed">
                  Para que las citas virtuales se conecten siempre a una reunión válida donde tú seas la anfitriona oficial, ingresa aquí tu enlace de Google Meet. Todas las citas que agenden tus consultantes tendrán este enlace asignado automáticamente.
                </p>
                <div className="relative">
                  <Video className="w-4 h-4 text-emerald-600 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="url"
                    placeholder="https://meet.google.com/abc-defg-hij"
                    value={enlaceMeetPersonal}
                    onChange={(e) => setEnlaceMeetPersonal(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-emerald-300 text-xs text-[#031926] bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600 shadow-2xs font-mono"
                  />
                </div>
                <div className="flex items-center justify-between text-[10px] text-emerald-800/90 pt-1">
                  <span>💡 Tip: Puedes crear una reunión en <a href="https://meet.google.com" target="_blank" rel="noopener noreferrer" className="underline font-bold">meet.google.com</a>, copiar el enlace y pegarlo aquí.</span>
                </div>
              </div>

              <div className="flex gap-2 pt-2 border-t border-[#9DBEBB]/30">
                <button
                  type="button"
                  onClick={() => setMostrarModalDisponibilidad(false)}
                  className="w-1/2 py-2.5 rounded-xl border border-[#9DBEBB]/60 text-[#031926]/70 font-semibold text-xs hover:bg-[#FBF8F1] transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={guardandoDisponibilidad}
                  className="w-1/2 py-2.5 rounded-xl bg-[#468189] hover:bg-[#031926] text-white font-semibold text-xs shadow-md transition cursor-pointer disabled:opacity-60"
                >
                  {guardandoDisponibilidad ? "Guardando..." : "Guardar Disponibilidad"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#FBF8F1] flex items-center justify-center">
          <div className="w-10 h-10 border-4 border-[#468189] border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <AdminContent />
    </Suspense>
  );
}
