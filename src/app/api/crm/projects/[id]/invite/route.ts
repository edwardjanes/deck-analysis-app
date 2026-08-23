import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Only owner or editor can invite
  const { data: member } = await supabaseAdmin
    .from("raise_project_members")
    .select("role")
    .eq("project_id", params.id)
    .eq("user_id", user.id)
    .single();

  if (!member || member.role === "viewer") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { email, role = "viewer" } = await req.json();
  if (!email) return NextResponse.json({ error: "email required" }, { status: 400 });

  const { data: project } = await supabaseAdmin.from("raise_projects").select("name, company_name").eq("id", params.id).single();

  // Upsert invitation (reset token + expiry if re-inviting)
  const { data: invitation, error } = await supabaseAdmin
    .from("raise_project_invitations")
    .upsert({
      project_id: params.id,
      invited_by: user.id,
      email: email.toLowerCase().trim(),
      role,
      token: Buffer.from(crypto.getRandomValues(new Uint8Array(32))).toString("hex"),
      accepted_at: null,
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    }, { onConflict: "project_id,email" })
    .select("token")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const appUrl = "https://app.sourcecapital.co.uk";
  const joinUrl = `${appUrl}/crm/join/${invitation.token}`;
  const projectName = project?.company_name ?? project?.name ?? "a raise project";

  // Send invite email via Loops
  const loopsKey = process.env.LOOPS_API_KEY;
  const loopsInviteId = process.env.LOOPS_CRM_INVITE_TRANSACTIONAL_ID;
  if (loopsKey && loopsInviteId) {
    await fetch("https://app.loops.so/api/v1/transactional", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${loopsKey}` },
      body: JSON.stringify({
        transactionalId: loopsInviteId,
        email: email.toLowerCase().trim(),
        dataVariables: { inviteProjectName: projectName, inviteJoinUrl: joinUrl, inviteRole: role },
      }),
    }).catch(err => console.error("[loops] Invite email error:", err));
  } else {
    console.log(`[invite] Join URL for ${email}: ${joinUrl}`);
  }

  return NextResponse.json({ ok: true, joinUrl });
}
