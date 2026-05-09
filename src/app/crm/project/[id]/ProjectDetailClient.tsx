"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { RaiseProject, PipelineInvestor, PipelineStage, ProjectRole } from "@/lib/crm/types";
import { STAGE_ORDER, STAGE_LABELS, STAGE_COLORS } from "@/lib/crm/stages";

const GREEN = "#03fb83";
const CARD_BG = "#0F1929";
const BORDER = "#1A2438";
const MUTED = "#6B7280";

const inputStyle: React.CSSProperties = {
  width: "100%", padding: "9px 12px", background: "#111927",
  border: `1px solid ${BORDER}`, borderRadius: "8px",
  color: "#F8FAFC", fontSize: "14px", outline: "none", boxSizing: "border-box",
};
const labelStyle: React.CSSProperties = {
  display: "block", fontSize: "12px", fontWeight: 500, color: "#94A3B8", marginBottom: "5px",
};

function StageBadge({ stage }: { stage: PipelineStage }) {
  const c = STAGE_COLORS[stage];
  return <span style={{ background: c.bg, color: c.text, border: `1px solid ${c.border}`, fontSize: "11px", fontWeight: 600, padding: "3px 10px", borderRadius: "20px", whiteSpace: "nowrap" }}>{STAGE_LABELS[stage]}</span>;
}

function RoleBadge({ role }: { role: string }) {
  const colors: Record<string, { bg: string; text: string }> = {
    owner:  { bg: "rgba(3,251,131,0.12)",  text: GREEN },
    editor: { bg: "rgba(59,130,246,0.12)", text: "#60A5FA" },
    viewer: { bg: "rgba(107,114,128,0.12)", text: "#9CA3AF" },
  };
  const c = colors[role] ?? colors.viewer;
  return <span style={{ background: c.bg, color: c.text, fontSize: "11px", fontWeight: 600, padding: "3px 10px", borderRadius: "20px", textTransform: "capitalize" }}>{role}</span>;
}

function isOverdue(dateStr: string | null) {
  if (!dateStr) return false;
  return new Date(dateStr + "T00:00:00") < new Date(new Date().toDateString());
}

type Member = { id: string; user_id: string; role: string; profiles: { first_name: string | null; last_name: string | null } | null };
type Invitation = { id: string; email: string; role: string; accepted_at: string | null; expires_at: string; created_at: string };

export default function ProjectDetailClient({
  project: initial, members, investors: initialInvestors, invitations: initialInvitations, role, currentUserId,
}: {
  project: RaiseProject; members: Member[]; investors: PipelineInvestor[];
  invitations: Invitation[]; role: ProjectRole; currentUserId: string;
}) {
  const router = useRouter();
  const [investors, setInvestors] = useState(initialInvestors);
  const [invitations, setInvitations] = useState(initialInvitations);
  const [memberList, setMemberList] = useState(members);
  const [activeTab, setActiveTab] = useState<"pipeline" | "members">("pipeline");

  // Invite form
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"editor" | "viewer">("viewer");
  const [inviting, setInviting] = useState(false);
  const [inviteResult, setInviteResult] = useState<{ ok: boolean; message: string } | null>(null);

  // Add investor form
  const [showAddInvestor, setShowAddInvestor] = useState(false);
  const [newFundName, setNewFundName] = useState("");
  const [newContactName, setNewContactName] = useState("");
  const [addingInvestor, setAddingInvestor] = useState(false);

  const canEdit = role === "owner" || role === "editor";

  // Stats
  const total = investors.length;
  const replied = investors.filter(i => ["replied", "meeting_scheduled", "meeting_completed", "follow_up", "due_diligence", "term_sheet", "committed"].includes(i.stage)).length;
  const meetings = investors.filter(i => ["meeting_scheduled", "meeting_completed"].includes(i.stage)).length;
  const committed = investors.filter(i => i.stage === "committed").length;

  async function handleStageChange(id: string, stage: PipelineStage) {
    if (!canEdit) return;
    setInvestors(prev => prev.map(i => i.id === id ? { ...i, stage } : i));
    await fetch(`/api/crm/pipeline/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stage }),
    });
  }

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    if (!inviteEmail) return;
    setInviting(true); setInviteResult(null);
    try {
      const res = await fetch(`/api/crm/projects/${initial.id}/invite`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: inviteEmail, role: inviteRole }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setInviteResult({ ok: true, message: `Invite sent to ${inviteEmail}` });
      setInviteEmail("");
      // Refresh invitations
      const inv = await fetch(`/api/crm/projects/${initial.id}`).then(r => r.json());
      if (inv.invitations) setInvitations(inv.invitations);
    } catch (err) {
      setInviteResult({ ok: false, message: err instanceof Error ? err.message : "Failed to send invite" });
    } finally { setInviting(false); }
  }

  async function handleAddInvestor(e: React.FormEvent) {
    e.preventDefault();
    if (!newFundName.trim()) return;
    setAddingInvestor(true);
    try {
      const res = await fetch("/api/crm/pipeline", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fund_name: newFundName, contact_name: newContactName || null, raise_project_id: initial.id }),
      });
      const data = await res.json();
      if (res.ok) {
        setInvestors(prev => [data.investor, ...prev]);
        setNewFundName(""); setNewContactName(""); setShowAddInvestor(false);
      }
    } finally { setAddingInvestor(false); }
  }

  async function handleRoleChange(userId: string, newRole: string) {
    await fetch(`/api/crm/projects/${initial.id}/members`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, role: newRole }),
    });
    setMemberList(prev => prev.map(m => m.user_id === userId ? { ...m, role: newRole } : m));
  }

  async function handleRemoveMember(userId: string) {
    if (!confirm("Remove this member?")) return;
    await fetch(`/api/crm/projects/${initial.id}/members?userId=${userId}`, { method: "DELETE" });
    setMemberList(prev => prev.filter(m => m.user_id !== userId));
  }

  const tabStyle = (active: boolean): React.CSSProperties => ({
    padding: "8px 20px", borderRadius: "8px", fontSize: "14px", fontWeight: active ? 600 : 400,
    color: active ? GREEN : MUTED, background: active ? "rgba(3,251,131,0.08)" : "transparent",
    border: "none", cursor: "pointer", transition: "all 0.15s",
  });

  return (
    <div>
      <a href="/crm/projects" style={{ fontSize: "13px", color: MUTED, textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "6px", marginBottom: "24px" }}>
        ← Back to Projects
      </a>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "28px", flexWrap: "wrap", gap: "16px" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "4px", flexWrap: "wrap" }}>
            <h1 style={{ fontSize: "26px", fontWeight: 800, color: "#F8FAFC", margin: 0 }}>{initial.name}</h1>
            <RoleBadge role={role} />
            <span style={{ fontSize: "11px", color: initial.status === 'active' ? GREEN : MUTED, background: `${initial.status === 'active' ? GREEN : MUTED}1a`, border: `1px solid ${initial.status === 'active' ? GREEN : MUTED}4d`, padding: "2px 10px", borderRadius: "20px", fontWeight: 600, textTransform: "capitalize" }}>{initial.status}</span>
          </div>
          <div style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
            {initial.company_name && <span style={{ fontSize: "13px", color: "#94A3B8" }}>{initial.company_name}</span>}
            {initial.stage && <span style={{ fontSize: "13px", color: MUTED }}>{initial.stage}</span>}
            {initial.target_raise && <span style={{ fontSize: "13px", color: MUTED }}>Target: {initial.target_raise}</span>}
          </div>
        </div>
        {canEdit && (
          <button onClick={() => setShowAddInvestor(v => !v)} style={{ background: GREEN, color: "#000", border: "none", borderRadius: "10px", padding: "10px 18px", fontSize: "14px", fontWeight: 700, cursor: "pointer" }}>
            + Add Investor
          </button>
        )}
      </div>

      {/* Add investor inline form */}
      {showAddInvestor && (
        <form onSubmit={handleAddInvestor} style={{ background: CARD_BG, border: `1px solid ${BORDER}`, borderRadius: "12px", padding: "20px", marginBottom: "20px", display: "flex", gap: "12px", flexWrap: "wrap", alignItems: "flex-end" }}>
          <div style={{ flex: 1, minWidth: "180px" }}>
            <label style={labelStyle}>Fund / Organisation *</label>
            <input style={inputStyle} value={newFundName} onChange={e => setNewFundName(e.target.value)} placeholder="e.g. Accel Partners" required />
          </div>
          <div style={{ flex: 1, minWidth: "160px" }}>
            <label style={labelStyle}>Contact Name</label>
            <input style={inputStyle} value={newContactName} onChange={e => setNewContactName(e.target.value)} placeholder="Jane Smith" />
          </div>
          <div style={{ display: "flex", gap: "8px" }}>
            <button type="submit" disabled={addingInvestor} style={{ background: addingInvestor ? "#374151" : GREEN, color: "#000", border: "none", borderRadius: "8px", padding: "9px 18px", fontSize: "13px", fontWeight: 700, cursor: addingInvestor ? "not-allowed" : "pointer" }}>
              {addingInvestor ? "Adding…" : "Add"}
            </button>
            <button type="button" onClick={() => setShowAddInvestor(false)} style={{ background: "transparent", color: MUTED, border: `1px solid ${BORDER}`, borderRadius: "8px", padding: "9px 14px", fontSize: "13px", cursor: "pointer" }}>Cancel</button>
          </div>
        </form>
      )}

      {/* Stats */}
      {total > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px", marginBottom: "24px" }}>
          {[
            { label: "In Pipeline", value: total },
            { label: "Replied", value: replied },
            { label: "Meetings", value: meetings },
            { label: "Committed", value: committed, highlight: committed > 0 },
          ].map(({ label, value, highlight }) => (
            <div key={label} style={{ background: CARD_BG, border: `1px solid ${highlight ? "rgba(3,251,131,0.3)" : BORDER}`, borderRadius: "12px", padding: "16px 20px" }}>
              <div style={{ fontSize: "26px", fontWeight: 800, color: highlight ? GREEN : "#F8FAFC" }}>{value}</div>
              <div style={{ fontSize: "12px", color: MUTED, marginTop: "2px" }}>{label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: "flex", gap: "4px", marginBottom: "20px", borderBottom: `1px solid ${BORDER}`, paddingBottom: "0" }}>
        <button style={tabStyle(activeTab === "pipeline")} onClick={() => setActiveTab("pipeline")}>Pipeline ({total})</button>
        <button style={tabStyle(activeTab === "members")} onClick={() => setActiveTab("members")}>Members ({memberList.length})</button>
      </div>

      {/* Pipeline tab */}
      {activeTab === "pipeline" && (
        total === 0 ? (
          <div style={{ background: CARD_BG, border: `1px solid ${BORDER}`, borderRadius: "14px", padding: "60px", textAlign: "center" }}>
            <p style={{ fontSize: "14px", color: MUTED }}>{canEdit ? "Add investors to get started." : "No investors in this pipeline yet."}</p>
          </div>
        ) : (
          <div style={{ background: CARD_BG, border: `1px solid ${BORDER}`, borderRadius: "14px", overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${BORDER}` }}>
                  {["Fund / Contact", "Stage", "Follow-up", "Notes"].map(h => (
                    <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontSize: "11px", fontWeight: 600, color: MUTED, textTransform: "uppercase", letterSpacing: "0.06em" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {investors.map((inv, i) => (
                  <tr key={inv.id} style={{ borderBottom: i < investors.length - 1 ? `1px solid ${BORDER}` : "none" }}
                    onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.02)")}
                    onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                  >
                    <td style={{ padding: "14px 16px", minWidth: "180px" }}>
                      <a href={canEdit ? `/crm/investor/${inv.id}` : "#"} style={{ textDecoration: "none" }}>
                        <div style={{ fontSize: "14px", fontWeight: 600, color: "#F8FAFC" }}>{inv.fund_name}</div>
                        {inv.contact_name && <div style={{ fontSize: "12px", color: MUTED, marginTop: "2px" }}>{inv.contact_name}{inv.role ? ` · ${inv.role}` : ""}</div>}
                      </a>
                    </td>
                    <td style={{ padding: "14px 16px" }}>
                      {canEdit ? (
                        <div>
                          <select value={inv.stage} onChange={e => handleStageChange(inv.id, e.target.value as PipelineStage)} style={{ background: "transparent", border: "none", outline: "none", cursor: "pointer", padding: 0, fontSize: "11px", marginBottom: "4px" }}>
                            {STAGE_ORDER.map(s => <option key={s} value={s}>{STAGE_LABELS[s]}</option>)}
                          </select>
                          <div><StageBadge stage={inv.stage} /></div>
                        </div>
                      ) : (
                        <StageBadge stage={inv.stage} />
                      )}
                    </td>
                    <td style={{ padding: "14px 16px", whiteSpace: "nowrap" }}>
                      {inv.next_follow_up_date ? (
                        <span style={{ fontSize: "13px", color: isOverdue(inv.next_follow_up_date) ? "#EF4444" : "#94A3B8", fontWeight: isOverdue(inv.next_follow_up_date) ? 600 : 400 }}>
                          {isOverdue(inv.next_follow_up_date) ? "⚠ " : ""}
                          {new Date(inv.next_follow_up_date + "T00:00:00").toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                        </span>
                      ) : <span style={{ fontSize: "13px", color: "#374151" }}>—</span>}
                    </td>
                    <td style={{ padding: "14px 16px", maxWidth: "220px" }}>
                      {inv.personal_notes ? (
                        <span style={{ fontSize: "13px", color: "#94A3B8", overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" as const }}>{inv.personal_notes}</span>
                      ) : <span style={{ fontSize: "13px", color: "#374151" }}>—</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}

      {/* Members tab */}
      {activeTab === "members" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {/* Member list */}
          <div style={{ background: CARD_BG, border: `1px solid ${BORDER}`, borderRadius: "14px", overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${BORDER}` }}>
                  {["Member", "Role", ...(role === "owner" ? ["Actions"] : [])].map(h => (
                    <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontSize: "11px", fontWeight: 600, color: MUTED, textTransform: "uppercase", letterSpacing: "0.06em" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {memberList.map((m, i) => {
                  const name = m.profiles ? `${m.profiles.first_name ?? ""} ${m.profiles.last_name ?? ""}`.trim() : "Unknown";
                  const isCurrentUser = m.user_id === currentUserId;
                  return (
                    <tr key={m.id} style={{ borderBottom: i < memberList.length - 1 ? `1px solid ${BORDER}` : "none" }}>
                      <td style={{ padding: "14px 16px" }}>
                        <div style={{ fontSize: "14px", fontWeight: 600, color: "#F8FAFC" }}>{name || "—"} {isCurrentUser && <span style={{ fontSize: "11px", color: MUTED }}>(you)</span>}</div>
                      </td>
                      <td style={{ padding: "14px 16px" }}>
                        {role === "owner" && !isCurrentUser && m.role !== "owner" ? (
                          <select
                            value={m.role}
                            onChange={e => handleRoleChange(m.user_id, e.target.value)}
                            style={{ background: "transparent", border: `1px solid ${BORDER}`, borderRadius: "6px", color: "#F8FAFC", padding: "4px 8px", fontSize: "12px", outline: "none", cursor: "pointer" }}
                          >
                            <option value="editor">Editor</option>
                            <option value="viewer">Viewer</option>
                          </select>
                        ) : (
                          <RoleBadge role={m.role} />
                        )}
                      </td>
                      {role === "owner" && (
                        <td style={{ padding: "14px 16px" }}>
                          {!isCurrentUser && m.role !== "owner" && (
                            <button onClick={() => handleRemoveMember(m.user_id)} style={{ fontSize: "12px", color: "#EF4444", background: "none", border: "none", cursor: "pointer", padding: 0 }}>Remove</button>
                          )}
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Invite form — owner/editor only */}
          {canEdit && (
            <div style={{ background: CARD_BG, border: `1px solid ${BORDER}`, borderRadius: "14px", padding: "24px" }}>
              <h2 style={{ fontSize: "14px", fontWeight: 700, color: "#F8FAFC", marginBottom: "16px" }}>Invite Someone</h2>
              <form onSubmit={handleInvite} style={{ display: "flex", gap: "10px", flexWrap: "wrap", alignItems: "flex-end" }}>
                <div style={{ flex: 2, minWidth: "200px" }}>
                  <label style={labelStyle}>Email address</label>
                  <input style={inputStyle} type="email" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} placeholder="founder@startup.com" required />
                </div>
                <div style={{ flex: 1, minWidth: "120px" }}>
                  <label style={labelStyle}>Access level</label>
                  <select style={inputStyle} value={inviteRole} onChange={e => setInviteRole(e.target.value as "editor" | "viewer")}>
                    <option value="viewer">Viewer — read only</option>
                    <option value="editor">Editor — can update stages & add notes</option>
                  </select>
                </div>
                <button type="submit" disabled={inviting} style={{ background: inviting ? "#374151" : GREEN, color: "#000", border: "none", borderRadius: "8px", padding: "9px 18px", fontSize: "13px", fontWeight: 700, cursor: inviting ? "not-allowed" : "pointer", whiteSpace: "nowrap" }}>
                  {inviting ? "Sending…" : "Send Invite →"}
                </button>
              </form>
              {inviteResult && (
                <p style={{ fontSize: "13px", color: inviteResult.ok ? GREEN : "#EF4444", marginTop: "10px", marginBottom: 0 }}>
                  {inviteResult.ok ? "✓ " : "✗ "}{inviteResult.message}
                </p>
              )}

              {/* Pending invitations */}
              {invitations.filter(i => !i.accepted_at).length > 0 && (
                <div style={{ marginTop: "20px" }}>
                  <div style={{ fontSize: "12px", fontWeight: 600, color: MUTED, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "10px" }}>Pending Invitations</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    {invitations.filter(i => !i.accepted_at).map(inv => (
                      <div key={inv.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", background: "#111927", borderRadius: "8px", border: `1px solid ${BORDER}` }}>
                        <div>
                          <span style={{ fontSize: "13px", color: "#F8FAFC" }}>{inv.email}</span>
                          <span style={{ fontSize: "11px", color: MUTED, marginLeft: "10px", textTransform: "capitalize" }}>{inv.role}</span>
                        </div>
                        <span style={{ fontSize: "11px", color: new Date(inv.expires_at) < new Date() ? "#EF4444" : MUTED }}>
                          {new Date(inv.expires_at) < new Date() ? "Expired" : `Expires ${new Date(inv.expires_at).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}`}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
