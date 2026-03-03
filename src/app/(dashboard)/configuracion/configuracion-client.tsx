"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { motion } from "framer-motion";
import { User, Lock, CreditCard, Check, AlertCircle } from "lucide-react";
import { Label } from "@/components/ui/label";

const inputClass =
  "w-full h-10 px-3.5 rounded-lg border border-zinc-200 bg-zinc-50 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20 transition";

const PLANES = {
  starter: {
    label: "Starter",
    precio: "$299 MXN/mes",
    color: "bg-zinc-100 text-zinc-600",
    features: [
      "Hasta 30 pacientes",
      "Planes alimenticios",
      "Historial de consultas",
    ],
  },
  pro: {
    label: "Pro",
    precio: "$599 MXN/mes",
    color: "bg-blue-50 text-blue-600",
    features: [
      "Hasta 100 pacientes",
      "Todo lo de Starter",
      "Portal del paciente",
      "Plantillas ilimitadas",
    ],
  },
  clinica: {
    label: "Clínica",
    precio: "$1,200 MXN/mes",
    color: "bg-violet-50 text-violet-600",
    features: [
      "Pacientes ilimitados",
      "Todo lo de Pro",
      "Múltiples nutriólogos",
      "Soporte prioritario",
    ],
  },
};

type Toast = { type: "success" | "error"; message: string } | null;

export default function ConfiguracionClient({
  nutriologo,
  email,
}: {
  nutriologo: any;
  email: string;
}) {
  const [perfil, setPerfil] = useState({
    nombre: nutriologo?.nombre ?? "",
    apellidos: nutriologo?.apellidos ?? "",
    telefono: nutriologo?.telefono ?? "",
    cedula_profesional: nutriologo?.cedula_profesional ?? "",
  });
  const [passwords, setPasswords] = useState({
    nueva: "",
    confirmar: "",
  });
  const [loadingPerfil, setLoadingPerfil] = useState(false);
  const [loadingPassword, setLoadingPassword] = useState(false);
  const [toast, setToast] = useState<Toast>(null);

  function showToast(type: "success" | "error", message: string) {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  }

  async function handleGuardarPerfil(e: React.FormEvent) {
    e.preventDefault();
    setLoadingPerfil(true);
    const supabase = createClient();

    const { error } = await supabase
      .from("nutriologos")
      .update({
        nombre: perfil.nombre,
        apellidos: perfil.apellidos,
        telefono: perfil.telefono || null,
        cedula_profesional: perfil.cedula_profesional || null,
      })
      .eq("id", nutriologo.id);

    if (error) showToast("error", "Error al guardar los datos");
    else showToast("success", "Datos actualizados correctamente");
    setLoadingPerfil(false);
  }

  async function handleCambiarPassword(e: React.FormEvent) {
    e.preventDefault();
    if (passwords.nueva !== passwords.confirmar) {
      showToast("error", "Las contraseñas no coinciden");
      return;
    }
    if (passwords.nueva.length < 8) {
      showToast("error", "La contraseña debe tener al menos 8 caracteres");
      return;
    }
    setLoadingPassword(true);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({
      password: passwords.nueva,
    });

    if (error) showToast("error", "Error al cambiar la contraseña");
    else {
      showToast("success", "Contraseña actualizada correctamente");
      setPasswords({ nueva: "", confirmar: "" });
    }
    setLoadingPassword(false);
  }

  const planActual = nutriologo?.plan_tipo ?? "starter";

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">Configuración</h1>
        <p className="text-sm text-zinc-400 mt-0.5">
          Administra tu cuenta y suscripción
        </p>
      </div>

      {/* Toast */}
      {toast && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          className={`fixed top-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-lg text-sm font-medium ${
            toast.type === "success"
              ? "bg-emerald-500 text-white"
              : "bg-red-500 text-white"
          }`}
        >
          {toast.type === "success" ? (
            <Check className="w-4 h-4" />
          ) : (
            <AlertCircle className="w-4 h-4" />
          )}
          {toast.message}
        </motion.div>
      )}

      {/* Datos del nutriólogo */}
      <Section
        icon={User}
        title="Datos personales"
        subtitle="Tu información profesional"
      >
        <form onSubmit={handleGuardarPerfil} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Nombre *">
              <input
                value={perfil.nombre}
                onChange={(e) =>
                  setPerfil((p) => ({ ...p, nombre: e.target.value }))
                }
                required
                placeholder="Ana"
                className={inputClass}
              />
            </Field>
            <Field label="Apellidos *">
              <input
                value={perfil.apellidos}
                onChange={(e) =>
                  setPerfil((p) => ({ ...p, apellidos: e.target.value }))
                }
                required
                placeholder="García Ruiz"
                className={inputClass}
              />
            </Field>
          </div>

          <Field label="Correo electrónico">
            <input
              value={email}
              disabled
              className={`${inputClass} opacity-50 cursor-not-allowed`}
            />
            <p className="text-xs text-zinc-400 mt-1">
              El correo no se puede cambiar desde aquí
            </p>
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Teléfono">
              <input
                value={perfil.telefono}
                onChange={(e) =>
                  setPerfil((p) => ({ ...p, telefono: e.target.value }))
                }
                placeholder="55 1234 5678"
                className={inputClass}
              />
            </Field>
            <Field label="Cédula profesional">
              <input
                value={perfil.cedula_profesional}
                onChange={(e) =>
                  setPerfil((p) => ({
                    ...p,
                    cedula_profesional: e.target.value,
                  }))
                }
                placeholder="12345678"
                className={inputClass}
              />
            </Field>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={loadingPerfil}
              className="px-5 h-10 rounded-lg bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white text-sm font-medium transition-colors flex items-center gap-2"
            >
              {loadingPerfil ? (
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                "Guardar cambios"
              )}
            </button>
          </div>
        </form>
      </Section>

      {/* Cambiar contraseña */}
      <Section
        icon={Lock}
        title="Contraseña"
        subtitle="Actualiza tu contraseña de acceso"
      >
        <form onSubmit={handleCambiarPassword} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Nueva contraseña">
              <input
                type="password"
                value={passwords.nueva}
                onChange={(e) =>
                  setPasswords((p) => ({ ...p, nueva: e.target.value }))
                }
                placeholder="Mínimo 8 caracteres"
                minLength={8}
                required
                className={inputClass}
              />
            </Field>
            <Field label="Confirmar contraseña">
              <input
                type="password"
                value={passwords.confirmar}
                onChange={(e) =>
                  setPasswords((p) => ({ ...p, confirmar: e.target.value }))
                }
                placeholder="Repite la contraseña"
                required
                className={inputClass}
              />
            </Field>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={loadingPassword}
              className="px-5 h-10 rounded-lg bg-zinc-900 hover:bg-zinc-700 disabled:opacity-50 text-white text-sm font-medium transition-colors flex items-center gap-2"
            >
              {loadingPassword ? (
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                "Cambiar contraseña"
              )}
            </button>
          </div>
        </form>
      </Section>

      {/* Plan de suscripción */}
      <Section
        icon={CreditCard}
        title="Plan de suscripción"
        subtitle="Tu plan actual y opciones disponibles"
      >
        <div className="space-y-3">
          {Object.entries(PLANES).map(([key, plan]) => {
            const isActual = key === planActual;
            return (
              <div
                key={key}
                className={`flex items-start justify-between p-4 rounded-xl border transition-all ${
                  isActual
                    ? "border-emerald-300 bg-emerald-50"
                    : "border-zinc-100 bg-white hover:border-zinc-200"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`mt-0.5 text-xs font-semibold px-2.5 py-1 rounded-full ${plan.color}`}
                  >
                    {plan.label}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-zinc-800">
                      {plan.precio}
                    </p>
                    <ul className="mt-1.5 space-y-0.5">
                      {plan.features.map((f) => (
                        <li
                          key={f}
                          className="flex items-center gap-1.5 text-xs text-zinc-500"
                        >
                          <Check className="w-3 h-3 text-emerald-500 shrink-0" />
                          {f}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {isActual ? (
                  <span className="text-xs font-medium text-emerald-600 bg-emerald-100 px-2.5 py-1 rounded-full shrink-0">
                    Plan actual
                  </span>
                ) : (
                  <button className="text-xs font-medium text-zinc-600 border border-zinc-200 hover:border-emerald-300 hover:text-emerald-600 px-3 py-1.5 rounded-lg transition-colors shrink-0">
                    Cambiar
                  </button>
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-4 p-3 bg-zinc-50 rounded-lg">
          <p className="text-xs text-zinc-400">
            Para cambiar de plan o gestionar tu facturación contacta a{" "}
            <a
              href="mailto:soporte@nutriva.mx"
              className="text-emerald-600 hover:underline"
            >
              soporte@nutriva.mx
            </a>
          </p>
        </div>
      </Section>
    </div>
  );
}

function Section({
  icon: Icon,
  title,
  subtitle,
  children,
}: {
  icon: any;
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-xl border border-zinc-100 overflow-hidden">
      <div className="flex items-center gap-3 px-5 py-4 border-b border-zinc-50">
        <div className="w-8 h-8 rounded-lg bg-zinc-100 flex items-center justify-center">
          <Icon className="w-4 h-4 text-zinc-500" />
        </div>
        <div>
          <p className="text-sm font-semibold text-zinc-800">{title}</p>
          <p className="text-xs text-zinc-400">{subtitle}</p>
        </div>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium text-zinc-500 uppercase tracking-wide">
        {label}
      </Label>
      {children}
    </div>
  );
}
