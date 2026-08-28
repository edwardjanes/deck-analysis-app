import DashboardClient from "@/app/dashboard/DashboardClient";

export const dynamic = "force-dynamic";

const DEMO_ANALYSES = [
  {
    id: "demo-1",
    business_name: "Wellvyl",
    created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    status: "complete",
    score: 74,
    analysis_json: { slideCount: 18 },
  },
  {
    id: "demo-2",
    business_name: "GreenLoop",
    created_at: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000).toISOString(),
    status: "complete",
    score: 58,
    analysis_json: { slideCount: 14 },
  },
  {
    id: "demo-3",
    business_name: "NovaPay",
    created_at: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000).toISOString(),
    status: "complete",
    score: 81,
    analysis_json: { slideCount: 22 },
  },
];

export default function DashboardDemoPage() {
  return (
    <DashboardClient
      firstName="Edward"
      plan="pro"
      analysesUsed={3}
      analyses={DEMO_ANALYSES}
      userId="demo-user"
      userEmail="edward@sourcecapital.co.uk"
    />
  );
}
