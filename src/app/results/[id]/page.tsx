"use client";

import { useEffect, useState, Suspense } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { DeckAnalysis, DeckDimension, SlideAssessment } from "@/lib/deckPrompt";

interface SubmissionResult {
  id: string;
  business_name: string;
  status: string;
  score: number;
  verdict: string;
  verdict_type: "pass" | "review" | "flag";
  most_damaging_issue: string;
  best_asset: string;
  analysis_summary: string;
  analysis_json: DeckAnalysis;
  error_message?: string;
  paid: boolean;
}

function checkoutUrl(submissionId: string): string {
  const productId = process.env.NEXT_PUBLIC_WHOP_PRODUCT_ID ?? "prod_KAefMblSDnMxD";
  const params = new URLSearchParams({
    "metadata[submission_id]": submissionId,
    redirect_url: `${window.location.origin}/results/${submissionId}?unlocked=1`,
  });
  return `https://whop.com/checkout/${productId}/?${params.toString()}`;
}

const ORANGE = "#F97316";
const CARD_BG = "#161616";
const CARD_BORDER = "#242424";
const MUTED = "#6B7280";
const DIM_NAMES = ["Problem","Solution","Market","Business Model","Traction","Team","Financials","Competition"];

// ── Score circle ──────────────────────────────────────────────
function ScoreCircle({ score, animated }: { score: number; animated: boolean }) {
  const r = 52;
  const circ = 2 * Math.PI * r;
  const offset = animated ? circ - (score / 10) * circ : circ;
  return (
    <div style={{ position: "relative", width: "128px", height: "128px", flexShrink: 0 }}>
      <svg width="128" height="128" style={{ transform: "rotate(-90deg)" }}>
        <circle cx="64" cy="64" r={r} fill="none" stroke="#242424" strokeWidth="10" />
        <circle cx="64" cy="64" r={r} fill="none" stroke={ORANGE} strokeWidth="10" strokeLinecap="round"
          strokeDasharray={circ} strokeDashoffset={offset}
          style={{ transition: animated ? "stroke-dashoffset 1.4s cubic-bezier(0.4,0,0.2,1) 0.2s" : "none" }}
        />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        <span style={{ fontSize: "36px", fontWeight: 800, color: "#fff", lineHeight: 1 }}>{score}</span>
        <span style={{ fontSize: "12px", color: MUTED }}>/ 10</span>
      </div>
    </div>
  );
}

// ── Dimension bar ─────────────────────────────────────────────
function DimBar({ name, score, animated, large = false }: { name: string; score: number; animated: boolean; large?: boolean }) {
  const pct = (score / 10) * 100;
  const color = score >= 7 ? "#22C55E" : score >= 5 ? ORANGE : "#EF4444";
  return (
    <div style={{ marginBottom: large ? "0" : "14px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
        <span style={{ fontSize: large ? "15px" : "13px", color: "#E5E7EB", fontWeight: large ? 600 : 400 }}>{name}</span>
        <span style={{ fontSize: large ? "15px" : "13px", fontWeight: 700, color }}>{score}/10</span>
      </div>
      <div style={{ height: large ? "8px" : "5px", background: "#242424", borderRadius: "99px", overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${pct}%`, background: color, borderRadius: "99px",
          transition: animated ? "width 1.2s cubic-bezier(0.4,0,0.2,1) 0.3s" : "none" }} />
      </div>
    </div>
  );
}

function slideColor(v: string) {
  switch (v) {
    case "Strong":     return { bg: "rgba(34,197,94,0.1)",  color: "#22C55E", border: "rgba(34,197,94,0.25)" };
    case "Acceptable": return { bg: "rgba(249,115,22,0.1)", color: "#F97316", border: "rgba(249,115,22,0.25)" };
    case "Weak":       return { bg: "rgba(234,179,8,0.1)",  color: "#EAB308", border: "rgba(234,179,8,0.25)" };
    case "Cut":        return { bg: "rgba(239,68,68,0.1)",  color: "#EF4444", border: "rgba(239,68,68,0.25)" };
    default:           return { bg: "rgba(36,36,36,0.6)",   color: MUTED,     border: "#242424" };
  }
}

// ── Tab button ────────────────────────────────────────────────
function Tab({ label, active, locked, onClick }: { label: string; active: boolean; locked?: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} style={{
      padding: "8px 16px", borderRadius: "99px", border: "none",
      background: active ? ORANGE : "#1C1C1C",
      color: active ? "#fff" : locked ? "#3D3D3D" : MUTED,
      fontSize: "13px", fontWeight: active ? 700 : 500,
      cursor: "pointer", whiteSpace: "nowrap", transition: "all 0.15s", flexShrink: 0,
      display: "flex", alignItems: "center", gap: "5px",
    }}>
      {locked && !active && (
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
          <rect x="1.5" y="4.5" width="7" height="5" rx="1" stroke="#3D3D3D" strokeWidth="1.2"/>
          <path d="M3 4.5V3a2 2 0 014 0v1.5" stroke="#3D3D3D" strokeWidth="1.2" strokeLinecap="round"/>
        </svg>
      )}
      {label}
    </button>
  );
}

// ── Content card wrapper ──────────────────────────────────────
function ContentCard({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ background: CARD_BG, border: `1px solid ${CARD_BORDER}`, borderRadius: "16px", padding: "28px" }}>
      {children}
    </div>
  );
}

// ── Locked section wrapper ────────────────────────────────────
function LockedSection({ children, label = "Unlock to reveal", href }: { children: React.ReactNode; label?: string; href: string }) {
  return (
    <div style={{ position: "relative", borderRadius: "16px", overflow: "hidden" }}>
      <div style={{ filter: "blur(6px)", userSelect: "none", pointerEvents: "none", opacity: 0.6 }}>
        {children}
      </div>
      <div style={{
        position: "absolute", inset: 0,
        background: "linear-gradient(to bottom, rgba(10,10,10,0.3) 0%, rgba(10,10,10,0.7) 60%, rgba(10,10,10,0.95) 100%)",
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-end",
        padding: "28px",
      }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: "rgba(249,115,22,0.15)", border: "1px solid rgba(249,115,22,0.3)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 10px" }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <rect x="2.5" y="7" width="11" height="8" rx="1.5" stroke={ORANGE} strokeWidth="1.5"/>
              <path d="M5 7V5a3 3 0 016 0v2" stroke={ORANGE} strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </div>
          <p style={{ fontSize: "13px", fontWeight: 600, color: "#fff", marginBottom: "4px" }}>{label}</p>
          <p style={{ fontSize: "12px", color: MUTED, marginBottom: "14px" }}>Get the full report for $7</p>
          <a href={href} style={{
            display: "inline-flex", alignItems: "center", gap: "6px",
            padding: "9px 20px", background: ORANGE, borderRadius: "8px",
            color: "#fff", fontSize: "13px", fontWeight: 700, textDecoration: "none",
          }}>
            Unlock Full Report
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 6h8M6 2l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </a>
        </div>
      </div>
    </div>
  );
}

// ── BREAKDOWN TAB ─────────────────────────────────────────────
function BreakdownTab({ a, animated, paid, buyHref }: { a: DeckAnalysis; animated: boolean; paid: boolean; buyHref: string }) {
  const dims: DeckDimension[] = a.dimensions ?? [];
  const damagingAndBest = (
    <ContentCard>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
        <div style={{ background: "rgba(239,68,68,0.07)", border: "1px solid rgba(239,68,68,0.18)", borderRadius: "12px", padding: "16px" }}>
          <p style={{ fontSize: "10px", color: "#EF4444", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "8px" }}>Most Damaging Issue</p>
          <p style={{ fontSize: "13px", color: "#D1D5DB", lineHeight: 1.65 }}>{a.mostDamagingIssue}</p>
        </div>
        <div style={{ background: "rgba(34,197,94,0.07)", border: "1px solid rgba(34,197,94,0.18)", borderRadius: "12px", padding: "16px" }}>
          <p style={{ fontSize: "10px", color: "#22C55E", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "8px" }}>Best Asset</p>
          <p style={{ fontSize: "13px", color: "#D1D5DB", lineHeight: 1.65 }}>{a.bestAsset}</p>
        </div>
      </div>
    </ContentCard>
  );
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
      <ContentCard>
        <h2 style={{ fontSize: "15px", fontWeight: 700, color: "#fff", marginBottom: "22px" }}>Dimension Scores</h2>
        {dims.map(d => <DimBar key={d.name} name={d.name} score={d.score} animated={animated} />)}
      </ContentCard>
      {paid ? damagingAndBest : (
        <LockedSection label="Your most damaging issue & best asset" href={buyHref}>
          {damagingAndBest}
        </LockedSection>
      )}
    </div>
  );
}

// ── SUMMARY TAB — LOCKED ──────────────────────────────────────
function SummaryTab({ a, paid, buyHref }: { a: DeckAnalysis; paid: boolean; buyHref: string }) {
  const firstSentence = a.executiveSummary?.split(". ")[0] + "." ?? "";

  const fullContent = (
    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
      <ContentCard>
        <h2 style={{ fontSize: "15px", fontWeight: 700, color: "#fff", marginBottom: "16px" }}>Overall Assessment</h2>
        {a.executiveSummary?.split("\n\n").map((p, i) => (
          <p key={i} style={{ fontSize: "14px", color: "#9CA3AF", lineHeight: 1.8, marginBottom: "12px" }}>{p}</p>
        ))}
      </ContentCard>
      <ContentCard>
        <h2 style={{ fontSize: "15px", fontWeight: 700, color: "#fff", marginBottom: "16px" }}>
          What&apos;s Holding It Back ({a.drivingLowScore?.length ?? 0})
        </h2>
        {a.drivingLowScore?.map((item, i) => (
          <div key={i} style={{ display: "flex", gap: "12px", marginBottom: "12px" }}>
            <span style={{ width: "18px", height: "18px", borderRadius: "50%", background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.3)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: "9px", color: "#EF4444" }}>✕</span>
            <p style={{ fontSize: "13px", color: "#9CA3AF", lineHeight: 1.7 }}>{item}</p>
          </div>
        ))}
      </ContentCard>
      <ContentCard>
        <h2 style={{ fontSize: "15px", fontWeight: 700, color: "#fff", marginBottom: "16px" }}>
          What&apos;s Genuinely Working ({a.genuinelyWorking?.length ?? 0})
        </h2>
        {a.genuinelyWorking?.map((item, i) => (
          <div key={i} style={{ display: "flex", gap: "12px", marginBottom: "12px" }}>
            <span style={{ width: "18px", height: "18px", borderRadius: "50%", background: "rgba(34,197,94,0.15)", border: "1px solid rgba(34,197,94,0.3)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: "9px", color: "#22C55E" }}>✓</span>
            <p style={{ fontSize: "13px", color: "#9CA3AF", lineHeight: 1.7 }}>{item}</p>
          </div>
        ))}
      </ContentCard>
      <ContentCard>
        <h2 style={{ fontSize: "15px", fontWeight: 700, color: "#fff", marginBottom: "12px" }}>Bottom Line</h2>
        <p style={{ fontSize: "14px", color: "#9CA3AF", lineHeight: 1.8 }}>{a.bottomLine}</p>
      </ContentCard>
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
      {!paid && (
        <ContentCard>
          <h2 style={{ fontSize: "15px", fontWeight: 700, color: "#fff", marginBottom: "12px" }}>Overall Assessment</h2>
          <p style={{ fontSize: "14px", color: "#9CA3AF", lineHeight: 1.8 }}>{firstSentence}</p>
        </ContentCard>
      )}
      {paid ? fullContent : (
        <LockedSection label="Full assessment, score drivers & strengths" href={buyHref}>
          {fullContent}
        </LockedSection>
      )}
    </div>
  );
}

// ── DIMENSION TAB — LOCKED ────────────────────────────────────
function DimensionTab({ dimName, a, animated, paid, buyHref }: { dimName: string; a: DeckAnalysis; animated: boolean; paid: boolean; buyHref: string }) {
  const dim = a.dimensions?.find(d => d.name === dimName);
  const slides = a.slideAssessments ?? [];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
      {/* Score bar — FREE */}
      {dim && (
        <ContentCard>
          <p style={{ fontSize: "12px", color: MUTED, marginBottom: "12px", textTransform: "uppercase", letterSpacing: "0.06em" }}>{dimName} Score</p>
          <DimBar name={dimName} score={dim.score} animated={animated} large />
        </ContentCard>
      )}

      {/* Fixes + slides — locked or free */}
      {(() => {
        const lockedContent = (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {a.highestLeverageFixes?.length > 0 && (
              <ContentCard>
                <h2 style={{ fontSize: "15px", fontWeight: 700, color: "#fff", marginBottom: "16px" }}>Highest-Leverage Fixes</h2>
                {a.highestLeverageFixes.map((f, i) => (
                  <div key={i} style={{ marginBottom: "16px", paddingBottom: "16px", borderBottom: i < a.highestLeverageFixes.length - 1 ? `1px solid ${CARD_BORDER}` : "none" }}>
                    <p style={{ fontSize: "13px", fontWeight: 600, color: "#E5E7EB", marginBottom: "5px" }}>{f.fix}</p>
                    <p style={{ fontSize: "13px", color: "#9CA3AF", lineHeight: 1.65 }}>{f.action}</p>
                  </div>
                ))}
              </ContentCard>
            )}
            {slides.length > 0 && (
              <ContentCard>
                <h2 style={{ fontSize: "15px", fontWeight: 700, color: "#fff", marginBottom: "16px" }}>Slide-by-Slide</h2>
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  {slides.map((s: SlideAssessment, i: number) => {
                    const c = slideColor(s.verdict);
                    return (
                      <div key={i} style={{ background: "#111", border: `1px solid ${CARD_BORDER}`, borderRadius: "10px", padding: "14px 16px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
                          <span style={{ fontSize: "13px", fontWeight: 600, color: "#E5E7EB" }}>{s.slide}</span>
                          <span style={{ padding: "2px 8px", background: c.bg, border: `1px solid ${c.border}`, borderRadius: "4px", color: c.color, fontSize: "11px", fontWeight: 600 }}>{s.verdict}</span>
                        </div>
                        <p style={{ fontSize: "13px", color: "#9CA3AF", lineHeight: 1.65 }}>{s.assessment}</p>
                      </div>
                    );
                  })}
                </div>
              </ContentCard>
            )}
          </div>
        );
        return paid ? lockedContent : (
          <LockedSection label={`Slide-by-slide feedback & fixes for ${dimName}`} href={buyHref}>
            {lockedContent}
          </LockedSection>
        );
      })()}
    </div>
  );
}

// ── Page inner ────────────────────────────────────────────────
function ResultsPageInner() {
  const { id } = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const hasError = searchParams.get("error") === "1";
  const [data, setData] = useState<SubmissionResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [animated, setAnimated] = useState(false);
  const [activeTab, setActiveTab] = useState("Breakdown");
  const [buyHref, setBuyHref] = useState("");

  useEffect(() => {
    if (!id) return;
    fetch(`/api/status/${id}`)
      .then(r => r.json())
      .then(d => {
        setData(d);
        setLoading(false);
        setBuyHref(checkoutUrl(d.id));
        setTimeout(() => setAnimated(true), 100);
      })
      .catch(() => setLoading(false));
  }, [id]);

  if (loading) return (
    <main style={{ minHeight: "100vh", background: "#0A0A0A", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ width: "36px", height: "36px", border: "3px solid #242424", borderTopColor: ORANGE, borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 14px" }} />
        <p style={{ color: MUTED, fontSize: "14px" }}>Loading your results...</p>
      </div>
    </main>
  );

  if (hasError || !data || data.status === "error") return (
    <main style={{ minHeight: "100vh", background: "#0A0A0A", display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 24px" }}>
      <div style={{ maxWidth: "440px", textAlign: "center" }}>
        <div style={{ fontSize: "48px", marginBottom: "16px" }}>⚠️</div>
        <h1 style={{ fontSize: "22px", fontWeight: 700, color: "#fff", marginBottom: "12px" }}>Analysis Failed</h1>
        <p style={{ fontSize: "14px", color: MUTED, marginBottom: "24px" }}>{data?.error_message || "Something went wrong. Please try again."}</p>
        <a href="/" style={{ display: "inline-block", padding: "11px 24px", background: ORANGE, borderRadius: "8px", color: "#fff", fontSize: "14px", fontWeight: 600, textDecoration: "none" }}>Try Again</a>
      </div>
    </main>
  );

  const a = data.analysis_json;
  if (!a) return null;

  const paid = data.paid ?? false;
  const slideCount = a.slideAssessments?.length ?? 0;
  const tabs = ["Breakdown", "Summary", ...DIM_NAMES];

  const scoreLabel = data.score >= 8
    ? "Your deck is in strong shape. Focus on the refinements below."
    : data.score >= 6
    ? "A fundable core exists. Key improvements needed before wide distribution."
    : "Core weaknesses need addressing before serious investor engagement.";

  return (
    <main style={{ minHeight: "100vh", background: "#0A0A0A", color: "#fff", padding: "32px 20px 100px" }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        * { box-sizing: border-box; }
      `}</style>

      <div style={{ maxWidth: "1000px", margin: "0 auto" }}>

        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "28px" }}>
          <div style={{ width: "26px", height: "26px", borderRadius: "6px", background: ORANGE, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="13" height="13" viewBox="0 0 14 14" fill="none"><path d="M7 1L13 4V10L7 13L1 10V4L7 1Z" stroke="white" strokeWidth="1.5" fill="none"/><circle cx="7" cy="7" r="2" fill="white"/></svg>
          </div>
          <span style={{ fontSize: "14px", fontWeight: 700 }}>DeckScore</span>
        </div>

        {/* ── TOP CARD — always visible ── */}
        <div style={{ background: CARD_BG, border: `1px solid ${CARD_BORDER}`, borderRadius: "20px", padding: "28px 32px", marginBottom: "16px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "28px", flexWrap: "wrap" }}>
            <ScoreCircle score={data.score} animated={animated} />
            <div style={{ flex: 1, minWidth: "200px" }}>
              <h1 style={{ fontSize: "22px", fontWeight: 800, color: "#fff", marginBottom: "8px" }}>Investor Readiness Score</h1>
              <p style={{ fontSize: "14px", color: "#9CA3AF", lineHeight: 1.6, marginBottom: "14px" }}>{scoreLabel}</p>
              {slideCount > 0 && (
                <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", background: "rgba(249,115,22,0.1)", border: "1px solid rgba(249,115,22,0.25)", borderRadius: "99px", padding: "5px 12px", fontSize: "12px", color: ORANGE, fontWeight: 600 }}>
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><circle cx="6" cy="6" r="5" stroke={ORANGE} strokeWidth="1.5"/><path d="M6 4v2.5l1.5 1" stroke={ORANGE} strokeWidth="1.2" strokeLinecap="round"/></svg>
                  Analysed {slideCount} slides
                </span>
              )}
            </div>
          </div>
          <div style={{ marginTop: "20px", paddingTop: "20px", borderTop: `1px solid ${CARD_BORDER}` }}>
            <p style={{ fontSize: "13px", color: "#9CA3AF", lineHeight: 1.7 }}>{data.verdict}</p>
          </div>
        </div>

        {/* ── TABS ── */}
        <div style={{ overflowX: "auto", marginBottom: "16px", paddingBottom: "4px" }}>
          <div style={{ display: "flex", gap: "6px", width: "max-content" }}>
            {tabs.map(t => (
              <Tab
                key={t}
                label={t}
                active={activeTab === t}
                locked={t !== "Breakdown"}
                onClick={() => setActiveTab(t)}
              />
            ))}
          </div>
        </div>

        {/* ── TAB CONTENT ── */}
        {activeTab === "Breakdown" && <BreakdownTab a={a} animated={animated} paid={paid} buyHref={buyHref} />}
        {activeTab === "Summary" && <SummaryTab a={a} paid={paid} buyHref={buyHref} />}
        {DIM_NAMES.includes(activeTab) && <DimensionTab dimName={activeTab} a={a} animated={animated} paid={paid} buyHref={buyHref} />}

        {/* ── UPSELL BANNER — hidden after purchase ── */}
        {!paid && <div style={{ background: CARD_BG, border: `1px solid rgba(249,115,22,0.3)`, borderRadius: "16px", padding: "28px 32px", textAlign: "center", marginTop: "16px" }}>
          <p style={{ fontSize: "11px", color: ORANGE, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "10px" }}>Full Implementation Plan</p>
          <h3 style={{ fontSize: "20px", fontWeight: 800, marginBottom: "10px" }}>
            {slideCount > 0 ? `${slideCount} slides reviewed.` : "Analysis complete."} Now fix them.
          </h3>
          <p style={{ fontSize: "14px", color: "#9CA3AF", lineHeight: 1.75, marginBottom: "22px", maxWidth: "480px", margin: "0 auto 22px" }}>
            Unlock the full report: slide-by-slide feedback, your most damaging issue, highest-leverage fixes, recommended deck order, and the bottom-line truth investors will see.
          </p>
          <a href={buyHref} style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "14px 28px", background: ORANGE, borderRadius: "10px", color: "#fff", fontSize: "15px", fontWeight: 700, textDecoration: "none", boxShadow: "0 0 32px rgba(249,115,22,0.3)" }}>
            Unlock Full Report — $7
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2.5 7h9M7 3l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </a>
          <p style={{ fontSize: "11px", color: MUTED, marginTop: "12px" }}>One-time payment · Delivered within minutes</p>
        </div>}

      </div>
    </main>
  );
}

export default function ResultsPage() {
  return (
    <Suspense fallback={
      <main style={{ minHeight: "100vh", background: "#0A0A0A", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ width: "36px", height: "36px", border: `3px solid #242424`, borderTopColor: ORANGE, borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
      </main>
    }>
      <ResultsPageInner />
    </Suspense>
  );
}
