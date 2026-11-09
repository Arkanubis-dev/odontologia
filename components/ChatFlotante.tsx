"use client";

import { useState, useEffect, useRef } from "react";
import { MessageSquare, Send, Minimize2, Check, Clock, ChevronDown, ArrowLeft, X } from "lucide-react";

interface Mensaje {
  id: string;
  remitente_id: string;
  destinatario_id: string;
  contenido: string;
  leido: boolean;
  creado_en: string;
}

interface EspecialistaItem {
  id: string;
  nombre: string;
  email?: string;
  avatar?: string;
  rol?: string;
}

interface ChatFlotanteProps {
  usuarioActual: {
    id: string;
    nombre: string;
    email?: string;
  };
  especialista?: EspecialistaItem;
  especialistasDisponibles?: EspecialistaItem[];
}

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const DEFAULT_ESPECIALISTA_UUID = "14e6b3b4-3202-4620-9eb9-a9f905e635d0"; // Alyson López

export default function ChatFlotante({
  usuarioActual,
  especialista,
  especialistasDisponibles = [],
}: ChatFlotanteProps) {
  const [abierto, setAbierto] = useState(false);
  const [mensajes, setMensajes] = useState<Mensaje[]>([]);
  const [nuevoMensaje, setNuevoMensaje] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [enLinea, setEnLinea] = useState<boolean>(false);
  const [noLeidos, setNoLeidos] = useState(0);

  // Lista de especialistas sanitizada (solo UUIDs válidos y distintos al usuario actual si es posible)
  const listaEspecialistas = (
    especialistasDisponibles.length > 0
      ? especialistasDisponibles
      : especialista
      ? [especialista]
      : []
  ).filter((e) => UUID_REGEX.test(e.id));

  // Especialista activo
  const defaultEspecialista =
    listaEspecialistas.find((e) => e.id !== usuarioActual?.id) ||
    listaEspecialistas[0] || {
      id: DEFAULT_ESPECIALISTA_UUID,
      nombre: "Dra. Alyson López Sánchez",
      rol: "Psicóloga Clínica y Terapéutica",
    };

  const [especialistaActivo, setEspecialistaActivo] = useState<EspecialistaItem>(defaultEspecialista);
  const [mostrarSelector, setMostrarSelector] = useState(false);

  // Actualizar especialista activo si cambian las props
  useEffect(() => {
    if (listaEspecialistas.length > 0) {
      const match = listaEspecialistas.find((e) => e.id !== usuarioActual?.id) || listaEspecialistas[0];
      if (match) setEspecialistaActivo(match);
    }
  }, [especialistasDisponibles, especialista, usuarioActual?.id]);

  const especialistaId = UUID_REGEX.test(especialistaActivo.id)
    ? especialistaActivo.id
    : DEFAULT_ESPECIALISTA_UUID;
  const especialistaNombre = especialistaActivo.nombre || "Dra. Alyson López";

  const mensajesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll al último mensaje
  const scrollToBottom = () => {
    mensajesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (abierto) {
      scrollToBottom();
      setNoLeidos(0);
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [mensajes, abierto]);

  // Consultar presencia / estado en línea del especialista
  useEffect(() => {
    if (!especialistaId) return;

    async function verificarPresencia() {
      try {
        const res = await fetch(`/api/chat/presencia?usuario_id=${especialistaId}`, { cache: "no-store" });
        if (res.ok) {
          const data = await res.json();
          setEnLinea(Boolean(data.en_linea));
        }
      } catch {}
    }

    verificarPresencia();
    const interval = setInterval(verificarPresencia, 15000); // Cada 15s
    return () => clearInterval(interval);
  }, [especialistaId]);

  // Cargar mensajes y polling en tiempo real
  useEffect(() => {
    if (!usuarioActual?.id || !especialistaId) return;

    async function cargarMensajes() {
      try {
        const res = await fetch(
          `/api/chat/mensajes?usuario_id=${usuarioActual.id}&contacto_id=${especialistaId}`,
          { cache: "no-store" }
        );
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data.mensajes)) {
            setMensajes(data.mensajes);
            if (!abierto) {
              const entrantes = data.mensajes.filter(
                (m: any) => m.destinatario_id === usuarioActual.id && !m.leido
              );
              setNoLeidos(entrantes.length);
            }
          }
        }
      } catch {}
    }

    cargarMensajes();

    // Polling en tiempo real: 2 segundos cuando está abierto, 4 segundos cuando está cerrado
    const intervalMs = abierto ? 2000 : 4000;
    const interval = setInterval(cargarMensajes, intervalMs);

    return () => clearInterval(interval);
  }, [usuarioActual?.id, especialistaId, abierto]);

  // Enviar mensaje
  const handleEnviar = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const contenidoLimpio = nuevoMensaje.trim();
    if (!contenidoLimpio || enviando || !usuarioActual?.id) return;

    setEnviando(true);
    const tempId = "temp-" + Date.now();
    const mensajeOptimista: Mensaje = {
      id: tempId,
      remitente_id: usuarioActual.id,
      destinatario_id: especialistaId,
      contenido: contenidoLimpio,
      leido: false,
      creado_en: new Date().toISOString(),
    };

    setMensajes((prev) => [...prev, mensajeOptimista]);
    setNuevoMensaje("");

    try {
      const res = await fetch("/api/chat/mensajes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          remitente_id: usuarioActual.id,
          destinatario_id: especialistaId,
          contenido: contenidoLimpio,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.mensaje) {
          setMensajes((prev) =>
            prev.map((m) => (m.id === tempId ? data.mensaje : m))
          );
        }
      }
    } catch (err) {
      console.error("Error al enviar mensaje:", err);
    } finally {
      setEnviando(false);
    }
  };

  const sugerenciasRapidas = [
    "Hola, ¿cómo estás?",
    "Tengo una duda sobre mi próxima cita",
    "Pregunta sobre mi tarea asignada",
  ];

  return (
    <>
      {/* 1. VENTANA DE CHAT: En móvil abre a pantalla completa fluida; en escritorio es ventana flotante */}
      {abierto && (
        <div className="fixed inset-0 sm:inset-auto sm:bottom-5 sm:right-5 z-50 flex flex-col bg-white sm:rounded-3xl sm:shadow-2xl sm:border sm:border-[#9DBEBB]/50 sm:w-[390px] sm:h-[540px] h-[100dvh] max-h-[100dvh] sm:max-h-[85vh] overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-200">
          {/* Cabecera del Chat */}
          <div className="bg-[#031926] text-white p-3.5 sm:p-4 border-b border-[#468189]/40 relative shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5 sm:gap-3">
                {/* Botón Volver en móvil */}
                <button
                  type="button"
                  onClick={() => setAbierto(false)}
                  className="sm:hidden p-1.5 -ml-1 text-white/90 hover:text-white rounded-xl hover:bg-white/10 transition"
                  title="Volver"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>

                <div className="relative shrink-0">
                  <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-[#468189] text-white flex items-center justify-center font-bold text-xs sm:text-sm shadow-xs overflow-hidden border border-[#77ACA2]/40">
                    {especialistaActivo?.avatar ? (
                      <img
                        src={especialistaActivo.avatar}
                        alt={especialistaNombre}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span>{especialistaNombre.charAt(0)}</span>
                    )}
                  </div>
                  <span
                    className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-[#031926] ${
                      enLinea ? "bg-emerald-500" : "bg-gray-400"
                    }`}
                  />
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <h4 className="text-xs sm:text-sm font-bold leading-tight truncate">
                      {especialistaNombre}
                    </h4>
                    {listaEspecialistas.length > 1 && (
                      <button
                        type="button"
                        onClick={() => setMostrarSelector(!mostrarSelector)}
                        className="text-[#9DBEBB] hover:text-white transition p-0.5"
                        title="Cambiar especialista"
                      >
                        <ChevronDown className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        enLinea ? "bg-emerald-400 animate-pulse" : "bg-gray-400"
                      }`}
                    />
                    <span className="text-[10px] sm:text-[11px] text-[#9DBEBB] truncate">
                      {enLinea ? "En línea ahora" : "Fuera de consulta"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Controles de minimizar en escritorio */}
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setAbierto(false)}
                  className="w-8 h-8 rounded-xl hover:bg-white/10 text-white/80 hover:text-white flex items-center justify-center transition cursor-pointer"
                  title="Cerrar chat"
                >
                  <X className="w-4 h-4 hidden sm:block" />
                  <span className="text-xs sm:hidden text-[#9DBEBB] font-semibold">Cerrar</span>
                </button>
              </div>
            </div>

            {/* Dropdown para alternar entre especialistas disponibles */}
            {mostrarSelector && listaEspecialistas.length > 1 && (
              <div className="absolute top-full left-0 right-0 bg-[#031926] border-b border-[#468189]/40 p-2 shadow-xl z-20 space-y-1 animate-in fade-in slide-in-from-top-2">
                <span className="text-[10px] uppercase font-bold text-[#9DBEBB] px-2 block">
                  Selecciona con quién chatear:
                </span>
                {listaEspecialistas.map((esp) => (
                  <button
                    key={esp.id}
                    onClick={() => {
                      setEspecialistaActivo(esp);
                      setMostrarSelector(false);
                    }}
                    className={`w-full text-left p-2.5 rounded-xl text-xs flex items-center justify-between transition cursor-pointer ${
                      especialistaActivo.id === esp.id
                        ? "bg-[#468189] text-white font-bold"
                        : "hover:bg-white/10 text-white/80"
                    }`}
                  >
                    <span>{esp.nombre}</span>
                    <span className="text-[10px] text-[#9DBEBB]">
                      {esp.rol || (esp.id === DEFAULT_ESPECIALISTA_UUID ? "Psicóloga" : "Especialista")}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Banner de Estado / Disponibilidad */}
          <div className="bg-[#FBF8F1] px-4 py-1.5 border-b border-[#9DBEBB]/30 text-[11px] text-[#031926]/75 flex items-center gap-2 shrink-0">
            <Clock className="w-3.5 h-3.5 text-[#468189] shrink-0" />
            <span className="truncate">
              {enLinea
                ? "Especialista en línea. Respuesta en breve."
                : "Deja tu mensaje y te responderemos en tu sesión o al conectarse."}
            </span>
          </div>

          {/* Cuerpo de Mensajes */}
          <div className="flex-1 overflow-y-auto p-3.5 sm:p-4 space-y-3 bg-[#FBF8F1]/40">
            {mensajes.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-[#031926]/60">
                <div className="w-12 h-12 rounded-2xl bg-[#9DBEBB]/20 flex items-center justify-center mb-3 text-[#468189]">
                  <MessageSquare className="w-6 h-6" />
                </div>
                <h5 className="text-sm font-bold text-[#031926]">
                  Inicia una conversación
                </h5>
                <p className="text-xs text-[#031926]/70 mt-1 max-w-xs leading-relaxed">
                  Envía un mensaje privado sobre tus dudas, tareas o seguimiento terapéutico.
                </p>

                <div className="mt-4 flex flex-col gap-1.5 w-full">
                  {sugerenciasRapidas.map((sug, i) => (
                    <button
                      key={i}
                      onClick={() => setNuevoMensaje(sug)}
                      className="text-left text-xs bg-white hover:bg-[#F4E9CD]/40 border border-[#9DBEBB]/40 rounded-xl px-3 py-2 text-[#031926] font-medium transition cursor-pointer"
                    >
                      {sug}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              mensajes.map((msg) => {
                const esMio = msg.remitente_id === usuarioActual.id;
                const hora = new Date(msg.creado_en).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                });

                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${esMio ? "items-end" : "items-start"}`}
                  >
                    <div
                      className={`max-w-[85%] sm:max-w-[80%] rounded-2xl px-3.5 py-2.5 text-xs sm:text-[13px] leading-relaxed shadow-xs ${
                        esMio
                          ? "bg-[#468189] text-white rounded-br-xs"
                          : "bg-white text-[#031926] border border-[#9DBEBB]/40 rounded-bl-xs"
                      }`}
                    >
                      {msg.contenido}
                    </div>
                    <span className="text-[10px] text-gray-400 mt-1 px-1 flex items-center gap-1">
                      {hora}
                      {esMio && <Check className="w-3 h-3 text-[#77ACA2]" />}
                    </span>
                  </div>
                );
              })
            )}
            <div ref={mensajesEndRef} />
          </div>

          {/* Formulario de Envío optimizado para móvil (evita auto-zoom en iOS con text-base) */}
          <form
            onSubmit={handleEnviar}
            className="p-2.5 sm:p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] bg-white border-t border-[#9DBEBB]/30 flex items-center gap-2 shrink-0"
          >
            <input
              ref={inputRef}
              type="text"
              value={nuevoMensaje}
              onChange={(e) => setNuevoMensaje(e.target.value)}
              placeholder="Escribe tu mensaje..."
              className="flex-1 bg-[#FBF8F1] border border-[#9DBEBB]/50 rounded-2xl px-4 py-2.5 text-base sm:text-sm text-[#031926] focus:outline-none focus:ring-2 focus:ring-[#468189]"
            />
            <button
              type="submit"
              disabled={enviando || !nuevoMensaje.trim()}
              className="w-11 h-11 sm:w-10 sm:h-10 rounded-2xl bg-[#031926] hover:bg-[#468189] text-white flex items-center justify-center shadow-md transition disabled:opacity-40 cursor-pointer shrink-0"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}

      {/* 2. BURBUJA FLOTANTE REDONDA REAL (TIPO MESSENGER) */}
      {!abierto && (
        <div className="fixed bottom-5 right-5 z-50">
          <button
            onClick={() => setAbierto(true)}
            className="relative flex items-center justify-center w-14 h-14 sm:w-auto sm:h-auto sm:px-4 sm:py-3 rounded-full bg-[#031926] text-white shadow-2xl border-2 border-[#77ACA2]/60 hover:bg-[#468189] transition cursor-pointer transform hover:scale-105 active:scale-95"
            title={`Chatear con ${especialistaNombre}`}
          >
            {/* Avatar / Ícono de la burbuja */}
            <div className="relative shrink-0">
              <div className="w-10 h-10 rounded-full bg-[#468189] flex items-center justify-center font-bold text-xs text-white overflow-hidden shadow-inner">
                {especialistaActivo?.avatar ? (
                  <img
                    src={especialistaActivo.avatar}
                    alt={especialistaNombre}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <MessageSquare className="w-5 h-5 text-white" />
                )}
              </div>
              {/* Indicador en línea con pulso */}
              <span
                className={`absolute -top-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-[#031926] ${
                  enLinea ? "bg-emerald-500" : "bg-gray-400"
                }`}
              >
                {enLinea && (
                  <span className="absolute inset-0 rounded-full bg-emerald-400 animate-ping opacity-75" />
                )}
              </span>
            </div>

            {/* Texto en pantallas medianas/grandes (en móvil es burbuja circular pura) */}
            <div className="text-left hidden sm:block pr-1 ml-3">
              <span className="text-xs font-bold block leading-tight">
                Chat con {especialistaNombre.split(" ")[0]}
              </span>
              <span className="text-[10px] text-[#9DBEBB] flex items-center gap-1.5 mt-0.5">
                <span className={`w-1.5 h-1.5 rounded-full ${enLinea ? "bg-emerald-400" : "bg-slate-400"}`} />
                <span>{enLinea ? "En consulta / En línea" : "Buzón privado"}</span>
              </span>
            </div>

            {/* Contador de no leídos */}
            {noLeidos > 0 && (
              <span className="absolute -top-1 -right-1 bg-rose-500 text-white font-extrabold text-[10px] w-5 h-5 rounded-full flex items-center justify-center shadow-md border-2 border-white scale-100 transition-transform">
                {noLeidos}
              </span>
            )}
          </button>
        </div>
      )}
    </>
  );
}
