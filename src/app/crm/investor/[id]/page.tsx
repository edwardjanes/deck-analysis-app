import { redirect, notFound } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import InvestorDetailClient from "./InvestorDetailClient";
import { InvestorFirm, InvestorContact } from "@/lib/crm/types";

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

  // If this pipeline investor is linked to a firm, fetch the firm + its contacts
  let firm: InvestorFirm | null = null;
  let firmContacts: InvestorContact[] = [];

  if (investor.investor_firm_id) {
    const [{ data: firmData }, { data: contactsData }] = await Promise.all([
      supabaseAdmin
        .from("investor_firms")
        .select("*")
        .eq("id", investor.investor_firm_id)
        .single(),
      supabaseAdmin
        .from("investor_contacts")
        .select("*")
        .eq("investor_firm_id", investor.investor_firm_id)
        .order("last_name", { ascending: true }),
    ]);
    firm = firmData as InvestorFirm | null;
    firmContacts = (contactsData ?? []) as InvestorContact[];
  }

  return (
    <InvestorDetailClient
      investor={investor}
      touchpoints={touchpoints ?? []}
      portfolio={portfolio ?? []}
      firm={firm}
      firmContacts={firmContacts}
    />
  );
}
