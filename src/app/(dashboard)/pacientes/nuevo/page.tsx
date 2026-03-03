"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { ArrowLeft, UserPlus } from "lucide-react";
import { Label } from "@/components/ui/label";

const OBJETIVOS = [
  { value: "bajar_peso", label: "Bajar peso" },
  { value: "subir_peso", label: "Subir peso" },
  { value: "mantener", label: "Mantener peso" },
  { value: "masa_muscular", label: "Masa muscular" },
  { value: "salud", label: "Salud general" },
];

const inputClass =
  "w-full h-10 px-3.5 rounded-lg border border-zinc-200 bg-zinc-50 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20 transition";
const selectClass =
  "w-full h-10 px-3.5 rounded-lg border border-zinc-200 bg-zinc-50 text-sm text-zinc-700 focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20 transition appearance-none cursor-pointer";

export default function NuevoPacientePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    nombre: "",
    apellidos: "",
    email: "",
    telefono: "",
    fecha_nacimiento: "",
    genero: "",
    objetivo: "",
    notas: "",
  });

  function handleChange(
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      router.push("/login");
      return;
    }

    const { data, error } = await supabase
      .from("pacientes")
      .insert({
        nutriologo_id: user.id,
        nombre: form.nombre,
        apellidos: form.apellidos,
        email: form.email || null,
        telefono: form.telefono || null,
        fecha_nacimiento: form.fecha_nacimiento || null,
        genero: form.genero || null,
        objetivo: form.objetivo || null,
        notas: form.notas || null,
      })
      .select()
      .single();

    if (error) {
      setError("Error al guardar el paciente");
      setLoading(false);
      return;
    }

    router.push(`/pacientes/${data.id}`);
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-sm text-zinc-400 hover:text-zinc-700 transition-colors mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Volver
      </button>

      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
          <UserPlus className="w-5 h-5 text-emerald-600" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-zinc-900">Nuevo paciente</h1>
          <p className="text-sm text-zinc-400">
            Completa los datos para registrar al paciente
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Datos personales */}
          <Section title="Datos personales">
            <div className="grid grid-cols-2 gap-4">
              <Field label="Nombre *">
                <input
                  name="nombre"
                  value={form.nombre}
                  onChange={handleChange}
                  required
                  placeholder="Ana"
                  className={inputClass}
                />
              </Field>
              <Field label="Apellidos *">
                <input
                  name="apellidos"
                  value={form.apellidos}
                  onChange={handleChange}
                  required
                  placeholder="García Ruiz"
                  className={inputClass}
                />
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Fecha de nacimiento">
                <input
                  name="fecha_nacimiento"
                  type="date"
                  value={form.fecha_nacimiento}
                  onChange={handleChange}
                  className={inputClass}
                />
              </Field>
              <Field label="Género">
                <select
                  name="genero"
                  value={form.genero}
                  onChange={handleChange}
                  className={selectClass}
                >
                  <option value="">Seleccionar</option>
                  <option value="femenino">Femenino</option>
                  <option value="masculino">Masculino</option>
                  <option value="otro">Otro</option>
                </select>
              </Field>
            </div>
          </Section>

          {/* Contacto */}
          <Section title="Contacto">
            <div className="grid grid-cols-2 gap-4">
              <Field label="Correo electrónico">
                <input
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="ana@correo.com"
                  className={inputClass}
                />
              </Field>
              <Field label="Teléfono">
                <input
                  name="telefono"
                  value={form.telefono}
                  onChange={handleChange}
                  placeholder="55 1234 5678"
                  className={inputClass}
                />
              </Field>
            </div>
          </Section>

          {/* Objetivo */}
          <Section title="Objetivo nutricional">
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-5">
              {OBJETIVOS.map((obj) => (
                <button
                  key={obj.value}
                  type="button"
                  onClick={() =>
                    setForm((prev) => ({ ...prev, objetivo: obj.value }))
                  }
                  className={`px-3 py-2.5 rounded-lg border text-xs font-medium transition-all text-center ${
                    form.objetivo === obj.value
                      ? "border-emerald-400 bg-emerald-50 text-emerald-700"
                      : "border-zinc-200 bg-white text-zinc-500 hover:border-zinc-300 hover:text-zinc-700"
                  }`}
                >
                  {obj.label}
                </button>
              ))}
            </div>
          </Section>

          {/* Notas */}
          <Section title="Notas">
            <textarea
              name="notas"
              value={form.notas}
              onChange={handleChange}
              placeholder="Alergias, condiciones médicas, observaciones..."
              rows={3}
              className="w-full px-3.5 py-2.5 rounded-lg border border-zinc-200 bg-zinc-50 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20 transition resize-none"
            />
          </Section>

          {error && (
            <p className="text-sm text-red-500 bg-red-50 border border-red-100 px-3 py-2 rounded-lg">
              {error}
            </p>
          )}

          {/* Acciones */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => router.back()}
              className="flex-1 h-11 rounded-lg border border-zinc-200 text-sm font-medium text-zinc-600 hover:bg-zinc-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 h-11 rounded-lg bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white text-sm font-medium transition-colors flex items-center justify-center gap-2"
            >
              {loading ? (
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                "Guardar paciente"
              )}
            </button>
          </div>
        </motion.div>
      </form>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-xl border border-zinc-100 p-5 space-y-4">
      <h2 className="text-sm font-semibold text-zinc-700">{title}</h2>
      {children}
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
