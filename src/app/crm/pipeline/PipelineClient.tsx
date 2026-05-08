"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { PipelineInvestor, PipelineStage } from "@/lib/crm/types";
import { STAGE_ORDER, STAGE_LABELS, STAGE_COLORS } from "@/lib/crm/stages";

const GREEN = "#03fb83";
const CARD_BG = "#0F1929";
const BORDER = "#1A2438";
const MUTED = "#6B7280";

function StageBadge({ stage }: { stage: PipelineStage }) {
  const c = STAGE_COLORS[stage];
  return (
    <span style={{
      background: c.bg, color: c.text, border: `1px solid ${c.border}`,
      fontSize: "11px", fontWeight: 600, padding: "3px 10px", borderRadius: "20px",
      whiteSpace: "nowrap",
    }}>
      {STAGE_LABELS[stage]}
    </span>
  );
}

function formatDate(dateStr: string | null) {
  if (!dateStr) return null;
  return new Date(dateStr + "T00:00:00").toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

function isOverdue(dateStr: string | null) {
  if (!dateStr) return false;
  return new Date(dateStr + "T00:00:00") < new Date(new Date().toDateString());
}

interface AddInvestorModalProps {
  onClose: () => void;
  onAdded: (investor: PipelineInvestor) => void;
}

function AddInvestorModal({ onClose, onAdded }: AddInvestorModalProps) {
  const [fundName, setFundName] = useState("");
  const [contactName, setContactName] = useState("");
  const [role, setRole] = useState("");
  const [email, setEmail] = useState("");
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!fundName.trim()) { setError("Fund name is required"); return; }
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/crm/pipeline", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fund_name: fundName, contact_name: contactName, role, email, linkedin_url: linkedinUrl, thesis_notes: notes }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      onAdded(data.investor);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  const inputStyle: React.CSSProperties = {
    width: "100%", padding: "9px 12px", background: "#111927",
    border: `1px solid ${BORDER}`, borderRadius: "8px",
    color: "#F8FAFC", fontSize: "14px", outline: "none", boxSizing: "border-box",
  };
  const labelStyle: React.CSSProperties = {
    display: "block", fontSize: "12px", fontWeight: 500, color: "#94A3B8", marginBottom: "5px",
  };

  return (
    <div
      style={{ position: "fixed", inset: 0, background: "rgba(5,8,16,0.85)", backdropFilter: "blur(6px)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: "24px" }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{ background: "#0D1420", border: `1px solid ${BORDER}`, borderRadius: "16px", padding: "36px", width: "100%", maxWidth: "480px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "24px" }}>
          <h2 style={{ fontSize: "18px", fontWeight: 700, color: "#F8FAFC", margin: 0 }}>Add Investor</h2>
          <button onClick={onClose} style={{ background: "none", border: "none", color: MUTED, fontSize: "20px", cursor: "pointer", lineHeight: 1 }}>×</button>
        </div>
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          <div>
            <label style={labelStyle}>Fund / Organisation *</label>
            <input style={inputStyle} value={fundName} onChange={e => setFundName(e.target.value)} placeholder="e.g. Accel Partners" required />
          </div>
          <div style={{ display: "flex", gap: "12px" }}>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Contact Name</label>
              <input style={inputStyle} value={contactName} onChange={e => setContactName(e.target.value)} placeholder="Jane Smith" />
            </div>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Role</label>
              <input style={inputStyle} value={role} onChange={e => setRole(e.target.value)} placeholder="Partner" />
            </div>
          </div>
          <div>
            <label style={labelStyle}>Email</label>
            <input style={inputStyle} type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="jane@accel.com" />
          </div>
          <div>
            <label style={labelStyle}>LinkedIn URL</label>
            <input style={inputStyle} value={linkedinUrl} onChange={e => setLinkedinUrl(e.target.value)} placeholder="https://linkedin.com/in/..." />
          </div>
          <div>
            <label style={labelStyle}>Notes</label>
            <textarea style={{ ...inputStyle, minHeight: "80px", resize: "vertical" }} value={notes} onChange={e => setNotes(e.target.value)} placeholder="Thesis, connection, context..." />
          </div>
          {error && <p style={{ fontSize: "13px", color: "#EF4444", margin: 0 }}>{error}</p>}
          <button
            type="submit"
            disabled={saving}
            style={{ background: saving ? "#374151" : GREEN, color: "#000", border: "none", borderRadius: "10px", padding: "12px", fontSize: "14px", fontWeight: 700, cursor: saving ? "not-allowed" : "pointer", marginTop: "4px" }}
          >
            {saving ? "Adding…" : "Add to Pipeline →"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function PipelineClient({ investors: initial }: { investors: PipelineInvestor[] }) {
  const router = useRouter();
  const [investors, setInvestors] = useState<PipelineInvestor[]>(initial);
  const [showAdd, setShowAdd] = useState(false);
  const [search, setSearch] = useState("");
  const [stageFilter, setStageFilter] = useState<PipelineStage | "">("");
  const [updatingStage, setUpdatingStage] = useState<string | null>(null);

  const filtered = investors.filter(inv => {
    const matchSearch = !search ||
      inv.fund_name.toLowerCase().includes(search.toLowerCase()) ||
      (inv.contact_name ?? "").toLowerCase().includes(search.toLowerCase());
    const matchStage = !stageFilter || inv.stage === stageFilter;
    return matchSearch && matchStage;
  });

  // Stats
  const total = investors.length;
  const replied = investors.filter(i => ["replied", "meeting_scheduled", "meeting_completed", "follow_up", "due_diligence", "term_sheet", "committed"].includes(i.stage)).length;
  const meetings = investors.filter(i => ["meeting_scheduled", "meeting_completed"].includes(i.stage)).length;
  const committed = investors.filter(i => i.stage === "committed").length;
  const dueToday = investors.filter(i => i.next_follow_up_date && isOverdue(i.next_follow_up_date)).length;

  const handleStageChange = useCallback(async (id: string, stage: PipelineStage) => {
    setUpdatingStage(id);
    setInvestors(prev => prev.map(i => i.id === id ? { ...i, stage } : i));
    try {
      await fetch(`/api/crm/pipeline/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stage }),
      });
    } finally {
      setUpdatingStage(null);
    }
  }, []);

  const handleArchive = useCallback(async (id: string) => {
    if (!confirm("Remove this investor from your pipeline?")) return;
    setInvestors(prev => prev.filter(i => i.id !== id));
    await fetch(`/api/crm/pipeline/${id}`, { method: "DELETE" });
  }, []);

  return (
    <>
      {showAdd && (
        <AddInvestorModal
          onClose={() => setShowAdd(false)}
          onAdded={inv => setInvestors(prev => [inv, ...prev])}
        />
      )}

      {/* Page header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "32px", flexWrap: "wrap", gap: "16px" }}>
        <div>
          <h1 style={{ fontSize: "28px", fontWeight: 800, color: "#F8FAFC", margin: "0 0 4px" }}>Investor Pipeline</h1>
          <p style={{ fontSize: "14px", color: MUTED, margin: 0 }}>Track and manage your investor relationships</p>
        </div>
        <div style={{ display: "flex", gap: "10px" }}>
          <a href="/crm/investors" style={{ background: "transparent", color: GREEN, border: `1px solid rgba(3,251,131,0.3)`, borderRadius: "10px", padding: "10px 18px", fontSize: "14px", fontWeight: 600, textDecoration: "none" }}>
            Browse Database
          </a>
          <button
            onClick={() => setShowAdd(true)}
            style={{ background: GREEN, color: "#000", border: "none", borderRadius: "10px", padding: "10px 18px", fontSize: "14px", fontWeight: 700, cursor: "pointer" }}
          >
            + Add Investor
          </button>
        </div>
      </div>

      {/* Stats row */}
      {total > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "12px", marginBottom: "28px" }}>
          {[
            { label: "In Pipeline", value: total },
            { label: "Replied", value: replied },
            { label: "Meetings", value: meetings },
            { label: "Committed", value: committed, highlight: committed > 0 },
            { label: "Follow-ups Due", value: dueToday, highlight: dueToday > 0, warn: true },
          ].map(({ label, value, highlight, warn }) => (
            <div key={label} style={{ background: CARD_BG, border: `1px solid ${highlight ? (warn ? "rgba(239,68,68,0.3)" : "rgba(3,251,131,0.3)") : BORDER}`, borderRadius: "12px", padding: "16px 20px" }}>
              <div style={{ fontSize: "26px", fontWeight: 800, color: highlight ? (warn ? "#EF4444" : GREEN) : "#F8FAFC" }}>{value}</div>
              <div style={{ fontSize: "12px", color: MUTED, marginTop: "2px" }}>{label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      <div style={{ display: "flex", gap: "10px", marginBottom: "20px", flexWrap: "wrap" }}>
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search funds or contacts…"
          style={{ flex: 1, minWidth: "200px", padding: "9px 14px", background: CARD_BG, border: `1px solid ${BORDER}`, borderRadius: "8px", color: "#F8FAFC", fontSize: "14px", outline: "none" }}
        />
        <select
          value={stageFilter}
          onChange={e => setStageFilter(e.target.value as PipelineStage | "")}
          style={{ padding: "9px 14px", background: CARD_BG, border: `1px solid ${BORDER}`, borderRadius: "8px", color: stageFilter ? "#F8FAFC" : MUTED, fontSize: "14px", outline: "none" }}
        >
          <option value="">All stages</option>
          {STAGE_ORDER.map(s => <option key={s} value={s}>{STAGE_LABELS[s]}</option>)}
        </select>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div style={{ background: CARD_BG, border: `1px solid ${BORDER}`, borderRadius: "14px", padding: "60px", textAlign: "center" }}>
          {total === 0 ? (
            <>
              <p style={{ fontSize: "16px", color: "#F8FAFC", fontWeight: 600, marginBottom: "8px" }}>No investors yet</p>
              <p style={{ fontSize: "14px", color: MUTED, marginBottom: "24px" }}>Add investors manually or browse the Source Capital database.</p>
              <button onClick={() => setShowAdd(true)} style={{ background: GREEN, color: "#000", border: "none", borderRadius: "10px", padding: "10px 24px", fontSize: "14px", fontWeight: 700, cursor: "pointer" }}>
                + Add Your First Investor
              </button>
            </>
          ) : (
            <p style={{ fontSize: "14px", color: MUTED }}>No investors match your filters.</p>
          )}
        </div>
      ) : (
        <div style={{ background: CARD_BG, border: `1px solid ${BORDER}`, borderRadius: "14px", overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${BORDER}` }}>
                {["Fund / Contact", "Stage", "Follow-up", "Notes", ""].map(h => (
                  <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontSize: "11px", fontWeight: 600, color: MUTED, textTransform: "uppercase", letterSpacing: "0.06em" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((inv, i) => (
                <tr
                  key={inv.id}
                  style={{ borderBottom: i < filtered.length - 1 ? `1px solid ${BORDER}` : "none", transition: "background 0.1s" }}
                  onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.02)")}
                  onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                >
                  <td style={{ padding: "14px 16px", minWidth: "200px" }}>
                    <a href={`/crm/investor/${inv.id}`} style={{ textDecoration: "none" }}>
                      <div style={{ fontSize: "14px", fontWeight: 600, color: "#F8FAFC" }}>{inv.fund_name}</div>
                      {inv.contact_name && <div style={{ fontSize: "12px", color: MUTED, marginTop: "2px" }}>{inv.contact_name}{inv.role ? ` · ${inv.role}` : ""}</div>}
                    </a>
                  </td>
                  <td style={{ padding: "14px 16px" }}>
                    <select
                      value={inv.stage}
                      onChange={e => handleStageChange(inv.id, e.target.value as PipelineStage)}
                      disabled={updatingStage === inv.id}
                      style={{ background: "transparent", border: "none", outline: "none", cursor: "pointer", padding: 0, fontSize: "11px" }}
                    >
                      {STAGE_ORDER.map(s => <option key={s} value={s}>{STAGE_LABELS[s]}</option>)}
                    </select>
                    <div style={{ marginTop: "4px" }}><StageBadge stage={inv.stage} /></div>
                  </td>
                  <td style={{ padding: "14px 16px", whiteSpace: "nowrap" }}>
                    {inv.next_follow_up_date ? (
                      <span style={{ fontSize: "13px", color: isOverdue(inv.next_follow_up_date) ? "#EF4444" : "#94A3B8", fontWeight: isOverdue(inv.next_follow_up_date) ? 600 : 400 }}>
                        {isOverdue(inv.next_follow_up_date) ? "⚠ " : ""}{formatDate(inv.next_follow_up_date)}
                      </span>
                    ) : (
                      <span style={{ fontSize: "13px", color: "#374151" }}>—</span>
                    )}
                  </td>
                  <td style={{ padding: "14px 16px", maxWidth: "240px" }}>
                    {inv.personal_notes ? (
                      <span style={{ fontSize: "13px", color: "#94A3B8", overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" as const }}>
                        {inv.personal_notes}
                      </span>
                    ) : (
                      <span style={{ fontSize: "13px", color: "#374151" }}>—</span>
                    )}
                  </td>
                  <td style={{ padding: "14px 16px", whiteSpace: "nowrap" }}>
                    <div style={{ display: "flex", gap: "8px" }}>
                      <a href={`/crm/investor/${inv.id}`} style={{ fontSize: "12px", color: GREEN, textDecoration: "none", fontWeight: 600 }}>View →</a>
                      <button onClick={() => handleArchive(inv.id)} style={{ fontSize: "12px", color: "#6B7280", background: "none", border: "none", cursor: "pointer", padding: 0 }}>Remove</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
