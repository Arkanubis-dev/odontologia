"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Brain,
  Calendar,
  ClipboardList,
  Smile,
  User,
  LogOut,
  Video,
  MapPin,
  CheckCircle2,
  Circle,
  Plus,
  Clock,
  Sparkles,
  ShieldCheck,
  Send,
  Star,
  ExternalLink,
  MessageSquare
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import CalendarioCitas, { PsicologoInfo } from "@/components/CalendarioCitas";
import ChatFlotante from "@/components/ChatFlotante";

interface Cita {
  id: string;
  paciente_id?: string;
  psicologo_id?: string;
  fecha_hora: string;
  modalidad: "virtual" | "presencial";
  enlace_reunion?: string;
  estado: "pendiente" | "confirmada" | "completada" | "cancelada" | "finalizado";
  notas_paciente?: string;
  psicologo?: {
    id: string;
    nombre_completo?: string;
    email: string;
    avatar_url?: string;
  };
}

interface Tarea {
  id: string;
  titulo: string;
  descripcion: string;
  fecha_limite?: string;
  completada: boolean;
  reflexion_paciente?: string;
}

interface RegistroEmocional {
  id: string;
  nivel_animo: number;
  emocion_principal: string;
  notas: string;
  creado_en: string;
}

interface Calificacion {
  id?: string;
  cita_id: string;
  estrellas: number;
  comentario: string;
  nombre_mostrar?: string;
}

function PortalContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isDemo = searchParams.get("demo") === "true";

  const [user, setUser] = useState<{
    id?: string;
    email?: string;
    nombre?: string;
    avatar?: string;
    rol?: string;
  } | null>(null);

  const [activeTab, setActiveTab] = useState<"citas" | "tareas" | "animo" | "perfil">("citas");
  const [loading, setLoading] = useState(true);

  // Estados de datos
  const [citas, setCitas] = useState<Cita[]>([]);
  const [tareas, setTareas] = useState<Tarea[]>([]);
  const [registrosEmocionales, setRegistrosEmocionales] = useState<RegistroEmocional[]>([]);
  const [calificaciones, setCalificaciones] = useState<Record<string, Calificacion>>({});

  // Estados de calificación de sesión
  const [citaACalificar, setCitaACalificar] = useState<Cita | null>(null);
  const [estrellasCalificar, setEstrellasCalificar] = useState<number>(5);
  const [comentarioCalificar, setComentarioCalificar] = useState<string>("");
  const [enviandoCalificacion, setEnviandoCalificacion] = useState<boolean>(false);

  // Estados de formularios interactivos
  const [nuevoAnimo, setNuevoAnimo] = useState<number>(4);
  const [nuevaNotaAnimo, setNuevaNotaAnimo] = useState("");
  const [nuevaEmocion, setNuevaEmocion] = useState("Tranquilidad");

  const [mostrarModalCita, setMostrarModalCita] = useState(false);
  const [fechaCita, setFechaCita] = useState("");
  const [modalidadCita, setModalidadCita] = useState<"virtual" | "presencial">("virtual");
  const [motivoCita, setMotivoCita] = useState("");
  const [guardandoCita, setGuardandoCita] = useState(false);
  const [psicologoSeleccionadoId, setPsicologoSeleccionadoId] = useState<string>("");
  const [psicologos, setPsicologos] = useState<PsicologoInfo[]>([]);

  // Cargar usuario y datos
  useEffect(() => {
    async function init() {
      const supabase = createClient();

      if (isDemo) {
        setUser({
          email: "consultante.demo@gmail.com",
          nombre: "Camilo Baquero (Demo)",
          avatar: "",
        });
        cargarDatosDemo();
        setLoading(false);
        return;
      }

      if (!supabase) {
        setLoading(false);
        return;
      }

      const { data: { user: authUser } } = await supabase.auth.getUser();

      if (!authUser) {
        // Redirigir al login si no hay sesión
        router.push("/login");
        return;
      }

      const nombre =
        authUser.user_metadata?.full_name ||
        authUser.user_metadata?.name ||
        authUser.email?.split("@")[0] ||
        "Consultante";

      const { data: perfilData } = await supabase
        .from("perfiles")
        .select("rol")
        .eq("id", authUser.id)
        .single();

      setUser({
        id: authUser.id,
        email: authUser.email,
        nombre: nombre,
        avatar: authUser.user_metadata?.avatar_url,
        rol: perfilData?.rol,
      });

      // Cargar datos reales desde Supabase estrictamente del consultante autenticado
      try {
        const [citasRes, tareasRes, animoRes, califRes] = await Promise.all([
          supabase
            .from("citas")
            .select("*")
            .eq("paciente_id", authUser.id)
            .order("fecha_hora", { ascending: true }),
          supabase
            .from("tareas_terapia")
            .select("*")
            .eq("paciente_id", authUser.id)
            .order("creado_en", { ascending: false }),
          supabase
            .from("registro_emocional")
            .select("*")
            .eq("paciente_id", authUser.id)
            .order("creado_en", { ascending: false })
            .limit(10),
          supabase
            .from("calificaciones")
            .select("*")
            .eq("paciente_id", authUser.id),
        ]);

        // Cargar calificaciones reales del paciente
        try {
          const califApiRes = await fetch(`/api/calificaciones?paciente_id=${authUser.id}`);
          if (califApiRes.ok) {
            const califApiData = await califApiRes.json();
            if (Array.isArray(califApiData) && califApiData.length > 0) {
              const map: Record<string, Calificacion> = {};
              califApiData.forEach((c: any) => {
                map[c.cita_id] = c;
              });
              setCalificaciones(map);
            }
          }
        } catch {
          if (califRes.data && califRes.data.length > 0) {
            const map: Record<string, Calificacion> = {};
            califRes.data.forEach((c: any) => {
              map[c.cita_id] = c;
            });
            setCalificaciones(map);
          }
        }

        // Cargar registros emocionales vía API (evita bloqueos de RLS)
        try {
          const animoApiRes = await fetch(`/api/registro-emocional?paciente_id=${authUser.id}`);
          if (animoApiRes.ok) {
            const animoApiData = await animoApiRes.json();
            if (Array.isArray(animoApiData.registros)) {
              setRegistrosEmocionales(animoApiData.registros);
            }
          } else if (animoRes.data) {
            setRegistrosEmocionales(animoRes.data);
          }
        } catch {
          if (animoRes.data) {
            setRegistrosEmocionales(animoRes.data);
          }
        }

        // Cargar lista de psicólogas / especialistas disponibles
        let psicosList: PsicologoInfo[] = [];
        try {
          const { data: psicosData } = await supabase
            .from("perfiles")
            .select("id, nombre_completo, email, avatar_url, rol")
            .in("rol", ["psicologo", "superadmin", "admin"]);

          if (psicosData && psicosData.length > 0) {
            // Si el usuario actual es uno de ellos (ej: Brayan probando el portal), no mostrarse a sí mismo como psicólogo si hay otros
            const filtrados = psicosData.filter((p: any) => p.id !== authUser.id);
            const listaFinal = filtrados.length > 0 ? filtrados : psicosData;

            psicosList = listaFinal.map((p: any) => ({
              id: p.id,
              nombre_completo: p.nombre_completo || (p.email.includes("alyson") ? "Alyson López Sánchez" : "Especialista Clínico"),
              email: p.email,
              avatar_url: p.avatar_url,
              especialidad: p.rol === "psicologo" ? "Psicóloga Clínica y Terapéutica" : "Coordinación y Soporte Clínico",
            }));
          }
        } catch {}

        if (psicosList.length === 0) {
          psicosList = [
            {
              id: "14e6b3b4-3202-4620-9eb9-a9f905e635d0",
              nombre_completo: "Alyson López Sánchez",
              email: "alysonlopezsanchez@gmail.com",
              avatar_url: "/alejandra-bedoya.jpg",
              especialidad: "Psicóloga Clínica y Terapéutica",
            },
          ];
        }

        setPsicologos(psicosList);
        setPsicologoSeleccionadoId(psicosList[0].id);

        const mapaPsico: Record<string, any> = {};
        psicosList.forEach((p) => {
          mapaPsico[p.id] = p;
        });

        if (citasRes.data && citasRes.data.length > 0) {
          setCitas(
            citasRes.data.map((c: any) => ({
              ...c,
              psicologo: mapaPsico[c.psicologo_id] || psicosList[0],
            }))
          );
        } else {
          setCitas([]);
        }

        if (tareasRes.data && tareasRes.data.length > 0) {
          setTareas(tareasRes.data);
        } else {
          setTareas([]);
        }

        if (animoRes.data) {
          setRegistrosEmocionales(animoRes.data);
        } else {
          setRegistrosEmocionales([]);
        }
      } catch (err) {
        console.error("Error al cargar datos:", err);
      } finally {
        setLoading(false);
      }
    }

    init();
  }, [isDemo, router]);

  const cargarDatosDemo = () => {
    setCitas([
      {
        id: "demo-c1",
        fecha_hora: new Date(Date.now() + 86400000 * 2).toISOString(),
        modalidad: "virtual",
        enlace_reunion: "https://meet.google.com/psico-consulta",
        estado: "confirmada",
        notas_paciente: "Revisión de avance semanal y técnicas de autorregulación",
      },
      {
        id: "demo-c2",
        fecha_hora: new Date(Date.now() - 86400000 * 7).toISOString(),
        modalidad: "presencial",
        estado: "completada",
        notas_paciente: "Primera sesión exploratoria",
      },
    ]);

    setTareas([
      {
        id: "demo-t1",
        titulo: "Identificar detonantes de estrés",
        descripcion: "Escribe dos situaciones de la semana donde sentiste sobrecarga y cómo reaccionaste.",
        fecha_limite: "Próxima sesión",
        completada: false,
        reflexion_paciente: "Me di cuenta de que el exceso de reuniones me genera cansancio mental.",
      },
      {
        id: "demo-t2",
        titulo: "Caminata consciente de 15 minutos",
        descripcion: "Salir a caminar sin audífonos enfocándote en los sonidos del entorno.",
        fecha_limite: "Completado",
        completada: true,
        reflexion_paciente: "Me ayudó mucho a despejar la mente el martes por la tarde.",
      },
    ]);

    setRegistrosEmocionales([
      {
        id: "demo-r1",
        nivel_animo: 4,
        emocion_principal: "Tranquilidad",
        notas: "Día productivo, logré desconectarme a tiempo del trabajo.",
        creado_en: new Date().toISOString(),
      },
    ]);
  };

  // Enviar calificación de sesión finalizada
  const handleEnviarCalificacion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!citaACalificar) return;

    setEnviandoCalificacion(true);
    const nuevaCalif: Calificacion = {
      cita_id: citaACalificar.id,
      estrellas: estrellasCalificar,
      comentario: comentarioCalificar,
      nombre_mostrar: user?.nombre || "Consultante",
    };

    setCalificaciones((prev) => ({
      ...prev,
      [citaACalificar.id]: nuevaCalif,
    }));

    if (!isDemo && user?.id) {
      try {
        const res = await fetch("/api/calificaciones", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            cita_id: citaACalificar.id,
            paciente_id: user.id,
            estrellas: estrellasCalificar,
            comentario: comentarioCalificar,
            nombre_mostrar: user.nombre || "Consultante",
          }),
        });

        if (!res.ok) {
          const errData = await res.json();
          console.error("Error al registrar calificación:", errData);
        }
      } catch (err) {
        console.error("Error de red al calificar:", err);
      }
    }

    setEnviandoCalificacion(false);
    setCitaACalificar(null);
    setComentarioCalificar("");
    setEstrellasCalificar(5);
  };

  // Marcar tarea como completada o pendiente
  const toggleTarea = async (id: string, estadoActual: boolean) => {
    const nuevoEstado = !estadoActual;
    setTareas(tareas.map((t) => (t.id === id ? { ...t, completada: nuevoEstado } : t)));

    if (!isDemo) {
      const supabase = createClient();
      if (supabase) {
        await supabase.from("tareas_terapia").update({ completada: nuevoEstado }).eq("id", id);
      }
    }
  };

  // Guardar nuevo registro emocional
  const handleGuardarAnimo = async (e: React.FormEvent) => {
    e.preventDefault();
    const nuevo = {
      id: "animo-" + Date.now(),
      nivel_animo: nuevoAnimo,
      emocion_principal: nuevaEmocion,
      notas: nuevaNotaAnimo,
      creado_en: new Date().toISOString(),
    };

    setRegistrosEmocionales([nuevo, ...registrosEmocionales]);
    setNuevaNotaAnimo("");

    if (!isDemo && user?.id) {
      try {
        const res = await fetch("/api/registro-emocional", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            paciente_id: user.id,
            nivel_animo: nuevoAnimo,
            emocion_principal: nuevaEmocion,
            notas: nuevaNotaAnimo,
          }),
        });

        if (res.ok) {
          const data = await res.json();
          if (data.registro) {
            setRegistrosEmocionales((prev) => [
              data.registro,
              ...prev.filter((r) => r.id !== nuevo.id),
            ]);
          }
        } else {
          console.error("Error al guardar estado de ánimo:", await res.json());
        }
      } catch (err) {
        console.error("Error de red al guardar estado de ánimo:", err);
      }
    }
  };

  // Solicitar nueva cita
  const handleCrearCita = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fechaCita) {
      alert("Por favor selecciona un día y una hora disponible en el calendario.");
      return;
    }

    setGuardandoCita(true);

    try {
      if (isDemo) {
        const nueva: Cita = {
          id: "cita-" + Date.now(),
          fecha_hora: fechaCita,
          modalidad: modalidadCita,
          enlace_reunion: modalidadCita === "virtual" ? "https://meet.google.com/psico-consulta" : undefined,
          estado: "confirmada",
          notas_paciente: motivoCita,
          psicologo_id: psicologoSeleccionadoId,
          psicologo: psicologos.find((p) => p.id === psicologoSeleccionadoId),
        };
        setCitas([nueva, ...citas]);
      } else if (user?.id) {
        const res = await fetch("/api/citas", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            paciente_id: user.id,
            fecha_hora: fechaCita,
            modalidad: modalidadCita,
            notas_paciente: motivoCita,
            psicologo_id: psicologoSeleccionadoId || undefined,
          }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "No se pudo agendar la cita");

        const psicoObj = psicologos.find((p) => p.id === psicologoSeleccionadoId) || psicologos[0];
        setCitas([{ ...data.cita, psicologo: psicoObj }, ...citas]);
      }

      setMostrarModalCita(false);
      setFechaCita("");
      setMotivoCita("");
      alert("¡Cita agendada exitosamente! Tu especialista ya puede verla y prepararse para la sesión.");
    } catch (err: any) {
      alert("Error al agendar cita: " + err.message);
    } finally {
      setGuardandoCita(false);
    }
  };

  // Cerrar Sesión
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
          <p className="text-sm font-semibold text-[#031926]">Cargando tu espacio terapéutico...</p>
        </div>
      </div>
    );
  }

  const caritas = [
    { nivel: 1, emoji: "😔", etiqueta: "Muy bajo" },
    { nivel: 2, emoji: "😐", etiqueta: "Bajo / Cansado" },
    { nivel: 3, emoji: "🙂", etiqueta: "Tranquilo" },
    { nivel: 4, emoji: "😊", etiqueta: "Bien" },
    { nivel: 5, emoji: "🌟", etiqueta: "Excelente" },
  ];

  return (
    <div className="min-h-screen bg-[#FBF8F1] text-[#031926] font-sans selection:bg-[#9DBEBB]/40 selection:text-[#031926]">
      {/* Top Bar */}
      <header className="border-b border-[#9DBEBB]/30 bg-white/95 backdrop-blur-md sticky top-0 z-30 shadow-xs">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-[#468189] flex items-center justify-center text-white shadow-sm shadow-[#468189]/20">
                <Brain className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-sm font-bold text-[#031926] leading-tight">
                  {psicologos[0]?.nombre_completo || "Alyson López Sánchez"}
                </h1>
                <p className="text-[10px] text-[#468189] font-semibold">Psicología Clínica & Terapéutica</p>
              </div>
            </Link>
          </div>

          {/* User info and Logout */}
          <div className="flex items-center gap-3 sm:gap-4">
            {(user?.rol === "psicologo" ||
              user?.rol === "admin" ||
              user?.rol === "superadmin" ||
              user?.email?.toLowerCase() === "brayancamilo2407@gmail.com" ||
              user?.email?.toLowerCase().includes("alejandra")) && (
              <Link
                href="/admin"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#031926] text-white text-xs font-semibold hover:bg-[#468189] shadow-xs transition"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-[#77ACA2]" />
                <span>{user?.email?.toLowerCase() === "brayancamilo2407@gmail.com" ? "Panel Super Admin" : "Panel Profesional"}</span>
              </Link>
            )}

            {isDemo && (
              <span className="hidden sm:inline-block px-2.5 py-0.5 bg-[#F4E9CD] text-[#031926] text-xs font-semibold rounded-full border border-[#9DBEBB]/40">
                Modo Demostración
              </span>
            )}
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-[#9DBEBB]/30 text-[#031926] font-bold text-xs flex items-center justify-center border border-[#77ACA2]/50">
                {user?.avatar ? (
                  <img src={user.avatar} alt="Avatar" className="w-full h-full rounded-full" />
                ) : (
                  user?.nombre?.charAt(0).toUpperCase() || "P"
                )}
              </div>
              <span className="hidden md:inline text-xs font-semibold text-[#031926]">
                {user?.nombre}
              </span>
            </div>
            <button
              onClick={handleCerrarSesion}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-[#031926]/70 hover:text-rose-600 hover:bg-rose-50 border border-[#9DBEBB]/40 transition cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Cerrar Sesión</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Encabezado Editorial Humano y Sereno (Impeccable Craft) */}
        <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-[#9DBEBB]/30">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#031926] tracking-tight">
              Bienvenido, {user?.nombre?.split(" ")[0]}
            </h1>
            <p className="text-xs sm:text-sm text-[#031926]/70 mt-1.5 max-w-2xl leading-relaxed">
              Tu portal privado y confidencial para coordinar sesiones clínicas, revisar actividades terapéuticas y registrar tu evolución con tu especialista.
            </p>
          </div>
          <button
            onClick={() => setMostrarModalCita(true)}
            className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-[#031926] hover:bg-[#468189] text-white font-bold text-xs sm:text-sm shadow-md transition cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4 text-[#77ACA2]" />
            <span>Solicitar Nueva Cita</span>
          </button>
        </div>

        {/* Layout en Dos Columnas: elimina el vacío lateral y crea armonía clínica */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Columna Principal (8 columnas) */}
          <div className="lg:col-span-8 space-y-6">
            {/* Navegación por pestañas estilizada */}
            <div className="flex items-center gap-1.5 p-1.5 bg-white/80 border border-[#9DBEBB]/40 rounded-2xl shadow-2xs overflow-x-auto">
              <button
                onClick={() => setActiveTab("citas")}
                className={`inline-flex items-center gap-2 py-2 px-4 text-xs sm:text-sm font-semibold rounded-xl transition cursor-pointer shrink-0 ${
                  activeTab === "citas"
                    ? "bg-[#031926] text-white shadow-xs"
                    : "text-[#031926]/70 hover:text-[#031926] hover:bg-[#9DBEBB]/15"
                }`}
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>Mis Citas</span>
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                    activeTab === "citas"
                      ? "bg-white/20 text-white"
                      : "bg-[#9DBEBB]/30 text-[#031926]"
                  }`}
                >
                  {citas.length}
                </span>
              </button>

              <button
                onClick={() => setActiveTab("tareas")}
                className={`inline-flex items-center gap-2 py-2 px-4 text-xs sm:text-sm font-semibold rounded-xl transition cursor-pointer shrink-0 ${
                  activeTab === "tareas"
                    ? "bg-[#031926] text-white shadow-xs"
                    : "text-[#031926]/70 hover:text-[#031926] hover:bg-[#9DBEBB]/15"
                }`}
              >
                <ClipboardList className="w-3.5 h-3.5" />
                <span>Tareas Terapéuticas</span>
                {tareas.filter((t) => !t.completada).length > 0 && (
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                      activeTab === "tareas"
                        ? "bg-white/20 text-white"
                        : "bg-[#F4E9CD] text-[#031926]"
                    }`}
                  >
                    {tareas.filter((t) => !t.completada).length}
                  </span>
                )}
              </button>

              <button
                onClick={() => setActiveTab("animo")}
                className={`inline-flex items-center gap-2 py-2 px-4 text-xs sm:text-sm font-semibold rounded-xl transition cursor-pointer shrink-0 ${
                  activeTab === "animo"
                    ? "bg-[#031926] text-white shadow-xs"
                    : "text-[#031926]/70 hover:text-[#031926] hover:bg-[#9DBEBB]/15"
                }`}
              >
                <Smile className="w-3.5 h-3.5" />
                <span>Diario Emocional</span>
              </button>

              <button
                onClick={() => setActiveTab("perfil")}
                className={`inline-flex items-center gap-2 py-2 px-4 text-xs sm:text-sm font-semibold rounded-xl transition cursor-pointer shrink-0 ${
                  activeTab === "perfil"
                    ? "bg-[#031926] text-white shadow-xs"
                    : "text-[#031926]/70 hover:text-[#031926] hover:bg-[#9DBEBB]/15"
                }`}
              >
                <User className="w-3.5 h-3.5" />
                <span>Mi Perfil</span>
              </button>
            </div>

        {/* TAB 1: CITAS */}
        {activeTab === "citas" && (
          <div className="space-y-4">
            {citas.length === 0 ? (
              <div className="bg-white rounded-2xl p-10 text-center border border-[#9DBEBB]/40">
                <Calendar className="w-10 h-10 text-[#9DBEBB] mx-auto mb-3" />
                <h3 className="text-base font-bold text-[#031926]">No tienes citas agendadas</h3>
                <p className="text-xs text-[#031926]/70 mt-1 mb-4">
                  Coordina tu próxima sesión terapéutica con tu especialista cuando lo desees.
                </p>
                <button
                  onClick={() => setMostrarModalCita(true)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#468189] text-white text-xs font-semibold hover:bg-[#031926] transition cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  Solicitar Cita
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-5">
                {citas.map((cita) => {
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

                  const esFinalizada = cita.estado === "completada" || cita.estado === "finalizado";

                  return (
                    <div
                      key={cita.id}
                      className="bg-white rounded-3xl p-6 sm:p-7 border border-[#9DBEBB]/40 shadow-xs hover:shadow-md transition duration-200"
                    >
                      <div className="flex items-start justify-between gap-3 mb-4">
                        <div className="flex items-center gap-2">
                          <span
                            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
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
                            className={`px-3 py-1 rounded-full text-xs font-semibold ${
                              cita.estado === "confirmada"
                                ? "bg-emerald-50 text-emerald-800 border border-emerald-300"
                                : cita.estado === "pendiente"
                                ? "bg-amber-50 text-amber-800 border border-amber-300"
                                : "bg-[#9DBEBB]/20 text-[#031926] border border-[#77ACA2]/40"
                            }`}
                          >
                            {esFinalizada
                              ? "Finalizada"
                              : cita.estado.charAt(0).toUpperCase() + cita.estado.slice(1)}
                          </span>
                        </div>
                      </div>

                      <h4 className="text-base sm:text-lg font-bold text-[#031926] capitalize mb-1">
                        {fechaFormateada}
                      </h4>
                      <p className="text-xs font-semibold text-[#468189] flex items-center gap-1.5 mb-4">
                        <Clock className="w-3.5 h-3.5" />
                        {horaFormateada}
                      </p>

                      {/* Fila del Profesional Asignado */}
                      <div className="p-3.5 rounded-2xl bg-[#FBF8F1] border border-[#9DBEBB]/30 mb-4 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-[#031926] text-white flex items-center justify-center font-bold text-xs shrink-0 overflow-hidden border border-[#77ACA2]/50 shadow-2xs">
                          {cita.psicologo?.avatar_url ? (
                            <img src={cita.psicologo.avatar_url} alt="" className="w-full h-full object-cover" />
                          ) : (cita.psicologo?.email?.toLowerCase().includes("alejandra") || !cita.psicologo) ? (
                            <img
                              src="/alejandra-bedoya.jpg"
                              alt="Alejandra Bedoya"
                              className="w-full h-full object-cover object-top"
                            />
                          ) : (
                            <span>{(cita.psicologo?.nombre_completo || cita.psicologo?.email || "P").charAt(0).toUpperCase()}</span>
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-[#031926] truncate">
                            {cita.psicologo?.nombre_completo || "Dra. Alyson López Sánchez"}
                          </p>
                          <p className="text-[11px] text-[#468189] font-medium truncate">
                            Especialista en Psicología Clínica
                          </p>
                        </div>
                      </div>

                      {cita.notas_paciente && (
                        <p className="text-xs text-[#031926]/75 bg-[#FBF8F1] p-3.5 rounded-2xl border border-[#9DBEBB]/30 mb-4 leading-relaxed">
                          {cita.notas_paciente}
                        </p>
                      )}

                      {/* Botón de Google Meet para sesión virtual */}
                      {cita.modalidad === "virtual" && cita.enlace_reunion && (
                        <a
                          href={cita.enlace_reunion}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-[#031926] hover:bg-[#468189] text-white font-bold text-xs shadow-md shadow-[#031926]/10 transition mb-3 cursor-pointer"
                        >
                          <Video className="w-4 h-4 text-[#77ACA2]" />
                          <span>Unirse a Google Meet</span>
                          <ExternalLink className="w-3.5 h-3.5 opacity-80" />
                        </a>
                      )}

                      {/* Calificación: Solo si la especialista finalizó el servicio */}
                      {esFinalizada && (
                        calificaciones[cita.id] ? (
                          <div className="mt-4 p-4 rounded-2xl bg-[#FBF8F1] border border-[#9DBEBB]/40 flex flex-col gap-2">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-1">
                                {[...Array(calificaciones[cita.id].estrellas)].map((_, i) => (
                                  <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                                ))}
                                <span className="text-xs font-bold text-[#031926] ml-1.5">
                                  Sesión Calificada
                                </span>
                              </div>
                              <span className="text-[10px] text-[#468189] font-bold uppercase bg-[#77ACA2]/15 px-2.5 py-0.5 rounded-full border border-[#77ACA2]/30">
                                Registrado
                              </span>
                            </div>
                            {calificaciones[cita.id].comentario && (
                              <p className="text-xs text-[#031926]/80 italic mt-0.5 leading-relaxed">
                                "{calificaciones[cita.id].comentario}"
                              </p>
                            )}
                          </div>
                        ) : (
                          <div className="mt-4 p-4 rounded-2xl bg-[#F4E9CD]/40 border border-[#9DBEBB]/40 flex items-center justify-between gap-3">
                            <div>
                              <p className="text-xs font-bold text-[#031926]">
                                Sesión Finalizada
                              </p>
                              <p className="text-[11px] text-[#031926]/75">
                                Comparte cómo te sentiste en esta sesión
                              </p>
                            </div>
                            <button
                              onClick={() => {
                                setCitaACalificar(cita);
                                setEstrellasCalificar(5);
                                setComentarioCalificar("");
                              }}
                              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#031926] hover:bg-[#468189] text-white font-bold text-xs shadow-xs transition cursor-pointer shrink-0"
                            >
                              <Star className="w-3.5 h-3.5 fill-amber-300 text-amber-300" />
                              <span>Calificar</span>
                            </button>
                          </div>
                        )
                      )}

                      {!esFinalizada && (
                        <p className="text-[10px] text-[#031926]/50 mt-3 italic">
                          * Podrás calificar esta sesión una vez la psicóloga marque el servicio como finalizado.
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: TAREAS TERAPÉUTICAS */}
        {activeTab === "tareas" && (
          <div className="space-y-4">
            <div className="bg-[#9DBEBB]/20 border border-[#77ACA2]/30 rounded-2xl p-4 flex items-start gap-3">
              <Sparkles className="w-5 h-5 text-[#468189] shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-[#031926]">Tu espacio de autogestión</h4>
                <p className="text-xs text-[#031926]/75">
                  Las tareas acordadas en sesión te ayudan a afianzar herramientas en tu vida cotidiana. Marca cada una cuando la concluyas.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3">
              {tareas.map((tarea) => (
                <div
                  key={tarea.id}
                  className={`bg-white rounded-2xl p-5 border transition ${
                    tarea.completada
                      ? "border-[#77ACA2]/40 bg-[#77ACA2]/10"
                      : "border-[#9DBEBB]/40 hover:border-[#468189]"
                  }`}
                >
                  <div className="flex items-start gap-3.5">
                    <button
                      onClick={() => toggleTarea(tarea.id, tarea.completada)}
                      className="mt-0.5 text-[#031926]/40 hover:text-[#468189] transition cursor-pointer"
                    >
                      {tarea.completada ? (
                        <CheckCircle2 className="w-6 h-6 text-[#468189]" />
                      ) : (
                        <Circle className="w-6 h-6" />
                      )}
                    </button>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h4
                          className={`text-sm font-bold ${
                            tarea.completada
                              ? "line-through text-[#031926]/40"
                              : "text-[#031926]"
                          }`}
                        >
                          {tarea.titulo}
                        </h4>
                        {tarea.fecha_limite && (
                          <span className="text-[11px] font-semibold text-[#031926]/70 bg-[#F4E9CD] px-2 py-0.5 rounded-md">
                            {tarea.fecha_limite}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-[#031926]/75 mt-1 leading-relaxed">
                        {tarea.descripcion}
                      </p>

                      {tarea.reflexion_paciente && (
                        <div className="mt-3 p-3 bg-[#FBF8F1] border border-[#9DBEBB]/30 rounded-xl text-xs text-[#031926]/80">
                          <span className="font-bold text-[#031926] block mb-0.5">
                            Tu nota / reflexión:
                          </span>
                          "{tarea.reflexion_paciente}"
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: DIARIO EMOCIONAL */}
        {activeTab === "animo" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Formulario nuevo registro */}
            <div className="lg:col-span-1 bg-white p-6 rounded-2xl border border-[#9DBEBB]/40 shadow-xs">
              <h3 className="text-sm font-bold text-[#031926] mb-1">¿Cómo te sientes hoy?</h3>
              <p className="text-xs text-[#031926]/70 mb-4">
                Llevar registro de tus emociones facilita identificar patrones en tus sesiones terapéuticas.
              </p>

              <form onSubmit={handleGuardarAnimo} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-[#031926] mb-2">
                    Nivel de bienestar
                  </label>
                  <div className="grid grid-cols-5 gap-1.5">
                    {caritas.map((c) => (
                      <button
                        key={c.nivel}
                        type="button"
                        onClick={() => {
                          setNuevoAnimo(c.nivel);
                          setNuevaEmocion(c.etiqueta);
                        }}
                        className={`p-2.5 rounded-xl border text-center transition cursor-pointer ${
                          nuevoAnimo === c.nivel
                            ? "bg-[#9DBEBB]/25 border-[#468189] ring-2 ring-[#468189]"
                            : "border-[#9DBEBB]/40 hover:bg-[#FBF8F1]"
                        }`}
                      >
                        <span className="text-2xl block">{c.emoji}</span>
                        <span className="text-[9px] font-semibold text-[#031926]/70 block mt-1 truncate">
                          {c.etiqueta}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#031926] mb-1">
                    Pensamientos o notas del día
                  </label>
                  <textarea
                    rows={3}
                    value={nuevaNotaAnimo}
                    onChange={(e) => setNuevaNotaAnimo(e.target.value)}
                    placeholder="¿Ocurrió algo significativo? ¿Alguna sensación que desees conversar en tu próxima sesión?"
                    className="w-full p-3 rounded-xl border border-[#9DBEBB]/60 text-xs text-[#031926] focus:outline-none focus:ring-2 focus:ring-[#468189]"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-[#468189] hover:bg-[#031926] text-white font-semibold text-xs shadow-md shadow-[#468189]/20 transition cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  Guardar en mi Historial
                </button>
              </form>
            </div>

            {/* Historial de registros */}
            <div className="lg:col-span-2 space-y-3">
              <h3 className="text-sm font-bold text-[#031926] mb-1">Historial Emocional Reciente</h3>
              {registrosEmocionales.length === 0 ? (
                <div className="bg-white p-8 rounded-2xl border border-[#9DBEBB]/40 text-center text-xs text-[#031926]/50">
                  Aún no has registrado notas de ánimo. ¡Comienza hoy!
                </div>
              ) : (
                registrosEmocionales.map((reg) => {
                  const carita = caritas.find((c) => c.nivel === reg.nivel_animo) || caritas[2];
                  const fecha = new Date(reg.creado_en).toLocaleDateString("es-ES", {
                    day: "numeric",
                    month: "short",
                    hour: "2-digit",
                    minute: "2-digit",
                  });

                  return (
                    <div
                      key={reg.id}
                      className="bg-white p-4 rounded-2xl border border-[#9DBEBB]/40 flex items-start gap-4 shadow-xs"
                    >
                      <div className="w-12 h-12 rounded-xl bg-[#FBF8F1] border border-[#9DBEBB]/30 flex items-center justify-center text-2xl shrink-0">
                        {carita.emoji}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-[#031926]">
                            {reg.emocion_principal}
                          </span>
                          <span className="text-[10px] text-[#031926]/50 font-medium">{fecha}</span>
                        </div>
                        {reg.notas ? (
                          <p className="text-xs text-[#031926]/75 mt-1 leading-relaxed">
                            "{reg.notas}"
                          </p>
                        ) : (
                          <span className="text-[11px] text-[#031926]/50 italic">Sin comentarios</span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* TAB 4: PERFIL */}
        {activeTab === "perfil" && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#9DBEBB]/40 max-w-2xl shadow-xs">
            <h3 className="text-base font-bold text-[#031926] mb-1">Información de Consultante</h3>
            <p className="text-xs text-[#031926]/70 mb-6">
              Datos registrados para tu expediente clínico y contacto confidencial con tu especialista.
            </p>

            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <span className="text-[#031926]/60 block mb-1 font-medium">Nombre Completo</span>
                  <p className="font-semibold text-[#031926] p-2.5 bg-[#FBF8F1] rounded-xl border border-[#9DBEBB]/30">
                    {user?.nombre}
                  </p>
                </div>
                <div>
                  <span className="text-[#031926]/60 block mb-1 font-medium">Correo Electrónico</span>
                  <p className="font-semibold text-[#031926] p-2.5 bg-[#FBF8F1] rounded-xl border border-[#9DBEBB]/30">
                    {user?.email}
                  </p>
                </div>
              </div>

              <div>
                <span className="text-[#031926]/60 block mb-1 font-medium">Rol en el sistema</span>
                <span className="inline-block px-3 py-1 bg-[#77ACA2]/20 text-[#031926] font-semibold rounded-full border border-[#77ACA2]/40">
                  Paciente / Consultante Activo
                </span>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-[#9DBEBB]/20 flex items-center gap-3 text-xs text-[#031926]/70">
              <ShieldCheck className="w-5 h-5 text-[#468189] shrink-0" />
              <span>Tu información se almacena con cifrado y estrictos protocolos de confidencialidad médica.</span>
            </div>
          </div>
        )}
      </div>

      {/* Columna Lateral de Acompañamiento Terapéutico (4 columnas en desktop) */}
      <div className="lg:col-span-4 space-y-6">
        {/* 1. Tarjeta Especialista Asignada */}
        <div className="bg-white rounded-3xl p-6 border border-[#9DBEBB]/40 shadow-xs">
          <div className="flex items-center gap-3.5 mb-4">
            <div className="w-12 h-12 rounded-2xl bg-[#031926] overflow-hidden border border-[#77ACA2]/40 shrink-0 shadow-xs">
              <img
                src={psicologos[0]?.avatar_url || "/alejandra-bedoya.jpg"}
                alt={psicologos[0]?.nombre_completo || "Especialista"}
                className="w-full h-full object-cover object-top"
              />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#468189] block">
                Tu Especialista
              </span>
              <h4 className="text-sm font-bold text-[#031926] truncate">
                {psicologos[0]?.nombre_completo || "Dra. Alyson López Sánchez"}
              </h4>
              <p className="text-[11px] text-[#031926]/60 truncate">
                {psicologos[0]?.especialidad || "Psicóloga Clínica y Terapéutica"}
              </p>
            </div>
          </div>

          <p className="text-xs text-[#031926]/70 leading-relaxed mb-4">
            Acompañamiento profesional y seguimiento de tus objetivos terapéuticos en cada sesión.
          </p>

          <button
            type="button"
            onClick={() => {
              const chatBtn = document.querySelector('button[title*="Chatear con"]') as HTMLButtonElement;
              if (chatBtn) chatBtn.click();
            }}
            className="w-full py-2.5 px-3 rounded-xl bg-[#FBF8F1] hover:bg-[#F4E9CD] border border-[#9DBEBB]/50 text-[#031926] font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer"
          >
            <MessageSquare className="w-4 h-4 text-[#468189]" />
            <span>Enviar Mensaje Directo</span>
          </button>
        </div>

        {/* 2. Resumen Rápido del Diario Emocional */}
        <div className="bg-white rounded-3xl p-6 border border-[#9DBEBB]/40 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-[#031926] flex items-center gap-1.5">
              <Smile className="w-4 h-4 text-[#468189]" />
              <span>Tu Bienestar Emocional</span>
            </span>
            <button
              type="button"
              onClick={() => setActiveTab("animo")}
              className="text-[11px] font-semibold text-[#468189] hover:text-[#031926] transition cursor-pointer"
            >
              Ver histórico
            </button>
          </div>

          {registrosEmocionales.length > 0 ? (
            <div className="p-3.5 rounded-2xl bg-[#FBF8F1] border border-[#9DBEBB]/30">
              <div className="flex items-center gap-2.5 mb-1">
                <span className="text-xl">
                  {caritas.find((c) => c.nivel === registrosEmocionales[0].nivel_animo)?.emoji || "🌱"}
                </span>
                <div>
                  <span className="text-xs font-bold text-[#031926] block leading-tight">
                    {registrosEmocionales[0].emocion_principal || "Reflexión reciente"}
                  </span>
                  <span className="text-[10px] text-gray-400">
                    {new Date(registrosEmocionales[0].creado_en).toLocaleDateString("es-ES", {
                      weekday: "short",
                      day: "numeric",
                      month: "short",
                    })}
                  </span>
                </div>
              </div>
              {registrosEmocionales[0].notas && (
                <p className="text-[11px] text-[#031926]/75 italic mt-2 line-clamp-2 leading-relaxed">
                  "{registrosEmocionales[0].notas}"
                </p>
              )}
            </div>
          ) : (
            <p className="text-xs text-[#031926]/70 leading-relaxed mb-3">
              Aún no has registrado tu emoción de hoy. Registrarla ayuda a tu especialista a comprender tu evolución.
            </p>
          )}

          <button
            type="button"
            onClick={() => setActiveTab("animo")}
            className="w-full mt-3 py-2 px-3 rounded-xl bg-[#468189] hover:bg-[#031926] text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-2xs transition cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Registrar Estado de Ánimo</span>
          </button>
        </div>

        {/* 3. Garantía Ética y Confidencialidad */}
        <div className="rounded-2xl p-4 bg-[#9DBEBB]/15 border border-[#77ACA2]/30 flex items-start gap-3">
          <ShieldCheck className="w-5 h-5 text-[#468189] shrink-0 mt-0.5" />
          <div>
            <h5 className="font-bold text-[#031926] text-xs">Espacio Privado y Seguro</h5>
            <p className="text-[11px] text-[#031926]/70 mt-0.5 leading-relaxed">
              Tus notas, citas y reflexiones están resguardadas bajo estricto secreto profesional ético.
            </p>
          </div>
        </div>
      </div>
    </div>
  </main>

      {/* Modal: Solicitar Cita con Calendario */}
      {mostrarModalCita && (
        <div className="fixed inset-0 z-50 bg-[#031926]/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-2xl rounded-3xl p-6 sm:p-8 shadow-2xl border border-[#9DBEBB]/40 my-8">
            <div className="flex items-start justify-between pb-4 border-b border-[#9DBEBB]/30 mb-6">
              <div>
                <span className="inline-block px-3 py-1 bg-[#9DBEBB]/25 text-[#468189] text-[11px] font-extrabold uppercase tracking-wider rounded-full mb-1">
                  Reserva en Tiempo Real
                </span>
                <h3 className="text-xl font-black text-[#031926]">
                  Agendar Sesión de Consulta
                </h3>
                <p className="text-xs text-[#031926]/70 mt-0.5">
                  Selecciona a tu profesional, el día en el calendario y el horario disponible que mejor se ajuste a tu tiempo.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setMostrarModalCita(false)}
                className="text-gray-400 hover:text-[#031926] p-1.5 cursor-pointer rounded-xl hover:bg-gray-100"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCrearCita} className="space-y-6">
              {/* Calendario con selector de profesional y slots de atención */}
              <CalendarioCitas
                psicologos={psicologos}
                psicologoSeleccionadoId={psicologoSeleccionadoId}
                onCambiarPsicologo={(id) => setPsicologoSeleccionadoId(id)}
                citasExistentes={citas}
                fechaHoraSeleccionada={fechaCita}
                onSeleccionarFechaHora={(iso) => setFechaCita(iso)}
              />

              {/* Modalidad de la sesión */}
              <div>
                <label className="block text-xs font-bold text-[#031926] mb-2 uppercase tracking-wider">
                  Modalidad de Atención
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setModalidadCita("virtual")}
                    className={`py-3 px-4 rounded-xl border text-xs font-bold flex items-center justify-center gap-2.5 cursor-pointer transition ${
                      modalidadCita === "virtual"
                        ? "bg-[#468189] text-white border-[#468189] shadow-sm"
                        : "border-[#9DBEBB]/50 text-[#031926]/75 hover:bg-[#FBF8F1]"
                    }`}
                  >
                    <Video className="w-4 h-4" />
                    <span>Virtual (Google Meet Automático)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setModalidadCita("presencial")}
                    className={`py-3 px-4 rounded-xl border text-xs font-bold flex items-center justify-center gap-2.5 cursor-pointer transition ${
                      modalidadCita === "presencial"
                        ? "bg-[#468189] text-white border-[#468189] shadow-sm"
                        : "border-[#9DBEBB]/50 text-[#031926]/75 hover:bg-[#FBF8F1]"
                    }`}
                  >
                    <MapPin className="w-4 h-4" />
                    <span>Presencial en Consultorio</span>
                  </button>
                </div>
              </div>

              {/* Motivo de consulta */}
              <div>
                <label className="block text-xs font-bold text-[#031926] mb-1.5 uppercase tracking-wider">
                  Motivo o tema a tratar (Opcional)
                </label>
                <textarea
                  rows={2}
                  value={motivoCita}
                  onChange={(e) => setMotivoCita(e.target.value)}
                  placeholder="Ej: Seguimiento del plan de tratamiento, manejo del estrés laboral o consulta prioritaria..."
                  className="w-full p-3 rounded-xl border border-[#9DBEBB]/60 text-xs text-[#031926] focus:outline-none focus:ring-2 focus:ring-[#468189]"
                />
              </div>

              <div className="flex gap-3 pt-3 border-t border-[#9DBEBB]/30">
                <button
                  type="button"
                  onClick={() => setMostrarModalCita(false)}
                  className="w-1/2 py-3 rounded-xl border border-[#9DBEBB]/60 text-[#031926]/70 font-bold text-xs hover:bg-[#FBF8F1] transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={guardandoCita || !fechaCita}
                  className="w-1/2 py-3 rounded-xl bg-[#031926] hover:bg-[#468189] text-white font-extrabold text-xs shadow-md transition cursor-pointer disabled:opacity-50"
                >
                  {guardandoCita ? "Agendando..." : "Confirmar y Agendar Cita"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Calificar Sesión Finalizada (1 sola vez por servicio) */}
      {citaACalificar && (
        <div className="fixed inset-0 z-50 bg-[#031926]/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl border border-[#9DBEBB]/40">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-xl bg-[#F4E9CD] text-amber-500 flex items-center justify-center">
                <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
              </div>
              <h3 className="text-base font-bold text-[#031926]">
                Calificar Sesión Finalizada
              </h3>
            </div>
            <div className="flex items-center gap-3 p-3 bg-[#FBF8F1] rounded-2xl border border-[#9DBEBB]/40 mb-3">
              <div className="w-10 h-10 rounded-full bg-[#031926] text-white flex items-center justify-center font-bold text-xs shrink-0 border border-[#77ACA2]/60">
                {(psicologos[0]?.nombre_completo || "A").charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="text-xs font-bold text-[#031926]">{psicologos[0]?.nombre_completo || "Dra. Alyson López Sánchez"}</p>
                <p className="text-[10px] text-[#468189] font-medium">{psicologos[0]?.especialidad || "Psicóloga Clínica & Terapéutica"}</p>
              </div>
            </div>
            <p className="text-xs text-[#031926]/70 mb-5 leading-relaxed">
              Tu opinión es muy valiosa para tu proceso. Esta calificación se registrará una sola vez para esta consulta.
            </p>

            <form onSubmit={handleEnviarCalificacion} className="space-y-4">
              {/* Selector de 1 a 5 estrellas */}
              <div>
                <label className="block text-xs font-semibold text-[#031926] mb-2">
                  ¿Cómo calificarías la atención recibida?
                </label>
                <div className="flex items-center justify-center gap-2 p-3 bg-[#FBF8F1] rounded-2xl border border-[#9DBEBB]/40">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setEstrellasCalificar(star)}
                      className="p-1 hover:scale-115 transition transform cursor-pointer"
                    >
                      <Star
                        className={`w-7 h-7 ${
                          star <= estrellasCalificar
                            ? "fill-amber-400 text-amber-400"
                            : "text-[#9DBEBB]"
                        }`}
                      />
                    </button>
                  ))}
                </div>
                <div className="text-center mt-1.5 text-xs font-bold text-[#031926]">
                  {estrellasCalificar === 5 && "⭐ Excelente servicio"}
                  {estrellasCalificar === 4 && "⭐ Muy buen servicio"}
                  {estrellasCalificar === 3 && "⭐ Regular"}
                  {estrellasCalificar === 2 && "⭐ Podría mejorar"}
                  {estrellasCalificar === 1 && "⭐ Insatisfactorio"}
                </div>
              </div>

              {/* Comentario opcional */}
              <div>
                <label className="block text-xs font-semibold text-[#031926] mb-1">
                  Tu testimonio o comentario (Opcional)
                </label>
                <textarea
                  rows={3}
                  value={comentarioCalificar}
                  onChange={(e) => setComentarioCalificar(e.target.value)}
                  placeholder="Comparte cómo te sentiste en esta sesión y qué aprendizajes te llevas..."
                  className="w-full p-3 rounded-xl border border-[#9DBEBB]/60 text-xs text-[#031926] focus:outline-none focus:ring-2 focus:ring-[#468189]"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setCitaACalificar(null)}
                  className="w-1/2 py-2.5 rounded-xl border border-[#9DBEBB]/60 text-[#031926]/70 font-semibold text-xs hover:bg-[#FBF8F1] transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={enviandoCalificacion}
                  className="w-1/2 py-2.5 rounded-xl bg-[#468189] hover:bg-[#031926] text-white font-semibold text-xs shadow-md shadow-[#468189]/20 transition cursor-pointer disabled:opacity-60"
                >
                  {enviandoCalificacion ? "Guardando..." : "Publicar Calificación"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Messenger Flotante para Chatear con la Especialista */}
      {user?.id && (
        <ChatFlotante
          usuarioActual={{
            id: user.id,
            nombre: user.nombre || "Consultante",
            email: user.email,
          }}
          especialista={
            psicologos.length > 0
              ? {
                  id: psicologos[0].id,
                  nombre: psicologos[0].nombre_completo || "Dra. Alyson López Sánchez",
                  avatar: psicologos[0].avatar_url,
                  rol: psicologos[0].especialidad,
                }
              : undefined
          }
          especialistasDisponibles={psicologos.map((p) => ({
            id: p.id,
            nombre: p.nombre_completo,
            email: p.email,
            avatar: p.avatar_url,
            rol: p.especialidad,
          }))}
        />
      )}
    </div>
  );
}

export default function PortalPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#FBF8F1] flex items-center justify-center">
          <div className="w-10 h-10 border-4 border-[#468189] border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <PortalContent />
    </Suspense>
  );
}
