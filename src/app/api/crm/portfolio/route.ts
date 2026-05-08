import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";

async function getCrmUser() {
  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: profile } = await supabaseAdmin.from("profiles").select("crm_access").eq("id", user.id).single();
  if (!profile?.crm_access) return null;
  return user;
}

// POST /api/crm/portfolio — add a portfolio company
export async function POST(req: NextRequest) {
  const user = await getCrmUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { pipeline_investor_id, company_name, website, sector, stage_at_investment, year, notes } = await req.json();
  if (!pipeline_investor_id || !company_name) {
    return NextResponse.json({ error: "pipeline_investor_id and company_name required" }, { status: 400 });
  }

  // Verify ownership
  const { data: inv } = await supabaseAdmin.from("pipeline_investors").select("id").eq("id", pipeline_investor_id).eq("user_id", user.id).single();
  if (!inv) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { data, error } = await supabaseAdmin
    .from("portfolio_companies")
    .insert({ user_id: user.id, pipeline_investor_id, company_name, website: website || null, sector: sector || null, stage_at_investment: stage_at_investment || null, year: year || null, notes: notes || null })
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ company: data }, { status: 201 });
}

// DELETE /api/crm/portfolio?id=xxx
export async function DELETE(req: NextRequest) {
  const user = await getCrmUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const id = new URL(req.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const { error } = await supabaseAdmin.from("portfolio_companies").delete().eq("id", id).eq("user_id", user.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
