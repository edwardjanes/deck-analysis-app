import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";

async function getScAdmin() {
  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: profile } = await supabaseAdmin
    .from("profiles").select("sc_admin").eq("id", user.id).single();
  if (!profile?.sc_admin) return null;
  return user;
}

// GET /api/crm/prospects/[id]
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getScAdmin();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: prospect, error } = await supabaseAdmin
    .from("sc_prospects")
    .select("*")
    .eq("id", params.id)
    .single();

  if (error || !prospect) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { data: touchpoints } = await supabaseAdmin
    .from("sc_touchpoints")
    .select("*")
    .eq("prospect_id", params.id)
    .order("occurred_at", { ascending: false });

  return NextResponse.json({ prospect: { ...prospect, touchpoints: touchpoints ?? [] } });
}

// PATCH /api/crm/prospects/[id]
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getScAdmin();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const allowed = [
    "first_name", "last_name", "email", "linkedin_url", "company_name",
    "role", "location", "stage", "notes", "next_follow_up_date",
    "follow_up_note", "lead_score", "lead_score_rationale", "archived",
  ];
  const updates: Record<string, unknown> = {};
  for (const key of allowed) {
    if (key in body) updates[key] = body[key];
  }

  const { data, error } = await supabaseAdmin
    .from("sc_prospects")
    .update(updates)
    .eq("id", params.id)
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ prospect: data });
}

// DELETE /api/crm/prospects/[id]  — soft delete (archive)
export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getScAdmin();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { error } = await supabaseAdmin
    .from("sc_prospects")
    .update({ archived: true })
    .eq("id", params.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}