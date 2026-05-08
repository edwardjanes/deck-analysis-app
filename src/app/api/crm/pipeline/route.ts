import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";

async function getCrmUser(req: NextRequest) {
  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("crm_access")
    .eq("id", user.id)
    .single();

  if (!profile?.crm_access) return null;
  return user;
}

// GET /api/crm/pipeline — list user's pipeline
export async function GET(req: NextRequest) {
  const user = await getCrmUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data, error } = await supabaseAdmin
    .from("pipeline_investors")
    .select("*")
    .eq("user_id", user.id)
    .eq("archived", false)
    .order("updated_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ investors: data });
}

// POST /api/crm/pipeline — add investor to pipeline
export async function POST(req: NextRequest) {
  const user = await getCrmUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { fund_name, contact_name, role, email, linkedin_url, stage_focus, geography,
    sector_focus, check_size_min, check_size_max, thesis_notes, investor_profile_id } = body;

  if (!fund_name) return NextResponse.json({ error: "fund_name is required" }, { status: 400 });

  const { data, error } = await supabaseAdmin
    .from("pipeline_investors")
    .insert({
      user_id: user.id,
      investor_profile_id: investor_profile_id ?? null,
      fund_name,
      contact_name: contact_name ?? null,
      role: role ?? null,
      email: email ?? null,
      linkedin_url: linkedin_url ?? null,
      stage_focus: stage_focus ?? [],
      geography: geography ?? [],
      sector_focus: sector_focus ?? [],
      check_size_min: check_size_min ?? null,
      check_size_max: check_size_max ?? null,
      thesis_notes: thesis_notes ?? null,
      stage: "researching",
    })
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ investor: data }, { status: 201 });
}
