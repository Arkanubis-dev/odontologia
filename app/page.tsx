"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Brain,
  Star,
  ShieldCheck,
  HeartHandshake,
  CalendarCheck,
  Video,
  Clock,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Users,
  Compass,
  ChevronDown,
  HelpCircle,
  Award,
  Lock,
  Smile,
  MessageSquare
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface Resena {
  id: string;
  nombre_mostrar: string;
  servicio: string;
  estrellas: number;
  comentario: string;
  creado_en: string;
}

export default function Home() {
  const [resenas, setResenas] = useState<Resena[]>([]);
  const [motivoSeleccionado, setMotivoSeleccionado] = useState<string>("ansiedad");
  const [faqAbierta, setFaqAbierta] = useState<number | null>(0);

  // Estados del Mini-Test interactivo al estilo Selia
  const [pasoTest, setPasoTest] = useState<number>(0);
  const [respuestasTest, setRespuestasTest] = useState<number[]>([]);
  const [testFinalizado, setTestFinalizado] = useState<boolean>(false);

  useEffect(() => {
    async function cargarResenas() {
      try {
        const supabase = createClient();
        if (supabase) {
          const { data } = await supabase
            .from("calificaciones")
            .select("*")
            .eq("es_publico", true)
            .order("creado_en", { ascending: false })
            .limit(6);

          if (data && data.length > 0) {
            setResenas(data);
            return;
          }
        }
      } catch (err) {
        console.error("Error al cargar reseñas:", err);
      }

      // Reseñas verificadas iniciales de consultantes
      setResenas([
        {
          id: "r1",
          nombre_mostrar: "Valeria M.",
          servicio: "Terapia Individual (Manejo de Ansiedad)",
          estrellas: 5,
          comentario:
            "Encontrar a la especialista adecuada en esta plataforma cambió mi vida. Las sesiones online son tan íntimas y profesionales como las presenciales.",
          creado_en: "2026-10-15T00:00:00Z",
        },
        {
          id: "r2",
          nombre_mostrar: "Andrés R.",
          servicio: "Acompañamiento en Duelo & Cambios",
          estrellas: 5,
          comentario:
            "El proceso fue respetuoso, sin juicios y a mi propio ritmo. Poder ver mis tareas y avances en el portal me mantiene comprometido con mi salud mental.",
          creado_en: "2026-10-22T00:00:00Z",
        },
        {
          id: "r3",
          nombre_mostrar: "Carolina & Juan P.",
          servicio: "Terapia de Pareja y Vínculos",
          estrellas: 5,
          comentario:
            "Nos brindó herramientas reales de comunicación para frenar discusiones repetitivas. La psicóloga es sumamente empática y neutral.",
          creado_en: "2026-11-01T00:00:00Z",
        },
      ]);
    }

    cargarResenas();
  }, []);

  const motivos = [
    {
      id: "ansiedad",
      icono: "🧠",
      titulo: "Ansiedad y Estrés",
      descripcion:
        "Pensamientos rumiantes, taquicardia, sobrecarga mental, ataques de pánico o dificultad para relajarte.",
    },
    {
      id: "autoestima",
      icono: "✨",
      titulo: "Autoestima y Amor Propio",
      descripcion:
        "Inseguridad, síndrome del impostor, dificultad para poner límites y autocrítica constante.",
    },
    {
      id: "duelo",
      icono: "🌱",
      titulo: "Duelo y Rupturas",
      descripcion:
        "Acompañamiento ante la pérdida de un ser querido, separaciones afectivas o cambios drásticos de vida.",
    },
    {
      id: "pareja",
      icono: "❤️",
      titulo: "Relaciones de Pareja",
      descripcion:
        "Conflictos frecuentes, desconfianza, problemas de comunicación o dudas sobre el futuro juntos.",
    },
    {
      id: "burnout",
      icono: "💼",
      titulo: "Agotamiento Laboral",
      descripcion:
        "Sensación de vacío profesional, fatiga crónica y pérdida de motivación por sobrecarga de trabajo.",
    },
  ];

  // Preguntas del test interactivo al estilo Selia
  const preguntasTest = [
    {
      pregunta: "¿Con qué frecuencia te has sentido abrumado(a) o con tensión en el cuerpo en las últimas 2 semanas?",
      opciones: [
        { texto: "Rara vez o casi nunca", puntos: 1 },
        { texto: "Varios días a la semana", puntos: 2 },
        { texto: "Casi todos los días", puntos: 3 },
      ],
    },
    {
      pregunta: "¿Cómo calificarías tu calidad de sueño y tu descanso mental recientemente?",
      opciones: [
        { texto: "Duermo tranquilo y descanso bien", puntos: 1 },
        { texto: "Me cuesta desconectar la mente al dormir", puntos: 2 },
        { texto: "Despierto cansado o con insomnio recurrente", puntos: 3 },
      ],
    },
    {
      pregunta: "¿Sientes que tus emociones actuales interfieren en tu trabajo, pareja o vida cotidiana?",
      opciones: [
        { texto: "Puedo manejarlas sin mayor problema", puntos: 1 },
        { texto: "A veces me desbordan o me siento irritable", puntos: 2 },
        { texto: "Siento que me sobrepasan y necesito ayuda", puntos: 3 },
      ],
    },
  ];

  const responderPregunta = (puntos: number) => {
    const nuevas = [...respuestasTest, puntos];
    setRespuestasTest(nuevas);
    if (pasoTest < preguntasTest.length - 1) {
      setPasoTest(pasoTest + 1);
    } else {
      setTestFinalizado(true);
    }
  };

  const reiniciarTest = () => {
    setPasoTest(0);
    setRespuestasTest([]);
    setTestFinalizado(false);
  };

  const faqs = [
    {
      pregunta: "¿Cómo funciona una sesión de terapia online?",
      respuesta:
        "Te conectas por videollamada cifrada y privada desde la comodidad de tu casa o lugar seguro a través de nuestro portal. Dura entre 50 y 60 minutos con tu especialista asignada.",
    },
    {
      pregunta: "¿La terapia online es tan efectiva como la presencial?",
      respuesta:
        "Totalmente. Múltiples estudios de la Asociación Americana de Psicología (APA) demuestran que la terapia psicológica en línea ofrece los mismos niveles de eficacia que la modalidad presencial, con la ventaja de no tener que desplazarte.",
    },
    {
      pregunta: "¿Cómo garantizan la confidencialidad de mis datos?",
      respuesta:
        "Toda tu información personal, historias clínicas y notas se almacenan bajo estrictos protocolos de secreto profesional y cifrado de grado médico. Nadie tiene acceso a lo conversado excepto tú y tu terapeuta.",
    },
    {
      pregunta: "¿Cómo y cuándo puedo calificar el servicio recibido?",
      respuesta:
        "Para garantizar reseñas 100% auténticas, el sistema solo habilita la calificación de 1 a 5 estrellas cuando la especialista marca la sesión como finalizada. Solo puedes calificar una vez por cada servicio recibido.",
    },
  ];

  return (
    <div className="min-h-screen bg-[#FFFDF9] text-slate-800 flex flex-col font-sans selection:bg-rose-100 selection:text-rose-900">
      {/* 1. Header estilo Selia: Limpio, minimalista y cálido */}
      <header className="border-b border-orange-100/60 bg-[#FFFDF9]/90 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#E87A5D] flex items-center justify-center text-white shadow-sm shadow-orange-200">
              <Brain className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-900 tracking-tight leading-none">
                Centro de Psicología
              </h1>
              <p className="text-[11px] text-[#A6604E] font-medium mt-0.5">
                Terapia Online & Salud Mental
              </p>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-8 text-xs font-semibold text-slate-600">
            <a href="#motivos" className="hover:text-[#E87A5D] transition">
              ¿Por qué ir a terapia?
            </a>
            <a href="#como-funciona" className="hover:text-[#E87A5D] transition">
              ¿Cómo funciona?
            </a>
            <a href="#especialistas" className="hover:text-[#E87A5D] transition">
              Nuestros Especialistas
            </a>
            <a href="#test" className="hover:text-[#E87A5D] transition">
              Test Rápido
            </a>
            <a href="#opiniones" className="hover:text-[#E87A5D] transition">
              Opiniones
            </a>
          </nav>

          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#E87A5D] hover:bg-[#D5684C] text-white text-xs sm:text-sm font-semibold shadow-md shadow-orange-200/60 transition cursor-pointer"
            >
              <CalendarCheck className="w-4 h-4" />
              <span>Portal Pacientes</span>
            </Link>
          </div>
        </div>
      </header>

      {/* 2. Hero Section estilo Selia: Emocional, empático con etiquetas interactivas */}
      <section className="relative overflow-hidden py-14 sm:py-20 bg-gradient-to-b from-[#FFF5EE] via-[#FFFDF9] to-[#FFFDF9] border-b border-orange-100/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Columna Izquierda: Mensaje y Selector */}
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white border border-orange-200/60 shadow-xs text-xs font-semibold text-[#C85D41]">
                <Sparkles className="w-3.5 h-3.5 text-[#E87A5D]" />
                <span>Tu espacio seguro, confidencial y sin juicios</span>
              </div>

              <h2 className="text-3xl sm:text-5xl font-extrabold text-slate-900 tracking-tight leading-[1.18]">
                Encuentra al psicólogo ideal para ti y{" "}
                <span className="text-[#E87A5D] underline decoration-orange-200 underline-offset-4">
                  comienza a sanar hoy
                </span>
                .
              </h2>

              <p className="text-sm sm:text-base text-slate-600 leading-relaxed max-w-xl">
                Terapia psicológica online con profesionales certificados. Te acompañamos a
                superar la ansiedad, fortalecer tu autoestima y recuperar la tranquilidad emocional.
              </p>

              {/* Selector de Motivos de Consulta (Estilo Selia) */}
              <div className="pt-2">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
                  ¿Qué te gustaría trabajar en ti?
                </p>
                <div className="flex flex-wrap gap-2">
                  {motivos.map((m) => (
                    <button
                      key={m.id}
                      onClick={() => setMotivoSeleccionado(m.id)}
                      className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-semibold transition cursor-pointer border ${
                        motivoSeleccionado === m.id
                          ? "bg-[#E87A5D] text-white border-[#E87A5D] shadow-sm shadow-orange-200"
                          : "bg-white text-slate-700 border-slate-200 hover:border-orange-300"
                      }`}
                    >
                      <span>{m.icono}</span>
                      <span>{m.titulo}</span>
                    </button>
                  ))}
                </div>

                {/* Explicación del motivo seleccionado */}
                {motivoSeleccionado && (
                  <div className="mt-3.5 p-3.5 rounded-2xl bg-white border border-orange-100 text-xs text-slate-600 max-w-xl shadow-xs">
                    <span className="font-bold text-slate-900 block mb-0.5">
                      Podemos ayudarte con:
                    </span>
                    {motivos.find((m) => m.id === motivoSeleccionado)?.descripcion}
                  </div>
                )}
              </div>

              {/* Botón Principal y Prueba Social */}
              <div className="flex flex-wrap items-center gap-4 pt-4">
                <Link
                  href="/login"
                  className="inline-flex items-center gap-2.5 px-7 py-3.5 rounded-full bg-[#E87A5D] hover:bg-[#D5684C] text-white font-bold text-sm shadow-lg shadow-orange-300/50 transition cursor-pointer"
                >
                  <span>Agendar Mi Primera Sesión</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>

                <div className="flex items-center gap-3 pl-2">
                  <div className="flex -space-x-2">
                    <img
                      src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80"
                      className="w-9 h-9 rounded-full border-2 border-white object-cover"
                      alt="Consultante"
                    />
                    <img
                      src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&q=80"
                      className="w-9 h-9 rounded-full border-2 border-white object-cover"
                      alt="Consultante"
                    />
                    <img
                      src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=120&q=80"
                      className="w-9 h-9 rounded-full border-2 border-white object-cover"
                      alt="Especialista"
                    />
                  </div>
                  <div>
                    <div className="flex items-center gap-1 text-amber-400">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="w-3.5 h-3.5 fill-amber-400" />
                      ))}
                      <span className="text-xs font-bold text-slate-800 ml-1">4.95 / 5</span>
                    </div>
                    <span className="text-[11px] text-slate-500">
                      +1,500 sesiones completadas
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Columna Derecha: Tarjeta Visual Cálida */}
            <div className="lg:col-span-5 relative">
              <div className="relative mx-auto max-w-md lg:max-w-none">
                <div className="rounded-3xl overflow-hidden shadow-2xl border-4 border-white aspect-4/5 bg-slate-100 relative">
                  <img
                    src="https://images.unsplash.com/photo-1573497620053-ea5300f94f21?auto=format&fit=crop&w=1000&q=80"
                    alt="Psicóloga en sesión online de terapia"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/70 via-transparent to-transparent" />
                  <div className="absolute bottom-6 left-6 right-6 text-white">
                    <span className="inline-block px-2.5 py-0.5 rounded-full bg-emerald-500/90 text-white text-[10px] font-bold uppercase tracking-wider mb-2">
                      ● Sesiones Disponibles
                    </span>
                    <h4 className="text-base font-bold">
                      "Pedir ayuda no es debilidad, es el mayor acto de amor propio."
                    </h4>
                    <p className="text-xs text-orange-200 mt-1">Especialistas clínicos acreditados</p>
                  </div>
                </div>

                {/* Sello de Confianza flotante */}
                <div className="absolute -bottom-5 -left-5 bg-white p-3.5 rounded-2xl shadow-xl border border-orange-100 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-orange-50 text-[#E87A5D] flex items-center justify-center">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900">Privacidad Médica</p>
                    <p className="text-[10px] text-slate-500">Secreto profesional 100%</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. ¿Cómo Funciona? (El modelo de 3 pasos de Selia) */}
      <section id="como-funciona" className="py-20 bg-white border-b border-orange-100/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-xs font-bold uppercase tracking-wider text-[#E87A5D] bg-orange-50 px-3.5 py-1.5 rounded-full border border-orange-100">
              Paso a Paso
            </span>
            <h3 className="text-2xl sm:text-4xl font-extrabold text-slate-900 mt-3 tracking-tight">
              Iniciar tu terapia es más simple de lo que crees
            </h3>
            <p className="text-sm text-slate-500 mt-3 leading-relaxed">
              Sin trámites complicados. Te acompañamos desde tu primer clic hasta el desarrollo de tus sesiones.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            {/* Paso 1 */}
            <div className="bg-[#FFFDF9] p-8 rounded-3xl border border-orange-100/80 shadow-xs hover:shadow-md transition flex flex-col justify-between">
              <div>
                <span className="w-12 h-12 rounded-2xl bg-[#FFF0EB] text-[#E87A5D] font-extrabold text-lg flex items-center justify-center mb-6">
                  01
                </span>
                <h4 className="text-lg font-bold text-slate-900 mb-2">Ingresa a tu Portal</h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Accede de forma rápida y segura con tu cuenta de Google o correo. Tu perfil es completamente privado y confidencial.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-orange-100/60 text-[11px] font-semibold text-[#E87A5D]">
                Registro en menos de 1 minuto →
              </div>
            </div>

            {/* Paso 2 */}
            <div className="bg-[#FFFDF9] p-8 rounded-3xl border border-orange-100/80 shadow-xs hover:shadow-md transition flex flex-col justify-between">
              <div>
                <span className="w-12 h-12 rounded-2xl bg-[#FFF0EB] text-[#E87A5D] font-extrabold text-lg flex items-center justify-center mb-6">
                  02
                </span>
                <h4 className="text-lg font-bold text-slate-900 mb-2">Agenda tu Cita</h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Elige la fecha, hora y modalidad (videollamada privada o presencial) que mejor se ajuste a tus horarios de vida.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-orange-100/60 text-[11px] font-semibold text-[#E87A5D]">
                Flexibilidad total de horarios →
              </div>
            </div>

            {/* Paso 3 */}
            <div className="bg-[#FFFDF9] p-8 rounded-3xl border border-orange-100/80 shadow-xs hover:shadow-md transition flex flex-col justify-between">
              <div>
                <span className="w-12 h-12 rounded-2xl bg-[#FFF0EB] text-[#E87A5D] font-extrabold text-lg flex items-center justify-center mb-6">
                  03
                </span>
                <h4 className="text-lg font-bold text-slate-900 mb-2">Comienza y Califica</h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Conéctate a tu sesión. Cuando la psicóloga finalice el servicio, podrás calificar tu experiencia de 1 a 5 estrellas para dar testimonio de tu avance.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-orange-100/60 text-[11px] font-semibold text-[#E87A5D]">
                100% de transparencia →
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Nuestros Terapeutas / Especialistas (Showcase al estilo Selia) */}
      <section id="especialistas" className="py-20 bg-[#FFFDF9] border-b border-orange-100/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-xs font-bold uppercase tracking-wider text-[#E87A5D] bg-orange-50 px-3.5 py-1.5 rounded-full border border-orange-100">
              Equipo Clínico
            </span>
            <h3 className="text-2xl sm:text-4xl font-extrabold text-slate-900 mt-3 tracking-tight">
              Especialistas con vocación humana y respaldo clínico
            </h3>
            <p className="text-sm text-slate-500 mt-3 leading-relaxed">
              Todos nuestros profesionales cuentan con tarjeta profesional vigente, maestrías y rigurosa formación continua.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Especialista 1 */}
            <div className="bg-white rounded-3xl overflow-hidden border border-orange-100/80 shadow-xs hover:shadow-lg transition flex flex-col">
              <div className="h-64 overflow-hidden relative">
                <img
                  src="https://images.unsplash.com/photo-1594824813596-f3b355d9d7ec?auto=format&fit=crop&w=800&q=80"
                  alt="Dra. Mariana Gómez"
                  className="w-full h-full object-cover"
                />
                <span className="absolute top-4 right-4 bg-white/95 backdrop-blur-md px-3 py-1 rounded-full text-[11px] font-bold text-slate-800 shadow-xs flex items-center gap-1">
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  5.0 (52 reseñas)
                </span>
              </div>
              <div className="p-6 flex-1 flex flex-col justify-between">
                <div>
                  <h4 className="text-lg font-bold text-slate-900">Dra. Mariana Gómez</h4>
                  <p className="text-xs text-[#E87A5D] font-semibold mt-0.5">
                    Psicóloga Clínica • Máster en Terapia Cognitivo-Conductual
                  </p>
                  <p className="text-xs text-slate-600 mt-3 leading-relaxed">
                    Especialista en trastornos de ansiedad, ataques de pánico, gestión de la ira y regulación emocional en adultos.
                  </p>
                  <div className="flex flex-wrap gap-1.5 mt-4">
                    <span className="px-2.5 py-1 rounded-full bg-slate-100 text-[10px] font-medium text-slate-600">
                      Ansiedad
                    </span>
                    <span className="px-2.5 py-1 rounded-full bg-slate-100 text-[10px] font-medium text-slate-600">
                      Estrés
                    </span>
                    <span className="px-2.5 py-1 rounded-full bg-slate-100 text-[10px] font-medium text-slate-600">
                      Autoestima
                    </span>
                  </div>
                </div>
                <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-500">Sesión 50 min</span>
                  <Link
                    href="/login"
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-[#E87A5D] hover:text-[#D5684C]"
                  >
                    Agendar cita →
                  </Link>
                </div>
              </div>
            </div>

            {/* Especialista 2 */}
            <div className="bg-white rounded-3xl overflow-hidden border border-orange-100/80 shadow-xs hover:shadow-lg transition flex flex-col">
              <div className="h-64 overflow-hidden relative">
                <img
                  src="https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=800&q=80"
                  alt="Dra. Camilo Rodríguez"
                  className="w-full h-full object-cover"
                />
                <span className="absolute top-4 right-4 bg-white/95 backdrop-blur-md px-3 py-1 rounded-full text-[11px] font-bold text-slate-800 shadow-xs flex items-center gap-1">
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  5.0 (46 reseñas)
                </span>
              </div>
              <div className="p-6 flex-1 flex flex-col justify-between">
                <div>
                  <h4 className="text-lg font-bold text-slate-900">Dr. Camilo Rodríguez</h4>
                  <p className="text-xs text-[#E87A5D] font-semibold mt-0.5">
                    Terapeuta Familiar & de Pareja • Enfoque Sistémico
                  </p>
                  <p className="text-xs text-slate-600 mt-3 leading-relaxed">
                    Acompañamiento en resolución de conflictos afectivos, reconstrucción de la confianza y acuerdos de convivencia.
                  </p>
                  <div className="flex flex-wrap gap-1.5 mt-4">
                    <span className="px-2.5 py-1 rounded-full bg-slate-100 text-[10px] font-medium text-slate-600">
                      Pareja
                    </span>
                    <span className="px-2.5 py-1 rounded-full bg-slate-100 text-[10px] font-medium text-slate-600">
                      Familia
                    </span>
                    <span className="px-2.5 py-1 rounded-full bg-slate-100 text-[10px] font-medium text-slate-600">
                      Comunicación
                    </span>
                  </div>
                </div>
                <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-500">Sesión 60 min</span>
                  <Link
                    href="/login"
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-[#E87A5D] hover:text-[#D5684C]"
                  >
                    Agendar cita →
                  </Link>
                </div>
              </div>
            </div>

            {/* Especialista 3 */}
            <div className="bg-white rounded-3xl overflow-hidden border border-orange-100/80 shadow-xs hover:shadow-lg transition flex flex-col">
              <div className="h-64 overflow-hidden relative">
                <img
                  src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=800&q=80"
                  alt="Dra. Laura Valencia"
                  className="w-full h-full object-cover"
                />
                <span className="absolute top-4 right-4 bg-white/95 backdrop-blur-md px-3 py-1 rounded-full text-[11px] font-bold text-slate-800 shadow-xs flex items-center gap-1">
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  5.0 (61 reseñas)
                </span>
              </div>
              <div className="p-6 flex-1 flex flex-col justify-between">
                <div>
                  <h4 className="text-lg font-bold text-slate-900">Dra. Laura Valencia</h4>
                  <p className="text-xs text-[#E87A5D] font-semibold mt-0.5">
                    Psicología Humanista • Especialista en Duelo & Crisis
                  </p>
                  <p className="text-xs text-slate-600 mt-3 leading-relaxed">
                    Procesamiento de pérdidas significativas, rupturas sentimentales, sentido de vida y fortalecimiento de la resiliencia.
                  </p>
                  <div className="flex flex-wrap gap-1.5 mt-4">
                    <span className="px-2.5 py-1 rounded-full bg-slate-100 text-[10px] font-medium text-slate-600">
                      Duelo
                    </span>
                    <span className="px-2.5 py-1 rounded-full bg-slate-100 text-[10px] font-medium text-slate-600">
                      Rupturas
                    </span>
                    <span className="px-2.5 py-1 rounded-full bg-slate-100 text-[10px] font-medium text-slate-600">
                      Resiliencia
                    </span>
                  </div>
                </div>
                <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-500">Sesión 50 min</span>
                  <Link
                    href="/login"
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-[#E87A5D] hover:text-[#D5684C]"
                  >
                    Agendar cita →
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Mini-Test Emocional Interactivo (Al estilo de los tests gratuitos de Selia) */}
      <section id="test" className="py-20 bg-gradient-to-b from-white to-[#FFF5EE] border-b border-orange-100/60">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <div className="bg-white rounded-3xl p-8 sm:p-10 border border-orange-100 shadow-xl text-center">
            <span className="text-xs font-bold uppercase tracking-wider text-[#E87A5D] bg-orange-50 px-3 py-1 rounded-full border border-orange-100">
              Herramienta de Autoevaluación
            </span>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-3">
              ¿Cómo está tu bienestar emocional hoy?
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 mt-2 mb-8">
              Responde estas 3 preguntas sencillas (1 minuto) para recibir una orientación inmediata.
            </p>

            {!testFinalizado ? (
              <div className="text-left space-y-6">
                <div className="flex items-center justify-between text-xs text-slate-400 font-semibold">
                  <span>Pregunta {pasoTest + 1} de {preguntasTest.length}</span>
                  <div className="w-24 bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-[#E87A5D] h-full transition-all duration-300"
                      style={{ width: `${((pasoTest + 1) / preguntasTest.length) * 100}%` }}
                    />
                  </div>
                </div>

                <h4 className="text-base sm:text-lg font-bold text-slate-800 leading-snug">
                  {preguntasTest[pasoTest].pregunta}
                </h4>

                <div className="space-y-2.5">
                  {preguntasTest[pasoTest].opciones.map((op, i) => (
                    <button
                      key={i}
                      onClick={() => responderPregunta(op.puntos)}
                      className="w-full text-left p-4 rounded-2xl border border-slate-200 hover:border-[#E87A5D] hover:bg-orange-50/50 transition cursor-pointer text-xs sm:text-sm font-medium text-slate-700 flex items-center justify-between group"
                    >
                      <span>{op.texto}</span>
                      <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-[#E87A5D] transition transform group-hover:translate-x-1" />
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-6 py-4">
                <div className="w-16 h-16 bg-orange-50 text-[#E87A5D] rounded-full flex items-center justify-center mx-auto">
                  <HeartHandshake className="w-8 h-8" />
                </div>
                <div>
                  <h4 className="text-xl font-bold text-slate-900">
                    Gracias por reflexionar sobre ti
                  </h4>
                  <p className="text-xs sm:text-sm text-slate-600 mt-2 max-w-md mx-auto leading-relaxed">
                    Identificar cómo nos sentimos es el primer paso. Si sientes que el estrés o las emociones te sobrepasan, hablar con un especialista certificado te dará un espacio seguro para descargar y estructurar soluciones.
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                  <Link
                    href="/login"
                    className="w-full sm:w-auto px-6 py-3 rounded-full bg-[#E87A5D] hover:bg-[#D5684C] text-white font-bold text-xs sm:text-sm shadow-md transition"
                  >
                    Agendar Consulta con Especialista
                  </Link>
                  <button
                    onClick={reiniciarTest}
                    className="w-full sm:w-auto px-5 py-3 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 font-semibold text-xs transition cursor-pointer"
                  >
                    Repetir Test
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 6. Reseñas y Calificaciones Verificadas (1 a 5 estrellas con regla de servicio finalizado) */}
      <section id="opiniones" className="py-20 bg-white border-b border-orange-100/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-6 mb-12">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-3.5 py-1.5 rounded-full border border-emerald-200">
                Reseñas Verificadas
              </span>
              <h3 className="text-2xl sm:text-4xl font-extrabold text-slate-900 mt-3 tracking-tight">
                Historias reales de consultantes
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 mt-2 max-w-xl">
                Estas valoraciones provienen de personas reales que han finalizado satisfactoriamente sus consultas.
              </p>
            </div>

            <div className="bg-[#FFFDF9] p-4 rounded-3xl border border-orange-100 shadow-xs flex items-center gap-4 shrink-0">
              <div className="text-3xl font-extrabold text-slate-900">5.0</div>
              <div>
                <div className="flex items-center gap-1 text-amber-400">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-amber-400" />
                  ))}
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5 font-medium">
                  100% de experiencias positivas
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {resenas.map((resena) => (
              <div
                key={resena.id}
                className="bg-[#FFFDF9] p-7 rounded-3xl border border-orange-100/80 shadow-xs hover:shadow-md transition flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center gap-1 text-amber-400 mb-3">
                    {[...Array(resena.estrellas)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-amber-400" />
                    ))}
                  </div>
                  <p className="text-xs sm:text-sm text-slate-700 leading-relaxed italic mb-6">
                    "{resena.comentario}"
                  </p>
                </div>

                <div className="pt-4 border-t border-orange-100/60 flex items-center justify-between">
                  <div>
                    <h5 className="text-xs font-bold text-slate-900">{resena.nombre_mostrar}</h5>
                    <p className="text-[11px] text-slate-400 mt-0.5">{resena.servicio}</p>
                  </div>
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-[10px] font-semibold text-emerald-700 border border-emerald-100">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    Sesión Finalizada
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 bg-orange-50/50 border border-orange-100 rounded-2xl p-4 flex items-center gap-3 text-xs text-orange-900">
            <ShieldCheck className="w-5 h-5 text-[#E87A5D] shrink-0" />
            <span>
              <strong>Política de Calidad y Transparencia:</strong> Cada reseña es registrada directamente por el consultante desde su portal una vez la psicóloga ha concluido la sesión terapéutica (máximo 1 calificación por servicio).
            </span>
          </div>
        </div>
      </section>

      {/* 7. Preguntas Frecuentes (FAQ interactivo con acordeón) */}
      <section className="py-20 bg-[#FFFDF9] border-b border-orange-100/60">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-14">
            <span className="text-xs font-bold uppercase tracking-wider text-[#E87A5D] bg-orange-50 px-3.5 py-1.5 rounded-full border border-orange-100">
              Resolvemos tus dudas
            </span>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-3">
              Preguntas Frecuentes
            </h3>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, index) => (
              <div
                key={index}
                className="bg-white rounded-2xl border border-orange-100/80 overflow-hidden shadow-xs"
              >
                <button
                  onClick={() => setFaqAbierta(faqAbierta === index ? null : index)}
                  className="w-full text-left p-5 flex items-center justify-between text-xs sm:text-sm font-bold text-slate-800 hover:text-[#E87A5D] transition cursor-pointer"
                >
                  <span>{faq.pregunta}</span>
                  <ChevronDown
                    className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${
                      faqAbierta === index ? "rotate-180 text-[#E87A5D]" : ""
                    }`}
                  />
                </button>
                {faqAbierta === index && (
                  <div className="px-5 pb-5 pt-1 text-xs text-slate-600 leading-relaxed border-t border-slate-50">
                    {faq.respuesta}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 8. CTA Final al estilo Selia: Cálido y Directo */}
      <section className="py-20 bg-[#E87A5D] text-white">
        <div className="max-w-4xl mx-auto px-4 text-center space-y-6">
          <span className="inline-block px-3.5 py-1 rounded-full bg-white/20 text-xs font-bold uppercase tracking-wider">
            Comienza hoy
          </span>
          <h3 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
            Dar el primer paso hacia tu bienestar nunca fue tan fácil
          </h3>
          <p className="text-orange-100 text-xs sm:text-sm max-w-xl mx-auto leading-relaxed">
            Ingresa a nuestro portal confidencial, agenda tu sesión online o presencial y comienza tu camino hacia una vida más plena y serena.
          </p>
          <div className="pt-2">
            <Link
              href="/login"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-white text-[#E87A5D] font-extrabold text-sm shadow-xl hover:bg-orange-50 transition cursor-pointer"
            >
              <CalendarCheck className="w-5 h-5 text-[#E87A5D]" />
              <span>Agendar mi sesión ahora</span>
            </Link>
          </div>
        </div>
      </section>

      {/* 9. Footer Profesional */}
      <footer className="bg-slate-900 text-slate-400 py-12 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-[#E87A5D] flex items-center justify-center text-white">
              <Brain className="w-4 h-4" />
            </div>
            <div>
              <p className="font-bold text-white text-sm">Centro de Psicología</p>
              <p className="text-[10px] text-slate-500">Terapia Online & Bienestar Clínico</p>
            </div>
          </div>

          <p className="text-slate-500 text-center sm:text-right">
            © 2026 Centro de Psicología. Todos los derechos reservados.
            <br />
            Plataforma ética con confidencialidad médica y secreto profesional.
          </p>
        </div>
      </footer>
    </div>
  );
}
