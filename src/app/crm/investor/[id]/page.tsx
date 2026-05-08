import { redirect, notFound } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import InvestorDetailClient from "./InvestorDetailClient";

export const dynamic = "force-dynamic";

export default async function InvestorDetailPage({ params }: { params: { id: string } }) {
  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: investor }, { data: touchpoints }, { data: portfolio }] = await Promise.all([
    supabaseAdmin
      .from("pipeline_investors")
      .select("*")
      .eq("id", params.id)
      .eq("user_id", user.id)
      .single(),
    supabaseAdmin
      .from("touchpoints")
      .select("*")
      .eq("pipeline_investor_id", params.id)
      .order("occurred_at", { ascending: false }),
    supabaseAdmin
      .from("portfolio_companies")
      .select("*")
      .eq("pipeline_investor_id", params.id)
      .order("year", { ascending: false }),
  ]);

  if (!investor) notFound();

  return <InvestorDetailClient investor={investor} touchpoints={touchpoints ?? []} portfolio={portfolio ?? []} />;
}
