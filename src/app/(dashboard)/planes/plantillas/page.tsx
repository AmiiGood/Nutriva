import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import PlantillasClient from "./plantillas-client";

export default async function PlantillasPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: plantillas } = await supabase
    .from("plan_plantillas")
    .select("*, plantilla_comidas(id)")
    .eq("nutriologo_id", user.id)
    .order("created_at", { ascending: false });

  return <PlantillasClient plantillas={plantillas ?? []} />;
}
