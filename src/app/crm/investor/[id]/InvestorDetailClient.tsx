"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PipelineInvestor, Touchpoint, PipelineStage, TouchpointType } from "@/lib/crm/types";
import { STAGE_ORDER, STAGE_LABELS, STAGE_COLORS, TOUCHPOINT_LABELS } from "@/lib/crm/stages";

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
  return (
    <span style={{ background: c.bg, color: c.text, border: `1px solid ${c.border}`, fontSize: "12px", fontWeight: 600, padding: "4px 12px", borderRadius: "20px" }}>
      {STAGE_LABELS[stage]}
    </span>
  );
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export default function InvestorDetailClient({
  investor: initial,
  touchpoints: initialTouchpoints,
}: {
  investor: PipelineInvestor;
  touchpoints: Touchpoint[];
}) {
  const router = useRouter();
  const [investor, setInvestor] = useState(initial);
  const [touchpoints, setTouchpoints] = useState(initialTouchpoints);
  const [saving, setSaving] = useState(false);
  const [notes, setNotes] = useState(investor.personal_notes ?? "");
  const [followUpDate, setFollowUpDate] = useState(investor.next_follow_up_date ?? "");
  const [followUpNote, setFollowUpNote] = useState(investor.follow_up_note ?? "");

  // Touchpoint form
  const [tpType, setTpType] = useState<TouchpointType>("note");
  const [tpSubject, setTpSubject] = useState("");
  const [tpBody, setTpBody] = useState("");
  const [tpDate, setTpDate] = useState(new Date().toISOString().slice(0, 16));
  const [addingTp, setAddingTp] = useState(false);
  const [showTpForm, setShowTpForm] = useState(false);

  async function saveField(updates: Record<string, unknown>) {
    setSaving(true);
    try {
      const res = await fetch(`/api/crm/pipeline/${investor.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      const data = await res.json();
      if (res.ok) setInvestor(data.investor);
    } finally {
      setSaving(false);
    }
  }

  async function handleStageChange(stage: PipelineStage) {
    setInvestor(prev => ({ ...prev, stage }));
    await saveField({ stage });
  }

  async function saveNotes() {
    await saveField({ personal_notes: notes, next_follow_up_date: followUpDate || null, follow_up_note: followUpNote || null });
  }

  async function logTouchpoint(e: React.FormEvent) {
    e.preventDefault();
    setAddingTp(true);
    try {
      const res = await fetch("/api/crm/touchpoints", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pipeline_investor_id: investor.id,
          type: tpType,
          subject: tpSubject || null,
          body: tpBody || null,
          occurred_at: new Date(tpDate).toISOString(),
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setTouchpoints(prev => [data.touchpoint, ...prev]);
        setTpSubject("");
        setTpBody("");
        setShowTpForm(false);
      }
    } finally {
      setAddingTp(false);
    }
  }

  return (
    <div>
      {/* Back */}
      <a href="/crm/pipeline" style={{ fontSize: "13px", color: MUTED, textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "6px", marginBottom: "24px" }}>
        ← Back to Pipeline
      </a>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "32px", flexWrap: "wrap", gap: "16px" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "6px", flexWrap: "wrap" }}>
            <h1 style={{ fontSize: "28px", fontWeight: 800, color: "#F8FAFC", margin: 0 }}>{investor.fund_name}</h1>
            <StageBadge stage={investor.stage} />
          </div>
          {(investor.contact_name || investor.role) && (
            <p style={{ fontSize: "14px", color: "#94A3B8", margin: 0 }}>
              {investor.contact_name}{investor.role ? ` · ${investor.role}` : ""}
            </p>
          )}
        </div>
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          {investor.email && (
            <a href={`mailto:${investor.email}`} style={{ fontSize: "13px", background: CARD_BG, border: `1px solid ${BORDER}`, borderRadius: "8px", padding: "8px 14px", color: "#94A3B8", textDecoration: "none" }}>
              ✉ Email
            </a>
          )}
          {investor.linkedin_url && (
            <a href={investor.linkedin_url} target="_blank" rel="noopener noreferrer" style={{ fontSize: "13px", background: CARD_BG, border: `1px solid ${BORDER}`, borderRadius: "8px", padding: "8px 14px", color: "#94A3B8", textDecoration: "none" }}>
              LinkedIn ↗
            </a>
          )}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 380px", gap: "20px", alignItems: "start" }}>
        {/* Left column */}
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>

          {/* Stage selector */}
          <div style={{ background: CARD_BG, border: `1px solid ${BORDER}`, borderRadius: "14px", padding: "24px" }}>
            <h2 style={{ fontSize: "14px", fontWeight: 700, color: "#F8FAFC", marginBottom: "16px" }}>Stage</h2>
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
              {STAGE_ORDER.map(s => {
                const active = investor.stage === s;
                const c = STAGE_COLORS[s];
                return (
                  <button
                    key={s}
                    onClick={() => handleStageChange(s)}
                    style={{
                      background: active ? c.bg : "transparent",
                      color: active ? c.text : MUTED,
                      border: `1px solid ${active ? c.border : BORDER}`,
                      borderRadius: "20px", padding: "6px 14px",
                      fontSize: "12px", fontWeight: active ? 700 : 400,
                      cursor: "pointer", transition: "all 0.15s",
                    }}
                  >
                    {STAGE_LABELS[s]}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Notes + follow-up */}
          <div style={{ background: CARD_BG, border: `1px solid ${BORDER}`, borderRadius: "14px", padding: "24px" }}>
            <h2 style={{ fontSize: "14px", fontWeight: 700, color: "#F8FAFC", marginBottom: "16px" }}>Notes & Follow-up</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div>
                <label style={labelStyle}>Personal Notes</label>
                <textarea
                  style={{ ...inputStyle, minHeight: "100px", resize: "vertical" }}
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="Context, connections, previous conversations…"
                />
              </div>
              <div style={{ display: "flex", gap: "12px" }}>
                <div style={{ flex: 1 }}>
                  <label style={labelStyle}>Next Follow-up Date</label>
                  <input style={inputStyle} type="date" value={followUpDate} onChange={e => setFollowUpDate(e.target.value)} />
                </div>
                <div style={{ flex: 2 }}>
                  <label style={labelStyle}>Follow-up Note</label>
                  <input style={inputStyle} value={followUpNote} onChange={e => setFollowUpNote(e.target.value)} placeholder="What to follow up on…" />
                </div>
              </div>
              <button
                onClick={saveNotes}
                disabled={saving}
                style={{ background: saving ? "#374151" : GREEN, color: "#000", border: "none", borderRadius: "8px", padding: "10px 20px", fontSize: "13px", fontWeight: 700, cursor: saving ? "not-allowed" : "pointer", alignSelf: "flex-start" }}
              >
                {saving ? "Saving…" : "Save"}
              </button>
            </div>
          </div>

          {/* Touchpoint log */}
          <div style={{ background: CARD_BG, border: `1px solid ${BORDER}`, borderRadius: "14px", padding: "24px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
              <h2 style={{ fontSize: "14px", fontWeight: 700, color: "#F8FAFC", margin: 0 }}>Activity Log</h2>
              <button
                onClick={() => setShowTpForm(v => !v)}
                style={{ background: "rgba(3,251,131,0.1)", color: GREEN, border: `1px solid rgba(3,251,131,0.3)`, borderRadius: "8px", padding: "6px 14px", fontSize: "12px", fontWeight: 600, cursor: "pointer" }}
              >
                + Log Activity
              </button>
            </div>

            {showTpForm && (
              <form onSubmit={logTouchpoint} style={{ background: "#111927", border: `1px solid ${BORDER}`, borderRadius: "10px", padding: "16px", marginBottom: "16px", display: "flex", flexDirection: "column", gap: "10px" }}>
                <div style={{ display: "flex", gap: "10px" }}>
                  <div style={{ flex: 1 }}>
                    <label style={labelStyle}>Type</label>
                    <select value={tpType} onChange={e => setTpType(e.target.value as TouchpointType)} style={{ ...inputStyle }}>
                      {(Object.keys(TOUCHPOINT_LABELS) as TouchpointType[]).map(t => (
                        <option key={t} value={t}>{TOUCHPOINT_LABELS[t]}</option>
                      ))}
                    </select>
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={labelStyle}>Date & Time</label>
                    <input style={inputStyle} type="datetime-local" value={tpDate} onChange={e => setTpDate(e.target.value)} />
                  </div>
                </div>
                <div>
                  <label style={labelStyle}>Subject / Title</label>
                  <input style={inputStyle} value={tpSubject} onChange={e => setTpSubject(e.target.value)} placeholder="e.g. Intro call, Follow-up email…" />
                </div>
                <div>
                  <label style={labelStyle}>Notes</label>
                  <textarea style={{ ...inputStyle, minHeight: "70px", resize: "vertical" }} value={tpBody} onChange={e => setTpBody(e.target.value)} placeholder="What was discussed, outcomes, next steps…" />
                </div>
                <div style={{ display: "flex", gap: "8px" }}>
                  <button type="submit" disabled={addingTp} style={{ background: addingTp ? "#374151" : GREEN, color: "#000", border: "none", borderRadius: "8px", padding: "8px 18px", fontSize: "13px", fontWeight: 700, cursor: addingTp ? "not-allowed" : "pointer" }}>
                    {addingTp ? "Saving…" : "Log Activity"}
                  </button>
                  <button type="button" onClick={() => setShowTpForm(false)} style={{ background: "transparent", color: MUTED, border: `1px solid ${BORDER}`, borderRadius: "8px", padding: "8px 14px", fontSize: "13px", cursor: "pointer" }}>
                    Cancel
                  </button>
                </div>
              </form>
            )}

            {touchpoints.length === 0 ? (
              <p style={{ fontSize: "13px", color: MUTED, textAlign: "center", padding: "24px 0" }}>No activity logged yet.</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "1px" }}>
                {touchpoints.map((tp, i) => (
                  <div key={tp.id} style={{ display: "flex", gap: "12px", padding: "12px 0", borderBottom: i < touchpoints.length - 1 ? `1px solid ${BORDER}` : "none" }}>
                    <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: GREEN, flexShrink: 0, marginTop: "6px" }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: "8px", marginBottom: "2px" }}>
                        <span style={{ fontSize: "13px", fontWeight: 600, color: "#F8FAFC" }}>{TOUCHPOINT_LABELS[tp.type]}</span>
                        <span style={{ fontSize: "11px", color: MUTED, flexShrink: 0 }}>{formatDateTime(tp.occurred_at)}</span>
                      </div>
                      {tp.subject && <div style={{ fontSize: "13px", color: "#94A3B8", marginBottom: "2px" }}>{tp.subject}</div>}
                      {tp.body && <div style={{ fontSize: "13px", color: MUTED, lineHeight: 1.5 }}>{tp.body}</div>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right column — investor profile */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div style={{ background: CARD_BG, border: `1px solid ${BORDER}`, borderRadius: "14px", padding: "24px" }}>
            <h2 style={{ fontSize: "14px", fontWeight: 700, color: "#F8FAFC", marginBottom: "16px" }}>Investor Profile</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {[
                { label: "Email", value: investor.email, link: investor.email ? `mailto:${investor.email}` : null },
                { label: "LinkedIn", value: investor.linkedin_url ? "View profile" : null, link: investor.linkedin_url },
              ].map(({ label, value, link }) => value ? (
                <div key={label}>
                  <div style={{ fontSize: "11px", color: MUTED, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "3px" }}>{label}</div>
                  {link ? (
                    <a href={link} target="_blank" rel="noopener noreferrer" style={{ fontSize: "13px", color: GREEN, textDecoration: "none" }}>{value}</a>
                  ) : (
                    <span style={{ fontSize: "13px", color: "#F8FAFC" }}>{value}</span>
                  )}
                </div>
              ) : null)}

              {investor.stage_focus?.length > 0 && (
                <div>
                  <div style={{ fontSize: "11px", color: MUTED, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "6px" }}>Stage Focus</div>
                  <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                    {investor.stage_focus.map(s => <span key={s} style={{ background: "rgba(59,130,246,0.1)", color: "#60A5FA", border: "1px solid rgba(59,130,246,0.2)", fontSize: "11px", padding: "2px 8px", borderRadius: "10px" }}>{s}</span>)}
                  </div>
                </div>
              )}

              {investor.geography?.length > 0 && (
                <div>
                  <div style={{ fontSize: "11px", color: MUTED, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "6px" }}>Geography</div>
                  <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                    {investor.geography.map(g => <span key={g} style={{ background: "rgba(107,114,128,0.1)", color: "#9CA3AF", border: "1px solid rgba(107,114,128,0.2)", fontSize: "11px", padding: "2px 8px", borderRadius: "10px" }}>{g}</span>)}
                  </div>
                </div>
              )}

              {investor.sector_focus?.length > 0 && (
                <div>
                  <div style={{ fontSize: "11px", color: MUTED, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "6px" }}>Sectors</div>
                  <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                    {investor.sector_focus.map(s => <span key={s} style={{ background: "rgba(139,92,246,0.1)", color: "#A78BFA", border: "1px solid rgba(139,92,246,0.2)", fontSize: "11px", padding: "2px 8px", borderRadius: "10px" }}>{s}</span>)}
                  </div>
                </div>
              )}

              {(investor.check_size_min || investor.check_size_max) && (
                <div>
                  <div style={{ fontSize: "11px", color: MUTED, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "3px" }}>Typical Check</div>
                  <span style={{ fontSize: "13px", color: "#FBBF24" }}>
                    {investor.check_size_min && `$${investor.check_size_min >= 1000 ? `${investor.check_size_min / 1000}M` : `${investor.check_size_min}k`}`}
                    {investor.check_size_min && investor.check_size_max && " – "}
                    {investor.check_size_max && `$${investor.check_size_max >= 1000 ? `${investor.check_size_max / 1000}M` : `${investor.check_size_max}k`}`}
                  </span>
                </div>
              )}

              {investor.thesis_notes && (
                <div>
                  <div style={{ fontSize: "11px", color: MUTED, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "3px" }}>Thesis</div>
                  <p style={{ fontSize: "13px", color: "#94A3B8", lineHeight: 1.6, margin: 0 }}>{investor.thesis_notes}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
