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

// POST /api/crm/prospects/[id]/touchpoints
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getScAdmin();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const {
    type, subject, body: bodyText, occurred_at,
    fathom_recording_url, fathom_transcript, call_duration_mins,
  } = body;

  if (!type) return NextResponse.json({ error: "type is required" }, { status: 400 });

  // Verify prospect exists
  const { data: prospect } = await supabaseAdmin
    .from("sc_prospects").select("id").eq("id", params.id).single();
  if (!prospect) return NextResponse.json({ error: "Prospect not found" }, { status: 404 });

  const { data, error } = await supabaseAdmin
    .from("sc_touchpoints")
    .insert({
      prospect_id: params.id,
      type,
      subject: subject ?? null,
      body: bodyText ?? null,
      occurred_at: occurred_at ?? new Date().toISOString(),
      fathom_recording_url: fathom_recording_url ?? null,
      fathom_transcript: fathom_transcript ?? null,
      call_duration_mins: call_duration_mins ?? null,
    })
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ touchpoint: data }, { status: 201 });
}

// DELETE /api/crm/prospects/[id]/touchpoints?touchpoint_id=...
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getScAdmin();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const touchpointId = searchParams.get("touchpoint_id");
  if (!touchpointId) return NextResponse.json({ error: "touchpoint_id required" }, { status: 400 });

  const { error } = await supabaseAdmin
    .from("sc_touchpoints")
    .delete()
    .eq("id", touchpointId)
    .eq("prospect_id", params.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}