"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabaseBrowser";
import { DeckAnalysis } from "@/lib/deckPrompt";

interface SubmissionResult {
  id: string;
  business_name: string;
  score: number;
  verdict: string;
  verdict_type: "pass" | "review" | "flag";
  most_damaging_issue: string;
  best_asset: string;
  analysis_summary: string;
  analysis_json: DeckAnalysis;
  error_message?: string;
  created_at: string;
  status: "pending" | "analysing" | "complete" | "error";
}

const GREEN = "#03fb83";
const CARD_BG = "#161616";
const CARD_BORDER = "#242424";
const MUTED = "#6B7280";

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      backgroundColor: CARD_BG,
      border: `1px solid ${CARD_BORDER}`,
      borderRadius: "12px",
      padding: "20px",
    }}>
      {children}
    </div>
  );
}

export default function AdminResultsPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [data, setData] = useState<SubmissionResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  // Check admin access
  useEffect(() => {
    const checkAdmin = async () => {
      try {
        const supabase = createSupabaseBrowserClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
          router.push("/login");
          return;
        }

        const { data: profile } = await supabase
          .from("profiles")
          .select("sc_admin")
          .eq("id", user.id)
          .single();

        if (!profile?.sc_admin) {
          setIsAdmin(false);
          setIsChecking(false);
          return;
        }

        setIsAdmin(true);
      } catch (err) {
        console.error("Admin check error:", err);
      } finally {
        setIsChecking(false);
      }
    };

    checkAdmin();
  }, [router]);

  // Fetch submission data
  useEffect(() => {
    if (!isAdmin || !id) return;

    fetch(`/api/status/${id}`)
      .then(r => r.json())
      .then(d => {
        setData(d);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [isAdmin, id]);

  if (isChecking) {
    return (
      <div style={{ minHeight: "100vh", backgroundColor: "#0A0A0A", display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
        <p style={{ color: MUTED }}>Checking admin access...</p>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div style={{ minHeight: "100vh", backgroundColor: "#0A0A0A", display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
        <div style={{ backgroundColor: "#111111", border: "1px solid #2a2a2a", borderRadius: "8px", padding: "40px", maxWidth: "400px", textAlign: "center" }}>
          <h1 style={{ color: "#ff6b6b", marginBottom: "16px" }}>Access Denied</h1>
          <p style={{ color: MUTED, marginBottom: "20px" }}>You do not have admin access to this page.</p>
          <a href="/dashboard" style={{ color: GREEN, textDecoration: "none" }}>Back to Dashboard</a>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", backgroundColor: "#0A0A0A", display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
        <p style={{ color: MUTED }}>Loading results...</p>
      </div>
    );
  }

  if (!data || data.status === "error") {
    return (
      <div style={{ minHeight: "100vh", backgroundColor: "#0A0A0A", display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
        <div style={{ maxWidth: "440px", textAlign: "center" }}>
          <div style={{ fontSize: "48px", marginBottom: "16px" }}>⚠️</div>
          <h1 style={{ fontSize: "22px", fontWeight: 700, color: "#fff", marginBottom: "12px" }}>Analysis Failed</h1>
          <p style={{ fontSize: "16px", color: MUTED, marginBottom: "24px" }}>{data?.error_message || "Something went wrong."}</p>
          <a href="/admin/upload" style={{ display: "inline-block", padding: "11px 24px", background: GREEN, borderRadius: "8px", color: "#000", fontSize: "16px", fontWeight: 700, textDecoration: "none" }}>Back to Upload</a>
        </div>
      </div>
    );
  }

  const a = data.analysis_json;
  if (!a) return null;

  const verdictColor = data.verdict_type === "pass" ? GREEN : data.verdict_type === "review" ? "#FBBF24" : "#EF4444";
  const verdictLabel = data.verdict_type === "pass" ? "Investor Ready" : data.verdict_type === "review" ? "Needs Work" : "Not Ready";

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#0A0A0A", color: "#fff", padding: "40px 20px" }}>
      <div style={{ maxWidth: "1000px", margin: "0 auto" }}>
        {/* Header */}
        <div style={{ marginBottom: "40px" }}>
          <a href="/admin/upload" style={{ color: GREEN, textDecoration: "none", fontSize: "14px", marginBottom: "16px", display: "inline-block" }}>← Back to Upload</a>
          <h1 style={{ fontSize: "32px", fontWeight: 700, marginBottom: "8px" }}>{data.business_name}</h1>
          <p style={{ color: MUTED, fontSize: "14px" }}>Submission ID: {data.id}</p>
        </div>

        {/* Score Card */}
        <div style={{ marginBottom: "40px" }}>
          <Card>
            <div style={{ display: "flex", alignItems: "center", gap: "32px", justifyContent: "space-between" }}>
              <div>
                <div style={{ fontSize: "14px", color: MUTED, marginBottom: "8px", fontWeight: 600 }}>INVESTOR VIABILITY SCORE</div>
                <div style={{ fontSize: "56px", fontWeight: 700, color: data.score >= 85 ? GREEN : data.score >= 50 ? "#FBBF24" : "#EF4444" }}>
                  {data.score}
                </div>
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

        {/* Dimension Scores */}
        <div style={{ marginBottom: "40px" }}>
          <h2 style={{ fontSize: "20px", fontWeight: 700, marginBottom: "16px" }}>Dimension Breakdown</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "12px" }}>
            {a.dimensions?.map((d) => (
              <Card key={d.name}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                  <p style={{ fontSize: "14px", fontWeight: 600 }}>{d.name}</p>
                  <p style={{ fontSize: "16px", fontWeight: 700, color: d.score >= 7 ? GREEN : d.score >= 5 ? "#FBBF24" : "#EF4444" }}>{d.score}/10</p>
                </div>
                <div style={{ width: "100%", height: "6px", backgroundColor: "#1a1a1a", borderRadius: "3px", overflow: "hidden" }}>
                  <div style={{
                    height: "100%",
                    width: `${(d.score / 10) * 100}%`,
                    backgroundColor: d.score >= 7 ? GREEN : d.score >= 5 ? "#FBBF24" : "#EF4444",
                    transition: "width 0.3s ease",
                  }} />
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Slide Assessments */}
        {a.slideAssessments && a.slideAssessments.length > 0 && (
          <div>
            <h2 style={{ fontSize: "20px", fontWeight: 700, marginBottom: "16px" }}>Slide-by-Slide Assessment</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {a.slideAssessments.map((slide, i) => (
                <Card key={i}>
                  <p style={{ fontSize: "12px", color: MUTED, fontWeight: 600, marginBottom: "8px" }}>Slide {i + 1}</p>
                  <p style={{ fontSize: "14px", fontWeight: 600, marginBottom: "8px" }}>{slide.title}</p>
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
