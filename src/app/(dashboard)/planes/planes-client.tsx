"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Plus, Search, UtensilsCrossed, Calendar } from "lucide-react";

export default function PlanesClient({ planes }: { planes: any[] }) {
  const [search, setSearch] = useState("");
  const [filtroEstado, setFiltroEstado] = useState<
    "todos" | "activo" | "inactivo"
  >("todos");

  const filtrados = useMemo(() => {
    return planes.filter((p) => {
      const nombre = p.nombre?.toLowerCase() ?? "";
      const paciente =
        `${p.pacientes?.nombre} ${p.pacientes?.apellidos}`.toLowerCase();
      const matchSearch =
        nombre.includes(search.toLowerCase()) ||
        paciente.includes(search.toLowerCase());
      const matchEstado =
        filtroEstado === "todos" ||
        (filtroEstado === "activo" ? p.activo : !p.activo);
      return matchSearch && matchEstado;
    });
  }, [planes, search, filtroEstado]);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">
            Planes alimenticios
          </h1>
          <p className="text-sm text-zinc-400 mt-0.5">
            {planes.length} planes registrados
          </p>
        </div>
        <Link
          href="/planes/nuevo"
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-sm font-medium text-white transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nuevo plan
        </Link>
      </div>

      {/* Filtros */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
          <input
            type="text"
            placeholder="Buscar por nombre o paciente..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-9 pl-9 pr-3 rounded-lg border border-zinc-200 bg-white text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20 transition"
          />
        </div>
        <div className="flex rounded-lg border border-zinc-200 overflow-hidden text-sm">
          {(["todos", "activo", "inactivo"] as const).map((est) => (
            <button
              key={est}
              onClick={() => setFiltroEstado(est)}
              className={`px-3 h-9 font-medium capitalize transition-colors ${
                filtroEstado === est
                  ? "bg-emerald-500 text-white"
                  : "bg-white text-zinc-500 hover:bg-zinc-50"
              }`}
            >
              {est}
            </button>
          ))}
        </div>
      </div>

      {/* Grid de planes */}
      {filtrados.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <UtensilsCrossed className="w-10 h-10 text-zinc-200 mb-3" />
          <p className="text-sm font-medium text-zinc-400">Sin planes aún</p>
          <p className="text-xs text-zinc-300 mt-1">
            Crea el primer plan alimenticio
          </p>
          <Link
            href="/planes/nuevo"
            className="mt-4 text-xs text-emerald-600 font-medium hover:underline"
          >
            + Nuevo plan
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtrados.map((plan, i) => (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
            >
              <Link
                href={`/planes/${plan.id}`}
                className="block bg-white rounded-xl border border-zinc-100 p-5 hover:border-emerald-200 hover:shadow-sm transition-all group"
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="w-9 h-9 rounded-lg bg-emerald-50 flex items-center justify-center">
                    <UtensilsCrossed className="w-4 h-4 text-emerald-600" />
                  </div>
                  <span
                    className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                      plan.activo
                        ? "bg-emerald-50 text-emerald-600"
                        : "bg-zinc-100 text-zinc-500"
                    }`}
                  >
                    {plan.activo ? "Activo" : "Inactivo"}
                  </span>
                </div>

                {/* Nombre */}
                <h3 className="text-sm font-semibold text-zinc-900 mb-1 group-hover:text-emerald-700 transition-colors">
                  {plan.nombre}
                </h3>

                {/* Paciente */}
                <p className="text-xs text-zinc-400 mb-4">
                  {plan.pacientes?.nombre} {plan.pacientes?.apellidos}
                </p>

                {/* Macros */}
                {plan.calorias_objetivo && (
                  <div className="grid grid-cols-4 gap-2 mb-4">
                    {[
                      {
                        label: "kcal",
                        value: plan.calorias_objetivo,
                        color: "text-orange-500",
                      },
                      {
                        label: "prot",
                        value: plan.proteinas_g ? `${plan.proteinas_g}g` : "—",
                        color: "text-blue-500",
                      },
                      {
                        label: "carbs",
                        value: plan.carbohidratos_g
                          ? `${plan.carbohidratos_g}g`
                          : "—",
                        color: "text-yellow-500",
                      },
                      {
                        label: "grasas",
                        value: plan.grasas_g ? `${plan.grasas_g}g` : "—",
                        color: "text-emerald-500",
                      },
                    ].map((m) => (
                      <div key={m.label} className="text-center">
                        <p className={`text-xs font-bold ${m.color}`}>
                          {m.value}
                        </p>
                        <p className="text-[10px] text-zinc-400">{m.label}</p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Fechas */}
                <div className="flex items-center gap-1.5 text-xs text-zinc-400">
                  <Calendar className="w-3 h-3" />
                  <span>
                    {new Date(plan.fecha_inicio).toLocaleDateString("es-MX", {
                      day: "numeric",
                      month: "short",
                    })}
                    {plan.fecha_fin &&
                      ` → ${new Date(plan.fecha_fin).toLocaleDateString("es-MX", { day: "numeric", month: "short" })}`}
                  </span>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
