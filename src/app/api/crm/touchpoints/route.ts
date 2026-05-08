import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";

async function getCrmUser() {
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

// POST /api/crm/touchpoints — log a touchpoint
export async function POST(req: NextRequest) {
  const user = await getCrmUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { pipeline_investor_id, type, subject, body: bodyText, occurred_at } = await req.json();

  if (!pipeline_investor_id || !type) {
    return NextResponse.json({ error: "pipeline_investor_id and type are required" }, { status: 400 });
  }

  // Verify the investor belongs to this user
  const { data: investor } = await supabaseAdmin
    .from("pipeline_investors")
    .select("id")
    .eq("id", pipeline_investor_id)
    .eq("user_id", user.id)
    .single();

  if (!investor) return NextResponse.json({ error: "Investor not found" }, { status: 404 });

  const { data, error } = await supabaseAdmin
    .from("touchpoints")
    .insert({
      user_id: user.id,
      pipeline_investor_id,
      type,
      subject: subject ?? null,
      body: bodyText ?? null,
      occurred_at: occurred_at ?? new Date().toISOString(),
    })
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ touchpoint: data }, { status: 201 });
}
