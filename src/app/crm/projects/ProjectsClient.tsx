"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { RaiseProject } from "@/lib/crm/types";

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

function ProjectCard({ project, role }: { project: RaiseProject & { member_role?: string }; role: string }) {
  const statusColor = project.status === 'active' ? GREEN : project.status === 'closed' ? '#FBBF24' : MUTED;
  return (
    <a href={`/crm/project/${project.id}`} style={{ textDecoration: "none" }}>
      <div style={{ background: CARD_BG, border: `1px solid ${BORDER}`, borderRadius: "12px", padding: "20px 24px", transition: "border-color 0.15s", cursor: "pointer" }}
        onMouseEnter={e => (e.currentTarget.style.borderColor = "rgba(3,251,131,0.3)")}
        onMouseLeave={e => (e.currentTarget.style.borderColor = BORDER)}
      >
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "8px" }}>
          <div>
            <div style={{ fontSize: "15px", fontWeight: 700, color: "#F8FAFC", marginBottom: "2px" }}>{project.name}</div>
            {project.company_name && <div style={{ fontSize: "13px", color: "#94A3B8" }}>{project.company_name}</div>}
          </div>
          <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
            <span style={{ fontSize: "11px", color: statusColor, background: `${statusColor}1a`, border: `1px solid ${statusColor}4d`, padding: "2px 10px", borderRadius: "20px", fontWeight: 600, textTransform: "capitalize" }}>{project.status}</span>
            {role !== 'owner' && <span style={{ fontSize: "11px", color: MUTED, background: "rgba(107,114,128,0.1)", border: `1px solid ${BORDER}`, padding: "2px 10px", borderRadius: "20px", textTransform: "capitalize" }}>{role}</span>}
          </div>
        </div>
        <div style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
          {project.stage && <span style={{ fontSize: "12px", color: MUTED }}>{project.stage}</span>}
          {project.target_raise && <span style={{ fontSize: "12px", color: MUTED }}>Target: {project.target_raise}</span>}
        </div>
      </div>
    </a>
  );
}

export default function ProjectsClient({ owned, member }: { owned: RaiseProject[]; member: (RaiseProject & { member_role: string })[] }) {
  const router = useRouter();
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [targetRaise, setTargetRaise] = useState("");
  const [stage, setStage] = useState("");
  const [description, setDescription] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) { setError("Project name is required"); return; }
    setCreating(true); setError("");
    try {
      const res = await fetch("/api/crm/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, company_name: companyName, target_raise: targetRaise, stage, description }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      router.push(`/crm/project/${data.project.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setCreating(false);
    }
  }

  return (
    <>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "32px", flexWrap: "wrap", gap: "16px" }}>
        <div>
          <h1 style={{ fontSize: "28px", fontWeight: 800, color: "#F8FAFC", margin: "0 0 4px" }}>Raise Projects</h1>
          <p style={{ fontSize: "14px", color: MUTED, margin: 0 }}>Manage and share startup raise pipelines</p>
        </div>
        <button onClick={() => setShowCreate(true)} style={{ background: GREEN, color: "#000", border: "none", borderRadius: "10px", padding: "10px 18px", fontSize: "14px", fontWeight: 700, cursor: "pointer" }}>
          + New Project
        </button>
      </div>

      {showCreate && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(5,8,16,0.85)", backdropFilter: "blur(6px)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: "24px" }}
          onClick={e => { if (e.target === e.currentTarget) setShowCreate(false); }}
        >
          <div style={{ background: "#0D1420", border: `1px solid ${BORDER}`, borderRadius: "16px", padding: "36px", width: "100%", maxWidth: "480px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "24px" }}>
              <h2 style={{ fontSize: "18px", fontWeight: 700, color: "#F8FAFC", margin: 0 }}>New Raise Project</h2>
              <button onClick={() => setShowCreate(false)} style={{ background: "none", border: "none", color: MUTED, fontSize: "20px", cursor: "pointer" }}>×</button>
            </div>
            <form onSubmit={handleCreate} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div>
                <label style={labelStyle}>Project Name *</label>
                <input style={inputStyle} value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Wellvyl Seed Round" required />
              </div>
              <div>
                <label style={labelStyle}>Company Name</label>
                <input style={inputStyle} value={companyName} onChange={e => setCompanyName(e.target.value)} placeholder="e.g. Wellvyl" />
              </div>
              <div style={{ display: "flex", gap: "12px" }}>
                <div style={{ flex: 1 }}>
                  <label style={labelStyle}>Target Raise</label>
                  <input style={inputStyle} value={targetRaise} onChange={e => setTargetRaise(e.target.value)} placeholder="e.g. £500k" />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={labelStyle}>Stage</label>
                  <select style={inputStyle} value={stage} onChange={e => setStage(e.target.value)}>
                    <option value="">Select…</option>
                    {["Pre-seed", "Seed", "Series A", "Series B", "Growth"].map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label style={labelStyle}>Description</label>
                <textarea style={{ ...inputStyle, minHeight: "70px", resize: "vertical" }} value={description} onChange={e => setDescription(e.target.value)} placeholder="Brief description of the raise…" />
              </div>
              {error && <p style={{ fontSize: "13px", color: "#EF4444", margin: 0 }}>{error}</p>}
              <button type="submit" disabled={creating} style={{ background: creating ? "#374151" : GREEN, color: "#000", border: "none", borderRadius: "10px", padding: "12px", fontSize: "14px", fontWeight: 700, cursor: creating ? "not-allowed" : "pointer", marginTop: "4px" }}>
                {creating ? "Creating…" : "Create Project →"}
              </button>
            </form>
          </div>
        </div>
      )}

      {owned.length === 0 && member.length === 0 ? (
        <div style={{ background: CARD_BG, border: `1px solid ${BORDER}`, borderRadius: "14px", padding: "60px", textAlign: "center" }}>
          <p style={{ fontSize: "16px", color: "#F8FAFC", fontWeight: 600, marginBottom: "8px" }}>No projects yet</p>
          <p style={{ fontSize: "14px", color: MUTED, marginBottom: "24px" }}>Create a raise project to share investor pipeline progress with founders.</p>
          <button onClick={() => setShowCreate(true)} style={{ background: GREEN, color: "#000", border: "none", borderRadius: "10px", padding: "10px 24px", fontSize: "14px", fontWeight: 700, cursor: "pointer" }}>
            + Create Your First Project
          </button>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          {owned.length > 0 && (
            <div>
              <div style={{ fontSize: "12px", fontWeight: 600, color: MUTED, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "12px" }}>Your Projects</div>
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {owned.map(p => <ProjectCard key={p.id} project={p} role="owner" />)}
              </div>
            </div>
          )}
          {member.length > 0 && (
            <div>
              <div style={{ fontSize: "12px", fontWeight: 600, color: MUTED, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "12px" }}>Shared With You</div>
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {member.map(p => <ProjectCard key={p.id} project={p} role={p.member_role} />)}
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
}
