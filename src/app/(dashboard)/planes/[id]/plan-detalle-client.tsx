"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import {
  ArrowLeft,
  Plus,
  Trash2,
  Search,
  X,
  ChevronDown,
  ChevronUp,
  Printer,
  UtensilsCrossed,
} from "lucide-react";
import Link from "next/link";

const TIPOS_COMIDA = [
  "Desayuno",
  "Colación matutina",
  "Comida",
  "Colación vespertina",
  "Cena",
  "Merienda",
];

function calcularMacrosItem(alimento: any, cantidad: number) {
  const factor = cantidad / 100;
  return {
    calorias: Math.round((alimento.calorias_por_100g ?? 0) * factor),
    proteinas: +((alimento.proteinas_por_100g ?? 0) * factor).toFixed(1),
    carbohidratos: +((alimento.carbohidratos_por_100g ?? 0) * factor).toFixed(
      1,
    ),
    grasas: +((alimento.grasas_por_100g ?? 0) * factor).toFixed(1),
  };
}

function calcularTotalesComida(items: any[]) {
  return items.reduce(
    (acc, item) => {
      const macros = calcularMacrosItem(item.alimentos, item.cantidad_g);
      return {
        calorias: acc.calorias + macros.calorias,
        proteinas: +(acc.proteinas + macros.proteinas).toFixed(1),
        carbohidratos: +(acc.carbohidratos + macros.carbohidratos).toFixed(1),
        grasas: +(acc.grasas + macros.grasas).toFixed(1),
      };
    },
    { calorias: 0, proteinas: 0, carbohidratos: 0, grasas: 0 },
  );
}

export default function PlanDetalleClient({
  plan,
  comidasIniciales,
}: {
  plan: any;
  comidasIniciales: any[];
}) {
  const router = useRouter();
  const [comidas, setComidas] = useState(comidasIniciales);
  const [expandidas, setExpandidas] = useState<Record<string, boolean>>(
    Object.fromEntries(comidasIniciales.map((c) => [c.id, true])),
  );
  const [buscador, setBuscador] = useState<{ comidaId: string } | null>(null);
  const [busqueda, setBusqueda] = useState("");
  const [resultados, setResultados] = useState<any[]>([]);
  const [buscando, setBuscando] = useState(false);
  const [loadingComida, setLoadingComida] = useState(false);

  // Totales del plan
  const totalesGlobales = comidas.reduce(
    (acc, comida) => {
      const t = calcularTotalesComida(comida.comida_items ?? []);
      return {
        calorias: acc.calorias + t.calorias,
        proteinas: +(acc.proteinas + t.proteinas).toFixed(1),
        carbohidratos: +(acc.carbohidratos + t.carbohidratos).toFixed(1),
        grasas: +(acc.grasas + t.grasas).toFixed(1),
      };
    },
    { calorias: 0, proteinas: 0, carbohidratos: 0, grasas: 0 },
  );

  // Agregar comida
  async function agregarComida(tipo: string) {
    setLoadingComida(true);
    const supabase = createClient();
    const orden = comidas.length + 1;
    const { data, error } = await supabase
      .from("plan_comidas")
      .insert({ plan_id: plan.id, nombre: tipo, orden })
      .select()
      .single();

    if (!error && data) {
      setComidas((prev) => [...prev, { ...data, comida_items: [] }]);
      setExpandidas((prev) => ({ ...prev, [data.id]: true }));
    }
    setLoadingComida(false);
  }

  // Eliminar comida
  async function eliminarComida(comidaId: string) {
    const supabase = createClient();
    await supabase.from("plan_comidas").delete().eq("id", comidaId);
    setComidas((prev) => prev.filter((c) => c.id !== comidaId));
  }

  // Buscar alimentos
  const buscarAlimentos = useCallback(async (query: string) => {
    if (!query.trim()) {
      setResultados([]);
      return;
    }
    setBuscando(true);
    const supabase = createClient();
    const { data } = await supabase
      .from("alimentos")
      .select(
        "id, nombre, calorias_por_100g, proteinas_por_100g, carbohidratos_por_100g, grasas_por_100g",
      )
      .ilike("nombre", `%${query}%`)
      .limit(10);
    setResultados(data ?? []);
    setBuscando(false);
  }, []);

  // Agregar alimento a comida
  async function agregarAlimento(
    comidaId: string,
    alimento: any,
    cantidad: number = 100,
  ) {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("comida_items")
      .insert({
        comida_id: comidaId,
        alimento_id: alimento.id,
        cantidad_g: cantidad,
      })
      .select(
        "*, alimentos(nombre, calorias_por_100g, proteinas_por_100g, carbohidratos_por_100g, grasas_por_100g)",
      )
      .single();

    if (!error && data) {
      setComidas((prev) =>
        prev.map((c) =>
          c.id === comidaId
            ? { ...c, comida_items: [...(c.comida_items ?? []), data] }
            : c,
        ),
      );
    }
    setBusqueda("");
    setResultados([]);
    setBuscador(null);
  }

  // Actualizar cantidad de item
  async function actualizarCantidad(
    comidaId: string,
    itemId: string,
    cantidad: number,
  ) {
    const supabase = createClient();
    await supabase
      .from("comida_items")
      .update({ cantidad_g: cantidad })
      .eq("id", itemId);
    setComidas((prev) =>
      prev.map((c) =>
        c.id === comidaId
          ? {
              ...c,
              comida_items: c.comida_items.map((i: any) =>
                i.id === itemId ? { ...i, cantidad_g: cantidad } : i,
              ),
            }
          : c,
      ),
    );
  }

  // Eliminar item
  async function eliminarItem(comidaId: string, itemId: string) {
    const supabase = createClient();
    await supabase.from("comida_items").delete().eq("id", itemId);
    setComidas((prev) =>
      prev.map((c) =>
        c.id === comidaId
          ? {
              ...c,
              comida_items: c.comida_items.filter((i: any) => i.id !== itemId),
            }
          : c,
      ),
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-sm text-zinc-400 hover:text-zinc-700 transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4" /> Volver a planes
        </button>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-bold text-zinc-900">{plan.nombre}</h1>
            <p className="text-sm text-zinc-400 mt-0.5">
              {plan.pacientes?.nombre} {plan.pacientes?.apellidos} ·{" "}
              {new Date(plan.fecha_inicio).toLocaleDateString("es-MX", {
                day: "numeric",
                month: "long",
              })}
              {plan.fecha_fin &&
                ` → ${new Date(plan.fecha_fin).toLocaleDateString("es-MX", { day: "numeric", month: "long" })}`}
            </p>
          </div>
          <Link
            href={`/planes/${plan.id}/imprimir`}
            target="_blank"
            className="flex items-center gap-2 px-3 py-2 rounded-lg border border-zinc-200 text-sm font-medium text-zinc-600 hover:bg-zinc-50 transition-colors"
          >
            <Printer className="w-4 h-4" /> Imprimir
          </Link>
        </div>
      </div>

      {/* Totales */}
      <div className="bg-white rounded-xl border border-zinc-100 p-5">
        <p className="text-xs font-medium text-zinc-400 uppercase tracking-wide mb-3">
          Totales del día
        </p>
        <div className="grid grid-cols-4 gap-4">
          {[
            {
              label: "Calorías",
              value: totalesGlobales.calorias,
              unit: "kcal",
              objetivo: plan.calorias_objetivo,
              color: "text-orange-500",
              bg: "bg-orange-50",
            },
            {
              label: "Proteínas",
              value: totalesGlobales.proteinas,
              unit: "g",
              objetivo: plan.proteinas_g,
              color: "text-blue-500",
              bg: "bg-blue-50",
            },
            {
              label: "Carbohidratos",
              value: totalesGlobales.carbohidratos,
              unit: "g",
              objetivo: plan.carbohidratos_g,
              color: "text-yellow-500",
              bg: "bg-yellow-50",
            },
            {
              label: "Grasas",
              value: totalesGlobales.grasas,
              unit: "g",
              objetivo: plan.grasas_g,
              color: "text-emerald-500",
              bg: "bg-emerald-50",
            },
          ].map((m) => (
            <div key={m.label} className={`${m.bg} rounded-xl p-3 text-center`}>
              <p className={`text-xl font-bold ${m.color}`}>
                {m.value}
                <span className="text-xs ml-0.5">{m.unit}</span>
              </p>
              <p className="text-xs text-zinc-500 font-medium">{m.label}</p>
              {m.objetivo && (
                <p className="text-[10px] text-zinc-400 mt-0.5">
                  meta: {m.objetivo}
                  {m.unit}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Comidas */}
      <div className="space-y-3">
        {comidas.map((comida) => {
          const totales = calcularTotalesComida(comida.comida_items ?? []);
          const isExpanded = expandidas[comida.id] ?? true;

          return (
            <div
              key={comida.id}
              className="bg-white rounded-xl border border-zinc-100 overflow-hidden"
            >
              {/* Header comida */}
              <div
                className="flex items-center justify-between px-5 py-3.5 cursor-pointer hover:bg-zinc-50 transition-colors"
                onClick={() =>
                  setExpandidas((prev) => ({
                    ...prev,
                    [comida.id]: !isExpanded,
                  }))
                }
              >
                <div className="flex items-center gap-3">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      eliminarComida(comida.id);
                    }}
                    className="text-zinc-300 hover:text-red-400 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                  <span className="text-sm font-semibold text-zinc-800">
                    {comida.nombre}
                  </span>
                  {totales.calorias > 0 && (
                    <span className="text-xs text-zinc-400">
                      {totales.calorias} kcal
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {totales.calorias > 0 && (
                    <div className="hidden sm:flex items-center gap-3 mr-2">
                      {[
                        {
                          label: "P",
                          value: totales.proteinas,
                          color: "text-blue-500",
                        },
                        {
                          label: "C",
                          value: totales.carbohidratos,
                          color: "text-yellow-500",
                        },
                        {
                          label: "G",
                          value: totales.grasas,
                          color: "text-emerald-500",
                        },
                      ].map((m) => (
                        <span key={m.label} className="text-xs text-zinc-400">
                          <span className={`font-medium ${m.color}`}>
                            {m.value}g
                          </span>{" "}
                          {m.label}
                        </span>
                      ))}
                    </div>
                  )}
                  {isExpanded ? (
                    <ChevronUp className="w-4 h-4 text-zinc-400" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-zinc-400" />
                  )}
                </div>
              </div>

              {/* Items */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    {(comida.comida_items ?? []).length > 0 && (
                      <div className="border-t border-zinc-50">
                        <div className="px-5 py-1">
                          <div className="grid grid-cols-12 gap-2 px-2 py-1.5">
                            <span className="col-span-5 text-[10px] text-zinc-400 uppercase tracking-wide font-medium">
                              Alimento
                            </span>
                            <span className="col-span-2 text-[10px] text-zinc-400 uppercase tracking-wide font-medium text-center">
                              Cantidad
                            </span>
                            <span className="col-span-1 text-[10px] text-zinc-400 uppercase tracking-wide font-medium text-center">
                              kcal
                            </span>
                            <span className="col-span-1 text-[10px] text-zinc-400 uppercase tracking-wide font-medium text-center">
                              P
                            </span>
                            <span className="col-span-1 text-[10px] text-zinc-400 uppercase tracking-wide font-medium text-center">
                              C
                            </span>
                            <span className="col-span-1 text-[10px] text-zinc-400 uppercase tracking-wide font-medium text-center">
                              G
                            </span>
                            <span className="col-span-1" />
                          </div>
                          {comida.comida_items.map((item: any) => {
                            const macros = calcularMacrosItem(
                              item.alimentos,
                              item.cantidad_g,
                            );
                            return (
                              <div
                                key={item.id}
                                className="grid grid-cols-12 gap-2 items-center px-2 py-2 rounded-lg hover:bg-zinc-50 group"
                              >
                                <span className="col-span-5 text-sm text-zinc-700 truncate">
                                  {item.alimentos?.nombre}
                                </span>
                                <div className="col-span-2 flex items-center justify-center">
                                  <input
                                    type="number"
                                    min="1"
                                    value={item.cantidad_g}
                                    onChange={(e) =>
                                      actualizarCantidad(
                                        comida.id,
                                        item.id,
                                        Number(e.target.value),
                                      )
                                    }
                                    className="w-16 h-7 text-center text-xs rounded-md border border-zinc-200 bg-zinc-50 focus:outline-none focus:border-emerald-400"
                                  />
                                  <span className="text-xs text-zinc-400 ml-1">
                                    g
                                  </span>
                                </div>
                                <span className="col-span-1 text-xs text-zinc-600 text-center font-medium">
                                  {macros.calorias}
                                </span>
                                <span className="col-span-1 text-xs text-blue-500 text-center">
                                  {macros.proteinas}
                                </span>
                                <span className="col-span-1 text-xs text-yellow-500 text-center">
                                  {macros.carbohidratos}
                                </span>
                                <span className="col-span-1 text-xs text-emerald-500 text-center">
                                  {macros.grasas}
                                </span>
                                <div className="col-span-1 flex justify-center">
                                  <button
                                    onClick={() =>
                                      eliminarItem(comida.id, item.id)
                                    }
                                    className="opacity-0 group-hover:opacity-100 text-zinc-300 hover:text-red-400 transition-all"
                                  >
                                    <X className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Buscador */}
                    <div className="px-5 py-3 border-t border-zinc-50">
                      {buscador?.comidaId === comida.id ? (
                        <div className="space-y-2">
                          <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400" />
                            <input
                              autoFocus
                              type="text"
                              placeholder="Buscar alimento..."
                              value={busqueda}
                              onChange={(e) => {
                                setBusqueda(e.target.value);
                                buscarAlimentos(e.target.value);
                              }}
                              className="w-full h-9 pl-8 pr-8 rounded-lg border border-emerald-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400/20"
                            />
                            <button
                              onClick={() => {
                                setBuscador(null);
                                setBusqueda("");
                                setResultados([]);
                              }}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          {buscando && (
                            <p className="text-xs text-zinc-400 px-1">
                              Buscando...
                            </p>
                          )}

                          {resultados.length > 0 && (
                            <div className="bg-white border border-zinc-100 rounded-lg overflow-hidden shadow-sm">
                              {resultados.map((alimento) => (
                                <button
                                  key={alimento.id}
                                  onClick={() =>
                                    agregarAlimento(comida.id, alimento)
                                  }
                                  className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-emerald-50 text-left transition-colors border-b border-zinc-50 last:border-0"
                                >
                                  <span className="text-sm text-zinc-700">
                                    {alimento.nombre}
                                  </span>
                                  <span className="text-xs text-zinc-400">
                                    {alimento.calorias_por_100g} kcal/100g
                                  </span>
                                </button>
                              ))}
                            </div>
                          )}

                          {busqueda && !buscando && resultados.length === 0 && (
                            <p className="text-xs text-zinc-400 px-1">
                              Sin resultados para "{busqueda}"
                            </p>
                          )}
                        </div>
                      ) : (
                        <button
                          onClick={() => setBuscador({ comidaId: comida.id })}
                          className="flex items-center gap-2 text-xs text-emerald-600 hover:text-emerald-700 font-medium transition-colors"
                        >
                          <Plus className="w-3.5 h-3.5" /> Agregar alimento
                        </button>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>

      {/* Agregar comida */}
      <div className="bg-white rounded-xl border border-dashed border-zinc-200 p-4">
        <p className="text-xs font-medium text-zinc-400 uppercase tracking-wide mb-3">
          Agregar comida
        </p>
        <div className="flex flex-wrap gap-2">
          {TIPOS_COMIDA.map((tipo) => (
            <button
              key={tipo}
              onClick={() => agregarComida(tipo)}
              disabled={loadingComida}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-200 text-xs font-medium text-zinc-600 hover:border-emerald-300 hover:text-emerald-600 hover:bg-emerald-50 transition-all disabled:opacity-50"
            >
              <Plus className="w-3 h-3" /> {tipo}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
