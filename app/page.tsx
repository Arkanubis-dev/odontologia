import { Activity, Calendar, Users, Stethoscope, ShieldCheck } from "lucide-react";

export default function Home() {
  const isSupabaseConfigured = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-600 flex items-center justify-center text-white shadow-sm shadow-teal-200">
              <Stethoscope className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-900 leading-tight">Clínica Odontológica</h1>
              <p className="text-xs text-slate-500">Sistema de Gestión & Pacientes</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${
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
              {isSupabaseConfigured ? "Supabase Conectado" : "Supabase Pendiente"}
            </span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Welcome Banner */}
        <div className="bg-gradient-to-r from-teal-700 to-cyan-700 rounded-2xl p-8 text-white shadow-lg mb-10">
          <div className="max-w-2xl">
            <span className="inline-block px-3 py-1 bg-white/20 backdrop-blur-sm rounded-md text-xs font-semibold tracking-wider uppercase mb-3">
              Nuevo Proyecto Iniciado
            </span>
            <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl mb-3">
              Bienvenido al Sistema Odontológico
            </h2>
            <p className="text-teal-100 text-sm sm:text-base leading-relaxed">
              Tu proyecto ya está inicializado con la misma estructura moderna de Alyshop:
              Next.js 16, TypeScript, Tailwind CSS y Supabase.
            </p>
          </div>
        </div>

        {/* Supabase Status Card */}
        {!isSupabaseConfigured && (
          <div className="mb-10 bg-amber-50 border border-amber-200 rounded-xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <ShieldCheck className="w-6 h-6 text-amber-600 mt-0.5 shrink-0" />
              <div>
                <h3 className="text-sm font-semibold text-amber-900">
                  Paso siguiente: Conectar las claves de Supabase
                </h3>
                <p className="text-xs text-amber-700 mt-1">
                  Agrega tu <code>NEXT_PUBLIC_SUPABASE_URL</code> y <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code> en el archivo <code>.env.local</code>.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Modules Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition">
            <div className="w-12 h-12 bg-teal-50 text-teal-600 rounded-lg flex items-center justify-center mb-4">
              <Users className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-1">Pacientes</h3>
            <p className="text-sm text-slate-500">
              Historias clínicas, datos de contacto y antecedentes odontológicos.
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition">
            <div className="w-12 h-12 bg-cyan-50 text-cyan-600 rounded-lg flex items-center justify-center mb-4">
              <Calendar className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-1">Citas y Agenda</h3>
            <p className="text-sm text-slate-500">
              Programación de consultas, estados de cita y recordatorios.
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition">
            <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-lg flex items-center justify-center mb-4">
              <Activity className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-1">Tratamientos</h3>
            <p className="text-sm text-slate-500">
              Odontograma, procedimientos, cotizaciones y pagos.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
