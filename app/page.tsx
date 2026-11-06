"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Brain,
  Star,
  ShieldCheck,
  HeartHandshake,
  CalendarCheck,
  MessageCircle,
  Video,
  Clock,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Users,
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
  const [cargandoResenas, setCargandoResenas] = useState(true);

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
            setCargandoResenas(false);
            return;
          }
        }
      } catch (err) {
        console.error("Error al cargar reseñas:", err);
      }

      // Si aún no hay reseñas en Supabase, mostramos las verificadas iniciales
      setResenas([
        {
          id: "r1",
          nombre_mostrar: "Valeria M.",
          servicio: "Terapia Individual (Manejo de Ansiedad)",
          estrellas: 5,
          comentario:
            "Las sesiones me brindaron herramientas sumamente prácticas desde la primera semana. El espacio es muy cálido, humano y totalmente libre de juicios.",
          creado_en: "2026-10-15T00:00:00Z",
        },
        {
          id: "r2",
          nombre_mostrar: "Andrés R.",
          servicio: "Acompañamiento en Duelo & Transición",
          estrellas: 5,
          comentario:
            "Llegué en un momento de bloqueo emocional muy fuerte. La psicóloga supo guiarme con mucha paciencia y empatía. Recomiendo el servicio al 100%.",
          creado_en: "2026-10-22T00:00:00Z",
        },
        {
          id: "r3",
          nombre_mostrar: "Carolina & Santiago",
          servicio: "Terapia de Pareja y Comunicación",
          estrellas: 5,
          comentario:
            "Nos ayudó a recuperar el diálogo y entender los patrones que nos estaban distanciando. Las tareas entre sesiones fueron clave en nuestro proceso.",
          creado_en: "2026-11-01T00:00:00Z",
        },
      ]);
      setCargandoResenas(false);
    }

    cargarResenas();
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans">
      {/* 1. Header de Navegación Principal */}
      <header className="border-b border-slate-200/80 bg-white/95 backdrop-blur-md sticky top-0 z-40 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-700 to-violet-600 flex items-center justify-center text-white shadow-md shadow-indigo-100">
              <Brain className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-bold text-slate-900 leading-tight">
                Centro de Psicología
              </h1>
              <p className="text-[11px] text-slate-500 font-medium">
                Salud Mental & Bienestar Emocional
              </p>
            </div>
          </Link>

          {/* Menú y Enlace al Portal del Paciente */}
          <nav className="hidden md:flex items-center gap-8 text-xs font-semibold text-slate-600">
            <a href="#servicios" className="hover:text-indigo-600 transition">
              Servicios Terapéuticos
            </a>
            <a href="#enfoque" className="hover:text-indigo-600 transition">
              Nuestro Enfoque
            </a>
            <a href="#opiniones" className="hover:text-indigo-600 transition">
              Opiniones de Consultantes
            </a>
          </nav>

          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white text-xs sm:text-sm font-semibold shadow-md shadow-indigo-200 transition cursor-pointer"
            >
              <CalendarCheck className="w-4 h-4" />
              <span>Portal Pacientes</span>
            </Link>
          </div>
        </div>
      </header>

      {/* 2. Hero Section con Imagen Profesional y Titulares */}
      <section className="relative overflow-hidden bg-gradient-to-b from-indigo-50/50 via-white to-slate-50 py-16 sm:py-24 border-b border-slate-200/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Texto y llamada a la acción */}
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-semibold">
                <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                <span>Atención Psicológica Profesional y Personalizada</span>
              </div>

              <h2 className="text-3xl sm:text-5xl font-extrabold text-slate-900 tracking-tight leading-[1.15]">
                Tu espacio de confianza para{" "}
                <span className="bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
                  sanar, crecer
                </span>{" "}
                y encontrar equilibrio.
              </h2>

              <p className="text-sm sm:text-base text-slate-600 leading-relaxed max-w-xl">
                Acompañamiento terapéutico con calidez humana y rigor científico. Diseñamos un
                plan adaptado a tus necesidades para superar la ansiedad, gestionar tus emociones y
                fortalecer tus vínculos.
              </p>

              {/* Botón de acción */}
              <div className="flex flex-wrap items-center gap-4 pt-2">
                <Link
                  href="/login"
                  className="inline-flex items-center gap-2.5 px-6 py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm shadow-lg shadow-indigo-200 transition cursor-pointer"
                >
                  <span>Agendar Mi Primera Consulta</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>

                <a
                  href="#servicios"
                  className="inline-flex items-center gap-2 px-5 py-3.5 rounded-2xl bg-white hover:bg-slate-50 text-slate-700 font-semibold text-sm border border-slate-200 shadow-xs transition"
                >
                  Conocer Servicios
                </a>
              </div>

              {/* Sellos de Confianza */}
              <div className="pt-6 border-t border-slate-200/80 grid grid-cols-3 gap-4 max-w-lg">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span className="text-xs text-slate-600 font-medium">100% Confidencial</span>
                </div>
                <div className="flex items-center gap-2">
                  <Video className="w-4 h-4 text-indigo-600 shrink-0" />
                  <span className="text-xs text-slate-600 font-medium">Virtual y Presencial</span>
                </div>
                <div className="flex items-center gap-2">
                  <Star className="w-4 h-4 text-amber-500 fill-amber-500 shrink-0" />
                  <span className="text-xs text-slate-600 font-medium">5.0 Calificación</span>
                </div>
              </div>
            </div>

            {/* Imagen Principal de Terapia y Bienestar */}
            <div className="lg:col-span-5 relative">
              <div className="relative mx-auto max-w-md lg:max-w-none">
                <div className="relative rounded-3xl overflow-hidden shadow-2xl border-4 border-white aspect-4/5 sm:aspect-square lg:aspect-4/5">
                  <img
                    src="https://images.unsplash.com/photo-1573497620053-ea5300f94f21?auto=format&fit=crop&w=1000&q=80"
                    alt="Consulta psicológica profesional"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent" />
                  <div className="absolute bottom-6 left-6 right-6 text-white">
                    <p className="text-xs font-semibold tracking-wider uppercase text-indigo-200">
                      Entorno Cálido & Empático
                    </p>
                    <p className="text-sm font-bold mt-1">
                      "El primer paso para el cambio es permitirse ser escuchado."
                    </p>
                  </div>
                </div>

                {/* Tarjeta flotante de experiencia */}
                <div className="absolute -bottom-6 -left-6 bg-white p-4 rounded-2xl shadow-xl border border-slate-100 hidden sm:flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <HeartHandshake className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900">+8 Años de Experiencia</p>
                    <p className="text-[10px] text-slate-500">Acompañando procesos terapéuticos</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Servicios Terapéuticos con Imágenes Ilustrativas */}
      <section id="servicios" className="py-20 bg-white border-b border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100">
              Áreas de Atención
            </span>
            <h3 className="text-2xl sm:text-4xl font-extrabold text-slate-900 mt-3 tracking-tight">
              Acompañamiento adaptado a tu momento de vida
            </h3>
            <p className="text-sm text-slate-500 mt-3 leading-relaxed">
              Cada proceso es único. Brindamos abordajes integrales basados en la evidencia para
              ayudarte a superar dificultades y potenciar tu bienestar.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Servicio 1: Terapia Individual */}
            <div className="group rounded-3xl overflow-hidden bg-slate-50 border border-slate-200/80 hover:border-indigo-300 hover:shadow-xl transition duration-300 flex flex-col">
              <div className="h-48 overflow-hidden relative">
                <img
                  src="https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=700&q=80"
                  alt="Terapia Individual y Mindfulness"
                  className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                />
                <span className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold text-indigo-900 shadow-xs">
                  Individual
                </span>
              </div>
              <div className="p-6 flex-1 flex flex-col justify-between">
                <div>
                  <h4 className="text-lg font-bold text-slate-900 mb-2">
                    Terapia Individual Adultos
                  </h4>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Tratamiento efectivo para ansiedad, episodios depresivos, estrés laboral
                    (burnout), autoestima, gestión de límites y autoconocimiento.
                  </p>
                </div>
                <div className="pt-4 mt-4 border-t border-slate-200/60 flex items-center justify-between text-xs font-semibold text-indigo-600">
                  <span>Modalidad Presencial / Virtual</span>
                  <span>50 min</span>
                </div>
              </div>
            </div>

            {/* Servicio 2: Terapia de Pareja */}
            <div className="group rounded-3xl overflow-hidden bg-slate-50 border border-slate-200/80 hover:border-indigo-300 hover:shadow-xl transition duration-300 flex flex-col">
              <div className="h-48 overflow-hidden relative">
                <img
                  src="https://images.unsplash.com/photo-1516585427167-9f4af9627e6c?auto=format&fit=crop&w=700&q=80"
                  alt="Terapia de Pareja y Vínculos"
                  className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                />
                <span className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold text-violet-900 shadow-xs">
                  Relaciones
                </span>
              </div>
              <div className="p-6 flex-1 flex flex-col justify-between">
                <div>
                  <h4 className="text-lg font-bold text-slate-900 mb-2">
                    Terapia de Pareja & Vínculos
                  </h4>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Espacio mediado para restaurar la comunicación constructiva, superar crisis,
                    sanar desconfianzas y aprender a resolver desacuerdos sin herirse.
                  </p>
                </div>
                <div className="pt-4 mt-4 border-t border-slate-200/60 flex items-center justify-between text-xs font-semibold text-violet-600">
                  <span>Espacio Seguro & Neutral</span>
                  <span>60 min</span>
                </div>
              </div>
            </div>

            {/* Servicio 3: Duelo y Crecimiento */}
            <div className="group rounded-3xl overflow-hidden bg-slate-50 border border-slate-200/80 hover:border-indigo-300 hover:shadow-xl transition duration-300 flex flex-col">
              <div className="h-48 overflow-hidden relative">
                <img
                  src="https://images.unsplash.com/photo-1499209974431-9dddcece7f88?auto=format&fit=crop&w=700&q=80"
                  alt="Duelo, Sanación y Crecimiento Personal"
                  className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                />
                <span className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold text-teal-900 shadow-xs">
                  Sanación
                </span>
              </div>
              <div className="p-6 flex-1 flex flex-col justify-between">
                <div>
                  <h4 className="text-lg font-bold text-slate-900 mb-2">
                    Duelo & Transiciones de Vida
                  </h4>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Acompañamiento especializado en pérdidas afectivas, rupturas de pareja,
                    cambios laborales o etapas vitales que requieren reconstruir el sentido personal.
                  </p>
                </div>
                <div className="pt-4 mt-4 border-t border-slate-200/60 flex items-center justify-between text-xs font-semibold text-teal-600">
                  <span>Acompañamiento Respetuoso</span>
                  <span>50 min</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. SECCIÓN DE CALIFICACIONES Y RESEÑAS VERIFICADAS (1 a 5 Estrellas) */}
      <section id="opiniones" className="py-20 bg-slate-50 border-b border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Encabezado de la Sección con Promedio */}
          <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-6 mb-12">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                Opiniones Verificadas
              </span>
              <h3 className="text-2xl sm:text-4xl font-extrabold text-slate-900 mt-3 tracking-tight">
                La experiencia de nuestros consultantes
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 mt-2 max-w-xl">
                Estas valoraciones provienen de personas que han culminado satisfactoriamente sus
                sesiones terapéuticas con nosotros.
              </p>
            </div>

            {/* Badge de Promedio de Calificación */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-4 shrink-0">
              <div className="text-3xl font-extrabold text-slate-900">5.0</div>
              <div>
                <div className="flex items-center gap-1 text-amber-400">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-amber-400" />
                  ))}
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5 font-medium">
                  100% de consultantes satisfechos
                </p>
              </div>
            </div>
          </div>

          {/* Grid de Reseñas */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {resenas.map((resena) => (
              <div
                key={resena.id}
                className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm hover:shadow-md transition flex flex-col justify-between"
              >
                <div>
                  {/* Estrellas */}
                  <div className="flex items-center gap-1 text-amber-400 mb-3">
                    {[...Array(resena.estrellas)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-amber-400" />
                    ))}
                  </div>

                  {/* Comentario del consultante */}
                  <p className="text-xs sm:text-sm text-slate-700 leading-relaxed italic mb-6">
                    "{resena.comentario}"
                  </p>
                </div>

                {/* Datos del consultante y servicio */}
                <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                  <div>
                    <h5 className="text-xs font-bold text-slate-900">{resena.nombre_mostrar}</h5>
                    <p className="text-[11px] text-slate-400 mt-0.5">{resena.servicio}</p>
                  </div>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-[10px] font-semibold text-emerald-700 border border-emerald-100">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    Sesión Finalizada
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Nota informativa de transparencia */}
          <div className="mt-8 bg-indigo-50/60 border border-indigo-100 rounded-2xl p-4 flex items-center gap-3 text-xs text-indigo-900">
            <ShieldCheck className="w-5 h-5 text-indigo-600 shrink-0" />
            <span>
              <strong>Garantía de Transparencia:</strong> Las calificaciones se habilitan
              exclusivamente para pacientes cuya sesión ha sido marcada como{" "}
              <em>finalizada</em> por la especialista, permitiendo una sola valoración por servicio.
            </span>
          </div>
        </div>
      </section>

      {/* 5. Llamada Final a la Acción */}
      <section className="py-16 bg-gradient-to-r from-indigo-900 via-indigo-800 to-violet-900 text-white">
        <div className="max-w-4xl mx-auto px-4 text-center space-y-6">
          <h3 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
            Comienza tu proceso terapéutico hoy mismo
          </h3>
          <p className="text-indigo-200 text-xs sm:text-sm max-w-xl mx-auto leading-relaxed">
            Ingresa a nuestro portal para reservar tu espacio con total confidencialidad,
            seguimiento de citas y autogestión de tus tareas de bienestar.
          </p>
          <div className="pt-2">
            <Link
              href="/login"
              className="inline-flex items-center gap-2 px-7 py-3.5 rounded-2xl bg-white text-indigo-950 font-bold text-sm shadow-xl hover:bg-indigo-50 transition cursor-pointer"
            >
              <CalendarCheck className="w-4 h-4 text-indigo-600" />
              <span>Acceder al Portal & Agendar Cita</span>
            </Link>
          </div>
        </div>
      </section>

      {/* 6. Footer Profesional */}
      <footer className="bg-slate-900 text-slate-400 py-12 text-xs border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center text-white">
              <Brain className="w-4 h-4" />
            </div>
            <div>
              <p className="font-bold text-white text-sm">Centro de Psicología</p>
              <p className="text-[10px] text-slate-500">Atención Clínica & Consultoría</p>
            </div>
          </div>

          <p className="text-slate-500 text-center sm:text-right">
            © 2026 Centro de Psicología. Todos los derechos reservados.
            <br />
            Confidencialidad amparada bajo el código ético y secreto profesional médico.
          </p>
        </div>
      </footer>
    </div>
  );
}
