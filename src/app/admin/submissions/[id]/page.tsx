"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabaseBrowser";
import { DeckAnalysis } from "@/lib/deckPrompt";

interface SubmissionResult {
  id: string;
  business_name: string;
  created_at: string;
  status: string;
  score: number;
  verdict: string;
  verdict_type: "pass" | "review" | "flag";
  most_damaging_issue: string;
  best_asset: string;
  analysis_json: DeckAnalysis;
  error_message?: string;
}

const GREEN = "#03fb83";
const CARD_BG = "#161616";
const CARD_BORDER = "#242424";
const MUTED = "#6B7280";

function ScoreCircle({ score, animated }: { score: number; animated: boolean }) {
  const r = 54;
  const circ = 2 * Math.PI * r;
  const pct = Math.min(score, 100) / 100;
  const offset = animated ? circ - pct * circ : circ;
  const color = score >= 85 ? GREEN : score >= 50 ? "#FBBF24" : "#EF4444";
  return (
    <div style={{ position: "relative", width: "136px", height: "136px", flexShrink: 0 }}>
      <svg width="136" height="136" style={{ transform: "rotate(-90deg)" }}>
        <circle cx="68" cy="68" r={r} fill="none" stroke="#242424" strokeWidth="10" />
        <circle cx="68" cy="68" r={r} fill="none" stroke={color} strokeWidth="10" strokeLinecap="round"
          strokeDasharray={circ} strokeDashoffset={offset}
          style={{ transition: animated ? "stroke-dashoffset 1.4s cubic-bezier(0.4,0,0.2,1) 0.2s" : "none" }}
        />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        <span style={{ fontSize: "38px", fontWeight: 800, color: "#fff", lineHeight: 1 }}>{Math.round(score)}</span>
        <span style={{ fontSize: "12px", color: MUTED, marginTop: "2px" }}>/ 100</span>
      </div>
    </div>
  );
}

function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{ background: CARD_BG, border: `1px solid ${CARD_BORDER}`, borderRadius: "16px", padding: "28px", ...style }}>
      {children}
    </div>
  );
}

function DimBar({ name, score, animated }: { name: string; score: number; animated: boolean }) {
  const pct = (score / 10) * 100;
  const color = score >= 7 ? GREEN : score >= 5 ? "#FBBF24" : "#EF4444";
  return (
    <div style={{ marginBottom: "18px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
        <span style={{ fontSize: "16px", color: "#E5E7EB" }}>{name}</span>
        <span style={{ fontSize: "16px", fontWeight: 700, color }}>{score}/10</span>
      </div>
      <div style={{ height: "6px", background: "#242424", borderRadius: "99px", overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${pct}%`, background: color, borderRadius: "99px",
          transition: animated ? "width 1.2s cubic-bezier(0.4,0,0.2,1) 0.3s" : "none" }} />
      </div>
    </div>
  );
}

export default function AdminSubmissionDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [data, setData] = useState<SubmissionResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [animated, setAnimated] = useState(false);

  useEffect(() => {
    const checkAuthAndLoad = async () => {
      try {
        const supabase = createSupabaseBrowserClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
          router.push("/login");
          return;
        }

        const { data: profile } = await supabase
          .from("profiles")
          .select("sc_admin")
          .eq("id", user.id)
          .single();

        if (!profile?.sc_admin) {
          setError("Admin access required");
          setLoading(false);
          return;
        }

        setIsAdmin(true);

        const response = await fetch(`/api/status/${id}`);
        const result = await response.json();

        if (!response.ok || !result) {
          setError("Submission not found");
          setLoading(false);
          return;
        }

        setData(result);
        setLoading(false);
        setTimeout(() => setAnimated(true), 100);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error loading submission");
        setLoading(false);
      }
    };

    checkAuthAndLoad();
  }, [id, router]);

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: "#0A0A0A", display: "flex", alignItems: "center", justifyContent: "center", color: "#F8FAFC" }}>
        <p>Loading...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div style={{ minHeight: "100vh", background: "#0A0A0A", display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 24px" }}>
        <div style={{ maxWidth: "440px", textAlign: "center" }}>
          <div style={{ fontSize: "48px", marginBottom: "16px" }}>⚠️</div>
          <h1 style={{ fontSize: "22px", fontWeight: 700, color: "#fff", marginBottom: "12px" }}>Not Found</h1>
          <p style={{ fontSize: "16px", color: MUTED, marginBottom: "24px" }}>{error || "Something went wrong. Please try again."}</p>
          <a href="/admin/submissions" style={{ display: "inline-block", padding: "11px 24px", background: GREEN, borderRadius: "8px", color: "#000", fontSize: "16px", fontWeight: 700, textDecoration: "none" }}>Back to Submissions</a>
        </div>
      </div>
    );
  }

  if (!isAdmin) return null;

  const a = data.analysis_json;
  if (!a) return null;

  const verdictColor = data.verdict_type === "pass" ? GREEN : data.verdict_type === "review" ? "#FBBF24" : "#EF4444";
  const verdictLabel = data.verdict_type === "pass" ? "Investor Ready" : data.verdict_type === "review" ? "Needs Work" : "Not Ready";

  return (
    <div style={{ minHeight: "100vh", background: "#0A0A0A", color: "#fff", padding: "40px 24px" }}>
      <div style={{ maxWidth: "900px", margin: "0 auto" }}>
        {/* Header */}
        <div style={{ marginBottom: "40px" }}>
          <a href="/admin/submissions" style={{ color: GREEN, textDecoration: "none", fontSize: "14px", marginBottom: "16px", display: "inline-block" }}>← Back to Submissions</a>
          <h1 style={{ fontSize: "32px", fontWeight: 700, marginBottom: "8px" }}>{data.business_name}</h1>
          <p style={{ color: MUTED, fontSize: "14px" }}>Submission ID: {data.id}</p>
        </div>

        {/* Score Card */}
        <div style={{ marginBottom: "40px" }}>
          <Card>
            <div style={{ display: "flex", alignItems: "center", gap: "32px", justifyContent: "space-between" }}>
              <div>
                <div style={{ fontSize: "14px", color: MUTED, marginBottom: "8px", fontWeight: 600 }}>INVESTOR VIABILITY SCORE</div>
                <ScoreCircle score={data.score} animated={animated} />
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: "14px", color: MUTED, marginBottom: "8px", fontWeight: 600 }}>VERDICT</div>
                <div style={{ fontSize: "20px", fontWeight: 700, color: verdictColor }}>{verdictLabel}</div>
                <p style={{ color: MUTED, fontSize: "12px", marginTop: "12px", lineHeight: 1.5 }}>{data.verdict}</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Executive Summary */}
        <div style={{ marginBottom: "40px" }}>
          <h2 style={{ fontSize: "20px", fontWeight: 700, marginBottom: "16px" }}>Executive Summary</h2>
          <Card>
            {a.executiveSummary?.split("\n\n").map((p, i) => (
              <p key={i} style={{ fontSize: "15px", color: "#D1D5DB", lineHeight: 1.85, marginBottom: "14px" }}>{p}</p>
            ))}
          </Card>
        </div>

        {/* Key Insights */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "40px" }}>
          <Card>
            <p style={{ fontSize: "10px", color: "#EF4444", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "10px" }}>Most Damaging Issue</p>
            <p style={{ fontSize: "15px", color: "#D1D5DB", lineHeight: 1.7 }}>{a.mostDamagingIssue}</p>
          </Card>
          <Card>
            <p style={{ fontSize: "10px", color: GREEN, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "10px" }}>Best Asset</p>
            <p style={{ fontSize: "15px", color: "#D1D5DB", lineHeight: 1.7 }}>{a.bestAsset}</p>
          </Card>
        </div>

        {/* Dimension Breakdown */}
        <div style={{ marginBottom: "40px" }}>
          <h2 style={{ fontSize: "20px", fontWeight: 700, marginBottom: "16px" }}>Dimension Scores</h2>
          <Card>
            {a.dimensions?.map(d => <DimBar key={d.name} name={d.name} score={d.score} animated={animated} />)}
          </Card>
        </div>

        {/* Slide-by-Slide Assessment */}
        {a.slideAssessments && a.slideAssessments.length > 0 && (
          <div>
            <h2 style={{ fontSize: "20px", fontWeight: 700, marginBottom: "16px" }}>Slide-by-Slide Assessment</h2>
            <Card>
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {a.slideAssessments.map((slide, i) => {
                  const verdictColor = slide.verdict === "Strong" ? GREEN : slide.verdict === "Acceptable" ? "#FBBF24" : slide.verdict === "Weak" ? "#EF4444" : MUTED;
                  return (
                    <div key={i} style={{ background: "#111", border: `1px solid ${CARD_BORDER}`, borderRadius: "10px", padding: "14px 16px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
                        <span style={{ fontSize: "16px", fontWeight: 600, color: "#E5E7EB" }}>{slide.slide}</span>
                        <span style={{ padding: "2px 9px", background: verdictColor + "20", border: `1px solid ${verdictColor}40`, borderRadius: "99px", color: verdictColor, fontSize: "11px", fontWeight: 700 }}>{slide.verdict}</span>
                      </div>
                      <p style={{ fontSize: "15px", color: "#9CA3AF", lineHeight: 1.7 }}>{slide.assessment}</p>
                    </div>
                  );
                })}
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
