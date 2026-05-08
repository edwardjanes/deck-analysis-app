"use client";

import { useRouter } from "next/navigation";
import posthog from "posthog-js";

const GREEN = "#03fb83";
const LOGO = "https://raw.githubusercontent.com/edwardjanes/source-capital/0147b27fad891686f67559992e43319411f07ba4/logo.png";
const CRM_PLAN_ID = process.env.NEXT_PUBLIC_WHOP_CRM_PLAN_ID ?? "";

const FEATURES = [
  { icon: "🎯", title: "Investor Pipeline", desc: "Track every investor across 11 deal stages — from researching to committed." },
  { icon: "🗂️", title: "Investor Database", desc: "Search Source Capital's curated database of VCs, angels and family offices." },
  { icon: "📋", title: "Touchpoint Log", desc: "Log every email, call, meeting and intro. Never lose track of where you are." },
  { icon: "📅", title: "Follow-up Reminders", desc: "Set follow-up dates per investor so nothing slips through the cracks." },
  { icon: "📥", title: "CSV Import & Export", desc: "Import your existing list or export your full pipeline any time." },
  { icon: "🔗", title: "LinkedIn Integration", desc: "Import investors from LinkedIn and enrich profiles automatically." },
];

export default function CrmUpgradePage() {
  const router = useRouter();

  function handleUpgrade() {
    posthog.capture("crm_upgrade_clicked");
    if (CRM_PLAN_ID) {
      window.location.href = `https://whop.com/checkout/${CRM_PLAN_ID}/`;
    }
  }

  return (
    <div style={{ minHeight: "100vh", background: "#080C14", color: "#F8FAFC", fontFamily: "'Inter', sans-serif" }}>
      {/* Header */}
      <header style={{ borderBottom: "1px solid #1A2438", padding: "0 32px", height: "60px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <a href="/dashboard">
          <img src={LOGO} alt="Source Capital" style={{ height: "28px" }} />
        </a>
        <a href="/dashboard" style={{ fontSize: "13px", color: "#6B7280", textDecoration: "none" }}>← Back to Dashboard</a>
      </header>

      <div style={{ maxWidth: "760px", margin: "0 auto", padding: "80px 32px", textAlign: "center" }}>
        {/* Badge */}
        <div style={{ display: "inline-block", background: "rgba(3,251,131,0.12)", color: GREEN, fontSize: "11px", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", padding: "5px 14px", borderRadius: "20px", marginBottom: "24px" }}>
          Investor CRM
        </div>

        <h1 style={{ fontSize: "42px", fontWeight: 800, lineHeight: 1.15, marginBottom: "20px", color: "#F8FAFC" }}>
          Stop managing your raise<br />in a spreadsheet
        </h1>

        <p style={{ fontSize: "18px", color: "#94A3B8", lineHeight: 1.7, marginBottom: "48px", maxWidth: "560px", margin: "0 auto 48px" }}>
          Track every investor relationship, log every touchpoint, and manage your pipeline from first outreach to term sheet — all in one place.
        </p>

        {/* Features grid */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "48px", textAlign: "left" }}>
          {FEATURES.map(({ icon, title, desc }) => (
            <div key={title} style={{ background: "#0F1929", border: "1px solid #1A2438", borderRadius: "12px", padding: "20px" }}>
              <div style={{ fontSize: "22px", marginBottom: "10px" }}>{icon}</div>
              <div style={{ fontSize: "14px", fontWeight: 700, color: "#F8FAFC", marginBottom: "6px" }}>{title}</div>
              <div style={{ fontSize: "13px", color: "#6B7280", lineHeight: 1.6 }}>{desc}</div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div style={{ background: "#0F1929", border: "1px solid #1A2438", borderRadius: "16px", padding: "40px" }}>
          <div style={{ fontSize: "32px", fontWeight: 800, color: "#F8FAFC", marginBottom: "4px" }}>
            £49<span style={{ fontSize: "16px", color: "#6B7280", fontWeight: 400 }}>/month</span>
          </div>
          <p style={{ fontSize: "14px", color: "#6B7280", marginBottom: "28px" }}>Cancel any time. Instant access.</p>

          <button
            onClick={handleUpgrade}
            style={{
              background: GREEN, color: "#000", border: "none", borderRadius: "12px",
              padding: "16px 40px", fontSize: "16px", fontWeight: 700,
              cursor: "pointer", width: "100%", maxWidth: "360px",
            }}
          >
            Unlock Investor CRM →
          </button>

          <p style={{ fontSize: "12px", color: "#374151", marginTop: "16px" }}>
            Secure checkout via Whop · Cancel any time
          </p>
        </div>
      </div>
    </div>
  );
}
