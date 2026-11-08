"use client";

import { useState, useEffect, useRef } from "react";
import { MessageSquare, X, Send, Sparkles, Circle, Minimize2, Check, Clock } from "lucide-react";

interface Mensaje {
  id: string;
  remitente_id: string;
  destinatario_id: string;
  contenido: string;
  leido: boolean;
  creado_en: string;
}

interface ChatFlotanteProps {
  usuarioActual: {
    id: string;
    nombre: string;
    email?: string;
  };
  especialista?: {
    id: string;
    nombre: string;
    avatar?: string;
  };
}

export default function ChatFlotante({ usuarioActual, especialista }: ChatFlotanteProps) {
  const [abierto, setAbierto] = useState(false);
  const [mensajes, setMensajes] = useState<Mensaje[]>([]);
  const [nuevoMensaje, setNuevoMensaje] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [enLinea, setEnLinea] = useState<boolean>(false);
  const [noLeidos, setNoLeidos] = useState(0);

  const especialistaId = especialista?.id || "14e6b3b4-3202-4620-9eb9-a9f905e635d0"; // Alyson por defecto
  const especialistaNombre = especialista?.nombre || "Dra. Alyson López";

  const mensajesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll al último mensaje
  const scrollToBottom = () => {
    mensajesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (abierto) {
      scrollToBottom();
      setNoLeidos(0);
    }
  }, [mensajes, abierto]);

  // Consultar presencia / estado en línea del especialista
  useEffect(() => {
    if (!especialistaId) return;

    async function verificarPresencia() {
      try {
        const res = await fetch(`/api/chat/presencia?usuario_id=${especialistaId}`);
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
          `/api/chat/mensajes?usuario_id=${usuarioActual.id}&contacto_id=${especialistaId}`
        );
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data.mensajes)) {
            setMensajes(data.mensajes);
          }
        }
      } catch {}
    }

    cargarMensajes();

    // Polling cada 3.5 segundos cuando el chat está abierto
    let interval: any = null;
    if (abierto) {
      interval = setInterval(cargarMensajes, 3500);
    } else {
      interval = setInterval(cargarMensajes, 12000);
    }

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
    "👋 Hola doctora, ¿cómo estás?",
    "📅 Tengo una duda de mi cita",
    "📝 Pregunta sobre mi tarea",
  ];

  return (
    <div className="fixed bottom-5 right-5 z-50 select-none">
      {/* Ventana de Chat Expandida */}
      {abierto && (
        <div className="bg-white rounded-3xl shadow-2xl border border-[#9DBEBB]/50 w-[92vw] sm:w-[380px] h-[520px] max-h-[85vh] flex flex-col overflow-hidden mb-3 animate-in fade-in slide-in-from-bottom-5 duration-200">
          {/* Cabecera del Chat */}
          <div className="bg-[#031926] text-white p-4 flex items-center justify-between border-b border-[#468189]/40">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-10 h-10 rounded-2xl bg-[#468189] text-white flex items-center justify-center font-bold text-sm shadow-xs overflow-hidden border border-[#77ACA2]/40">
                  {especialista?.avatar ? (
                    <img
                      src={especialista.avatar}
                      alt={especialistaNombre}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span>{especialistaNombre.charAt(0)}</span>
                  )}
                </div>
                <span
                  className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-[#031926] ${
                    enLinea ? "bg-emerald-500" : "bg-gray-400"
                  }`}
                />
              </div>

              <div>
                <h4 className="text-sm font-bold leading-tight">{especialistaNombre}</h4>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      enLinea ? "bg-emerald-400 animate-pulse" : "bg-gray-400"
                    }`}
                  />
                  <span className="text-[11px] text-[#9DBEBB]">
                    {enLinea ? "En línea ahora" : "Fuera de consulta"}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setAbierto(false)}
                className="w-8 h-8 rounded-xl hover:bg-white/10 text-white/80 hover:text-white flex items-center justify-center transition cursor-pointer"
                title="Minimizar chat"
              >
                <Minimize2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Banner de Estado / Disponibilidad */}
          <div className="bg-[#FBF8F1] px-4 py-2 border-b border-[#9DBEBB]/30 text-[11px] text-[#031926]/70 flex items-center gap-2">
            <Clock className="w-3.5 h-3.5 text-[#468189] shrink-0" />
            <span>
              {enLinea
                ? "La psicóloga está activa en la plataforma."
                : "Puedes dejar tu mensaje y recibirás respuesta en tu sesión o cuando se conecte."}
            </span>
          </div>

          {/* Cuerpo de Mensajes */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#FBF8F1]/40">
            {mensajes.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-[#031926]/60">
                <div className="w-12 h-12 rounded-2xl bg-[#9DBEBB]/20 flex items-center justify-center mb-3 text-[#468189]">
                  <MessageSquare className="w-6 h-6" />
                </div>
                <h5 className="text-sm font-bold text-[#031926]">
                  Inicia una conversación
                </h5>
                <p className="text-xs text-[#031926]/70 mt-1 max-w-xs leading-relaxed">
                  Envía un mensaje privado a tu psicóloga sobre tus dudas, tareas o seguimiento.
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
                      className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 text-xs sm:text-[13px] leading-relaxed shadow-xs ${
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

          {/* Formulario de Envío */}
          <form
            onSubmit={handleEnviar}
            className="p-3 bg-white border-t border-[#9DBEBB]/30 flex items-center gap-2"
          >
            <input
              type="text"
              value={nuevoMensaje}
              onChange={(e) => setNuevoMensaje(e.target.value)}
              placeholder="Escribe tu mensaje..."
              className="flex-1 bg-[#FBF8F1] border border-[#9DBEBB]/50 rounded-2xl px-4 py-2.5 text-xs sm:text-sm text-[#031926] focus:outline-none focus:ring-2 focus:ring-[#468189]"
            />
            <button
              type="submit"
              disabled={enviando || !nuevoMensaje.trim()}
              className="w-10 h-10 rounded-2xl bg-[#031926] hover:bg-[#468189] text-white flex items-center justify-center shadow-md transition disabled:opacity-40 cursor-pointer shrink-0"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}

      {/* Botón Flotante Tipo Messenger */}
      {!abierto && (
        <button
          onClick={() => setAbierto(true)}
          className="group relative flex items-center gap-3 px-4 py-3 rounded-full bg-[#031926] text-white shadow-2xl border-2 border-[#77ACA2]/50 hover:bg-[#468189] transition cursor-pointer transform hover:scale-105 active:scale-95"
        >
          <div className="relative">
            <div className="w-9 h-9 rounded-full bg-[#468189] flex items-center justify-center font-bold text-xs text-white overflow-hidden">
              {especialista?.avatar ? (
                <img
                  src={especialista.avatar}
                  alt={especialistaNombre}
                  className="w-full h-full object-cover"
                />
              ) : (
                <MessageSquare className="w-4 h-4" />
              )}
            </div>
            {/* Indicador en línea con animación de pulso */}
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

          <div className="text-left hidden sm:block pr-1">
            <span className="text-xs font-bold block leading-tight">
              Chat con Psicóloga
            </span>
            <span className="text-[10px] text-[#9DBEBB] block">
              {enLinea ? "🟢 En línea ahora" : "⚪ Fuera de consulta"}
            </span>
          </div>

          {noLeidos > 0 && (
            <span className="absolute -top-1 -right-1 bg-rose-500 text-white font-extrabold text-[10px] w-5 h-5 rounded-full flex items-center justify-center shadow-md animate-bounce">
              {noLeidos}
            </span>
          )}
        </button>
      )}
    </div>
  );
}
