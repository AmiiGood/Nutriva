import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import NuevoPlanClient from "./nuevo-plan-client";

export default async function NuevoPlanPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: pacientes }, { data: plantillas }] = await Promise.all([
    supabase
      .from("pacientes")
      .select("id, nombre, apellidos")
      .eq("nutriologo_id", user.id)
      .eq("activo", true)
      .order("nombre"),
    supabase
      .from("plan_plantillas")
      .select("id, nombre, descripcion")
      .eq("nutriologo_id", user.id)
      .order("nombre"),
  ]);

  return (
    <NuevoPlanClient
      pacientes={pacientes ?? []}
      plantillas={plantillas ?? []}
    />
  );
}
