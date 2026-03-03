import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import CitasClient from "./citas-client";

export default async function CitasPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: citas }, { data: pacientes }] = await Promise.all([
    supabase
      .from("citas")
      .select("*, pacientes(nombre, apellidos)")
      .eq("nutriologo_id", user.id)
      .order("fecha_hora"),
    supabase
      .from("pacientes")
      .select("id, nombre, apellidos")
      .eq("nutriologo_id", user.id)
      .eq("activo", true)
      .order("nombre"),
  ]);

  return <CitasClient citas={citas ?? []} pacientes={pacientes ?? []} />;
}
