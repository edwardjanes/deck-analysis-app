import { supabaseAdmin } from "@/lib/supabaseAdmin";
import JoinClient from "./JoinClient";

export const dynamic = "force-dynamic";

export default async function JoinPage({ params }: { params: { token: string } }) {
  const { data: invitation } = await supabaseAdmin
    .from("raise_project_invitations")
    .select("email, role, accepted_at, expires_at, project_id, raise_projects(name, company_name)")
    .eq("token", params.token)
    .single();

  if (!invitation) {
    return (
      <div style={{ minHeight: "100vh", background: "#080C14", display: "flex", alignItems: "center", justifyContent: "center", color: "#F8FAFC", fontFamily: "Inter, sans-serif" }}>
        <div style={{ textAlign: "center" }}>
          <h1 style={{ fontSize: "24px", fontWeight: 700, marginBottom: "8px" }}>Invalid Invitation</h1>
          <p style={{ color: "#6B7280" }}>This invite link is invalid or has expired.</p>
          <a href="/login" style={{ color: "#03fb83", textDecoration: "none", fontSize: "14px", marginTop: "16px", display: "inline-block" }}>Go to login →</a>
        </div>
      </div>
    );
  }

  const project = (Array.isArray(invitation.raise_projects) ? invitation.raise_projects[0] : invitation.raise_projects) as { name: string; company_name: string | null } | null;
  const expired = new Date(invitation.expires_at) < new Date();
  const used = !!invitation.accepted_at;

  return <JoinClient token={params.token} email={invitation.email} role={invitation.role} projectName={project?.company_name ?? project?.name ?? "a raise project"} expired={expired} used={used} />;
}
