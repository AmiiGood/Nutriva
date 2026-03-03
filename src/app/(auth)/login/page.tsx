"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, ArrowRight, Check, Mail } from "lucide-react";
import { Playfair_Display } from "next/font/google";
import Link from "next/link";

const playfair = Playfair_Display({ subsets: ["latin"], weight: ["700"] });

type Mode = "login" | "registro";

export default function AuthPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("login");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    nombre: "",
    apellidos: "",
    email: "",
    password: "",
  });

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError("");
  }

  function switchMode(m: Mode) {
    setMode(m);
    setError("");
    setForm({ nombre: "", apellidos: "", email: "", password: "" });
  }

  function getPasswordStrength(password: string): {
    score: number;
    label: string;
    color: string;
  } {
    if (!password) return { score: 0, label: "", color: "" };
    let score = 0;
    if (password.length >= 8) score++;
    if (password.length >= 12) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;

    if (score <= 1) return { score, label: "Muy débil", color: "bg-red-400" };
    if (score === 2) return { score, label: "Débil", color: "bg-orange-400" };
    if (score === 3) return { score, label: "Regular", color: "bg-yellow-400" };
    if (score === 4) return { score, label: "Fuerte", color: "bg-emerald-400" };
    return { score, label: "Muy fuerte", color: "bg-emerald-500" };
  }

  const [registroEnviado, setRegistroEnviado] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const supabase = createClient();

    if (mode === "login") {
      const { error } = await supabase.auth.signInWithPassword({
        email: form.email,
        password: form.password,
      });
      if (error) {
        setError("Correo o contraseña incorrectos");
        setLoading(false);
        return;
      }
      router.push("/dashboard");
      router.refresh();
    } else {
      const { error } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          data: { nombre: form.nombre, apellidos: form.apellidos },
        },
      });
      if (error) {
        setError(error.message);
        setLoading(false);
        return;
      }
      setRegistroEnviado(true);
      setLoading(false);
    }
  }

  const rightPanel = {
    login: {
      bg: "from-emerald-950 to-emerald-800",
      accent: "text-emerald-300",
      badge: "bg-emerald-400/10 text-emerald-300 border-emerald-400/20",
      badgeText: "Plataforma para nutriólogos",
      title: "Transforma la nutrición de tus pacientes",
      sub: "Gestiona expedientes, planes alimenticios y evolución desde un solo lugar.",
      items: [
        { label: "14 días de prueba gratuita", sub: "Sin tarjeta de crédito" },
        {
          label: "Base de datos de alimentos",
          sub: "+1,000 alimentos verificados",
        },
        { label: "Portal del paciente", sub: "Acceso directo a su plan" },
      ],
    },
    registro: {
      bg: "from-zinc-950 to-zinc-800",
      accent: "text-emerald-400",
      badge: "bg-white/5 text-zinc-300 border-white/10",
      badgeText: "Únete a cientos de nutriólogos",
      title: "Todo lo que necesitas en un solo lugar",
      sub: "La herramienta más completa para nutriólogos en México.",
      items: [
        { label: "Expedientes digitales", sub: "Historial clínico completo" },
        { label: "Planes alimenticios", sub: "Crea y reutiliza plantillas" },
        { label: "Seguimiento de evolución", sub: "Peso, medidas y fotos" },
      ],
    },
  };

  const panel = rightPanel[mode];

  if (registroEnviado) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white px-4">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-sm w-full text-center"
        >
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 flex items-center justify-center mx-auto mb-6">
            <Mail className="w-6 h-6 text-emerald-500" />
          </div>
          <h2 className="text-2xl font-bold text-zinc-900 mb-2">
            Revisa tu correo
          </h2>
          <p className="text-sm text-zinc-400 mb-1">
            Enviamos un enlace de confirmación a
          </p>
          <p className="text-sm font-medium text-zinc-700 mb-6">{form.email}</p>
          <p className="text-xs text-zinc-400">
            Al confirmar tu correo serás redirigido automáticamente al
            dashboard.
          </p>
          <button
            onClick={() => {
              setRegistroEnviado(false);
              setMode("login");
            }}
            className="mt-8 text-xs text-zinc-400 hover:text-zinc-600 underline"
          >
            Volver al inicio de sesión
          </button>
        </motion.div>
      </div>
    );
  }
  return (
    <div className="min-h-screen flex bg-white overflow-hidden">
      {/* ── Lado izquierdo ── */}
      <div className="w-full lg:w-[45%] flex flex-col justify-center px-8 sm:px-14 xl:px-20 relative">
        {/* Logo */}
        <div
          className={`${playfair.className} text-2xl font-bold text-zinc-900 tracking-tight`}
        >
          Nutriva
        </div>

        <div className="max-w-[360px] w-full mx-auto pt-20 pb-10">
          {/* Tabs */}
          <div className="flex gap-1 mb-10 p-1 bg-zinc-100 rounded-xl w-fit">
            {(["login", "registro"] as Mode[]).map((m) => (
              <button
                key={m}
                onClick={() => switchMode(m)}
                className={`relative px-5 py-2 text-sm font-medium rounded-lg transition-colors duration-150 ${
                  mode === m
                    ? "text-zinc-900"
                    : "text-zinc-400 hover:text-zinc-600"
                }`}
              >
                {mode === m && (
                  <motion.div
                    layoutId="tab-pill"
                    className="absolute inset-0 bg-white rounded-lg shadow-sm"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
                <span className="relative z-10 capitalize">
                  {m === "login" ? "Iniciar sesión" : "Registrarse"}
                </span>
              </button>
            ))}
          </div>

          {/* Heading */}
          <AnimatePresence mode="wait">
            <motion.div
              key={mode + "-heading"}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="mb-8"
            >
              <h1 className="text-2xl font-bold text-zinc-900 mb-1">
                {mode === "login"
                  ? "Bienvenido de nuevo"
                  : "Crea tu cuenta gratis"}
              </h1>
              <p className="text-sm text-zinc-400">
                {mode === "login"
                  ? "Ingresa tus datos para continuar"
                  : "Sin tarjeta de crédito · 14 días gratis"}
              </p>
            </motion.div>
          </AnimatePresence>

          {/* Form */}
          <form onSubmit={handleSubmit}>
            <AnimatePresence mode="wait">
              <motion.div
                key={mode}
                initial={{ opacity: 0, x: mode === "registro" ? 20 : -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: mode === "registro" ? -20 : 20 }}
                transition={{ duration: 0.25, ease: "easeInOut" }}
                className="space-y-4"
              >
                {mode === "registro" && (
                  <div className="grid grid-cols-2 gap-3">
                    <Field
                      label="Nombre"
                      name="nombre"
                      placeholder="Ana"
                      value={form.nombre}
                      onChange={handleChange}
                    />
                    <Field
                      label="Apellidos"
                      name="apellidos"
                      placeholder="García"
                      value={form.apellidos}
                      onChange={handleChange}
                    />
                  </div>
                )}

                <Field
                  label="Correo electrónico"
                  name="email"
                  type="email"
                  placeholder="tu@correo.com"
                  value={form.email}
                  onChange={handleChange}
                />

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="...">Contraseña</label>
                    <Link
                      href="/forgot-password"
                      className="text-xs text-emerald-600 hover:text-emerald-700 transition-colors"
                    >
                      ¿Olvidaste tu contraseña?
                    </Link>
                  </div>

                  {/* Input */}
                  <div className="relative">
                    <input
                      name="password"
                      type={showPassword ? "text" : "password"}
                      placeholder={
                        mode === "registro" ? "Mínimo 8 caracteres" : "••••••••"
                      }
                      value={form.password}
                      onChange={handleChange}
                      required
                      minLength={8}
                      className="w-full h-11 px-3.5 pr-10 rounded-lg border border-zinc-200 bg-zinc-50 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20 transition"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((p) => !p)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 transition-colors"
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>

                  {/* Indicador FUERA del relative */}
                  {mode === "registro" &&
                    form.password &&
                    (() => {
                      const strength = getPasswordStrength(form.password);
                      return (
                        <div className="space-y-1">
                          <div className="flex gap-1">
                            {[1, 2, 3, 4, 5].map((i) => (
                              <div
                                key={i}
                                className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                                  i <= strength.score
                                    ? strength.color
                                    : "bg-zinc-100"
                                }`}
                              />
                            ))}
                          </div>
                          <p
                            className={`text-xs font-medium ${
                              strength.score <= 2
                                ? "text-red-400"
                                : strength.score === 3
                                  ? "text-yellow-500"
                                  : "text-emerald-500"
                            }`}
                          >
                            {strength.label}
                          </p>
                        </div>
                      );
                    })()}
                </div>

                {error && (
                  <motion.p
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-xs text-red-500 bg-red-50 border border-red-100 px-3 py-2 rounded-lg"
                  >
                    {error}
                  </motion.p>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full h-11 mt-1 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white text-sm font-medium rounded-lg flex items-center justify-center gap-2 transition-colors group"
                >
                  {loading ? (
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      {mode === "login" ? "Iniciar sesión" : "Crear cuenta"}
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                    </>
                  )}
                </button>
              </motion.div>
            </AnimatePresence>
          </form>

          <p className="text-center text-xs text-zinc-400 mt-6">
            {mode === "login" ? "¿No tienes cuenta?" : "¿Ya tienes cuenta?"}{" "}
            <button
              onClick={() =>
                switchMode(mode === "login" ? "registro" : "login")
              }
              className="text-zinc-700 font-medium hover:text-emerald-600 transition-colors"
            >
              {mode === "login" ? "Regístrate gratis" : "Inicia sesión"}
            </button>
          </p>
        </div>
      </div>

      {/* ── Lado derecho con foto ── */}
      <div className="hidden lg:flex w-[55%] relative overflow-hidden">
        {/* Fotos con crossfade según modo */}
        <AnimatePresence>
          <motion.div
            key={mode + "-photo"}
            initial={{ opacity: 0, scale: 1.04 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.04 }}
            transition={{ duration: 0.6, ease: "easeInOut" }}
            className="absolute inset-0"
          >
            <img
              src={
                mode === "login"
                  ? "https://images.unsplash.com/photo-1505576399279-565b52d4ac71?w=1200&q=80&fit=crop"
                  : "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=1200&q=80&fit=crop"
              }
              alt=""
              className="w-full h-full object-cover"
            />
            {/* Overlay oscuro para legibilidad del texto */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/10" />
          </motion.div>
        </AnimatePresence>

        {/* Badge arriba */}
        <div className="relative z-10 w-full flex flex-col justify-between p-14 xl:p-20">
          <motion.div
            key={mode + "-badge"}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <span className="inline-flex items-center gap-2 text-xs font-medium px-3 py-1.5 rounded-full border bg-white/10 backdrop-blur-sm text-white border-white/20">
              <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
              {mode === "login"
                ? "Plataforma para nutriólogos"
                : "Únete a cientos de nutriólogos"}
            </span>
          </motion.div>

          {/* Contenido abajo */}
          <AnimatePresence mode="wait">
            <motion.div
              key={mode + "-content"}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              transition={{ delay: 0.15, duration: 0.3 }}
            >
              <h2 className="text-3xl xl:text-4xl font-bold text-white leading-[1.2] mb-4">
                {mode === "login" ? (
                  <>
                    Transforma la nutrición
                    <br />
                    <span className="text-emerald-300">de tus pacientes</span>
                  </>
                ) : (
                  <>
                    Todo lo que necesitas
                    <br />
                    <span className="text-emerald-300">en un solo lugar</span>
                  </>
                )}
              </h2>

              <p className="text-white/60 text-sm leading-relaxed mb-8 max-w-sm">
                {mode === "login"
                  ? "Gestiona expedientes, planes alimenticios y evolución desde un solo lugar."
                  : "La herramienta más completa para nutriólogos en México."}
              </p>

              <div className="space-y-3">
                {(mode === "login"
                  ? [
                      {
                        label: "14 días de prueba gratuita",
                        sub: "Sin tarjeta de crédito",
                      },
                      {
                        label: "+1,000 alimentos verificados",
                        sub: "Base de datos completa",
                      },
                      {
                        label: "Portal del paciente",
                        sub: "Acceso directo a su plan",
                      },
                    ]
                  : [
                      {
                        label: "Expedientes digitales",
                        sub: "Historial clínico completo",
                      },
                      {
                        label: "Planes alimenticios",
                        sub: "Crea y reutiliza plantillas",
                      },
                      {
                        label: "Seguimiento de evolución",
                        sub: "Peso, medidas y fotos",
                      },
                    ]
                ).map((item, i) => (
                  <motion.div
                    key={item.label}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.25 + i * 0.08 }}
                    className="flex items-center gap-3"
                  >
                    <div className="w-6 h-6 rounded-full bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center shrink-0">
                      <Check className="w-3 h-3 text-emerald-400" />
                    </div>
                    <div>
                      <p className="text-white text-sm font-medium leading-none mb-0.5">
                        {item.label}
                      </p>
                      <p className="text-white/40 text-xs">{item.sub}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

// Campo reutilizable
function Field({
  label,
  name,
  type = "text",
  placeholder,
  value,
  onChange,
}: {
  label: string;
  name: string;
  type?: string;
  placeholder: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium text-zinc-600 uppercase tracking-wide">
        {label}
      </Label>
      <input
        name={name}
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        required
        className="w-full h-11 px-3.5 rounded-lg border border-zinc-200 bg-zinc-50 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20 transition"
      />
    </div>
  );
}
