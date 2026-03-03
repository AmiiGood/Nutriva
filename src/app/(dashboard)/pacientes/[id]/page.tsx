import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import PacientePerfilClient from "./paciente-perfil-client";

export default async function PacientePerfilPage({
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

  const [
    { data: paciente },
    { data: consultas },
    { data: planes },
    { data: citas },
  ] = await Promise.all([
    supabase
      .from("pacientes")
      .select("*")
      .eq("id", id)
      .eq("nutriologo_id", user.id)
      .single(),
    supabase
      .from("consultas")
      .select("*")
      .eq("paciente_id", id)
      .order("fecha", { ascending: true }),
    supabase
      .from("planes")
      .select("*")
      .eq("paciente_id", id)
      .order("created_at", { ascending: false }),
    supabase
      .from("citas")
      .select("*")
      .eq("paciente_id", id)
      .order("fecha_hora", { ascending: false })
      .limit(10),
  ]);

  if (!paciente) notFound();

  return (
    <PacientePerfilClient
      paciente={paciente}
      consultas={consultas ?? []}
      planes={planes ?? []}
      citas={citas ?? []}
    />
  );
}
