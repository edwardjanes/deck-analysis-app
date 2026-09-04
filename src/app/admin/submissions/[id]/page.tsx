"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabaseBrowser";
import { DeckAnalysis } from "@/lib/deckPrompt";

interface SubmissionDetail {
  id: string;
  business_name: string;
  score: number;
  verdict: string;
  status: string;
  created_at: string;
  analysis_json: DeckAnalysis;
  user_id: string;
}

const GREEN = "#03fb83";
const CARD_BG = "#161616";
const CARD_BORDER = "#242424";
const MUTED = "#6B7280";

function ScoreCircle({ score }: { score: number }) {
  const r = 54;
  const circ = 2 * Math.PI * r;
  const pct = Math.min(score, 100) / 100;
  const offset = circ - pct * circ;
  const color = score >= 85 ? GREEN : score >= 50 ? "#FBBF24" : "#EF4444";
  return (
    <div style={{ position: "relative", width: "136px", height: "136px", flexShrink: 0 }}>
      <svg width="136" height="136" style={{ transform: "rotate(-90deg)" }}>
        <circle cx="68" cy="68" r={r} fill="none" stroke="#242424" strokeWidth="10" />
        <circle cx="68" cy="68" r={r} fill="none" stroke={color} strokeWidth="10" strokeLinecap="round"
          strokeDasharray={circ} strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 1.4s cubic-bezier(0.4,0,0.2,1) 0.2s" }}
        />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        <span style={{ fontSize: "38px", fontWeight: 800, color: "#fff", lineHeight: 1 }}>{score}</span>
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

export default function AdminSubmissionDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [submission, setSubmission] = useState<SubmissionDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    checkAuthAndLoad();
  }, [id]);

  async function checkAuthAndLoad() {
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

      const { data, error: queryError } = await supabase
        .from("deck_submissions")
        .select("*")
        .eq("id", id)
        .single();

      if (queryError) throw queryError;
      setSubmission(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error loading submission");
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: "#0A0A0A", display: "flex", alignItems: "center", justifyContent: "center", color: "#F8FAFC" }}>
        <p>Loading...</p>
      </div>
    );
  }

  if (error || !submission) {
    return (
      <div style={{ minHeight: "100vh", background: "#0A0A0A", display: "flex", alignItems: "center", justifyContent: "center", color: "#F8FAFC" }}>
        <p style={{ color: "#EF4444" }}>{error || "Submission not found"}</p>
      </div>
    );
  }

  if (!isAdmin) return null;

  if (!submission.analysis_json) return null;

  const a = submission.analysis_json;
  const verdictColor = submission.verdict === "pass" ? GREEN : submission.verdict === "review" ? "#FBBF24" : "#EF4444";
  const verdictLabel = submission.verdict === "pass" ? "Investor Ready" : submission.verdict === "review" ? "Needs Work" : "Not Ready";

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#0A0A0A", color: "#fff", padding: "40px 20px" }}>
      <div style={{ maxWidth: "1000px", margin: "0 auto" }}>
        {/* Header */}
        <div style={{ marginBottom: "40px" }}>
          <a href="javascript:history.back()" style={{ color: GREEN, textDecoration: "none", fontSize: "14px", marginBottom: "16px", display: "inline-block" }}>← Back</a>
          <h1 style={{ fontSize: "32px", fontWeight: 700, marginBottom: "8px" }}>{submission.business_name}</h1>
          <p style={{ color: MUTED, fontSize: "14px" }}>Submission ID: {submission.id}</p>
        </div>

        {/* Score Card */}
        <div style={{ marginBottom: "40px" }}>
          <Card>
            <div style={{ display: "flex", alignItems: "center", gap: "32px", justifyContent: "space-between" }}>
              <div>
                <div style={{ fontSize: "14px", color: MUTED, marginBottom: "8px", fontWeight: 600 }}>INVESTOR VIABILITY SCORE</div>
                <ScoreCircle score={Math.round(submission.score)} />
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: "14px", color: MUTED, marginBottom: "8px", fontWeight: 600 }}>VERDICT</div>
                <div style={{ fontSize: "20px", fontWeight: 700, color: verdictColor }}>{verdictLabel}</div>
                <p style={{ color: MUTED, fontSize: "12px", marginTop: "12px", lineHeight: 1.5 }}>{submission.verdict}</p>
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
          <h2 style={{ fontSize: "20px", fontWeight: 700, marginBottom: "16px" }}>Dimension Breakdown</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "12px" }}>
            {a.dimensions?.map((d) => (
              <Card key={d.name}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                  <p style={{ fontSize: "14px", fontWeight: 600 }}>{d.name}</p>
                  <p style={{ fontSize: "16px", fontWeight: 700, color: d.score >= 7 ? GREEN : d.score >= 5 ? "#FBBF24" : "#EF4444" }}>{d.score}/10</p>
                </div>
                <div style={{ width: "100%", height: "6px", backgroundColor: "#1a1a1a", borderRadius: "99px", overflow: "hidden" }}>
                  <div style={{
                    height: "100%",
                    width: `${(d.score / 10) * 100}%`,
                    backgroundColor: d.score >= 7 ? GREEN : d.score >= 5 ? "#FBBF24" : "#EF4444",
                    borderRadius: "99px",
                    transition: "width 1.2s cubic-bezier(0.4,0,0.2,1) 0.3s",
                  }} />
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Slide-by-Slide Assessment */}
        {a.slideAssessments && a.slideAssessments.length > 0 && (
          <div>
            <h2 style={{ fontSize: "20px", fontWeight: 700, marginBottom: "16px" }}>Slide-by-Slide Assessment</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {a.slideAssessments.map((slide, i) => (
                <Card key={i}>
                  <p style={{ fontSize: "12px", color: MUTED, fontWeight: 600, marginBottom: "8px" }}>{slide.slide}</p>
                  <p style={{ fontSize: "12px", color: slide.verdict === "Strong" ? GREEN : slide.verdict === "Acceptable" ? "#FBBF24" : slide.verdict === "Weak" ? "#EF4444" : "#888888", fontWeight: 600, marginBottom: "8px" }}>Verdict: {slide.verdict}</p>
                  <p style={{ fontSize: "13px", color: "#D1D5DB", lineHeight: 1.6 }}>{slide.assessment}</p>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
