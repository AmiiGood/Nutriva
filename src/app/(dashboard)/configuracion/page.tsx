import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import ConfiguracionClient from "./configuracion-client";

export default async function ConfiguracionPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: nutriologo } = await supabase
    .from("nutriologos")
    .select("*")
    .eq("id", user.id)
    .single();

  return (
    <ConfiguracionClient nutriologo={nutriologo} email={user.email ?? ""} />
  );
}
