import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import PlanesClient from "./planes-client";

export default async function PlanesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: planes } = await supabase
    .from("planes")
    .select("*, pacientes(nombre, apellidos)")
    .eq("nutriologo_id", user.id)
    .order("created_at", { ascending: false });

  return <PlanesClient planes={planes ?? []} />;
}
