import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import Anthropic from "@anthropic-ai/sdk";

export const dynamic = "force-dynamic";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

async function getScAdmin() {
  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: profile } = await supabaseAdmin
    .from("profiles").select("sc_admin").eq("id", user.id).single();
  if (!profile?.sc_admin) return null;
  return user;
}

// POST /api/crm/prospects/[id]/score
export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getScAdmin();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: prospect } = await supabaseAdmin
    .from("sc_prospects").select("*").eq("id", params.id).single();
  if (!prospect) return NextResponse.json({ error: "Prospect not found" }, { status: 404 });

  const { data: touchpoints } = await supabaseAdmin
    .from("sc_touchpoints")
    .select("*")
    .eq("prospect_id", params.id)
    .order("occurred_at", { ascending: false });

  const touchpointSummary = touchpoints?.map(t => {
    const parts = [`[${new Date(t.occurred_at).toLocaleDateString("en-GB")}] ${t.type}`];
    if (t.subject) parts.push(`Subject: ${t.subject}`);
    if (t.body) parts.push(t.body.slice(0, 200));
    if (t.fathom_transcript) parts.push(`[Transcript available — ${t.fathom_transcript.length} chars]`);
    return parts.join("\n");
  }).join("\n\n") ?? "No touchpoints yet";

  const transcript = touchpoints?.find(t => t.fathom_transcript)?.fathom_transcript ?? null;

  const prompt = `You are a sales qualification assistant for Source Capital, a UK startup fundraising accelerator. You score inbound prospects on a 0-100 scale based on their fit and likelihood to convert.

## Ideal Customer Profile
- Startup founder or co-founder (not employee)
- Pre-seed to Series A stage
- Actively raising or planning to raise in the next 6 months
- B2B or tech-enabled business
- UK or European based (preferred but not required)
- Open to paying for advisory / investor-readiness support

## Prospect Profile
Name: ${prospect.first_name} ${prospect.last_name ?? ""}
Company: ${prospect.company_name ?? "Not specified"}
Role: ${prospect.role ?? "Not specified"}
Location: ${prospect.location ?? "Not specified"}
Stage: ${prospect.stage.replace(/_/g, " ")}
Notes: ${prospect.notes ?? "None"}

## Interaction History
${touchpointSummary}
${transcript ? `\n## Call Transcript (excerpt)\n${transcript.slice(0, 2000)}` : ""}

## Scoring Criteria
- Role match (founder vs. employee): 0-30 pts
- Fundraising intent and timeline: 0-25 pts
- Business stage and traction: 0-20 pts
- Engagement quality (replied, showed interest): 0-15 pts
- Ideal geography/sector: 0-10 pts

Respond with valid JSON only:
{
  "score": <integer 0-100>,
  "rationale": "<2-3 sentence explanation of the score, what's strong and what's uncertain>",
  "next_action": "<one specific recommended next step>"
}`;

  const response = await anthropic.messages.create({
    model: "claude-opus-4-6",
    max_tokens: 400,
    messages: [{ role: "user", content: prompt }],
  });

  const raw = (response.content[0] as { text: string }).text.trim();
  let parsed: { score: number; rationale: string; next_action: string };

  try {
    // Extract JSON if wrapped in markdown code block
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    parsed = JSON.parse(jsonMatch ? jsonMatch[0] : raw);
  } catch {
    return NextResponse.json({ error: "Failed to parse AI response", raw }, { status: 500 });
  }

  // Persist score back to prospect
  await supabaseAdmin
    .from("sc_prospects")
    .update({
      lead_score: parsed.score,
      lead_score_rationale: parsed.rationale,
      lead_score_updated_at: new Date().toISOString(),
    })
    .eq("id", params.id);

  return NextResponse.json({
    score: parsed.score,
    rationale: parsed.rationale,
    next_action: parsed.next_action,
  });
}