import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import {
  Users,
  Calendar,
  TrendingUp,
  Plus,
  UserPlus,
  Clock,
} from "lucide-react";
import Link from "next/link";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: nutriologo } = await supabase
    .from("nutriologos")
    .select("nombre, apellidos")
    .eq("id", user.id)
    .single();

  const today = new Date().toISOString().split("T")[0];

  const [
    { count: totalPacientes },
    { count: citasHoy },
    { count: totalConsultas },
    { data: citasDelDia },
    { data: ultimosPacientes },
  ] = await Promise.all([
    supabase
      .from("pacientes")
      .select("*", { count: "exact", head: true })
      .eq("nutriologo_id", user.id)
      .eq("activo", true),
    supabase
      .from("citas")
      .select("*", { count: "exact", head: true })
      .eq("nutriologo_id", user.id)
      .gte("fecha_hora", `${today}T00:00:00`)
      .lte("fecha_hora", `${today}T23:59:59`),
    supabase
      .from("consultas")
      .select("*", { count: "exact", head: true })
      .eq("nutriologo_id", user.id),
    supabase
      .from("citas")
      .select("*, pacientes(nombre, apellidos)")
      .eq("nutriologo_id", user.id)
      .gte("fecha_hora", `${today}T00:00:00`)
      .lte("fecha_hora", `${today}T23:59:59`)
      .order("fecha_hora")
      .limit(5),
    supabase
      .from("pacientes")
      .select("id, nombre, apellidos, created_at, objetivo")
      .eq("nutriologo_id", user.id)
      .eq("activo", true)
      .order("created_at", { ascending: false })
      .limit(5),
  ]);

  const hora = new Date().getHours();
  const saludo =
    hora < 12 ? "Buenos días" : hora < 18 ? "Buenas tardes" : "Buenas noches";

  const objetivoLabel: Record<string, string> = {
    bajar_peso: "Bajar peso",
    subir_peso: "Subir peso",
    mantener: "Mantener peso",
    masa_muscular: "Masa muscular",
    salud: "Salud general",
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-zinc-400 mb-0.5">{saludo},</p>
          <h1 className="text-2xl font-bold text-zinc-900">
            {nutriologo?.nombre} {nutriologo?.apellidos} 👋
          </h1>
        </div>
        <div className="flex gap-2">
          <Link
            href="/citas/nueva"
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-zinc-200 bg-white text-sm font-medium text-zinc-700 hover:bg-zinc-50 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Nueva cita
          </Link>
          <Link
            href="/pacientes/nuevo"
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-sm font-medium text-white transition-colors"
          >
            <UserPlus className="w-4 h-4" />
            Nuevo paciente
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          {
            label: "Pacientes activos",
            value: totalPacientes ?? 0,
            icon: Users,
            color: "text-emerald-600",
            bg: "bg-emerald-50",
            sub: "Total registrados",
          },
          {
            label: "Citas hoy",
            value: citasHoy ?? 0,
            icon: Calendar,
            color: "text-blue-600",
            bg: "bg-blue-50",
            sub: new Date().toLocaleDateString("es-MX", {
              weekday: "long",
              day: "numeric",
              month: "long",
            }),
          },
          {
            label: "Consultas totales",
            value: totalConsultas ?? 0,
            icon: TrendingUp,
            color: "text-violet-600",
            bg: "bg-violet-50",
            sub: "Historial completo",
          },
        ].map((stat) => (
          <div
            key={stat.label}
            className="bg-white rounded-xl border border-zinc-100 p-5 flex items-center gap-4"
          >
            <div
              className={`w-11 h-11 rounded-xl ${stat.bg} flex items-center justify-center shrink-0`}
            >
              <stat.icon className={`w-5 h-5 ${stat.color}`} />
            </div>
            <div>
              <p className="text-2xl font-bold text-zinc-900">{stat.value}</p>
              <p className="text-sm font-medium text-zinc-700">{stat.label}</p>
              <p className="text-xs text-zinc-400 capitalize">{stat.sub}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Citas de hoy + Últimos pacientes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Citas de hoy */}
        <div className="bg-white rounded-xl border border-zinc-100 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-50">
            <h2 className="text-sm font-semibold text-zinc-900">
              Citas de hoy
            </h2>
            <Link
              href="/citas"
              className="text-xs text-emerald-600 hover:text-emerald-700 font-medium"
            >
              Ver todas →
            </Link>
          </div>

          {!citasDelDia?.length ? (
            <div className="flex flex-col items-center justify-center py-12 text-center px-5">
              <Calendar className="w-8 h-8 text-zinc-200 mb-3" />
              <p className="text-sm font-medium text-zinc-400">Sin citas hoy</p>
              <p className="text-xs text-zinc-300 mt-1">
                ¿Quieres agendar una?
              </p>
              <Link
                href="/citas/nueva"
                className="mt-3 text-xs text-emerald-600 font-medium hover:underline"
              >
                + Nueva cita
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-zinc-50">
              {citasDelDia.map((cita: any) => {
                const hora = new Date(cita.fecha_hora).toLocaleTimeString(
                  "es-MX",
                  {
                    hour: "2-digit",
                    minute: "2-digit",
                    timeZone: "America/Mexico_City",
                  },
                );
                return (
                  <div
                    key={cita.id}
                    className="flex items-center gap-4 px-5 py-3.5 hover:bg-zinc-50 transition-colors"
                  >
                    <div className="flex items-center gap-1.5 text-zinc-400 shrink-0">
                      <Clock className="w-3.5 h-3.5" />
                      <span className="text-xs font-medium tabular-nums">
                        {hora}
                      </span>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center shrink-0 text-xs font-semibold text-emerald-700">
                      {cita.pacientes?.nombre?.[0]}
                      {cita.pacientes?.apellidos?.[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-zinc-800 truncate">
                        {cita.pacientes?.nombre} {cita.pacientes?.apellidos}
                      </p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-xs text-zinc-400">
                          {cita.duracion_min} min
                        </span>
                        <span className="text-zinc-300">·</span>
                        <span
                          className={`text-xs font-medium px-1.5 py-0.5 rounded-full ${
                            cita.estado === "confirmada"
                              ? "bg-emerald-50 text-emerald-600"
                              : cita.estado === "cancelada"
                                ? "bg-red-50 text-red-500"
                                : "bg-amber-50 text-amber-600"
                          }`}
                        >
                          {cita.estado}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Últimos pacientes */}
        <div className="bg-white rounded-xl border border-zinc-100 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-50">
            <h2 className="text-sm font-semibold text-zinc-900">
              Pacientes recientes
            </h2>
            <Link
              href="/pacientes"
              className="text-xs text-emerald-600 hover:text-emerald-700 font-medium"
            >
              Ver todos →
            </Link>
          </div>

          {!ultimosPacientes?.length ? (
            <div className="flex flex-col items-center justify-center py-12 text-center px-5">
              <Users className="w-8 h-8 text-zinc-200 mb-3" />
              <p className="text-sm font-medium text-zinc-400">
                Sin pacientes aún
              </p>
              <Link
                href="/pacientes/nuevo"
                className="mt-3 text-xs text-emerald-600 font-medium hover:underline"
              >
                + Agregar paciente
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-zinc-50">
              {ultimosPacientes.map((p: any) => (
                <Link
                  key={p.id}
                  href={`/pacientes/${p.id}`}
                  className="flex items-center gap-4 px-5 py-3.5 hover:bg-zinc-50 transition-colors group"
                >
                  <div className="w-8 h-8 rounded-full bg-zinc-100 flex items-center justify-center shrink-0 text-xs font-semibold text-zinc-600 group-hover:bg-emerald-50 group-hover:text-emerald-700 transition-colors">
                    {p.nombre[0]}
                    {p.apellidos[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-zinc-800 truncate">
                      {p.nombre} {p.apellidos}
                    </p>
                    <p className="text-xs text-zinc-400">
                      {objetivoLabel[p.objetivo] ?? "Sin objetivo"}
                    </p>
                  </div>
                  <span className="text-xs text-zinc-300 group-hover:text-emerald-500 transition-colors">
                    →
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
