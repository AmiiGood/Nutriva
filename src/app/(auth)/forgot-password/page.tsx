"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { Playfair_Display } from "next/font/google";
import { ArrowLeft, Mail } from "lucide-react";

const playfair = Playfair_Display({ subsets: ["latin"], weight: ["700"] });

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    });

    if (error) {
      setError("Error al enviar el correo");
      setLoading(false);
      return;
    }
    setEnviado(true);
    setLoading(false);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-white px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-10">
          <span
            className={`${playfair.className} text-2xl font-bold text-zinc-900`}
          >
            Nutriva
          </span>
        </div>

        <AnimatePresence mode="wait">
          {!enviado ? (
            <motion.div
              key="form"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
            >
              <h1 className="text-2xl font-bold text-zinc-900 mb-2">
                ¿Olvidaste tu contraseña?
              </h1>
              <p className="text-sm text-zinc-400 mb-8">
                Escribe tu correo y te enviaremos un enlace para restablecerla.
              </p>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-zinc-600 uppercase tracking-wide">
                    Correo electrónico
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setError("");
                    }}
                    placeholder="tu@correo.com"
                    required
                    className="w-full h-11 px-3.5 rounded-lg border border-zinc-200 bg-zinc-50 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20 transition"
                  />
                </div>

                {error && (
                  <p className="text-xs text-red-500 bg-red-50 border border-red-100 px-3 py-2 rounded-lg">
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full h-11 rounded-lg bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white text-sm font-medium transition-colors flex items-center justify-center"
                >
                  {loading ? (
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    "Enviar enlace"
                  )}
                </button>
              </form>

              <Link
                href="/login"
                className="flex items-center justify-center gap-2 mt-6 text-sm text-zinc-400 hover:text-zinc-700 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Volver al inicio de sesión
              </Link>
            </motion.div>
          ) : (
            <motion.div
              key="enviado"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center"
            >
              <div className="w-14 h-14 rounded-2xl bg-emerald-50 flex items-center justify-center mx-auto mb-6">
                <Mail className="w-6 h-6 text-emerald-500" />
              </div>
              <h2 className="text-2xl font-bold text-zinc-900 mb-2">
                Revisa tu correo
              </h2>
              <p className="text-sm text-zinc-400 mb-1">Enviamos un enlace a</p>
              <p className="text-sm font-medium text-zinc-700 mb-6">{email}</p>
              <p className="text-xs text-zinc-400 mb-8">
                El enlace expira en 1 hora. Si no lo ves revisa tu carpeta de
                spam.
              </p>
              <Link
                href="/login"
                className="text-sm text-emerald-600 hover:text-emerald-700 font-medium"
              >
                Volver al inicio de sesión
              </Link>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
