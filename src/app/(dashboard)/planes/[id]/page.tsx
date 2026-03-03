import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import PlanDetalleClient from "./plan-detalle-client";

export default async function PlanDetallePage({
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
      .select("*, pacientes(id, nombre, apellidos)")
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

  if (!plan) notFound();

  return <PlanDetalleClient plan={plan} comidasIniciales={comidas ?? []} />;
}
