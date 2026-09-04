"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabaseBrowser";
import { DeckAnalysis } from "@/lib/deckPrompt";

interface SubmissionDetail {
  id: string;
  business_name: string;
  first_name: string;
  last_name: string;
  email: string;
  score: number;
  verdict: string;
  verdict_type: "pass" | "review" | "flag";
  status: string;
  created_at: string;
  analysis_json: DeckAnalysis;
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
          <p style={{ color: MUTED, marginBottom: "24px" }}>{submission.first_name} {submission.last_name} • {submission.email}</p>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px", marginBottom: "32px" }}>
            <div>
              <p style={{ color: MUTED, fontSize: "12px", marginBottom: "8px" }}>Score</p>
              <p style={{ fontSize: "28px", fontWeight: 700, color: GREEN }}>{Math.round(submission.score)}</p>
            </div>
            <div>
              <p style={{ color: MUTED, fontSize: "12px", marginBottom: "8px" }}>Verdict</p>
              <p style={{ fontSize: "18px", fontWeight: 600 }}>{submission.verdict_type}</p>
            </div>
            <div>
              <p style={{ color: MUTED, fontSize: "12px", marginBottom: "8px" }}>Status</p>
              <p style={{ fontSize: "18px", fontWeight: 600 }}>{submission.status}</p>
            </div>
          </div>

          {submission.analysis_json && (
            <div>
              <h2 style={{ fontSize: "16px", fontWeight: 600, marginBottom: "16px" }}>Analysis Details</h2>
              <pre style={{ background: "#0A0A0A", padding: "16px", borderRadius: "4px", overflow: "auto", fontSize: "12px", color: MUTED }}>
                {JSON.stringify(submission.analysis_json, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
