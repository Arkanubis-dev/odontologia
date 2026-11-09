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
  Compass,
  Menu,
  X,
  UserCheck,
  HelpCircle,
  MessageCircle
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

function WhatsAppIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
    </svg>
  );
}

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
  const [menuLateralAbierto, setMenuLateralAbierto] = useState<boolean>(false);

  const enlacesNavegacion = [
    { href: "#hero", etiqueta: "Inicio" },
    { href: "#motivos", etiqueta: "Áreas Clínicas" },
    { href: "#sobre-mi", etiqueta: "Sobre Alejandra" },
    { href: "#como-trabajo", etiqueta: "Metodología" },
    { href: "#test", etiqueta: "Autoevaluación" },
    { href: "#opiniones", etiqueta: "Opiniones Verificadas" },
    { href: "#faqs", etiqueta: "Preguntas Frecuentes" },
  ];

  // Estados del Mini-Test interactivo
  const [pasoTest, setPasoTest] = useState<number>(0);
  const [respuestasTest, setRespuestasTest] = useState<number[]>([]);
  const [testFinalizado, setTestFinalizado] = useState<boolean>(false);

  useEffect(() => {
    async function cargarResenas() {
      try {
        const res = await fetch("/api/calificaciones");
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            setResenas(data);
            return;
          }
        }
        setResenas([]);
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
      icono: Briefcase,
      titulo: "Burnout & Sobrecarga Laboral",
      descripcion:
        "Fatiga mental persistente, desmotivación, incapacidad para desconectarte del trabajo y sensación constante de agotamiento.",
    },
    {
      id: "ansiedad",
      icono: Brain,
      titulo: "Ansiedad & Gestión Emocional",
      descripcion:
        "Pensamientos acelerados, preocupación excesiva, dificultad para respirar con calma o gestionar la incertidumbre profesional.",
    },
    {
      id: "limites",
      icono: Compass,
      titulo: "Balance Vida-Trabajo & Límites",
      descripcion:
        "Dificultad para decir 'no', culpa por descansar, problemas de asertividad y conflicto entre el trabajo y tu tranquilidad.",
    },
    {
      id: "autoestima",
      icono: Sparkles,
      titulo: "Autoestima & Síndrome del Impostor",
      descripcion:
        "Inseguridad al liderar, miedo constante al error, autocrítica paralizante y dudas sobre tus verdaderas capacidades.",
    },
    {
      id: "transicion",
      icono: Clock,
      titulo: "Transiciones de Vida & Carrera",
      descripcion:
        "Crisis vocacionales, cambio de empleo, adaptación a nuevas etapas de vida o búsqueda de un nuevo propósito.",
    },
  ];

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
    <div className="min-h-screen bg-[#FBF8F1] text-[#031926] flex flex-col font-sans selection:bg-[#9DBEBB]/40 selection:text-[#031926]">
      {/* 1. Barra Lateral Fija a la Izquierda en Midnight Navy (#031926) angosta con cinta Slate Teal (#468189) */}
      <aside
        className={`fixed top-0 left-0 bottom-0 w-56 bg-[#031926] text-white border-r-4 border-r-[#468189] shadow-2xl z-40 flex flex-col justify-between transition-transform duration-300 ease-out ${
          menuLateralAbierto ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        <div className="flex flex-col h-full overflow-hidden">
          {/* Logo de la empresa en la parte superior de la barra lateral */}
          <div className="p-4 pb-3.5 border-b border-[#468189]/30 bg-[#031926] shrink-0">
            <div className="flex items-center justify-between">
              <Link href="/" className="flex items-center gap-2.5 group min-w-0">
                <div className="w-8 h-8 rounded-xl bg-[#468189]/30 border border-[#77ACA2]/40 flex items-center justify-center text-[#77ACA2] shadow-xs group-hover:bg-[#468189] group-hover:text-white transition shrink-0">
                  <Brain className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <h2 className="text-sm font-bold text-white tracking-tight leading-tight truncate">
                    Alejandra Bedoya
                  </h2>
                  <p className="text-[10px] text-[#9DBEBB] font-medium truncate">
                    Psicología Terapéutica
                  </p>
                </div>
              </Link>

              {/* Botón de cierre en móvil */}
              <button
                type="button"
                onClick={() => setMenuLateralAbierto(false)}
                className="lg:hidden p-1 rounded-lg text-slate-400 hover:text-white transition cursor-pointer shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Menú de navegación: solo las letras (sin números ni iconos) */}
          <div className="p-3.5 flex-1 overflow-y-auto space-y-1 pb-24">
            <nav className="space-y-0.5">
              {enlacesNavegacion.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  onClick={() => setMenuLateralAbierto(false)}
                  className="block px-3 py-2 rounded-xl text-xs sm:text-[13px] font-medium text-[#FBF8F1]/80 hover:text-white hover:bg-white/10 transition-colors"
                >
                  {item.etiqueta}
                </a>
              ))}
            </nav>
          </div>
        </div>
      </aside>

      {/* Backdrop para cerrar en móvil */}
      {menuLateralAbierto && (
        <div
          onClick={() => setMenuLateralAbierto(false)}
          className="fixed inset-0 bg-[#031926]/60 backdrop-blur-xs z-30 lg:hidden"
        />
      )}

      {/* 2. Header Superior (Con Portal Pacientes a la derecha) */}
      <header className="border-b border-[#9DBEBB]/30 bg-[#FBF8F1]/95 backdrop-blur-md sticky top-0 z-20 lg:pl-56">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          {/* En desktop: Indicador de Consulta disponible. En móvil: Logo de Alejandra */}
          <div className="flex items-center gap-3">
            <div className="hidden lg:flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#77ACA2]/15 border border-[#77ACA2]/30 text-xs font-semibold text-[#031926]">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Citas disponibles · Modalidad Virtual y Presencial</span>
            </div>

            <div className="lg:hidden flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-[#031926] text-white flex items-center justify-center font-bold text-xs shadow-xs">
                <Brain className="w-4 h-4 text-[#77ACA2]" />
              </div>
              <div>
                <h1 className="text-sm font-bold text-[#031926] leading-none">
                  Alejandra Bedoya
                </h1>
                <p className="text-[10px] text-[#468189] font-medium mt-0.5">
                  Psicología Laboral & Terapéutica
                </p>
              </div>
            </div>
          </div>

          {/* A la derecha: Botón Portal Pacientes + Toggle Móvil */}
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-[#031926] hover:bg-[#468189] text-white text-xs sm:text-sm font-semibold shadow-md transition cursor-pointer"
            >
              <CalendarCheck className="w-4 h-4 text-[#77ACA2]" />
              <span>Portal Pacientes</span>
            </Link>

            <button
              type="button"
              onClick={() => setMenuLateralAbierto(!menuLateralAbierto)}
              className="lg:hidden p-2.5 rounded-xl border border-[#9DBEBB]/50 text-[#031926] hover:bg-[#F4E9CD]/30 transition cursor-pointer"
              aria-label="Abrir opciones de navegación"
            >
              {menuLateralAbierto ? <X className="w-5 h-5 text-[#468189]" /> : <Menu className="w-5 h-5 text-[#468189]" />}
            </button>
          </div>
        </div>
      </header>

      {/* 3. Contenedor de Información de la Página (Delimitado respecto a la Barra Lateral Izquierda) */}
      <main className="flex-1 min-w-0 lg:pl-56">
        {/* 2. Hero Section: Editorial, Calma, Impeccable Craft (Cero AI Slop) */}
        <section id="hero" className="relative overflow-hidden py-16 sm:py-24 bg-gradient-to-b from-[#F4E9CD]/30 via-[#FBF8F1] to-[#FBF8F1] border-b border-[#9DBEBB]/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
            {/* Mensaje principal */}
            <div className="lg:col-span-7 space-y-6">
              <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold text-[#031926] tracking-tight leading-[1.14]">
                Encuentra el equilibrio entre tu bienestar emocional y tu vida laboral.
              </h1>

              <p className="text-sm sm:text-base text-[#031926]/80 leading-relaxed max-w-xl">
                Acompañamiento terapéutico personalizado con <strong>Alejandra Bedoya</strong>. Un espacio clínico privado, humano y sin juicios para superar el agotamiento (burnout), regular la ansiedad y construir una vida profesional y personal con serenidad y dirección clara.
              </p>

              {/* Botones de acción primarios */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-2">
                <Link
                  href="/login"
                  className="inline-flex items-center justify-center gap-2.5 px-8 py-4 rounded-2xl bg-[#031926] hover:bg-[#468189] text-white font-bold text-sm shadow-xl shadow-[#031926]/15 transition duration-200 cursor-pointer"
                >
                  <span>Agendar Consulta</span>
                  <ArrowRight className="w-4 h-4 text-[#77ACA2]" />
                </Link>

                <a
                  href="#motivos"
                  className="inline-flex items-center justify-center gap-2 px-6 py-4 rounded-2xl bg-white hover:bg-[#F4E9CD]/40 border border-[#9DBEBB]/50 text-[#031926] font-semibold text-sm transition cursor-pointer"
                >
                  <span>Explorar Áreas de Consulta</span>
                </a>
              </div>

              {/* Indicadores de Confianza y Calidad Clínica */}
              <div className="flex flex-wrap items-center gap-6 pt-4 text-xs text-[#031926]/70 border-t border-[#9DBEBB]/30">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-[#468189]" />
                  <span>Secreto profesional y confidencialidad ética</span>
                </div>
                <div className="flex items-center gap-2">
                  <Video className="w-4 h-4 text-[#468189]" />
                  <span>Modalidad virtual y presencial</span>
                </div>
                {totalResenas > 0 && (
                  <div className="flex items-center gap-1.5">
                    <div className="flex items-center gap-0.5 text-amber-500">
                      {[...Array(Math.round(Number(promedio)))].map((_, i) => (
                        <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                      ))}
                    </div>
                    <span className="font-bold text-[#031926]">
                      {promedio} ({totalResenas} opiniones)
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Imagen Principal: Retrato Limpio Editorial de Alejandra Bedoya */}
            <div className="lg:col-span-5">
              <div className="relative mx-auto max-w-md lg:max-w-none">
                <div className="rounded-3xl overflow-hidden shadow-2xl border border-[#9DBEBB]/40 aspect-[4/5] bg-slate-100 relative">
                  <img
                    src="/alejandra-bedoya.jpg"
                    alt="Alejandra Bedoya - Psicóloga Laboral & Terapéutica"
                    className="w-full h-full object-cover object-top"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#031926]/85 via-transparent to-transparent" />
                  <div className="absolute bottom-6 left-6 right-6 text-white">
                    <span className="inline-block px-3 py-1 rounded-full bg-[#031926]/75 text-[#F4E9CD] text-[10px] font-medium tracking-wide mb-2 border border-[#77ACA2]/30">
                      Consulta Virtual & Presencial
                    </span>
                    <h3 className="text-xl font-bold tracking-tight">Alejandra Bedoya</h3>
                    <p className="text-xs text-[#F4E9CD]">Psicóloga Laboral & Terapéutica</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Áreas de Consulta: Diseño en Cuadrícula Armónica */}
      <section id="motivos" className="py-20 bg-white border-b border-[#9DBEBB]/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mb-14">
            <h2 className="text-2xl sm:text-4xl font-extrabold text-[#031926] tracking-tight">
              Áreas de Acompañamiento
            </h2>
            <p className="text-sm sm:text-base text-[#031926]/70 mt-3 leading-relaxed">
              Enfoques clínicos estructurados para abordar las problemáticas más frecuentes del bienestar ocupacional y personal.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {motivos.map((m) => {
              const Icon = m.icono;
              return (
                <div
                  key={m.id}
                  className="p-7 rounded-3xl bg-[#FBF8F1] border border-[#9DBEBB]/40 shadow-2xs hover:shadow-md transition duration-200 flex flex-col justify-between"
                >
                  <div>
                    <div className="w-11 h-11 rounded-2xl bg-[#031926] text-white flex items-center justify-center mb-5 shadow-xs">
                      <Icon className="w-5 h-5 text-[#77ACA2]" />
                    </div>
                    <h3 className="text-base font-bold text-[#031926] mb-2">
                      {m.titulo}
                    </h3>
                    <p className="text-xs text-[#031926]/75 leading-relaxed">
                      {m.descripcion}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 4. Sección "Sobre Mí" (Perfil Profesional de Alejandra Bedoya) */}
      <section id="sobre-mi" className="py-20 sm:py-28 bg-white border-b border-[#9DBEBB]/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
            {/* Ficha Editorial de Filosofía Clínica */}
            <div className="lg:col-span-5">
              <div className="p-8 sm:p-10 rounded-3xl bg-[#031926] text-white shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-48 h-48 bg-[#468189]/15 rounded-full blur-3xl pointer-events-none" />

                <div className="w-12 h-12 rounded-2xl bg-[#468189]/30 border border-[#77ACA2]/40 flex items-center justify-center text-[#77ACA2] mb-6">
                  <Brain className="w-6 h-6" />
                </div>

                <blockquote className="text-base sm:text-lg font-medium text-[#FBF8F1] leading-relaxed mb-8 italic">
                  "El espacio terapéutico no está diseñado para juzgarte ni para ofrecer recetas mágicas, sino para dotarte de claridad, contención y herramientas reales para recuperar tu serenidad."
                </blockquote>

                <div className="space-y-4 pt-6 border-t border-[#468189]/30 text-xs text-[#9DBEBB]">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-[#F4E9CD]">Enfoque</span>
                    <span>Cognitivo & Ocupacional</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-[#F4E9CD]">Modalidades</span>
                    <span>Virtual & Presencial</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-[#F4E9CD]">Confidencialidad</span>
                    <span>Secreto Ético Deontológico</span>
                  </div>
                </div>

                <div className="mt-8 pt-6 border-t border-[#468189]/30 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#77ACA2]/30 flex items-center justify-center text-white font-bold text-sm">
                    AB
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white leading-none">Alejandra Bedoya</p>
                    <p className="text-[11px] text-[#9DBEBB] mt-1">Psicología Laboral & Terapéutica</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Biografía y Enfoque */}
            <div className="lg:col-span-7 space-y-6">
              <h2 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold text-[#031926] tracking-tight leading-[1.18]">
                Acompañamiento psicológico con rigor y calidez humana
              </h2>

              <p className="text-sm sm:text-base text-[#031926]/80 leading-relaxed">
                Mi vocación nace de comprender que pasamos una gran parte de nuestras vidas trabajando y construyendo metas, muchas veces a costa de nuestra paz mental, nuestras relaciones y nuestro descanso.
              </p>

              <p className="text-sm sm:text-base text-[#031926]/80 leading-relaxed">
                Como <strong>profesional en Psicología Laboral y Terapéutica</strong>, combino metodologías clínicas validadas con herramientas aplicables de gestión del estrés, autoconocimiento y liderazgo personal. Mi propósito es que en cada sesión encuentres un espacio seguro, libre de juicios y con estrategias claras que puedas integrar a tu vida cotidiana.
              </p>

              {/* Pilares */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2">
                <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-[#FBF8F1] border border-[#9DBEBB]/40">
                  <CheckCircle2 className="w-4 h-4 text-[#468189] shrink-0 mt-0.5" />
                  <span className="text-xs font-semibold text-[#031926]">
                    Enfoque Cognitivo & Humanista
                  </span>
                </div>
                <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-[#FBF8F1] border border-[#9DBEBB]/40">
                  <CheckCircle2 className="w-4 h-4 text-[#468189] shrink-0 mt-0.5" />
                  <span className="text-xs font-semibold text-[#031926]">
                    Especialista en Burnout & Estrés
                  </span>
                </div>
                <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-[#FBF8F1] border border-[#9DBEBB]/40">
                  <CheckCircle2 className="w-4 h-4 text-[#468189] shrink-0 mt-0.5" />
                  <span className="text-xs font-semibold text-[#031926]">
                    Acompañamiento 100% Personalizado
                  </span>
                </div>
                <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-[#FBF8F1] border border-[#9DBEBB]/40">
                  <CheckCircle2 className="w-4 h-4 text-[#468189] shrink-0 mt-0.5" />
                  <span className="text-xs font-semibold text-[#031926]">
                    Modalidad Online & Presencial
                  </span>
                </div>
              </div>

              <div className="pt-2">
                <Link
                  href="/login"
                  className="inline-flex items-center gap-2 px-7 py-3.5 rounded-2xl bg-[#031926] hover:bg-[#468189] text-white text-xs sm:text-sm font-semibold shadow-md transition cursor-pointer"
                >
                  <span>Iniciar proceso con Alejandra</span>
                  <ArrowRight className="w-4 h-4 text-[#77ACA2]" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. ¿Cómo es el proceso conmigo? (3 Pasos claros) */}
      <section id="como-trabajo" className="py-20 sm:py-28 bg-[#FBF8F1] border-b border-[#9DBEBB]/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mb-16">
            <h2 className="text-2xl sm:text-4xl font-extrabold text-[#031926] tracking-tight">
              Cómo iniciamos el proceso terapéutico
            </h2>
            <p className="text-sm sm:text-base text-[#031926]/70 mt-3 leading-relaxed">
              Un camino estructurado, transparente y pensado para que te sientas acompañado en cada momento.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-3xl border border-[#9DBEBB]/40 shadow-xs flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-[#031926] text-white flex items-center justify-center mb-6">
                  <CalendarCheck className="w-5 h-5 text-[#77ACA2]" />
                </div>
                <h3 className="text-lg font-bold text-[#031926] mb-2">Reserva y Acceso Seguro</h3>
                <p className="text-xs text-[#031926]/75 leading-relaxed">
                  Crea tu cuenta de paciente con Google o correo en menos de un minuto. Tendrás acceso inmediato a tu agenda, tareas y diario emocional.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-slate-100 text-[11px] font-semibold text-[#468189]">
                Acceso inmediato y seguro
              </div>
            </div>

            <div className="bg-white p-8 rounded-3xl border border-[#9DBEBB]/40 shadow-xs flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-[#031926] text-white flex items-center justify-center mb-6">
                  <Video className="w-5 h-5 text-[#77ACA2]" />
                </div>
                <h3 className="text-lg font-bold text-[#031926] mb-2">Sesión Terapéutica</h3>
                <p className="text-xs text-[#031926]/75 leading-relaxed">
                  Nos conectamos de forma virtual por videollamada privada o presencialmente. Analizamos tus detonantes y estructuramos tu plan de acción.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-slate-100 text-[11px] font-semibold text-[#468189]">
                50 a 60 minutos dedicados a ti
              </div>
            </div>

            <div className="bg-white p-8 rounded-3xl border border-[#9DBEBB]/40 shadow-xs flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-[#031926] text-white flex items-center justify-center mb-6">
                  <Award className="w-5 h-5 text-[#77ACA2]" />
                </div>
                <h3 className="text-lg font-bold text-[#031926] mb-2">Seguimiento y Registro</h3>
                <p className="text-xs text-[#031926]/75 leading-relaxed">
                  Al finalizar la sesión, Alejandra concluye el servicio en el sistema y podrás registrar tu avance y valoración de 1 a 5 estrellas con total transparencia.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-slate-100 text-[11px] font-semibold text-[#468189]">
                Garantía de transparencia
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. Mini-Test Emocional Interactivo */}
      <section id="test" className="py-20 sm:py-28 bg-white border-b border-[#9DBEBB]/30">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <div className="bg-[#FBF8F1] rounded-3xl p-8 sm:p-12 border border-[#9DBEBB]/50 shadow-sm text-center">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#031926]">
              ¿Cómo está tu nivel de bienestar laboral y emocional?
            </h2>
            <p className="text-xs sm:text-sm text-[#031926]/70 mt-2 mb-8 max-w-lg mx-auto">
              Responde estas 3 breves preguntas para recibir una orientación inmediata sobre tu estado actual.
            </p>

            {!testFinalizado ? (
              <div className="text-left space-y-6">
                <div className="flex items-center justify-between text-xs text-[#031926]/50 font-semibold">
                  <span>Pregunta {pasoTest + 1} de {preguntasTest.length}</span>
                  <div className="w-24 bg-white border border-[#9DBEBB]/40 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-[#468189] h-full transition-all duration-300"
                      style={{ width: `${((pasoTest + 1) / preguntasTest.length) * 100}%` }}
                    />
                  </div>
                </div>

                <h3 className="text-base sm:text-lg font-bold text-[#031926] leading-snug">
                  {preguntasTest[pasoTest].pregunta}
                </h3>

                <div className="space-y-2.5">
                  {preguntasTest[pasoTest].opciones.map((op, i) => (
                    <button
                      key={i}
                      onClick={() => responderPregunta(op.puntos)}
                      className="w-full text-left p-4 rounded-2xl bg-white border border-[#9DBEBB]/40 hover:border-[#468189] hover:bg-[#F4E9CD]/30 transition cursor-pointer text-xs sm:text-sm font-medium text-[#031926] flex items-center justify-between group"
                    >
                      <span>{op.texto}</span>
                      <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-[#468189] transition transform group-hover:translate-x-1" />
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-6 py-4">
                <div className="w-16 h-16 bg-[#031926] text-[#77ACA2] rounded-2xl flex items-center justify-center mx-auto">
                  <HeartHandshake className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-[#031926]">
                    Gracias por hacer una pausa y mirarte
                  </h3>
                  <p className="text-xs sm:text-sm text-[#031926]/75 mt-2 max-w-md mx-auto leading-relaxed">
                    Reconocer el cansancio mental o la sobrecarga es el acto más sano. Una sesión de acompañamiento con Alejandra te ayudará a ordenar prioridades y recuperar tu energía.
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                  <Link
                    href="/login"
                    className="w-full sm:w-auto px-7 py-3.5 rounded-2xl bg-[#031926] hover:bg-[#468189] text-white font-semibold text-xs sm:text-sm shadow-md transition"
                  >
                    Agendar Sesión con Alejandra
                  </Link>
                  <button
                    onClick={reiniciarTest}
                    className="w-full sm:w-auto px-5 py-3.5 rounded-2xl bg-white hover:bg-slate-50 border border-[#9DBEBB]/50 text-[#031926] font-semibold text-xs transition cursor-pointer"
                  >
                    Repetir Test
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 7. Reseñas y Calificaciones Verificadas */}
      <section id="opiniones" className="py-20 sm:py-28 bg-[#FBF8F1] border-b border-[#9DBEBB]/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-6 mb-12">
            <div>
              <h2 className="text-2xl sm:text-4xl font-extrabold text-[#031926] tracking-tight">
                La experiencia de consultantes
              </h2>
              <p className="text-xs sm:text-sm text-[#031926]/70 mt-2 max-w-xl">
                Valoraciones reales de personas que han completado su proceso terapéutico con Alejandra.
              </p>
            </div>

            <div className="bg-white p-4 rounded-3xl border border-[#9DBEBB]/50 shadow-xs flex items-center gap-4 shrink-0">
              <div className="text-3xl font-extrabold text-[#031926]">{promedio}</div>
              <div>
                <div className="flex items-center gap-1 text-amber-500">
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
                <p className="text-[11px] text-[#031926]/70 mt-0.5 font-medium">
                  {totalResenas === 0
                    ? "0 calificaciones hasta el momento"
                    : `${totalResenas} calificación(es) verificada(s)`}
                </p>
              </div>
            </div>
          </div>

          {totalResenas === 0 ? (
            <div className="bg-white rounded-3xl p-10 border border-[#9DBEBB]/40 text-center max-w-2xl mx-auto shadow-xs">
              <div className="w-12 h-12 bg-[#F4E9CD] text-[#468189] rounded-2xl flex items-center justify-center mx-auto mb-3">
                <Star className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-[#031926]">
                0 calificaciones registradas hasta el momento
              </h3>
              <p className="text-xs text-[#031926]/70 mt-2 max-w-lg mx-auto leading-relaxed">
                En este espacio solo se publican opiniones 100% reales. Cuando un consultante finalice su sesión con la psicóloga Alejandra Bedoya, su valoración de 1 a 5 estrellas se publicará aquí de forma transparente.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {resenas.map((resena) => (
                <div
                  key={resena.id}
                  className="bg-white p-7 rounded-3xl border border-[#9DBEBB]/40 shadow-xs hover:shadow-md transition flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center gap-1 text-amber-400 mb-3">
                      {[...Array(resena.estrellas)].map((_, i) => (
                        <Star key={i} className="w-4 h-4 fill-amber-400" />
                      ))}
                    </div>
                    <p className="text-xs sm:text-sm text-[#031926]/85 leading-relaxed italic mb-6">
                      "{resena.comentario}"
                    </p>
                  </div>

                  <div className="pt-4 border-t border-[#9DBEBB]/30 flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-[#031926]">{resena.nombre_mostrar}</h4>
                      <p className="text-[11px] text-[#031926]/50 mt-0.5">{resena.servicio}</p>
                    </div>
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#77ACA2]/20 text-[10px] font-semibold text-[#031926] border border-[#77ACA2]/30">
                      <CheckCircle2 className="w-3 h-3 text-[#468189]" />
                      Sesión Finalizada
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="mt-8 bg-white border border-[#9DBEBB]/40 rounded-2xl p-4 flex items-center gap-3 text-xs text-[#031926]">
            <ShieldCheck className="w-5 h-5 text-[#468189] shrink-0" />
            <span>
              <strong>Garantía de Autenticidad:</strong> Cada calificación es ingresada por el consultante desde su portal únicamente después de que Alejandra finaliza la sesión terapéutica (máximo 1 reseña por servicio).
            </span>
          </div>
        </div>
      </section>

      {/* 8. Preguntas Frecuentes */}
      <section id="faqs" className="py-20 sm:py-28 bg-white border-b border-[#9DBEBB]/30">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="max-w-2xl mb-14">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#031926]">
              Preguntas Frecuentes
            </h2>
            <p className="text-xs sm:text-sm text-[#031926]/70 mt-2">
              Todo lo que necesitas saber antes de iniciar tus consultas con Alejandra.
            </p>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, index) => (
              <div
                key={index}
                className="bg-[#FBF8F1] rounded-2xl border border-[#9DBEBB]/40 overflow-hidden shadow-xs"
              >
                <button
                  onClick={() => setFaqAbierta(faqAbierta === index ? null : index)}
                  className="w-full text-left p-5 flex items-center justify-between text-xs sm:text-sm font-bold text-[#031926] hover:text-[#468189] transition cursor-pointer"
                >
                  <span>{faq.pregunta}</span>
                  <ChevronDown
                    className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${
                      faqAbierta === index ? "rotate-180 text-[#468189]" : ""
                    }`}
                  />
                </button>
                {faqAbierta === index && (
                  <div className="px-5 pb-5 pt-1 text-xs text-[#031926]/75 leading-relaxed border-t border-[#9DBEBB]/20">
                    {faq.respuesta}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 9. CTA Final */}
      <section className="py-20 sm:py-28 bg-[#031926] text-white">
        <div className="max-w-4xl mx-auto px-4 text-center space-y-6">
          <h2 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight">
            Prioriza tu bienestar emocional y laboral
          </h2>
          <p className="text-[#9DBEBB] text-xs sm:text-sm max-w-xl mx-auto leading-relaxed">
            Ingresa a tu portal confidencial, reserva tu espacio con Alejandra y comienza a dar pasos firmes hacia la tranquilidad que mereces.
          </p>
          <div className="pt-2">
            <Link
              href="/login"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-[#F4E9CD] text-[#031926] font-bold text-sm shadow-xl hover:bg-white transition cursor-pointer"
            >
              <CalendarCheck className="w-5 h-5 text-[#468189]" />
              <span>Agendar cita con Alejandra</span>
            </Link>
          </div>
        </div>
      </section>

      {/* 9. Footer Profesional en #031926 */}
      <footer className="bg-[#031926] text-[#9DBEBB] py-12 text-xs border-t border-[#468189]/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-[#468189] flex items-center justify-center text-white">
              <Brain className="w-4 h-4" />
            </div>
            <div>
              <p className="font-bold text-white text-sm">Alejandra Bedoya</p>
              <p className="text-[10px] text-[#9DBEBB]/80">Psicóloga Profesional en Psicología Laboral y Terapéutica</p>
            </div>
          </div>

          <p className="text-[#9DBEBB]/70 text-center sm:text-right">
            © 2026 Alejandra Bedoya. Todos los derechos reservados.
            <br />
            Atención psicológica amparada bajo el secreto profesional y código ético de salud.
          </p>
        </div>
      </footer>
      </main>

      {/* Botón Flotante de WhatsApp - Solo en la parte inferior izquierda en bolita con el logo */}
      <a
        href="https://wa.me/573209622624?text=Hola%20Alejandra%2C%20quisiera%20agendar%20una%20consulta%20psicol%C3%B3gica"
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 left-6 z-50 w-14 h-14 rounded-full bg-[#25D366] hover:bg-[#20ba5a] text-white flex items-center justify-center shadow-2xl hover:scale-110 active:scale-95 transition-all duration-200 border-2 border-white cursor-pointer group"
        title="Escribir por WhatsApp a Alejandra Bedoya (3209622624)"
        aria-label="Contactar por WhatsApp al 3209622624"
      >
        <WhatsAppIcon className="w-7 h-7 fill-white shrink-0 group-hover:rotate-12 transition-transform duration-300" />
      </a>
    </div>
  );
}
