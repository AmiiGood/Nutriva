"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Plus, Sparkles, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function PlantillasClient({
  plantillas,
}: {
  plantillas: any[];
}) {
  const router = useRouter();
  const [lista, setLista] = useState(plantillas);

  async function eliminar(id: string) {
    if (!confirm("¿Eliminar esta plantilla?")) return;
    const supabase = createClient();
    await supabase.from("plan_plantillas").delete().eq("id", id);
    setLista((prev) => prev.filter((p) => p.id !== id));
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Plantillas</h1>
          <p className="text-sm text-zinc-400 mt-0.5">
            Planes reutilizables para asignar a pacientes
          </p>
        </div>
        <Link
          href="/planes/plantillas/nueva"
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-sm font-medium text-white transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nueva plantilla
        </Link>
      </div>

      {lista.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Sparkles className="w-10 h-10 text-zinc-200 mb-3" />
          <p className="text-sm font-medium text-zinc-400">
            Sin plantillas aún
          </p>
          <p className="text-xs text-zinc-300 mt-1">
            Crea tu primera plantilla reutilizable
          </p>
          <Link
            href="/planes/plantillas/nueva"
            className="mt-4 text-xs text-emerald-600 font-medium hover:underline"
          >
            + Nueva plantilla
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {lista.map((p, i) => (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className="bg-white rounded-xl border border-zinc-100 p-5 hover:border-emerald-200 hover:shadow-sm transition-all group relative"
            >
              <button
                onClick={() => eliminar(p.id)}
                className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 text-zinc-300 hover:text-red-400 transition-all"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>

              <div className="w-9 h-9 rounded-lg bg-violet-50 flex items-center justify-center mb-3">
                <Sparkles className="w-4 h-4 text-violet-500" />
              </div>

              <h3 className="text-sm font-semibold text-zinc-900 mb-1">
                {p.nombre}
              </h3>
              {p.descripcion && (
                <p className="text-xs text-zinc-400 mb-3">{p.descripcion}</p>
              )}

              <p className="text-xs text-zinc-400 mb-4">
                {p.plantilla_comidas?.length ?? 0} comidas
              </p>

              <div className="flex gap-2">
                <Link
                  href={`/planes/plantillas/${p.id}`}
                  className="flex-1 text-center py-1.5 rounded-lg border border-zinc-200 text-xs font-medium text-zinc-600 hover:bg-zinc-50 transition-colors"
                >
                  Editar
                </Link>
                <Link
                  href={`/planes/nuevo?plantilla=${p.id}`}
                  className="flex-1 text-center py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-xs font-medium text-white transition-colors"
                >
                  Usar plantilla
                </Link>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
