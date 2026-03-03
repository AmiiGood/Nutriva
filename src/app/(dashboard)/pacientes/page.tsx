import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import PacientesClient from "./pacientes-client";

export default async function PacientesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: pacientes } = await supabase
    .from("pacientes")
    .select("*")
    .eq("nutriologo_id", user.id)
    .order("created_at", { ascending: false });

  return <PacientesClient pacientes={pacientes ?? []} />;
}
