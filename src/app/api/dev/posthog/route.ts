import { NextRequest, NextResponse } from "next/server";

const PROJECT_ID = process.env.POSTHOG_PROJECT_ID ?? "410172";
const BASE = `https://us.posthog.com/api/projects/${PROJECT_ID}`;

async function phQuery(query: object) {
  const key = process.env.POSTHOG_PERSONAL_API_KEY;
  if (!key) throw new Error("POSTHOG_PERSONAL_API_KEY not set in .env.local");

  const res = await fetch(`${BASE}/query/`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query }),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.detail ?? JSON.stringify(data));
  return data;
}

export async function POST(req: NextRequest) {
  try {
    const { dateFrom } = await req.json();

    const [funnel, pageviews] = await Promise.all([
      phQuery({
        kind: "FunnelsQuery",
        dateRange: { date_from: dateFrom },
        funnelsFilter: { funnelWindowInterval: 14, funnelWindowIntervalUnit: "day" },
        series: [
          {
            kind: "EventsNode",
            event: "$pageview",
            name: "Visited /investment-score",
            properties: [{ key: "$pathname", value: "/investment-score", operator: "exact", type: "event" }],
          },
          { kind: "EventsNode", event: "cta_clicked",        name: "Clicked CTA" },
          { kind: "EventsNode", event: "lead_captured",      name: "Submitted Lead Form" },
          { kind: "EventsNode", event: "deck_uploaded",      name: "Uploaded Deck" },
          { kind: "EventsNode", event: "results_viewed",     name: "Viewed Results" },
          { kind: "EventsNode", event: "checkout_initiated", name: "Clicked Checkout" },
        ],
      }),
      phQuery({
        kind: "TrendsQuery",
        dateRange: { date_from: dateFrom },
        interval: "day",
        series: [
          {
            kind: "EventsNode",
            event: "$pageview",
            math: "total",
            properties: [{ key: "$pathname", value: "/investment-score", operator: "exact", type: "event" }],
          },
        ],
      }),
    ]);

    return NextResponse.json({ funnel, pageviews });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}
