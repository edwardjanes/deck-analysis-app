import { redirect, notFound } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import ProspectDetail from "./ProspectDetail";

export const dynamic = "force-dynamic";

export default async function ProspectDetailPage({ params }: { params: { id: string } }) {
  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabaseAdmin
    .from("profiles").select("sc_admin").eq("id", user.id).single();
  if (!profile?.sc_admin) redirect("/dashboard");

  const { data: prospect } = await supabaseAdmin
    .from("sc_prospects").select("*").eq("id", params.id).single();
  if (!prospect) notFound();

  const { data: touchpoints } = await supabaseAdmin
    .from("sc_touchpoints")
    .select("*")
    .eq("prospect_id", params.id)
    .order("occurred_at", { ascending: false });

  return <ProspectDetail prospect={{ ...prospect, touchpoints: touchpoints ?? [] }} />;
}