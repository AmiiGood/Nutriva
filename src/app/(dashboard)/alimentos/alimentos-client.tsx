"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { Search, Plus, X, Pencil, Trash2, Apple, Filter } from "lucide-react";
import { Label } from "@/components/ui/label";

const inputClass =
  "w-full h-10 px-3.5 rounded-lg border border-zinc-200 bg-zinc-50 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20 transition";

const PER_PAGE = 20;

type Alimento = {
  id: string;
  nombre: string;
  calorias_por_100g: number;
  proteinas_por_100g: number;
  carbohidratos_por_100g: number;
  grasas_por_100g: number;
  fibra_por_100g: number | null;
  sodio_mg_por_100g: number | null;
  fuente: string;
  nutriologo_id: string | null;
  verified: boolean;
};

const emptyForm = {
  nombre: "",
  calorias_por_100g: "",
  proteinas_por_100g: "",
  carbohidratos_por_100g: "",
  grasas_por_100g: "",
  fibra_por_100g: "",
  sodio_mg_por_100g: "",
};

export default function AlimentosClient({
  alimentos: inicial,
  userId,
}: {
  alimentos: Alimento[];
  userId: string;
}) {
  const [alimentos, setAlimentos] = useState(inicial);
  const [search, setSearch] = useState("");
  const [filtro, setFiltro] = useState<"todos" | "globales" | "propios">(
    "todos",
  );
  const [page, setPage] = useState(1);
  const [modal, setModal] = useState<"nuevo" | "editar" | null>(null);
  const [editando, setEditando] = useState<Alimento | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError("");
  }

  const filtrados = useMemo(() => {
    return alimentos.filter((a) => {
      const matchSearch = a.nombre.toLowerCase().includes(search.toLowerCase());
      const matchFiltro =
        filtro === "todos"
          ? true
          : filtro === "globales"
            ? a.nutriologo_id === null
            : a.nutriologo_id === userId;
      return matchSearch && matchFiltro;
    });
  }, [alimentos, search, filtro, userId]);

  const totalPages = Math.ceil(filtrados.length / PER_PAGE);
  const paginados = filtrados.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  function abrirNuevo() {
    setForm(emptyForm);
    setEditando(null);
    setError("");
    setModal("nuevo");
  }

  function abrirEditar(a: Alimento) {
    setForm({
      nombre: a.nombre,
      calorias_por_100g: String(a.calorias_por_100g ?? ""),
      proteinas_por_100g: String(a.proteinas_por_100g ?? ""),
      carbohidratos_por_100g: String(a.carbohidratos_por_100g ?? ""),
      grasas_por_100g: String(a.grasas_por_100g ?? ""),
      fibra_por_100g: String(a.fibra_por_100g ?? ""),
      sodio_mg_por_100g: String(a.sodio_mg_por_100g ?? ""),
    });
    setEditando(a);
    setError("");
    setModal("editar");
  }

  async function handleGuardar(e: React.FormEvent) {
    e.preventDefault();
    if (!form.nombre) {
      setError("El nombre es requerido");
      return;
    }
    setLoading(true);

    const supabase = createClient();
    const payload = {
      nombre: form.nombre,
      calorias_por_100g: Number(form.calorias_por_100g) || 0,
      proteinas_por_100g: Number(form.proteinas_por_100g) || 0,
      carbohidratos_por_100g: Number(form.carbohidratos_por_100g) || 0,
      grasas_por_100g: Number(form.grasas_por_100g) || 0,
      fibra_por_100g: form.fibra_por_100g ? Number(form.fibra_por_100g) : null,
      sodio_mg_por_100g: form.sodio_mg_por_100g
        ? Number(form.sodio_mg_por_100g)
        : null,
      fuente: "custom",
      nutriologo_id: userId,
    };

    if (modal === "editar" && editando) {
      const { data, error } = await supabase
        .from("alimentos")
        .update(payload)
        .eq("id", editando.id)
        .select()
        .single();
      if (error) {
        setError("Error al actualizar");
        setLoading(false);
        return;
      }
      setAlimentos((prev) =>
        prev.map((a) => (a.id === editando.id ? data : a)),
      );
    } else {
      const { data, error } = await supabase
        .from("alimentos")
        .insert(payload)
        .select()
        .single();
      if (error) {
        setError("Error al guardar");
        setLoading(false);
        return;
      }
      setAlimentos((prev) => [data, ...prev]);
    }

    setModal(null);
    setLoading(false);
  }

  async function handleEliminar(id: string) {
    if (!confirm("¿Eliminar este alimento?")) return;
    const supabase = createClient();
    await supabase.from("alimentos").delete().eq("id", id);
    setAlimentos((prev) => prev.filter((a) => a.id !== id));
  }

  return (
    <>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-zinc-900">Alimentos</h1>
            <p className="text-sm text-zinc-400 mt-0.5">
              {alimentos.length.toLocaleString()} alimentos en la base de datos
            </p>
          </div>
          <button
            onClick={abrirNuevo}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-sm font-medium text-white transition-colors"
          >
            <Plus className="w-4 h-4" />
            Nuevo alimento
          </button>
        </div>

        {/* Filtros */}
        <div className="flex gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <input
              type="text"
              placeholder="Buscar alimento..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full h-9 pl-9 pr-3 rounded-lg border border-zinc-200 bg-white text-sm placeholder:text-zinc-400 focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20 transition"
            />
          </div>
          <div className="flex rounded-lg border border-zinc-200 overflow-hidden text-sm">
            {(
              [
                { key: "todos", label: "Todos" },
                { key: "globales", label: "Base de datos" },
                { key: "propios", label: "Mis alimentos" },
              ] as const
            ).map((f) => (
              <button
                key={f.key}
                onClick={() => {
                  setFiltro(f.key);
                  setPage(1);
                }}
                className={`px-3 h-9 font-medium transition-colors ${
                  filtro === f.key
                    ? "bg-emerald-500 text-white"
                    : "bg-white text-zinc-500 hover:bg-zinc-50"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tabla */}
        <div className="bg-white rounded-xl border border-zinc-100 overflow-hidden">
          {paginados.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <Apple className="w-8 h-8 text-zinc-200 mb-3" />
              <p className="text-sm text-zinc-400">Sin resultados</p>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-zinc-100">
                  <th className="text-left text-xs font-medium text-zinc-400 uppercase tracking-wide px-5 py-3">
                    Alimento
                  </th>
                  <th className="text-right text-xs font-medium text-zinc-400 uppercase tracking-wide px-4 py-3">
                    kcal
                  </th>
                  <th className="text-right text-xs font-medium text-zinc-400 uppercase tracking-wide px-4 py-3 hidden md:table-cell">
                    Prot.
                  </th>
                  <th className="text-right text-xs font-medium text-zinc-400 uppercase tracking-wide px-4 py-3 hidden md:table-cell">
                    Carbs.
                  </th>
                  <th className="text-right text-xs font-medium text-zinc-400 uppercase tracking-wide px-4 py-3 hidden md:table-cell">
                    Grasas
                  </th>
                  <th className="text-right text-xs font-medium text-zinc-400 uppercase tracking-wide px-4 py-3 hidden lg:table-cell">
                    Fibra
                  </th>
                  <th className="px-4 py-3 w-10" />
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-50">
                {paginados.map((a, i) => {
                  const esPropio = a.nutriologo_id === userId;
                  return (
                    <motion.tr
                      key={a.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.01 }}
                      className="hover:bg-zinc-50 transition-colors group"
                    >
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-zinc-800 capitalize">
                            {a.nombre}
                          </span>
                          {esPropio && (
                            <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-violet-50 text-violet-500">
                              propio
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-zinc-400">por 100g</p>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="text-sm font-medium text-orange-500">
                          {a.calorias_por_100g}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right hidden md:table-cell">
                        <span className="text-sm text-blue-500">
                          {a.proteinas_por_100g}g
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right hidden md:table-cell">
                        <span className="text-sm text-yellow-500">
                          {a.carbohidratos_por_100g}g
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right hidden md:table-cell">
                        <span className="text-sm text-emerald-500">
                          {a.grasas_por_100g}g
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right hidden lg:table-cell">
                        <span className="text-sm text-zinc-400">
                          {a.fibra_por_100g ?? "—"}g
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {esPropio && (
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity justify-end">
                            <button
                              onClick={() => abrirEditar(a)}
                              className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-zinc-100 text-zinc-400 hover:text-zinc-600 transition-colors"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleEliminar(a.id)}
                              className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-red-50 text-zinc-400 hover:text-red-400 transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          )}

          {/* Paginación */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-5 py-3 border-t border-zinc-100">
              <p className="text-xs text-zinc-400">
                {(page - 1) * PER_PAGE + 1}–
                {Math.min(page * PER_PAGE, filtrados.length)} de{" "}
                {filtrados.length}
              </p>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="w-7 h-7 flex items-center justify-center rounded-md border border-zinc-200 text-zinc-500 hover:bg-zinc-50 disabled:opacity-30 transition-colors text-xs"
                >
                  ‹
                </button>
                <span className="text-xs text-zinc-500 px-2">
                  {page} / {totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="w-7 h-7 flex items-center justify-center rounded-md border border-zinc-200 text-zinc-500 hover:bg-zinc-50 disabled:opacity-30 transition-colors text-xs"
                >
                  ›
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal nuevo/editar */}
      <AnimatePresence>
        {modal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setModal(null)}
              className="absolute inset-0 bg-black/20 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative bg-white rounded-2xl shadow-xl w-full max-w-md p-6 z-10"
            >
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-base font-semibold text-zinc-900">
                  {modal === "editar" ? "Editar alimento" : "Nuevo alimento"}
                </h2>
                <button
                  onClick={() => setModal(null)}
                  className="text-zinc-400 hover:text-zinc-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleGuardar} className="space-y-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-zinc-500 uppercase tracking-wide">
                    Nombre *
                  </Label>
                  <input
                    name="nombre"
                    value={form.nombre}
                    onChange={handleChange}
                    placeholder="Ej: Pechuga de pollo cocida"
                    className={inputClass}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {[
                    { name: "calorias_por_100g", label: "Calorías (kcal)" },
                    { name: "proteinas_por_100g", label: "Proteínas (g)" },
                    {
                      name: "carbohidratos_por_100g",
                      label: "Carbohidratos (g)",
                    },
                    { name: "grasas_por_100g", label: "Grasas (g)" },
                    { name: "fibra_por_100g", label: "Fibra (g)" },
                    { name: "sodio_mg_por_100g", label: "Sodio (mg)" },
                  ].map((f) => (
                    <div key={f.name} className="space-y-1.5">
                      <Label className="text-xs font-medium text-zinc-500 uppercase tracking-wide">
                        {f.label}
                      </Label>
                      <input
                        name={f.name}
                        type="number"
                        step="0.01"
                        min="0"
                        value={(form as any)[f.name]}
                        onChange={handleChange}
                        placeholder="0"
                        className={inputClass}
                      />
                    </div>
                  ))}
                </div>

                {error && (
                  <p className="text-xs text-red-500 bg-red-50 px-3 py-2 rounded-lg">
                    {error}
                  </p>
                )}

                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setModal(null)}
                    className="flex-1 h-10 rounded-lg border border-zinc-200 text-sm font-medium text-zinc-600 hover:bg-zinc-50 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 h-10 rounded-lg bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white text-sm font-medium transition-colors flex items-center justify-center"
                  >
                    {loading ? (
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      "Guardar"
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
