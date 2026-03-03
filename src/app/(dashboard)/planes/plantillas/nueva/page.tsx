"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { ArrowLeft, Sparkles } from "lucide-react";
import { Label } from "@/components/ui/label";

const inputClass =
  "w-full h-10 px-3.5 rounded-lg border border-zinc-200 bg-zinc-50 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20 transition";

export default function NuevaPlantillaPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    nombre: "",
    descripcion: "",
    calorias_objetivo: "",
    proteinas_g: "",
    carbohidratos_g: "",
    grasas_g: "",
  });

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.nombre) {
      setError("Escribe un nombre para la plantilla");
      return;
    }
    setLoading(true);

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      router.push("/login");
      return;
    }

    const { data, error } = await supabase
      .from("plan_plantillas")
      .insert({
        nutriologo_id: user.id,
        nombre: form.nombre,
        descripcion: form.descripcion || null,
        calorias_objetivo: form.calorias_objetivo
          ? Number(form.calorias_objetivo)
          : null,
        proteinas_g: form.proteinas_g ? Number(form.proteinas_g) : null,
        carbohidratos_g: form.carbohidratos_g
          ? Number(form.carbohidratos_g)
          : null,
        grasas_g: form.grasas_g ? Number(form.grasas_g) : null,
      })
      .select()
      .single();

    if (error) {
      setError("Error al crear la plantilla");
      setLoading(false);
      return;
    }
    router.push(`/planes/plantillas/${data.id}`);
  }

  return (
    <div className="max-w-2xl mx-auto">
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-sm text-zinc-400 hover:text-zinc-700 transition-colors mb-6"
      >
        <ArrowLeft className="w-4 h-4" /> Volver
      </button>

      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-xl bg-violet-50 flex items-center justify-center">
          <Sparkles className="w-5 h-5 text-violet-500" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-zinc-900">Nueva plantilla</h1>
          <p className="text-sm text-zinc-400">
            Crea un plan reutilizable para tus pacientes
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <div className="bg-white rounded-xl border border-zinc-100 p-5 space-y-4">
            <h2 className="text-sm font-semibold text-zinc-700">Información</h2>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-zinc-500 uppercase tracking-wide">
                Nombre *
              </Label>
              <input
                name="nombre"
                value={form.nombre}
                onChange={handleChange}
                placeholder="Ej: Plan hipocalórico 1500 kcal"
                className={inputClass}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-zinc-500 uppercase tracking-wide">
                Descripción
              </Label>
              <textarea
                name="descripcion"
                value={form.descripcion}
                onChange={handleChange}
                placeholder="Para quién es ideal, observaciones..."
                rows={2}
                className="w-full px-3.5 py-2.5 rounded-lg border border-zinc-200 bg-zinc-50 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20 transition resize-none"
              />
            </div>
          </div>

          <div className="bg-white rounded-xl border border-zinc-100 p-5 space-y-4">
            <h2 className="text-sm font-semibold text-zinc-700">
              Macros objetivo (opcional)
            </h2>
            <div className="grid grid-cols-2 gap-4">
              {[
                {
                  name: "calorias_objetivo",
                  label: "Calorías (kcal)",
                  placeholder: "1500",
                },
                {
                  name: "proteinas_g",
                  label: "Proteínas (g)",
                  placeholder: "120",
                },
                {
                  name: "carbohidratos_g",
                  label: "Carbohidratos (g)",
                  placeholder: "150",
                },
                { name: "grasas_g", label: "Grasas (g)", placeholder: "50" },
              ].map((f) => (
                <div key={f.name} className="space-y-1.5">
                  <Label className="text-xs font-medium text-zinc-500 uppercase tracking-wide">
                    {f.label}
                  </Label>
                  <input
                    name={f.name}
                    type="number"
                    min="0"
                    value={(form as any)[f.name]}
                    onChange={handleChange}
                    placeholder={f.placeholder}
                    className={inputClass}
                  />
                </div>
              ))}
            </div>
          </div>

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
                "Crear y agregar comidas →"
              )}
            </button>
          </div>
        </motion.div>
      </form>
    </div>
  );
}
