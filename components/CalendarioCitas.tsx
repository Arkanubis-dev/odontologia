"use client";

import { useState, useMemo } from "react";
import { ChevronLeft, ChevronRight, Clock, Video, MapPin, CheckCircle2 } from "lucide-react";

export interface PsicologoInfo {
  id: string;
  nombre_completo: string;
  email: string;
  avatar_url?: string;
  especialidad?: string;
}

interface CalendarioCitasProps {
  psicologos?: PsicologoInfo[];
  psicologoSeleccionadoId?: string;
  onCambiarPsicologo?: (id: string) => void;
  citasExistentes?: Array<{ fecha_hora: string; estado?: string; psicologo_id?: string }>;
  onSeleccionarFechaHora: (fechaHoraISO: string) => void;
  fechaHoraSeleccionada?: string;
  duracionMinutos?: number;
}

const MESES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
];

const DIAS_SEMANA = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

export default function CalendarioCitas({
  psicologos = [],
  psicologoSeleccionadoId,
  onCambiarPsicologo,
  citasExistentes = [],
  onSeleccionarFechaHora,
  fechaHoraSeleccionada,
  duracionMinutos = 50,
}: CalendarioCitasProps) {
  const hoy = useMemo(() => new Date(), []);
  
  // Mes y año actual del calendario
  const [mesActual, setMesActual] = useState(hoy.getMonth());
  const [anoActual, setAnoActual] = useState(hoy.getFullYear());
  
  // Día seleccionado en el mes (Date object o null)
  const [diaSeleccionado, setDiaSeleccionado] = useState<Date | null>(() => {
    if (fechaHoraSeleccionada) {
      return new Date(fechaHoraSeleccionada);
    }
    // Por defecto hoy o mañana
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  });

  const [horaSeleccionada, setHoraSeleccionada] = useState<string>(() => {
    if (fechaHoraSeleccionada) {
      const d = new Date(fechaHoraSeleccionada);
      const h = String(d.getHours()).padStart(2, "0");
      const m = String(d.getMinutes()).padStart(2, "0");
      return `${h}:${m}`;
    }
    return "";
  });

  // Navegar meses
  const handleMesAnterior = () => {
    if (mesActual === 0) {
      setMesActual(11);
      setAnoActual((a) => a - 1);
    } else {
      setMesActual((m) => m - 1);
    }
  };

  const handleMesSiguiente = () => {
    if (mesActual === 11) {
      setMesActual(0);
      setAnoActual((a) => a + 1);
    } else {
      setMesActual((m) => m + 1);
    }
  };

  // Calcular días del mes
  const diasMes = useMemo(() => {
    const primerDiaMes = new Date(anoActual, mesActual, 1);
    const ultimoDiaMes = new Date(anoActual, mesActual + 1, 0);

    // Día de la semana en que inicia (0=Domingo, normalizar a Lun=0 ... Dom=6)
    let diaInicioSemana = primerDiaMes.getDay() - 1;
    if (diaInicioSemana === -1) diaInicioSemana = 6;

    const totalDias = ultimoDiaMes.getDate();
    const celdas = [];

    // Rellenar días del mes anterior vacíos
    for (let i = 0; i < diaInicioSemana; i++) {
      celdas.push(null);
    }

    // Días del mes
    for (let d = 1; d <= totalDias; d++) {
      const fecha = new Date(anoActual, mesActual, d);
      celdas.push(fecha);
    }

    return celdas;
  }, [anoActual, mesActual]);

  // Horarios de atención disponibles (8am a 6pm con pausa)
  const horariosPosibles = [
    "08:00", "09:00", "10:00", "11:00",
    "13:00", "14:00", "15:00", "16:00", "17:00", "18:00"
  ];

  // Comprobar si una hora está ocupada para la fecha y psicólogo
  const esHoraOcupada = (fecha: Date, hora: string) => {
    const [h, m] = hora.split(":").map(Number);
    const fechaHoraSlot = new Date(fecha);
    fechaHoraSlot.setHours(h, m, 0, 0);

    return citasExistentes.some((c) => {
      if (c.estado === "cancelada") return false;
      if (psicologoSeleccionadoId && c.psicologo_id && c.psicologo_id !== psicologoSeleccionadoId) {
        return false;
      }
      const fechaCita = new Date(c.fecha_hora);
      return Math.abs(fechaCita.getTime() - fechaHoraSlot.getTime()) < 45 * 60 * 1000;
    });
  };

  // Manejar selección de horario
  const handleSeleccionarSlot = (hora: string) => {
    if (!diaSeleccionado) return;
    setHoraSeleccionada(hora);
    const [h, m] = hora.split(":").map(Number);
    const fechaFinal = new Date(diaSeleccionado);
    fechaFinal.setHours(h, m, 0, 0);
    onSeleccionarFechaHora(fechaFinal.toISOString());
  };

  return (
    <div className="space-y-6">
      {/* 1. Selector de Psicóloga / Especialista si hay más de 1 */}
      {psicologos.length > 1 && onCambiarPsicologo && (
        <div className="space-y-2">
          <label className="block text-xs font-bold text-[#031926] uppercase tracking-wider">
            1. Selecciona a tu Profesional
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {psicologos.map((psi) => {
              const seleccionado = psi.id === psicologoSeleccionadoId;
              return (
                <button
                  key={psi.id}
                  type="button"
                  onClick={() => onCambiarPsicologo(psi.id)}
                  className={`p-3 rounded-2xl border text-left flex items-center justify-between transition cursor-pointer ${
                    seleccionado
                      ? "bg-[#031926] text-white border-[#031926] shadow-sm"
                      : "bg-white text-[#031926] border-[#9DBEBB]/50 hover:bg-[#FBF8F1]"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                        seleccionado ? "bg-[#468189] text-white" : "bg-[#FBF8F1] text-[#031926]"
                      }`}
                    >
                      {psi.nombre_completo?.charAt(0).toUpperCase() || "P"}
                    </div>
                    <div>
                      <h4 className="text-xs font-bold leading-tight">{psi.nombre_completo}</h4>
                      <p className={`text-[10px] ${seleccionado ? "text-[#9DBEBB]" : "text-gray-500"}`}>
                        Psicología Clínica
                      </p>
                    </div>
                  </div>
                  {seleccionado && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 2. Grid de Calendario Interactivo */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-5 bg-white p-5 rounded-3xl border border-[#9DBEBB]/40 shadow-xs">
        {/* Columna Izquierda: Calendario de Mes */}
        <div className="md:col-span-7 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-[#9DBEBB]/30">
            <h4 className="text-sm font-extrabold text-[#031926] capitalize">
              {MESES[mesActual]} {anoActual}
            </h4>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handleMesAnterior}
                className="p-1.5 rounded-lg border border-[#9DBEBB]/40 hover:bg-[#9DBEBB]/20 text-[#031926] transition cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleMesSiguiente}
                className="p-1.5 rounded-lg border border-[#9DBEBB]/40 hover:bg-[#9DBEBB]/20 text-[#031926] transition cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Días de la semana */}
          <div className="grid grid-cols-7 gap-1 text-center">
            {DIAS_SEMANA.map((dia) => (
              <span key={dia} className="text-[10px] font-bold text-gray-400 uppercase py-1">
                {dia}
              </span>
            ))}
          </div>

          {/* Celdas de Días */}
          <div className="grid grid-cols-7 gap-1.5">
            {diasMes.map((fecha, idx) => {
              if (!fecha) {
                return <div key={`empty-${idx}`} className="h-8 sm:h-9" />;
              }

              const inicioHoy = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
              const esPasado = fecha < inicioHoy;
              const esDomingo = fecha.getDay() === 0;
              const deshabilitado = esPasado || esDomingo;

              const esSeleccionado =
                diaSeleccionado &&
                diaSeleccionado.getDate() === fecha.getDate() &&
                diaSeleccionado.getMonth() === fecha.getMonth() &&
                diaSeleccionado.getFullYear() === fecha.getFullYear();

              const esHoy =
                fecha.getDate() === hoy.getDate() &&
                fecha.getMonth() === hoy.getMonth() &&
                fecha.getFullYear() === hoy.getFullYear();

              return (
                <button
                  key={fecha.toISOString()}
                  type="button"
                  disabled={deshabilitado}
                  onClick={() => {
                    setDiaSeleccionado(fecha);
                    setHoraSeleccionada("");
                  }}
                  className={`h-8 sm:h-9 rounded-xl text-xs font-bold transition flex flex-col items-center justify-center relative ${
                    esSeleccionado
                      ? "bg-[#031926] text-white shadow-md scale-105 z-10"
                      : deshabilitado
                      ? "text-gray-300 cursor-not-allowed bg-gray-50/50"
                      : "text-[#031926] hover:bg-[#9DBEBB]/30 cursor-pointer"
                  } ${esHoy && !esSeleccionado ? "ring-2 ring-[#468189]/50" : ""}`}
                >
                  <span>{fecha.getDate()}</span>
                  {!deshabilitado && !esSeleccionado && (
                    <span className="w-1 h-1 rounded-full bg-emerald-500 absolute bottom-1" />
                  )}
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-3 pt-2 text-[10px] text-gray-500">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500" /> Disponible
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-gray-300" /> No disponible
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-[#031926]" /> Seleccionado
            </span>
          </div>
        </div>

        {/* Columna Derecha: Horarios Disponibles */}
        <div className="md:col-span-5 md:border-l md:border-[#9DBEBB]/30 md:pl-5 space-y-3 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-2 border-b border-[#9DBEBB]/30">
              <h4 className="text-xs font-extrabold text-[#031926] uppercase tracking-wider flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-[#468189]" />
                Horarios Disponibles
              </h4>
              <span className="text-[10px] text-[#468189] font-bold">
                {duracionMinutos} min / sesión
              </span>
            </div>

            {diaSeleccionado ? (
              <div className="pt-2">
                <p className="text-[11px] text-[#031926]/70 mb-3 capitalize">
                  📅 {diaSeleccionado.toLocaleDateString("es-ES", {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                  })}
                </p>

                <div className="grid grid-cols-2 gap-2 max-h-56 overflow-y-auto pr-1">
                  {horariosPosibles.map((hora) => {
                    const ocupada = esHoraOcupada(diaSeleccionado, hora);
                    const seleccionada = horaSeleccionada === hora;

                    return (
                      <button
                        key={hora}
                        type="button"
                        disabled={ocupada}
                        onClick={() => handleSeleccionarSlot(hora)}
                        className={`py-2 px-2.5 rounded-xl text-xs font-bold border transition text-center ${
                          seleccionada
                            ? "bg-[#468189] text-white border-[#468189] shadow-xs"
                            : ocupada
                            ? "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed line-through text-[10px]"
                            : "bg-[#FBF8F1] text-[#031926] border-[#9DBEBB]/50 hover:border-[#468189] hover:bg-white cursor-pointer"
                        }`}
                      >
                        {hora} {parseInt(hora) >= 12 ? "PM" : "AM"}
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="text-center py-10 text-xs text-gray-400">
                Selecciona un día en el calendario para ver las horas disponibles.
              </div>
            )}
          </div>

          {horaSeleccionada && diaSeleccionado && (
            <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-200 text-emerald-900 text-xs">
              <span className="font-extrabold block mb-0.5">✓ Horario Seleccionado:</span>
              <p className="text-[11px]">
                {diaSeleccionado.toLocaleDateString("es-ES", {
                  weekday: "short",
                  day: "numeric",
                  month: "short",
                })}{" "}
                a las <strong className="font-mono text-emerald-950">{horaSeleccionada}</strong>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

