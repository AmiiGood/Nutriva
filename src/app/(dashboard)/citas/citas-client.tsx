"use client";

import { useState, useCallback } from "react";
import { Calendar, dateFnsLocalizer, Views, View } from "react-big-calendar";
import { format, parse, startOfWeek, getDay, addMinutes } from "date-fns";
import { es } from "date-fns/locale";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import {
  X,
  Calendar as CalendarIcon,
  Clock,
  User,
  FileText,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Label } from "@/components/ui/label";
import "react-big-calendar/lib/css/react-big-calendar.css";

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 1 }),
  getDay,
  locales: { es },
});

const ESTADOS = ["pendiente", "confirmada", "completada", "cancelada"] as const;
type Estado = (typeof ESTADOS)[number];

const ESTADO_COLOR: Record<Estado, string> = {
  pendiente: "#f59e0b",
  confirmada: "#10b981",
  completada: "#6366f1",
  cancelada: "#ef4444",
};

const ESTADO_BG: Record<Estado, string> = {
  pendiente: "bg-amber-50 text-amber-600 border-amber-200",
  confirmada: "bg-emerald-50 text-emerald-600 border-emerald-200",
  completada: "bg-violet-50 text-violet-600 border-violet-200",
  cancelada: "bg-red-50 text-red-500 border-red-200",
};

const inputClass =
  "w-full h-10 px-3.5 rounded-lg border border-zinc-200 bg-zinc-50 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20 transition";
const selectClass =
  "w-full h-10 px-3.5 rounded-lg border border-zinc-200 bg-zinc-50 text-sm text-zinc-700 focus:outline-none focus:border-emerald-400 appearance-none cursor-pointer";

export default function CitasClient({
  citas: citasIniciales,
  pacientes,
}: {
  citas: any[];
  pacientes: any[];
}) {
  const [citas, setCitas] = useState(citasIniciales);
  const [view, setView] = useState<View>(Views.MONTH);
  const [date, setDate] = useState(new Date());
  const [modal, setModal] = useState<"nueva" | "detalle" | null>(null);
  const [citaSeleccionada, setCitaSeleccionada] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [slotSeleccionado, setSlotSeleccionado] = useState<Date | null>(null);

  const [form, setForm] = useState({
    paciente_id: "",
    fecha: "",
    hora: "09:00",
    duracion_min: "60",
    estado: "pendiente" as Estado,
    notas: "",
  });

  function handleChange(
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  // Convertir citas a eventos del calendario
  const eventos = citas.map((c) => ({
    id: c.id,
    title: `${c.pacientes?.nombre} ${c.pacientes?.apellidos}`,
    start: new Date(c.fecha_hora),
    end: addMinutes(new Date(c.fecha_hora), c.duracion_min ?? 60),
    resource: c,
  }));

  // Click en slot vacío → abrir modal nueva cita
  const handleSelectSlot = useCallback(({ start }: { start: Date }) => {
    const fecha = format(start, "yyyy-MM-dd");
    const hora = format(start, "HH:mm");
    setForm({
      paciente_id: "",
      fecha,
      hora,
      duracion_min: "60",
      estado: "pendiente",
      notas: "",
    });
    setSlotSeleccionado(start);
    setModal("nueva");
  }, []);

  // Click en evento → ver detalle
  const handleSelectEvent = useCallback((evento: any) => {
    setCitaSeleccionada(evento.resource);
    setModal("detalle");
  }, []);

  async function handleCrear(e: React.FormEvent) {
    e.preventDefault();
    if (!form.paciente_id || !form.fecha) return;
    setLoading(true);

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const fecha_hora = `${form.fecha}T${form.hora}:00-06:00`

    const { data, error } = await supabase
      .from("citas")
      .insert({
        nutriologo_id: user.id,
        paciente_id: form.paciente_id,
        fecha_hora,
        duracion_min: Number(form.duracion_min),
        estado: form.estado,
        notas: form.notas || null,
      })
      .select("*, pacientes(nombre, apellidos)")
      .single();

    if (!error && data) {
      setCitas((prev) => [...prev, data]);
      setModal(null);
    }
    setLoading(false);
  }

  async function handleActualizarEstado(citaId: string, estado: Estado) {
    const supabase = createClient();
    await supabase.from("citas").update({ estado }).eq("id", citaId);
    setCitas((prev) =>
      prev.map((c) => (c.id === citaId ? { ...c, estado } : c)),
    );
    setCitaSeleccionada((prev: any) => (prev ? { ...prev, estado } : prev));
  }

  async function handleEliminar(citaId: string) {
    if (!confirm("¿Eliminar esta cita?")) return;
    const supabase = createClient();
    await supabase.from("citas").delete().eq("id", citaId);
    setCitas((prev) => prev.filter((c) => c.id !== citaId));
    setModal(null);
  }

  // Estilo de eventos por estado
  const eventPropGetter = useCallback(
    (event: any) => ({
      style: {
        backgroundColor:
          ESTADO_COLOR[event.resource.estado as Estado] ?? "#10b981",
        borderRadius: "6px",
        border: "none",
        fontSize: "11px",
        fontWeight: "500",
        padding: "2px 6px",
      },
    }),
    [],
  );

  return (
    <>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-zinc-900">Citas</h1>
            <p className="text-sm text-zinc-400 mt-0.5">
              {citas.length} citas registradas
            </p>
          </div>
          <button
            onClick={() => {
              const hoy = format(new Date(), "yyyy-MM-dd");
              setForm({
                paciente_id: "",
                fecha: hoy,
                hora: "09:00",
                duracion_min: "60",
                estado: "pendiente",
                notas: "",
              });
              setModal("nueva");
            }}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-sm font-medium text-white transition-colors"
          >
            <CalendarIcon className="w-4 h-4" />
            Nueva cita
          </button>
        </div>

        {/* Leyenda */}
        <div className="flex items-center gap-4">
          {ESTADOS.map((estado) => (
            <div key={estado} className="flex items-center gap-1.5">
              <div
                className="w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: ESTADO_COLOR[estado] }}
              />
              <span className="text-xs text-zinc-500 capitalize">{estado}</span>
            </div>
          ))}
        </div>

        {/* Calendario */}
        <div className="bg-white rounded-xl border border-zinc-100 overflow-hidden p-4">
          <style>{`
            .rbc-calendar { font-family: inherit; }
            .rbc-header { padding: 8px 0; font-size: 12px; font-weight: 600; color: #71717a; border-bottom: 1px solid #f4f4f5; }
            .rbc-month-view { border: none; border-radius: 12px; overflow: hidden; }
            .rbc-day-bg { border-color: #f4f4f5 !important; }
            .rbc-today { background-color: #f0fdf4 !important; }
            .rbc-off-range-bg { background-color: #fafafa; }
            .rbc-date-cell { padding: 4px 8px; font-size: 12px; color: #71717a; }
            .rbc-date-cell.rbc-now { font-weight: 700; color: #10b981; }
            .rbc-toolbar { display: none; }
            .rbc-month-row { border-color: #f4f4f5; }
            .rbc-event:focus { outline: none; }
            .rbc-show-more { font-size: 11px; color: #10b981; font-weight: 500; }
          `}</style>

          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-zinc-900 capitalize">
              {format(
                date,
                view === Views.DAY ? "EEEE d 'de' MMMM yyyy" : "MMMM yyyy",
                { locale: es },
              )}
            </h2>
            <div className="flex items-center gap-2">
              {/* Vistas */}
              <div className="flex rounded-lg border border-zinc-200 overflow-hidden text-xs">
                {([Views.MONTH, Views.WEEK, Views.DAY] as const).map((v) => (
                  <button
                    key={v}
                    onClick={() => setView(v)}
                    className={`px-3 h-8 font-medium transition-colors ${
                      view === v
                        ? "bg-emerald-500 text-white"
                        : "bg-white text-zinc-500 hover:bg-zinc-50"
                    }`}
                  >
                    {v === Views.MONTH
                      ? "Mes"
                      : v === Views.WEEK
                        ? "Semana"
                        : "Día"}
                  </button>
                ))}
              </div>

              {/* Navegación */}
              <button
                onClick={() =>
                  setDate((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1))
                }
                className="w-8 h-8 flex items-center justify-center rounded-lg border border-zinc-200 hover:bg-zinc-50 transition-colors"
              >
                <ChevronLeft className="w-4 h-4 text-zinc-500" />
              </button>
              <button
                onClick={() => setDate(new Date())}
                className="px-3 h-8 text-xs font-medium rounded-lg border border-zinc-200 hover:bg-zinc-50 transition-colors text-zinc-600"
              >
                Hoy
              </button>
              <button
                onClick={() =>
                  setDate((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1))
                }
                className="w-8 h-8 flex items-center justify-center rounded-lg border border-zinc-200 hover:bg-zinc-50 transition-colors"
              >
                <ChevronRight className="w-4 h-4 text-zinc-500" />
              </button>
            </div>
          </div>

          <Calendar
            localizer={localizer}
            events={eventos}
            view={view}
            date={date}
            onView={setView}
            onNavigate={setDate}
            onSelectSlot={handleSelectSlot}
            onSelectEvent={handleSelectEvent}
            selectable
            eventPropGetter={eventPropGetter}
            style={{ height: 600 }}
            messages={{
              showMore: (total) => `+${total} más`,
              noEventsInRange: "Sin citas en este período",
            }}
          />
        </div>
      </div>

      {/* Modal Nueva Cita */}
      <AnimatePresence>
        {modal === "nueva" && (
          <Modal onClose={() => setModal(null)} title="Nueva cita">
            <form onSubmit={handleCrear} className="space-y-4">
              <ModalField label="Paciente *">
                <select
                  name="paciente_id"
                  value={form.paciente_id}
                  onChange={handleChange}
                  required
                  className={selectClass}
                >
                  <option value="">Seleccionar paciente</option>
                  {pacientes.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nombre} {p.apellidos}
                    </option>
                  ))}
                </select>
              </ModalField>

              <div className="grid grid-cols-2 gap-3">
                <ModalField label="Fecha *">
                  <input
                    name="fecha"
                    type="date"
                    value={form.fecha}
                    onChange={handleChange}
                    required
                    className={inputClass}
                  />
                </ModalField>
                <ModalField label="Hora *">
                  <input
                    name="hora"
                    type="time"
                    value={form.hora}
                    onChange={handleChange}
                    required
                    className={inputClass}
                  />
                </ModalField>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <ModalField label="Duración (min)">
                  <select
                    name="duracion_min"
                    value={form.duracion_min}
                    onChange={handleChange}
                    className={selectClass}
                  >
                    {[30, 45, 60, 90, 120].map((m) => (
                      <option key={m} value={m}>
                        {m} min
                      </option>
                    ))}
                  </select>
                </ModalField>
                <ModalField label="Estado">
                  <select
                    name="estado"
                    value={form.estado}
                    onChange={handleChange}
                    className={selectClass}
                  >
                    {ESTADOS.map((e) => (
                      <option key={e} value={e} className="capitalize">
                        {e}
                      </option>
                    ))}
                  </select>
                </ModalField>
              </div>

              <ModalField label="Notas">
                <textarea
                  name="notas"
                  value={form.notas}
                  onChange={handleChange}
                  placeholder="Observaciones de la cita..."
                  rows={2}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-zinc-200 bg-zinc-50 text-sm placeholder:text-zinc-400 focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20 transition resize-none"
                />
              </ModalField>

              <div className="flex gap-2 pt-2">
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
                    "Guardar cita"
                  )}
                </button>
              </div>
            </form>
          </Modal>
        )}
      </AnimatePresence>

      {/* Modal Detalle Cita */}
      <AnimatePresence>
        {modal === "detalle" && citaSeleccionada && (
          <Modal onClose={() => setModal(null)} title="Detalle de cita">
            <div className="space-y-4">
              {/* Paciente */}
              <div className="flex items-center gap-3 p-3 bg-zinc-50 rounded-lg">
                <div className="w-9 h-9 rounded-full bg-emerald-100 flex items-center justify-center text-xs font-bold text-emerald-700">
                  {citaSeleccionada.pacientes?.nombre?.[0]}
                  {citaSeleccionada.pacientes?.apellidos?.[0]}
                </div>
                <div>
                  <p className="text-sm font-medium text-zinc-800">
                    {citaSeleccionada.pacientes?.nombre}{" "}
                    {citaSeleccionada.pacientes?.apellidos}
                  </p>
                  <p className="text-xs text-zinc-400">Paciente</p>
                </div>
              </div>

              {/* Info */}
              <div className="space-y-2">
                {[
                  {
                    icon: CalendarIcon,
                    label: "Fecha",
                    value: new Date(
                      citaSeleccionada.fecha_hora,
                    ).toLocaleDateString("es-MX", {
                      weekday: "long",
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                      timeZone: "America/Mexico_City",
                    }),
                  },
                  {
                    icon: Clock,
                    label: "Hora",
                    value: `${new Date(
                      citaSeleccionada.fecha_hora,
                    ).toLocaleTimeString("es-MX", {
                      hour: "2-digit",
                      minute: "2-digit",
                      timeZone: "America/Mexico_City",
                    })} · ${citaSeleccionada.duracion_min} min`,
                  },
                ].map(({ icon: Icon, label, value }) => (
                  <div key={label} className="flex items-center gap-3">
                    <Icon className="w-4 h-4 text-zinc-400 shrink-0" />
                    <div>
                      <p className="text-xs text-zinc-400">{label}</p>
                      <p className="text-sm text-zinc-700 capitalize">
                        {value}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Estado */}
              <div>
                <p className="text-xs text-zinc-400 mb-2">Estado</p>
                <div className="flex gap-2 flex-wrap">
                  {ESTADOS.map((estado) => (
                    <button
                      key={estado}
                      onClick={() =>
                        handleActualizarEstado(citaSeleccionada.id, estado)
                      }
                      className={`px-3 py-1.5 rounded-lg border text-xs font-medium capitalize transition-all ${
                        citaSeleccionada.estado === estado
                          ? ESTADO_BG[estado]
                          : "border-zinc-200 text-zinc-400 hover:border-zinc-300"
                      }`}
                    >
                      {estado}
                    </button>
                  ))}
                </div>
              </div>

              {/* Notas */}
              {citaSeleccionada.notas && (
                <div className="flex items-start gap-3">
                  <FileText className="w-4 h-4 text-zinc-400 shrink-0 mt-0.5" />
                  <p className="text-sm text-zinc-600">
                    {citaSeleccionada.notas}
                  </p>
                </div>
              )}

              <button
                onClick={() => handleEliminar(citaSeleccionada.id)}
                className="w-full h-9 rounded-lg border border-red-100 text-xs font-medium text-red-400 hover:bg-red-50 transition-colors mt-2"
              >
                Eliminar cita
              </button>
            </div>
          </Modal>
        )}
      </AnimatePresence>
    </>
  );
}

function Modal({
  children,
  onClose,
  title,
}: {
  children: React.ReactNode;
  onClose: () => void;
  title: string;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/20 backdrop-blur-sm"
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 8 }}
        transition={{ duration: 0.2 }}
        className="relative bg-white rounded-2xl shadow-xl w-full max-w-md p-6 z-10"
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-semibold text-zinc-900">{title}</h2>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-600 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        {children}
      </motion.div>
    </div>
  );
}

function ModalField({
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
