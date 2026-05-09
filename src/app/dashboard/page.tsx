import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import DashboardClient from "./DashboardClient";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Fetch profile
  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("first_name, plan, analyses_used, crm_access")
    .eq("id", user.id)
    .single();

  // Fetch analysis history for this user
  const { data: analyses } = await supabaseAdmin
    .from("deck_submissions")
    .select("id, business_name, created_at, status, score, analysis_json")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(50);

  // Fetch pipeline data if user has CRM access
  let pipelineStageCounts: Record<string, number> = {};
  let raiseCommitted = 0;
  let raiseTarget = 0;

  if (profile?.crm_access) {
    const [{ data: pipeline }, { data: committed }, { data: activeProject }] = await Promise.all([
      supabaseAdmin.from("pipeline_investors").select("stage").eq("user_id", user.id).eq("archived", false),
      supabaseAdmin.from("pipeline_investors").select("check_size_min").eq("user_id", user.id).eq("stage", "committed").eq("archived", false),
      supabaseAdmin.from("raise_projects").select("target_raise").eq("owner_id", user.id).eq("status", "active").order("created_at", { ascending: false }).limit(1).maybeSingle(),
    ]);

    if (pipeline) {
      for (const row of pipeline) {
        pipelineStageCounts[row.stage] = (pipelineStageCounts[row.stage] ?? 0) + 1;
      }
    }

    raiseCommitted = (committed ?? []).reduce((sum: number, r: { check_size_min: number | null }) => sum + (r.check_size_min ?? 0), 0);
    raiseTarget = parseRaiseTarget(activeProject?.target_raise ?? null);
  }

  const firstName = profile?.first_name ?? user.email?.split("@")[0] ?? "there";
  const plan = profile?.plan ?? "free";
  const analysesUsed = profile?.analyses_used ?? 0;

  return (
    <DashboardClient
      firstName={firstName}
      plan={plan}
      analysesUsed={analysesUsed}
      analyses={analyses ?? []}
      userId={user.id}
      userEmail={user.email ?? ""}
      crmAccess={profile?.crm_access ?? false}
      pipelineStageCounts={pipelineStageCounts}
      raiseCommitted={raiseCommitted}
      raiseTarget={raiseTarget}
    />
  );
}

function parseRaiseTarget(text: string | null): number {
  if (!text) return 0;
  const clean = text.replace(/[£$€,\s]/g, "").toLowerCase();
  const num = parseFloat(clean);
  if (isNaN(num)) return 0;
  if (clean.endsWith("m")) return num * 1_000_000;
  if (clean.endsWith("k")) return num * 1_000;
  return num;
}
