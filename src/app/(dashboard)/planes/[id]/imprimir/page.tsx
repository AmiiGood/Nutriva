import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import PrintButtons from "./print-buttons";

function calcularMacros(alimento: any, cantidad: number) {
  const f = cantidad / 100;
  return {
    calorias: Math.round((alimento.calorias_por_100g ?? 0) * f),
    proteinas: +((alimento.proteinas_por_100g ?? 0) * f).toFixed(1),
    carbohidratos: +((alimento.carbohidratos_por_100g ?? 0) * f).toFixed(1),
    grasas: +((alimento.grasas_por_100g ?? 0) * f).toFixed(1),
  };
}

export default async function ImprimirPlanPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: plan }, { data: comidas }] = await Promise.all([
    supabase
      .from("planes")
      .select("*, pacientes(nombre, apellidos, fecha_nacimiento, genero)")
      .eq("id", id)
      .eq("nutriologo_id", user.id)
      .single(),
    supabase
      .from("plan_comidas")
      .select(
        "*, comida_items(*, alimentos(nombre, calorias_por_100g, proteinas_por_100g, carbohidratos_por_100g, grasas_por_100g))",
      )
      .eq("plan_id", id)
      .order("orden"),
  ]);

  const { data: nutriologo } = await supabase
    .from("nutriologos")
    .select("nombre, apellidos, email")
    .eq("id", user.id)
    .single();

  if (!plan) notFound();

  // Calcular totales globales
  const totales = comidas?.reduce(
    (acc, comida) => {
      const t = (comida.comida_items ?? []).reduce(
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

  const fechaGenerado = new Date().toLocaleDateString("es-MX", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <>
      <style>{`
        @media print {
          @page { margin: 1.5cm; }
          .no-print { display: none !important; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
        body { font-family: 'Georgia', serif; }
      `}</style>

      <PrintButtons />

      <div className="max-w-2xl mx-auto px-8 py-10 bg-white min-h-screen">
        {/* Header */}
        <div className="flex items-start justify-between mb-8 pb-6 border-b-2 border-zinc-900">
          <div>
            <h1 className="text-2xl font-bold text-zinc-900 mb-0.5">Nutriva</h1>
            <p className="text-xs text-zinc-400">
              Sistema de nutrición clínica
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-zinc-400">Generado el {fechaGenerado}</p>
            <p className="text-xs text-zinc-400 mt-0.5">
              Lic. {nutriologo?.nombre} {nutriologo?.apellidos}
            </p>
          </div>
        </div>

        {/* Info paciente y plan */}
        <div className="grid grid-cols-2 gap-6 mb-8">
          <div>
            <p className="text-[10px] text-zinc-400 uppercase tracking-widest font-medium mb-2">
              Paciente
            </p>
            <p className="text-lg font-bold text-zinc-900">
              {plan.pacientes?.nombre} {plan.pacientes?.apellidos}
            </p>
          </div>
          <div>
            <p className="text-[10px] text-zinc-400 uppercase tracking-widest font-medium mb-2">
              Plan alimenticio
            </p>
            <p className="text-lg font-bold text-zinc-900">{plan.nombre}</p>
            <p className="text-xs text-zinc-400 mt-0.5">
              {new Date(plan.fecha_inicio).toLocaleDateString("es-MX", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
              {plan.fecha_fin &&
                ` → ${new Date(plan.fecha_fin).toLocaleDateString("es-MX", { day: "numeric", month: "long", year: "numeric" })}`}
            </p>
          </div>
        </div>

        {/* Totales */}
        <div className="bg-zinc-50 rounded-xl p-5 mb-8">
          <p className="text-[10px] text-zinc-400 uppercase tracking-widest font-medium mb-3">
            Totales diarios
          </p>
          <div className="grid grid-cols-4 gap-4 text-center">
            {[
              {
                label: "Calorías",
                value: totales?.calorias,
                unit: "kcal",
                objetivo: plan.calorias_objetivo,
              },
              {
                label: "Proteínas",
                value: totales?.proteinas,
                unit: "g",
                objetivo: plan.proteinas_g,
              },
              {
                label: "Carbohidratos",
                value: totales?.carbohidratos,
                unit: "g",
                objetivo: plan.carbohidratos_g,
              },
              {
                label: "Grasas",
                value: totales?.grasas,
                unit: "g",
                objetivo: plan.grasas_g,
              },
            ].map((m) => (
              <div key={m.label}>
                <p className="text-2xl font-bold text-zinc-900">
                  {m.value}
                  <span className="text-sm font-normal text-zinc-500 ml-0.5">
                    {m.unit}
                  </span>
                </p>
                <p className="text-xs text-zinc-500">{m.label}</p>
                {m.objetivo && (
                  <p className="text-[10px] text-zinc-400">
                    meta: {m.objetivo}
                    {m.unit}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Comidas */}
        <div className="space-y-6">
          {(comidas ?? []).map((comida) => {
            const totalesComida = (comida.comida_items ?? []).reduce(
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

            return (
              <div key={comida.id}>
                {/* Header comida */}
                <div className="flex items-center justify-between mb-2 pb-1.5 border-b border-zinc-200">
                  <h2 className="text-sm font-bold text-zinc-900 uppercase tracking-wide">
                    {comida.nombre}
                  </h2>
                  <p className="text-xs text-zinc-400">
                    {totalesComida.calorias} kcal
                  </p>
                </div>

                {/* Items */}
                {(comida.comida_items ?? []).length === 0 ? (
                  <p className="text-xs text-zinc-300 italic">Sin alimentos</p>
                ) : (
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="text-zinc-400">
                        <th className="text-left font-medium pb-1.5">
                          Alimento
                        </th>
                        <th className="text-right font-medium pb-1.5">
                          Cantidad
                        </th>
                        <th className="text-right font-medium pb-1.5">kcal</th>
                        <th className="text-right font-medium pb-1.5">Prot.</th>
                        <th className="text-right font-medium pb-1.5">
                          Carbs.
                        </th>
                        <th className="text-right font-medium pb-1.5">
                          Grasas
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100">
                      {comida.comida_items.map((item: any) => {
                        const m = calcularMacros(
                          item.alimentos,
                          item.cantidad_g,
                        );
                        return (
                          <tr key={item.id} className="text-zinc-700">
                            <td className="py-1.5 capitalize">
                              {item.alimentos?.nombre}
                            </td>
                            <td className="py-1.5 text-right">
                              {item.cantidad_g}g
                            </td>
                            <td className="py-1.5 text-right font-medium">
                              {m.calorias}
                            </td>
                            <td className="py-1.5 text-right">
                              {m.proteinas}g
                            </td>
                            <td className="py-1.5 text-right">
                              {m.carbohidratos}g
                            </td>
                            <td className="py-1.5 text-right">{m.grasas}g</td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot>
                      <tr className="text-zinc-500 font-medium border-t border-zinc-200">
                        <td className="pt-1.5" colSpan={2}>
                          Total
                        </td>
                        <td className="pt-1.5 text-right">
                          {totalesComida.calorias}
                        </td>
                        <td className="pt-1.5 text-right">
                          {totalesComida.proteinas}g
                        </td>
                        <td className="pt-1.5 text-right">
                          {totalesComida.carbohidratos}g
                        </td>
                        <td className="pt-1.5 text-right">
                          {totalesComida.grasas}g
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                )}
              </div>
            );
          })}
        </div>

        {/* Notas */}
        {plan.notas && (
          <div className="mt-8 pt-6 border-t border-zinc-200">
            <p className="text-[10px] text-zinc-400 uppercase tracking-widest font-medium mb-2">
              Notas y recomendaciones
            </p>
            <p className="text-sm text-zinc-600 leading-relaxed">
              {plan.notas}
            </p>
          </div>
        )}

        {/* Footer */}
        <div className="mt-12 pt-6 border-t border-zinc-200 flex items-center justify-between">
          <p className="text-xs text-zinc-400">
            Nutriva · Sistema de nutrición clínica
          </p>
          <p className="text-xs text-zinc-400">{nutriologo?.email}</p>
        </div>
      </div>
    </>
  );
}
