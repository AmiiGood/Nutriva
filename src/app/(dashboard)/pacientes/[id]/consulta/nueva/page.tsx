"use client";

import { useState, use } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { ArrowLeft, ClipboardList } from "lucide-react";
import { Label } from "@/components/ui/label";

const inputClass =
  "w-full h-10 px-3.5 rounded-lg border border-zinc-200 bg-zinc-50 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20 transition";

export default function NuevaConsultaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    fecha: new Date().toISOString().split("T")[0],
    peso_kg: "",
    talla_cm: "",
    grasa_corporal_pct: "",
    masa_muscular_kg: "",
    cintura_cm: "",
    cadera_cm: "",
    brazo_cm: "",
    muslo_cm: "",
    notas: "",
  });

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError("");
  }

  // IMC preview en tiempo real
  const imc =
    form.peso_kg && form.talla_cm
      ? (
          Number(form.peso_kg) / Math.pow(Number(form.talla_cm) / 100, 2)
        ).toFixed(2)
      : null;

  const imcLabel = imc
    ? Number(imc) < 18.5
      ? "Bajo peso"
      : Number(imc) < 25
        ? "Normal"
        : Number(imc) < 30
          ? "Sobrepeso"
          : "Obesidad"
    : null;

  const imcColor = imc
    ? Number(imc) < 18.5
      ? "text-blue-500"
      : Number(imc) < 25
        ? "text-emerald-500"
        : Number(imc) < 30
          ? "text-orange-400"
          : "text-red-500"
    : "";

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

    const { error } = await supabase.from("consultas").insert({
      paciente_id: id,
      nutriologo_id: user.id,
      fecha: form.fecha,
      peso_kg: form.peso_kg ? Number(form.peso_kg) : null,
      talla_cm: form.talla_cm ? Number(form.talla_cm) : null,
      grasa_corporal_pct: form.grasa_corporal_pct
        ? Number(form.grasa_corporal_pct)
        : null,
      masa_muscular_kg: form.masa_muscular_kg
        ? Number(form.masa_muscular_kg)
        : null,
      cintura_cm: form.cintura_cm ? Number(form.cintura_cm) : null,
      cadera_cm: form.cadera_cm ? Number(form.cadera_cm) : null,
      brazo_cm: form.brazo_cm ? Number(form.brazo_cm) : null,
      muslo_cm: form.muslo_cm ? Number(form.muslo_cm) : null,
      notas: form.notas || null,
    });

    if (error) {
      setError("Error al guardar la consulta");
      setLoading(false);
      return;
    }

    router.push(`/pacientes/${id}`);
  }

  return (
    <div className="max-w-2xl mx-auto">
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-sm text-zinc-400 hover:text-zinc-700 transition-colors mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Volver al paciente
      </button>

      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
          <ClipboardList className="w-5 h-5 text-emerald-600" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-zinc-900">Nueva consulta</h1>
          <p className="text-sm text-zinc-400">
            Registra las mediciones de la consulta
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Fecha */}
          <Section title="Fecha de consulta">
            <div className="max-w-xs">
              <Field label="Fecha *">
                <input
                  name="fecha"
                  type="date"
                  value={form.fecha}
                  onChange={handleChange}
                  required
                  className={inputClass}
                />
              </Field>
            </div>
          </Section>

          {/* Peso y talla */}
          <Section title="Peso y talla">
            <div className="grid grid-cols-2 gap-4">
              <Field label="Peso (kg)">
                <input
                  name="peso_kg"
                  type="number"
                  step="0.1"
                  min="0"
                  value={form.peso_kg}
                  onChange={handleChange}
                  placeholder="70.5"
                  className={inputClass}
                />
              </Field>
              <Field label="Talla (cm)">
                <input
                  name="talla_cm"
                  type="number"
                  step="0.1"
                  min="0"
                  value={form.talla_cm}
                  onChange={handleChange}
                  placeholder="165"
                  className={inputClass}
                />
              </Field>
            </div>

            {/* IMC en tiempo real */}
            {imc && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-3 bg-zinc-50 border border-zinc-100 rounded-lg px-4 py-3"
              >
                <div>
                  <p className="text-xs text-zinc-400 uppercase tracking-wide font-medium">
                    IMC calculado
                  </p>
                  <p className={`text-xl font-bold ${imcColor}`}>
                    {imc}{" "}
                    <span className="text-sm font-medium">{imcLabel}</span>
                  </p>
                </div>
              </motion.div>
            )}
          </Section>

          {/* Composición corporal */}
          <Section title="Composición corporal">
            <div className="grid grid-cols-2 gap-4">
              <Field label="Grasa corporal (%)">
                <input
                  name="grasa_corporal_pct"
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  value={form.grasa_corporal_pct}
                  onChange={handleChange}
                  placeholder="25.0"
                  className={inputClass}
                />
              </Field>
              <Field label="Masa muscular (kg)">
                <input
                  name="masa_muscular_kg"
                  type="number"
                  step="0.1"
                  min="0"
                  value={form.masa_muscular_kg}
                  onChange={handleChange}
                  placeholder="42.0"
                  className={inputClass}
                />
              </Field>
            </div>
          </Section>

          {/* Medidas */}
          <Section title="Medidas (cm)">
            <div className="grid grid-cols-2 gap-4">
              <Field label="Cintura">
                <input
                  name="cintura_cm"
                  type="number"
                  step="0.1"
                  min="0"
                  value={form.cintura_cm}
                  onChange={handleChange}
                  placeholder="80"
                  className={inputClass}
                />
              </Field>
              <Field label="Cadera">
                <input
                  name="cadera_cm"
                  type="number"
                  step="0.1"
                  min="0"
                  value={form.cadera_cm}
                  onChange={handleChange}
                  placeholder="98"
                  className={inputClass}
                />
              </Field>
              <Field label="Brazo">
                <input
                  name="brazo_cm"
                  type="number"
                  step="0.1"
                  min="0"
                  value={form.brazo_cm}
                  onChange={handleChange}
                  placeholder="30"
                  className={inputClass}
                />
              </Field>
              <Field label="Muslo">
                <input
                  name="muslo_cm"
                  type="number"
                  step="0.1"
                  min="0"
                  value={form.muslo_cm}
                  onChange={handleChange}
                  placeholder="55"
                  className={inputClass}
                />
              </Field>
            </div>
          </Section>

          {/* Notas */}
          <Section title="Notas">
            <textarea
              name="notas"
              value={form.notas}
              onChange={handleChange}
              placeholder="Observaciones, avances, recomendaciones..."
              rows={3}
              className="w-full px-3.5 py-2.5 rounded-lg border border-zinc-200 bg-zinc-50 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20 transition resize-none"
            />
          </Section>

          {error && (
            <p className="text-sm text-red-500 bg-red-50 border border-red-100 px-3 py-2 rounded-lg">
              {error}
            </p>
          )}

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
              className="flex-1 h-11 rounded-lg bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white text-sm font-medium transition-colors flex items-center justify-center"
            >
              {loading ? (
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                "Guardar consulta"
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
