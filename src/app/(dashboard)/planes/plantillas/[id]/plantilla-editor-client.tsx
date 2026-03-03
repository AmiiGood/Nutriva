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
  Sparkles,
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

function calcularMacros(alimento: any, cantidad: number) {
  const f = cantidad / 100;
  return {
    calorias: Math.round((alimento.calorias_por_100g ?? 0) * f),
    proteinas: +((alimento.proteinas_por_100g ?? 0) * f).toFixed(1),
    carbohidratos: +((alimento.carbohidratos_por_100g ?? 0) * f).toFixed(1),
    grasas: +((alimento.grasas_por_100g ?? 0) * f).toFixed(1),
  };
}

export default function PlantillaEditorClient({
  plantilla,
  comidasIniciales,
}: {
  plantilla: any;
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

  const totalesGlobales = comidas.reduce(
    (acc, comida) => {
      const t = (comida.plantilla_comida_items ?? []).reduce(
        (a: any, item: any) => {
          const m = calcularMacros(item.alimentos, item.cantidad_g);
          return {
            calorias: a.calorias + m.calorias,
            proteinas: +(a.proteinas + m.proteinas).toFixed(1),
            carbohidratos: +(a.carbohidratos + m.carbohidratos).toFixed(1),
            grasas: +(a.grasas + m.grasas).toFixed(1),
          };
        },
        { calorias: 0, proteinas: 0, carbohidratos: 0, grasas: 0 },
      );
      return {
        calorias: acc.calorias + t.calorias,
        proteinas: +(acc.proteinas + t.proteinas).toFixed(1),
        carbohidratos: +(acc.carbohidratos + t.carbohidratos).toFixed(1),
        grasas: +(acc.grasas + t.grasas).toFixed(1),
      };
    },
    { calorias: 0, proteinas: 0, carbohidratos: 0, grasas: 0 },
  );

  async function agregarComida(tipo: string) {
    setLoadingComida(true);
    const supabase = createClient();
    const { data, error } = await supabase
      .from("plantilla_comidas")
      .insert({
        plantilla_id: plantilla.id,
        nombre: tipo,
        orden: comidas.length + 1,
      })
      .select()
      .single();
    if (!error && data) {
      setComidas((prev) => [...prev, { ...data, plantilla_comida_items: [] }]);
      setExpandidas((prev) => ({ ...prev, [data.id]: true }));
    }
    setLoadingComida(false);
  }

  async function eliminarComida(id: string) {
    const supabase = createClient();
    await supabase.from("plantilla_comidas").delete().eq("id", id);
    setComidas((prev) => prev.filter((c) => c.id !== id));
  }

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

  async function agregarAlimento(comidaId: string, alimento: any) {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("plantilla_comida_items")
      .insert({
        comida_id: comidaId,
        alimento_id: alimento.id,
        cantidad_g: 100,
      })
      .select(
        "*, alimentos(nombre, calorias_por_100g, proteinas_por_100g, carbohidratos_por_100g, grasas_por_100g)",
      )
      .single();
    if (!error && data) {
      setComidas((prev) =>
        prev.map((c) =>
          c.id === comidaId
            ? {
                ...c,
                plantilla_comida_items: [
                  ...(c.plantilla_comida_items ?? []),
                  data,
                ],
              }
            : c,
        ),
      );
    }
    setBusqueda("");
    setResultados([]);
    setBuscador(null);
  }

  async function actualizarCantidad(
    comidaId: string,
    itemId: string,
    cantidad: number,
  ) {
    const supabase = createClient();
    await supabase
      .from("plantilla_comida_items")
      .update({ cantidad_g: cantidad })
      .eq("id", itemId);
    setComidas((prev) =>
      prev.map((c) =>
        c.id === comidaId
          ? {
              ...c,
              plantilla_comida_items: c.plantilla_comida_items.map((i: any) =>
                i.id === itemId ? { ...i, cantidad_g: cantidad } : i,
              ),
            }
          : c,
      ),
    );
  }

  async function eliminarItem(comidaId: string, itemId: string) {
    const supabase = createClient();
    await supabase.from("plantilla_comida_items").delete().eq("id", itemId);
    setComidas((prev) =>
      prev.map((c) =>
        c.id === comidaId
          ? {
              ...c,
              plantilla_comida_items: c.plantilla_comida_items.filter(
                (i: any) => i.id !== itemId,
              ),
            }
          : c,
      ),
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-sm text-zinc-400 hover:text-zinc-700 transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4" /> Volver a plantillas
        </button>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-violet-50 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-violet-500" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-zinc-900">
                {plantilla.nombre}
              </h1>
              {plantilla.descripcion && (
                <p className="text-sm text-zinc-400">{plantilla.descripcion}</p>
              )}
            </div>
          </div>
          <Link
            href={`/planes/nuevo?plantilla=${plantilla.id}`}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-sm font-medium text-white transition-colors"
          >
            <Plus className="w-3.5 h-3.5" /> Usar plantilla
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
              objetivo: plantilla.calorias_objetivo,
              color: "text-orange-500",
              bg: "bg-orange-50",
            },
            {
              label: "Proteínas",
              value: totalesGlobales.proteinas,
              unit: "g",
              objetivo: plantilla.proteinas_g,
              color: "text-blue-500",
              bg: "bg-blue-50",
            },
            {
              label: "Carbohidratos",
              value: totalesGlobales.carbohidratos,
              unit: "g",
              objetivo: plantilla.carbohidratos_g,
              color: "text-yellow-500",
              bg: "bg-yellow-50",
            },
            {
              label: "Grasas",
              value: totalesGlobales.grasas,
              unit: "g",
              objetivo: plantilla.grasas_g,
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

      {/* Comidas — misma estructura que el editor de planes */}
      <div className="space-y-3">
        {comidas.map((comida) => {
          const items = comida.plantilla_comida_items ?? [];
          const totales = items.reduce(
            (acc: any, item: any) => {
              const m = calcularMacros(item.alimentos, item.cantidad_g);
              return {
                calorias: acc.calorias + m.calorias,
                proteinas: +(acc.proteinas + m.proteinas).toFixed(1),
                carbohidratos: +(acc.carbohidratos + m.carbohidratos).toFixed(
                  1,
                ),
                grasas: +(acc.grasas + m.grasas).toFixed(1),
              };
            },
            { calorias: 0, proteinas: 0, carbohidratos: 0, grasas: 0 },
          );
          const isExpanded = expandidas[comida.id] ?? true;

          return (
            <div
              key={comida.id}
              className="bg-white rounded-xl border border-zinc-100 overflow-hidden"
            >
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

              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    {items.length > 0 && (
                      <div className="border-t border-zinc-50 px-5 py-1">
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
                        {items.map((item: any) => {
                          const m = calcularMacros(
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
                                {m.calorias}
                              </span>
                              <span className="col-span-1 text-xs text-blue-500 text-center">
                                {m.proteinas}
                              </span>
                              <span className="col-span-1 text-xs text-yellow-500 text-center">
                                {m.carbohidratos}
                              </span>
                              <span className="col-span-1 text-xs text-emerald-500 text-center">
                                {m.grasas}
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
                    )}

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
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-200 text-xs font-medium text-zinc-600 hover:border-violet-300 hover:text-violet-600 hover:bg-violet-50 transition-all disabled:opacity-50"
            >
              <Plus className="w-3 h-3" /> {tipo}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
