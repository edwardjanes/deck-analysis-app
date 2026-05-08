import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";

// GET /api/crm/investors?q=fintech&stage=seed&geo=UK&sector=saas&page=0
export async function GET(req: NextRequest) {
  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("crm_access")
    .eq("id", user.id)
    .single();

  if (!profile?.crm_access) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim() ?? "";
  const stage = searchParams.get("stage") ?? "";
  const geo = searchParams.get("geo") ?? "";
  const sector = searchParams.get("sector") ?? "";
  const page = parseInt(searchParams.get("page") ?? "0", 10);
  const pageSize = 20;

  let query = supabaseAdmin
    .from("investor_profiles")
    .select("id, fund_name, contact_name, role, email, linkedin_url, stage_focus, geography, sector_focus, check_size_min, check_size_max, thesis_notes, verified", { count: "exact" })
    .range(page * pageSize, page * pageSize + pageSize - 1)
    .order("verified", { ascending: false })
    .order("fund_name", { ascending: true });

  if (q) {
    query = query.textSearch("search_vector", q, { type: "websearch" });
  }
  if (stage) {
    query = query.contains("stage_focus", [stage]);
  }
  if (geo) {
    query = query.contains("geography", [geo]);
  }
  if (sector) {
    query = query.contains("sector_focus", [sector]);
  }

  const { data, error, count } = await query;

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ investors: data, total: count ?? 0, page, pageSize });
}
