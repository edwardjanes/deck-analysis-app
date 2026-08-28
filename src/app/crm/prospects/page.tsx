import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import ProspectsClient from "./ProspectsClient";

export const dynamic = "force-dynamic";

export default async function ProspectsPage() {
  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("sc_admin")
    .eq("id", user.id)
    .single();

  if (!profile?.sc_admin) redirect("/dashboard");

  const { data: prospects } = await supabaseAdmin
    .from("sc_prospects")
    .select("*")
    .eq("archived", false)
    .order("updated_at", { ascending: false });

  return <ProspectsClient prospects={prospects ?? []} />;
}