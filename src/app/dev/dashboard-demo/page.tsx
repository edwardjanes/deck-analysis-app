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

const DEMO_PIPELINE: Record<string, number> = {
  researching:       12,
  targeted:           9,
  reached_out:        7,
  replied:            5,
  meeting_scheduled:  3,
  meeting_completed:  3,
  follow_up:          2,
  due_diligence:      2,
  term_sheet:         1,
  committed:          1,
};

// Committed investors: 2 × £250k + 1 × £500k = £1M committed of £2M target
const DEMO_RAISE_COMMITTED = 1_000_000;
const DEMO_RAISE_TARGET    = 2_000_000;

export default function DashboardDemoPage() {
  return (
    <DashboardClient
      firstName="Edward"
      plan="pro"
      analysesUsed={3}
      analyses={DEMO_ANALYSES}
      userId="demo-user"
      userEmail="edward@sourcecapital.co.uk"
      crmAccess={true}
      pipelineStageCounts={DEMO_PIPELINE}
      raiseCommitted={DEMO_RAISE_COMMITTED}
      raiseTarget={DEMO_RAISE_TARGET}
    />
  );
}
