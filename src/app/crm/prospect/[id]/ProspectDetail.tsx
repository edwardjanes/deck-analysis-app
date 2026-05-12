"use client";

import { useState, useCallback } from "react";
import {
  ScProspect, ScTouchpoint, ProspectStage, TouchpointType,
  PROSPECT_STAGE_ORDER, PROSPECT_STAGE_LABELS, PROSPECT_STAGE_COLORS,
  TOUCHPOINT_TYPE_LABELS, TOUCHPOINT_ICONS,
} from "@/lib/crm/prospect-types";

const GREEN  = "#03fb83";
const CARD   = "#0F1929";
const BORDER = "#1A2438";
const MUTED  = "#6B7280";

function StageBadge({ stage }: { stage: ProspectStage }) {
  const c = PROSPECT_STAGE_COLORS[stage];
  return (
    <span style={{ background: c.bg, color: c.text, border: `1px solid ${c.border}`, fontSize: "12px", fontWeight: 600, padding: "4px 12px", borderRadius: "20px" }}>
      {PROSPECT_STAGE_LABELS[stage]}
    </span>
  );
}

function scoreColor(s: number | null) {
  if (s === null) return MUTED;
  if (s >= 70) return GREEN;
  if (s >= 40) return "#FCD34D";
  return "#F87171";
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}
function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
}
function overdue(d: string | null) {
  if (!d) return false;
  return new Date(d + "T00:00:00") < new Date(new Date().toDateString());
}

const inp: React.CSSProperties = {
  width: "100%", padding: "9px 12px", background: "#111927",
  border: `1px solid ${BORDER}`, borderRadius: "8px",
  color: "#F8FAFC", fontSize: "14px", outline: "none", boxSizing: "border-box",
};
const lbl: React.CSSProperties = {
  display: "block", fontSize: "12px", fontWeight: 500, color: "#94A3B8", marginBottom: "5px",
};

// ── Add Touchpoint Modal ──────────────────────────────────────────────────────

function AddTouchpointModal({
  prospectId,
  onClose,
  onAdded,
}: {
  prospectId: string;
  onClose: () => void;
  onAdded: (t: ScTouchpoint) => void;
}) {
  const [form, setForm] = useState({
    type: "linkedin_message_sent" as TouchpointType,
    subject: "",
    body: "",
    occurred_at: new Date().toISOString().slice(0, 16),
    fathom_recording_url: "",
    fathom_transcript: "",
    call_duration_mins: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm(prev => ({ ...prev, [k]: e.target.value }));

  const isCall = form.type === "call";

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true); setError("");
    try {
      const res = await fetch(`/api/crm/prospects/${prospectId}/touchpoints`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          occurred_at: new Date(form.occurred_at).toISOString(),
          fathom_recording_url: form.fathom_recording_url || null,
          fathom_transcript: form.fathom_transcript || null,
          call_duration_mins: form.call_duration_mins ? parseInt(form.call_duration_mins) : null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      onAdded(data.touchpoint);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally { setSaving(false); }
  }

  return (
    <div
      style={{ position: "fixed", inset: 0, background: "rgba(5,8,16,0.88)", backdropFilter: "blur(6px)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: "24px" }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{ background: "#0D1420", border: `1px solid ${BORDER}`, borderRadius: "16px", padding: "36px", width: "100%", maxWidth: "520px", maxHeight: "90vh", overflowY: "auto" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "24px" }}>
          <h2 style={{ fontSize: "18px", fontWeight: 700, color: "#F8FAFC", margin: 0 }}>Log Touchpoint</h2>
          <button onClick={onClose} style={{ background: "none", border: "none", color: MUTED, fontSize: "20px", cursor: "pointer" }}>×</button>
        </div>
        <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          <div style={{ display: "flex", gap: "12px" }}>
            <div style={{ flex: 2 }}>
              <label style={lbl}>Type *</label>
              <select style={{ ...inp, cursor: "pointer" }} value={form.type} onChange={set("type")}>
                {(Object.keys(TOUCHPOINT_TYPE_LABELS) as TouchpointType[]).map(t => (
                  <option key={t} value={t}>{TOUCHPOINT_ICONS[t]} {TOUCHPOINT_TYPE_LABELS[t]}</option>
                ))}
              </select>
            </div>
            <div style={{ flex: 1 }}>
              <label style={lbl}>Date & Time</label>
              <input style={inp} type="datetime-local" value={form.occurred_at} onChange={set("occurred_at")} />
            </div>
          </div>

          <div>
            <label style={lbl}>Subject / Headline</label>
            <input style={inp} value={form.subject} onChange={set("subject")} placeholder={isCall ? "Discovery call" : "Re: your raise"} />
          </div>

          <div>
            <label style={lbl}>{isCall ? "Call Notes" : "Message Body"}</label>
            <textarea
              style={{ ...inp, minHeight: "100px", resize: "vertical" }}
              value={form.body} onChange={set("body")}
              placeholder={isCall ? "Key points discussed, objections, next steps…" : "Paste the message you sent or received…"}
            />
          </div>

          {isCall && (
            <>
              <div style={{ display: "flex", gap: "12px" }}>
                <div style={{ flex: 2 }}>
                  <label style={lbl}>Fathom Recording URL</label>
                  <input style={inp} value={form.fathom_recording_url} onChange={set("fathom_recording_url")} placeholder="https://fathom.video/calls/..." />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={lbl}>Duration (mins)</label>
                  <input style={inp} type="number" min="1" value={form.call_duration_mins} onChange={set("call_duration_mins")} placeholder="30" />
                </div>
              </div>
              <div>
                <label style={lbl}>Paste Transcript (from Fathom)</label>
                <textarea
                  style={{ ...inp, minHeight: "120px", resize: "vertical", fontFamily: "monospace", fontSize: "12px" }}
                  value={form.fathom_transcript} onChange={set("fathom_transcript")}
                  placeholder="Paste the full transcript here to enable AI-powered follow-up suggestions…"
                />
              </div>
            </>
          )}

          {error && <p style={{ fontSize: "13px", color: "#EF4444", margin: 0 }}>{error}</p>}
          <button
            type="submit" disabled={saving}
            style={{ background: saving ? "#374151" : GREEN, color: "#000", border: "none", borderRadius: "10px", padding: "12px", fontSize: "14px", fontWeight: 700, cursor: saving ? "not-allowed" : "pointer", marginTop: "4px" }}
          >
            {saving ? "Saving…" : "Log Touchpoint →"}
          </button>
        </form>
      </div>
    </div>
  );
}

// ── AI Suggestion Panel ───────────────────────────────────────────────────────

function AISuggestionPanel({ prospect }: { prospect: ScProspect }) {
  const [loading, setLoading] = useState(false);
  const [suggestion, setSuggestion] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  async function generate() {
    setLoading(true);
    try {
      const res = await fetch(`/api/crm/prospects/${prospect.id}/suggest`, { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSuggestion(data.suggestion);
    } catch (err) {
      setSuggestion(`Error: ${err instanceof Error ? err.message : "Failed"}`);
    } finally { setLoading(false); }
  }

  async function copy() {
    if (!suggestion) return;
    await navigator.clipboard.writeText(suggestion);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const hasTranscript = prospect.touchpoints?.some(t => t.fathom_transcript);

  return (
    <div style={{ background: "rgba(3,251,131,0.04)", border: `1px solid rgba(3,251,131,0.15)`, borderRadius: "12px", padding: "20px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px" }}>
        <div>
          <div style={{ fontSize: "13px", fontWeight: 700, color: GREEN }}>AI Follow-up Suggestion</div>
          <div style={{ fontSize: "12px", color: MUTED, marginTop: "2px" }}>
            {hasTranscript ? "Based on call transcript + conversation history" : "Based on conversation history"}
          </div>
        </div>
        <button
          onClick={generate}
          disabled={loading}
          style={{ background: loading ? "#374151" : GREEN, color: "#000", border: "none", borderRadius: "8px", padding: "8px 16px", fontSize: "12px", fontWeight: 700, cursor: loading ? "not-allowed" : "pointer" }}
        >
          {loading ? "Generating…" : suggestion ? "Regenerate" : "Generate"}
        </button>
      </div>

      {suggestion && (
        <div style={{ background: "#0D1420", border: `1px solid ${BORDER}`, borderRadius: "8px", padding: "14px", position: "relative" }}>
          <p style={{ fontSize: "14px", color: "#F8FAFC", lineHeight: 1.6, margin: 0, whiteSpace: "pre-wrap" }}>{suggestion}</p>
          <button
            onClick={copy}
            style={{ position: "absolute", top: "10px", right: "10px", background: copied ? "rgba(3,251,131,0.15)" : BORDER, border: "none", borderRadius: "6px", padding: "4px 10px", fontSize: "11px", color: copied ? GREEN : "#94A3B8", cursor: "pointer", fontWeight: 600 }}
          >
            {copied ? "Copied!" : "Copy"}
          </button>
        </div>
      )}

      {!suggestion && !loading && (
        <p style={{ fontSize: "13px", color: MUTED, margin: 0 }}>
          Click Generate to get a personalised follow-up message based on {hasTranscript ? "the call transcript and " : ""}this prospect's conversation history.
        </p>
      )}
    </div>
  );
}

// ── Lead Score Panel ──────────────────────────────────────────────────────────

function LeadScorePanel({ prospect, onScoreUpdated }: { prospect: ScProspect; onScoreUpdated: (score: number, rationale: string) => void }) {
  const [loading, setLoading] = useState(false);
  const [nextAction, setNextAction] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function score() {
    setLoading(true); setError("");
    try {
      const res = await fetch(`/api/crm/prospects/${prospect.id}/score`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      onScoreUpdated(data.score, data.rationale);
      setNextAction(data.next_action);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Scoring failed");
    } finally { setLoading(false); }
  }

  const s = prospect.lead_score;
  const scoreVal = s ?? null;
  const color = scoreColor(scoreVal);

  return (
    <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: "12px", padding: "20px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
        <div style={{ fontSize: "13px", fontWeight: 700, color: "#F8FAFC" }}>Lead Score</div>
        <button
          onClick={score} disabled={loading}
          style={{ background: "transparent", color: GREEN, border: `1px solid rgba(3,251,131,0.3)`, borderRadius: "8px", padding: "6px 14px", fontSize: "12px", fontWeight: 600, cursor: loading ? "not-allowed" : "pointer" }}
        >
          {loading ? "Scoring…" : s !== null ? "Re-score" : "Score with AI"}
        </button>
      </div>

      {scoreVal !== null ? (
        <>
          {/* Score meter */}
          <div style={{ marginBottom: "12px" }}>
            <div style={{ display: "flex", alignItems: "baseline", gap: "4px", marginBottom: "8px" }}>
              <span style={{ fontSize: "36px", fontWeight: 800, color }}>{scoreVal}</span>
              <span style={{ fontSize: "14px", color: MUTED }}>/100</span>
            </div>
            <div style={{ height: "6px", background: BORDER, borderRadius: "3px", overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${scoreVal}%`, background: color, borderRadius: "3px", transition: "width 0.5s ease" }} />
            </div>
          </div>
          {prospect.lead_score_rationale && (
            <p style={{ fontSize: "13px", color: "#94A3B8", lineHeight: 1.5, margin: "0 0 10px" }}>
              {prospect.lead_score_rationale}
            </p>
          )}
          {nextAction && (
            <div style={{ background: "rgba(3,251,131,0.06)", border: `1px solid rgba(3,251,131,0.15)`, borderRadius: "8px", padding: "10px 14px" }}>
              <span style={{ fontSize: "11px", fontWeight: 700, color: GREEN, textTransform: "uppercase", letterSpacing: "0.06em" }}>Recommended Next Step</span>
              <p style={{ fontSize: "13px", color: "#F8FAFC", margin: "4px 0 0" }}>{nextAction}</p>
            </div>
          )}
          {prospect.lead_score_updated_at && (
            <p style={{ fontSize: "11px", color: "#374151", margin: "10px 0 0" }}>
              Scored {fmtDate(prospect.lead_score_updated_at)}
            </p>
          )}
        </>
      ) : (
        <p style={{ fontSize: "13px", color: MUTED }}>
          No score yet. Click &ldquo;Score with AI&rdquo; to get a lead quality rating based on this prospect&rsquo;s profile and engagement.
        </p>
      )}

      {error && <p style={{ fontSize: "13px", color: "#EF4444", marginTop: "10px" }}>{error}</p>}
    </div>
  );
}

// ── Touchpoint Timeline ───────────────────────────────────────────────────────

function Timeline({ touchpoints, onDelete }: { touchpoints: ScTouchpoint[]; onDelete: (id: string) => void }) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (touchpoints.length === 0) {
    return (
      <div style={{ padding: "40px", textAlign: "center", color: MUTED, fontSize: "14px" }}>
        No interactions logged yet.
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
      {touchpoints.map(t => {
        const expanded = expandedId === t.id;
        return (
          <div key={t.id} style={{ background: "#0D1420", border: `1px solid ${BORDER}`, borderRadius: "10px", overflow: "hidden" }}>
            {/* Header row */}
            <div
              style={{ display: "flex", alignItems: "center", gap: "12px", padding: "14px 16px", cursor: "pointer" }}
              onClick={() => setExpandedId(expanded ? null : t.id)}
            >
              <span style={{ fontSize: "18px", lineHeight: 1 }}>{TOUCHPOINT_ICONS[t.type]}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                  <span style={{ fontSize: "13px", fontWeight: 600, color: "#F8FAFC" }}>
                    {TOUCHPOINT_TYPE_LABELS[t.type]}
                  </span>
                  {t.subject && (
                    <span style={{ fontSize: "13px", color: "#94A3B8" }}>— {t.subject}</span>
                  )}
                  {t.call_duration_mins && (
                    <span style={{ fontSize: "11px", color: MUTED, background: BORDER, padding: "2px 8px", borderRadius: "10px" }}>
                      {t.call_duration_mins} min
                    </span>
                  )}
                  {t.fathom_transcript && (
                    <span style={{ fontSize: "11px", color: GREEN, background: "rgba(3,251,131,0.1)", padding: "2px 8px", borderRadius: "10px" }}>
                      Transcript
                    </span>
                  )}
                  {t.ai_follow_up_suggestion && (
                    <span style={{ fontSize: "11px", color: "#C084FC", background: "rgba(168,85,247,0.1)", padding: "2px 8px", borderRadius: "10px" }}>
                      AI Suggestion
                    </span>
                  )}
                </div>
                <div style={{ fontSize: "12px", color: MUTED, marginTop: "2px" }}>
                  {fmtDate(t.occurred_at)} at {fmtTime(t.occurred_at)}
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                {t.fathom_recording_url && (
                  <a
                    href={t.fathom_recording_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={e => e.stopPropagation()}
                    style={{ fontSize: "11px", color: "#60A5FA", textDecoration: "none", fontWeight: 600, background: "rgba(59,130,246,0.1)", padding: "3px 10px", borderRadius: "6px" }}
                  >
                    Watch Recording ↗
                  </a>
                )}
                <button
                  onClick={e => { e.stopPropagation(); onDelete(t.id); }}
                  style={{ background: "none", border: "none", color: "#374151", cursor: "pointer", fontSize: "14px", padding: "2px 6px", borderRadius: "4px" }}
                  title="Delete"
                >×</button>
                <span style={{ color: MUTED, fontSize: "12px" }}>{expanded ? "▲" : "▼"}</span>
              </div>
            </div>

            {/* Expanded body */}
            {expanded && (
              <div style={{ borderTop: `1px solid ${BORDER}`, padding: "16px" }}>
                {t.body && (
                  <div style={{ marginBottom: t.fathom_transcript || t.ai_follow_up_suggestion ? "16px" : 0 }}>
                    <div style={{ fontSize: "11px", fontWeight: 600, color: MUTED, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "6px" }}>Notes</div>
                    <p style={{ fontSize: "14px", color: "#94A3B8", lineHeight: 1.6, margin: 0, whiteSpace: "pre-wrap" }}>{t.body}</p>
                  </div>
                )}
                {t.fathom_transcript && (
                  <div style={{ marginBottom: t.ai_follow_up_suggestion ? "16px" : 0 }}>
                    <div style={{ fontSize: "11px", fontWeight: 600, color: MUTED, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "6px" }}>Call Transcript</div>
                    <div style={{ background: "#080C14", border: `1px solid ${BORDER}`, borderRadius: "8px", padding: "12px", maxHeight: "240px", overflowY: "auto" }}>
                      <pre style={{ fontSize: "12px", color: "#94A3B8", margin: 0, whiteSpace: "pre-wrap", fontFamily: "monospace", lineHeight: 1.6 }}>{t.fathom_transcript}</pre>
                    </div>
                  </div>
                )}
                {t.ai_follow_up_suggestion && (
                  <div>
                    <div style={{ fontSize: "11px", fontWeight: 600, color: "#C084FC", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "6px" }}>AI Follow-up Suggestion</div>
                    <div style={{ background: "rgba(168,85,247,0.06)", border: `1px solid rgba(168,85,247,0.2)`, borderRadius: "8px", padding: "12px" }}>
                      <p style={{ fontSize: "14px", color: "#F8FAFC", margin: 0, lineHeight: 1.6 }}>{t.ai_follow_up_suggestion}</p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Main Detail Component ─────────────────────────────────────────────────────

export default function ProspectDetail({ prospect: initial }: { prospect: ScProspect & { touchpoints: ScTouchpoint[] } }) {
  const [prospect, setProspect] = useState(initial);
  const [touchpoints, setTouchpoints] = useState<ScTouchpoint[]>(initial.touchpoints ?? []);
  const [showAddTouchpoint, setShowAddTouchpoint] = useState(false);
  const [editingNotes, setEditingNotes] = useState(false);
  const [notes, setNotes] = useState(prospect.notes ?? "");
  const [savingNotes, setSavingNotes] = useState(false);
  const [editingFollowUp, setEditingFollowUp] = useState(false);
  const [followUpDate, setFollowUpDate] = useState(prospect.next_follow_up_date ?? "");
  const [followUpNote, setFollowUpNote] = useState(prospect.follow_up_note ?? "");
  const [savingFollowUp, setSavingFollowUp] = useState(false);
  const [updatingStage, setUpdatingStage] = useState(false);

  const handleStageChange = useCallback(async (stage: ProspectStage) => {
    setUpdatingStage(true);
    setProspect(prev => ({ ...prev, stage }));
    await fetch(`/api/crm/prospects/${prospect.id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stage }),
    });
    setUpdatingStage(false);
  }, [prospect.id]);

  const saveNotes = useCallback(async () => {
    setSavingNotes(true);
    await fetch(`/api/crm/prospects/${prospect.id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ notes }),
    });
    setProspect(prev => ({ ...prev, notes }));
    setSavingNotes(false);
    setEditingNotes(false);
  }, [prospect.id, notes]);

  const saveFollowUp = useCallback(async () => {
    setSavingFollowUp(true);
    await fetch(`/api/crm/prospects/${prospect.id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ next_follow_up_date: followUpDate || null, follow_up_note: followUpNote || null }),
    });
    setProspect(prev => ({ ...prev, next_follow_up_date: followUpDate || null, follow_up_note: followUpNote || null }));
    setSavingFollowUp(false);
    setEditingFollowUp(false);
  }, [prospect.id, followUpDate, followUpNote]);

  const handleDeleteTouchpoint = useCallback(async (id: string) => {
    if (!confirm("Delete this touchpoint?")) return;
    await fetch(`/api/crm/prospects/${prospect.id}/touchpoints?touchpoint_id=${id}`, { method: "DELETE" });
    setTouchpoints(prev => prev.filter(t => t.id !== id));
  }, [prospect.id]);

  const fullName = [prospect.first_name, prospect.last_name].filter(Boolean).join(" ");

  return (
    <>
      {showAddTouchpoint && (
        <AddTouchpointModal
          prospectId={prospect.id}
          onClose={() => setShowAddTouchpoint(false)}
          onAdded={t => {
            setTouchpoints(prev => [t, ...prev]);
            setProspect(prev => ({ ...prev, touchpoints: [t, ...(prev.touchpoints ?? [])] }));
          }}
        />
      )}

      {/* Back + header */}
      <div style={{ marginBottom: "24px" }}>
        <a href="/crm/prospects" style={{ fontSize: "13px", color: MUTED, textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "4px", marginBottom: "16px" }}>
          ← All Prospects
        </a>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: "12px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <div style={{ width: "52px", height: "52px", borderRadius: "50%", background: "rgba(3,251,131,0.1)", border: `2px solid rgba(3,251,131,0.2)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px", fontWeight: 800, color: GREEN, flexShrink: 0 }}>
              {((prospect.first_name?.[0] ?? "") + (prospect.last_name?.[0] ?? "")).toUpperCase() || "?"}
            </div>
            <div>
              <h1 style={{ fontSize: "24px", fontWeight: 800, color: "#F8FAFC", margin: "0 0 4px" }}>{fullName}</h1>
              <div style={{ fontSize: "14px", color: MUTED }}>
                {[prospect.role, prospect.company_name].filter(Boolean).join(" · ")}
                {prospect.location ? ` · ${prospect.location}` : ""}
              </div>
              <div style={{ display: "flex", gap: "8px", marginTop: "8px", flexWrap: "wrap" }}>
                {prospect.email && (
                  <a href={`mailto:${prospect.email}`} style={{ fontSize: "12px", color: "#60A5FA", textDecoration: "none" }}>
                    ✉ {prospect.email}
                  </a>
                )}
                {prospect.linkedin_url && (
                  <a href={prospect.linkedin_url} target="_blank" rel="noopener noreferrer" style={{ fontSize: "12px", color: "#60A5FA", textDecoration: "none" }}>
                    🔗 LinkedIn
                  </a>
                )}
              </div>
            </div>
          </div>
          <button
            onClick={() => setShowAddTouchpoint(true)}
            style={{ background: GREEN, color: "#000", border: "none", borderRadius: "10px", padding: "10px 18px", fontSize: "14px", fontWeight: 700, cursor: "pointer" }}
          >
            + Log Touchpoint
          </button>
        </div>
      </div>

      {/* 2-col layout */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: "24px", alignItems: "start" }}>

        {/* LEFT — Timeline */}
        <div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
            <h2 style={{ fontSize: "16px", fontWeight: 700, color: "#F8FAFC", margin: 0 }}>
              Timeline <span style={{ fontSize: "13px", fontWeight: 400, color: MUTED }}>({touchpoints.length})</span>
            </h2>
          </div>
          <Timeline touchpoints={touchpoints} onDelete={handleDeleteTouchpoint} />

          {/* AI suggestion panel under timeline */}
          <div style={{ marginTop: "24px" }}>
            <AISuggestionPanel prospect={{ ...prospect, touchpoints }} />
          </div>
        </div>

        {/* RIGHT — Sidebar */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>

          {/* Stage */}
          <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: "12px", padding: "16px 20px" }}>
            <div style={{ fontSize: "11px", fontWeight: 600, color: MUTED, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "10px" }}>Stage</div>
            <select
              value={prospect.stage}
              onChange={e => handleStageChange(e.target.value as ProspectStage)}
              disabled={updatingStage}
              style={{ ...inp, marginBottom: "8px", cursor: "pointer" }}
            >
              {PROSPECT_STAGE_ORDER.map(s => (
                <option key={s} value={s}>{PROSPECT_STAGE_LABELS[s]}</option>
              ))}
            </select>
            <StageBadge stage={prospect.stage} />
          </div>

          {/* Lead Score */}
          <LeadScorePanel
            prospect={prospect}
            onScoreUpdated={(score, rationale) =>
              setProspect(prev => ({ ...prev, lead_score: score, lead_score_rationale: rationale }))
            }
          />

          {/* Follow-up */}
          <div style={{ background: CARD, border: `1px solid ${overdue(prospect.next_follow_up_date) ? "rgba(239,68,68,0.3)" : BORDER}`, borderRadius: "12px", padding: "16px 20px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "10px" }}>
              <div style={{ fontSize: "11px", fontWeight: 600, color: MUTED, textTransform: "uppercase", letterSpacing: "0.06em" }}>Follow-up</div>
              <button onClick={() => setEditingFollowUp(!editingFollowUp)} style={{ background: "none", border: "none", color: GREEN, fontSize: "12px", fontWeight: 600, cursor: "pointer" }}>
                {editingFollowUp ? "Cancel" : "Edit"}
              </button>
            </div>
            {editingFollowUp ? (
              <>
                <input style={{ ...inp, marginBottom: "8px" }} type="date" value={followUpDate} onChange={e => setFollowUpDate(e.target.value)} />
                <textarea style={{ ...inp, minHeight: "64px", resize: "vertical", marginBottom: "8px" }} value={followUpNote} onChange={e => setFollowUpNote(e.target.value)} placeholder="What to follow up on…" />
                <button onClick={saveFollowUp} disabled={savingFollowUp} style={{ background: GREEN, color: "#000", border: "none", borderRadius: "8px", padding: "8px 16px", fontSize: "13px", fontWeight: 700, cursor: "pointer" }}>
                  {savingFollowUp ? "Saving…" : "Save"}
                </button>
              </>
            ) : prospect.next_follow_up_date ? (
              <>
                <div style={{ fontSize: "15px", fontWeight: 700, color: overdue(prospect.next_follow_up_date) ? "#EF4444" : "#F8FAFC", marginBottom: "4px" }}>
                  {overdue(prospect.next_follow_up_date) ? "⚠ Overdue · " : ""}{new Date(prospect.next_follow_up_date + "T00:00:00").toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "long" })}
                </div>
                {prospect.follow_up_note && <p style={{ fontSize: "13px", color: "#94A3B8", margin: 0 }}>{prospect.follow_up_note}</p>}
              </>
            ) : (
              <p style={{ fontSize: "13px", color: MUTED, margin: 0 }}>No follow-up scheduled.</p>
            )}
          </div>

          {/* Notes */}
          <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: "12px", padding: "16px 20px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "10px" }}>
              <div style={{ fontSize: "11px", fontWeight: 600, color: MUTED, textTransform: "uppercase", letterSpacing: "0.06em" }}>Private Notes</div>
              <button onClick={() => setEditingNotes(!editingNotes)} style={{ background: "none", border: "none", color: GREEN, fontSize: "12px", fontWeight: 600, cursor: "pointer" }}>
                {editingNotes ? "Cancel" : "Edit"}
              </button>
            </div>
            {editingNotes ? (
              <>
                <textarea
                  style={{ ...inp, minHeight: "100px", resize: "vertical", marginBottom: "8px" }}
                  value={notes} onChange={e => setNotes(e.target.value)}
                  placeholder="Anything relevant — company stage, connection context, objections…"
                />
                <button onClick={saveNotes} disabled={savingNotes} style={{ background: GREEN, color: "#000", border: "none", borderRadius: "8px", padding: "8px 16px", fontSize: "13px", fontWeight: 700, cursor: "pointer" }}>
                  {savingNotes ? "Saving…" : "Save"}
                </button>
              </>
            ) : notes ? (
              <p style={{ fontSize: "13px", color: "#94A3B8", margin: 0, lineHeight: 1.6, whiteSpace: "pre-wrap" }}>{notes}</p>
            ) : (
              <p style={{ fontSize: "13px", color: MUTED, margin: 0 }}>No notes yet.</p>
            )}
          </div>

          {/* Source info */}
          <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: "12px", padding: "16px 20px" }}>
            <div style={{ fontSize: "11px", fontWeight: 600, color: MUTED, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "10px" }}>Details</div>
            {[
              { label: "Source",    value: prospect.source },
              { label: "Added",     value: fmtDate(prospect.created_at) },
              { label: "Updated",   value: fmtDate(prospect.updated_at) },
              { label: "HubSpot ID",value: prospect.hubspot_id },
            ].filter(r => r.value).map(({ label, value }) => (
              <div key={label} style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                <span style={{ fontSize: "12px", color: MUTED }}>{label}</span>
                <span style={{ fontSize: "12px", color: "#94A3B8" }}>{value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}