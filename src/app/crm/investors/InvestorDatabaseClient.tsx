"use client";

import { useState, useEffect, useCallback } from "react";
import { InvestorProfile } from "@/lib/crm/types";

const GREEN = "#03fb83";
const CARD_BG = "#0F1929";
const BORDER = "#1A2438";
const MUTED = "#6B7280";

const STAGES = ["pre-seed", "seed", "series-a", "series-b", "growth"];
const GEOS = ["UK", "US", "Europe", "Global"];
const SECTORS = ["fintech", "saas", "deeptech", "healthtech", "edtech", "proptech", "climate", "consumer", "b2b", "marketplace"];

function formatCheckSize(min: number | null, max: number | null) {
  if (!min && !max) return null;
  const fmt = (n: number) => n >= 1000 ? `$${(n / 1000).toFixed(0)}M` : `$${n}k`;
  if (min && max) return `${fmt(min)} – ${fmt(max)}`;
  if (min) return `${fmt(min)}+`;
  return `Up to ${fmt(max!)}`;
}

export default function InvestorDatabaseClient() {
  const [query, setQuery] = useState("");
  const [stage, setStage] = useState("");
  const [geo, setGeo] = useState("");
  const [sector, setSector] = useState("");
  const [investors, setInvestors] = useState<InvestorProfile[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [adding, setAdding] = useState<string | null>(null);
  const [added, setAdded] = useState<Record<string, boolean>>({});

  const search = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (query) params.set("q", query);
      if (stage) params.set("stage", stage);
      if (geo) params.set("geo", geo);
      if (sector) params.set("sector", sector);
      const res = await fetch(`/api/crm/investors?${params}`);
      const data = await res.json();
      setInvestors(data.investors ?? []);
      setTotal(data.total ?? 0);
    } finally {
      setLoading(false);
    }
  }, [query, stage, geo, sector]);

  useEffect(() => {
    const t = setTimeout(search, 300);
    return () => clearTimeout(t);
  }, [search]);

  async function addToPipeline(investor: InvestorProfile) {
    setAdding(investor.id);
    try {
      const res = await fetch("/api/crm/pipeline", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          investor_profile_id: investor.id,
          fund_name: investor.fund_name,
          contact_name: investor.contact_name,
          role: investor.role,
          email: investor.email,
          linkedin_url: investor.linkedin_url,
          stage_focus: investor.stage_focus,
          geography: investor.geography,
          sector_focus: investor.sector_focus,
          check_size_min: investor.check_size_min,
          check_size_max: investor.check_size_max,
          thesis_notes: investor.thesis_notes,
        }),
      });
      if (res.ok) setAdded(prev => ({ ...prev, [investor.id]: true }));
    } finally {
      setAdding(null);
    }
  }

  return (
    <>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "32px", flexWrap: "wrap", gap: "16px" }}>
        <div>
          <h1 style={{ fontSize: "28px", fontWeight: 800, color: "#F8FAFC", margin: "0 0 4px" }}>Investor Database</h1>
          <p style={{ fontSize: "14px", color: MUTED, margin: 0 }}>
            {total > 0 ? `${total} investors` : "Search the Source Capital investor database"}
          </p>
        </div>
        <a href="/crm/pipeline" style={{ fontSize: "14px", color: GREEN, textDecoration: "none", fontWeight: 600 }}>← Back to Pipeline</a>
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: "10px", marginBottom: "24px", flexWrap: "wrap" }}>
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search by fund, name, or thesis…"
          style={{ flex: 1, minWidth: "240px", padding: "10px 14px", background: CARD_BG, border: `1px solid ${BORDER}`, borderRadius: "8px", color: "#F8FAFC", fontSize: "14px", outline: "none" }}
        />
        <select value={stage} onChange={e => setStage(e.target.value)} style={{ padding: "10px 14px", background: CARD_BG, border: `1px solid ${BORDER}`, borderRadius: "8px", color: stage ? "#F8FAFC" : MUTED, fontSize: "14px", outline: "none" }}>
          <option value="">All stages</option>
          {STAGES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={geo} onChange={e => setGeo(e.target.value)} style={{ padding: "10px 14px", background: CARD_BG, border: `1px solid ${BORDER}`, borderRadius: "8px", color: geo ? "#F8FAFC" : MUTED, fontSize: "14px", outline: "none" }}>
          <option value="">All geographies</option>
          {GEOS.map(g => <option key={g} value={g}>{g}</option>)}
        </select>
        <select value={sector} onChange={e => setSector(e.target.value)} style={{ padding: "10px 14px", background: CARD_BG, border: `1px solid ${BORDER}`, borderRadius: "8px", color: sector ? "#F8FAFC" : MUTED, fontSize: "14px", outline: "none" }}>
          <option value="">All sectors</option>
          {SECTORS.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {/* Results */}
      {loading ? (
        <div style={{ textAlign: "center", padding: "60px", color: MUTED }}>Searching…</div>
      ) : investors.length === 0 ? (
        <div style={{ background: CARD_BG, border: `1px solid ${BORDER}`, borderRadius: "14px", padding: "60px", textAlign: "center" }}>
          <p style={{ color: MUTED, fontSize: "14px" }}>{query || stage || geo || sector ? "No investors match your search." : "Start typing to search the investor database."}</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {investors.map(inv => (
            <div key={inv.id} style={{ background: CARD_BG, border: `1px solid ${BORDER}`, borderRadius: "12px", padding: "18px 20px", display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "16px" }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px", flexWrap: "wrap" }}>
                  <span style={{ fontSize: "15px", fontWeight: 700, color: "#F8FAFC" }}>{inv.fund_name}</span>
                  {inv.verified && <span style={{ background: "rgba(3,251,131,0.12)", color: GREEN, fontSize: "10px", fontWeight: 700, padding: "2px 8px", borderRadius: "10px" }}>Verified</span>}
                </div>
                {(inv.contact_name || inv.role) && (
                  <div style={{ fontSize: "13px", color: "#94A3B8", marginBottom: "8px" }}>
                    {inv.contact_name}{inv.role ? ` · ${inv.role}` : ""}
                  </div>
                )}
                <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                  {inv.stage_focus?.map(s => (
                    <span key={s} style={{ background: "rgba(59,130,246,0.1)", color: "#60A5FA", border: "1px solid rgba(59,130,246,0.2)", fontSize: "11px", padding: "2px 8px", borderRadius: "10px" }}>{s}</span>
                  ))}
                  {inv.geography?.map(g => (
                    <span key={g} style={{ background: "rgba(107,114,128,0.1)", color: "#9CA3AF", border: "1px solid rgba(107,114,128,0.2)", fontSize: "11px", padding: "2px 8px", borderRadius: "10px" }}>{g}</span>
                  ))}
                  {inv.sector_focus?.slice(0, 3).map(s => (
                    <span key={s} style={{ background: "rgba(139,92,246,0.1)", color: "#A78BFA", border: "1px solid rgba(139,92,246,0.2)", fontSize: "11px", padding: "2px 8px", borderRadius: "10px" }}>{s}</span>
                  ))}
                  {formatCheckSize(inv.check_size_min, inv.check_size_max) && (
                    <span style={{ background: "rgba(251,191,36,0.1)", color: "#FBBF24", border: "1px solid rgba(251,191,36,0.2)", fontSize: "11px", padding: "2px 8px", borderRadius: "10px" }}>
                      {formatCheckSize(inv.check_size_min, inv.check_size_max)}
                    </span>
                  )}
                </div>
                {inv.thesis_notes && (
                  <p style={{ fontSize: "13px", color: MUTED, marginTop: "8px", marginBottom: 0, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" as const }}>
                    {inv.thesis_notes}
                  </p>
                )}
              </div>
              <button
                onClick={() => addToPipeline(inv)}
                disabled={adding === inv.id || added[inv.id]}
                style={{
                  flexShrink: 0,
                  background: added[inv.id] ? "rgba(3,251,131,0.1)" : "rgba(3,251,131,0.15)",
                  color: added[inv.id] ? GREEN : GREEN,
                  border: `1px solid rgba(3,251,131,${added[inv.id] ? "0.5" : "0.3"})`,
                  borderRadius: "8px", padding: "8px 16px",
                  fontSize: "13px", fontWeight: 600, cursor: added[inv.id] ? "default" : "pointer",
                  whiteSpace: "nowrap",
                }}
              >
                {added[inv.id] ? "✓ Added" : adding === inv.id ? "Adding…" : "+ Add to Pipeline"}
              </button>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
