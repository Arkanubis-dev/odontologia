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
  Star
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface Cita {
  id: string;
  fecha_hora: string;
  modalidad: "virtual" | "presencial";
  enlace_reunion?: string;
  estado: "pendiente" | "confirmada" | "completada" | "cancelada" | "finalizado";
  notas_paciente?: string;
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

      setUser({
        id: authUser.id,
        email: authUser.email,
        nombre: nombre,
        avatar: authUser.user_metadata?.avatar_url,
      });

      // Cargar datos reales desde Supabase
      try {
        const [citasRes, tareasRes, animoRes, califRes] = await Promise.all([
          supabase.from("citas").select("*").order("fecha_hora", { ascending: true }),
          supabase.from("tareas_terapia").select("*").order("creado_en", { ascending: false }),
          supabase.from("registro_emocional").select("*").order("creado_en", { ascending: false }).limit(10),
          supabase.from("calificaciones").select("*").eq("paciente_id", authUser.id),
        ]);

        if (califRes.data && califRes.data.length > 0) {
          const map: Record<string, Calificacion> = {};
          califRes.data.forEach((c: any) => {
            map[c.cita_id] = c;
          });
          setCalificaciones(map);
        }

        if (citasRes.data && citasRes.data.length > 0) {
          setCitas(citasRes.data);
        } else {
          // Si es usuario nuevo sin citas, poner ejemplo
          setCitas([
            {
              id: "demo-1",
              fecha_hora: new Date(Date.now() + 86400000 * 2).toISOString(),
              modalidad: "virtual",
              enlace_reunion: "https://meet.google.com/psicologia-sesion",
              estado: "confirmada",
              notas_paciente: "Sesión de seguimiento terapéutico",
            },
          ]);
        }

        if (tareasRes.data && tareasRes.data.length > 0) {
          setTareas(tareasRes.data);
        } else {
          setTareas([
            {
              id: "task-1",
              titulo: "Registro de pensamientos automáticos",
              descripcion: "Anota en un cuaderno o aquí cuando sientas una emoción intensa durante el día.",
              fecha_limite: "En 3 días",
              completada: false,
            },
            {
              id: "task-2",
              titulo: "Técnica de respiración 4-7-8",
              descripcion: "Realizar 5 minutos antes de dormir para reducir la tensión corporal.",
              fecha_limite: "Diario",
              completada: true,
            },
          ]);
        }

        if (animoRes.data) {
          setRegistrosEmocionales(animoRes.data);
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
      const supabase = createClient();
      if (supabase) {
        await supabase.from("calificaciones").insert({
          cita_id: citaACalificar.id,
          paciente_id: user.id,
          estrellas: estrellasCalificar,
          comentario: comentarioCalificar,
          nombre_mostrar: user.nombre || "Consultante",
          servicio: "Sesión Terapéutica",
          es_publico: true,
        });
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
      const supabase = createClient();
      if (supabase) {
        await supabase.from("registro_emocional").insert({
          paciente_id: user.id,
          nivel_animo: nuevoAnimo,
          emocion_principal: nuevaEmocion,
          notas: nuevaNotaAnimo,
        });
      }
    }
  };

  // Solicitar nueva cita
  const handleCrearCita = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fechaCita) return;

    const nueva: Cita = {
      id: "cita-" + Date.now(),
      fecha_hora: new Date(fechaCita).toISOString(),
      modalidad: modalidadCita,
      estado: "pendiente",
      notas_paciente: motivoCita,
    };

    setCitas([...citas, nueva]);
    setMostrarModalCita(false);
    setFechaCita("");
    setMotivoCita("");

    if (!isDemo && user?.id) {
      const supabase = createClient();
      if (supabase) {
        await supabase.from("citas").insert({
          paciente_id: user.id,
          fecha_hora: nueva.fecha_hora,
          modalidad: nueva.modalidad,
          estado: "pendiente",
          notas_paciente: nueva.notas_paciente,
        });
      }
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
                  Alejandra Bedoya
                </h1>
                <p className="text-[10px] text-[#468189] font-semibold">Psicología Laboral & Terapéutica</p>
              </div>
            </Link>
          </div>

          {/* User info and Logout */}
          <div className="flex items-center gap-4">
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
        {/* Welcome Card en Rich Black (#031926) */}
        <div className="bg-[#031926] rounded-3xl p-6 sm:p-8 text-white shadow-xl shadow-[#031926]/10 mb-8 border border-[#468189]/30">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <span className="inline-block px-3 py-1 bg-[#468189]/40 backdrop-blur-md rounded-full text-xs font-semibold uppercase tracking-wider mb-2 text-[#9DBEBB] border border-[#77ACA2]/30">
                Portal del Consultante
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                Hola, {user?.nombre?.split(" ")[0]} 👋
              </h2>
              <p className="text-[#9DBEBB] text-xs sm:text-sm mt-1 max-w-xl">
                Este es tu espacio privado para gestionar citas, tareas acordadas en sesión y calificaciones con Alejandra Bedoya.
              </p>
            </div>
            <button
              onClick={() => setMostrarModalCita(true)}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-[#F4E9CD] text-[#031926] font-extrabold text-xs sm:text-sm shadow-md hover:bg-white transition cursor-pointer shrink-0"
            >
              <Plus className="w-4 h-4 text-[#468189]" />
              Solicitar Nueva Cita
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-[#9DBEBB]/30 mb-6 gap-2 overflow-x-auto pb-1">
          <button
            onClick={() => setActiveTab("citas")}
            className={`inline-flex items-center gap-2 py-3 px-4 text-xs sm:text-sm font-semibold rounded-xl transition cursor-pointer shrink-0 ${
              activeTab === "citas"
                ? "bg-[#468189] text-white shadow-sm"
                : "text-[#031926]/70 hover:text-[#031926] hover:bg-[#9DBEBB]/20"
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>Mis Citas ({citas.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("tareas")}
            className={`inline-flex items-center gap-2 py-3 px-4 text-xs sm:text-sm font-semibold rounded-xl transition cursor-pointer shrink-0 ${
              activeTab === "tareas"
                ? "bg-[#468189] text-white shadow-sm"
                : "text-[#031926]/70 hover:text-[#031926] hover:bg-[#9DBEBB]/20"
            }`}
          >
            <ClipboardList className="w-4 h-4" />
            <span>Tareas Terapéuticas ({tareas.filter((t) => !t.completada).length} pendientes)</span>
          </button>

          <button
            onClick={() => setActiveTab("animo")}
            className={`inline-flex items-center gap-2 py-3 px-4 text-xs sm:text-sm font-semibold rounded-xl transition cursor-pointer shrink-0 ${
              activeTab === "animo"
                ? "bg-[#468189] text-white shadow-sm"
                : "text-[#031926]/70 hover:text-[#031926] hover:bg-[#9DBEBB]/20"
            }`}
          >
            <Smile className="w-4 h-4" />
            <span>Mi Diario Emocional</span>
          </button>

          <button
            onClick={() => setActiveTab("perfil")}
            className={`inline-flex items-center gap-2 py-3 px-4 text-xs sm:text-sm font-semibold rounded-xl transition cursor-pointer shrink-0 ${
              activeTab === "perfil"
                ? "bg-[#468189] text-white shadow-sm"
                : "text-[#031926]/70 hover:text-[#031926] hover:bg-[#9DBEBB]/20"
            }`}
          >
            <User className="w-4 h-4" />
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
                  Coordina tu próxima sesión terapéutica con Alejandra cuando lo desees.
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

                  return (
                    <div
                      key={cita.id}
                      className="bg-white rounded-2xl p-6 border border-[#9DBEBB]/40 shadow-xs hover:shadow-md transition"
                    >
                      <div className="flex items-start justify-between mb-4">
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
                            className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                              cita.estado === "confirmada"
                                ? "bg-[#77ACA2]/20 text-[#031926] border border-[#77ACA2]/40"
                                : cita.estado === "pendiente"
                                ? "bg-[#F4E9CD] text-[#031926] border border-[#9DBEBB]/40"
                                : "bg-slate-100 text-slate-600"
                            }`}
                          >
                            {cita.estado.toUpperCase()}
                          </span>
                        </div>
                      </div>

                      <h4 className="text-base font-bold text-[#031926] capitalize mb-1">
                        {fechaFormateada}
                      </h4>
                      <p className="text-xs font-semibold text-[#468189] flex items-center gap-1.5 mb-3">
                        <Clock className="w-3.5 h-3.5" />
                        {horaFormateada}
                      </p>

                      {/* Especialista Asignada */}
                      <div className="flex items-center gap-2.5 py-2 px-3 rounded-xl bg-[#FBF8F1] border border-[#9DBEBB]/30 mb-3">
                        <img
                          src="/alejandra-bedoya.jpg"
                          alt="Alejandra Bedoya"
                          className="w-8 h-8 rounded-full object-cover object-top border border-[#77ACA2]/50 shrink-0"
                        />
                        <div>
                          <p className="text-xs font-bold text-[#031926]">Alejandra Bedoya</p>
                          <p className="text-[10px] text-[#468189] font-medium">Especialista en Psicología</p>
                        </div>
                      </div>

                      {cita.notas_paciente && (
                        <p className="text-xs text-[#031926]/75 bg-[#FBF8F1] p-3 rounded-xl border border-[#9DBEBB]/30 mb-4">
                          {cita.notas_paciente}
                        </p>
                      )}

                      {cita.modalidad === "virtual" && cita.enlace_reunion && (
                        <a
                          href={cita.enlace_reunion}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-full inline-flex items-center justify-center gap-2 py-2 px-4 rounded-xl bg-[#468189] hover:bg-[#031926] text-white font-semibold text-xs transition mb-3"
                        >
                          <Video className="w-4 h-4" />
                          Unirse a la Sesión Virtual
                        </a>
                      )}

                      {/* Calificación: Solo si la especialista finalizó el servicio */}
                      {(cita.estado === "completada" || cita.estado === "finalizado") ? (
                        calificaciones[cita.id] ? (
                          <div className="mt-4 p-3.5 rounded-2xl bg-[#F4E9CD]/50 border border-[#9DBEBB]/40 flex flex-col gap-1.5">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-1 text-amber-500">
                                {[...Array(calificaciones[cita.id].estrellas)].map((_, i) => (
                                  <Star key={i} className="w-3.5 h-3.5 fill-amber-400" />
                                ))}
                                <span className="text-xs font-bold text-[#031926] ml-1">
                                  Calificación registrada
                                </span>
                              </div>
                              <span className="text-[10px] text-[#031926]/70 font-semibold uppercase bg-white/70 px-2 py-0.5 rounded-full border border-[#9DBEBB]/30">
                                1 por servicio
                              </span>
                            </div>
                            {calificaciones[cita.id].comentario && (
                              <p className="text-xs text-[#031926]/80 italic mt-0.5">
                                "{calificaciones[cita.id].comentario}"
                              </p>
                            )}
                          </div>
                        ) : (
                          <div className="mt-4 p-3.5 rounded-2xl bg-[#77ACA2]/15 border border-[#77ACA2]/40 flex items-center justify-between gap-3">
                            <div>
                              <p className="text-xs font-bold text-[#031926]">
                                Sesión Finalizada
                              </p>
                              <p className="text-[11px] text-[#031926]/75">
                                Califica el servicio prestado (1 a 5 estrellas)
                              </p>
                            </div>
                            <button
                              onClick={() => {
                                setCitaACalificar(cita);
                                setEstrellasCalificar(5);
                                setComentarioCalificar("");
                              }}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#468189] hover:bg-[#031926] text-white font-semibold text-xs shadow-xs transition cursor-pointer shrink-0"
                            >
                              <Star className="w-3.5 h-3.5 fill-amber-300 text-amber-300" />
                              <span>Calificar</span>
                            </button>
                          </div>
                        )
                      ) : (
                        <p className="text-[10px] text-[#031926]/50 mt-3 italic flex items-center gap-1">
                          <span>* Podrás calificar esta sesión una vez la psicóloga marque el servicio como finalizado.</span>
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
                Llevar registro de tus emociones facilita identificar patrones en tus sesiones con Alejandra.
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
              Datos registrados para tu expediente clínico y contacto confidencial con Alejandra Bedoya.
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
      </main>

      {/* Modal: Solicitar Cita */}
      {mostrarModalCita && (
        <div className="fixed inset-0 z-50 bg-[#031926]/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl border border-[#9DBEBB]/40">
            <h3 className="text-lg font-bold text-[#031926] mb-1">Agendar Sesión con Alejandra</h3>
            <p className="text-xs text-[#031926]/70 mb-4">
              Selecciona fecha, hora y modalidad de tu preferencia.
            </p>

            <form onSubmit={handleCrearCita} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#031926] mb-1">
                  Fecha y Hora
                </label>
                <input
                  type="datetime-local"
                  required
                  value={fechaCita}
                  onChange={(e) => setFechaCita(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-[#9DBEBB]/60 text-xs text-[#031926] focus:outline-none focus:ring-2 focus:ring-[#468189]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#031926] mb-1">
                  Modalidad
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setModalidadCita("virtual")}
                    className={`py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer ${
                      modalidadCita === "virtual"
                        ? "bg-[#9DBEBB]/25 border-[#468189] text-[#031926]"
                        : "border-[#9DBEBB]/40 text-[#031926]/70"
                    }`}
                  >
                    <Video className="w-3.5 h-3.5 text-[#468189]" />
                    Virtual (Meet)
                  </button>
                  <button
                    type="button"
                    onClick={() => setModalidadCita("presencial")}
                    className={`py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer ${
                      modalidadCita === "presencial"
                        ? "bg-[#9DBEBB]/25 border-[#468189] text-[#031926]"
                        : "border-[#9DBEBB]/40 text-[#031926]/70"
                    }`}
                  >
                    <MapPin className="w-3.5 h-3.5 text-[#468189]" />
                    Presencial
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#031926] mb-1">
                  Motivo o tema a tratar (Opcional)
                </label>
                <textarea
                  rows={2}
                  value={motivoCita}
                  onChange={(e) => setMotivoCita(e.target.value)}
                  placeholder="Ej: Seguimiento del plan de tratamiento, burnout o consulta prioritaria."
                  className="w-full p-2.5 rounded-xl border border-[#9DBEBB]/60 text-xs text-[#031926] focus:outline-none focus:ring-2 focus:ring-[#468189]"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setMostrarModalCita(false)}
                  className="w-1/2 py-2.5 rounded-xl border border-[#9DBEBB]/60 text-[#031926]/70 font-semibold text-xs hover:bg-[#FBF8F1] transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-2.5 rounded-xl bg-[#468189] hover:bg-[#031926] text-white font-semibold text-xs shadow-md shadow-[#468189]/20 transition cursor-pointer"
                >
                  Confirmar Cita
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
              <img
                src="/alejandra-bedoya.jpg"
                alt="Alejandra Bedoya"
                className="w-10 h-10 rounded-full object-cover object-top border border-[#77ACA2]/60 shrink-0"
              />
              <div>
                <p className="text-xs font-bold text-[#031926]">Alejandra Bedoya</p>
                <p className="text-[10px] text-[#468189] font-medium">Psicóloga Laboral & Terapéutica</p>
              </div>
            </div>
            <p className="text-xs text-[#031926]/70 mb-5 leading-relaxed">
              Tu opinión es muy valiosa para Alejandra Bedoya. Esta calificación se registrará una sola vez para esta consulta.
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
