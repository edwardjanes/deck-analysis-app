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

  return (
    <main style={{ minHeight: "100vh", background: "#0A0A0A", color: "#F8FAFC", padding: "40px 24px" }}>
      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
        <button
          onClick={() => router.back()}
          style={{ color: GREEN, background: "none", border: "none", cursor: "pointer", fontSize: "14px", fontWeight: 600, marginBottom: "32px" }}
        >
          ← Back
        </button>

        <div style={{ background: CARD_BG, border: `1px solid ${CARD_BORDER}`, borderRadius: "8px", padding: "24px" }}>
          <h1 style={{ fontSize: "24px", fontWeight: 700, marginBottom: "16px" }}>{submission.business_name}</h1>
          <p style={{ color: MUTED, marginBottom: "24px" }}>Submission ID: {submission.id}</p>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px", marginBottom: "32px" }}>
            <div>
              <p style={{ color: MUTED, fontSize: "12px", marginBottom: "8px" }}>Score</p>
              <p style={{ fontSize: "28px", fontWeight: 700, color: GREEN }}>{Math.round(submission.score)}</p>
            </div>
            <div>
              <p style={{ color: MUTED, fontSize: "12px", marginBottom: "8px" }}>Verdict</p>
              <p style={{ fontSize: "18px", fontWeight: 600 }}>{submission.verdict}</p>
            </div>
            <div>
              <p style={{ color: MUTED, fontSize: "12px", marginBottom: "8px" }}>Status</p>
              <p style={{ fontSize: "18px", fontWeight: 600 }}>{submission.status}</p>
            </div>
          </div>

          {submission.analysis_json && (
            <div style={{ marginTop: "40px" }}>
              {/* Executive Summary */}
              <div style={{ marginBottom: "40px" }}>
                <h2 style={{ fontSize: "20px", fontWeight: 700, marginBottom: "16px" }}>Executive Summary</h2>
                <div style={{ background: CARD_BG, border: `1px solid ${CARD_BORDER}`, borderRadius: "8px", padding: "20px" }}>
                  {submission.analysis_json.executiveSummary?.split("\n\n").map((p, i) => (
                    <p key={i} style={{ fontSize: "15px", color: "#D1D5DB", lineHeight: 1.85, marginBottom: "14px" }}>{p}</p>
                  ))}
                </div>
              </div>

              {/* Key Insights */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "40px" }}>
                <div style={{ background: CARD_BG, border: `1px solid ${CARD_BORDER}`, borderRadius: "8px", padding: "20px" }}>
                  <p style={{ fontSize: "10px", color: "#EF4444", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "10px" }}>Most Damaging Issue</p>
                  <p style={{ fontSize: "15px", color: "#D1D5DB", lineHeight: 1.7 }}>{submission.analysis_json.mostDamagingIssue}</p>
                </div>
                <div style={{ background: CARD_BG, border: `1px solid ${CARD_BORDER}`, borderRadius: "8px", padding: "20px" }}>
                  <p style={{ fontSize: "10px", color: GREEN, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "10px" }}>Best Asset</p>
                  <p style={{ fontSize: "15px", color: "#D1D5DB", lineHeight: 1.7 }}>{submission.analysis_json.bestAsset}</p>
                </div>
              </div>

              {/* Dimension Breakdown */}
              <div style={{ marginBottom: "40px" }}>
                <h2 style={{ fontSize: "20px", fontWeight: 700, marginBottom: "16px" }}>Dimension Breakdown</h2>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "12px" }}>
                  {submission.analysis_json.dimensions?.map((d) => (
                    <div key={d.name} style={{ background: CARD_BG, border: `1px solid ${CARD_BORDER}`, borderRadius: "8px", padding: "20px" }}>
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
                    </div>
                  ))}
                </div>
              </div>

              {/* Slide-by-Slide Assessment */}
              {submission.analysis_json.slideAssessments && submission.analysis_json.slideAssessments.length > 0 && (
                <div>
                  <h2 style={{ fontSize: "20px", fontWeight: 700, marginBottom: "16px" }}>Slide-by-Slide Assessment</h2>
                  <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                    {submission.analysis_json.slideAssessments.map((slide, i) => (
                      <div key={i} style={{ background: CARD_BG, border: `1px solid ${CARD_BORDER}`, borderRadius: "8px", padding: "20px" }}>
                        <p style={{ fontSize: "12px", color: MUTED, fontWeight: 600, marginBottom: "8px" }}>{slide.slide}</p>
                        <p style={{ fontSize: "12px", color: slide.verdict === "Strong" ? GREEN : slide.verdict === "Acceptable" ? "#FBBF24" : slide.verdict === "Weak" ? "#EF4444" : "#888888", fontWeight: 600, marginBottom: "8px" }}>Verdict: {slide.verdict}</p>
                        <p style={{ fontSize: "13px", color: "#D1D5DB", lineHeight: 1.6 }}>{slide.assessment}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
