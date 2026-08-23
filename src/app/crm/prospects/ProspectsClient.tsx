"use client";

import { useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  ScProspect, ProspectStage,
  PROSPECT_STAGE_ORDER, PROSPECT_STAGE_LABELS, PROSPECT_STAGE_COLORS,
} from "@/lib/crm/prospect-types";

const GREEN  = "#03fb83";
const CARD   = "#0F1929";
const BORDER = "#1A2438";
const MUTED  = "#6B7280";

// ── Utilities ─────────────────────────────────────────────────────────────────

function fmt(d: string | null) {
  if (!d) return null;
  return new Date(d + "T00:00:00").toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}
function overdue(d: string | null) {
  if (!d) return false;
  return new Date(d + "T00:00:00") < new Date(new Date().toDateString());
}
function scoreColor(s: number | null) {
  if (s === null) return MUTED;
  if (s >= 70) return GREEN;
  if (s >= 40) return "#FCD34D";
  return "#F87171";
}
function initials(p: ScProspect) {
  return ((p.first_name?.[0] ?? "") + (p.last_name?.[0] ?? "")).toUpperCase() || "?";
}
function scoreBand(s: number | null): "hot" | "warm" | "cold" | "unscored" {
  if (s === null) return "unscored";
  if (s >= 70) return "hot";
  if (s >= 40) return "warm";
  return "cold";
}

function StageBadge({ stage }: { stage: ProspectStage }) {
  const c = PROSPECT_STAGE_COLORS[stage];
  return (
    <span style={{
      background: c.bg, color: c.text, border: `1px solid ${c.border}`,
      fontSize: "11px", fontWeight: 600, padding: "3px 10px", borderRadius: "20px",
      whiteSpace: "nowrap",
    }}>
      {PROSPECT_STAGE_LABELS[stage]}
    </span>
  );
}

// ── Funnel Visualisation ──────────────────────────────────────────────────────

function FunnelChart({
  prospects,
  activeStage,
  onStageClick,
}: {
  prospects: ScProspect[];
  activeStage: ProspectStage | "";
  onStageClick: (s: ProspectStage) => void;
}) {
  // Exclude "lost" from funnel shape — show it separately
  const funnelStages = PROSPECT_STAGE_ORDER.filter(s => s !== "lost");
  const lostCount = prospects.filter(p => p.stage === "lost").length;

  const counts = Object.fromEntries(
    PROSPECT_STAGE_ORDER.map(s => [s, prospects.filter(p => p.stage === s).length])
  ) as Record<ProspectStage, number>;

  const maxCount = Math.max(...funnelStages.map(s => counts[s]), 1);

  // Conversion rates between adjacent stages
  const convRates: Record<string, number | null> = {};
  for (let i = 0; i < funnelStages.length - 1; i++) {
    const from = counts[funnelStages[i]];
    const to   = counts[funnelStages[i + 1]];
    convRates[funnelStages[i]] = from > 0 ? Math.round((to / from) * 100) : null;
  }

  return (
    <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: "14px", padding: "24px 28px", marginBottom: "24px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
        <div>
          <div style={{ fontSize: "15px", fontWeight: 700, color: "#F8FAFC" }}>Pipeline Funnel</div>
          <div style={{ fontSize: "12px", color: MUTED, marginTop: "2px" }}>Click a stage to filter the list below</div>
        </div>
        {activeStage && (
          <button
            onClick={() => onStageClick(activeStage)}
            style={{ background: "none", border: `1px solid ${BORDER}`, borderRadius: "8px", padding: "5px 12px", color: MUTED, fontSize: "12px", cursor: "pointer" }}
          >
            Clear filter
          </button>
        )}
      </div>

      {/* Funnel bars */}
      <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
        {funnelStages.map((s, i) => {
          const count   = counts[s];
          const pct     = maxCount > 0 ? (count / maxCount) * 100 : 0;
          const c       = PROSPECT_STAGE_COLORS[s];
          const isActive = activeStage === s;
          const conv    = convRates[s];
          // Taper: each bar is narrower, anchored centre
          const minPct  = 30;
          const barPct  = minPct + ((100 - minPct) * (1 - i / (funnelStages.length - 1)));

          return (
            <div key={s}>
              <button
                onClick={() => onStageClick(s)}
                style={{
                  width: "100%", background: "none", border: "none", padding: 0,
                  cursor: count > 0 ? "pointer" : "default",
                }}
              >
                {/* Bar row */}
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  {/* Label */}
                  <div style={{ width: "130px", textAlign: "right", flexShrink: 0 }}>
                    <span style={{ fontSize: "12px", fontWeight: isActive ? 700 : 500, color: isActive ? c.text : "#94A3B8" }}>
                      {PROSPECT_STAGE_LABELS[s]}
                    </span>
                  </div>

                  {/* Tapered bar container */}
                  <div style={{ flex: 1, display: "flex", justifyContent: "center" }}>
                    <div style={{ width: `${barPct}%`, position: "relative" }}>
                      <div style={{
                        height: "32px", borderRadius: "6px",
                        background: isActive ? c.bg : "rgba(255,255,255,0.04)",
                        border: `1px solid ${isActive ? c.border : BORDER}`,
                        overflow: "hidden",
                        transition: "all 0.2s",
                      }}>
                        <div style={{
                          height: "100%",
                          width: `${pct}%`,
                          background: `linear-gradient(90deg, ${c.text}30, ${c.text}60)`,
                          transition: "width 0.4s ease",
                        }} />
                        <div style={{
                          position: "absolute", inset: 0,
                          display: "flex", alignItems: "center", justifyContent: "center",
                          fontSize: "13px", fontWeight: 700,
                          color: count > 0 ? (isActive ? c.text : "#F8FAFC") : MUTED,
                        }}>
                          {count}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Conversion rate to next */}
                  <div style={{ width: "60px", flexShrink: 0, textAlign: "left" }}>
                    {conv !== null && i < funnelStages.length - 1 ? (
                      <span style={{ fontSize: "11px", color: conv >= 20 ? GREEN : conv >= 10 ? "#FCD34D" : MUTED }}>
                        {conv}% →
                      </span>
                    ) : null}
                  </div>
                </div>
              </button>
            </div>
          );
        })}
      </div>

      {/* Lost + overall conversion row */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "20px", paddingTop: "16px", borderTop: `1px solid ${BORDER}` }}>
        <button
          onClick={() => onStageClick("lost")}
          style={{
            background: activeStage === "lost" ? "rgba(239,68,68,0.1)" : "transparent",
            border: `1px solid ${activeStage === "lost" ? "rgba(239,68,68,0.3)" : BORDER}`,
            borderRadius: "8px", padding: "6px 14px", cursor: "pointer",
            display: "flex", alignItems: "center", gap: "8px",
          }}
        >
          <span style={{ fontSize: "12px", color: "#F87171", fontWeight: 600 }}>Lost</span>
          <span style={{ fontSize: "13px", fontWeight: 700, color: lostCount > 0 ? "#F87171" : MUTED }}>{lostCount}</span>
        </button>

        {counts.connection_request > 0 && counts.sale > 0 && (
          <div style={{ fontSize: "12px", color: MUTED }}>
            Overall conversion:{" "}
            <span style={{ color: GREEN, fontWeight: 700 }}>
              {Math.round((counts.sale / counts.connection_request) * 100)}%
            </span>
            {" "}(connection → sale)
          </div>
        )}
      </div>
    </div>
  );
}

// ── Add Prospect Modal ────────────────────────────────────────────────────────

interface AddModalProps { onClose: () => void; onAdded: (p: ScProspect) => void; }

function AddProspectModal({ onClose, onAdded }: AddModalProps) {
  const [form, setForm] = useState({
    first_name: "", last_name: "", email: "", linkedin_url: "",
    company_name: "", role: "", location: "", notes: "",
    stage: "connection_request" as ProspectStage,
    next_follow_up_date: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm(prev => ({ ...prev, [k]: e.target.value }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.first_name.trim()) { setError("First name is required"); return; }
    setSaving(true); setError("");
    try {
      const res = await fetch("/api/crm/prospects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, next_follow_up_date: form.next_follow_up_date || null }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      onAdded(data.prospect);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally { setSaving(false); }
  }

  const inp: React.CSSProperties = {
    width: "100%", padding: "9px 12px", background: "#111927",
    border: `1px solid ${BORDER}`, borderRadius: "8px",
    color: "#F8FAFC", fontSize: "14px", outline: "none", boxSizing: "border-box",
  };
  const lbl: React.CSSProperties = {
    display: "block", fontSize: "12px", fontWeight: 500, color: "#94A3B8", marginBottom: "5px",
  };

  return (
    <div
      style={{ position: "fixed", inset: 0, background: "rgba(5,8,16,0.88)", backdropFilter: "blur(6px)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: "24px" }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{ background: "#0D1420", border: `1px solid ${BORDER}`, borderRadius: "16px", padding: "36px", width: "100%", maxWidth: "520px", maxHeight: "90vh", overflowY: "auto" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "24px" }}>
          <h2 style={{ fontSize: "18px", fontWeight: 700, color: "#F8FAFC", margin: 0 }}>Add Prospect</h2>
          <button onClick={onClose} style={{ background: "none", border: "none", color: MUTED, fontSize: "20px", cursor: "pointer" }}>×</button>
        </div>
        <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          <div style={{ display: "flex", gap: "12px" }}>
            <div style={{ flex: 1 }}>
              <label style={lbl}>First Name *</label>
              <input style={inp} value={form.first_name} onChange={set("first_name")} placeholder="Jane" required />
            </div>
            <div style={{ flex: 1 }}>
              <label style={lbl}>Last Name</label>
              <input style={inp} value={form.last_name} onChange={set("last_name")} placeholder="Smith" />
            </div>
          </div>
          <div style={{ display: "flex", gap: "12px" }}>
            <div style={{ flex: 1 }}>
              <label style={lbl}>Company</label>
              <input style={inp} value={form.company_name} onChange={set("company_name")} placeholder="Acme Ltd" />
            </div>
            <div style={{ flex: 1 }}>
              <label style={lbl}>Role / Title</label>
              <input style={inp} value={form.role} onChange={set("role")} placeholder="Co-founder & CEO" />
            </div>
          </div>
          <div>
            <label style={lbl}>LinkedIn URL</label>
            <input style={inp} value={form.linkedin_url} onChange={set("linkedin_url")} placeholder="https://linkedin.com/in/..." />
          </div>
          <div>
            <label style={lbl}>Email</label>
            <input style={inp} type="email" value={form.email} onChange={set("email")} placeholder="jane@acme.com" />
          </div>
          <div style={{ display: "flex", gap: "12px" }}>
            <div style={{ flex: 1 }}>
              <label style={lbl}>Stage</label>
              <select style={{ ...inp, cursor: "pointer" }} value={form.stage} onChange={set("stage")}>
                {PROSPECT_STAGE_ORDER.map(s => (
                  <option key={s} value={s}>{PROSPECT_STAGE_LABELS[s]}</option>
                ))}
              </select>
            </div>
            <div style={{ flex: 1 }}>
              <label style={lbl}>Follow-up Date</label>
              <input style={inp} type="date" value={form.next_follow_up_date} onChange={set("next_follow_up_date")} />
            </div>
          </div>
          <div>
            <label style={lbl}>Notes</label>
            <textarea style={{ ...inp, minHeight: "72px", resize: "vertical" }} value={form.notes} onChange={set("notes")} placeholder="Context, connection method, etc." />
          </div>
          {error && <p style={{ fontSize: "13px", color: "#EF4444", margin: 0 }}>{error}</p>}
          <button
            type="submit" disabled={saving}
            style={{ background: saving ? "#374151" : GREEN, color: "#000", border: "none", borderRadius: "10px", padding: "12px", fontSize: "14px", fontWeight: 700, cursor: saving ? "not-allowed" : "pointer", marginTop: "4px" }}
          >
            {saving ? "Adding…" : "Add Prospect →"}
          </button>
        </form>
      </div>
    </div>
  );
}

// ── Import Modal ──────────────────────────────────────────────────────────────

function ImportModal({ onClose, onImported }: { onClose: () => void; onImported: (n: number) => void }) {
  const [mode, setMode] = useState<"sheet" | "csv">("sheet");
  const [sheetUrl, setSheetUrl] = useState("");
  const [csvText, setCsvText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function doImport() {
    setLoading(true); setError("");
    try {
      const body = mode === "sheet" ? { sheet_url: sheetUrl } : { csv: csvText };
      const res = await fetch("/api/crm/prospects/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      onImported(data.imported);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Import failed");
    } finally { setLoading(false); }
  }

  const inp: React.CSSProperties = {
    width: "100%", padding: "9px 12px", background: "#111927",
    border: `1px solid ${BORDER}`, borderRadius: "8px",
    color: "#F8FAFC", fontSize: "14px", outline: "none", boxSizing: "border-box",
  };

  return (
    <div
      style={{ position: "fixed", inset: 0, background: "rgba(5,8,16,0.88)", backdropFilter: "blur(6px)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: "24px" }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{ background: "#0D1420", border: `1px solid ${BORDER}`, borderRadius: "16px", padding: "36px", width: "100%", maxWidth: "480px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "24px" }}>
          <h2 style={{ fontSize: "18px", fontWeight: 700, color: "#F8FAFC", margin: 0 }}>Import from HubSpot</h2>
          <button onClick={onClose} style={{ background: "none", border: "none", color: MUTED, fontSize: "20px", cursor: "pointer" }}>×</button>
        </div>
        <div style={{ display: "flex", gap: "8px", marginBottom: "20px" }}>
          {(["sheet", "csv"] as const).map(m => (
            <button key={m} onClick={() => setMode(m)}
              style={{ flex: 1, padding: "8px", borderRadius: "8px", border: `1px solid ${mode === m ? GREEN : BORDER}`, background: mode === m ? "rgba(3,251,131,0.08)" : "transparent", color: mode === m ? GREEN : "#94A3B8", fontSize: "13px", fontWeight: 600, cursor: "pointer" }}
            >
              {m === "sheet" ? "Google Sheet URL" : "Paste CSV"}
            </button>
          ))}
        </div>
        {mode === "sheet" ? (
          <div>
            <p style={{ fontSize: "13px", color: "#94A3B8", marginBottom: "12px" }}>Make the sheet public (Share → Anyone with link → Viewer), then paste the URL.</p>
            <input style={inp} value={sheetUrl} onChange={e => setSheetUrl(e.target.value)} placeholder="https://docs.google.com/spreadsheets/d/..." />
          </div>
        ) : (
          <div>
            <p style={{ fontSize: "13px", color: "#94A3B8", marginBottom: "12px" }}>Export from HubSpot as CSV, then paste the contents below.</p>
            <textarea style={{ ...inp, minHeight: "140px", resize: "vertical", fontFamily: "monospace", fontSize: "12px" }} value={csvText} onChange={e => setCsvText(e.target.value)} placeholder="First Name,Last Name,Email,Company Name,Job Title,..." />
          </div>
        )}
        {error && <p style={{ fontSize: "13px", color: "#EF4444", margin: "12px 0 0" }}>{error}</p>}
        <button
          onClick={doImport}
          disabled={loading || (mode === "sheet" ? !sheetUrl.trim() : !csvText.trim())}
          style={{ marginTop: "20px", width: "100%", background: loading ? "#374151" : GREEN, color: "#000", border: "none", borderRadius: "10px", padding: "12px", fontSize: "14px", fontWeight: 700, cursor: "pointer" }}
        >
          {loading ? "Importing…" : "Import Prospects →"}
        </button>
      </div>
    </div>
  );
}

// ── Active Filter Chips ───────────────────────────────────────────────────────

function FilterChip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: "6px",
      background: "rgba(3,251,131,0.08)", border: `1px solid rgba(3,251,131,0.25)`,
      borderRadius: "20px", padding: "4px 12px", fontSize: "12px", color: GREEN, fontWeight: 600,
    }}>
      {label}
      <button onClick={onRemove} style={{ background: "none", border: "none", color: GREEN, cursor: "pointer", fontSize: "14px", lineHeight: 1, padding: 0 }}>×</button>
    </span>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

type ScoreBand = "hot" | "warm" | "cold" | "unscored" | "";
type FollowUpFilter = "overdue" | "this_week" | "none" | "";
type SortKey = "updated" | "name" | "score" | "follow_up";

const SCORE_BAND_LABELS: Record<Exclude<ScoreBand, "">, string> = {
  hot:     "Hot (70+)",
  warm:    "Warm (40–69)",
  cold:    "Cold (<40)",
  unscored:"Not scored",
};

export default function ProspectsClient({ prospects: initial }: { prospects: ScProspect[] }) {
  const router = useRouter();
  const [prospects, setProspects] = useState<ScProspect[]>(initial);
  const [showAdd, setShowAdd] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // Filters
  const [search,         setSearch]         = useState("");
  const [stageFilter,    setStageFilter]     = useState<ProspectStage | "">("");
  const [scoreFilter,    setScoreFilter]     = useState<ScoreBand>("");
  const [followUpFilter, setFollowUpFilter]  = useState<FollowUpFilter>("");
  const [sourceFilter,   setSourceFilter]    = useState("");
  const [sortKey,        setSortKey]         = useState<SortKey>("updated");

  // Derived values
  const sources = useMemo(() => {
    const s = new Set(prospects.map(p => p.source).filter(Boolean));
    return Array.from(s).sort();
  }, [prospects]);

  const thisWeekEnd = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d;
  }, []);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return prospects
      .filter(p => {
        if (q && !(
          p.first_name.toLowerCase().includes(q) ||
          (p.last_name ?? "").toLowerCase().includes(q) ||
          (p.company_name ?? "").toLowerCase().includes(q) ||
          (p.email ?? "").toLowerCase().includes(q) ||
          (p.role ?? "").toLowerCase().includes(q)
        )) return false;

        if (stageFilter && p.stage !== stageFilter) return false;

        if (scoreFilter) {
          const band = scoreBand(p.lead_score);
          if (band !== scoreFilter) return false;
        }

        if (followUpFilter === "overdue" && !overdue(p.next_follow_up_date)) return false;
        if (followUpFilter === "none" && p.next_follow_up_date !== null) return false;
        if (followUpFilter === "this_week") {
          if (!p.next_follow_up_date) return false;
          const d = new Date(p.next_follow_up_date + "T00:00:00");
          if (d < new Date(new Date().toDateString()) || d > thisWeekEnd) return false;
        }

        if (sourceFilter && p.source !== sourceFilter) return false;

        return true;
      })
      .sort((a, b) => {
        if (sortKey === "name") return `${a.first_name} ${a.last_name ?? ""}`.localeCompare(`${b.first_name} ${b.last_name ?? ""}`);
        if (sortKey === "score") return (b.lead_score ?? -1) - (a.lead_score ?? -1);
        if (sortKey === "follow_up") {
          if (!a.next_follow_up_date && !b.next_follow_up_date) return 0;
          if (!a.next_follow_up_date) return 1;
          if (!b.next_follow_up_date) return -1;
          return a.next_follow_up_date.localeCompare(b.next_follow_up_date);
        }
        return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
      });
  }, [prospects, search, stageFilter, scoreFilter, followUpFilter, sourceFilter, sortKey, thisWeekEnd]);

  // Active filter count (excluding search + sort)
  const activeFilterCount = [stageFilter, scoreFilter, followUpFilter, sourceFilter].filter(Boolean).length;

  // Stats (always over full set)
  const total    = prospects.length;
  const engaged  = prospects.filter(p => ["engaged","call_booked","call_completed","follow_up","sale"].includes(p.stage)).length;
  const calls    = prospects.filter(p => ["call_booked","call_completed"].includes(p.stage)).length;
  const won      = prospects.filter(p => p.stage === "sale").length;
  const dueToday = prospects.filter(p => overdue(p.next_follow_up_date)).length;

  function clearAllFilters() {
    setStageFilter(""); setScoreFilter(""); setFollowUpFilter(""); setSourceFilter("");
  }

  const handleStageChange = useCallback(async (id: string, stage: ProspectStage) => {
    setUpdatingId(id);
    setProspects(prev => prev.map(p => p.id === id ? { ...p, stage } : p));
    try {
      await fetch(`/api/crm/prospects/${id}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stage }),
      });
    } finally { setUpdatingId(null); }
  }, []);

  const handleArchive = useCallback(async (id: string) => {
    if (!confirm("Remove this prospect from your pipeline?")) return;
    setProspects(prev => prev.filter(p => p.id !== id));
    await fetch(`/api/crm/prospects/${id}`, { method: "DELETE" });
  }, []);

  const inp: React.CSSProperties = {
    padding: "9px 14px", background: CARD, border: `1px solid ${BORDER}`,
    borderRadius: "8px", color: "#F8FAFC", fontSize: "14px", outline: "none",
  };

  return (
    <>
      {showAdd && (
        <AddProspectModal onClose={() => setShowAdd(false)} onAdded={p => setProspects(prev => [p, ...prev])} />
      )}
      {showImport && (
        <ImportModal onClose={() => setShowImport(false)} onImported={n => { alert(`Imported ${n} prospects.`); router.refresh(); }} />
      )}

      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "28px", flexWrap: "wrap", gap: "16px" }}>
        <div>
          <h1 style={{ fontSize: "28px", fontWeight: 800, color: "#F8FAFC", margin: "0 0 4px" }}>Prospect Pipeline</h1>
          <p style={{ fontSize: "14px", color: MUTED, margin: 0 }}>Track LinkedIn leads through your sales funnel</p>
        </div>
        <div style={{ display: "flex", gap: "10px" }}>
          <button onClick={() => setShowImport(true)} style={{ background: "transparent", color: GREEN, border: `1px solid rgba(3,251,131,0.3)`, borderRadius: "10px", padding: "10px 18px", fontSize: "14px", fontWeight: 600, cursor: "pointer" }}>
            Import CSV
          </button>
          <button onClick={() => setShowAdd(true)} style={{ background: GREEN, color: "#000", border: "none", borderRadius: "10px", padding: "10px 18px", fontSize: "14px", fontWeight: 700, cursor: "pointer" }}>
            + Add Prospect
          </button>
        </div>
      </div>

      {/* Stats bar */}
      {total > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "12px", marginBottom: "24px" }}>
          {[
            { label: "Total",          value: total },
            { label: "Engaged",        value: engaged },
            { label: "Calls",          value: calls },
            { label: "Converted",      value: won,      hi: won > 0 },
            { label: "Follow-ups Due", value: dueToday, hi: dueToday > 0, warn: true },
          ].map(({ label, value, hi, warn }) => (
            <div key={label} style={{ background: CARD, border: `1px solid ${hi ? (warn ? "rgba(239,68,68,0.3)" : "rgba(3,251,131,0.3)") : BORDER}`, borderRadius: "12px", padding: "16px 20px" }}>
              <div style={{ fontSize: "26px", fontWeight: 800, color: hi ? (warn ? "#EF4444" : GREEN) : "#F8FAFC" }}>{value}</div>
              <div style={{ fontSize: "12px", color: MUTED, marginTop: "2px" }}>{label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Funnel */}
      {total > 0 && (
        <FunnelChart
          prospects={prospects}
          activeStage={stageFilter}
          onStageClick={s => setStageFilter(prev => prev === s ? "" : s)}
        />
      )}

      {/* Search + Filter toolbar */}
      <div style={{ display: "flex", gap: "10px", marginBottom: "12px", flexWrap: "wrap" }}>
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search name, company, role, email…"
          style={{ ...inp, flex: 1, minWidth: "200px", boxSizing: "border-box" }}
        />

        <button
          onClick={() => setShowFilters(f => !f)}
          style={{
            ...inp, cursor: "pointer", display: "flex", alignItems: "center", gap: "8px",
            background: showFilters || activeFilterCount > 0 ? "rgba(3,251,131,0.08)" : CARD,
            border: `1px solid ${showFilters || activeFilterCount > 0 ? "rgba(3,251,131,0.3)" : BORDER}`,
            color: activeFilterCount > 0 ? GREEN : "#94A3B8",
          }}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M1 2h12M3 7h8M5 12h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
          Filters
          {activeFilterCount > 0 && (
            <span style={{ background: GREEN, color: "#000", borderRadius: "10px", padding: "1px 7px", fontSize: "11px", fontWeight: 800 }}>
              {activeFilterCount}
            </span>
          )}
        </button>

        <select value={sortKey} onChange={e => setSortKey(e.target.value as SortKey)}
          style={{ ...inp, cursor: "pointer" }}>
          <option value="updated">Sort: Last updated</option>
          <option value="name">Sort: Name A–Z</option>
          <option value="score">Sort: Lead score</option>
          <option value="follow_up">Sort: Follow-up date</option>
        </select>
      </div>

      {/* Expanded filter panel */}
      {showFilters && (
        <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: "12px", padding: "20px", marginBottom: "12px", display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px" }}>
          {/* Stage */}
          <div>
            <label style={{ display: "block", fontSize: "11px", fontWeight: 600, color: MUTED, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "6px" }}>Stage</label>
            <select value={stageFilter} onChange={e => setStageFilter(e.target.value as ProspectStage | "")}
              style={{ width: "100%", padding: "8px 10px", background: "#111927", border: `1px solid ${BORDER}`, borderRadius: "8px", color: stageFilter ? "#F8FAFC" : MUTED, fontSize: "13px", outline: "none", cursor: "pointer" }}>
              <option value="">All stages</option>
              {PROSPECT_STAGE_ORDER.map(s => <option key={s} value={s}>{PROSPECT_STAGE_LABELS[s]}</option>)}
            </select>
          </div>

          {/* Score band */}
          <div>
            <label style={{ display: "block", fontSize: "11px", fontWeight: 600, color: MUTED, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "6px" }}>Lead Score</label>
            <select value={scoreFilter} onChange={e => setScoreFilter(e.target.value as ScoreBand)}
              style={{ width: "100%", padding: "8px 10px", background: "#111927", border: `1px solid ${BORDER}`, borderRadius: "8px", color: scoreFilter ? "#F8FAFC" : MUTED, fontSize: "13px", outline: "none", cursor: "pointer" }}>
              <option value="">Any score</option>
              {(Object.entries(SCORE_BAND_LABELS) as [Exclude<ScoreBand, "">, string][]).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>

          {/* Follow-up */}
          <div>
            <label style={{ display: "block", fontSize: "11px", fontWeight: 600, color: MUTED, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "6px" }}>Follow-up</label>
            <select value={followUpFilter} onChange={e => setFollowUpFilter(e.target.value as FollowUpFilter)}
              style={{ width: "100%", padding: "8px 10px", background: "#111927", border: `1px solid ${BORDER}`, borderRadius: "8px", color: followUpFilter ? "#F8FAFC" : MUTED, fontSize: "13px", outline: "none", cursor: "pointer" }}>
              <option value="">Any</option>
              <option value="overdue">Overdue</option>
              <option value="this_week">Due this week</option>
              <option value="none">No follow-up set</option>
            </select>
          </div>

          {/* Source */}
          <div>
            <label style={{ display: "block", fontSize: "11px", fontWeight: 600, color: MUTED, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "6px" }}>Source</label>
            <select value={sourceFilter} onChange={e => setSourceFilter(e.target.value)}
              style={{ width: "100%", padding: "8px 10px", background: "#111927", border: `1px solid ${BORDER}`, borderRadius: "8px", color: sourceFilter ? "#F8FAFC" : MUTED, fontSize: "13px", outline: "none", cursor: "pointer" }}>
              <option value="">All sources</option>
              {sources.map(s => <option key={s} value={s}>{s.replace(/_/g, " ")}</option>)}
            </select>
          </div>
        </div>
      )}

      {/* Active filter chips */}
      {activeFilterCount > 0 && (
        <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap", marginBottom: "14px" }}>
          {stageFilter    && <FilterChip label={PROSPECT_STAGE_LABELS[stageFilter]}   onRemove={() => setStageFilter("")} />}
          {scoreFilter    && <FilterChip label={SCORE_BAND_LABELS[scoreFilter]}        onRemove={() => setScoreFilter("")} />}
          {followUpFilter && <FilterChip label={{ overdue: "Overdue", this_week: "Due this week", none: "No follow-up" }[followUpFilter]} onRemove={() => setFollowUpFilter("")} />}
          {sourceFilter   && <FilterChip label={`Source: ${sourceFilter.replace(/_/g, " ")}`} onRemove={() => setSourceFilter("")} />}
          <button onClick={clearAllFilters} style={{ fontSize: "12px", color: MUTED, background: "none", border: "none", cursor: "pointer", textDecoration: "underline" }}>
            Clear all
          </button>
        </div>
      )}

      {/* Results count */}
      {total > 0 && (
        <div style={{ fontSize: "12px", color: MUTED, marginBottom: "10px" }}>
          {filtered.length === total ? `${total} prospects` : `${filtered.length} of ${total} prospects`}
        </div>
      )}

      {/* Table */}
      {filtered.length === 0 ? (
        <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: "14px", padding: "60px", textAlign: "center" }}>
          {total === 0 ? (
            <>
              <p style={{ fontSize: "16px", color: "#F8FAFC", fontWeight: 600, marginBottom: "8px" }}>No prospects yet</p>
              <p style={{ fontSize: "14px", color: MUTED, marginBottom: "24px" }}>Add prospects manually or import from your HubSpot sheet.</p>
              <div style={{ display: "flex", gap: "12px", justifyContent: "center" }}>
                <button onClick={() => setShowImport(true)} style={{ background: "transparent", color: GREEN, border: `1px solid rgba(3,251,131,0.3)`, borderRadius: "10px", padding: "10px 20px", fontSize: "14px", fontWeight: 600, cursor: "pointer" }}>Import CSV</button>
                <button onClick={() => setShowAdd(true)} style={{ background: GREEN, color: "#000", border: "none", borderRadius: "10px", padding: "10px 24px", fontSize: "14px", fontWeight: 700, cursor: "pointer" }}>+ Add Prospect</button>
              </div>
            </>
          ) : (
            <div>
              <p style={{ fontSize: "14px", color: MUTED, marginBottom: "12px" }}>No prospects match your filters.</p>
              <button onClick={clearAllFilters} style={{ background: "transparent", color: GREEN, border: `1px solid rgba(3,251,131,0.3)`, borderRadius: "8px", padding: "8px 16px", fontSize: "13px", fontWeight: 600, cursor: "pointer" }}>
                Clear filters
              </button>
            </div>
          )}
        </div>
      ) : (
        <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: "14px", overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${BORDER}` }}>
                {["Prospect", "Stage", "Score", "Follow-up", "Notes", ""].map(h => (
                  <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontSize: "11px", fontWeight: 600, color: MUTED, textTransform: "uppercase", letterSpacing: "0.06em" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((p, i) => (
                <tr
                  key={p.id}
                  style={{ borderBottom: i < filtered.length - 1 ? `1px solid ${BORDER}` : "none", transition: "background 0.1s" }}
                  onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.02)")}
                  onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                >
                  {/* Prospect */}
                  <td style={{ padding: "14px 16px", minWidth: "220px" }}>
                    <a href={`/crm/prospect/${p.id}`} style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: "10px" }}>
                      <div style={{ width: "34px", height: "34px", borderRadius: "50%", background: "rgba(3,251,131,0.1)", border: `1px solid rgba(3,251,131,0.2)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", fontWeight: 700, color: GREEN, flexShrink: 0 }}>
                        {initials(p)}
                      </div>
                      <div>
                        <div style={{ fontSize: "14px", fontWeight: 600, color: "#F8FAFC" }}>
                          {p.first_name} {p.last_name ?? ""}
                        </div>
                        {(p.company_name || p.role) && (
                          <div style={{ fontSize: "12px", color: MUTED, marginTop: "1px" }}>
                            {[p.role, p.company_name].filter(Boolean).join(" · ")}
                          </div>
                        )}
                      </div>
                    </a>
                  </td>

                  {/* Stage */}
                  <td style={{ padding: "14px 16px" }}>
                    <div onClick={e => e.stopPropagation()} style={{ position: "relative", display: "inline-block" }}>
                      <select
                        value={p.stage}
                        onChange={e => handleStageChange(p.id, e.target.value as ProspectStage)}
                        disabled={updatingId === p.id}
                        style={{ position: "absolute", inset: 0, opacity: 0, cursor: "pointer", width: "100%", height: "100%" }}
                      />
                      <StageBadge stage={p.stage} />
                    </div>
                  </td>

                  {/* Score */}
                  <td style={{ padding: "14px 16px", whiteSpace: "nowrap" }}>
                    {p.lead_score !== null ? (
                      <span style={{ fontSize: "14px", fontWeight: 700, color: scoreColor(p.lead_score) }}>
                        {p.lead_score}<span style={{ fontSize: "10px", color: MUTED, fontWeight: 400 }}>/100</span>
                      </span>
                    ) : (
                      <span style={{ fontSize: "12px", color: "#374151" }}>—</span>
                    )}
                  </td>

                  {/* Follow-up */}
                  <td style={{ padding: "14px 16px", whiteSpace: "nowrap" }}>
                    {p.next_follow_up_date ? (
                      <span style={{ fontSize: "13px", color: overdue(p.next_follow_up_date) ? "#EF4444" : "#94A3B8", fontWeight: overdue(p.next_follow_up_date) ? 600 : 400 }}>
                        {overdue(p.next_follow_up_date) ? "⚠ " : ""}{fmt(p.next_follow_up_date)}
                      </span>
                    ) : (
                      <span style={{ fontSize: "13px", color: "#374151" }}>—</span>
                    )}
                  </td>

                  {/* Notes */}
                  <td style={{ padding: "14px 16px", maxWidth: "220px" }}>
                    {p.notes ? (
                      <span style={{ fontSize: "13px", color: "#94A3B8", overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" as const }}>
                        {p.notes}
                      </span>
                    ) : (
                      <span style={{ fontSize: "13px", color: "#374151" }}>—</span>
                    )}
                  </td>

                  {/* Actions */}
                  <td style={{ padding: "14px 16px", whiteSpace: "nowrap" }}>
                    <div style={{ display: "flex", gap: "8px" }}>
                      <a href={`/crm/prospect/${p.id}`} style={{ fontSize: "12px", color: GREEN, textDecoration: "none", fontWeight: 600 }}>View →</a>
                      <button onClick={() => handleArchive(p.id)} style={{ fontSize: "12px", color: MUTED, background: "none", border: "none", cursor: "pointer", padding: 0 }}>Remove</button>
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