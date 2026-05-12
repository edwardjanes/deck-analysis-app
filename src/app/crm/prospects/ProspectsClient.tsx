"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  ScProspect, ProspectStage,
  PROSPECT_STAGE_ORDER, PROSPECT_STAGE_LABELS, PROSPECT_STAGE_COLORS,
} from "@/lib/crm/prospect-types";

const GREEN  = "#03fb83";
const BG     = "#080C14";
const CARD   = "#0F1929";
const BORDER = "#1A2438";
const MUTED  = "#6B7280";

// ── Utilities ────────────────────────────────────────────────────────────────

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
            <button
              key={m}
              onClick={() => setMode(m)}
              style={{ flex: 1, padding: "8px", borderRadius: "8px", border: `1px solid ${mode === m ? GREEN : BORDER}`, background: mode === m ? "rgba(3,251,131,0.08)" : "transparent", color: mode === m ? GREEN : "#94A3B8", fontSize: "13px", fontWeight: 600, cursor: "pointer" }}
            >
              {m === "sheet" ? "Google Sheet URL" : "Paste CSV"}
            </button>
          ))}
        </div>

        {mode === "sheet" ? (
          <div>
            <p style={{ fontSize: "13px", color: "#94A3B8", marginBottom: "12px" }}>
              Make the sheet public (Share → Anyone with link → Viewer), then paste the URL.
            </p>
            <input
              style={inp}
              value={sheetUrl}
              onChange={e => setSheetUrl(e.target.value)}
              placeholder="https://docs.google.com/spreadsheets/d/..."
            />
          </div>
        ) : (
          <div>
            <p style={{ fontSize: "13px", color: "#94A3B8", marginBottom: "12px" }}>
              Export from HubSpot as CSV, then paste the contents below.
            </p>
            <textarea
              style={{ ...inp, minHeight: "140px", resize: "vertical", fontFamily: "monospace", fontSize: "12px" }}
              value={csvText}
              onChange={e => setCsvText(e.target.value)}
              placeholder="First Name,Last Name,Email,Company Name,Job Title,..."
            />
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

// ── Main Component ────────────────────────────────────────────────────────────

export default function ProspectsClient({ prospects: initial }: { prospects: ScProspect[] }) {
  const router = useRouter();
  const [prospects, setProspects] = useState<ScProspect[]>(initial);
  const [showAdd, setShowAdd] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [search, setSearch] = useState("");
  const [stageFilter, setStageFilter] = useState<ProspectStage | "">("");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const filtered = prospects.filter(p => {
    const q = search.toLowerCase();
    const matchSearch = !q ||
      p.first_name.toLowerCase().includes(q) ||
      (p.last_name ?? "").toLowerCase().includes(q) ||
      (p.company_name ?? "").toLowerCase().includes(q) ||
      (p.email ?? "").toLowerCase().includes(q);
    const matchStage = !stageFilter || p.stage === stageFilter;
    return matchSearch && matchStage;
  });

  // Stats
  const total      = prospects.length;
  const engaged    = prospects.filter(p => ["engaged","call_booked","call_completed","follow_up","sale"].includes(p.stage)).length;
  const calls      = prospects.filter(p => ["call_booked","call_completed"].includes(p.stage)).length;
  const won        = prospects.filter(p => p.stage === "sale").length;
  const dueToday   = prospects.filter(p => overdue(p.next_follow_up_date)).length;

  const handleStageChange = useCallback(async (id: string, stage: ProspectStage) => {
    setUpdatingId(id);
    setProspects(prev => prev.map(p => p.id === id ? { ...p, stage } : p));
    try {
      await fetch(`/api/crm/prospects/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stage }),
      });
    } finally { setUpdatingId(null); }
  }, []);

  const handleArchive = useCallback(async (id: string) => {
    if (!confirm("Remove this prospect from your pipeline?")) return;
    setProspects(prev => prev.filter(p => p.id !== id));
    await fetch(`/api/crm/prospects/${id}`, { method: "DELETE" });
  }, []);

  return (
    <>
      {showAdd && (
        <AddProspectModal
          onClose={() => setShowAdd(false)}
          onAdded={p => setProspects(prev => [p, ...prev])}
        />
      )}
      {showImport && (
        <ImportModal
          onClose={() => setShowImport(false)}
          onImported={n => { alert(`Imported ${n} prospects successfully.`); router.refresh(); }}
        />
      )}

      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "32px", flexWrap: "wrap", gap: "16px" }}>
        <div>
          <h1 style={{ fontSize: "28px", fontWeight: 800, color: "#F8FAFC", margin: "0 0 4px" }}>Prospect Pipeline</h1>
          <p style={{ fontSize: "14px", color: MUTED, margin: 0 }}>Track LinkedIn leads through your sales funnel</p>
        </div>
        <div style={{ display: "flex", gap: "10px" }}>
          <button
            onClick={() => setShowImport(true)}
            style={{ background: "transparent", color: GREEN, border: `1px solid rgba(3,251,131,0.3)`, borderRadius: "10px", padding: "10px 18px", fontSize: "14px", fontWeight: 600, cursor: "pointer" }}
          >
            Import CSV
          </button>
          <button
            onClick={() => setShowAdd(true)}
            style={{ background: GREEN, color: "#000", border: "none", borderRadius: "10px", padding: "10px 18px", fontSize: "14px", fontWeight: 700, cursor: "pointer" }}
          >
            + Add Prospect
          </button>
        </div>
      </div>

      {/* Stage funnel pills */}
      <div style={{ display: "flex", gap: "8px", marginBottom: "20px", flexWrap: "wrap" }}>
        {PROSPECT_STAGE_ORDER.map(s => {
          const count = prospects.filter(p => p.stage === s).length;
          const c = PROSPECT_STAGE_COLORS[s];
          const active = stageFilter === s;
          return (
            <button
              key={s}
              onClick={() => setStageFilter(active ? "" : s)}
              style={{
                padding: "6px 14px", borderRadius: "20px", border: `1px solid ${active ? c.border : BORDER}`,
                background: active ? c.bg : "transparent", color: active ? c.text : MUTED,
                fontSize: "12px", fontWeight: active ? 700 : 400, cursor: "pointer",
                display: "flex", alignItems: "center", gap: "6px",
              }}
            >
              {PROSPECT_STAGE_LABELS[s]}
              <span style={{ background: active ? c.border : BORDER, color: active ? c.text : MUTED, borderRadius: "10px", padding: "1px 7px", fontSize: "11px", fontWeight: 700 }}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Stats */}
      {total > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "12px", marginBottom: "24px" }}>
          {[
            { label: "Total",         value: total },
            { label: "Engaged",       value: engaged },
            { label: "Calls",         value: calls },
            { label: "Converted",     value: won,      hi: won > 0 },
            { label: "Follow-ups Due",value: dueToday, hi: dueToday > 0, warn: true },
          ].map(({ label, value, hi, warn }) => (
            <div key={label} style={{ background: CARD, border: `1px solid ${hi ? (warn ? "rgba(239,68,68,0.3)" : "rgba(3,251,131,0.3)") : BORDER}`, borderRadius: "12px", padding: "16px 20px" }}>
              <div style={{ fontSize: "26px", fontWeight: 800, color: hi ? (warn ? "#EF4444" : GREEN) : "#F8FAFC" }}>{value}</div>
              <div style={{ fontSize: "12px", color: MUTED, marginTop: "2px" }}>{label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Search */}
      <div style={{ marginBottom: "20px" }}>
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by name, company or email…"
          style={{ width: "100%", padding: "9px 14px", background: CARD, border: `1px solid ${BORDER}`, borderRadius: "8px", color: "#F8FAFC", fontSize: "14px", outline: "none", boxSizing: "border-box" }}
        />
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: "14px", padding: "60px", textAlign: "center" }}>
          {total === 0 ? (
            <>
              <p style={{ fontSize: "16px", color: "#F8FAFC", fontWeight: 600, marginBottom: "8px" }}>No prospects yet</p>
              <p style={{ fontSize: "14px", color: MUTED, marginBottom: "24px" }}>Add prospects manually or import from your HubSpot sheet.</p>
              <div style={{ display: "flex", gap: "12px", justifyContent: "center" }}>
                <button onClick={() => setShowImport(true)} style={{ background: "transparent", color: GREEN, border: `1px solid rgba(3,251,131,0.3)`, borderRadius: "10px", padding: "10px 20px", fontSize: "14px", fontWeight: 600, cursor: "pointer" }}>
                  Import CSV
                </button>
                <button onClick={() => setShowAdd(true)} style={{ background: GREEN, color: "#000", border: "none", borderRadius: "10px", padding: "10px 24px", fontSize: "14px", fontWeight: 700, cursor: "pointer" }}>
                  + Add Prospect
                </button>
              </div>
            </>
          ) : (
            <p style={{ fontSize: "14px", color: MUTED }}>No prospects match your search.</p>
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
                  style={{ borderBottom: i < filtered.length - 1 ? `1px solid ${BORDER}` : "none", transition: "background 0.1s", cursor: "pointer" }}
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
                    <select
                      value={p.stage}
                      onChange={e => handleStageChange(p.id, e.target.value as ProspectStage)}
                      disabled={updatingId === p.id}
                      onClick={e => e.stopPropagation()}
                      style={{ background: "transparent", border: "none", outline: "none", cursor: "pointer", padding: 0, fontSize: "11px", color: "transparent", position: "absolute" }}
                    >
                      {PROSPECT_STAGE_ORDER.map(s => <option key={s} value={s}>{PROSPECT_STAGE_LABELS[s]}</option>)}
                    </select>
                    <div onClick={e => e.stopPropagation()} style={{ position: "relative" }}>
                      <select
                        value={p.stage}
                        onChange={e => handleStageChange(p.id, e.target.value as ProspectStage)}
                        disabled={updatingId === p.id}
                        style={{ position: "absolute", inset: 0, opacity: 0, cursor: "pointer", width: "100%" }}
                      />
                      <StageBadge stage={p.stage} />
                    </div>
                  </td>

                  {/* Score */}
                  <td style={{ padding: "14px 16px", whiteSpace: "nowrap" }}>
                    {p.lead_score !== null ? (
                      <span style={{ fontSize: "14px", fontWeight: 700, color: scoreColor(p.lead_score) }}>
                        {p.lead_score}
                        <span style={{ fontSize: "10px", color: MUTED, fontWeight: 400 }}>/100</span>
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