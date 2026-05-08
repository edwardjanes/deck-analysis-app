"use client";

import { useState } from "react";
import { PipelineInvestor, Touchpoint, TouchpointType, PortfolioCompany, PipelineStage } from "@/lib/crm/types";
import {
  STAGE_ORDER, STAGE_LABELS, STAGE_COLORS, TOUCHPOINT_LABELS,
  SECTOR_TAGS, INVESTMENT_STAGE_TAGS, CHECK_SIZE_TAGS, GEOGRAPHY_TAGS,
} from "@/lib/crm/stages";

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
  display: "block", fontSize: "12px", fontWeight: 500, color: "#94A3B8", marginBottom: "6px",
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

// Tag selector — click to toggle
function TagSelector({ label, options, selected, color, onChange }: {
  label: string;
  options: string[];
  selected: string[];
  color: { bg: string; text: string; border: string };
  onChange: (tags: string[]) => void;
}) {
  function toggle(tag: string) {
    onChange(selected.includes(tag) ? selected.filter(t => t !== tag) : [...selected, tag]);
  }
  return (
    <div>
      <label style={labelStyle}>{label}</label>
      <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
        {options.map(tag => {
          const active = selected.includes(tag);
          return (
            <button
              key={tag}
              type="button"
              onClick={() => toggle(tag)}
              style={{
                background: active ? color.bg : "transparent",
                color: active ? color.text : MUTED,
                border: `1px solid ${active ? color.border : BORDER}`,
                borderRadius: "20px", padding: "4px 12px",
                fontSize: "12px", fontWeight: active ? 600 : 400,
                cursor: "pointer", transition: "all 0.1s",
              }}
            >
              {tag}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function InvestorDetailClient({
  investor: initial,
  touchpoints: initialTouchpoints,
  portfolio: initialPortfolio,
}: {
  investor: PipelineInvestor;
  touchpoints: Touchpoint[];
  portfolio: PortfolioCompany[];
}) {
  const [investor, setInvestor] = useState(initial);
  const [touchpoints, setTouchpoints] = useState(initialTouchpoints);
  const [portfolio, setPortfolio] = useState(initialPortfolio);
  const [saving, setSaving] = useState(false);
  const [notes, setNotes] = useState(investor.personal_notes ?? "");
  const [followUpDate, setFollowUpDate] = useState(investor.next_follow_up_date ?? "");
  const [followUpNote, setFollowUpNote] = useState(investor.follow_up_note ?? "");

  // Tags state (map check size to/from array field)
  const [sectorTags, setSectorTags] = useState<string[]>(investor.sector_focus ?? []);
  const [stageTags, setStageTags] = useState<string[]>(investor.stage_focus ?? []);
  const [checkSizeTags, setCheckSizeTags] = useState<string[]>(investor.geography ?? []);
  // We reuse geography for check_size via a dedicated field; use a separate state
  const [geoTags, setGeoTags] = useState<string[]>(investor.geography ?? []);

  // Touchpoint form
  const [tpType, setTpType] = useState<TouchpointType>("note");
  const [tpSubject, setTpSubject] = useState("");
  const [tpBody, setTpBody] = useState("");
  const [tpDate, setTpDate] = useState(new Date().toISOString().slice(0, 16));
  const [addingTp, setAddingTp] = useState(false);
  const [showTpForm, setShowTpForm] = useState(false);

  // Portfolio form
  const [showPortfolioForm, setShowPortfolioForm] = useState(false);
  const [pcName, setPcName] = useState("");
  const [pcWebsite, setPcWebsite] = useState("");
  const [pcSector, setPcSector] = useState("");
  const [pcStage, setPcStage] = useState("");
  const [pcYear, setPcYear] = useState("");
  const [pcNotes, setPcNotes] = useState("");
  const [addingPc, setAddingPc] = useState(false);

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

  async function saveProfile() {
    await saveField({
      personal_notes: notes,
      next_follow_up_date: followUpDate || null,
      follow_up_note: followUpNote || null,
      sector_focus: sectorTags,
      stage_focus: stageTags,
      geography: geoTags,
    });
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
          type: tpType, subject: tpSubject || null,
          body: tpBody || null,
          occurred_at: new Date(tpDate).toISOString(),
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setTouchpoints(prev => [data.touchpoint, ...prev]);
        setTpSubject(""); setTpBody(""); setShowTpForm(false);
      }
    } finally { setAddingTp(false); }
  }

  async function addPortfolioCompany(e: React.FormEvent) {
    e.preventDefault();
    if (!pcName.trim()) return;
    setAddingPc(true);
    try {
      const res = await fetch("/api/crm/portfolio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pipeline_investor_id: investor.id,
          company_name: pcName,
          website: pcWebsite || null,
          sector: pcSector || null,
          stage_at_investment: pcStage || null,
          year: pcYear ? parseInt(pcYear) : null,
          notes: pcNotes || null,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setPortfolio(prev => [data.company, ...prev]);
        setPcName(""); setPcWebsite(""); setPcSector(""); setPcStage(""); setPcYear(""); setPcNotes("");
        setShowPortfolioForm(false);
      }
    } finally { setAddingPc(false); }
  }

  async function removePortfolioCompany(id: string) {
    setPortfolio(prev => prev.filter(c => c.id !== id));
    await fetch(`/api/crm/portfolio?id=${id}`, { method: "DELETE" });
  }

  return (
    <div>
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
            <a href={`mailto:${investor.email}`} style={{ fontSize: "13px", background: CARD_BG, border: `1px solid ${BORDER}`, borderRadius: "8px", padding: "8px 14px", color: "#94A3B8", textDecoration: "none" }}>✉ Email</a>
          )}
          {investor.linkedin_url && (
            <a href={investor.linkedin_url} target="_blank" rel="noopener noreferrer" style={{ fontSize: "13px", background: CARD_BG, border: `1px solid ${BORDER}`, borderRadius: "8px", padding: "8px 14px", color: "#94A3B8", textDecoration: "none" }}>LinkedIn ↗</a>
          )}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 380px", gap: "20px", alignItems: "start" }}>
        {/* Left column */}
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>

          {/* Pipeline stage */}
          <div style={{ background: CARD_BG, border: `1px solid ${BORDER}`, borderRadius: "14px", padding: "24px" }}>
            <h2 style={{ fontSize: "14px", fontWeight: 700, color: "#F8FAFC", marginBottom: "16px" }}>Pipeline Stage</h2>
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
              {STAGE_ORDER.map(s => {
                const active = investor.stage === s;
                const c = STAGE_COLORS[s];
                return (
                  <button key={s} onClick={() => handleStageChange(s)} style={{
                    background: active ? c.bg : "transparent", color: active ? c.text : MUTED,
                    border: `1px solid ${active ? c.border : BORDER}`, borderRadius: "20px",
                    padding: "6px 14px", fontSize: "12px", fontWeight: active ? 700 : 400,
                    cursor: "pointer", transition: "all 0.15s",
                  }}>
                    {STAGE_LABELS[s]}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Tags */}
          <div style={{ background: CARD_BG, border: `1px solid ${BORDER}`, borderRadius: "14px", padding: "24px" }}>
            <h2 style={{ fontSize: "14px", fontWeight: 700, color: "#F8FAFC", marginBottom: "20px" }}>Investor Tags</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              <TagSelector
                label="Sector Focus"
                options={SECTOR_TAGS}
                selected={sectorTags}
                color={{ bg: "rgba(139,92,246,0.15)", text: "#A78BFA", border: "rgba(139,92,246,0.4)" }}
                onChange={setSectorTags}
              />
              <TagSelector
                label="Investment Stage"
                options={INVESTMENT_STAGE_TAGS}
                selected={stageTags}
                color={{ bg: "rgba(59,130,246,0.15)", text: "#60A5FA", border: "rgba(59,130,246,0.4)" }}
                onChange={setStageTags}
              />
              <TagSelector
                label="Typical Check Size"
                options={CHECK_SIZE_TAGS}
                selected={checkSizeTags}
                color={{ bg: "rgba(251,191,36,0.15)", text: "#FBBF24", border: "rgba(251,191,36,0.4)" }}
                onChange={setCheckSizeTags}
              />
              <TagSelector
                label="Geography"
                options={GEOGRAPHY_TAGS}
                selected={geoTags}
                color={{ bg: "rgba(34,197,94,0.15)", text: "#4ADE80", border: "rgba(34,197,94,0.4)" }}
                onChange={setGeoTags}
              />
            </div>
          </div>

          {/* Notes + follow-up */}
          <div style={{ background: CARD_BG, border: `1px solid ${BORDER}`, borderRadius: "14px", padding: "24px" }}>
            <h2 style={{ fontSize: "14px", fontWeight: 700, color: "#F8FAFC", marginBottom: "16px" }}>Notes & Follow-up</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div>
                <label style={labelStyle}>Personal Notes</label>
                <textarea style={{ ...inputStyle, minHeight: "100px", resize: "vertical" }} value={notes} onChange={e => setNotes(e.target.value)} placeholder="Context, connections, previous conversations…" />
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
              <button onClick={saveProfile} disabled={saving} style={{ background: saving ? "#374151" : GREEN, color: "#000", border: "none", borderRadius: "8px", padding: "10px 20px", fontSize: "13px", fontWeight: 700, cursor: saving ? "not-allowed" : "pointer", alignSelf: "flex-start" }}>
                {saving ? "Saving…" : "Save"}
              </button>
            </div>
          </div>

          {/* Activity log */}
          <div style={{ background: CARD_BG, border: `1px solid ${BORDER}`, borderRadius: "14px", padding: "24px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
              <h2 style={{ fontSize: "14px", fontWeight: 700, color: "#F8FAFC", margin: 0 }}>Activity Log</h2>
              <button onClick={() => setShowTpForm(v => !v)} style={{ background: "rgba(3,251,131,0.1)", color: GREEN, border: `1px solid rgba(3,251,131,0.3)`, borderRadius: "8px", padding: "6px 14px", fontSize: "12px", fontWeight: 600, cursor: "pointer" }}>
                + Log Activity
              </button>
            </div>
            {showTpForm && (
              <form onSubmit={logTouchpoint} style={{ background: "#111927", border: `1px solid ${BORDER}`, borderRadius: "10px", padding: "16px", marginBottom: "16px", display: "flex", flexDirection: "column", gap: "10px" }}>
                <div style={{ display: "flex", gap: "10px" }}>
                  <div style={{ flex: 1 }}>
                    <label style={labelStyle}>Type</label>
                    <select value={tpType} onChange={e => setTpType(e.target.value as TouchpointType)} style={{ ...inputStyle }}>
                      {(Object.keys(TOUCHPOINT_LABELS) as TouchpointType[]).map(t => <option key={t} value={t}>{TOUCHPOINT_LABELS[t]}</option>)}
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
                  <button type="button" onClick={() => setShowTpForm(false)} style={{ background: "transparent", color: MUTED, border: `1px solid ${BORDER}`, borderRadius: "8px", padding: "8px 14px", fontSize: "13px", cursor: "pointer" }}>Cancel</button>
                </div>
              </form>
            )}
            {touchpoints.length === 0 ? (
              <p style={{ fontSize: "13px", color: MUTED, textAlign: "center", padding: "24px 0" }}>No activity logged yet.</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column" }}>
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

        {/* Right column */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>

          {/* Contact info */}
          {(investor.email || investor.linkedin_url || investor.thesis_notes) && (
            <div style={{ background: CARD_BG, border: `1px solid ${BORDER}`, borderRadius: "14px", padding: "24px" }}>
              <h2 style={{ fontSize: "14px", fontWeight: 700, color: "#F8FAFC", marginBottom: "16px" }}>Contact & Thesis</h2>
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {investor.email && (
                  <div>
                    <div style={{ fontSize: "11px", color: MUTED, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "3px" }}>Email</div>
                    <a href={`mailto:${investor.email}`} style={{ fontSize: "13px", color: GREEN, textDecoration: "none" }}>{investor.email}</a>
                  </div>
                )}
                {investor.linkedin_url && (
                  <div>
                    <div style={{ fontSize: "11px", color: MUTED, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "3px" }}>LinkedIn</div>
                    <a href={investor.linkedin_url} target="_blank" rel="noopener noreferrer" style={{ fontSize: "13px", color: GREEN, textDecoration: "none" }}>View profile ↗</a>
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
          )}

          {/* Portfolio companies */}
          <div style={{ background: CARD_BG, border: `1px solid ${BORDER}`, borderRadius: "14px", padding: "24px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
              <h2 style={{ fontSize: "14px", fontWeight: 700, color: "#F8FAFC", margin: 0 }}>Portfolio Companies</h2>
              <button onClick={() => setShowPortfolioForm(v => !v)} style={{ background: "rgba(3,251,131,0.1)", color: GREEN, border: `1px solid rgba(3,251,131,0.3)`, borderRadius: "8px", padding: "5px 12px", fontSize: "12px", fontWeight: 600, cursor: "pointer" }}>
                + Add
              </button>
            </div>

            {showPortfolioForm && (
              <form onSubmit={addPortfolioCompany} style={{ background: "#111927", border: `1px solid ${BORDER}`, borderRadius: "10px", padding: "14px", marginBottom: "14px", display: "flex", flexDirection: "column", gap: "10px" }}>
                <div>
                  <label style={labelStyle}>Company Name *</label>
                  <input style={inputStyle} value={pcName} onChange={e => setPcName(e.target.value)} placeholder="e.g. Monzo" required />
                </div>
                <div>
                  <label style={labelStyle}>Website</label>
                  <input style={inputStyle} value={pcWebsite} onChange={e => setPcWebsite(e.target.value)} placeholder="https://..." />
                </div>
                <div style={{ display: "flex", gap: "8px" }}>
                  <div style={{ flex: 1 }}>
                    <label style={labelStyle}>Sector</label>
                    <select style={inputStyle} value={pcSector} onChange={e => setPcSector(e.target.value)}>
                      <option value="">Select…</option>
                      {SECTOR_TAGS.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={labelStyle}>Stage at Investment</label>
                    <select style={inputStyle} value={pcStage} onChange={e => setPcStage(e.target.value)}>
                      <option value="">Select…</option>
                      {INVESTMENT_STAGE_TAGS.filter(s => s !== "Any").map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label style={labelStyle}>Year</label>
                  <input style={inputStyle} type="number" min="2000" max={new Date().getFullYear()} value={pcYear} onChange={e => setPcYear(e.target.value)} placeholder={String(new Date().getFullYear())} />
                </div>
                <div>
                  <label style={labelStyle}>Notes</label>
                  <input style={inputStyle} value={pcNotes} onChange={e => setPcNotes(e.target.value)} placeholder="Any context…" />
                </div>
                <div style={{ display: "flex", gap: "8px" }}>
                  <button type="submit" disabled={addingPc} style={{ background: addingPc ? "#374151" : GREEN, color: "#000", border: "none", borderRadius: "8px", padding: "7px 16px", fontSize: "12px", fontWeight: 700, cursor: addingPc ? "not-allowed" : "pointer" }}>
                    {addingPc ? "Adding…" : "Add Company"}
                  </button>
                  <button type="button" onClick={() => setShowPortfolioForm(false)} style={{ background: "transparent", color: MUTED, border: `1px solid ${BORDER}`, borderRadius: "8px", padding: "7px 12px", fontSize: "12px", cursor: "pointer" }}>Cancel</button>
                </div>
              </form>
            )}

            {portfolio.length === 0 ? (
              <p style={{ fontSize: "13px", color: MUTED, textAlign: "center", padding: "16px 0" }}>No portfolio companies added yet.</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {portfolio.map(pc => (
                  <div key={pc.id} style={{ border: `1px solid ${BORDER}`, borderRadius: "10px", padding: "12px 14px" }}>
                    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "8px" }}>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: "13px", fontWeight: 700, color: "#F8FAFC", marginBottom: "4px" }}>
                          {pc.website ? <a href={pc.website} target="_blank" rel="noopener noreferrer" style={{ color: "#F8FAFC", textDecoration: "none" }}>{pc.company_name} ↗</a> : pc.company_name}
                        </div>
                        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                          {pc.sector && <span style={{ background: "rgba(139,92,246,0.1)", color: "#A78BFA", border: "1px solid rgba(139,92,246,0.2)", fontSize: "10px", padding: "2px 7px", borderRadius: "10px" }}>{pc.sector}</span>}
                          {pc.stage_at_investment && <span style={{ background: "rgba(59,130,246,0.1)", color: "#60A5FA", border: "1px solid rgba(59,130,246,0.2)", fontSize: "10px", padding: "2px 7px", borderRadius: "10px" }}>{pc.stage_at_investment}</span>}
                          {pc.year && <span style={{ fontSize: "11px", color: MUTED }}>{pc.year}</span>}
                        </div>
                        {pc.notes && <p style={{ fontSize: "12px", color: MUTED, margin: "6px 0 0", lineHeight: 1.5 }}>{pc.notes}</p>}
                      </div>
                      <button onClick={() => removePortfolioCompany(pc.id)} style={{ flexShrink: 0, background: "none", border: "none", color: "#374151", fontSize: "16px", cursor: "pointer", lineHeight: 1, padding: "2px" }}>×</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
