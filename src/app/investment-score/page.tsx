"use client";

import { useState } from "react";
import posthog from "posthog-js";
import LeadModal from "@/components/LeadModal";

// Mock data for the hero score card preview
const MOCK_SECTIONS = [
  { name: "Problem", score: 8, weight: 10 },
  { name: "Solution", score: 7, weight: 15 },
  { name: "Market", score: 5, weight: 15 },
  { name: "Business Model", score: 6, weight: 10 },
  { name: "Traction", score: 4, weight: 20 },
  { name: "Team", score: 9, weight: 15 },
  { name: "Financials", score: 6, weight: 10 },
  { name: "Competition", score: 7, weight: 5 },
];

const DIMENSIONS = [
  { icon: "🎯", name: "Problem Clarity", desc: "Is the pain real, quantified, and urgent?" },
  { icon: "💡", name: "Solution & Moat", desc: "Differentiation and defensibility" },
  { icon: "📈", name: "Market Size", desc: "TAM/SAM/SOM credibility and methodology" },
  { icon: "💰", name: "Business Model", desc: "Revenue clarity and unit economics" },
  { icon: "🚀", name: "Traction", desc: "Revenue, customers, and PMF signals" },
  { icon: "👥", name: "Team", desc: "Domain expertise and track record" },
  { icon: "📊", name: "Financials", desc: "Projections, runway, and assumptions" },
  { icon: "⚔️", name: "Competition", desc: "Awareness, positioning, and why you win" },
];

const STEPS = [
  {
    num: "01",
    title: "Tell us about yourself",
    desc: "Enter your name and email so we know where to send your results.",
  },
  {
    num: "02",
    title: "Upload your deck",
    desc: "Share your business details and upload your pitch deck PDF.",
  },
  {
    num: "03",
    title: "Get your score",
    desc: "Our AI analyses 8 investor criteria and returns your score in under 60 seconds.",
  },
];

function ScoreArc({ score }: { score: number }) {
  const r = 52;
  const circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;
  const color = score >= 70 ? "#10B981" : score >= 50 ? "#F59E0B" : "#EF4444";
  return (
    <div style={{ position: "relative", width: 130, height: 130 }}>
      <svg width="130" height="130" style={{ transform: "rotate(-90deg)" }}>
        <circle cx="65" cy="65" r={r} fill="none" stroke="#1A2438" strokeWidth="9" />
        <circle
          cx="65" cy="65" r={r}
          fill="none"
          stroke={color}
          strokeWidth="9"
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 1.5s ease-out" }}
        />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        <span style={{ fontSize: "30px", fontWeight: 800, color: "#F8FAFC", lineHeight: 1 }}>{score}</span>
        <span style={{ fontSize: "11px", color: "#64748B" }}>/100</span>
      </div>
    </div>
  );
}

function ScoreBar({ score, name }: { score: number; name: string }) {
  const pct = (score / 10) * 100;
  const color = score >= 7 ? "#10B981" : score >= 5 ? "#F59E0B" : "#EF4444";
  return (
    <div style={{ marginBottom: "8px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
        <span style={{ fontSize: "11px", color: "#64748B" }}>{name}</span>
        <span style={{ fontSize: "11px", fontWeight: 600, color }}>
          {score}/10
        </span>
      </div>
      <div style={{ height: "4px", background: "#1A2438", borderRadius: "2px" }}>
        <div style={{ height: "100%", width: `${pct}%`, background: color, borderRadius: "2px", transition: "width 1s ease-out" }} />
      </div>
    </div>
  );
}

export default function InvestmentScorePage() {
  const [showModal, setShowModal] = useState(false);

  return (
    <main style={{ minHeight: "100vh", background: "#080C14", color: "#F8FAFC" }}>
      {showModal && <LeadModal onClose={() => setShowModal(false)} />}

      {/* ── NAV ── */}
      <nav style={{ borderBottom: "1px solid #111927", padding: "0 24px" }}>
        <div style={{ maxWidth: "1100px", margin: "0 auto", height: "64px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center" }}>
            <img src="https://raw.githubusercontent.com/edwardjanes/source-capital/0147b27fad891686f67559992e43319411f07ba4/logo.png" alt="Source Capital" style={{ height: "32px", width: "auto" }} />
          </div>
          <button
            onClick={() => { posthog.capture("cta_clicked", { location: "investment_score" }); setShowModal(true); }}
            style={{ padding: "8px 18px", background: "rgba(3,251,131,0.12)", border: "1px solid rgba(3,251,131,0.3)", borderRadius: "8px", color: "#02d970", fontSize: "13px", fontWeight: 500, cursor: "pointer" }}
          >
            Analyse My Deck
          </button>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section style={{ padding: "80px 24px 60px" }}>
        <div style={{ maxWidth: "1100px", margin: "0 auto", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "60px", alignItems: "center" }}>

          {/* Left */}
          <div>
            <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", background: "rgba(3,251,131,0.1)", border: "1px solid rgba(3,251,131,0.25)", borderRadius: "20px", padding: "5px 12px", marginBottom: "24px" }}>
              <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#03fb83", display: "inline-block" }} />
              <span style={{ fontSize: "12px", color: "#02d970", fontWeight: 500 }}>AI-Powered Pitch Analysis</span>
            </div>

            <h1 style={{ fontSize: "48px", fontWeight: 800, lineHeight: 1.1, marginBottom: "20px" }}>
              Find out exactly what{" "}
              <span className="gradient-text">investors think</span>{" "}
              of your deck
            </h1>

            <p style={{ fontSize: "17px", color: "#94A3B8", lineHeight: 1.7, marginBottom: "32px", maxWidth: "480px" }}>
              Upload your pitch deck and get an instant, unfiltered AI analysis across 8 key investor evaluation criteria — the same lens a VC partner uses in a first-pass review.
            </p>

            <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", marginBottom: "32px" }}>
              {["8 weighted dimensions", "60-second results", "Investor perspective", "Free"].map((label) => (
                <span key={label} style={{ display: "flex", alignItems: "center", gap: "5px", fontSize: "13px", color: "#64748B" }}>
                  <span style={{ color: "#10B981" }}>✓</span> {label}
                </span>
              ))}
            </div>

            <button
              onClick={() => { posthog.capture("cta_clicked", { location: "investment_score" }); setShowModal(true); }}
              style={{
                padding: "14px 28px",
                background: "linear-gradient(135deg, #03fb83, #03fb83)",
                border: "none",
                borderRadius: "10px",
                color: "#fff",
                fontSize: "15px",
                fontWeight: 600,
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                boxShadow: "0 0 30px rgba(3,251,131,0.35)",
                transition: "transform 0.15s, box-shadow 0.15s",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 0 40px rgba(3,251,131,0.5)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 0 30px rgba(3,251,131,0.35)"; }}
            >
              Analyse My Deck — Free
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </button>
          </div>

          {/* Right — Mock Score Card */}
          <div style={{ display: "flex", justifyContent: "center" }}>
            <div style={{ background: "#0D1420", border: "1px solid #1A2438", borderRadius: "16px", padding: "28px", width: "100%", maxWidth: "360px", boxShadow: "0 20px 60px rgba(0,0,0,0.4)" }}>

              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
                <div>
                  <p style={{ fontSize: "11px", color: "#475569", marginBottom: "4px", textTransform: "uppercase", letterSpacing: "0.06em" }}>Sample Analysis</p>
                  <p style={{ fontSize: "15px", fontWeight: 600, color: "#F8FAFC" }}>TechStartup AI</p>
                </div>
                <ScoreArc score={67} />
              </div>

              <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", background: "rgba(245,158,11,0.12)", border: "1px solid rgba(245,158,11,0.3)", borderRadius: "20px", padding: "4px 10px", marginBottom: "18px" }}>
                <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#F59E0B", display: "inline-block" }} />
                <span style={{ fontSize: "12px", color: "#F59E0B", fontWeight: 500 }}>Strong Consideration</span>
              </div>

              <div style={{ background: "rgba(239,68,68,0.07)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: "8px", padding: "10px 12px", marginBottom: "8px" }}>
                <p style={{ fontSize: "10px", color: "#EF4444", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "4px" }}>Most Damaging Issue</p>
                <p style={{ fontSize: "12px", color: "#CBD5E1" }}>Market sizing relies on top-down TAM with no bottom-up validation</p>
              </div>

              <div style={{ background: "rgba(16,185,129,0.07)", border: "1px solid rgba(16,185,129,0.2)", borderRadius: "8px", padding: "10px 12px", marginBottom: "16px" }}>
                <p style={{ fontSize: "10px", color: "#10B981", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "4px" }}>Best Asset</p>
                <p style={{ fontSize: "12px", color: "#CBD5E1" }}>Founding team has 8 years of direct domain expertise with two prior exits</p>
              </div>

              {MOCK_SECTIONS.map((s) => (
                <ScoreBar key={s.name} score={s.score} name={s.name} />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section style={{ padding: "60px 24px", borderTop: "1px solid #111927" }}>
        <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: "48px" }}>
            <p style={{ fontSize: "12px", color: "#03fb83", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "12px" }}>How It Works</p>
            <h2 style={{ fontSize: "34px", fontWeight: 700 }}>Three steps to your score</h2>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "24px" }}>
            {STEPS.map((step) => (
              <div key={step.num} style={{ background: "#0D1420", border: "1px solid #1A2438", borderRadius: "14px", padding: "28px" }}>
                <div style={{ fontSize: "32px", fontWeight: 800, color: "#1A2438", marginBottom: "12px" }}>{step.num}</div>
                <h3 style={{ fontSize: "16px", fontWeight: 600, marginBottom: "8px", color: "#F1F5F9" }}>{step.title}</h3>
                <p style={{ fontSize: "14px", color: "#64748B", lineHeight: 1.6 }}>{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── WHAT'S ANALYSED ── */}
      <section style={{ padding: "60px 24px", borderTop: "1px solid #111927" }}>
        <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: "48px" }}>
            <p style={{ fontSize: "12px", color: "#03fb83", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "12px" }}>Analysis Framework</p>
            <h2 style={{ fontSize: "34px", fontWeight: 700 }}>8 dimensions. Weighted like a VC would.</h2>
            <p style={{ fontSize: "16px", color: "#64748B", marginTop: "12px" }}>Each dimension is scored 0–10 with a weighted contribution to your overall score.</p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px" }}>
            {DIMENSIONS.map((d) => (
              <div
                key={d.name}
                style={{ background: "#0D1420", border: "1px solid #1A2438", borderRadius: "12px", padding: "20px", transition: "border-color 0.2s" }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = "#2D3748"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = "#1A2438"; }}
              >
                <div style={{ fontSize: "22px", marginBottom: "10px" }}>{d.icon}</div>
                <h3 style={{ fontSize: "14px", fontWeight: 600, marginBottom: "6px", color: "#E2E8F0" }}>{d.name}</h3>
                <p style={{ fontSize: "12px", color: "#475569", lineHeight: 1.5 }}>{d.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── BOTTOM CTA ── */}
      <section style={{ padding: "80px 24px", borderTop: "1px solid #111927" }}>
        <div style={{ maxWidth: "600px", margin: "0 auto", textAlign: "center" }}>
          <div style={{ width: "56px", height: "56px", margin: "0 auto 24px", borderRadius: "14px", background: "linear-gradient(135deg, #03fb83, #03fb83)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M9 12l2 2 4-4M21 12a9 9 0 11-18 0 9 9 0 0118 0z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </div>
          <h2 style={{ fontSize: "36px", fontWeight: 800, marginBottom: "16px", lineHeight: 1.15 }}>
            Ready to know your score?
          </h2>
          <p style={{ fontSize: "16px", color: "#64748B", marginBottom: "32px", lineHeight: 1.7 }}>
            Stop guessing why investors aren't responding. Get an objective, data-driven analysis of your deck — for free.
          </p>
          <button
            onClick={() => { posthog.capture("cta_clicked", { location: "investment_score" }); setShowModal(true); }}
            style={{
              padding: "16px 36px",
              background: "linear-gradient(135deg, #03fb83, #03fb83)",
              border: "none",
              borderRadius: "12px",
              color: "#fff",
              fontSize: "16px",
              fontWeight: 600,
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              boxShadow: "0 0 40px rgba(3,251,131,0.35)",
            }}
          >
            Analyse My Deck — Free
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </button>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ borderTop: "1px solid #111927", padding: "24px", textAlign: "center" }}>
        <p style={{ fontSize: "13px", color: "#374151" }}>
          © {new Date().getFullYear()} DeckScore. Built for founders who want honest feedback.
        </p>
      </footer>
    </main>
  );
}
