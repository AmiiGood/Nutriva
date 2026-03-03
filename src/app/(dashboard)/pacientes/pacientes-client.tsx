"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Search,
  UserPlus,
  Filter,
  Download,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

const OBJETIVO_LABEL: Record<string, string> = {
  bajar_peso: "Bajar peso",
  subir_peso: "Subir peso",
  mantener: "Mantener peso",
  masa_muscular: "Masa muscular",
  salud: "Salud general",
};

const OBJETIVO_COLOR: Record<string, string> = {
  bajar_peso: "bg-orange-50 text-orange-600",
  subir_peso: "bg-blue-50 text-blue-600",
  mantener: "bg-zinc-100 text-zinc-600",
  masa_muscular: "bg-violet-50 text-violet-600",
  salud: "bg-emerald-50 text-emerald-600",
};

const PER_PAGE = 10;

export default function PacientesClient({ pacientes }: { pacientes: any[] }) {
  const [search, setSearch] = useState("");
  const [filtroObjetivo, setFiltroObjetivo] = useState("");
  const [filtroEstado, setFiltroEstado] = useState<
    "todos" | "activo" | "inactivo"
  >("todos");
  const [page, setPage] = useState(1);

  const filtrados = useMemo(() => {
    return pacientes.filter((p) => {
      const nombre = `${p.nombre} ${p.apellidos}`.toLowerCase();
      const matchSearch =
        nombre.includes(search.toLowerCase()) ||
        p.email?.toLowerCase().includes(search.toLowerCase());
      const matchObjetivo = !filtroObjetivo || p.objetivo === filtroObjetivo;
      const matchEstado =
        filtroEstado === "todos" ||
        (filtroEstado === "activo" ? p.activo : !p.activo);
      return matchSearch && matchObjetivo && matchEstado;
    });
  }, [pacientes, search, filtroObjetivo, filtroEstado]);

  const totalPages = Math.ceil(filtrados.length / PER_PAGE);
  const paginated = filtrados.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  function exportCSV() {
    const headers = [
      "Nombre",
      "Apellidos",
      "Email",
      "Teléfono",
      "Objetivo",
      "Estado",
    ];
    const rows = filtrados.map((p) => [
      p.nombre,
      p.apellidos,
      p.email ?? "",
      p.telefono ?? "",
      OBJETIVO_LABEL[p.objetivo] ?? "",
      p.activo ? "Activo" : "Inactivo",
    ]);
    const csv = [headers, ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "pacientes-nutriva.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  function calcularEdad(fechaNacimiento: string) {
    if (!fechaNacimiento) return "—";
    const hoy = new Date();
    const nac = new Date(fechaNacimiento);
    let edad = hoy.getFullYear() - nac.getFullYear();
    if (
      hoy.getMonth() < nac.getMonth() ||
      (hoy.getMonth() === nac.getMonth() && hoy.getDate() < nac.getDate())
    )
      edad--;
    return `${edad} años`;
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Pacientes</h1>
          <p className="text-sm text-zinc-400 mt-0.5">
            {pacientes.length} pacientes registrados
          </p>
        </div>
        <Link
          href="/pacientes/nuevo"
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-sm font-medium text-white transition-colors"
        >
          <UserPlus className="w-4 h-4" />
          Nuevo paciente
        </Link>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-xl border border-zinc-100 p-4">
        <div className="flex flex-wrap gap-3">
          {/* Búsqueda */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <input
              type="text"
              placeholder="Buscar por nombre o correo..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full h-9 pl-9 pr-3 rounded-lg border border-zinc-200 bg-zinc-50 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20 transition"
            />
          </div>

          {/* Filtro objetivo */}
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400" />
            <select
              value={filtroObjetivo}
              onChange={(e) => {
                setFiltroObjetivo(e.target.value);
                setPage(1);
              }}
              className="h-9 pl-8 pr-3 rounded-lg border border-zinc-200 bg-zinc-50 text-sm text-zinc-700 focus:outline-none focus:border-emerald-400 appearance-none cursor-pointer"
            >
              <option value="">Todos los objetivos</option>
              {Object.entries(OBJETIVO_LABEL).map(([val, label]) => (
                <option key={val} value={val}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          {/* Filtro estado */}
          <div className="flex rounded-lg border border-zinc-200 overflow-hidden text-sm">
            {(["todos", "activo", "inactivo"] as const).map((est) => (
              <button
                key={est}
                onClick={() => {
                  setFiltroEstado(est);
                  setPage(1);
                }}
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

          {/* Exportar */}
          <button
            onClick={exportCSV}
            className="flex items-center gap-2 h-9 px-3 rounded-lg border border-zinc-200 bg-white text-sm font-medium text-zinc-600 hover:bg-zinc-50 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            Exportar CSV
          </button>
        </div>
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-xl border border-zinc-100 overflow-hidden">
        {paginated.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <p className="text-sm font-medium text-zinc-400">Sin resultados</p>
            <p className="text-xs text-zinc-300 mt-1">
              Intenta con otro filtro o búsqueda
            </p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-zinc-100">
                <th className="text-left text-xs font-medium text-zinc-400 uppercase tracking-wide px-5 py-3">
                  Paciente
                </th>
                <th className="text-left text-xs font-medium text-zinc-400 uppercase tracking-wide px-5 py-3 hidden md:table-cell">
                  Edad
                </th>
                <th className="text-left text-xs font-medium text-zinc-400 uppercase tracking-wide px-5 py-3 hidden lg:table-cell">
                  Contacto
                </th>
                <th className="text-left text-xs font-medium text-zinc-400 uppercase tracking-wide px-5 py-3">
                  Objetivo
                </th>
                <th className="text-left text-xs font-medium text-zinc-400 uppercase tracking-wide px-5 py-3">
                  Estado
                </th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-50">
              {paginated.map((p, i) => (
                <motion.tr
                  key={p.id}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className="hover:bg-zinc-50 transition-colors group"
                >
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center text-xs font-semibold text-emerald-700 shrink-0">
                        {p.nombre[0]}
                        {p.apellidos[0]}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-zinc-800">
                          {p.nombre} {p.apellidos}
                        </p>
                        <p className="text-xs text-zinc-400">
                          {p.email ?? "—"}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 hidden md:table-cell">
                    <span className="text-sm text-zinc-600">
                      {calcularEdad(p.fecha_nacimiento)}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 hidden lg:table-cell">
                    <span className="text-sm text-zinc-600">
                      {p.telefono ?? "—"}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <span
                      className={`text-xs font-medium px-2 py-1 rounded-full ${OBJETIVO_COLOR[p.objetivo] ?? "bg-zinc-100 text-zinc-600"}`}
                    >
                      {OBJETIVO_LABEL[p.objetivo] ?? "—"}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <span
                      className={`text-xs font-medium px-2 py-1 rounded-full ${p.activo ? "bg-emerald-50 text-emerald-600" : "bg-zinc-100 text-zinc-500"}`}
                    >
                      {p.activo ? "Activo" : "Inactivo"}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <Link
                      href={`/pacientes/${p.id}`}
                      className="text-xs text-zinc-300 group-hover:text-emerald-500 font-medium transition-colors"
                    >
                      Ver perfil →
                    </Link>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        )}

        {/* Paginación */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-zinc-100">
            <p className="text-xs text-zinc-400">
              Mostrando {(page - 1) * PER_PAGE + 1}–
              {Math.min(page * PER_PAGE, filtrados.length)} de{" "}
              {filtrados.length}
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="w-7 h-7 flex items-center justify-center rounded-md border border-zinc-200 text-zinc-500 hover:bg-zinc-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
                <button
                  key={n}
                  onClick={() => setPage(n)}
                  className={`w-7 h-7 flex items-center justify-center rounded-md text-xs font-medium transition-colors ${
                    page === n
                      ? "bg-emerald-500 text-white"
                      : "border border-zinc-200 text-zinc-500 hover:bg-zinc-50"
                  }`}
                >
                  {n}
                </button>
              ))}
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="w-7 h-7 flex items-center justify-center rounded-md border border-zinc-200 text-zinc-500 hover:bg-zinc-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
