import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import PipelineClient from "./PipelineClient";

export const dynamic = "force-dynamic";

export default async function PipelinePage() {
  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: investors } = await supabaseAdmin
    .from("pipeline_investors")
    .select("*")
    .eq("user_id", user.id)
    .eq("archived", false)
    .order("updated_at", { ascending: false });

  return <PipelineClient investors={investors ?? []} />;
}
