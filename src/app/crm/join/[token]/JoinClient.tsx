"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabaseBrowser";

const GREEN = "#03fb83";
const LOGO = "https://raw.githubusercontent.com/edwardjanes/source-capital/0147b27fad891686f67559992e43319411f07ba4/logo.png";

export default function JoinClient({ token, email, role, projectName, expired, used }: {
  token: string; email: string; role: string; projectName: string; expired: boolean; used: boolean;
}) {
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState("");

  async function handleAccept() {
    setJoining(true);
    setError("");
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        // Redirect to login with return URL
        router.push(`/login?returnTo=/crm/join/${token}`);
        return;
      }
      const res = await fetch("/api/crm/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      router.push(`/crm/project/${data.projectId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setJoining(false);
    }
  }

  const invalid = expired || used;

  return (
    <div style={{ minHeight: "100vh", background: "#080C14", color: "#F8FAFC", fontFamily: "Inter, sans-serif", display: "flex", flexDirection: "column" }}>
      <header style={{ borderBottom: "1px solid #1A2438", padding: "0 32px", height: "60px", display: "flex", alignItems: "center" }}>
        <img src={LOGO} alt="Source Capital" style={{ height: "28px" }} />
      </header>

      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 24px" }}>
        <div style={{ background: "#0D1420", border: "1px solid #1A2438", borderRadius: "16px", padding: "48px 40px", width: "100%", maxWidth: "440px", textAlign: "center" }}>
          {invalid ? (
            <>
              <div style={{ fontSize: "40px", marginBottom: "16px" }}>⚠️</div>
              <h1 style={{ fontSize: "22px", fontWeight: 700, marginBottom: "8px" }}>
                {used ? "Invitation Already Used" : "Invitation Expired"}
              </h1>
              <p style={{ fontSize: "14px", color: "#6B7280", marginBottom: "24px" }}>
                {used ? "This invite link has already been accepted." : "This invite link has expired. Ask the project owner to send a new one."}
              </p>
              <a href="/crm" style={{ fontSize: "14px", color: GREEN, textDecoration: "none" }}>Go to CRM →</a>
            </>
          ) : (
            <>
              <div style={{ background: "rgba(3,251,131,0.12)", color: GREEN, fontSize: "11px", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", padding: "5px 14px", borderRadius: "20px", display: "inline-block", marginBottom: "24px" }}>
                You're invited
              </div>
              <h1 style={{ fontSize: "24px", fontWeight: 800, marginBottom: "10px" }}>
                Join {projectName}
              </h1>
              <p style={{ fontSize: "14px", color: "#94A3B8", marginBottom: "8px" }}>
                You've been invited as a <strong style={{ color: "#F8FAFC" }}>{role}</strong> on this raise project.
              </p>
              <p style={{ fontSize: "13px", color: "#6B7280", marginBottom: "32px" }}>
                Invite sent to: {email}
              </p>

              {error && <p style={{ fontSize: "13px", color: "#EF4444", marginBottom: "16px" }}>{error}</p>}

              <button
                onClick={handleAccept}
                disabled={joining}
                style={{ background: joining ? "#374151" : GREEN, color: "#000", border: "none", borderRadius: "12px", padding: "14px 32px", fontSize: "15px", fontWeight: 700, cursor: joining ? "not-allowed" : "pointer", width: "100%" }}
              >
                {joining ? "Joining…" : "Accept Invitation →"}
              </button>
              <p style={{ fontSize: "12px", color: "#374151", marginTop: "16px" }}>
                You'll need to be logged in to accept. This link expires in 7 days.
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
