"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  User,
  Phone,
  Mail,
  Calendar,
  Target,
  TrendingDown,
  TrendingUp,
  Minus,
  ClipboardList,
  UtensilsCrossed,
  Clock,
  Plus,
  MoreHorizontal,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

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

const CITA_ESTADO_COLOR: Record<string, string> = {
  confirmada: "bg-emerald-50 text-emerald-600",
  pendiente: "bg-amber-50 text-amber-600",
  cancelada: "bg-red-50 text-red-500",
  completada: "bg-zinc-100 text-zinc-500",
};

function calcularEdad(fecha: string) {
  if (!fecha) return "—";
  const hoy = new Date();
  const nac = new Date(fecha);
  let edad = hoy.getFullYear() - nac.getFullYear();
  if (
    hoy.getMonth() < nac.getMonth() ||
    (hoy.getMonth() === nac.getMonth() && hoy.getDate() < nac.getDate())
  )
    edad--;
  return edad;
}

type Tab = "consultas" | "planes" | "citas";

export default function PacientePerfilClient({
  paciente,
  consultas,
  planes,
  citas,
}: {
  paciente: any;
  consultas: any[];
  planes: any[];
  citas: any[];
}) {
  const [tab, setTab] = useState<Tab>("consultas");
  const router = useRouter();

  const ultimaConsulta = consultas[consultas.length - 1];
  const primeraConsulta = consultas[0];

  const pesoInicial = primeraConsulta?.peso_kg;
  const pesoActual = ultimaConsulta?.peso_kg;
  const diferenciaPeso =
    pesoInicial && pesoActual ? (pesoActual - pesoInicial).toFixed(1) : null;

  const graficaPeso = consultas
    .filter((c) => c.peso_kg)
    .map((c) => ({
      fecha: new Date(c.fecha).toLocaleDateString("es-MX", {
        day: "numeric",
        month: "short",
      }),
      peso: Number(c.peso_kg),
      imc: Number(c.imc),
    }));

  const tabs: { key: Tab; label: string; count: number }[] = [
    { key: "consultas", label: "Consultas", count: consultas.length },
    { key: "planes", label: "Planes", count: planes.length },
    { key: "citas", label: "Citas", count: citas.length },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Back */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-sm text-zinc-400 hover:text-zinc-700 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Volver a pacientes
      </button>

      {/* Header del paciente */}
      <div className="bg-white rounded-xl border border-zinc-100 p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 flex items-center justify-center text-xl font-bold text-emerald-700">
              {paciente.nombre[0]}
              {paciente.apellidos[0]}
            </div>
            <div>
              <h1 className="text-xl font-bold text-zinc-900">
                {paciente.nombre} {paciente.apellidos}
              </h1>
              <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                {paciente.objetivo && (
                  <span
                    className={`text-xs font-medium px-2 py-0.5 rounded-full ${OBJETIVO_COLOR[paciente.objetivo]}`}
                  >
                    {OBJETIVO_LABEL[paciente.objetivo]}
                  </span>
                )}
                <span
                  className={`text-xs font-medium px-2 py-0.5 rounded-full ${paciente.activo ? "bg-emerald-50 text-emerald-600" : "bg-zinc-100 text-zinc-500"}`}
                >
                  {paciente.activo ? "Activo" : "Inactivo"}
                </span>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <Link
              href={`/pacientes/${paciente.id}/consulta/nueva`}
              className="flex items-center gap-2 px-3 py-2 rounded-lg border border-zinc-200 bg-white text-sm font-medium text-zinc-700 hover:bg-zinc-50 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              Nueva consulta
            </Link>
            <Link
              href={`/pacientes/${paciente.id}/editar`}
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-sm font-medium text-white transition-colors"
            >
              Editar
            </Link>
          </div>
        </div>

        {/* Info del paciente */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-zinc-50">
          {[
            {
              icon: User,
              label: "Edad",
              value: paciente.fecha_nacimiento
                ? `${calcularEdad(paciente.fecha_nacimiento)} años`
                : "—",
            },
            { icon: Mail, label: "Correo", value: paciente.email ?? "—" },
            { icon: Phone, label: "Teléfono", value: paciente.telefono ?? "—" },
            {
              icon: Calendar,
              label: "Registrado",
              value: new Date(paciente.created_at).toLocaleDateString("es-MX", {
                day: "numeric",
                month: "long",
                year: "numeric",
              }),
            },
          ].map(({ icon: Icon, label, value }) => (
            <div key={label}>
              <div className="flex items-center gap-1.5 mb-1">
                <Icon className="w-3.5 h-3.5 text-zinc-400" />
                <p className="text-xs text-zinc-400 uppercase tracking-wide font-medium">
                  {label}
                </p>
              </div>
              <p className="text-sm font-medium text-zinc-700 truncate">
                {value}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Stats rápidas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          {
            label: "Peso actual",
            value: pesoActual ? `${pesoActual} kg` : "—",
            sub: "Última consulta",
          },
          {
            label: "IMC actual",
            value: ultimaConsulta?.imc ?? "—",
            sub: !ultimaConsulta?.imc
              ? "—"
              : ultimaConsulta.imc < 18.5
                ? "Bajo peso"
                : ultimaConsulta.imc < 25
                  ? "Normal"
                  : ultimaConsulta.imc < 30
                    ? "Sobrepeso"
                    : "Obesidad",
          },
          {
            label: "Cambio de peso",
            value: diferenciaPeso
              ? `${Number(diferenciaPeso) > 0 ? "+" : ""}${diferenciaPeso} kg`
              : "—",
            sub: "Desde primera consulta",
            trend: diferenciaPeso ? Number(diferenciaPeso) : null,
            objetivo: paciente.objetivo,
          },
          {
            label: "Consultas",
            value: consultas.length,
            sub: "Total registradas",
          },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="bg-white rounded-xl border border-zinc-100 p-4"
          >
            <p className="text-xs text-zinc-400 uppercase tracking-wide font-medium mb-2">
              {stat.label}
            </p>
            <div className="flex items-end gap-2">
              <p className="text-2xl font-bold text-zinc-900">{stat.value}</p>
              {stat.trend !== null &&
                stat.trend !== undefined &&
                (stat.trend < 0 ? (
                  <TrendingDown className="w-4 h-4 text-emerald-500 mb-1" />
                ) : stat.trend > 0 ? (
                  <TrendingUp className="w-4 h-4 text-orange-400 mb-1" />
                ) : (
                  <Minus className="w-4 h-4 text-zinc-400 mb-1" />
                ))}
            </div>
            <p className="text-xs text-zinc-400 mt-0.5">{stat.sub}</p>
          </motion.div>
        ))}
      </div>

      {/* Gráfica de peso */}
      {graficaPeso.length > 1 && (
        <div className="bg-white rounded-xl border border-zinc-100 p-6">
          <h2 className="text-sm font-semibold text-zinc-900 mb-6">
            Evolución de peso
          </h2>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={graficaPeso}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f4f4f5" />
              <XAxis
                dataKey="fecha"
                tick={{ fontSize: 11, fill: "#a1a1aa" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: "#a1a1aa" }}
                axisLine={false}
                tickLine={false}
                domain={["auto", "auto"]}
              />
              <Tooltip
                contentStyle={{
                  border: "1px solid #f4f4f5",
                  borderRadius: 8,
                  fontSize: 12,
                }}
                formatter={(val: any) => [`${val} kg`, "Peso"]}
              />
              <Line
                type="monotone"
                dataKey="peso"
                stroke="#10b981"
                strokeWidth={2}
                dot={{ fill: "#10b981", r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Tabs */}
      <div className="bg-white rounded-xl border border-zinc-100 overflow-hidden">
        <div className="flex border-b border-zinc-100">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex items-center gap-2 px-5 py-3.5 text-sm font-medium transition-colors relative ${
                tab === t.key
                  ? "text-zinc-900"
                  : "text-zinc-400 hover:text-zinc-600"
              }`}
            >
              {t.label}
              <span
                className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${
                  tab === t.key
                    ? "bg-emerald-50 text-emerald-600"
                    : "bg-zinc-100 text-zinc-400"
                }`}
              >
                {t.count}
              </span>
              {tab === t.key && (
                <motion.div
                  layoutId="tab-underline"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-500"
                />
              )}
            </button>
          ))}
        </div>

        {/* Consultas */}
        {tab === "consultas" && (
          <div>
            {consultas.length === 0 ? (
              <Empty
                label="Sin consultas"
                sub="Registra la primera consulta del paciente"
              />
            ) : (
              <div className="divide-y divide-zinc-50">
                {[...consultas].reverse().map((c) => (
                  <div
                    key={c.id}
                    className="px-5 py-4 hover:bg-zinc-50 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-medium text-zinc-800">
                        {new Date(c.fecha).toLocaleDateString("es-MX", {
                          weekday: "long",
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })}
                      </p>
                      <span className="text-xs text-zinc-400">
                        IMC: {c.imc ?? "—"}
                      </span>
                    </div>
                    <div className="flex gap-6 flex-wrap">
                      {[
                        {
                          label: "Peso",
                          value: c.peso_kg ? `${c.peso_kg} kg` : "—",
                        },
                        {
                          label: "Grasa corporal",
                          value: c.grasa_corporal_pct
                            ? `${c.grasa_corporal_pct}%`
                            : "—",
                        },
                        {
                          label: "Masa muscular",
                          value: c.masa_muscular_kg
                            ? `${c.masa_muscular_kg} kg`
                            : "—",
                        },
                        {
                          label: "Cintura",
                          value: c.cintura_cm ? `${c.cintura_cm} cm` : "—",
                        },
                        {
                          label: "Cadera",
                          value: c.cadera_cm ? `${c.cadera_cm} cm` : "—",
                        },
                      ].map((m) => (
                        <div key={m.label}>
                          <p className="text-xs text-zinc-400">{m.label}</p>
                          <p className="text-sm font-medium text-zinc-700">
                            {m.value}
                          </p>
                        </div>
                      ))}
                    </div>
                    {c.notas && (
                      <p className="text-xs text-zinc-400 mt-2 italic">
                        "{c.notas}"
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Planes */}
        {tab === "planes" && (
          <div>
            {planes.length === 0 ? (
              <Empty
                label="Sin planes asignados"
                sub="Crea un plan alimenticio para este paciente"
              />
            ) : (
              <div className="divide-y divide-zinc-50">
                {planes.map((p) => (
                  <div
                    key={p.id}
                    className="px-5 py-4 flex items-center justify-between hover:bg-zinc-50 transition-colors"
                  >
                    <div>
                      <p className="text-sm font-medium text-zinc-800">
                        {p.nombre}
                      </p>
                      <p className="text-xs text-zinc-400 mt-0.5">
                        Desde{" "}
                        {new Date(p.fecha_inicio).toLocaleDateString("es-MX", {
                          day: "numeric",
                          month: "long",
                        })}
                        {p.fecha_fin
                          ? ` · hasta ${new Date(p.fecha_fin).toLocaleDateString("es-MX", { day: "numeric", month: "long" })}`
                          : " · Sin fecha fin"}
                      </p>
                      {p.calorias_objetivo && (
                        <p className="text-xs text-zinc-400 mt-0.5">
                          {p.calorias_objetivo} kcal · {p.proteinas_g}g prot ·{" "}
                          {p.carbohidratos_g}g carbs · {p.grasas_g}g grasas
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <span
                        className={`text-xs font-medium px-2 py-0.5 rounded-full ${p.activo ? "bg-emerald-50 text-emerald-600" : "bg-zinc-100 text-zinc-500"}`}
                      >
                        {p.activo ? "Activo" : "Inactivo"}
                      </span>
                      <Link
                        href={`/planes/${p.id}`}
                        className="text-xs text-emerald-600 hover:text-emerald-700 font-medium"
                      >
                        Ver plan →
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Citas */}
        {tab === "citas" && (
          <div>
            {citas.length === 0 ? (
              <Empty
                label="Sin citas"
                sub="Agenda una cita para este paciente"
              />
            ) : (
              <div className="divide-y divide-zinc-50">
                {citas.map((c) => (
                  <div
                    key={c.id}
                    className="px-5 py-4 flex items-center justify-between hover:bg-zinc-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <Clock className="w-4 h-4 text-zinc-300" />
                      <div>
                        <p className="text-sm font-medium text-zinc-800">
                          {new Date(c.fecha_hora).toLocaleDateString("es-MX", {
                            weekday: "long",
                            day: "numeric",
                            month: "long",
                            timeZone: "America/Mexico_City",
                          })}
                        </p>
                        <p className="text-xs text-zinc-400">
                          {new Date(c.fecha_hora).toLocaleTimeString("es-MX", {
                            hour: "2-digit",
                            minute: "2-digit",
                            timeZone: "America/Mexico_City",
                          })}{" "}
                          · {c.duracion_min} min
                        </p>
                      </div>
                    </div>
                    <span
                      className={`text-xs font-medium px-2 py-0.5 rounded-full ${CITA_ESTADO_COLOR[c.estado]}`}
                    >
                      {c.estado}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function Empty({ label, sub }: { label: string; sub: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <p className="text-sm font-medium text-zinc-400">{label}</p>
      <p className="text-xs text-zinc-300 mt-1">{sub}</p>
    </div>
  );
}
