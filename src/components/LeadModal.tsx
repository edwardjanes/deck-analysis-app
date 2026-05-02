"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface LeadModalProps {
  onClose: () => void;
}

const LOOPS_ENDPOINT =
  "https://app.loops.so/api/newsletter-form/cmn78et4k1pr10izg4si3mbut";

export default function LeadModal({ onClose }: LeadModalProps) {
  const router = useRouter();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Close on ESC
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    // Rate limit check
    const now = Date.now();
    const prev = localStorage.getItem("deckscore-ts");
    if (prev && Number(prev) + 60000 > now) {
      setError("Too many attempts. Please wait a moment and try again.");
      return;
    }
    localStorage.setItem("deckscore-ts", String(now));

    setLoading(true);

    const formBody = [
      `userGroup=Pitch%20Deck%20Review`,
      `mailingLists=`,
      `email=${encodeURIComponent(email)}`,
      `firstName=${encodeURIComponent(firstName)}`,
      `lastName=${encodeURIComponent(lastName)}`,
    ].join("&");

    try {
      const res = await fetch(LOOPS_ENDPOINT, {
        method: "POST",
        body: formBody,
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || "Submission failed");
      }

      // Store lead details for the upload page
      sessionStorage.setItem(
        "deckscore-lead",
        JSON.stringify({ firstName, lastName, email })
      );

      router.push("/upload");
    } catch (err) {
      if (err instanceof Error && err.message === "Failed to fetch") {
        // Cloudflare/network error — treat as rate limit
        setError("Too many attempts. Please try again shortly.");
        localStorage.setItem("deckscore-ts", "");
      } else {
        setError(
          err instanceof Error ? err.message : "Something went wrong. Please try again."
        );
      }
      setLoading(false);
    }
  }

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(5, 8, 16, 0.85)", backdropFilter: "blur(6px)" }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="w-full max-w-md animate-slide-up"
        style={{
          background: "#0D1420",
          border: "1px solid #1A2438",
          borderRadius: "16px",
          padding: "40px 36px",
        }}
      >
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <span
              style={{
                background: "rgba(3,251,131,0.15)",
                color: "#02d970",
                fontSize: "11px",
                fontWeight: 600,
                letterSpacing: "0.08em",
                padding: "4px 10px",
                borderRadius: "20px",
                textTransform: "uppercase",
              }}
            >
              Free Analysis
            </span>
            <button
              onClick={onClose}
              style={{ color: "#4B5563", background: "none", border: "none", cursor: "pointer", fontSize: "20px", lineHeight: 1 }}
              aria-label="Close"
            >
              ×
            </button>
          </div>
          <h2 style={{ fontSize: "22px", fontWeight: 700, color: "#F8FAFC", marginBottom: "8px" }}>
            Where should we send your results?
          </h2>
          <p style={{ fontSize: "14px", color: "#64748B" }}>
            Your analysis will be ready instantly. We'll also send a copy to your inbox.
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ display: "flex", gap: "12px", marginBottom: "14px" }}>
            <div style={{ flex: 1 }}>
              <label
                htmlFor="firstName"
                style={{ display: "block", fontSize: "12px", fontWeight: 500, color: "#94A3B8", marginBottom: "6px" }}
              >
                First name
              </label>
              <input
                id="firstName"
                type="text"
                required
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="Jane"
                style={inputStyle}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label
                htmlFor="lastName"
                style={{ display: "block", fontSize: "12px", fontWeight: 500, color: "#94A3B8", marginBottom: "6px" }}
              >
                Last name
              </label>
              <input
                id="lastName"
                type="text"
                required
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Smith"
                style={inputStyle}
              />
            </div>
          </div>

          <div style={{ marginBottom: "20px" }}>
            <label
              htmlFor="email"
              style={{ display: "block", fontSize: "12px", fontWeight: 500, color: "#94A3B8", marginBottom: "6px" }}
            >
              Email address
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="jane@startup.com"
              style={inputStyle}
            />
          </div>

          {error && (
            <p style={{ fontSize: "13px", color: "#EF4444", marginBottom: "14px" }}>
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              padding: "13px",
              background: loading ? "#4B5563" : "linear-gradient(135deg, #03fb83, #03fb83)",
              color: "#fff",
              border: "none",
              borderRadius: "10px",
              fontSize: "15px",
              fontWeight: 600,
              cursor: loading ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              transition: "opacity 0.2s",
            }}
          >
            {loading ? (
              <>
                <span style={spinnerStyle} />
                Getting started...
              </>
            ) : (
              "Continue to Upload →"
            )}
          </button>

          <p style={{ fontSize: "11px", color: "#374151", textAlign: "center", marginTop: "14px" }}>
            No spam. Unsubscribe any time.
          </p>
        </form>
      </div>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 14px",
  background: "#111927",
  border: "1px solid #1A2438",
  borderRadius: "8px",
  color: "#F8FAFC",
  fontSize: "14px",
  outline: "none",
};

const spinnerStyle: React.CSSProperties = {
  width: "16px",
  height: "16px",
  border: "2px solid rgba(255,255,255,0.3)",
  borderTopColor: "#fff",
  borderRadius: "50%",
  animation: "spin 0.7s linear infinite",
  display: "inline-block",
};
