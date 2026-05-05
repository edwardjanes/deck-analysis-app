"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";

const SAVED_SUBMISSIONS = [
  {
    label: "Wellvyl",
    id: "13781e90-d1b2-4fb9-89b3-f365d85dfa20",
  },
];

export default function DevPage() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [cloning, setCloning] = useState<string | null>(null);
  const [paying, setPaying] = useState<string | null>(null);
  const [paid, setPaid] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<string | null>(null);
  const [quickFile, setQuickFile] = useState<File | null>(null);
  const [quickSubmitting, setQuickSubmitting] = useState(false);

  const quickSubmit = async () => {
    if (!quickFile) { setError("Drop a PDF first"); return; }
    setQuickSubmitting(true);
    setError(null);
    const fd = new FormData();
    fd.append("firstName", "Dev");
    fd.append("lastName", "Test");
    fd.append("email", "dev@test.com");
    fd.append("businessName", quickFile.name.replace(".pdf", ""));
    fd.append("website", "https://example.com");
    fd.append("country", "United Kingdom");
    fd.append("deck", quickFile);
    try {
      const res = await fetch("/api/submit", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Submit failed");
      router.push(`/investment-score/analysing/${data.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
      setQuickSubmitting(false);
    }
  };

  const clone = async (sourceId: string, label: string) => {
    setCloning(label);
    setError(null);
    try {
      const res = await fetch("/api/dev/clone", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sourceId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Clone failed");
      router.push(`/investment-score/analysing/${data.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setCloning(null);
    }
  };

  const simulatePayment = async (submissionId: string, label: string) => {
    setPaying(label);
    setError(null);
    try {
      const res = await fetch("/api/whop/webhook", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "payment.completed",
          data: {
            id: `test_order_${Date.now()}`,
            metadata: { submission_id: submissionId },
          },
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Payment simulation failed");
      setPaid(prev => ({ ...prev, [label]: true }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setPaying(null);
    }
  };

  return (
    <main style={{ minHeight: "100vh", background: "#080C14", color: "#F8FAFC", padding: "60px 32px", fontFamily: "monospace" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
        <h1 style={{ fontSize: "20px", fontWeight: 700 }}>Dev Tools</h1>
        <a href="/dev/analytics" style={{ fontSize: "13px", color: "#03fb83", textDecoration: "none", fontWeight: 600 }}>
          → Analytics Dashboard
        </a>
      </div>
      <p style={{ color: "#6B7280", fontSize: "13px", marginBottom: "40px" }}>
        One-click test submissions — clone a deck, simulate payment, view results.
      </p>

      {/* Quick submit */}
      <div style={{ background: "#0F1929", border: "1px solid #1A2438", borderRadius: "10px", padding: "20px", maxWidth: "560px", marginBottom: "32px" }}>
        <div style={{ fontSize: "13px", fontWeight: 700, marginBottom: "12px", color: "#03fb83" }}>Quick Submit — drop a PDF, skip the form</div>
        <div
          onClick={() => fileRef.current?.click()}
          onDragOver={e => e.preventDefault()}
          onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f?.type === "application/pdf") setQuickFile(f); }}
          style={{
            border: `2px dashed ${quickFile ? "#03fb83" : "#1A2438"}`, borderRadius: "8px",
            padding: "20px", textAlign: "center", cursor: "pointer", marginBottom: "12px",
            background: quickFile ? "rgba(3,251,131,0.05)" : "transparent",
          }}
        >
          {quickFile
            ? <span style={{ color: "#03fb83", fontSize: "13px" }}>📄 {quickFile.name} ({(quickFile.size / 1024 / 1024).toFixed(1)} MB)</span>
            : <span style={{ color: "#6B7280", fontSize: "13px" }}>Click or drag a PDF here</span>}
        </div>
        <input ref={fileRef} type="file" accept="application/pdf" style={{ display: "none" }}
          onChange={e => { const f = e.target.files?.[0]; if (f) setQuickFile(f); }} />
        <button
          onClick={quickSubmit}
          disabled={!quickFile || quickSubmitting}
          style={{
            background: quickSubmitting ? "#374151" : "#03fb83", color: "#000",
            border: "none", borderRadius: "8px", padding: "10px 20px",
            fontSize: "13px", fontWeight: 700, cursor: quickFile && !quickSubmitting ? "pointer" : "not-allowed", width: "100%",
          }}
        >
          {quickSubmitting ? "Submitting…" : "Submit & Analyse →"}
        </button>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "12px", maxWidth: "560px" }}>
        {SAVED_SUBMISSIONS.map(({ label, id }) => (
          <div
            key={id}
            style={{
              background: "#0F1929",
              border: "1px solid #1A2438",
              borderRadius: "10px",
              padding: "16px 20px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: "14px" }}>{label}</div>
                <div style={{ color: "#6B7280", fontSize: "11px", marginTop: "2px" }}>{id}</div>
              </div>
              <button
                onClick={() => clone(id, label)}
                disabled={cloning === label}
                style={{
                  background: cloning === label ? "#374151" : "#03fb83",
                  color: "#fff", border: "none", borderRadius: "8px",
                  padding: "8px 16px", fontSize: "13px", fontWeight: 600,
                  cursor: cloning === label ? "not-allowed" : "pointer",
                }}
              >
                {cloning === label ? "Cloning…" : "Re-test →"}
              </button>
            </div>

            {/* Divider */}
            <div style={{ borderTop: "1px solid #1A2438", paddingTop: "12px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontSize: "12px", color: "#6B7280" }}>Simulate Whop payment for this submission</span>
              <button
                onClick={() => simulatePayment(id, label)}
                disabled={paying === label || paid[label]}
                style={{
                  background: paid[label] ? "rgba(34,197,94,0.15)" : paying === label ? "#374151" : "rgba(249,115,22,0.15)",
                  color: paid[label] ? "#22C55E" : paying === label ? "#9CA3AF" : "#F97316",
                  border: `1px solid ${paid[label] ? "rgba(34,197,94,0.3)" : "rgba(249,115,22,0.3)"}`,
                  borderRadius: "8px", padding: "7px 14px", fontSize: "12px", fontWeight: 600,
                  cursor: paid[label] || paying === label ? "not-allowed" : "pointer",
                }}
              >
                {paid[label] ? "✓ Payment simulated" : paying === label ? "Simulating…" : "Simulate payment"}
              </button>
            </div>

            {paid[label] && (
              <div style={{ marginTop: "10px" }}>
                <a
                  href={`/investment-score/results/${id}`}
                  style={{ fontSize: "12px", color: "#03fb83", textDecoration: "none" }}
                >
                  → View unlocked results page
                </a>
              </div>
            )}
          </div>
        ))}
      </div>

      {error && (
        <p style={{ marginTop: "20px", color: "#EF4444", fontSize: "13px" }}>
          Error: {error}
        </p>
      )}
    </main>
  );
}
