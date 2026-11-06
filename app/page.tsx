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
  Briefcase,
  ChevronDown,
  Award,
  Smile,
  Compass
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
  const totalResenas = resenas.length;
  const promedio =
    totalResenas > 0
      ? (resenas.reduce((acc, r) => acc + r.estrellas, 0) / totalResenas).toFixed(1)
      : "0.0";
  const [motivoSeleccionado, setMotivoSeleccionado] = useState<string>("burnout");
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
          } else {
            setResenas([]);
          }
        }
      } catch (err) {
        console.error("Error al cargar reseñas:", err);
        setResenas([]);
      }
    }

    cargarResenas();
  }, []);

  const motivos = [
    {
      id: "burnout",
      icono: "💼",
      titulo: "Burnout & Sobrecarga Laboral",
      descripcion:
        "Fatiga mental extrema, desmotivación laboral, incapacidad para desconectarte del trabajo y sensación constante de agotamiento.",
    },
    {
      id: "ansiedad",
      icono: "🧠",
      titulo: "Ansiedad & Gestión Emocional",
      descripcion:
        "Pensamientos acelerados, preocupación excesiva, ataques de pánico y dificultad para gestionar la incertidumbre.",
    },
    {
      id: "limites",
      icono: "⚖️",
      titulo: "Balance Vida-Trabajo & Límites",
      descripcion:
        "Dificultad para decir 'no', culpa por descansar, problemas de asertividad y balance entre tu profesión y tu vida personal.",
    },
    {
      id: "autoestima",
      icono: "✨",
      titulo: "Autoestima & Síndrome del Impostor",
      descripcion:
        "Inseguridad al liderar, miedo a no ser suficiente, autocrítica paralizante y dudas sobre tus capacidades.",
    },
    {
      id: "transicion",
      icono: "🌱",
      titulo: "Transiciones de Vida & Carrera",
      descripcion:
        "Crisis vocacionales, cambio de empleo, adaptación a nuevas etapas vitales o reconstrucción de tu propósito.",
    },
  ];

  // Preguntas del test interactivo al estilo Selia adaptadas a psicología laboral y terapéutica
  const preguntasTest = [
    {
      pregunta: "¿Sientes que la exigencia de tu trabajo o rutina diaria te deja sin energía para tu vida personal?",
      opciones: [
        { texto: "Rara vez, logro balancear mis tiempos", puntos: 1 },
        { texto: "Frecuentemente termino el día exhausto(a)", puntos: 2 },
        { texto: "Siempre, siento un agotamiento mental constante", puntos: 3 },
      ],
    },
    {
      pregunta: "¿Con qué frecuencia experimentas ansiedad, tensión corporal o dificultad para relajarte?",
      opciones: [
        { texto: "Casi nunca, suelo mantener la calma", puntos: 1 },
        { texto: "En momentos específicos de alta presión", puntos: 2 },
        { texto: "Muy seguido, incluso en mis días libres", puntos: 3 },
      ],
    },
    {
      pregunta: "¿Sientes que cuentas con herramientas para gestionar tus límites y emociones actuales?",
      opciones: [
        { texto: "Sí, me siento en control la mayor parte del tiempo", puntos: 1 },
        { texto: "Me cuesta un poco y a veces me sobrepasan", puntos: 2 },
        { texto: "No, necesito el acompañamiento de un profesional", puntos: 3 },
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
      pregunta: "¿En qué consiste la Psicología Laboral y Terapéutica con Alejandra?",
      respuesta:
        "Es un enfoque integral que une la psicología clínica con el bienestar ocupacional. Te ayuda a entender tanto tus desafíos emocionales profundos como el impacto que el trabajo, la productividad y el estrés tienen en tu salud mental y en tus relaciones.",
    },
    {
      pregunta: "¿Cómo se desarrollan las sesiones online?",
      respuesta:
        "Nos conectamos mediante videollamada privada y cifrada a través de nuestro portal seguro. Las sesiones duran entre 50 y 60 minutos en un espacio confidencial, cómodo y sin interrupciones.",
    },
    {
      pregunta: "¿Cómo garantizan la confidencialidad de lo hablado en terapia?",
      respuesta:
        "Toda la información y lo conversado con Alejandra está protegido bajo estricto secreto profesional y código deontológico de psicología. Tus datos se resguardan con cifrado de grado médico en la plataforma.",
    },
    {
      pregunta: "¿Cuándo puedo calificar mi sesión con Alejandra?",
      respuesta:
        "Para asegurar total transparencia y autenticidad, el sistema habilita la calificación de 1 a 5 estrellas únicamente cuando Alejandra marca tu sesión como finalizada en la plataforma (máximo 1 reseña por servicio prestado).",
    },
  ];

  return (
    <div className="min-h-screen bg-[#FFFDF9] text-slate-800 flex flex-col font-sans selection:bg-rose-100 selection:text-rose-900">
      {/* 1. Header con Branding de Alejandra Bedoya */}
      <header className="border-b border-orange-100/60 bg-[#FFFDF9]/90 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#E87A5D] flex items-center justify-center text-white shadow-sm shadow-orange-200">
              <Brain className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-900 tracking-tight leading-none">
                Alejandra Bedoya
              </h1>
              <p className="text-[11px] text-[#A6604E] font-medium mt-0.5">
                Psicología Laboral & Terapéutica
              </p>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-8 text-xs font-semibold text-slate-600">
            <a href="#sobre-mi" className="hover:text-[#E87A5D] transition">
              Sobre Mí
            </a>
            <a href="#motivos" className="hover:text-[#E87A5D] transition">
              Áreas de Consulta
            </a>
            <a href="#como-trabajo" className="hover:text-[#E87A5D] transition">
              ¿Cómo es el proceso?
            </a>
            <a href="#test" className="hover:text-[#E87A5D] transition">
              Test Rápido
            </a>
            <a href="#opiniones" className="hover:text-[#E87A5D] transition">
              Opiniones de Consultantes
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

      {/* 2. Hero Section: Cálido, Profesional y Directo a Alejandra */}
      <section className="relative overflow-hidden py-14 sm:py-20 bg-gradient-to-b from-[#FFF5EE] via-[#FFFDF9] to-[#FFFDF9] border-b border-orange-100/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Mensaje principal */}
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white border border-orange-200/60 shadow-xs text-xs font-semibold text-[#C85D41]">
                <Sparkles className="w-3.5 h-3.5 text-[#E87A5D]" />
                <span>Atención Psicológica Personalizada con Alejandra Bedoya</span>
              </div>

              <h2 className="text-3xl sm:text-5xl font-extrabold text-slate-900 tracking-tight leading-[1.18]">
                Encuentra el equilibrio entre tu{" "}
                <span className="text-[#E87A5D] underline decoration-orange-200 underline-offset-4">
                  bienestar emocional
                </span>{" "}
                y tu vida laboral.
              </h2>

              <p className="text-sm sm:text-base text-slate-600 leading-relaxed max-w-xl">
                Soy <strong>Alejandra Bedoya</strong>, psicóloga especializada en psicología
                laboral y terapéutica. Te acompaño a superar el agotamiento (burnout), regular la
                ansiedad y construir una vida profesional y personal con sentido y tranquilidad.
              </p>

              {/* Selector de Motivos de Consulta */}
              <div id="motivos" className="pt-2">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
                  ¿Qué desafío estás enfrentando hoy?
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

                {motivoSeleccionado && (
                  <div className="mt-3.5 p-3.5 rounded-2xl bg-white border border-orange-100 text-xs text-slate-600 max-w-xl shadow-xs">
                    <span className="font-bold text-slate-900 block mb-0.5">
                      Enfoque terapéutico de Alejandra:
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
                  <span>Agendar Consulta con Alejandra</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>

                <div className="flex items-center gap-2 pl-2">
                  {totalResenas > 0 ? (
                    <div className="flex items-center gap-1.5">
                      <div className="flex items-center gap-1 text-amber-400">
                        {[...Array(Math.round(Number(promedio)))].map((_, i) => (
                          <Star key={i} className="w-4 h-4 fill-amber-400" />
                        ))}
                      </div>
                      <span className="text-xs font-bold text-slate-800">
                        {promedio} ({totalResenas} opiniones)
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                      <span>Atención 100% Personalizada y Confidencial</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Imagen Principal: Representación cálida de Alejandra en consulta */}
            <div className="lg:col-span-5 relative">
              <div className="relative mx-auto max-w-md lg:max-w-none">
                <div className="rounded-3xl overflow-hidden shadow-2xl border-4 border-white aspect-4/5 bg-slate-100 relative">
                  <img
                    src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=1000&q=80"
                    alt="Alejandra Bedoya Psicóloga Profesional"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/70 via-transparent to-transparent" />
                  <div className="absolute bottom-6 left-6 right-6 text-white">
                    <span className="inline-block px-2.5 py-0.5 rounded-full bg-emerald-500/90 text-white text-[10px] font-bold uppercase tracking-wider mb-2">
                      ● Citas Disponibles
                    </span>
                    <h4 className="text-lg font-bold">Alejandra Bedoya</h4>
                    <p className="text-xs text-orange-200">Psicóloga Laboral & Terapéutica</p>
                  </div>
                </div>

                <div className="absolute -bottom-5 -left-5 bg-white p-3.5 rounded-2xl shadow-xl border border-orange-100 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-orange-50 text-[#E87A5D] flex items-center justify-center">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900">Atención 100% Confidencial</p>
                    <p className="text-[10px] text-slate-500">Secreto profesional ético</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Sección "Sobre Mí" (Perfil Profesional de Alejandra Bedoya) */}
      <section id="sobre-mi" className="py-20 bg-white border-b border-orange-100/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Foto de Alejandra en espacio terapéutico */}
            <div className="lg:col-span-5">
              <div className="relative rounded-3xl overflow-hidden shadow-xl border-2 border-orange-100 aspect-square">
                <img
                  src="https://images.unsplash.com/photo-1573497620053-ea5300f94f21?auto=format&fit=crop&w=900&q=80"
                  alt="Espacio terapéutico de Alejandra Bedoya"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>

            {/* Biografía y Enfoque */}
            <div className="lg:col-span-7 space-y-5">
              <span className="text-xs font-bold uppercase tracking-wider text-[#E87A5D] bg-orange-50 px-3.5 py-1.5 rounded-full border border-orange-100">
                Sobre Mi Trayectoria
              </span>
              <h3 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
                Hola, soy Alejandra Bedoya
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Mi vocación nace de comprender que los seres humanos pasamos una gran parte de
                nuestras vidas trabajando y construyendo metas, pero muchas veces a costa de nuestra
                salud mental, relaciones y paz interior.
              </p>
              <p className="text-sm text-slate-600 leading-relaxed">
                Como <strong>profesional en Psicología Laboral y Terapéutica</strong>, combino
                metodologías clínicas validadas con herramientas prácticas de gestión del estrés,
                autoconocimiento y liderazgo personal. Mi objetivo es que en cada sesión encuentres
                un espacio seguro, libre de juicios y con estrategias claras que puedas aplicar en tu
                vida diaria.
              </p>

              {/* Pilares */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-[#FFFDF9] border border-orange-100">
                  <CheckCircle2 className="w-4 h-4 text-[#E87A5D] shrink-0 mt-0.5" />
                  <span className="text-xs font-semibold text-slate-700">
                    Enfoque Cognitivo & Humanista
                  </span>
                </div>
                <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-[#FFFDF9] border border-orange-100">
                  <CheckCircle2 className="w-4 h-4 text-[#E87A5D] shrink-0 mt-0.5" />
                  <span className="text-xs font-semibold text-slate-700">
                    Especialista en Burnout & Estrés
                  </span>
                </div>
                <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-[#FFFDF9] border border-orange-100">
                  <CheckCircle2 className="w-4 h-4 text-[#E87A5D] shrink-0 mt-0.5" />
                  <span className="text-xs font-semibold text-slate-700">
                    Acompañamiento 100% Personalizado
                  </span>
                </div>
                <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-[#FFFDF9] border border-orange-100">
                  <CheckCircle2 className="w-4 h-4 text-[#E87A5D] shrink-0 mt-0.5" />
                  <span className="text-xs font-semibold text-slate-700">
                    Modalidad Online & Presencial
                  </span>
                </div>
              </div>

              <div className="pt-3">
                <Link
                  href="/login"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#E87A5D] hover:bg-[#D5684C] text-white text-xs sm:text-sm font-bold shadow-md transition"
                >
                  <span>Iniciar proceso con Alejandra</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. ¿Cómo es el proceso conmigo? (3 Pasos claros) */}
      <section id="como-trabajo" className="py-20 bg-[#FFFDF9] border-b border-orange-100/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-xs font-bold uppercase tracking-wider text-[#E87A5D] bg-orange-50 px-3.5 py-1.5 rounded-full border border-orange-100">
              Metodología de Trabajo
            </span>
            <h3 className="text-2xl sm:text-4xl font-extrabold text-slate-900 mt-3 tracking-tight">
              ¿Cómo es iniciar terapia con Alejandra?
            </h3>
            <p className="text-sm text-slate-500 mt-3 leading-relaxed">
              Un camino estructurado, transparente y pensado para que te sientas acompañado en cada momento.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-3xl border border-orange-100/80 shadow-xs hover:shadow-md transition flex flex-col justify-between">
              <div>
                <span className="w-12 h-12 rounded-2xl bg-[#FFF0EB] text-[#E87A5D] font-extrabold text-lg flex items-center justify-center mb-6">
                  01
                </span>
                <h4 className="text-lg font-bold text-slate-900 mb-2">Ingreso al Portal</h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Crea tu cuenta de paciente con Google o correo en menos de un minuto. Tendrás acceso a tu agenda, tareas y diario emocional.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-slate-100 text-[11px] font-semibold text-[#E87A5D]">
                Acceso inmediato y seguro →
              </div>
            </div>

            <div className="bg-white p-8 rounded-3xl border border-orange-100/80 shadow-xs hover:shadow-md transition flex flex-col justify-between">
              <div>
                <span className="w-12 h-12 rounded-2xl bg-[#FFF0EB] text-[#E87A5D] font-extrabold text-lg flex items-center justify-center mb-6">
                  02
                </span>
                <h4 className="text-lg font-bold text-slate-900 mb-2">Sesión con Alejandra</h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Nos conectamos de forma virtual por videollamada cifrada o coordinamos cita presencial. Analizamos tus detonantes y trazamos tu plan.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-slate-100 text-[11px] font-semibold text-[#E87A5D]">
                50 a 60 minutos dedicados a ti →
              </div>
            </div>

            <div className="bg-white p-8 rounded-3xl border border-orange-100/80 shadow-xs hover:shadow-md transition flex flex-col justify-between">
              <div>
                <span className="w-12 h-12 rounded-2xl bg-[#FFF0EB] text-[#E87A5D] font-extrabold text-lg flex items-center justify-center mb-6">
                  03
                </span>
                <h4 className="text-lg font-bold text-slate-900 mb-2">Seguimiento y Calificación</h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Al finalizar la sesión, Alejandra marca el servicio como concluido y podrás calificar tu experiencia de 1 a 5 estrellas para registrar tu avance.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-slate-100 text-[11px] font-semibold text-[#E87A5D]">
                Garantía de transparencia →
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Mini-Test Emocional Interactivo */}
      <section id="test" className="py-20 bg-gradient-to-b from-white to-[#FFF5EE] border-b border-orange-100/60">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <div className="bg-white rounded-3xl p-8 sm:p-10 border border-orange-100 shadow-xl text-center">
            <span className="text-xs font-bold uppercase tracking-wider text-[#E87A5D] bg-orange-50 px-3 py-1 rounded-full border border-orange-100">
              Autoevaluación Gratuita
            </span>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-3">
              ¿Cómo está tu nivel de bienestar laboral y emocional?
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 mt-2 mb-8">
              Responde estas 3 preguntas (1 minuto) para recibir una orientación inmediata.
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
                    Gracias por hacer una pausa y mirarte
                  </h4>
                  <p className="text-xs sm:text-sm text-slate-600 mt-2 max-w-md mx-auto leading-relaxed">
                    Reconocer el cansancio mental o la sobrecarga es el acto más sano. Una sesión de acompañamiento con Alejandra te ayudará a organizar tus prioridades y recuperar tu energía.
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                  <Link
                    href="/login"
                    className="w-full sm:w-auto px-6 py-3 rounded-full bg-[#E87A5D] hover:bg-[#D5684C] text-white font-bold text-xs sm:text-sm shadow-md transition"
                  >
                    Agendar Sesión con Alejandra
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

      {/* 6. Reseñas y Calificaciones Verificadas sobre Alejandra Bedoya */}
      <section id="opiniones" className="py-20 bg-white border-b border-orange-100/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-6 mb-12">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-3.5 py-1.5 rounded-full border border-emerald-200">
                Opiniones Verificadas
              </span>
              <h3 className="text-2xl sm:text-4xl font-extrabold text-slate-900 mt-3 tracking-tight">
                La experiencia de consultantes con Alejandra
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 mt-2 max-w-xl">
                Valoraciones reales de personas que han completado su proceso terapéutico.
              </p>
            </div>

            <div className="bg-[#FFFDF9] p-4 rounded-3xl border border-orange-100 shadow-xs flex items-center gap-4 shrink-0">
              <div className="text-3xl font-extrabold text-slate-900">{promedio}</div>
              <div>
                <div className="flex items-center gap-1 text-amber-400">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-4 h-4 ${
                        i < Math.round(Number(promedio)) && totalResenas > 0
                          ? "fill-amber-400 text-amber-400"
                          : "text-slate-300"
                      }`}
                    />
                  ))}
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5 font-medium">
                  {totalResenas === 0
                    ? "0 calificaciones hasta el momento"
                    : `${totalResenas} calificación(es) verificada(s)`}
                </p>
              </div>
            </div>
          </div>

          {totalResenas === 0 ? (
            <div className="bg-[#FFFDF9] rounded-3xl p-10 border border-orange-100 text-center max-w-2xl mx-auto shadow-xs">
              <div className="w-12 h-12 bg-orange-50 text-[#E87A5D] rounded-2xl flex items-center justify-center mx-auto mb-3">
                <Star className="w-6 h-6" />
              </div>
              <h4 className="text-base font-bold text-slate-800">
                0 calificaciones registradas hasta el momento
              </h4>
              <p className="text-xs text-slate-500 mt-2 max-w-lg mx-auto leading-relaxed">
                En este espacio solo se publican opiniones 100% reales. Cuando un consultante finalice su sesión con la psicóloga Alejandra Bedoya, su valoración de 1 a 5 estrellas se publicará aquí de forma transparente.
              </p>
            </div>
          ) : (
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
          )}

          <div className="mt-8 bg-orange-50/50 border border-orange-100 rounded-2xl p-4 flex items-center gap-3 text-xs text-orange-900">
            <ShieldCheck className="w-5 h-5 text-[#E87A5D] shrink-0" />
            <span>
              <strong>Garantía de Autenticidad:</strong> Cada calificación es ingresada por el consultante desde su portal únicamente después de que Alejandra finaliza la sesión terapéutica (máximo 1 reseña por servicio).
            </span>
          </div>
        </div>
      </section>

      {/* 7. Preguntas Frecuentes */}
      <section className="py-20 bg-[#FFFDF9] border-b border-orange-100/60">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-14">
            <span className="text-xs font-bold uppercase tracking-wider text-[#E87A5D] bg-orange-50 px-3.5 py-1.5 rounded-full border border-orange-100">
              Respuestas Claras
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

      {/* 8. CTA Final */}
      <section className="py-20 bg-[#E87A5D] text-white">
        <div className="max-w-4xl mx-auto px-4 text-center space-y-6">
          <span className="inline-block px-3.5 py-1 rounded-full bg-white/20 text-xs font-bold uppercase tracking-wider">
            Comienza hoy
          </span>
          <h3 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
            Prioriza tu bienestar emocional y laboral
          </h3>
          <p className="text-orange-100 text-xs sm:text-sm max-w-xl mx-auto leading-relaxed">
            Ingresa a tu portal confidencial, reserva tu espacio con Alejandra y comienza a dar pasos firmes hacia la tranquilidad que mereces.
          </p>
          <div className="pt-2">
            <Link
              href="/login"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-white text-[#E87A5D] font-extrabold text-sm shadow-xl hover:bg-orange-50 transition cursor-pointer"
            >
              <CalendarCheck className="w-5 h-5 text-[#E87A5D]" />
              <span>Agendar cita con Alejandra</span>
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
              <p className="font-bold text-white text-sm">Alejandra Bedoya</p>
              <p className="text-[10px] text-slate-500">Psicóloga Profesional en Psicología Laboral y Terapéutica</p>
            </div>
          </div>

          <p className="text-slate-500 text-center sm:text-right">
            © 2026 Alejandra Bedoya. Todos los derechos reservados.
            <br />
            Atención psicológica amparada bajo el secreto profesional y código ético de salud.
          </p>
        </div>
      </footer>
    </div>
  );
}
