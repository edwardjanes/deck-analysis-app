"use client";

import { useState, useEffect, useCallback } from "react";

const PERIODS = [
  { label: "7 days",  dateFrom: "-7d" },
  { label: "14 days", dateFrom: "-14d" },
  { label: "30 days", dateFrom: "-30d" },
  { label: "90 days", dateFrom: "-90d" },
];

const GREEN = "#03fb83";
const CARD = "#0F1929";
const BORDER = "#1A2438";
const MUTED = "#6B7280";

interface FunnelStep {
  name: string;
  count: number;
  average_conversion_time: number | null;
}

interface DailyPoint {
  day: string;
  count: number;
}

interface AnalyticsData {
  funnel: { result: FunnelStep[] };
  pageviews: { result: [{ data: number[]; labels: string[] }] };
}

function fmt(n: number) {
  return n.toLocaleString();
}

function pct(a: number, b: number) {
  if (!b) return "—";
  return `${((a / b) * 100).toFixed(1)}%`;
}

function fmtTime(seconds: number | null) {
  if (!seconds) return "—";
  if (seconds < 60) return `${Math.round(seconds)}s`;
  if (seconds < 3600) return `${Math.round(seconds / 60)}m`;
  return `${(seconds / 3600).toFixed(1)}h`;
}

function FunnelBar({ step, top, index }: { step: FunnelStep; top: number; index: number }) {
  const ratio = top > 0 ? step.count / top : 0;
  const color = ratio >= 0.5 ? GREEN : ratio >= 0.25 ? "#FBBF24" : "#EF4444";
  const isTop = index === 0;

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "16px", padding: "14px 0", borderBottom: `1px solid ${BORDER}` }}>
      {/* Step number */}
      <div style={{
        width: "28px", height: "28px", borderRadius: "50%", flexShrink: 0,
        background: isTop ? GREEN : "rgba(255,255,255,0.06)",
        border: isTop ? "none" : `1px solid ${BORDER}`,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: "12px", fontWeight: 700, color: isTop ? "#000" : MUTED,
      }}>
        {index + 1}
      </div>

      {/* Name + bar */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
          <span style={{ fontSize: "14px", color: "#E2E8F0", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {step.name}
          </span>
          <div style={{ display: "flex", gap: "16px", flexShrink: 0, marginLeft: "12px" }}>
            <span style={{ fontSize: "14px", fontWeight: 700, color: "#fff" }}>{fmt(step.count)}</span>
            {!isTop && (
              <span style={{ fontSize: "13px", color, fontWeight: 600, minWidth: "52px", textAlign: "right" }}>
                {pct(step.count, top)}
              </span>
            )}
          </div>
        </div>
        <div style={{ height: "6px", background: "#1A2438", borderRadius: "3px" }}>
          <div style={{
            height: "100%", width: `${ratio * 100}%`, background: color,
            borderRadius: "3px", transition: "width 0.8s cubic-bezier(0.4,0,0.2,1)",
          }} />
        </div>
        {step.average_conversion_time && (
          <p style={{ fontSize: "11px", color: MUTED, marginTop: "4px" }}>
            avg time from previous: {fmtTime(step.average_conversion_time)}
          </p>
        )}
      </div>
    </div>
  );
}

function MiniChart({ points }: { points: DailyPoint[] }) {
  if (!points.length) return null;
  const max = Math.max(...points.map(p => p.count), 1);
  const w = 600;
  const h = 80;
  const pad = 4;
  const step = (w - pad * 2) / (points.length - 1 || 1);

  const coords = points.map((p, i) => ({
    x: pad + i * step,
    y: h - pad - ((p.count / max) * (h - pad * 2)),
  }));

  const pathD = coords.map((c, i) => `${i === 0 ? "M" : "L"} ${c.x} ${c.y}`).join(" ");
  const areaD = `${pathD} L ${coords[coords.length - 1].x} ${h} L ${coords[0].x} ${h} Z`;

  return (
    <svg viewBox={`0 0 ${w} ${h}`} style={{ width: "100%", height: "80px" }}>
      <defs>
        <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={GREEN} stopOpacity="0.25" />
          <stop offset="100%" stopColor={GREEN} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={areaD} fill="url(#chartGrad)" />
      <path d={pathD} fill="none" stroke={GREEN} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      {coords.map((c, i) => (
        <circle key={i} cx={c.x} cy={c.y} r="3" fill={GREEN} />
      ))}
    </svg>
  );
}

export default function AnalyticsDashboard() {
  const [period, setPeriod] = useState(PERIODS[0]);
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (dateFrom: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/dev/posthog", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dateFrom }),
      });
      const json = await res.json();
      if (!res.ok || json.error) throw new Error(json.error ?? "Failed to fetch");
      setData(json);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(period.dateFrom);
  }, [period, load]);

  const steps: FunnelStep[] = data?.funnel?.results ?? [];
  const top = steps[0]?.count ?? 0;
  const bottom = steps[steps.length - 1]?.count ?? 0;

  const trendResult = data?.pageviews?.results?.[0];
  const dailyPoints: DailyPoint[] = trendResult
    ? trendResult.labels.map((label, i) => ({ day: label, count: trendResult.data[i] }))
    : [];
  const totalPageviews = dailyPoints.reduce((s, p) => s + p.count, 0);

  return (
    <main style={{ minHeight: "100vh", background: "#080C14", color: "#F8FAFC", padding: "48px 32px", fontFamily: "Inter, sans-serif" }}>
      <div style={{ maxWidth: "860px", margin: "0 auto" }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "32px", flexWrap: "wrap", gap: "16px" }}>
          <div>
            <h1 style={{ fontSize: "22px", fontWeight: 700, marginBottom: "4px" }}>Analytics</h1>
            <p style={{ fontSize: "13px", color: MUTED }}>Investment Score funnel — local only</p>
          </div>

          {/* Period selector */}
          <div style={{ display: "flex", gap: "6px", background: CARD, border: `1px solid ${BORDER}`, borderRadius: "10px", padding: "4px" }}>
            {PERIODS.map(p => (
              <button
                key={p.label}
                onClick={() => setPeriod(p)}
                style={{
                  padding: "7px 14px", borderRadius: "7px", border: "none",
                  background: period.label === p.label ? GREEN : "transparent",
                  color: period.label === p.label ? "#000" : MUTED,
                  fontSize: "13px", fontWeight: 600, cursor: "pointer",
                  transition: "all 0.15s",
                }}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)", borderRadius: "10px", padding: "14px 18px", marginBottom: "24px", fontSize: "14px", color: "#EF4444" }}>
            {error.includes("POSTHOG_PERSONAL_API_KEY") ? (
              <>
                <strong>API key missing.</strong> Add your PostHog Personal API Key to <code style={{ background: "rgba(239,68,68,0.15)", padding: "2px 6px", borderRadius: "4px" }}>.env.local</code>:<br />
                <code style={{ background: "rgba(239,68,68,0.15)", padding: "2px 6px", borderRadius: "4px", marginTop: "6px", display: "inline-block" }}>
                  POSTHOG_PERSONAL_API_KEY=phx_your_key_here
                </code>
                <br /><span style={{ fontSize: "12px", color: MUTED, marginTop: "4px", display: "block" }}>
                  Get it from PostHog → Settings → Personal API keys
                </span>
              </>
            ) : error}
          </div>
        )}

        {/* Summary cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px", marginBottom: "24px" }}>
          {[
            { label: "Page Visits", value: loading ? "—" : fmt(totalPageviews), sub: "/investment-score" },
            { label: "Entered Funnel", value: loading ? "—" : fmt(top), sub: "unique visitors" },
            { label: "Overall Conversion", value: loading ? "—" : pct(bottom, top), sub: "visit → checkout" },
          ].map(card => (
            <div key={card.label} style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: "12px", padding: "20px 24px" }}>
              <p style={{ fontSize: "12px", color: MUTED, fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: "8px" }}>{card.label}</p>
              <p style={{ fontSize: "28px", fontWeight: 800, color: "#fff", lineHeight: 1 }}>{card.value}</p>
              <p style={{ fontSize: "12px", color: "#374151", marginTop: "4px" }}>{card.sub}</p>
            </div>
          ))}
        </div>

        {/* Daily trend chart */}
        <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: "12px", padding: "20px 24px", marginBottom: "24px" }}>
          <p style={{ fontSize: "13px", color: MUTED, fontWeight: 600, marginBottom: "12px", textTransform: "uppercase", letterSpacing: "0.07em" }}>
            Daily page visits — /investment-score
          </p>
          {loading ? (
            <div style={{ height: "80px", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Spinner />
            </div>
          ) : (
            <MiniChart points={dailyPoints} />
          )}
        </div>

        {/* Funnel */}
        <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: "12px", padding: "24px 28px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "4px" }}>
            <p style={{ fontSize: "13px", color: MUTED, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.07em" }}>
              Conversion Funnel
            </p>
            <p style={{ fontSize: "12px", color: MUTED }}>14-day window</p>
          </div>

          {loading ? (
            <div style={{ padding: "48px 0", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Spinner />
            </div>
          ) : steps.length === 0 ? (
            <p style={{ color: MUTED, fontSize: "14px", padding: "32px 0", textAlign: "center" }}>
              No data yet — events will appear once users visit the app.
            </p>
          ) : (
            <>
              {steps.map((step, i) => (
                <FunnelBar key={step.name} step={step} top={top} index={i} />
              ))}

              {/* Step-to-step drop-off table */}
              <div style={{ marginTop: "20px", padding: "16px", background: "rgba(255,255,255,0.03)", borderRadius: "8px" }}>
                <p style={{ fontSize: "12px", color: MUTED, fontWeight: 600, marginBottom: "12px", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                  Step-by-step drop-off
                </p>
                <div style={{ display: "grid", gridTemplateColumns: "1fr auto auto", gap: "6px 24px", fontSize: "13px" }}>
                  <span style={{ color: MUTED, fontWeight: 600 }}>Step</span>
                  <span style={{ color: MUTED, fontWeight: 600, textAlign: "right" }}>Converted</span>
                  <span style={{ color: MUTED, fontWeight: 600, textAlign: "right" }}>Dropped</span>
                  {steps.slice(1).map((step, i) => {
                    const prev = steps[i].count;
                    const curr = step.count;
                    const dropped = prev - curr;
                    const convRate = prev > 0 ? ((curr / prev) * 100).toFixed(0) : "0";
                    return (
                      <>
                        <span key={`n-${i}`} style={{ color: "#CBD5E1" }}>
                          {steps[i].name} → {step.name}
                        </span>
                        <span key={`c-${i}`} style={{ color: GREEN, fontWeight: 700, textAlign: "right" }}>
                          {convRate}%
                        </span>
                        <span key={`d-${i}`} style={{ color: dropped > 0 ? "#EF4444" : MUTED, textAlign: "right" }}>
                          −{fmt(dropped)}
                        </span>
                      </>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </div>

        <p style={{ textAlign: "center", fontSize: "12px", color: "#1F2937", marginTop: "24px" }}>
          Local only · <a href="/dev" style={{ color: MUTED, textDecoration: "none" }}>← Back to Dev Tools</a>
        </p>
      </div>
    </main>
  );
}

function Spinner() {
  return (
    <>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <div style={{ width: "24px", height: "24px", border: "2px solid #1A2438", borderTopColor: GREEN, borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
    </>
  );
}
