"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { RecoveryAction } from "@/lib/errorHandler";

const MESSAGES = [
  "Reading your slides...",
  "Evaluating the problem statement...",
  "Assessing market sizing methodology...",
  "Reviewing your solution differentiation...",
  "Examining traction metrics...",
  "Analysing team credentials...",
  "Checking financial projections...",
  "Scoring competitive positioning...",
  "Calculating your weighted score...",
  "Finalising your analysis...",
];

const ORANGE = "#03fb83";

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
    // Status polling will detect completion — just reload the analysing page
    router.refresh();
    setRetrying(false);
  };

  if (recovery.action === "AUTO_RETRY") {
    return (
      <div style={panelStyle}>
        <Spinner color={ORANGE} />
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
        <div style={iconStyle("rgba(249,115,22,0.15)", ORANGE)}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M12 16v-4M12 8h.01" stroke={ORANGE} strokeWidth="2" strokeLinecap="round"/>
            <circle cx="12" cy="12" r="9" stroke={ORANGE} strokeWidth="2"/>
          </svg>
        </div>
        <h2 style={headingStyle}>Re-upload needed</h2>
        <p style={bodyStyle}>{recovery.message}</p>
        <a href="/upload" style={btnStyle(ORANGE)}>Re-upload your deck →</a>
      </div>
    );
  }

  if (recovery.action === "ESCALATE_TO_SUPPORT") {
    return (
      <div style={panelStyle}>
        <div style={iconStyle("rgba(3,251,131,0.15)", "#02d970")}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 01-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 011-.97l7-2a1 1 0 01.55 0l7 2A1 1 0 0120 6v7z" stroke="#02d970" strokeWidth="2"/>
          </svg>
        </div>
        <h2 style={headingStyle}>Our team is on it</h2>
        <p style={bodyStyle}>{recovery.message}</p>
        <div style={{ display: "flex", gap: "10px", justifyContent: "center", flexWrap: "wrap" }}>
          <button onClick={retry} disabled={retrying} style={btnStyle("#02d970")}>
            {retrying ? "Retrying..." : "Try again"}
          </button>
          <a href="/upload" style={btnStyle("transparent", "#6B7280", "1px solid #374151")}>
            Start fresh
          </a>
        </div>
      </div>
    );
  }

  // FAIL_GRACEFULLY or unknown
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
        <button onClick={retry} disabled={retrying} style={btnStyle(ORANGE)}>
          {retrying ? "Retrying..." : "Try again"}
        </button>
        <a href="/upload" style={btnStyle("transparent", "#6B7280", "1px solid #374151")}>
          Start fresh
        </a>
      </div>
    </div>
  );
}

function Spinner({ color }: { color: string }) {
  return (
    <div style={{ width: "36px", height: "36px", border: `3px solid rgba(255,255,255,0.08)`, borderTopColor: color, borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 20px" }} />
  );
}

const panelStyle: React.CSSProperties = {
  maxWidth: "460px",
  textAlign: "center",
  padding: "40px 32px",
  background: "#161616",
  border: "1px solid #242424",
  borderRadius: "20px",
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
  const [messageIdx, setMessageIdx] = useState(0);
  const [dots, setDots] = useState(".");
  const [recovery, setRecovery] = useState<RecoveryState | null>(null);
  const stoppedRef = useRef(false);

  // Cycle messages while analysing
  useEffect(() => {
    const msgInterval = setInterval(() => {
      setMessageIdx(prev => (prev + 1) % MESSAGES.length);
    }, 3500);
    const dotInterval = setInterval(() => {
      setDots(prev => (prev.length >= 3 ? "." : prev + "."));
    }, 500);
    return () => { clearInterval(msgInterval); clearInterval(dotInterval); };
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

        if (data.status === "complete") {
          stoppedRef.current = true;
          router.push(`/results/${id}`);
        } else if (data.status === "error") {
          stoppedRef.current = true;
          // Show inline recovery UI instead of redirecting
          setRecovery({
            action: data.recovery_action ?? "FAIL_GRACEFULLY",
            message: data.recovery_message ?? "Something went wrong. Please try again.",
            attempt: data.recovery_attempt ?? null,
          });
        } else if (data.status === "analysing" && data.recovery_action === "AUTO_RETRY") {
          // Show retry progress without stopping the poll
          setRecovery({
            action: "AUTO_RETRY",
            message: data.recovery_message ?? "Retrying your analysis...",
            attempt: data.recovery_attempt,
          });
        } else {
          // Back to normal analysing state
          setRecovery(null);
        }
      } catch {
        // Ignore transient network errors
      }
    };

    checkStatus();
    fetch(`/api/analyse/${id}`, { method: "POST" }).catch(console.error);
    const intervalId = setInterval(checkStatus, 3000);

    return () => {
      stoppedRef.current = true;
      clearInterval(intervalId);
    };
  }, [id, router]);

  // Reset recovery state and restart polling when user wants to retry
  const handleRetryReset = () => {
    setRecovery(null);
    stoppedRef.current = false;
  };

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#0A0A0A",
        color: "#F8FAFC",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "40px 24px",
        overflow: "hidden",
        position: "relative",
      }}
    >
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      {/* Background glow */}
      <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: "600px", height: "600px", borderRadius: "50%", background: "radial-gradient(circle, rgba(249,115,22,0.06) 0%, transparent 70%)", pointerEvents: "none" }} />

      {recovery ? (
        <div onClick={recovery.action === "AUTO_RETRY" ? undefined : handleRetryReset} style={{ position: "relative", zIndex: 1 }}>
          <RecoveryPanel recovery={recovery} id={id ?? ""} />
        </div>
      ) : (
        <div style={{ position: "relative", zIndex: 1, display: "flex", flexDirection: "column", alignItems: "center" }}>
          {/* Pulsing rings */}
          <div style={{ position: "relative", width: "200px", height: "200px", marginBottom: "48px" }}>
            {[160, 120, 80].map((size, i) => (
              <div
                key={size}
                style={{
                  position: "absolute", top: "50%", left: "50%",
                  transform: "translate(-50%,-50%)",
                  width: `${size}px`, height: `${size}px`,
                  borderRadius: "50%",
                  border: `1.5px solid rgba(249,115,22,${0.12 + i * 0.08})`,
                }}
              />
            ))}
            <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: "60px", height: "60px", borderRadius: "15px", background: ORANGE, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: `0 0 40px rgba(249,115,22,0.4)` }}>
              <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                <path d="M14 2L26 8V20L14 26L2 20V8L14 2Z" stroke="white" strokeWidth="2" fill="none"/>
                <circle cx="14" cy="14" r="4" fill="white"/>
              </svg>
            </div>
          </div>

          <h1 style={{ fontSize: "28px", fontWeight: 700, marginBottom: "12px", textAlign: "center" }}>
            Analysing your deck
          </h1>

          <p style={{ fontSize: "15px", color: ORANGE, marginBottom: "8px", minHeight: "24px", textAlign: "center", fontWeight: 500 }}>
            {MESSAGES[messageIdx]}{dots}
          </p>

          <p style={{ fontSize: "13px", color: "#6B7280", textAlign: "center", maxWidth: "320px" }}>
            Our AI is reviewing your deck across 8 investor evaluation criteria. This usually takes 30–60 seconds.
          </p>

          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", justifyContent: "center", marginTop: "40px", maxWidth: "480px" }}>
            {["Problem","Solution","Market","Business Model","Traction","Team","Financials","Competition"].map((dim, i) => (
              <span
                key={dim}
                style={{
                  padding: "5px 12px",
                  background: messageIdx >= i ? "rgba(249,115,22,0.12)" : "rgba(26,36,56,0.4)",
                  border: `1px solid ${messageIdx >= i ? "rgba(249,115,22,0.3)" : "#1A2438"}`,
                  borderRadius: "20px", fontSize: "12px",
                  color: messageIdx >= i ? ORANGE : "#374151",
                  transition: "all 0.5s ease",
                }}
              >
                {messageIdx >= i && <span style={{ marginRight: "5px" }}>✓</span>}{dim}
              </span>
            ))}
          </div>
        </div>
      )}
    </main>
  );
}
