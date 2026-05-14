import { redirect, notFound } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import ContactProfileClient from "./ContactProfileClient";
import { InvestorContact, InvestorFirm } from "@/lib/crm/types";

export const dynamic = "force-dynamic";

export default async function ContactProfilePage({ params }: { params: { id: string } }) {
  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: contact } = await supabaseAdmin
    .from("investor_contacts")
    .select("*")
    .eq("id", params.id)
    .single();

  if (!contact) notFound();

  let firm: InvestorFirm | null = null;
  if (contact.investor_firm_id) {
    const { data } = await supabaseAdmin
      .from("investor_firms")
      .select("*")
      .eq("id", contact.investor_firm_id)
      .single();
    firm = data as InvestorFirm | null;
  }

  return <ContactProfileClient contact={contact as InvestorContact} firm={firm} />;
}
