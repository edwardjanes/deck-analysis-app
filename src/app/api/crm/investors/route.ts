import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";

// GET /api/crm/investors?q=fintech&stage=seed&geo=UK&sector=saas&type=vc&page=0
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
  const q       = searchParams.get("q")?.trim() ?? "";
  const stage   = searchParams.get("stage") ?? "";
  const geo     = searchParams.get("geo") ?? "";
  const sector  = searchParams.get("sector") ?? "";
  const type    = searchParams.get("type") ?? "";
  const page    = parseInt(searchParams.get("page") ?? "0", 10);
  const pageSize = 20;

  // Query investor_firms with their contacts joined
  let firmsQuery = supabaseAdmin
    .from("investor_firms")
    .select(`
      id, name, type, website, description,
      stage_focus, geography, sector_focus,
      check_size_min, check_size_max, thesis_notes,
      verified, source, created_at,
      investor_contacts (
        id, first_name, last_name, role, email, linkedin_url, location, bio
      )
    `, { count: "exact" })
    .order("verified", { ascending: false })
    .order("name", { ascending: true })
    .range(page * pageSize, page * pageSize + pageSize - 1);

  if (q)      firmsQuery = firmsQuery.textSearch("search_vector", q, { type: "websearch" });
  if (stage)  firmsQuery = firmsQuery.contains("stage_focus", [stage]);
  if (geo)    firmsQuery = firmsQuery.contains("geography", [geo]);
  if (sector) firmsQuery = firmsQuery.contains("sector_focus", [sector]);
  if (type)   firmsQuery = firmsQuery.eq("type", type);

  const { data: firms, error: firmsError, count } = await firmsQuery;
  if (firmsError) return NextResponse.json({ error: firmsError.message }, { status: 500 });

  // Also fetch solo angels (contacts with no firm) when no firm-specific filters
  let angels: unknown[] = [];
  if (!type || type === "angel") {
    let angelsQuery = supabaseAdmin
      .from("investor_contacts")
      .select("id, first_name, last_name, role, email, linkedin_url, location, bio, verified")
      .is("investor_firm_id", null)
      .order("last_name", { ascending: true });

    if (q) angelsQuery = angelsQuery.textSearch("search_vector", q, { type: "websearch" });

    const { data } = await angelsQuery;
    angels = data ?? [];
  }

  return NextResponse.json({
    firms: firms ?? [],
    angels,
    total: count ?? 0,
    page,
    pageSize,
  });
}
