import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import PlantillaEditorClient from "./plantilla-editor-client";

export default async function PlantillaEditorPage({
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

  const [{ data: plantilla }, { data: comidas }] = await Promise.all([
    supabase
      .from("plan_plantillas")
      .select("*")
      .eq("id", id)
      .eq("nutriologo_id", user.id)
      .single(),
    supabase
      .from("plantilla_comidas")
      .select(
        "*, plantilla_comida_items(*, alimentos(nombre, calorias_por_100g, proteinas_por_100g, carbohidratos_por_100g, grasas_por_100g))",
      )
      .eq("plantilla_id", id)
      .order("orden"),
  ]);

  if (!plantilla) notFound();

  return (
    <PlantillaEditorClient
      plantilla={plantilla}
      comidasIniciales={comidas ?? []}
    />
  );
}
