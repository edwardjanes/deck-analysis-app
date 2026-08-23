"use client";

import { useState, useEffect, useCallback } from "react";
import { InvestorFirm, InvestorContact, FIRM_TYPE_LABELS, FirmType } from "@/lib/crm/types";

const GREEN = "#03fb83";
const CARD_BG = "#0F1929";
const BORDER = "#1A2438";
const MUTED = "#6B7280";

const STAGES   = ["Pre-seed", "Seed", "Series A", "Series B", "Growth"];
const GEOS     = ["UK", "Europe", "US", "North America", "Global", "Asia Pacific"];
const SECTORS  = ["AI / ML", "B2B SaaS", "FinTech", "HealthTech", "Deep Tech", "Climate Tech", "Consumer", "Marketplace", "PropTech"];
const TYPES: { value: FirmType | ""; label: string }[] = [
  { value: "",               label: "All types" },
  { value: "vc",             label: "Venture Capital" },
  { value: "family_office",  label: "Family Office" },
  { value: "angel_network",  label: "Angel Network" },
  { value: "accelerator",    label: "Accelerator" },
  { value: "corporate_vc",   label: "Corporate VC" },
  { value: "syndicate",      label: "Syndicate" },
  { value: "debt_fund",      label: "Debt Fund" },
  { value: "other",          label: "Other" },
];

function fmtCheck(min: number | null, max: number | null) {
  if (!min && !max) return null;
  const fmt = (n: number) => n >= 1_000_000 ? `£${(n / 1_000_000).toFixed(0)}M` : `£${(n / 1000).toFixed(0)}k`;
  if (min && max) return `${fmt(min)} – ${fmt(max)}`;
  if (min) return `${fmt(min)}+`;
  return `Up to ${fmt(max!)}`;
}

const selectStyle: React.CSSProperties = {
  padding: "9px 12px", background: CARD_BG, border: `1px solid ${BORDER}`,
  borderRadius: "8px", color: "#F8FAFC", fontSize: "13px", outline: "none",
};

type ContactRow = InvestorContact & { investor_firms?: null };

function Tag({ children, color = "blue" }: { children: React.ReactNode; color?: "blue" | "purple" | "grey" | "amber" | "green" }) {
  const map = {
    blue:   { bg: "rgba(59,130,246,0.1)",   text: "#60A5FA",  border: "rgba(59,130,246,0.2)" },
    purple: { bg: "rgba(139,92,246,0.1)",   text: "#A78BFA",  border: "rgba(139,92,246,0.2)" },
    grey:   { bg: "rgba(107,114,128,0.1)",  text: "#9CA3AF",  border: "rgba(107,114,128,0.2)" },
    amber:  { bg: "rgba(251,191,36,0.1)",   text: "#FBBF24",  border: "rgba(251,191,36,0.2)" },
    green:  { bg: "rgba(3,251,131,0.1)",    text: GREEN,       border: "rgba(3,251,131,0.25)" },
  };
  const c = map[color];
  return (
    <span style={{ background: c.bg, color: c.text, border: `1px solid ${c.border}`, fontSize: "11px", fontWeight: 500, padding: "2px 8px", borderRadius: "10px", whiteSpace: "nowrap" }}>
      {children}
    </span>
  );
}

function FirmTypeBadge({ type }: { type: FirmType }) {
  const colorMap: Record<FirmType, string> = {
    vc: "blue", family_office: "purple", angel_network: "amber",
    accelerator: "green", corporate_vc: "blue", syndicate: "grey",
    debt_fund: "grey", other: "grey",
  };
  return <Tag color={colorMap[type] as "blue" | "purple" | "grey" | "amber" | "green"}>{FIRM_TYPE_LABELS[type]}</Tag>;
}

function ContactRow({ contact, onAdd, adding, added }: {
  contact: Pick<InvestorContact, "id" | "first_name" | "last_name" | "role" | "email" | "linkedin_url" | "location" | "bio">;
  onAdd: () => void;
  adding: boolean;
  added: boolean;
}) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px", padding: "10px 14px", background: "rgba(255,255,255,0.03)", borderRadius: "8px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "12px", minWidth: 0 }}>
        {/* Avatar */}
        <div style={{ width: "30px", height: "30px", borderRadius: "50%", background: "rgba(59,130,246,0.15)", border: "1px solid rgba(59,130,246,0.25)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", fontWeight: 700, color: "#60A5FA", flexShrink: 0 }}>
          {contact.first_name[0]}{contact.last_name?.[0] ?? ""}
        </div>
        <div style={{ minWidth: 0 }}>
          <span style={{ fontSize: "13px", fontWeight: 600, color: "#F8FAFC" }}>
            {contact.first_name} {contact.last_name}
          </span>
          {contact.role && <span style={{ fontSize: "12px", color: MUTED, marginLeft: "6px" }}>{contact.role}</span>}
          {contact.location && <span style={{ fontSize: "11px", color: "#374151", marginLeft: "8px" }}>{contact.location}</span>}
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: "8px", flexShrink: 0 }}>
        {contact.linkedin_url && (
          <a href={contact.linkedin_url} target="_blank" rel="noopener noreferrer"
            style={{ fontSize: "11px", color: "#60A5FA", textDecoration: "none" }}>LinkedIn</a>
        )}
        <button
          onClick={onAdd} disabled={adding || added}
          style={{
            background: added ? "rgba(3,251,131,0.1)" : "transparent",
            color: added ? GREEN : "#94A3B8",
            border: `1px solid ${added ? "rgba(3,251,131,0.3)" : BORDER}`,
            borderRadius: "6px", padding: "4px 10px",
            fontSize: "11px", fontWeight: 600, cursor: added ? "default" : "pointer",
            whiteSpace: "nowrap",
          }}>
          {added ? "✓ Added" : adding ? "…" : "+ Pipeline"}
        </button>
      </div>
    </div>
  );
}

function FirmCard({ firm, onAddFirm, onAddContact, adding, added }: {
  firm: InvestorFirm & { investor_contacts: ContactRow[] };
  onAddFirm: (firm: InvestorFirm) => void;
  onAddContact: (firmId: string, contact: ContactRow) => void;
  adding: string | null;
  added: Record<string, boolean>;
}) {
  const [expanded, setExpanded] = useState(false);
  const contacts = firm.investor_contacts ?? [];
  const checkSize = fmtCheck(firm.check_size_min, firm.check_size_max);

  return (
    <div style={{ background: CARD_BG, border: `1px solid ${BORDER}`, borderRadius: "12px", overflow: "hidden", transition: "border-color 0.15s" }}
      onMouseEnter={e => (e.currentTarget.style.borderColor = "rgba(59,130,246,0.3)")}
      onMouseLeave={e => (e.currentTarget.style.borderColor = BORDER)}>

      {/* Firm header */}
      <div style={{ padding: "18px 20px", display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "16px" }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Name row */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px", flexWrap: "wrap" }}>
            <span style={{ fontSize: "15px", fontWeight: 700, color: "#F8FAFC" }}>{firm.name}</span>
            <FirmTypeBadge type={firm.type} />
            {firm.verified && <Tag color="green">Verified</Tag>}
          </div>

          {/* Tags row */}
          <div style={{ display: "flex", gap: "5px", flexWrap: "wrap", marginBottom: "8px" }}>
            {firm.stage_focus?.map(s => <Tag key={s} color="blue">{s}</Tag>)}
            {firm.geography?.map(g => <Tag key={g} color="grey">{g}</Tag>)}
            {firm.sector_focus?.slice(0, 3).map(s => <Tag key={s} color="purple">{s}</Tag>)}
            {checkSize && <Tag color="amber">{checkSize}</Tag>}
          </div>

          {/* Thesis */}
          {firm.thesis_notes && (
            <p style={{ fontSize: "12px", color: MUTED, margin: 0, lineHeight: 1.5, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" as const }}>
              {firm.thesis_notes}
            </p>
          )}
        </div>

        {/* Actions */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "8px", flexShrink: 0 }}>
          <button
            onClick={() => onAddFirm(firm)}
            disabled={adding === firm.id || added[firm.id]}
            style={{
              background: added[firm.id] ? "rgba(3,251,131,0.1)" : "rgba(3,251,131,0.12)",
              color: GREEN, border: `1px solid rgba(3,251,131,${added[firm.id] ? "0.5" : "0.25"})`,
              borderRadius: "8px", padding: "7px 14px",
              fontSize: "12px", fontWeight: 600, cursor: added[firm.id] ? "default" : "pointer", whiteSpace: "nowrap",
            }}>
            {added[firm.id] ? "✓ Added" : adding === firm.id ? "Adding…" : "+ Add to Pipeline"}
          </button>
          {contacts.length > 0 && (
            <button onClick={() => setExpanded(v => !v)}
              style={{ background: "none", border: "none", color: MUTED, fontSize: "12px", cursor: "pointer", padding: "2px 0", display: "flex", alignItems: "center", gap: "4px" }}>
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ transform: expanded ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}>
                <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              {contacts.length} contact{contacts.length !== 1 ? "s" : ""}
            </button>
          )}
        </div>
      </div>

      {/* Contacts (expandable) */}
      {expanded && contacts.length > 0 && (
        <div style={{ borderTop: `1px solid ${BORDER}`, padding: "12px 16px", display: "flex", flexDirection: "column", gap: "6px" }}>
          <div style={{ fontSize: "11px", fontWeight: 600, color: "#374151", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "4px" }}>Team</div>
          {contacts.map(c => (
            <ContactRow
              key={c.id}
              contact={c}
              onAdd={() => onAddContact(firm.id, c)}
              adding={adding === `${firm.id}-${c.id}`}
              added={added[`contact-${c.id}`] ?? false}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function AngelCard({ contact, onAdd, adding, added }: {
  contact: InvestorContact;
  onAdd: () => void;
  adding: boolean;
  added: boolean;
}) {
  return (
    <div style={{ background: CARD_BG, border: `1px solid ${BORDER}`, borderRadius: "12px", padding: "16px 20px", display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "16px" }}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: "12px", flex: 1, minWidth: 0 }}>
        <div style={{ width: "36px", height: "36px", borderRadius: "50%", background: "rgba(251,191,36,0.12)", border: "1px solid rgba(251,191,36,0.25)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "13px", fontWeight: 700, color: "#FBBF24", flexShrink: 0 }}>
          {contact.first_name[0]}{contact.last_name?.[0] ?? ""}
        </div>
        <div style={{ minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px", flexWrap: "wrap" }}>
            <span style={{ fontSize: "14px", fontWeight: 700, color: "#F8FAFC" }}>{contact.first_name} {contact.last_name}</span>
            <Tag color="amber">Angel</Tag>
            {contact.verified && <Tag color="green">Verified</Tag>}
          </div>
          {contact.role && <div style={{ fontSize: "12px", color: MUTED, marginBottom: "4px" }}>{contact.role}</div>}
          {contact.bio && (
            <p style={{ fontSize: "12px", color: MUTED, margin: 0, lineHeight: 1.5, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" as const }}>
              {contact.bio}
            </p>
          )}
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: "8px", flexShrink: 0 }}>
        {contact.linkedin_url && (
          <a href={contact.linkedin_url} target="_blank" rel="noopener noreferrer"
            style={{ fontSize: "12px", color: "#60A5FA", textDecoration: "none" }}>LinkedIn</a>
        )}
        <button
          onClick={onAdd} disabled={adding || added}
          style={{
            background: added ? "rgba(3,251,131,0.1)" : "rgba(3,251,131,0.12)",
            color: GREEN, border: `1px solid rgba(3,251,131,${added ? "0.5" : "0.25"})`,
            borderRadius: "8px", padding: "7px 14px",
            fontSize: "12px", fontWeight: 600, cursor: added ? "default" : "pointer", whiteSpace: "nowrap",
          }}>
          {added ? "✓ Added" : adding ? "…" : "+ Pipeline"}
        </button>
      </div>
    </div>
  );
}

export default function InvestorDatabaseClient() {
  const [query, setQuery]   = useState("");
  const [stage, setStage]   = useState("");
  const [geo, setGeo]       = useState("");
  const [sector, setSector] = useState("");
  const [type, setType]     = useState("");

  const [firms, setFirms]   = useState<(InvestorFirm & { investor_contacts: ContactRow[] })[]>([]);
  const [angels, setAngels] = useState<InvestorContact[]>([]);
  const [total, setTotal]   = useState(0);
  const [loading, setLoading] = useState(false);

  const [adding, setAdding] = useState<string | null>(null);
  const [added, setAdded]   = useState<Record<string, boolean>>({});

  const search = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (query)  params.set("q", query);
      if (stage)  params.set("stage", stage);
      if (geo)    params.set("geo", geo);
      if (sector) params.set("sector", sector);
      if (type)   params.set("type", type);
      const res = await fetch(`/api/crm/investors?${params}`);
      const data = await res.json();
      setFirms(data.firms ?? []);
      setAngels(data.angels ?? []);
      setTotal(data.total ?? 0);
    } finally {
      setLoading(false);
    }
  }, [query, stage, geo, sector, type]);

  useEffect(() => {
    const t = setTimeout(search, 300);
    return () => clearTimeout(t);
  }, [search]);

  async function addFirmToPipeline(firm: InvestorFirm) {
    setAdding(firm.id);
    try {
      const res = await fetch("/api/crm/pipeline", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          investor_firm_id: firm.id,
          fund_name: firm.name,
          stage_focus: firm.stage_focus,
          geography: firm.geography,
          sector_focus: firm.sector_focus,
          check_size_min: firm.check_size_min,
          check_size_max: firm.check_size_max,
          thesis_notes: firm.thesis_notes,
        }),
      });
      if (res.ok) setAdded(prev => ({ ...prev, [firm.id]: true }));
    } finally {
      setAdding(null);
    }
  }

  async function addContactToPipeline(firmId: string, contact: ContactRow, firm?: InvestorFirm & { investor_contacts: ContactRow[] }) {
    const key = `${firmId}-${contact.id}`;
    setAdding(key);
    try {
      const res = await fetch("/api/crm/pipeline", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          investor_firm_id: firmId,
          investor_contact_id: contact.id,
          fund_name: firm?.name ?? "",
          contact_name: `${contact.first_name} ${contact.last_name ?? ""}`.trim(),
          role: contact.role,
          email: contact.email,
          linkedin_url: contact.linkedin_url,
          stage_focus: firm?.stage_focus ?? [],
          geography: firm?.geography ?? [],
          sector_focus: firm?.sector_focus ?? [],
          check_size_min: firm?.check_size_min,
          check_size_max: firm?.check_size_max,
          thesis_notes: firm?.thesis_notes,
        }),
      });
      if (res.ok) setAdded(prev => ({ ...prev, [`contact-${contact.id}`]: true }));
    } finally {
      setAdding(null);
    }
  }

  async function addAngelToPipeline(contact: InvestorContact) {
    setAdding(`angel-${contact.id}`);
    try {
      const res = await fetch("/api/crm/pipeline", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          investor_contact_id: contact.id,
          fund_name: `${contact.first_name} ${contact.last_name ?? ""}`.trim(),
          contact_name: `${contact.first_name} ${contact.last_name ?? ""}`.trim(),
          role: contact.role,
          email: contact.email,
          linkedin_url: contact.linkedin_url,
        }),
      });
      if (res.ok) setAdded(prev => ({ ...prev, [`angel-${contact.id}`]: true }));
    } finally {
      setAdding(null);
    }
  }

  const hasResults = firms.length > 0 || angels.length > 0;
  const hasFilters = query || stage || geo || sector || type;

  return (
    <>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "28px", flexWrap: "wrap", gap: "16px" }}>
        <div>
          <h1 style={{ fontSize: "26px", fontWeight: 800, color: "#F8FAFC", margin: "0 0 4px" }}>Investor Database</h1>
          <p style={{ fontSize: "13px", color: MUTED, margin: 0 }}>
            {total > 0 ? `${total} firm${total !== 1 ? "s" : ""} · ${firms.reduce((n, f) => n + (f.investor_contacts?.length ?? 0), 0) + angels.length} contacts` : "Browse and search investors"}
          </p>
        </div>
        <a href="/crm/pipeline" style={{ fontSize: "13px", color: GREEN, textDecoration: "none", fontWeight: 600 }}>← Pipeline</a>
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: "8px", marginBottom: "20px", flexWrap: "wrap" }}>
        <input
          type="text" value={query} onChange={e => setQuery(e.target.value)}
          placeholder="Search by fund, name, thesis…"
          style={{ flex: 1, minWidth: "200px", padding: "9px 14px", background: CARD_BG, border: `1px solid ${BORDER}`, borderRadius: "8px", color: "#F8FAFC", fontSize: "13px", outline: "none" }}
        />
        <select value={type} onChange={e => setType(e.target.value)} style={selectStyle}>
          {TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
        </select>
        <select value={stage} onChange={e => setStage(e.target.value)} style={selectStyle}>
          <option value="">All stages</option>
          {STAGES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={geo} onChange={e => setGeo(e.target.value)} style={selectStyle}>
          <option value="">All geographies</option>
          {GEOS.map(g => <option key={g} value={g}>{g}</option>)}
        </select>
        <select value={sector} onChange={e => setSector(e.target.value)} style={selectStyle}>
          <option value="">All sectors</option>
          {SECTORS.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {/* Results */}
      {loading ? (
        <div style={{ textAlign: "center", padding: "60px", color: MUTED, fontSize: "14px" }}>Searching…</div>
      ) : !hasResults ? (
        <div style={{ background: CARD_BG, border: `1px solid ${BORDER}`, borderRadius: "14px", padding: "60px", textAlign: "center" }}>
          <p style={{ color: MUTED, fontSize: "14px" }}>
            {hasFilters ? "No investors match your search." : "Start typing to search the investor database."}
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {/* Firms */}
          {firms.map(firm => (
            <FirmCard
              key={firm.id}
              firm={firm}
              onAddFirm={addFirmToPipeline}
              onAddContact={(firmId, contact) => addContactToPipeline(firmId, contact, firm)}
              adding={adding}
              added={added}
            />
          ))}

          {/* Solo angels */}
          {angels.length > 0 && (
            <>
              {firms.length > 0 && (
                <div style={{ fontSize: "11px", fontWeight: 600, color: "#374151", textTransform: "uppercase", letterSpacing: "0.06em", padding: "8px 0 4px" }}>Solo Angels</div>
              )}
              {angels.map(angel => (
                <AngelCard
                  key={angel.id}
                  contact={angel}
                  onAdd={() => addAngelToPipeline(angel)}
                  adding={adding === `angel-${angel.id}`}
                  added={added[`angel-${angel.id}`] ?? false}
                />
              ))}
            </>
          )}
        </div>
      )}
    </>
  );
}
