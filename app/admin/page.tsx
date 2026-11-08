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
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface Perfil {
  id: string;
  email: string;
  nombre_completo?: string;
  avatar_url?: string;
  telefono?: string;
  rol: "paciente" | "psicologo";
  creado_en: string;
}

interface Cita {
  id: string;
  paciente_id: string;
  fecha_hora: string;
  modalidad: "virtual" | "presencial";
  enlace_reunion?: string;
  estado: "pendiente" | "confirmada" | "completada" | "cancelada" | "finalizado";
  notas_paciente?: string;
  paciente?: Perfil;
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

  // Estados de datos
  const [citas, setCitas] = useState<Cita[]>([]);
  const [pacientes, setPacientes] = useState<Perfil[]>([]);
  const [tareas, setTareas] = useState<Tarea[]>([]);
  const [emocionales, setEmocionales] = useState<RegistroEmocional[]>([]);
  const [calificaciones, setCalificaciones] = useState<Calificacion[]>([]);

  // Pestaña activa
  const [tabActiva, setTabActiva] = useState<"citas" | "pacientes" | "tareas" | "calificaciones">("citas");
  const [filtroCitas, setFiltroCitas] = useState<string>("todas");
  const [busqueda, setBusqueda] = useState<string>("");

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
        router.replace("/login?redirect=/admin");
        return;
      }

      // Verificar rol en perfiles
      const { data: perfil } = await supabase
        .from("perfiles")
        .select("*")
        .eq("id", user.id)
        .single();

      // Permitir acceso estrictamente si es psicólogo o si el correo es de Alejandra/admin
      const esAdmin = Boolean(
        perfil?.rol === "psicologo" ||
        user.email?.toLowerCase().includes("alejandra") ||
        user.email?.toLowerCase().includes("admin")
      );

      if (!esAdmin) {
        setLoading(false);
        setEsPsicologa(false);
        router.replace("/portal");
        return;
      }

      setCurrentUser(user);
      setEsPsicologa(true);

      await recargarDatos(supabase);
      setLoading(false);
    }

    init();
  }, [router]);

  async function recargarDatos(supabase: any) {
    try {
      // 1. Cargar pacientes
      const { data: dataPacientes } = await supabase
        .from("perfiles")
        .select("*")
        .order("creado_en", { ascending: false });

      const listaPacientes: Perfil[] = dataPacientes || [];
      setPacientes(listaPacientes);

      // Mapa de pacientes para asociar nombres rápidamente
      const mapaPacientes: Record<string, Perfil> = {};
      listaPacientes.forEach((p) => {
        mapaPacientes[p.id] = p;
      });

      // 2. Cargar citas
      const { data: dataCitas } = await supabase
        .from("citas")
        .select("*")
        .order("fecha_hora", { ascending: false });

      if (dataCitas) {
        setCitas(
          dataCitas.map((c: any) => ({
            ...c,
            paciente: mapaPacientes[c.paciente_id],
          }))
        );
      }

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

      // 4. Cargar registros emocionales
      const { data: dataEmocionales } = await supabase
        .from("registro_emocional")
        .select("*")
        .order("creado_en", { ascending: false });

      if (dataEmocionales) {
        setEmocionales(
          dataEmocionales.map((e: any) => ({
            ...e,
            paciente: mapaPacientes[e.paciente_id],
          }))
        );
      }

      // 5. Cargar calificaciones
      const { data: dataCalificaciones } = await supabase
        .from("calificaciones")
        .select("*")
        .order("creado_en", { ascending: false });

      if (dataCalificaciones) {
        setCalificaciones(dataCalificaciones);
      }
    } catch (err) {
      console.error("Error al cargar datos en panel de psicóloga:", err);
    }
  }

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

  // Citas filtradas
  const citasFiltradas = citas.filter((c) => {
    if (filtroCitas === "finalizadas") return c.estado === "finalizado" || c.estado === "completada";
    if (filtroCitas === "pendientes") return c.estado === "pendiente";
    if (filtroCitas === "confirmadas") return c.estado === "confirmada";
    return true;
  });

  return (
    <div className="min-h-screen bg-[#FBF8F1] text-[#031926] font-sans selection:bg-[#9DBEBB]/40 selection:text-[#031926]">
      {/* 1. Header Superior del Panel de la Psicóloga */}
      <header className="border-b border-[#9DBEBB]/30 bg-white/95 backdrop-blur-md sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="w-11 h-11 rounded-2xl overflow-hidden border-2 border-[#77ACA2]/50 shadow-md shadow-[#468189]/20 shrink-0">
                <img
                  src="/alejandra-bedoya.jpg"
                  alt="Alejandra Bedoya"
                  className="w-full h-full object-cover object-top"
                />
              </div>
              <div>
                <h1 className="text-sm sm:text-base font-bold text-[#031926] leading-tight">
                  Alejandra Bedoya
                </h1>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <p className="text-[11px] text-[#468189] font-bold">
                    Panel Profesional de Psicología
                  </p>
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
                Gestión Clínica & Terapéutica
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                Bienvenida, Alejandra 👋
              </h2>
              <p className="text-[#9DBEBB] text-xs sm:text-sm leading-relaxed">
                Aquí administras tus citas, asignas herramientas terapéuticas y marcas sesiones como finalizadas para recibir retroalimentación.
              </p>
            </div>

            <button
              onClick={() => setMostrarModalTarea(true)}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-[#F4E9CD] text-[#031926] font-extrabold text-xs sm:text-sm shadow-md hover:bg-white transition cursor-pointer shrink-0"
            >
              <Plus className="w-4 h-4 text-[#468189]" />
              Asignar Tarea Terapéutica
            </button>
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
        </div>

        {/* 4. PESTAÑA: CITAS */}
        {tabActiva === "citas" && (
          <div className="space-y-4">
            {/* Filtros de Citas */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
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
                        <p className="text-xs font-semibold text-[#468189]">Consultante:</p>
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

                      {/* Enlace de reunión virtual */}
                      {cita.modalidad === "virtual" && (
                        <div className="flex items-center gap-2 pt-1">
                          {cita.enlace_reunion ? (
                            <a
                              href={cita.enlace_reunion}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex-1 inline-flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-[#468189] text-white text-xs font-semibold hover:bg-[#031926] transition"
                            >
                              <Video className="w-3.5 h-3.5" />
                              Abrir Videollamada
                            </a>
                          ) : (
                            <span className="text-xs text-[#031926]/50 italic">
                              Sin enlace asignado
                            </span>
                          )}
                          <button
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

                      {/* Botón de Acción Clave: Finalizar Cita para habilitar 1 a 5 estrellas */}
                      <div className="pt-2 border-t border-[#9DBEBB]/30 flex items-center justify-between gap-2">
                        {esFinalizada ? (
                          <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200 w-full justify-center">
                            <Check className="w-4 h-4 text-emerald-600" />
                            <span>Servicio Finalizado (Calificación Habilitada)</span>
                          </div>
                        ) : (
                          <>
                            {cita.estado !== "confirmada" && (
                              <button
                                onClick={() => handleCambiarEstadoCita(cita.id, "confirmada")}
                                className="w-1/2 py-2 px-3 rounded-xl border border-[#468189] text-[#468189] hover:bg-[#468189] hover:text-white font-semibold text-xs transition cursor-pointer"
                              >
                                Confirmar Cita
                              </button>
                            )}
                            <button
                              onClick={() => handleCambiarEstadoCita(cita.id, "finalizado")}
                              className="flex-1 py-2 px-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 text-white font-bold text-xs shadow-md shadow-emerald-200 hover:brightness-105 transition cursor-pointer flex items-center justify-center gap-1.5"
                            >
                              <CheckCircle2 className="w-4 h-4" />
                              <span>Marcar Finalizada</span>
                            </button>
                          </>
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
                          onClick={() => {
                            setPacienteSeleccionado(p.id);
                            setMostrarModalTarea(true);
                          }}
                          className="w-full inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-white border border-[#468189]/50 text-[#468189] hover:bg-[#468189] hover:text-white text-xs font-semibold transition cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Asignar Tarea</span>
                        </button>
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
          <div className="bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl border border-[#9DBEBB]/40">
            <h3 className="text-lg font-bold text-[#031926] mb-1">
              Enlace de Sesión Virtual
            </h3>
            <p className="text-xs text-[#031926]/70 mb-4">
              Ingresa el enlace de Google Meet o Zoom para que tu paciente pueda unirse a la sesión.
            </p>

            <form onSubmit={handleGuardarEnlace} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#031926] mb-1">
                  Enlace de Videollamada
                </label>
                <input
                  type="url"
                  required
                  placeholder="https://meet.google.com/xyz-abc-def"
                  value={nuevoEnlace}
                  onChange={(e) => setNuevoEnlace(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-[#9DBEBB]/60 text-xs text-[#031926] focus:outline-none focus:ring-2 focus:ring-[#468189]"
                />
              </div>

              <div className="flex gap-2 pt-2">
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
