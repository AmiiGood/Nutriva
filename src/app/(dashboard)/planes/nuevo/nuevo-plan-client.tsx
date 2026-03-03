"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { ArrowLeft, UtensilsCrossed, Sparkles, PenLine } from "lucide-react";
import { Label } from "@/components/ui/label";

const inputClass =
  "w-full h-10 px-3.5 rounded-lg border border-zinc-200 bg-zinc-50 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20 transition";
const selectClass =
  "w-full h-10 px-3.5 rounded-lg border border-zinc-200 bg-zinc-50 text-sm text-zinc-700 focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20 transition appearance-none cursor-pointer";

type Origen = "cero" | "plantilla";

export default function NuevoPlanClient({
  pacientes,
  plantillas,
}: {
  pacientes: any[];
  plantillas: any[];
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [origen, setOrigen] = useState<Origen>("cero");
  const [form, setForm] = useState({
    paciente_id: "",
    nombre: "",
    fecha_inicio: new Date().toISOString().split("T")[0],
    fecha_fin: "",
    calorias_objetivo: "",
    proteinas_g: "",
    carbohidratos_g: "",
    grasas_g: "",
    plantilla_id: "",
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

  function handlePlantillaChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const plantillaId = e.target.value;
    const plantilla = plantillas.find((p) => p.id === plantillaId);

    setForm((prev) => ({
      ...prev,
      plantilla_id: plantillaId,
      nombre: plantilla ? plantilla.nombre : prev.nombre,
      calorias_objetivo: plantilla?.calorias_objetivo ?? prev.calorias_objetivo,
      proteinas_g: plantilla?.proteinas_g ?? prev.proteinas_g,
      carbohidratos_g: plantilla?.carbohidratos_g ?? prev.carbohidratos_g,
      grasas_g: plantilla?.grasas_g ?? prev.grasas_g,
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.paciente_id) {
      setError("Selecciona un paciente");
      return;
    }
    if (!form.nombre) {
      setError("Escribe un nombre para el plan");
      return;
    }

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

    const payload = {
      nutriologo_id: user.id,
      paciente_id: form.paciente_id,
      nombre: form.nombre,
      fecha_inicio: form.fecha_inicio,
      fecha_fin: form.fecha_fin || null,
      calorias_objetivo: form.calorias_objetivo
        ? Number(form.calorias_objetivo)
        : null,
      proteinas_g: form.proteinas_g ? Number(form.proteinas_g) : null,
      carbohidratos_g: form.carbohidratos_g
        ? Number(form.carbohidratos_g)
        : null,
      grasas_g: form.grasas_g ? Number(form.grasas_g) : null,
      notas: form.notas || null,
      activo: true,
    };

    // Si es desde plantilla, usar la función de BD
    if (origen === "plantilla" && form.plantilla_id) {
      const { data, error } = await supabase.rpc("crear_plan_desde_plantilla", {
        p_plantilla_id: form.plantilla_id,
        p_paciente_id: form.paciente_id,
        p_nutriologo_id: user.id,
        p_nombre: form.nombre,
        p_fecha_inicio: form.fecha_inicio,
        p_fecha_fin: form.fecha_fin || null,
      });

      if (error) {
        setError("Error al crear el plan desde plantilla");
        setLoading(false);
        return;
      }
      router.push(`/planes/${data}`);
      return;
    }

    // Desde cero
    const { data, error } = await supabase
      .from("planes")
      .insert(payload)
      .select()
      .single();

    if (error) {
      setError("Error al crear el plan");
      setLoading(false);
      return;
    }
    router.push(`/planes/${data.id}`);
  }

  // Preview de macros
  const totalCalorias =
    form.proteinas_g || form.carbohidratos_g || form.grasas_g
      ? Number(form.proteinas_g) * 4 +
        Number(form.carbohidratos_g) * 4 +
        Number(form.grasas_g) * 9
      : null;

  return (
    <div className="max-w-2xl mx-auto">
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-sm text-zinc-400 hover:text-zinc-700 transition-colors mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Volver
      </button>

      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
          <UtensilsCrossed className="w-5 h-5 text-emerald-600" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-zinc-900">
            Nuevo plan alimenticio
          </h1>
          <p className="text-sm text-zinc-400">
            Configura el plan y luego agrega las comidas
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Origen */}
          <div className="grid grid-cols-2 gap-3">
            {(
              [
                {
                  key: "cero",
                  icon: PenLine,
                  label: "Desde cero",
                  sub: "Arma el plan manualmente",
                },
                {
                  key: "plantilla",
                  icon: Sparkles,
                  label: "Desde plantilla",
                  sub: "Usa una plantilla existente",
                },
              ] as const
            ).map((opt) => (
              <button
                key={opt.key}
                type="button"
                onClick={() => setOrigen(opt.key)}
                className={`flex items-center gap-3 p-4 rounded-xl border text-left transition-all ${
                  origen === opt.key
                    ? "border-emerald-400 bg-emerald-50"
                    : "border-zinc-200 bg-white hover:border-zinc-300"
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                    origen === opt.key ? "bg-emerald-100" : "bg-zinc-100"
                  }`}
                >
                  <opt.icon
                    className={`w-4 h-4 ${origen === opt.key ? "text-emerald-600" : "text-zinc-400"}`}
                  />
                </div>
                <div>
                  <p
                    className={`text-sm font-medium ${origen === opt.key ? "text-emerald-700" : "text-zinc-700"}`}
                  >
                    {opt.label}
                  </p>
                  <p className="text-xs text-zinc-400">{opt.sub}</p>
                </div>
              </button>
            ))}
          </div>

          {/* Plantilla selector */}
          <AnimatePresence>
            {origen === "plantilla" && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <Section title="Plantilla">
                  {plantillas.length === 0 ? (
                    <div className="text-center py-4">
                      <p className="text-sm text-zinc-400">
                        No tienes plantillas creadas aún
                      </p>
                      <button
                        type="button"
                        onClick={() => setOrigen("cero")}
                        className="text-xs text-emerald-600 mt-1 hover:underline"
                      >
                        Crear desde cero
                      </button>
                    </div>
                  ) : (
                    <Field label="Selecciona una plantilla">
                      <select
                        name="plantilla_id"
                        value={form.plantilla_id}
                        onChange={handlePlantillaChange}
                        className={selectClass}
                      >
                        <option value="">Seleccionar plantilla</option>
                        {plantillas.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.nombre}
                          </option>
                        ))}
                      </select>
                    </Field>
                  )}
                </Section>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Paciente y nombre */}
          <Section title="Información del plan">
            <Field label="Paciente *">
              <select
                name="paciente_id"
                value={form.paciente_id}
                onChange={handleChange}
                className={selectClass}
              >
                <option value="">Seleccionar paciente</option>
                {pacientes.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nombre} {p.apellidos}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Nombre del plan *">
              <input
                name="nombre"
                value={form.nombre}
                onChange={handleChange}
                placeholder="Ej: Plan hipocalórico semana 1"
                className={inputClass}
              />
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Fecha inicio *">
                <input
                  name="fecha_inicio"
                  type="date"
                  value={form.fecha_inicio}
                  onChange={handleChange}
                  required
                  className={inputClass}
                />
              </Field>
              <Field label="Fecha fin">
                <input
                  name="fecha_fin"
                  type="date"
                  value={form.fecha_fin}
                  onChange={handleChange}
                  className={inputClass}
                />
              </Field>
            </div>
          </Section>

          {/* Macros objetivo */}
          <Section title="Macros objetivo (opcional)">
            <div className="grid grid-cols-2 gap-4">
              <Field label="Calorías (kcal)">
                <input
                  name="calorias_objetivo"
                  type="number"
                  min="0"
                  value={form.calorias_objetivo}
                  onChange={handleChange}
                  placeholder="2000"
                  className={inputClass}
                />
              </Field>
              <Field label="Proteínas (g)">
                <input
                  name="proteinas_g"
                  type="number"
                  min="0"
                  value={form.proteinas_g}
                  onChange={handleChange}
                  placeholder="150"
                  className={inputClass}
                />
              </Field>
              <Field label="Carbohidratos (g)">
                <input
                  name="carbohidratos_g"
                  type="number"
                  min="0"
                  value={form.carbohidratos_g}
                  onChange={handleChange}
                  placeholder="200"
                  className={inputClass}
                />
              </Field>
              <Field label="Grasas (g)">
                <input
                  name="grasas_g"
                  type="number"
                  min="0"
                  value={form.grasas_g}
                  onChange={handleChange}
                  placeholder="65"
                  className={inputClass}
                />
              </Field>
            </div>

            {totalCalorias !== null && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center justify-between bg-zinc-50 border border-zinc-100 rounded-lg px-4 py-3"
              >
                <p className="text-xs text-zinc-400">
                  Calorías calculadas desde macros
                </p>
                <p className="text-sm font-bold text-zinc-700">
                  {totalCalorias} kcal
                </p>
              </motion.div>
            )}
          </Section>

          {/* Notas */}
          <Section title="Notas">
            <textarea
              name="notas"
              value={form.notas}
              onChange={handleChange}
              placeholder="Instrucciones, restricciones, observaciones..."
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
                "Crear plan y agregar comidas →"
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
