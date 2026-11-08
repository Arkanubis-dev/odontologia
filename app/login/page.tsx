"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Brain, ArrowLeft, Mail, Lock, ShieldCheck, Sparkles, AlertCircle, User } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);

  // Iniciar sesión con Google
  const handleGoogleLogin = async () => {
    setLoading(true);
    setErrorMsg("");
    try {
      const supabase = createClient();
      if (!supabase) {
        setErrorMsg("Supabase no está configurado. Revisa tus variables en .env.local.");
        setLoading(false);
        return;
      }

      // Determinar el origen exacto (localhost solo en desarrollo local, de lo contrario Vercel)
      const origin =
        typeof window !== "undefined" &&
        (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1")
          ? window.location.origin
          : "https://psicologia-aleja.vercel.app";

      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${origin}/auth/callback`,
        },
      });

      if (error) {
        setErrorMsg(error.message);
        setLoading(false);
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Error al conectar con Google.");
      setLoading(false);
    }
  };

  // Iniciar sesión o registrarse con correo y contraseña
  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !password) {
      setErrorMsg("Por favor completa tu correo y contraseña.");
      return;
    }

    if (password.length < 6) {
      setErrorMsg("La contraseña debe tener al menos 6 caracteres.");
      return;
    }

    setLoading(true);
    setErrorMsg("");

    try {
      const supabase = createClient();

      if (isSignUp) {
        // 1. Registrar usuario en la base de datos
        const res = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: cleanEmail,
            password,
            full_name: nombre.trim() || cleanEmail.split("@")[0],
          }),
        });

        const regData = await res.json();
        if (!res.ok) throw new Error(regData.error || "No se pudo crear la cuenta");

        // 2. Iniciar sesión automáticamente en el servidor
        const loginRes = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: cleanEmail, password }),
        });

        const loginData = await loginRes.json();
        if (!loginRes.ok) throw new Error(loginData.error || "Error al iniciar sesión tras registrarse");

        // 3. Sincronizar sesión en el cliente
        if (supabase) {
          try {
            await supabase.auth.signInWithPassword({ email: cleanEmail, password });
          } catch {
            // Ignorable si el servidor ya asignó las cookies
          }
        }

        // Navegación completa para asegurar la transmisión de cookies HTTP
        window.location.href = loginData.redirectTo || "/portal";
        return;
      } else {
        // Iniciar sesión con el endpoint del servidor (maneja auto-confirmación y cookies seguras)
        const res = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: cleanEmail, password }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Credenciales incorrectas");

        // Sincronizar en el cliente
        if (supabase) {
          try {
            await supabase.auth.signInWithPassword({ email: cleanEmail, password });
          } catch {
            // Ignorable
          }
        }

        // Redirigir al destino correspondiente
        window.location.href = data.redirectTo || "/portal";
        return;
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Error en la autenticación.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FBF8F1] text-[#031926] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 selection:bg-[#9DBEBB]/40 selection:text-[#031926]">
      {/* Botón Volver */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md mb-6">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-semibold text-[#031926]/60 hover:text-[#468189] transition"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver a la página principal
        </Link>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="flex justify-center">
          <div className="w-16 h-16 rounded-2xl overflow-hidden border-2 border-[#77ACA2]/50 shadow-lg shadow-[#468189]/25">
            <img
              src="/alejandra-bedoya.jpg"
              alt="Alejandra Bedoya - Psicóloga Laboral & Terapéutica"
              className="w-full h-full object-cover object-top"
            />
          </div>
        </div>
        <div className="mt-3 inline-block px-3 py-1 rounded-full bg-[#F4E9CD] text-[#031926] text-[11px] font-bold tracking-wide">
          Alejandra Bedoya · Psicología Laboral & Terapéutica
        </div>
        <h2 className="mt-3 text-2xl sm:text-3xl font-extrabold text-[#031926] tracking-tight">
          Portal del Consultante
        </h2>
        <p className="mt-2 text-xs sm:text-sm text-[#031926]/70 max-w-sm mx-auto leading-relaxed">
          Accede a tus citas, seguimiento de tareas terapéuticas y calificaciones de tus sesiones finalizadas
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-xl shadow-[#031926]/5 rounded-3xl border border-[#9DBEBB]/40 sm:px-10">
          {errorMsg && (
            <div className="mb-5 bg-rose-50 border border-rose-200 text-rose-700 p-3.5 rounded-xl text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Botón Principal: Continuar con Google */}
          <div>
            <button
              onClick={handleGoogleLogin}
              disabled={loading}
              type="button"
              className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl border border-[#9DBEBB]/60 bg-white hover:bg-[#F4E9CD]/30 text-[#031926] font-semibold text-sm shadow-xs hover:shadow transition disabled:opacity-60 cursor-pointer"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
                />
                <path
                  fill="#34A853"
                  d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
                />
                <path
                  fill="#EA4335"
                  d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                />
              </svg>
              <span>{loading ? "Conectando..." : "Continuar con Google"}</span>
            </button>
          </div>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[#9DBEBB]/30" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-3 text-[#031926]/50 font-medium">
                O ingresa con tu correo
              </span>
            </div>
          </div>

          {/* Formulario Correo / Contraseña */}
          <form onSubmit={handleEmailAuth} className="space-y-4">
            {isSignUp && (
              <div>
                <label className="block text-xs font-semibold text-[#031926] mb-1">
                  Nombre completo
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-[#77ACA2] absolute left-3.5 top-3" />
                  <input
                    type="text"
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    placeholder="Tu nombre y apellidos"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#9DBEBB]/60 text-sm text-[#031926] focus:outline-none focus:ring-2 focus:ring-[#468189] focus:border-transparent bg-white"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-[#031926] mb-1">
                Correo electrónico
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-[#77ACA2] absolute left-3.5 top-3" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ejemplo@correo.com"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#9DBEBB]/60 text-sm text-[#031926] focus:outline-none focus:ring-2 focus:ring-[#468189] focus:border-transparent bg-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#031926] mb-1">
                Contraseña
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#77ACA2] absolute left-3.5 top-3" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#9DBEBB]/60 text-sm text-[#031926] focus:outline-none focus:ring-2 focus:ring-[#468189] focus:border-transparent bg-white"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 rounded-xl bg-[#468189] hover:bg-[#031926] text-white font-semibold text-sm shadow-md shadow-[#468189]/25 transition disabled:opacity-60 cursor-pointer"
            >
              {loading
                ? "Procesando..."
                : isSignUp
                ? "Crear Cuenta de Paciente"
                : "Iniciar Sesión"}
            </button>
          </form>

          {/* Alternar entre Login y Registro */}
          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={() => {
                setIsSignUp(!isSignUp);
                setErrorMsg("");
              }}
              className="text-xs text-[#468189] hover:text-[#031926] font-semibold transition cursor-pointer"
            >
              {isSignUp
                ? "¿Ya tienes una cuenta? Inicia sesión aquí"
                : "¿Eres un nuevo consultante? Regístrate aquí"}
            </button>
          </div>
        </div>

        {/* Nota de Privacidad */}
        <div className="mt-6 text-center flex items-center justify-center gap-2 text-xs text-[#031926]/60">
          <ShieldCheck className="w-4 h-4 text-[#468189]" />
          <span>Datos confidenciales amparados bajo el secreto profesional de la psicología</span>
        </div>
      </div>
    </div>
  );
}

