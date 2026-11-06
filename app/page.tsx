import {
  Brain,
  Calendar,
  Users,
  FileText,
  HeartHandshake,
  Activity,
  ShieldCheck,
  Clock,
  Plus,
  Sparkles,
  ClipboardList
} from "lucide-react";

export default function Home() {
  const isSupabaseConfigured = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      {/* Header */}
      <header className="border-b border-slate-200/80 bg-white sticky top-0 z-30 shadow-sm shadow-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center text-white shadow-md shadow-indigo-100">
              <Brain className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-900 leading-tight">
                Centro de Psicología
              </h1>
              <p className="text-xs text-slate-500 font-medium">Gestión Terapéutica & Consultorio</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                isSupabaseConfigured
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                  : "bg-amber-50 text-amber-700 border-amber-200"
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  isSupabaseConfigured ? "bg-emerald-500" : "bg-amber-500 animate-pulse"
                }`}
              />
              {isSupabaseConfigured ? "Base de Datos Conectada" : "Supabase Pendiente"}
            </span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Banner */}
        <div className="relative overflow-hidden bg-gradient-to-r from-indigo-900 via-indigo-800 to-violet-900 rounded-3xl p-8 sm:p-10 text-white shadow-xl mb-8">
          <div className="relative z-10 max-w-2xl">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/15 backdrop-blur-md rounded-full text-xs font-semibold tracking-wider uppercase mb-4 text-indigo-100 border border-white/10">
              <Sparkles className="w-3.5 h-3.5" />
              Entorno Clínico & Terapéutico
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-3">
              Bienestar Emocional & Salud Mental
            </h2>
            <p className="text-indigo-200 text-sm sm:text-base leading-relaxed mb-6">
              Plataforma para el registro confidencial de historias clínicas, programación de
              sesiones presenciales y virtuales, notas de evolución y seguimiento del progreso de tus consultantes.
            </p>
            <div className="flex flex-wrap gap-3">
              <button className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white text-indigo-950 font-semibold text-sm shadow hover:bg-indigo-50 transition cursor-pointer">
                <Plus className="w-4 h-4" />
                Registrar Paciente
              </button>
              <button className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-700/60 hover:bg-indigo-700 text-white font-medium text-sm border border-indigo-500/40 transition cursor-pointer">
                <Calendar className="w-4 h-4" />
                Agendar Sesión
              </button>
            </div>
          </div>

          {/* Decorative Background Elements */}
          <div className="absolute -right-12 -bottom-12 w-80 h-80 rounded-full bg-violet-600/20 blur-3xl pointer-events-none" />
          <div className="absolute right-32 top-0 w-60 h-60 rounded-full bg-indigo-500/20 blur-2xl pointer-events-none" />
        </div>

        {/* Quick Metrics Bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-slate-500 uppercase">Consultantes</span>
              <Users className="w-4 h-4 text-indigo-600" />
            </div>
            <p className="text-2xl font-bold text-slate-900">0</p>
            <span className="text-xs text-slate-400">Pacientes activos</span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-slate-500 uppercase">Sesiones Hoy</span>
              <Calendar className="w-4 h-4 text-violet-600" />
            </div>
            <p className="text-2xl font-bold text-slate-900">0</p>
            <span className="text-xs text-slate-400">Consultas programadas</span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-slate-500 uppercase">Notas Clínicas</span>
              <FileText className="w-4 h-4 text-rose-600" />
            </div>
            <p className="text-2xl font-bold text-slate-900">0</p>
            <span className="text-xs text-slate-400">Evoluciones registradas</span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-slate-500 uppercase">Seguimientos</span>
              <Activity className="w-4 h-4 text-emerald-600" />
            </div>
            <p className="text-2xl font-bold text-slate-900">100%</p>
            <span className="text-xs text-emerald-600 font-medium">Confidencialidad activa</span>
          </div>
        </div>

        {/* Core Modules Grid */}
        <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
          <span>Módulos de Atención Psicológica</span>
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Module 1: Consultantes */}
          <div className="group bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md hover:border-indigo-200 transition">
            <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
              <Users className="w-6 h-6" />
            </div>
            <h4 className="text-lg font-bold text-slate-900 mb-2">Pacientes & Consultantes</h4>
            <p className="text-sm text-slate-500 mb-4 leading-relaxed">
              Ficha integral con datos sociodemográficos, motivo de consulta, contacto de emergencia y consentimientos informados.
            </p>
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 group-hover:underline">
              Ver historias clínicas →
            </span>
          </div>

          {/* Module 2: Agenda y Sesiones */}
          <div className="group bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md hover:border-violet-200 transition">
            <div className="w-12 h-12 bg-violet-50 text-violet-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
              <Calendar className="w-6 h-6" />
            </div>
            <h4 className="text-lg font-bold text-slate-900 mb-2">Agenda Terapéutica</h4>
            <p className="text-sm text-slate-500 mb-4 leading-relaxed">
              Organización de citas presenciales o virtuales, control de asistencia, cancelaciones y recordatorios por sesión.
            </p>
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-violet-600 group-hover:underline">
              Abrir calendario →
            </span>
          </div>

          {/* Module 3: Notas de Evolución */}
          <div className="group bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md hover:border-rose-200 transition">
            <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
              <ClipboardList className="w-6 h-6" />
            </div>
            <h4 className="text-lg font-bold text-slate-900 mb-2">Notas de Sesión & Evolución</h4>
            <p className="text-sm text-slate-500 mb-4 leading-relaxed">
              Registro clínico estructurado (formato SOAP, objetivos terapéuticos, tareas inter-sesión e hipótesis diagnósticas).
            </p>
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-rose-600 group-hover:underline">
              Redactar evolución →
            </span>
          </div>
        </div>

        {/* Security & Confidentiality Notice */}
        <div className="bg-slate-100/70 border border-slate-200/80 rounded-2xl p-5 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-600 shrink-0 shadow-sm">
            <ShieldCheck className="w-5 h-5 text-indigo-600" />
          </div>
          <div>
            <h5 className="text-sm font-semibold text-slate-800">Privacidad y Secreto Profesional</h5>
            <p className="text-xs text-slate-500">
              Todos los datos sensibles e historias clínicas se resguardan de forma segura en tu base de datos Supabase con cifrado y control de accesos.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
