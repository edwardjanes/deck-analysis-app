import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";

async function getScAdmin() {
  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("sc_admin")
    .eq("id", user.id)
    .single();

  if (!profile?.sc_admin) return null;
  return user;
}

// GET /api/crm/prospects
export async function GET(req: NextRequest) {
  const user = await getScAdmin();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const stage = searchParams.get("stage");
  const archived = searchParams.get("archived") === "true";

  let query = supabaseAdmin
    .from("sc_prospects")
    .select("*")
    .eq("archived", archived)
    .order("updated_at", { ascending: false });

  if (stage) query = query.eq("stage", stage);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ prospects: data });
}

// POST /api/crm/prospects
export async function POST(req: NextRequest) {
  const user = await getScAdmin();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const {
    first_name, last_name, email, linkedin_url,
    company_name, role, location, stage, notes,
    source, hubspot_id, next_follow_up_date, follow_up_note,
  } = body;

  if (!first_name?.trim()) {
    return NextResponse.json({ error: "first_name is required" }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from("sc_prospects")
    .insert({
      first_name: first_name.trim(),
      last_name: last_name?.trim() ?? null,
      email: email?.trim() ?? null,
      linkedin_url: linkedin_url?.trim() ?? null,
      company_name: company_name?.trim() ?? null,
      role: role?.trim() ?? null,
      location: location?.trim() ?? null,
      stage: stage ?? "connection_request",
      notes: notes?.trim() ?? null,
      source: source ?? "linkedin",
      hubspot_id: hubspot_id ?? null,
      next_follow_up_date: next_follow_up_date ?? null,
      follow_up_note: follow_up_note ?? null,
    })
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ prospect: data }, { status: 201 });
}