"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabaseBrowser";
import { FunnelChart, Funnel, Tooltip, LabelList, ResponsiveContainer } from "recharts";

// ── Design tokens ─────────────────────────────────────────────────────────────
const C = {
  bg:        "#F8FAFC",
  panel:     "#FFFFFF",
  panelAlt:  "#EFF6FF",
  border:    "#DBEAFE",
  borderMid: "#BFDBFE",
  primary:   "#1E40AF",
  secondary: "#3B82F6",
  cta:       "#F59E0B",
  ctaDark:   "#D97706",
  text:      "#1E3A8A",
  textMid:   "#3B82F6",
  textMuted: "#64748B",
  textFaint: "#94A3B8",
  success:   "#10B981",
  warning:   "#F59E0B",
  danger:    "#EF4444",
  navBorder: "#E2E8F0",
  sidebarBg: "#F0F7FF",
};
const FONT_SANS = "'Fira Sans', 'Inter', sans-serif";
const FONT_MONO = "'Fira Code', 'Courier New', monospace";
const LOGO = "https://raw.githubusercontent.com/edwardjanes/source-capital/0147b27fad891686f67559992e43319411f07ba4/logo.png";

const COUNTRIES = [
  "Australia","Austria","Belgium","Brazil","Canada","Chile","China","Colombia",
  "Czech Republic","Denmark","Egypt","Finland","France","Germany","Ghana","Greece",
  "Hong Kong","Hungary","India","Indonesia","Ireland","Israel","Italy","Japan",
  "Kenya","Malaysia","Mexico","Netherlands","New Zealand","Nigeria","Norway",
  "Pakistan","Philippines","Poland","Portugal","Romania","Saudi Arabia","Singapore",
  "South Africa","South Korea","Spain","Sweden","Switzerland","Taiwan","Thailand",
  "Turkey","Ukraine","United Arab Emirates","United Kingdom","United States","Vietnam","Other",
];

interface Analysis {
  id: string;
  business_name: string;
  created_at: string;
  status: string;
  score: number | null;
  analysis_json: { slideCount?: number } | null;
}

interface Props {
  firstName: string;
  plan: string;
  analysesUsed: number;
  analyses: Analysis[];
  userId: string;
  userEmail: string;
  crmAccess: boolean;
  pipelineStageCounts: Record<string, number>;
  raiseCommitted: number;
  raiseTarget: number;
}

export default function DashboardClient({
  firstName, plan, analysesUsed, analyses, userId, userEmail,
  crmAccess, pipelineStageCounts, raiseCommitted, raiseTarget,
}: Props) {
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();
  const fileRef = useRef<HTMLInputElement>(null);

  const [businessName, setBusinessName] = useState("");
  const [website, setWebsite] = useState("");
  const [country, setCountry] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [limitReached, setLimitReached] = useState<{ existingId: string } | null>(null);

  const isPro = plan === "pro";
  const FREE_LIMIT = 1;
  const canAnalyse = isPro || analysesUsed < FREE_LIMIT;

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  function handleFileDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped?.type === "application/pdf") { setFile(dropped); setError(""); }
    else setError("Please upload a PDF file.");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) { setError("Please upload your pitch deck PDF."); return; }
    if (!country) { setError("Please select your country."); return; }
    if (file.size > 20 * 1024 * 1024) { setError("File must be under 20MB."); return; }
    setSubmitting(true); setError("");
    const fd = new FormData();
    fd.append("firstName", firstName); fd.append("lastName", "");
    fd.append("email", userEmail); fd.append("businessName", businessName);
    fd.append("website", website); fd.append("country", country);
    fd.append("deck", file); fd.append("userId", userId);
    try {
      const res = await fetch("/api/submit", { method: "POST", body: fd });
      const data = await res.json();
      if (res.status === 403 && data.error === "free_limit_reached") {
        setLimitReached({ existingId: data.existingSubmissionId });
        setShowUploadForm(false); setSubmitting(false); return;
      }
      if (!res.ok) throw new Error(data.error || "Submission failed");
      router.push(`/investment-score/analysing/${data.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setSubmitting(false);
    }
  }

  const whopUrl = `https://whop.com/checkout/${process.env.NEXT_PUBLIC_WHOP_PLAN_ID ?? "plan_AUP8u87FOYnEZ"}`;

  return (
    <div style={{ minHeight: "100vh", background: C.bg, color: C.text, fontFamily: FONT_SANS }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%,100% { opacity:1 } 50% { opacity:.4 } }
        * { box-sizing: border-box; }
        a { text-decoration: none; }
        button:focus-visible, a:focus-visible, input:focus-visible, select:focus-visible {
          outline: 2px solid ${C.secondary}; outline-offset: 2px; border-radius: 6px;
        }
      `}</style>

      {/* Nav */}
      <nav style={{
        borderBottom: `1px solid ${C.navBorder}`, padding: "0 32px", height: "60px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        background: C.panel, position: "sticky", top: 0, zIndex: 40,
        boxShadow: "0 1px 3px rgba(30,64,175,0.06)",
      }}>
        <img src={LOGO} alt="Source Capital" style={{ height: "28px", width: "auto" }} />
        <div style={{ display: "flex", alignItems: "center", gap: "28px" }}>
          {[
            { label: "Dashboard", href: "/dashboard" },
            { label: "Investor CRM", href: "/crm" },
            { label: "Pricing", href: "https://sourcecapital.co.uk/pricing" },
            { label: "About", href: "https://sourcecapital.co.uk/about" },
            { label: "Contact", href: "https://sourcecapital.co.uk/contact" },
          ].map(({ label, href }) => (
            <a key={label} href={href}
              style={{ fontSize: "14px", color: C.textMuted, fontWeight: 500, fontFamily: FONT_SANS, transition: "color 0.15s" }}
              onMouseOver={e => (e.currentTarget.style.color = C.primary)}
              onMouseOut={e => (e.currentTarget.style.color = C.textMuted)}>
              {label}
            </a>
          ))}
          <button onClick={handleLogout}
            style={{ fontSize: "14px", color: C.textMuted, background: "none", border: `1px solid ${C.border}`, borderRadius: "8px", padding: "6px 14px", cursor: "pointer", fontFamily: FONT_SANS, transition: "all 0.15s" }}
            onMouseOver={e => { e.currentTarget.style.borderColor = C.borderMid; e.currentTarget.style.color = C.primary; }}
            onMouseOut={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.color = C.textMuted; }}>
            Log out
          </button>
        </div>
      </nav>

      {/* Body: sidebar + main */}
      <div style={{ display: "flex", minHeight: "calc(100vh - 60px)" }}>

        {/* Sidebar */}
        <aside style={{
          width: "220px", flexShrink: 0,
          borderRight: `1px solid ${C.navBorder}`,
          padding: "28px 12px",
          display: "flex", flexDirection: "column", gap: "2px",
          position: "sticky", top: "60px", height: "calc(100vh - 60px)", overflowY: "auto",
          background: C.sidebarBg,
        }}>
          <div style={{ fontSize: "10px", fontWeight: 700, color: C.textFaint, textTransform: "uppercase", letterSpacing: "0.08em", padding: "0 10px", marginBottom: "6px" }}>Main</div>
          <SidebarItem href="/dashboard" icon={<IconGrid />} label="Dashboard" active />
          <SidebarItem href="#" icon={<IconUpload />} label="Analyse Deck" onClick={() => setShowUploadForm(true)} />
          <SidebarItem href="/crm/pipeline" icon={<IconPipeline />} label="Investor Pipeline" />
          <SidebarItem href="/crm/projects" icon={<IconFolder />} label="Raise Projects" />
          <div style={{ height: "1px", background: C.border, margin: "10px 4px" }} />
          <div style={{ fontSize: "10px", fontWeight: 700, color: C.textFaint, textTransform: "uppercase", letterSpacing: "0.08em", padding: "0 10px", marginBottom: "6px" }}>Coming Soon</div>
          <SidebarItem href="#" icon={<IconDoc />} label="Documents" disabled />
          <SidebarItem href="#" icon={<IconChart />} label="Analytics" disabled />
          <SidebarItem href="#" icon={<IconSettings />} label="Settings" disabled />
        </aside>

        {/* Main content */}
        <div style={{ flex: 1, minWidth: 0, padding: "36px 40px 60px" }}>

          {/* Header */}
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "28px", flexWrap: "wrap", gap: "16px" }}>
            <div>
              <h1 style={{ fontSize: "24px", fontWeight: 700, marginBottom: "4px", color: C.text, fontFamily: FONT_SANS }}>
                Welcome back, {firstName}
              </h1>
              <p style={{ fontSize: "14px", color: C.textMuted, lineHeight: 1.5 }}>
                {isPro ? "You have unlimited analyses." : `${Math.max(0, FREE_LIMIT - analysesUsed)} free ${FREE_LIMIT - analysesUsed === 1 ? "analysis" : "analyses"} remaining.`}
              </p>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <span style={{
                padding: "5px 12px", borderRadius: "20px", fontSize: "12px", fontWeight: 700,
                background: isPro ? "rgba(30,64,175,0.08)" : "rgba(100,116,139,0.08)",
                color: isPro ? C.primary : C.textMuted,
                border: `1px solid ${isPro ? C.border : "#E2E8F0"}`,
              }}>{isPro ? "Pro Plan" : "Free Plan"}</span>
              {!isPro && (
                <a href={whopUrl} target="_blank" rel="noopener noreferrer"
                  style={{ padding: "8px 16px", borderRadius: "8px", background: C.cta, color: "#fff", fontSize: "13px", fontWeight: 700, transition: "background 0.15s" }}
                  onMouseOver={e => (e.currentTarget.style.background = C.ctaDark)}
                  onMouseOut={e => (e.currentTarget.style.background = C.cta)}>
                  Upgrade to Pro
                </a>
              )}
            </div>
          </div>

          {/* Stats: raise progress + gauge + funnel */}
          <StatsRow
            analyses={analyses}
            crmAccess={crmAccess}
            pipelineStageCounts={pipelineStageCounts}
            raiseCommitted={raiseCommitted}
            raiseTarget={raiseTarget}
          />

          {/* Upload area */}
          <div style={{
            background: C.panel, border: `1px solid ${limitReached ? C.borderMid : C.border}`,
            borderRadius: "14px", padding: "28px", marginBottom: "28px",
            boxShadow: "0 1px 4px rgba(30,64,175,0.05)",
          }}>
            {limitReached ? (
              <div style={{ textAlign: "center", padding: "12px 0" }}>
                <div style={{ width: "44px", height: "44px", borderRadius: "10px", background: "rgba(30,64,175,0.08)", border: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px" }}>
                  <svg width="20" height="20" viewBox="0 0 22 22" fill="none">
                    <rect x="3" y="10" width="16" height="11" rx="2" stroke={C.primary} strokeWidth="1.6"/>
                    <path d="M7 10V7a4 4 0 018 0v3" stroke={C.primary} strokeWidth="1.6" strokeLinecap="round"/>
                  </svg>
                </div>
                <h3 style={{ fontSize: "16px", fontWeight: 700, marginBottom: "8px", color: C.text }}>Free submission used</h3>
                <p style={{ fontSize: "14px", color: C.textMuted, maxWidth: "360px", margin: "0 auto 20px", lineHeight: 1.6 }}>
                  Upgrade to Pro for unlimited analyses.
                </p>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "10px", flexWrap: "wrap" }}>
                  <a href={limitReached.existingId ? `/investment-score/results/${limitReached.existingId}` : "/dashboard"}
                    style={{ padding: "9px 18px", borderRadius: "8px", border: `1px solid ${C.border}`, background: "transparent", color: C.textMuted, fontSize: "14px", fontWeight: 600 }}>
                    View existing analysis
                  </a>
                  <a href={whopUrl} target="_blank" rel="noopener noreferrer"
                    style={{ padding: "9px 20px", borderRadius: "8px", background: C.cta, color: "#fff", fontSize: "14px", fontWeight: 700 }}>
                    Upgrade to Pro
                  </a>
                </div>
              </div>
            ) : !showUploadForm ? (
              <div
                onClick={() => canAnalyse && setShowUploadForm(true)}
                onDragOver={e => { e.preventDefault(); if (canAnalyse) setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={e => {
                  if (!canAnalyse) return;
                  e.preventDefault(); setDragOver(false);
                  const f = e.dataTransfer.files[0];
                  if (f?.type === "application/pdf") { setFile(f); setShowUploadForm(true); }
                }}
                style={{
                  border: `2px dashed ${dragOver ? C.secondary : C.border}`,
                  borderRadius: "10px", padding: "44px 32px", textAlign: "center",
                  cursor: canAnalyse ? "pointer" : "default",
                  background: dragOver ? "rgba(59,130,246,0.04)" : C.panelAlt,
                  transition: "all 0.2s",
                }}
              >
                <div style={{ width: "40px", height: "40px", margin: "0 auto 12px", color: canAnalyse ? C.secondary : C.textFaint }}>
                  <IconUploadLg />
                </div>
                {canAnalyse ? (
                  <>
                    <p style={{ fontSize: "15px", fontWeight: 600, marginBottom: "4px", color: C.text }}>
                      <span style={{ color: C.secondary }}>Click to upload</span> or drag and drop
                    </p>
                    <p style={{ fontSize: "13px", color: C.textMuted }}>PDF only · Max 20MB</p>
                  </>
                ) : (
                  <>
                    <p style={{ fontSize: "15px", fontWeight: 600, marginBottom: "6px", color: C.text }}>Free analyses used</p>
                    <p style={{ fontSize: "13px", color: C.textMuted, marginBottom: "14px" }}>Upgrade to Pro for unlimited analyses</p>
                    <a href={whopUrl} target="_blank" rel="noopener noreferrer"
                      style={{ display: "inline-block", padding: "9px 22px", borderRadius: "8px", background: C.cta, color: "#fff", fontSize: "14px", fontWeight: 700 }}>
                      Upgrade to Pro
                    </a>
                  </>
                )}
              </div>
            ) : (
              <form onSubmit={handleSubmit}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
                  <h2 style={{ fontSize: "15px", fontWeight: 700, color: C.text }}>New Analysis</h2>
                  <button type="button" onClick={() => { setShowUploadForm(false); setFile(null); setError(""); }}
                    style={{ background: "none", border: "none", color: C.textMuted, cursor: "pointer", fontSize: "20px", lineHeight: 1, padding: "4px" }}>
                    ×
                  </button>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px", marginBottom: "14px" }}>
                  <div>
                    <label style={labelStyle}>Business name *</label>
                    <input style={inputStyle} type="text" required value={businessName} onChange={e => setBusinessName(e.target.value)} placeholder="Acme Inc." />
                  </div>
                  <div>
                    <label style={labelStyle}>Website</label>
                    <input style={inputStyle} type="url" value={website} onChange={e => setWebsite(e.target.value)} placeholder="https://acme.com" />
                  </div>
                </div>
                <div style={{ marginBottom: "14px" }}>
                  <label style={labelStyle}>Country *</label>
                  <select required value={country} onChange={e => setCountry(e.target.value)}
                    style={{ ...inputStyle, color: country ? C.text : C.textMuted }}>
                    <option value="" disabled>Select your country</option>
                    {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div style={{ marginBottom: "14px" }}>
                  <label style={labelStyle}>Pitch deck (PDF, max 20MB) *</label>
                  <div
                    onClick={() => fileRef.current?.click()}
                    onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={handleFileDrop}
                    style={{
                      border: `2px dashed ${dragOver ? C.secondary : file ? C.borderMid : C.border}`,
                      borderRadius: "8px", padding: "20px", textAlign: "center", cursor: "pointer",
                      background: file ? C.panelAlt : "transparent", transition: "all 0.2s",
                    }}>
                    {file ? (
                      <>
                        <svg width="18" height="18" viewBox="0 0 20 20" fill="none" style={{ color: C.primary, margin: "0 auto 6px", display: "block" }}>
                          <path d="M4 4h8l4 4v8a1 1 0 01-1 1H4a1 1 0 01-1-1V5a1 1 0 011-1z" stroke="currentColor" strokeWidth="1.4"/>
                          <path d="M12 4v4h4" stroke="currentColor" strokeWidth="1.4"/>
                        </svg>
                        <p style={{ fontSize: "14px", fontWeight: 600, color: C.primary }}>{file.name}</p>
                        <p style={{ fontSize: "12px", color: C.textMuted, marginTop: "3px" }}>{(file.size / 1024 / 1024).toFixed(1)} MB · click to replace</p>
                      </>
                    ) : (
                      <p style={{ fontSize: "14px", color: C.textMuted }}><span style={{ color: C.secondary, fontWeight: 600 }}>Click to upload</span> or drag and drop</p>
                    )}
                  </div>
                  <input ref={fileRef} type="file" accept="application/pdf" onChange={e => { const f = e.target.files?.[0]; if (f?.type === "application/pdf") { setFile(f); setError(""); } }} style={{ display: "none" }} />
                </div>
                {error && (
                  <p style={{ fontSize: "13px", color: C.danger, marginBottom: "14px", padding: "9px 12px", background: "rgba(239,68,68,0.06)", borderRadius: "7px", border: "1px solid rgba(239,68,68,0.2)" }}>
                    {error}
                  </p>
                )}
                <button type="submit" disabled={submitting} style={{
                  width: "100%", padding: "12px",
                  background: submitting ? C.panelAlt : C.primary,
                  border: "none", borderRadius: "9px",
                  color: submitting ? C.textMuted : "#fff",
                  fontSize: "15px", fontWeight: 700, cursor: submitting ? "not-allowed" : "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
                  transition: "background 0.15s",
                }}>
                  {submitting ? (
                    <><span style={{ width: "15px", height: "15px", border: `2px solid ${C.border}`, borderTopColor: C.primary, borderRadius: "50%", animation: "spin 0.7s linear infinite", display: "inline-block" }} />Uploading...</>
                  ) : "Analyse My Deck"}
                </button>
              </form>
            )}
          </div>

          {/* Analysis history */}
          <div>
            <h2 style={{ fontSize: "16px", fontWeight: 700, marginBottom: "12px", color: C.text }}>Analysis History</h2>
            {analyses.length === 0 ? (
              <div style={{ background: C.panel, border: `1px solid ${C.border}`, borderRadius: "12px", padding: "40px", textAlign: "center" }}>
                <p style={{ fontSize: "14px", color: C.textMuted }}>No analyses yet. Upload your first deck to get started.</p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {analyses.map(a => {
                  const date = new Date(a.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
                  const isComplete = a.status === "complete";
                  return (
                    <a key={a.id}
                      href={isComplete ? `/investment-score/results/${a.id}` : `/investment-score/analysing/${a.id}`}
                      style={{
                        display: "flex", alignItems: "center", justifyContent: "space-between",
                        background: C.panel, border: `1px solid ${C.border}`,
                        borderRadius: "10px", padding: "14px 18px",
                        color: "inherit", transition: "all 0.15s", cursor: "pointer",
                      }}
                      onMouseOver={e => { e.currentTarget.style.background = C.panelAlt; e.currentTarget.style.borderColor = C.borderMid; }}
                      onMouseOut={e => { e.currentTarget.style.background = C.panel; e.currentTarget.style.borderColor = C.border; }}>
                      <div>
                        <p style={{ fontSize: "14px", fontWeight: 600, marginBottom: "2px", color: C.text }}>{a.business_name}</p>
                        <p style={{ fontSize: "12px", color: C.textMuted }}>{date}{a.analysis_json?.slideCount ? ` · ${a.analysis_json.slideCount} slides` : ""}</p>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                        {isComplete && a.score !== null ? (
                          <div style={{ textAlign: "right" }}>
                            <span style={{ fontSize: "20px", fontWeight: 700, color: scoreColor(a.score), fontFamily: FONT_MONO }}>{a.score}</span>
                            <span style={{ fontSize: "11px", color: C.textFaint, fontFamily: FONT_MONO }}>/100</span>
                          </div>
                        ) : (
                          <span style={{
                            fontSize: "11px", fontWeight: 600, padding: "3px 9px", borderRadius: "20px",
                            background: a.status === "error" ? "rgba(239,68,68,0.08)" : "rgba(59,130,246,0.08)",
                            color: a.status === "error" ? C.danger : C.secondary,
                            border: `1px solid ${a.status === "error" ? "rgba(239,68,68,0.25)" : C.border}`,
                          }}>
                            {a.status === "error" ? "Error" : "Analysing..."}
                          </span>
                        )}
                        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" style={{ color: C.textFaint, flexShrink: 0 }}>
                          <path d="M6 12l4-4-4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </div>
                    </a>
                  );
                })}
              </div>
            )}
          </div>

        </div>{/* end main */}
      </div>{/* end body */}
    </div>
  );
}

// ── Sidebar ───────────────────────────────────────────────────────────────────
function SidebarItem({ href, icon, label, active, disabled, onClick }: {
  href: string; icon: React.ReactNode; label: string;
  active?: boolean; disabled?: boolean; onClick?: () => void;
}) {
  const base: React.CSSProperties = {
    display: "flex", alignItems: "center", gap: "9px",
    padding: "8px 10px", borderRadius: "8px",
    fontSize: "13px", fontWeight: active ? 600 : 400,
    fontFamily: FONT_SANS,
    color: disabled ? C.textFaint : active ? C.primary : C.textMuted,
    background: active ? "rgba(30,64,175,0.08)" : "transparent",
    border: active ? `1px solid ${C.border}` : "1px solid transparent",
    cursor: disabled ? "not-allowed" : "pointer",
    textDecoration: "none",
    transition: "all 0.15s",
    width: "100%", boxSizing: "border-box",
    opacity: disabled ? 0.45 : 1,
  };

  if (disabled) {
    return (
      <div
        style={base}
        role="button"
        aria-disabled="true"
        title="Coming soon"
        tabIndex={-1}
      >
        {icon}
        <span style={{ flex: 1 }}>{label}</span>
      </div>
    );
  }

  if (onClick) {
    return (
      <button onClick={onClick} style={base}
        onMouseEnter={e => { e.currentTarget.style.background = "rgba(30,64,175,0.06)"; e.currentTarget.style.color = C.primary; }}
        onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = C.textMuted; }}>
        {icon}<span>{label}</span>
      </button>
    );
  }

  return (
    <a href={href} style={base}
      onMouseEnter={e => { if (!active) { e.currentTarget.style.background = "rgba(30,64,175,0.06)"; e.currentTarget.style.color = C.primary; } }}
      onMouseLeave={e => { if (!active) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = C.textMuted; } }}>
      {icon}<span>{label}</span>
    </a>
  );
}

// ── Stats section ─────────────────────────────────────────────────────────────
function StatsRow({ analyses, crmAccess, pipelineStageCounts, raiseCommitted, raiseTarget }: {
  analyses: Analysis[];
  crmAccess: boolean;
  pipelineStageCounts: Record<string, number>;
  raiseCommitted: number;
  raiseTarget: number;
}) {
  const latestScore = analyses.find(a => a.status === "complete" && a.score !== null)?.score ?? null;
  const showProgress = crmAccess && (raiseCommitted > 0 || raiseTarget > 0);

  if (latestScore === null && !crmAccess) return null;

  return (
    <div style={{ marginBottom: "28px" }}>
      {showProgress && <BulletGauge committed={raiseCommitted} target={raiseTarget} />}
      <div style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
        {latestScore !== null && <ScoreGauge score={latestScore} />}
        {crmAccess && <PipelineFunnelChart counts={pipelineStageCounts} />}
      </div>
    </div>
  );
}

// ── Bullet Gauge (raise progress) ─────────────────────────────────────────────
function BulletGauge({ committed, target }: { committed: number; target: number }) {
  if (target === 0 && committed === 0) return null;
  const pct = target > 0 ? Math.min((committed / target) * 100, 100) : 0;
  const remaining = Math.max(target - committed, 0);
  const gradColor = pct >= 75 ? C.success : pct >= 40 ? C.warning : C.secondary;

  return (
    <div style={{
      background: C.panel, border: `1px solid ${C.border}`, borderRadius: "14px",
      padding: "20px 24px", marginBottom: "16px",
      boxShadow: "0 1px 4px rgba(30,64,175,0.05)",
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px", flexWrap: "wrap", gap: "8px" }}>
        <span style={{ fontSize: "11px", fontWeight: 700, color: C.textFaint, textTransform: "uppercase", letterSpacing: "0.07em" }}>Raise Progress</span>
        <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
          <span style={{ fontFamily: FONT_MONO, fontSize: "15px", fontWeight: 700, color: gradColor }}>
            {fmtAmount(committed)}
          </span>
          {target > 0 && (
            <span style={{ fontSize: "13px", color: C.textMuted }}>
              of <span style={{ fontFamily: FONT_MONO, fontWeight: 600, color: C.text }}>{fmtAmount(target)}</span> target
            </span>
          )}
          {remaining > 0 && target > 0 && (
            <span style={{ fontSize: "12px", color: C.textFaint }}>· {fmtAmount(remaining)} to go</span>
          )}
          {pct >= 100 && (
            <span style={{ fontSize: "11px", fontWeight: 700, color: C.success, background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.3)", padding: "2px 10px", borderRadius: "20px" }}>Target reached</span>
          )}
        </div>
      </div>
      {/* Bullet track */}
      <div style={{ position: "relative", height: "12px" }}>
        {/* Background zones: red / yellow / green */}
        <div style={{ position: "absolute", inset: 0, borderRadius: "8px", overflow: "hidden", display: "flex" }}>
          <div style={{ flex: "0 0 30%", background: "rgba(239,68,68,0.12)" }} />
          <div style={{ flex: "0 0 30%", background: "rgba(245,158,11,0.12)" }} />
          <div style={{ flex: 1, background: "rgba(16,185,129,0.12)" }} />
        </div>
        {/* Fill bar */}
        <div style={{
          position: "absolute", left: 0, top: "2px", bottom: "2px",
          width: `${pct}%`, borderRadius: "6px",
          background: `linear-gradient(90deg, ${C.secondary}, ${gradColor})`,
          boxShadow: `0 0 6px ${gradColor}55`,
          transition: "width 0.6s ease",
        }} />
        {/* Target marker */}
        {target > 0 && (
          <div style={{
            position: "absolute", top: "-3px", bottom: "-3px",
            left: "100%", width: "2px",
            background: C.text, borderRadius: "2px",
            transform: "translateX(-1px)",
          }}>
            <div style={{ position: "absolute", top: "-14px", left: "50%", transform: "translateX(-50%)", fontSize: "9px", fontWeight: 700, color: C.text, whiteSpace: "nowrap", fontFamily: FONT_MONO }}>
              TARGET
            </div>
          </div>
        )}
      </div>
      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "6px" }}>
        <span style={{ fontSize: "12px", color: C.textMuted, fontFamily: FONT_MONO, fontWeight: 600 }}>{Math.round(pct)}%</span>
      </div>
    </div>
  );
}

// ── Score Gauge ───────────────────────────────────────────────────────────────
function ScoreGauge({ score }: { score: number }) {
  const color = scoreColor(score);
  const r = 38; const cx = 50; const cy = 50;
  const circumference = 2 * Math.PI * r;
  const progress = (score / 100) * circumference;
  const label = score >= 75 ? "Strong" : score >= 50 ? "Developing" : "Needs Work";

  return (
    <div style={{
      background: C.panel, border: `1px solid ${C.border}`, borderRadius: "14px",
      padding: "20px 24px", flex: "0 0 200px",
      boxShadow: "0 1px 4px rgba(30,64,175,0.05)",
    }}>
      <div style={{ fontSize: "11px", fontWeight: 700, color: C.textFaint, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: "14px" }}>Latest Score</div>
      <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
        <svg width="84" height="84" viewBox="0 0 100 100" aria-label={`Score: ${score} out of 100`}>
          <circle cx={cx} cy={cy} r={r} fill="none" stroke={C.panelAlt} strokeWidth="9"/>
          <circle cx={cx} cy={cy} r={r} fill="none" stroke={color} strokeWidth="9"
            strokeDasharray={`${progress} ${circumference}`} strokeLinecap="round"
            transform={`rotate(-90 ${cx} ${cy})`} style={{ transition: "stroke-dasharray 0.7s ease" }}/>
          <text x={cx} y={cy} textAnchor="middle" dominantBaseline="middle"
            fill={color} fontSize="22" fontWeight="700" fontFamily={FONT_MONO}>{score}</text>
          <text x={cx} y={cy + 14} textAnchor="middle" dominantBaseline="middle"
            fill={C.textFaint} fontSize="9" fontFamily={FONT_SANS}>/100</text>
        </svg>
        <div>
          <div style={{ fontSize: "13px", fontWeight: 700, color, marginBottom: "3px" }}>{label}</div>
          <div style={{ fontSize: "11px", color: C.textMuted, lineHeight: 1.5 }}>Investability<br />score</div>
        </div>
      </div>
    </div>
  );
}

// ── Pipeline Funnel (Recharts) ────────────────────────────────────────────────
const FUNNEL_STAGES = [
  { key: "researching",       label: "Researching",    fill: "#1E40AF" },
  { key: "targeted",          label: "Targeted",       fill: "#2563EB" },
  { key: "reached_out",       label: "Reached Out",    fill: "#3B82F6" },
  { key: "replied",           label: "Replied",        fill: "#60A5FA" },
  { key: "meeting_scheduled", label: "Meetings",       fill: "#93C5FD" },
  { key: "meeting_completed", label: "Met",            fill: "#6EE7B7" },
  { key: "due_diligence",     label: "Diligence",      fill: "#34D399" },
  { key: "term_sheet",        label: "Term Sheet",     fill: "#10B981" },
  { key: "committed",         label: "Committed",      fill: "#059669" },
];

function PipelineFunnelChart({ counts }: { counts: Record<string, number> }) {
  const data = FUNNEL_STAGES
    .map(s => ({ ...s, value: counts[s.key] ?? 0 }))
    .filter(s => s.value > 0);

  const total = Object.values(counts).reduce((a, b) => a + b, 0);

  return (
    <div style={{
      background: C.panel, border: `1px solid ${C.border}`, borderRadius: "14px",
      padding: "20px 24px", flex: 1, minWidth: "280px",
      boxShadow: "0 1px 4px rgba(30,64,175,0.05)",
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
        <span style={{ fontSize: "11px", fontWeight: 700, color: C.textFaint, textTransform: "uppercase", letterSpacing: "0.07em" }}>Pipeline Funnel</span>
        <a href="/crm/pipeline" style={{ fontSize: "12px", color: C.secondary, fontWeight: 600, transition: "color 0.15s" }}
          onMouseOver={e => (e.currentTarget.style.color = C.primary)}
          onMouseOut={e => (e.currentTarget.style.color = C.secondary)}>
          View all →
        </a>
      </div>
      {total === 0 ? (
        <div style={{ textAlign: "center", padding: "24px 0" }}>
          <p style={{ fontSize: "13px", color: C.textFaint }}>No investors in pipeline yet.</p>
          <a href="/crm/pipeline" style={{ fontSize: "13px", color: C.secondary, fontWeight: 600 }}>Add investors →</a>
        </div>
      ) : (
        <>
          <ResponsiveContainer width="100%" height={data.length * 28 + 20}>
            <FunnelChart>
              <Tooltip
                contentStyle={{ background: C.panel, border: `1px solid ${C.border}`, borderRadius: "8px", fontSize: "12px", fontFamily: FONT_SANS, color: C.text, boxShadow: "0 2px 8px rgba(30,64,175,0.1)" }}
                formatter={(value, _name, entry) => [`${value ?? 0} investors`, (entry as { payload?: { label?: string } })?.payload?.label ?? ""]}
              />
              <Funnel dataKey="value" data={data} isAnimationActive>
                <LabelList
                  position="right"
                  content={({ value, x, y, width, height, index }) => {
                    const item = data[index as number];
                    const prev = index! > 0 ? data[(index as number) - 1].value : null;
                    const convPct = prev ? Math.round((item.value / prev) * 100) : null;
                    const cx = (x as number) + (width as number) + 8;
                    const cy = (y as number) + (height as number) / 2;
                    return (
                      <g>
                        <text x={cx} y={cy - 5} fontSize={11} fontFamily={FONT_SANS} fill={C.text} fontWeight={600}>{item.label}</text>
                        <text x={cx} y={cy + 8} fontSize={10} fontFamily={FONT_MONO} fill={C.textMuted}>
                          {value}{convPct !== null ? ` · ${convPct}%` : ""}
                        </text>
                      </g>
                    );
                  }}
                />
              </Funnel>
            </FunnelChart>
          </ResponsiveContainer>
          <div style={{ fontSize: "11px", color: C.textFaint, textAlign: "right", marginTop: "4px", fontFamily: FONT_MONO }}>{total} total</div>
        </>
      )}
    </div>
  );
}

// ── Icons ─────────────────────────────────────────────────────────────────────
function IconGrid() {
  return <svg width="15" height="15" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0 }}>
    <rect x="1" y="1" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.4"/>
    <rect x="9" y="1" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.4"/>
    <rect x="1" y="9" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.4"/>
    <rect x="9" y="9" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.4"/>
  </svg>;
}
function IconUpload() {
  return <svg width="15" height="15" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0 }}>
    <path d="M8 10V3M5 6l3-3 3 3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M2 12v1a1 1 0 001 1h10a1 1 0 001-1v-1" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
  </svg>;
}
function IconUploadLg() {
  return <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
    <path d="M20 26V12M13 18l7-7 7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M6 30v2a2 2 0 002 2h24a2 2 0 002-2v-2" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
  </svg>;
}
function IconPipeline() {
  return <svg width="15" height="15" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0 }}>
    <path d="M2 4h12M4 8h8M6 12h4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
  </svg>;
}
function IconFolder() {
  return <svg width="15" height="15" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0 }}>
    <path d="M1 4a1 1 0 011-1h4l2 2h6a1 1 0 011 1v6a1 1 0 01-1 1H2a1 1 0 01-1-1V4z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/>
  </svg>;
}
function IconDoc() {
  return <svg width="15" height="15" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0 }}>
    <rect x="3" y="1" width="10" height="14" rx="1.5" stroke="currentColor" strokeWidth="1.4"/>
    <path d="M6 5h4M6 8h4M6 11h2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
  </svg>;
}
function IconChart() {
  return <svg width="15" height="15" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0 }}>
    <path d="M2 13V8M6 13V5M10 13V9M14 13V3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
  </svg>;
}
function IconSettings() {
  return <svg width="15" height="15" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0 }}>
    <circle cx="8" cy="8" r="2.5" stroke="currentColor" strokeWidth="1.4"/>
    <path d="M8 1v2M8 13v2M1 8h2M13 8h2M3.05 3.05l1.42 1.42M11.53 11.53l1.42 1.42M3.05 12.95l1.42-1.42M11.53 4.47l1.42-1.42" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
  </svg>;
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function scoreColor(score: number): string {
  if (score >= 75) return C.success;
  if (score >= 50) return C.warning;
  return C.danger;
}

function fmtAmount(n: number): string {
  if (n >= 1_000_000) return `£${(n / 1_000_000).toFixed(n % 1_000_000 === 0 ? 0 : 1)}M`;
  if (n >= 1_000) return `£${Math.round(n / 1_000)}k`;
  return `£${n.toLocaleString()}`;
}

const labelStyle: React.CSSProperties = {
  display: "block", fontSize: "12px", fontWeight: 500,
  color: C.textMuted, marginBottom: "5px", fontFamily: FONT_SANS,
};
const inputStyle: React.CSSProperties = {
  width: "100%", padding: "9px 12px",
  background: C.panelAlt, border: `1px solid ${C.border}`,
  borderRadius: "7px", color: C.text, fontSize: "14px",
  outline: "none", appearance: "none", fontFamily: FONT_SANS,
};
