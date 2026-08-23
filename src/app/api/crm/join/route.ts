import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";

// POST /api/crm/join — accept an invitation token
export async function POST(req: NextRequest) {
  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { token } = await req.json();
  if (!token) return NextResponse.json({ error: "token required" }, { status: 400 });

  const { data: invitation } = await supabaseAdmin
    .from("raise_project_invitations")
    .select("*")
    .eq("token", token)
    .single();

  if (!invitation) return NextResponse.json({ error: "Invalid invitation" }, { status: 404 });
  if (invitation.accepted_at) return NextResponse.json({ error: "Invitation already used" }, { status: 400 });
  if (new Date(invitation.expires_at) < new Date()) return NextResponse.json({ error: "Invitation expired" }, { status: 400 });

  // Add as member (upsert in case they somehow already exist)
  await supabaseAdmin.from("raise_project_members").upsert({
    project_id: invitation.project_id,
    user_id: user.id,
    role: invitation.role,
    invited_by: invitation.invited_by,
  }, { onConflict: "project_id,user_id" });

  // Mark accepted
  await supabaseAdmin.from("raise_project_invitations").update({ accepted_at: new Date().toISOString() }).eq("token", token);

  return NextResponse.json({ ok: true, projectId: invitation.project_id, role: invitation.role });
}
