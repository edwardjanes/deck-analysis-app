"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import posthog from "posthog-js";
import { RecoveryAction } from "@/lib/errorHandler";

const GREEN = "#03fb83";
const TOTAL_SECONDS = 120;

const STEPS = [
  "Extracting slide content...",
  "Evaluating narrative structure...",
  "Scoring venture logic & structure...",
  "Assessing design & clarity...",
  "Benchmarking against VC criteria...",
  "Generating actionable insights...",
];

const FACTS = [
  { stat: "<1%",   body: "Of pitches actually receive investment" },
  { stat: "1:31",  body: "Average time a VC spends reviewing a deck" },
  { stat: "1,000+",body: "Decks reviewed by a typical VC per year" },
  { stat: "93%",   body: "Of VCs say team quality is the #1 factor" },
  { stat: "$4.2M", body: "Average seed round size in 2024" },
  { stat: "20s",   body: "Time before a VC forms a first impression" },
];

interface RecoveryState {
  action: RecoveryAction;
  message: string;
  attempt: number | null;
}

// ── Recovery UI ───────────────────────────────────────────────────────────────
function RecoveryPanel({ recovery, id }: { recovery: RecoveryState; id: string }) {
  const router = useRouter();
  const [retrying, setRetrying] = useState(false);

  const retry = async () => {
    setRetrying(true);
    await fetch(`/api/analyse/${id}`, { method: "POST" }).catch(console.error);
    router.refresh();
    setRetrying(false);
  };

  if (recovery.action === "AUTO_RETRY") {
    return (
      <div style={panelStyle}>
        <Spinner />
        <h2 style={headingStyle}>Retrying your analysis...</h2>
        <p style={bodyStyle}>{recovery.message}</p>
        {recovery.attempt && (
          <p style={{ ...bodyStyle, color: "#6B7280", fontSize: "12px" }}>
            Attempt {recovery.attempt} of 3
          </p>
        )}
      </div>
    );
  }

  if (recovery.action === "REQUEST_REUPLOAD") {
    return (
      <div style={panelStyle}>
        <div style={iconStyle("rgba(3,251,131,0.1)", GREEN)}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M12 16v-4M12 8h.01" stroke={GREEN} strokeWidth="2" strokeLinecap="round"/>
            <circle cx="12" cy="12" r="9" stroke={GREEN} strokeWidth="2"/>
          </svg>
        </div>
        <h2 style={headingStyle}>Re-upload needed</h2>
        <p style={bodyStyle}>{recovery.message}</p>
        <a href="/investment-score/upload" style={btnStyle(GREEN, "#000")}>Re-upload your deck →</a>
      </div>
    );
  }

  if (recovery.action === "ESCALATE_TO_SUPPORT") {
    return (
      <div style={panelStyle}>
        <div style={iconStyle("rgba(3,251,131,0.1)", GREEN)}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 01-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 011-.97l7-2a1 1 0 01.55 0l7 2A1 1 0 0120 6v7z" stroke={GREEN} strokeWidth="2"/>
          </svg>
        </div>
        <h2 style={headingStyle}>Our team is on it</h2>
        <p style={bodyStyle}>{recovery.message}</p>
        <div style={{ display: "flex", gap: "10px", justifyContent: "center", flexWrap: "wrap" }}>
          <button onClick={retry} disabled={retrying} style={btnStyle(GREEN, "#000")}>
            {retrying ? "Retrying..." : "Try again"}
          </button>
          <a href="/investment-score/upload" style={btnStyle("transparent", "#6B7280", "1px solid #374151")}>
            Start fresh
          </a>
        </div>
      </div>
    );
  }

  return (
    <div style={panelStyle}>
      <div style={iconStyle("rgba(239,68,68,0.12)", "#EF4444")}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path d="M12 9v4M12 17h.01" stroke="#EF4444" strokeWidth="2" strokeLinecap="round"/>
          <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" stroke="#EF4444" strokeWidth="2"/>
        </svg>
      </div>
      <h2 style={headingStyle}>Something went wrong</h2>
      <p style={bodyStyle}>{recovery.message}</p>
      <div style={{ display: "flex", gap: "10px", justifyContent: "center", flexWrap: "wrap" }}>
        <button onClick={retry} disabled={retrying} style={btnStyle(GREEN, "#000")}>
          {retrying ? "Retrying..." : "Try again"}
        </button>
        <a href="/investment-score/upload" style={btnStyle("transparent", "#6B7280", "1px solid #374151")}>
          Start fresh
        </a>
      </div>
    </div>
  );
}

function Spinner() {
  return (
    <div style={{
      width: "10px", height: "10px", borderRadius: "50%",
      border: `2px solid rgba(3,251,131,0.3)`, borderTopColor: GREEN,
      animation: "spin 0.7s linear infinite", flexShrink: 0,
    }} />
  );
}

const panelStyle: React.CSSProperties = {
  maxWidth: "460px", textAlign: "center", padding: "40px 32px",
  background: "#161616", border: "1px solid #242424", borderRadius: "20px",
};
const headingStyle: React.CSSProperties = {
  fontSize: "22px", fontWeight: 700, color: "#fff", marginBottom: "12px",
};
const bodyStyle: React.CSSProperties = {
  fontSize: "14px", color: "#9CA3AF", lineHeight: 1.75, marginBottom: "24px",
};
function iconStyle(bg: string, border: string): React.CSSProperties {
  return {
    width: "52px", height: "52px", borderRadius: "14px",
    background: bg, border: `1px solid ${border}`,
    display: "flex", alignItems: "center", justifyContent: "center",
    margin: "0 auto 20px",
  };
}
function btnStyle(bg: string, color = "#fff", border?: string): React.CSSProperties {
  return {
    display: "inline-block", padding: "11px 22px",
    background: bg, color, border: border ?? "none",
    borderRadius: "10px", fontSize: "14px", fontWeight: 600,
    cursor: "pointer", textDecoration: "none",
  };
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function AnalysingPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [elapsed, setElapsed] = useState(0);
  const [businessName, setBusinessName] = useState<string | null>(null);
  const [factIdx, setFactIdx] = useState(0);
  const [recovery, setRecovery] = useState<RecoveryState | null>(null);
  const stoppedRef = useRef(false);
  const doneRef = useRef(false);

  // 120-second countdown progress
  useEffect(() => {
    if (doneRef.current) return;
    const t = setInterval(() => {
      setElapsed(prev => {
        if (prev >= TOTAL_SECONDS) { clearInterval(t); return TOTAL_SECONDS; }
        return prev + 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, []);

  // Rotate "Did you know?" facts every 8 seconds
  useEffect(() => {
    const t = setInterval(() => setFactIdx(i => (i + 1) % FACTS.length), 8000);
    return () => clearInterval(t);
  }, []);

  // Trigger analysis + poll for completion
  useEffect(() => {
    if (!id) return;
    stoppedRef.current = false;

    const checkStatus = async () => {
      if (stoppedRef.current) return;
      try {
        const res = await fetch(`/api/status/${id}`);
        if (!res.ok) return;
        const data = await res.json();

        if (businessName === null && data.business_name) {
          setBusinessName(data.business_name);
        }

        if (data.status === "complete") {
          stoppedRef.current = true;
          doneRef.current = true;
          setElapsed(TOTAL_SECONDS);
          posthog.capture("analysis_completed", {
            submission_id: id,
            score: data.score,
            verdict: data.verdict,
            verdictType: data.verdict_type,
          });
          setTimeout(() => router.push(`/investment-score/results/${id}`), 400);
        } else if (data.status === "error") {
          stoppedRef.current = true;
          setRecovery({
            action: data.recovery_action ?? "FAIL_GRACEFULLY",
            message: data.recovery_message ?? "Something went wrong. Please try again.",
            attempt: data.recovery_attempt ?? null,
          });
        } else if (data.status === "analysing" && data.recovery_action === "AUTO_RETRY") {
          setRecovery({
            action: "AUTO_RETRY",
            message: data.recovery_message ?? "Retrying your analysis...",
            attempt: data.recovery_attempt,
          });
        } else {
          setRecovery(null);
        }
      } catch {
        // Ignore transient network errors
      }
    };

    checkStatus();
    fetch(`/api/analyse/${id}`, { method: "POST" }).catch(console.error);
    const intervalId = setInterval(checkStatus, 3000);
    return () => { stoppedRef.current = true; clearInterval(intervalId); };
  }, [id, router]); // eslint-disable-line react-hooks/exhaustive-deps

  const progress = Math.min((elapsed / TOTAL_SECONDS) * 100, doneRef.current ? 100 : 99);
  const activeStep = Math.min(Math.floor((progress / 100) * STEPS.length), STEPS.length - 1);
  const fact = FACTS[factIdx];

  return (
    <main style={{
      minHeight: "100vh", background: "#0A0A0A", color: "#F8FAFC",
      display: "flex", flexDirection: "column", fontFamily: "Inter, sans-serif",
    }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadein { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>

      {/* Nav */}
      <nav style={{ borderBottom: "1px solid #111927", padding: "0 24px", flexShrink: 0 }}>
        <div style={{ maxWidth: "1100px", margin: "0 auto", height: "64px", display: "flex", alignItems: "center" }}>
          <a href="/investment-score" style={{ display: "flex" }}>
            <img src="https://raw.githubusercontent.com/edwardjanes/source-capital/0147b27fad891686f67559992e43319411f07ba4/logo.png" alt="Source Capital" style={{ height: "32px", width: "auto" }} />
          </a>
        </div>
      </nav>

      {/* Content */}
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "48px 24px" }}>
      {recovery ? (
        <RecoveryPanel recovery={recovery} id={id ?? ""} />
      ) : (
        <div style={{ width: "100%", maxWidth: "680px", display: "flex", flexDirection: "column", gap: "24px" }}>

          {/* Title */}
          <div style={{ textAlign: "center", marginBottom: "8px" }}>
            <h1 style={{ fontSize: "32px", fontWeight: 700, marginBottom: "10px", letterSpacing: "-0.5px" }}>
              Analyzing your deck
            </h1>
            <p style={{ fontSize: "15px", color: "#6B7280" }}>
              Our AI is reviewing every slide against VC criteria
            </p>
          </div>

          {/* Progress bar */}
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
              <span style={{ fontSize: "13px", color: GREEN, fontWeight: 600 }}>
                {Math.round(progress)}% complete
              </span>
              {businessName && (
                <span style={{ fontSize: "13px", color: "#4B5563" }}>{businessName}</span>
              )}
            </div>
            <div style={{ height: "4px", background: "#1A1A1A", borderRadius: "2px", overflow: "hidden" }}>
              <div style={{
                height: "100%", width: `${progress}%`,
                background: GREEN, borderRadius: "2px",
                transition: "width 1s linear",
                boxShadow: `0 0 8px rgba(3,251,131,0.5)`,
              }} />
            </div>
          </div>

          {/* Step list */}
          <div style={{
            background: "#111111", border: "1px solid #1E1E1E",
            borderRadius: "14px", padding: "20px 24px",
            display: "flex", flexDirection: "column", gap: "14px",
          }}>
            {STEPS.map((step, i) => {
              const done = i < activeStep;
              const active = i === activeStep;
              return (
                <div key={step} style={{
                  display: "flex", alignItems: "center", gap: "12px",
                  opacity: done || active ? 1 : 0.3,
                  transition: "opacity 0.5s ease",
                }}>
                  {/* Icon */}
                  <div style={{ flexShrink: 0, width: "18px", height: "18px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {done ? (
                      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                        <circle cx="9" cy="9" r="8.5" stroke={GREEN} strokeOpacity="0.4"/>
                        <path d="M5.5 9L7.8 11.5L12.5 6.5" stroke={GREEN} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    ) : active ? (
                      <Spinner />
                    ) : (
                      <div style={{ width: "10px", height: "10px", borderRadius: "50%", border: "1.5px solid #333" }} />
                    )}
                  </div>
                  {/* Label */}
                  <span style={{
                    fontSize: "14px", fontFamily: "ui-monospace, 'Cascadia Code', monospace",
                    color: done ? "#9CA3AF" : active ? "#F8FAFC" : "#4B5563",
                    fontWeight: active ? 500 : 400,
                  }}>
                    {step}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Did you know */}
          <div>
            <p style={{ fontSize: "11px", color: "#4B5563", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", textAlign: "center", marginBottom: "10px" }}>
              Did you know?
            </p>
            <div key={factIdx} style={{
              background: "#111111", border: "1px solid #1E1E1E",
              borderRadius: "14px", padding: "28px 24px", textAlign: "center",
              animation: "fadein 0.5s ease",
            }}>
              <p style={{ fontSize: "36px", fontWeight: 800, color: GREEN, marginBottom: "8px", lineHeight: 1 }}>
                {fact.stat}
              </p>
              <p style={{ fontSize: "14px", color: "#9CA3AF" }}>{fact.body}</p>
            </div>
          </div>

        </div>
      )}
      </div>
    </main>
  );
}
