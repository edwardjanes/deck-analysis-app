"use client";

import { useState } from "react";
import { InvestorContact, InvestorFirm, FIRM_TYPE_LABELS, FirmType } from "@/lib/crm/types";

const CARD_BG = "#0F1929";
const BORDER = "#1A2438";
const MUTED = "#6B7280";
const GREEN = "#03fb83";

const inputStyle: React.CSSProperties = {
  width: "100%", padding: "9px 12px", background: "#111927",
  border: `1px solid ${BORDER}`, borderRadius: "8px",
  color: "#F8FAFC", fontSize: "14px", outline: "none", boxSizing: "border-box",
};
const labelStyle: React.CSSProperties = {
  display: "block", fontSize: "12px", fontWeight: 500, color: "#94A3B8", marginBottom: "6px",
};

const FIRM_TYPE_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  vc:           { bg: "rgba(59,130,246,0.15)",  text: "#60A5FA", border: "rgba(59,130,246,0.4)" },
  family_office:{ bg: "rgba(139,92,246,0.15)",  text: "#A78BFA", border: "rgba(139,92,246,0.4)" },
  accelerator:  { bg: "rgba(34,197,94,0.15)",   text: "#4ADE80", border: "rgba(34,197,94,0.4)" },
  corporate_vc: { bg: "rgba(251,191,36,0.15)",  text: "#FBBF24", border: "rgba(251,191,36,0.4)" },
  angel_network:{ bg: "rgba(245,158,11,0.15)",  text: "#F59E0B", border: "rgba(245,158,11,0.4)" },
  syndicate:    { bg: "rgba(236,72,153,0.15)",  text: "#F472B6", border: "rgba(236,72,153,0.4)" },
  debt_fund:    { bg: "rgba(107,114,128,0.15)", text: "#9CA3AF", border: "rgba(107,114,128,0.4)" },
  other:        { bg: "rgba(107,114,128,0.15)", text: "#9CA3AF", border: "rgba(107,114,128,0.4)" },
};

function FirmTypeBadge({ type }: { type: string }) {
  const c = FIRM_TYPE_COLORS[type] ?? FIRM_TYPE_COLORS.other;
  const label = FIRM_TYPE_LABELS[type as FirmType] ?? type;
  return (
    <span style={{ background: c.bg, color: c.text, border: `1px solid ${c.border}`, fontSize: "11px", fontWeight: 600, padding: "3px 10px", borderRadius: "20px" }}>
      {label}
    </span>
  );
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div style={{ borderBottom: `1px solid ${BORDER}`, paddingBottom: "12px" }}>
      <div style={{ fontSize: "11px", color: MUTED, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "4px" }}>{label}</div>
      <div style={{ fontSize: "14px", color: "#F8FAFC" }}>{value}</div>
    </div>
  );
}

export default function ContactProfileClient({
  contact: initial,
  firm,
}: {
  contact: InvestorContact;
  firm: InvestorFirm | null;
}) {
  const [contact, setContact] = useState(initial);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  // Edit form state
  const [firstName, setFirstName] = useState(contact.first_name);
  const [lastName, setLastName] = useState(contact.last_name ?? "");
  const [role, setRole] = useState(contact.role ?? "");
  const [email, setEmail] = useState(contact.email ?? "");
  const [linkedIn, setLinkedIn] = useState(contact.linkedin_url ?? "");
  const [phone, setPhone] = useState(contact.phone ?? "");
  const [location, setLocation] = useState(contact.location ?? "");
  const [bio, setBio] = useState(contact.bio ?? "");
  const [notes, setNotes] = useState(contact.notes ?? "");

  const fullName = [contact.first_name, contact.last_name].filter(Boolean).join(" ");
  const initials = `${contact.first_name[0] ?? ""}${contact.last_name?.[0] ?? ""}`.toUpperCase();

  async function saveContact(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch(`/api/crm/contacts/${contact.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          first_name: firstName.trim(),
          last_name: lastName.trim() || null,
          role: role.trim() || null,
          email: email.trim() || null,
          linkedin_url: linkedIn.trim() || null,
          phone: phone.trim() || null,
          location: location.trim() || null,
          bio: bio.trim() || null,
          notes: notes.trim() || null,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setContact(data.contact);
        setEditing(false);
      }
    } finally { setSaving(false); }
  }

  return (
    <div style={{ maxWidth: "800px", margin: "0 auto" }}>
      <a href="/crm/investors" style={{ fontSize: "13px", color: MUTED, textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "6px", marginBottom: "24px" }}>
        ← {firm ? `Back to Investors (${firm.name})` : "Back to Investors"}
      </a>

      {/* Profile header */}
      <div style={{ background: CARD_BG, border: `1px solid ${BORDER}`, borderRadius: "16px", padding: "28px", marginBottom: "20px" }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: "20px", flexWrap: "wrap" }}>
          {/* Avatar */}
          <div style={{ width: "64px", height: "64px", borderRadius: "50%", background: "rgba(59,130,246,0.2)", color: "#60A5FA", fontSize: "22px", fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            {initials || "?"}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap", marginBottom: "6px" }}>
              <h1 style={{ fontSize: "24px", fontWeight: 800, color: "#F8FAFC", margin: 0 }}>{fullName}</h1>
              {contact.verified && (
                <span style={{ fontSize: "11px", color: "#4ADE80", background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.3)", padding: "3px 10px", borderRadius: "20px" }}>Verified</span>
              )}
            </div>
            {contact.role && <div style={{ fontSize: "14px", color: "#94A3B8", marginBottom: "4px" }}>{contact.role}</div>}
            {firm && (
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <a href={`/crm/investor/${contact.investor_firm_id ?? ""}`} style={{ fontSize: "13px", color: "#60A5FA", textDecoration: "none" }}>{firm.name}</a>
                <FirmTypeBadge type={firm.type} />
              </div>
            )}
            {!firm && <span style={{ fontSize: "12px", color: MUTED }}>Independent / Angel</span>}
          </div>
          <button
            onClick={() => setEditing(v => !v)}
            style={{ background: editing ? "rgba(239,68,68,0.1)" : "rgba(3,251,131,0.1)", color: editing ? "#F87171" : GREEN, border: `1px solid ${editing ? "rgba(239,68,68,0.3)" : "rgba(3,251,131,0.3)"}`, borderRadius: "8px", padding: "8px 16px", fontSize: "13px", fontWeight: 600, cursor: "pointer" }}
          >
            {editing ? "Cancel" : "Edit"}
          </button>
        </div>

        {/* Quick action links */}
        <div style={{ display: "flex", gap: "8px", marginTop: "16px", flexWrap: "wrap" }}>
          {contact.email && (
            <a href={`mailto:${contact.email}`} style={{ fontSize: "12px", background: "#111927", border: `1px solid ${BORDER}`, borderRadius: "8px", padding: "7px 14px", color: "#94A3B8", textDecoration: "none" }}>✉ {contact.email}</a>
          )}
          {contact.linkedin_url && (
            <a href={contact.linkedin_url} target="_blank" rel="noopener noreferrer" style={{ fontSize: "12px", background: "#111927", border: `1px solid ${BORDER}`, borderRadius: "8px", padding: "7px 14px", color: "#60A5FA", textDecoration: "none" }}>LinkedIn ↗</a>
          )}
          {contact.phone && (
            <a href={`tel:${contact.phone}`} style={{ fontSize: "12px", background: "#111927", border: `1px solid ${BORDER}`, borderRadius: "8px", padding: "7px 14px", color: "#94A3B8", textDecoration: "none" }}>📞 {contact.phone}</a>
          )}
        </div>
      </div>

      {editing ? (
        /* Edit form */
        <div style={{ background: CARD_BG, border: `1px solid ${BORDER}`, borderRadius: "16px", padding: "28px" }}>
          <h2 style={{ fontSize: "14px", fontWeight: 700, color: "#F8FAFC", marginBottom: "20px" }}>Edit Contact</h2>
          <form onSubmit={saveContact} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            <div style={{ display: "flex", gap: "12px" }}>
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>First Name *</label>
                <input style={inputStyle} value={firstName} onChange={e => setFirstName(e.target.value)} required />
              </div>
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>Last Name</label>
                <input style={inputStyle} value={lastName} onChange={e => setLastName(e.target.value)} />
              </div>
            </div>
            <div>
              <label style={labelStyle}>Role / Title</label>
              <input style={inputStyle} value={role} onChange={e => setRole(e.target.value)} placeholder="e.g. Partner, Associate" />
            </div>
            <div style={{ display: "flex", gap: "12px" }}>
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>Email</label>
                <input style={inputStyle} type="email" value={email} onChange={e => setEmail(e.target.value)} />
              </div>
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>Phone</label>
                <input style={inputStyle} value={phone} onChange={e => setPhone(e.target.value)} />
              </div>
            </div>
            <div>
              <label style={labelStyle}>LinkedIn URL</label>
              <input style={inputStyle} value={linkedIn} onChange={e => setLinkedIn(e.target.value)} placeholder="https://linkedin.com/in/..." />
            </div>
            <div>
              <label style={labelStyle}>Location</label>
              <input style={inputStyle} value={location} onChange={e => setLocation(e.target.value)} placeholder="London, UK" />
            </div>
            <div>
              <label style={labelStyle}>Bio</label>
              <textarea style={{ ...inputStyle, minHeight: "80px", resize: "vertical" }} value={bio} onChange={e => setBio(e.target.value)} placeholder="Background, focus areas, notable investments…" />
            </div>
            <div>
              <label style={labelStyle}>Private Notes</label>
              <textarea style={{ ...inputStyle, minHeight: "70px", resize: "vertical" }} value={notes} onChange={e => setNotes(e.target.value)} placeholder="Internal notes — not shared…" />
            </div>
            <div style={{ display: "flex", gap: "8px" }}>
              <button type="submit" disabled={saving} style={{ background: saving ? "#374151" : GREEN, color: "#000", border: "none", borderRadius: "8px", padding: "10px 20px", fontSize: "13px", fontWeight: 700, cursor: saving ? "not-allowed" : "pointer" }}>
                {saving ? "Saving…" : "Save Changes"}
              </button>
              <button type="button" onClick={() => setEditing(false)} style={{ background: "transparent", color: MUTED, border: `1px solid ${BORDER}`, borderRadius: "8px", padding: "10px 14px", fontSize: "13px", cursor: "pointer" }}>Cancel</button>
            </div>
          </form>
        </div>
      ) : (
        /* Detail view */
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
          <div style={{ background: CARD_BG, border: `1px solid ${BORDER}`, borderRadius: "14px", padding: "24px", display: "flex", flexDirection: "column", gap: "14px" }}>
            <h2 style={{ fontSize: "14px", fontWeight: 700, color: "#F8FAFC", margin: "0 0 4px" }}>Contact Details</h2>
            {contact.location && <InfoRow label="Location" value={contact.location} />}
            {contact.email && <InfoRow label="Email" value={<a href={`mailto:${contact.email}`} style={{ color: GREEN, textDecoration: "none" }}>{contact.email}</a>} />}
            {contact.phone && <InfoRow label="Phone" value={<a href={`tel:${contact.phone}`} style={{ color: "#94A3B8", textDecoration: "none" }}>{contact.phone}</a>} />}
            {contact.linkedin_url && <InfoRow label="LinkedIn" value={<a href={contact.linkedin_url} target="_blank" rel="noopener noreferrer" style={{ color: "#60A5FA", textDecoration: "none" }}>View profile ↗</a>} />}
            {!contact.email && !contact.phone && !contact.linkedin_url && !contact.location && (
              <p style={{ fontSize: "13px", color: MUTED, margin: 0 }}>No contact details added yet.</p>
            )}
          </div>

          <div style={{ background: CARD_BG, border: `1px solid ${BORDER}`, borderRadius: "14px", padding: "24px", display: "flex", flexDirection: "column", gap: "14px" }}>
            <h2 style={{ fontSize: "14px", fontWeight: 700, color: "#F8FAFC", margin: "0 0 4px" }}>Background</h2>
            {contact.bio ? (
              <p style={{ fontSize: "14px", color: "#94A3B8", lineHeight: 1.6, margin: 0 }}>{contact.bio}</p>
            ) : (
              <p style={{ fontSize: "13px", color: MUTED, margin: 0 }}>No bio added yet.</p>
            )}
            {contact.notes && (
              <div style={{ marginTop: "8px", paddingTop: "12px", borderTop: `1px solid ${BORDER}` }}>
                <div style={{ fontSize: "11px", color: MUTED, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "6px" }}>Private Notes</div>
                <p style={{ fontSize: "13px", color: "#94A3B8", lineHeight: 1.6, margin: 0 }}>{contact.notes}</p>
              </div>
            )}
          </div>

          {firm && (
            <div style={{ background: CARD_BG, border: `1px solid ${BORDER}`, borderRadius: "14px", padding: "24px", gridColumn: "span 2" }}>
              <h2 style={{ fontSize: "14px", fontWeight: 700, color: "#F8FAFC", marginBottom: "12px" }}>Firm Overview</h2>
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "16px", flexWrap: "wrap" }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                    <span style={{ fontSize: "16px", fontWeight: 700, color: "#F8FAFC" }}>{firm.name}</span>
                    <FirmTypeBadge type={firm.type} />
                  </div>
                  {firm.description && <p style={{ fontSize: "13px", color: "#94A3B8", lineHeight: 1.6, margin: "0 0 10px" }}>{firm.description}</p>}
                  <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                    {firm.stage_focus?.map(s => (
                      <span key={s} style={{ background: "rgba(59,130,246,0.1)", color: "#60A5FA", border: "1px solid rgba(59,130,246,0.2)", fontSize: "10px", padding: "2px 8px", borderRadius: "10px" }}>{s}</span>
                    ))}
                    {firm.geography?.map(g => (
                      <span key={g} style={{ background: "rgba(34,197,94,0.1)", color: "#4ADE80", border: "1px solid rgba(34,197,94,0.2)", fontSize: "10px", padding: "2px 8px", borderRadius: "10px" }}>{g}</span>
                    ))}
                  </div>
                </div>
                <a href="/crm/investors" style={{ fontSize: "13px", background: "#111927", border: `1px solid ${BORDER}`, borderRadius: "8px", padding: "8px 16px", color: "#94A3B8", textDecoration: "none", flexShrink: 0 }}>
                  View in Database →
                </a>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
