import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import AlimentosClient from "./alimentos-client";

export default async function AlimentosPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: alimentos } = await supabase
    .from("alimentos")
    .select("*")
    .or(`nutriologo_id.is.null,nutriologo_id.eq.${user.id}`)
    .order("nombre");

  return <AlimentosClient alimentos={alimentos ?? []} userId={user.id} />;
}
