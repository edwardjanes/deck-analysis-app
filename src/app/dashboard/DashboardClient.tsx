"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabaseBrowser";

const GREEN = "#03fb83";
const LOGO = "https://raw.githubusercontent.com/edwardjanes/source-capital/0147b27fad891686f67559992e43319411f07ba4/logo.png";

const COUNTRIES = [
  "Australia", "Austria", "Belgium", "Brazil", "Canada", "Chile", "China",
  "Colombia", "Czech Republic", "Denmark", "Egypt", "Finland", "France",
  "Germany", "Ghana", "Greece", "Hong Kong", "Hungary", "India", "Indonesia",
  "Ireland", "Israel", "Italy", "Japan", "Kenya", "Malaysia", "Mexico",
  "Netherlands", "New Zealand", "Nigeria", "Norway", "Pakistan", "Philippines",
  "Poland", "Portugal", "Romania", "Saudi Arabia", "Singapore", "South Africa",
  "South Korea", "Spain", "Sweden", "Switzerland", "Taiwan", "Thailand",
  "Turkey", "Ukraine", "United Arab Emirates", "United Kingdom", "United States",
  "Vietnam", "Other",
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

export default function DashboardClient({ firstName, plan, analysesUsed, analyses, userId, userEmail, crmAccess, pipelineStageCounts, raiseCommitted, raiseTarget }: Props) {
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
    if (dropped?.type === "application/pdf") {
      setFile(dropped);
      setError("");
    } else {
      setError("Please upload a PDF file.");
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) { setError("Please upload your pitch deck PDF."); return; }
    if (!country) { setError("Please select your country."); return; }
    if (file.size > 20 * 1024 * 1024) { setError("File must be under 20MB."); return; }

    setSubmitting(true);
    setError("");

    const fd = new FormData();
    fd.append("firstName", firstName);
    fd.append("lastName", "");
    fd.append("email", userEmail);
    fd.append("businessName", businessName);
    fd.append("website", website);
    fd.append("country", country);
    fd.append("deck", file);
    fd.append("userId", userId);

    try {
      const res = await fetch("/api/submit", { method: "POST", body: fd });
      const data = await res.json();
      if (res.status === 403 && data.error === "free_limit_reached") {
        setLimitReached({ existingId: data.existingSubmissionId });
        setShowUploadForm(false);
        setSubmitting(false);
        return;
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
    <div style={{ minHeight: "100vh", background: "#0A0A0A", color: "#fff", fontFamily: "inherit" }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        * { box-sizing: border-box; }
        a { text-decoration: none; }
      `}</style>

      {/* Nav */}
      <nav style={{ borderBottom: "1px solid #1A1A1A", padding: "0 32px", height: "60px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <img src={LOGO} alt="Source Capital" style={{ height: "28px", width: "auto" }} />
        <div style={{ display: "flex", alignItems: "center", gap: "32px" }}>
          {[
            { label: "Dashboard", href: "/dashboard" },
            { label: "Investor CRM", href: "/crm" },
            { label: "Pricing", href: "https://sourcecapital.co.uk/pricing" },
            { label: "About", href: "https://sourcecapital.co.uk/about" },
            { label: "Contact", href: "https://sourcecapital.co.uk/contact" },
          ].map(({ label, href }) => (
            <a key={label} href={href} style={{ fontSize: "16px", color: "#9CA3AF", fontWeight: 500 }}
              onMouseOver={e => (e.currentTarget.style.color = "#fff")}
              onMouseOut={e => (e.currentTarget.style.color = "#9CA3AF")}>
              {label}
            </a>
          ))}
          <button
            onClick={handleLogout}
            style={{ fontSize: "16px", color: "#9CA3AF", background: "none", border: "none", cursor: "pointer", fontWeight: 500, padding: 0 }}
            onMouseOver={e => (e.currentTarget.style.color = "#fff")}
            onMouseOut={e => (e.currentTarget.style.color = "#9CA3AF")}
          >
            Logout
          </button>
        </div>
      </nav>

      {/* Body: sidebar + main */}
      <div style={{ display: "flex", minHeight: "calc(100vh - 60px)" }}>

        {/* Sidebar */}
        <aside style={{
          width: "220px", flexShrink: 0,
          borderRight: "1px solid #1A1A1A",
          padding: "32px 16px",
          display: "flex", flexDirection: "column", gap: "4px",
          position: "sticky", top: "60px", height: "calc(100vh - 60px)", overflowY: "auto",
        }}>
          <SidebarItem href="/dashboard" icon={<IconGrid />} label="Dashboard" active />
          <SidebarItem href="#" icon={<IconUpload />} label="Analyse Deck" onClick={() => setShowUploadForm(true)} />
          <SidebarItem href="/crm/pipeline" icon={<IconPipeline />} label="Investor Pipeline" />
          <SidebarItem href="/crm/projects" icon={<IconFolder />} label="Raise Projects" />
          <div style={{ height: "1px", background: "#1A1A1A", margin: "8px 0" }} />
          <SidebarItem href="#" icon={<IconDoc />} label="Documents" disabled />
          <SidebarItem href="#" icon={<IconChart />} label="Analytics" disabled />
          <SidebarItem href="#" icon={<IconSettings />} label="Settings" disabled />
        </aside>

        {/* Main content */}
        <div style={{ flex: 1, minWidth: 0, padding: "40px 40px 60px" }}>

          {/* Header row */}
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "32px", flexWrap: "wrap", gap: "16px" }}>
            <div>
              <h1 style={{ fontSize: "26px", fontWeight: 800, marginBottom: "4px" }}>
                Welcome back, {firstName}
              </h1>
              <p style={{ fontSize: "14px", color: "#6B7280" }}>
                {isPro ? "You have unlimited analyses." : `${Math.max(0, FREE_LIMIT - analysesUsed)} free ${FREE_LIMIT - analysesUsed === 1 ? "analysis" : "analyses"} remaining.`}
              </p>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div style={{
                padding: "6px 14px", borderRadius: "20px", fontSize: "12px", fontWeight: 700,
                background: isPro ? "rgba(3,251,131,0.12)" : "rgba(107,114,128,0.15)",
                color: isPro ? GREEN : "#9CA3AF",
                border: `1px solid ${isPro ? "rgba(3,251,131,0.3)" : "#242424"}`,
              }}>
                {isPro ? "Pro Plan" : "Free Plan"}
              </div>
              {!isPro && (
                <a href={whopUrl} target="_blank" rel="noopener noreferrer"
                  style={{ padding: "8px 18px", borderRadius: "8px", background: GREEN, color: "#000", fontSize: "15px", fontWeight: 700 }}>
                  Upgrade to Pro
                </a>
              )}
            </div>
          </div>

          {/* Stats row */}
          <StatsRow analyses={analyses} crmAccess={crmAccess} pipelineStageCounts={pipelineStageCounts} raiseCommitted={raiseCommitted} raiseTarget={raiseTarget} />

        {/* Upload area */}
        <div style={{ background: "#161616", border: `1px solid ${limitReached ? "rgba(3,251,131,0.2)" : "#242424"}`, borderRadius: "16px", padding: "32px", marginBottom: "32px" }}>
          {limitReached ? (
            <div style={{ textAlign: "center", padding: "16px 0" }}>
              <div style={{ width: "48px", height: "48px", borderRadius: "12px", background: "rgba(3,251,131,0.1)", border: "1px solid rgba(3,251,131,0.25)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
                <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                  <rect x="3" y="10" width="16" height="11" rx="2" stroke={GREEN} strokeWidth="1.6"/>
                  <path d="M7 10V7a4 4 0 018 0v3" stroke={GREEN} strokeWidth="1.6" strokeLinecap="round"/>
                </svg>
              </div>
              <h3 style={{ fontSize: "17px", fontWeight: 700, marginBottom: "8px" }}>Free submission used</h3>
              <p style={{ fontSize: "16px", color: "#6B7280", marginBottom: "6px", maxWidth: "380px", margin: "0 auto 6px" }}>
                You have already submitted a pitch deck. Free accounts are limited to one submission.
              </p>
              <p style={{ fontSize: "16px", color: "#6B7280", marginBottom: "24px", maxWidth: "380px", margin: "0 auto 24px" }}>
                Upgrade to Pro for unlimited analyses.
              </p>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "12px", flexWrap: "wrap" }}>
                <a href={limitReached.existingId ? `/investment-score/results/${limitReached.existingId}` : "/dashboard"}
                  style={{ padding: "10px 20px", borderRadius: "8px", border: "1px solid #2A2A2A", background: "transparent", color: "#9CA3AF", fontSize: "15px", fontWeight: 600, textDecoration: "none" }}>
                  View existing analysis
                </a>
                <a href={whopUrl} target="_blank" rel="noopener noreferrer"
                  style={{ padding: "10px 22px", borderRadius: "8px", background: GREEN, color: "#000", fontSize: "15px", fontWeight: 700, textDecoration: "none" }}>
                  Upgrade to Pro — unlimited analyses
                </a>
              </div>
            </div>
          ) : !showUploadForm ? (
            <div
              onClick={() => canAnalyse && setShowUploadForm(true)}
              onDragOver={(e) => { e.preventDefault(); if (canAnalyse) setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => {
                if (!canAnalyse) return;
                e.preventDefault();
                setDragOver(false);
                const dropped = e.dataTransfer.files[0];
                if (dropped?.type === "application/pdf") {
                  setFile(dropped);
                  setShowUploadForm(true);
                }
              }}
              style={{
                border: `2px dashed ${dragOver ? GREEN : "#2A2A2A"}`,
                borderRadius: "12px",
                padding: "48px 32px",
                textAlign: "center",
                cursor: canAnalyse ? "pointer" : "default",
                background: dragOver ? "rgba(3,251,131,0.04)" : "transparent",
                transition: "all 0.2s",
              }}
            >
              <div style={{ fontSize: "36px", marginBottom: "12px" }}>
                {canAnalyse ? "📁" : "🔒"}
              </div>
              {canAnalyse ? (
                <>
                  <p style={{ fontSize: "16px", fontWeight: 600, marginBottom: "6px" }}>
                    <span style={{ color: GREEN }}>Click to upload</span> or drag and drop
                  </p>
                  <p style={{ fontSize: "15px", color: "#6B7280" }}>Drop your pitch deck here · PDF only · Max 20MB</p>
                </>
              ) : (
                <>
                  <p style={{ fontSize: "16px", fontWeight: 600, marginBottom: "8px" }}>Free analyses used</p>
                  <p style={{ fontSize: "15px", color: "#6B7280", marginBottom: "16px" }}>Upgrade to Pro for unlimited analyses</p>
                  <a href={whopUrl} target="_blank" rel="noopener noreferrer"
                    style={{ display: "inline-block", padding: "10px 24px", borderRadius: "8px", background: GREEN, color: "#000", fontSize: "15px", fontWeight: 700 }}>
                    Upgrade to Pro
                  </a>
                </>
              )}
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "24px" }}>
                <h2 style={{ fontSize: "16px", fontWeight: 700 }}>New Analysis</h2>
                <button type="button" onClick={() => { setShowUploadForm(false); setFile(null); setError(""); }}
                  style={{ background: "none", border: "none", color: "#6B7280", cursor: "pointer", fontSize: "20px", lineHeight: 1 }}>
                  ×
                </button>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" }}>
                <div>
                  <label style={labelStyle}>Business name *</label>
                  <input style={inputStyle} type="text" required value={businessName} onChange={e => setBusinessName(e.target.value)} placeholder="Acme Inc." />
                </div>
                <div>
                  <label style={labelStyle}>Website</label>
                  <input style={inputStyle} type="url" value={website} onChange={e => setWebsite(e.target.value)} placeholder="https://acme.com" />
                </div>
              </div>

              <div style={{ marginBottom: "16px" }}>
                <label style={labelStyle}>Country *</label>
                <select required value={country} onChange={e => setCountry(e.target.value)}
                  style={{ ...inputStyle, color: country ? "#fff" : "#6B7280" }}>
                  <option value="" disabled>Select your country</option>
                  {COUNTRIES.map(c => <option key={c} value={c} style={{ background: "#161616" }}>{c}</option>)}
                </select>
              </div>

              <div style={{ marginBottom: "16px" }}>
                <label style={labelStyle}>Pitch deck (PDF, max 20MB) *</label>
                <div
                  onClick={() => fileRef.current?.click()}
                  onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={handleFileDrop}
                  style={{
                    border: `2px dashed ${dragOver ? GREEN : file ? "rgba(3,251,131,0.4)" : "#2A2A2A"}`,
                    borderRadius: "10px", padding: "24px", textAlign: "center", cursor: "pointer",
                    background: file ? "rgba(3,251,131,0.04)" : "transparent", transition: "all 0.2s",
                  }}
                >
                  {file ? (
                    <>
                      <div style={{ fontSize: "20px", marginBottom: "6px" }}>📄</div>
                      <p style={{ fontSize: "16px", fontWeight: 600, color: GREEN }}>{file.name}</p>
                      <p style={{ fontSize: "12px", color: "#6B7280", marginTop: "4px" }}>{(file.size / 1024 / 1024).toFixed(1)} MB · click to replace</p>
                    </>
                  ) : (
                    <>
                      <div style={{ fontSize: "24px", marginBottom: "8px" }}>☁️</div>
                      <p style={{ fontSize: "15px", color: "#9CA3AF" }}><span style={{ color: GREEN, fontWeight: 600 }}>Click to upload</span> or drag and drop</p>
                    </>
                  )}
                </div>
                <input ref={fileRef} type="file" accept="application/pdf" onChange={e => { const f = e.target.files?.[0]; if (f?.type === "application/pdf") { setFile(f); setError(""); } }} style={{ display: "none" }} />
              </div>

              {error && (
                <p style={{ fontSize: "15px", color: "#EF4444", marginBottom: "16px", padding: "10px 12px", background: "rgba(239,68,68,0.08)", borderRadius: "8px", border: "1px solid rgba(239,68,68,0.2)" }}>
                  {error}
                </p>
              )}

              <button type="submit" disabled={submitting} style={{
                width: "100%", padding: "13px", background: submitting ? "#2A2A2A" : GREEN,
                border: "none", borderRadius: "10px", color: submitting ? "#6B7280" : "#000",
                fontSize: "16px", fontWeight: 700, cursor: submitting ? "not-allowed" : "pointer",
                display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
              }}>
                {submitting ? (
                  <><span style={{ width: "16px", height: "16px", border: "2px solid #444", borderTopColor: GREEN, borderRadius: "50%", animation: "spin 0.7s linear infinite", display: "inline-block" }} />Uploading...</>
                ) : "Analyse My Deck"}
              </button>
            </form>
          )}
        </div>

        {/* Analysis history */}
        <div>
          <h2 style={{ fontSize: "18px", fontWeight: 700, marginBottom: "16px" }}>Analysis History</h2>
          {analyses.length === 0 ? (
            <div style={{ background: "#161616", border: "1px solid #242424", borderRadius: "12px", padding: "40px", textAlign: "center" }}>
              <p style={{ fontSize: "16px", color: "#6B7280" }}>No analyses yet. Upload your first deck to get started.</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {analyses.map((a) => {
                const date = new Date(a.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
                const slideCount = a.analysis_json?.slideCount;
                const isComplete = a.status === "complete";
                return (
                  <a key={a.id} href={isComplete ? `/investment-score/results/${a.id}` : `/investment-score/analysing/${a.id}`}
                    style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "#161616", border: "1px solid #242424", borderRadius: "12px", padding: "18px 20px", textDecoration: "none", color: "inherit", transition: "border-color 0.15s" }}
                    onMouseOver={e => (e.currentTarget.style.borderColor = "#333")}
                    onMouseOut={e => (e.currentTarget.style.borderColor = "#242424")}
                  >
                    <div>
                      <p style={{ fontSize: "15px", fontWeight: 600, marginBottom: "3px" }}>{a.business_name}</p>
                      <p style={{ fontSize: "12px", color: "#6B7280" }}>
                        {date}
                        {slideCount ? ` · ${slideCount} slides` : ""}
                      </p>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                      {isComplete && a.score !== null ? (
                        <div style={{ textAlign: "right" }}>
                          <span style={{ fontSize: "22px", fontWeight: 800, color: scoreColor(a.score) }}>{a.score}</span>
                          <span style={{ fontSize: "12px", color: "#6B7280" }}>/100</span>
                        </div>
                      ) : (
                        <span style={{
                          fontSize: "12px", fontWeight: 600, padding: "4px 10px", borderRadius: "20px",
                          background: a.status === "error" ? "rgba(239,68,68,0.12)" : "rgba(3,251,131,0.1)",
                          color: a.status === "error" ? "#EF4444" : GREEN,
                          border: `1px solid ${a.status === "error" ? "rgba(239,68,68,0.3)" : "rgba(3,251,131,0.25)"}`,
                        }}>
                          {a.status === "error" ? "Error" : "Analysing..."}
                        </span>
                      )}
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ color: "#6B7280", flexShrink: 0 }}>
                        <path d="M6 12l4-4-4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                  </a>
                );
              })}
            </div>
          )}
        </div>
        </div>{/* end main content */}
      </div>{/* end body */}
    </div>
  );
}

// ── Sidebar ───────────────────────────────────────────────────────────────────
function SidebarItem({ href, icon, label, active, disabled, onClick }: {
  href: string; icon: React.ReactNode; label: string;
  active?: boolean; disabled?: boolean; onClick?: () => void;
}) {
  const style: React.CSSProperties = {
    display: "flex", alignItems: "center", gap: "10px",
    padding: "9px 12px", borderRadius: "8px",
    fontSize: "13px", fontWeight: active ? 600 : 400,
    color: disabled ? "#374151" : active ? "#F8FAFC" : "#9CA3AF",
    background: active ? "#161616" : "transparent",
    border: active ? "1px solid #242424" : "1px solid transparent",
    cursor: disabled ? "default" : "pointer",
    textDecoration: "none",
    transition: "all 0.15s",
    width: "100%", boxSizing: "border-box",
  };

  if (disabled) {
    return (
      <div style={style}>
        {icon}
        <span style={{ flex: 1 }}>{label}</span>
        <span style={{ fontSize: "10px", color: "#374151", background: "#161616", border: "1px solid #1F2937", padding: "1px 6px", borderRadius: "4px" }}>Soon</span>
      </div>
    );
  }

  if (onClick) {
    return (
      <button onClick={onClick} style={{ ...style, border: "1px solid transparent" }}
        onMouseEnter={e => { e.currentTarget.style.background = "#111"; e.currentTarget.style.color = "#F8FAFC"; }}
        onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#9CA3AF"; }}>
        {icon}<span>{label}</span>
      </button>
    );
  }

  return (
    <a href={href} style={style}
      onMouseEnter={e => { if (!active) { e.currentTarget.style.background = "#111"; e.currentTarget.style.color = "#F8FAFC"; } }}
      onMouseLeave={e => { if (!active) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#9CA3AF"; } }}>
      {icon}<span>{label}</span>
    </a>
  );
}

function IconGrid() {
  return <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0 }}>
    <rect x="1" y="1" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.4"/>
    <rect x="9" y="1" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.4"/>
    <rect x="1" y="9" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.4"/>
    <rect x="9" y="9" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.4"/>
  </svg>;
}
function IconUpload() {
  return <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0 }}>
    <path d="M8 10V3M5 6l3-3 3 3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M2 12v1a1 1 0 001 1h10a1 1 0 001-1v-1" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
  </svg>;
}
function IconPipeline() {
  return <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0 }}>
    <path d="M2 4h12M4 8h8M6 12h4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
  </svg>;
}
function IconFolder() {
  return <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0 }}>
    <path d="M1 4a1 1 0 011-1h4l2 2h6a1 1 0 011 1v6a1 1 0 01-1 1H2a1 1 0 01-1-1V4z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/>
  </svg>;
}
function IconDoc() {
  return <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0 }}>
    <rect x="3" y="1" width="10" height="14" rx="1.5" stroke="currentColor" strokeWidth="1.4"/>
    <path d="M6 5h4M6 8h4M6 11h2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
  </svg>;
}
function IconChart() {
  return <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0 }}>
    <path d="M2 13V8M6 13V5M10 13V9M14 13V3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
  </svg>;
}
function IconSettings() {
  return <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0 }}>
    <circle cx="8" cy="8" r="2.5" stroke="currentColor" strokeWidth="1.4"/>
    <path d="M8 1v2M8 13v2M1 8h2M13 8h2M3.05 3.05l1.42 1.42M11.53 11.53l1.42 1.42M3.05 12.95l1.42-1.42M11.53 4.47l1.42-1.42" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
  </svg>;
}

function fmtAmount(n: number): string {
  if (n >= 1_000_000) return `£${(n / 1_000_000).toFixed(n % 1_000_000 === 0 ? 0 : 1)}M`;
  if (n >= 1_000) return `£${Math.round(n / 1_000)}k`;
  return `£${n.toLocaleString()}`;
}

function RaiseProgressBar({ committed, target }: { committed: number; target: number }) {
  if (target === 0 && committed === 0) return null;
  const pct = target > 0 ? Math.min((committed / target) * 100, 100) : 0;
  const remaining = Math.max(target - committed, 0);
  const color = pct >= 100 ? GREEN : pct >= 60 ? "#4ADE80" : pct >= 30 ? "#FACC15" : GREEN;

  return (
    <div style={{ background: "#161616", border: "1px solid #242424", borderRadius: "16px", padding: "20px 28px", marginBottom: "16px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px", flexWrap: "wrap", gap: "8px" }}>
        <div style={{ fontSize: "12px", fontWeight: 600, color: "#6B7280", textTransform: "uppercase", letterSpacing: "0.06em" }}>Raise Progress</div>
        <div style={{ display: "flex", gap: "20px", alignItems: "center" }}>
          <span style={{ fontSize: "13px", color: "#9CA3AF" }}>
            <span style={{ color: color, fontWeight: 700, fontSize: "15px" }}>{fmtAmount(committed)}</span>
            {target > 0 && <span style={{ color: "#4B5563" }}> committed of {fmtAmount(target)} target</span>}
            {target === 0 && <span style={{ color: "#4B5563" }}> committed</span>}
          </span>
          {target > 0 && remaining > 0 && (
            <span style={{ fontSize: "12px", color: "#4B5563" }}>{fmtAmount(remaining)} to go</span>
          )}
          {pct >= 100 && (
            <span style={{ fontSize: "12px", fontWeight: 700, color: GREEN, background: "rgba(3,251,131,0.1)", border: "1px solid rgba(3,251,131,0.3)", padding: "2px 10px", borderRadius: "20px" }}>Target reached!</span>
          )}
        </div>
      </div>
      <div style={{ height: "10px", background: "#1F2937", borderRadius: "999px", overflow: "hidden" }}>
        <div style={{
          height: "100%",
          width: `${pct}%`,
          borderRadius: "999px",
          background: `linear-gradient(90deg, ${color}99, ${color})`,
          transition: "width 0.6s ease",
          boxShadow: `0 0 8px ${color}66`,
        }} />
      </div>
      {target > 0 && (
        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "6px" }}>
          <span style={{ fontSize: "12px", color: "#4B5563", fontWeight: 600 }}>{Math.round(pct)}%</span>
        </div>
      )}
    </div>
  );
}

// ── Funnel stages (active only, no 'passed') ─────────────────────────────────
const FUNNEL_STAGES: { key: string; label: string; color: string }[] = [
  { key: "researching",       label: "Researching",    color: "#9CA3AF" },
  { key: "targeted",          label: "Targeted",       color: "#60A5FA" },
  { key: "reached_out",       label: "Reached Out",    color: "#A78BFA" },
  { key: "replied",           label: "Replied",        color: "#FB923C" },
  { key: "meeting_scheduled", label: "Meeting Sched.", color: "#FACC15" },
  { key: "meeting_completed", label: "Meeting Done",   color: "#4ADE80" },
  { key: "due_diligence",     label: "Due Diligence",  color: "#22D3EE" },
  { key: "term_sheet",        label: "Term Sheet",     color: "#03fb83" },
  { key: "committed",         label: "Committed",      color: "#03fb83" },
];

function ScoreGauge({ score }: { score: number }) {
  const color = scoreColor(score);
  const r = 38;
  const cx = 50, cy = 50;
  const circumference = 2 * Math.PI * r;
  const progress = (score / 100) * circumference;

  return (
    <div style={{ background: "#161616", border: "1px solid #242424", borderRadius: "16px", padding: "24px 28px", flex: "0 0 220px" }}>
      <div style={{ fontSize: "12px", fontWeight: 600, color: "#6B7280", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "16px" }}>Latest Score</div>
      <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
        <svg width="90" height="90" viewBox="0 0 100 100">
          <circle cx={cx} cy={cy} r={r} fill="none" stroke="#1F2937" strokeWidth="8" />
          <circle
            cx={cx} cy={cy} r={r} fill="none"
            stroke={color} strokeWidth="8"
            strokeDasharray={`${progress} ${circumference}`}
            strokeLinecap="round"
            transform={`rotate(-90 ${cx} ${cy})`}
            style={{ transition: "stroke-dasharray 0.6s ease" }}
          />
          <text x={cx} y={cy + 1} textAnchor="middle" dominantBaseline="middle" fill={color} fontSize="20" fontWeight="800">{score}</text>
          <text x={cx} y={cy + 16} textAnchor="middle" dominantBaseline="middle" fill="#4B5563" fontSize="9">/100</text>
        </svg>
        <div>
          <div style={{ fontSize: "13px", fontWeight: 600, color: color, marginBottom: "4px" }}>
            {score >= 75 ? "Strong" : score >= 50 ? "Developing" : "Needs Work"}
          </div>
          <div style={{ fontSize: "12px", color: "#6B7280", lineHeight: 1.5 }}>
            Investability<br />score
          </div>
        </div>
      </div>
    </div>
  );
}

function PipelineFunnel({ counts }: { counts: Record<string, number> }) {
  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  const active = FUNNEL_STAGES.filter(s => (counts[s.key] ?? 0) > 0);
  const maxCount = Math.max(...active.map(s => counts[s.key] ?? 0), 1);

  return (
    <div style={{ background: "#161616", border: "1px solid #242424", borderRadius: "16px", padding: "24px 28px", flex: 1, minWidth: 0 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
        <div style={{ fontSize: "12px", fontWeight: 600, color: "#6B7280", textTransform: "uppercase", letterSpacing: "0.06em" }}>Pipeline Funnel</div>
        <a href="/crm/pipeline" style={{ fontSize: "12px", color: GREEN, textDecoration: "none", fontWeight: 600 }}>View pipeline →</a>
      </div>
      {total === 0 ? (
        <div style={{ textAlign: "center", padding: "20px 0" }}>
          <p style={{ fontSize: "13px", color: "#4B5563" }}>No investors in pipeline yet.</p>
          <a href="/crm/pipeline" style={{ fontSize: "13px", color: GREEN, textDecoration: "none" }}>Add investors →</a>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          {active.map(stage => {
            const count = counts[stage.key] ?? 0;
            const pct = (count / maxCount) * 100;
            return (
              <div key={stage.key} style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div style={{ width: "100px", fontSize: "11px", color: "#6B7280", flexShrink: 0, textAlign: "right" }}>{stage.label}</div>
                <div style={{ flex: 1, background: "#1F2937", borderRadius: "4px", height: "18px", overflow: "hidden" }}>
                  <div style={{
                    height: "100%", borderRadius: "4px",
                    width: `${pct}%`,
                    background: `${stage.color}33`,
                    border: `1px solid ${stage.color}66`,
                    transition: "width 0.4s ease",
                    display: "flex", alignItems: "center", justifyContent: "flex-end", paddingRight: "6px",
                  }}>
                    <span style={{ fontSize: "10px", fontWeight: 700, color: stage.color }}>{count}</span>
                  </div>
                </div>
              </div>
            );
          })}
          <div style={{ marginTop: "6px", fontSize: "11px", color: "#4B5563", textAlign: "right" }}>{total} total investors</div>
        </div>
      )}
    </div>
  );
}

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
      {showProgress && <RaiseProgressBar committed={raiseCommitted} target={raiseTarget} />}
      <div style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
        {latestScore !== null && <ScoreGauge score={latestScore} />}
        {crmAccess && <PipelineFunnel counts={pipelineStageCounts} />}
      </div>
    </div>
  );
}

function scoreColor(score: number): string {
  if (score >= 75) return "#03fb83";
  if (score >= 50) return "#FBBF24";
  return "#EF4444";
}

const labelStyle: React.CSSProperties = {
  display: "block", fontSize: "12px", fontWeight: 500, color: "#9CA3AF", marginBottom: "6px",
};

const inputStyle: React.CSSProperties = {
  width: "100%", padding: "10px 14px", background: "#111", border: "1px solid #2A2A2A",
  borderRadius: "8px", color: "#fff", fontSize: "16px", outline: "none", appearance: "none",
};
