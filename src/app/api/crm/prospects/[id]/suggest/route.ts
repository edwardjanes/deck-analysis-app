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

// POST /api/crm/prospects/[id]/suggest
// Body: { touchpoint_id?: string }  — optionally pin to a specific touchpoint's transcript
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getScAdmin();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const { touchpoint_id } = body;

  // Load prospect
  const { data: prospect } = await supabaseAdmin
    .from("sc_prospects").select("*").eq("id", params.id).single();
  if (!prospect) return NextResponse.json({ error: "Prospect not found" }, { status: 404 });

  // Load touchpoints
  const { data: touchpoints } = await supabaseAdmin
    .from("sc_touchpoints")
    .select("*")
    .eq("prospect_id", params.id)
    .order("occurred_at", { ascending: false });

  const targetTouchpoint = touchpoint_id
    ? touchpoints?.find(t => t.id === touchpoint_id)
    : touchpoints?.find(t => t.fathom_transcript);

  const transcript = targetTouchpoint?.fathom_transcript ?? null;

  // Build context for Claude
  const recentMessages = touchpoints?.slice(0, 5).map(t => {
    const lines = [`[${new Date(t.occurred_at).toLocaleDateString("en-GB")}] ${t.type}`];
    if (t.subject) lines.push(`Subject: ${t.subject}`);
    if (t.body) lines.push(t.body.slice(0, 300));
    return lines.join("\n");
  }).join("\n\n") ?? "No previous touchpoints";

  const prompt = `You are a sales assistant for Source Capital, a UK-based startup advisory and fundraising accelerator. You help craft follow-up messages for prospects who connect via LinkedIn.

Source Capital helps startup founders raise investment by preparing investor-ready decks, financials, and running warm introductions.

## Prospect Profile
Name: ${prospect.first_name} ${prospect.last_name ?? ""}
Company: ${prospect.company_name ?? "Unknown"}
Role: ${prospect.role ?? "Unknown"}
Stage: ${prospect.stage.replace(/_/g, " ")}
${prospect.lead_score ? `Lead Score: ${prospect.lead_score}/100` : ""}
${prospect.notes ? `Notes: ${prospect.notes}` : ""}

## Recent Interactions
${recentMessages}
${transcript ? `\n## Call Transcript\n${transcript.slice(0, 3000)}` : ""}

## Task
Write a short, natural follow-up message (2-4 sentences max) appropriate for the current stage.

The message should:
- Feel personal and relevant to their situation
- Move the conversation forward (e.g., book a call, share a resource, confirm next steps)
- Be appropriate for LinkedIn or email
- Not be pushy or salesy
- Reflect the Source Capital brand: direct, professional, founder-friendly

Output ONLY the message text — no subject line, no preamble, no quotes.`;

  const response = await anthropic.messages.create({
    model: "claude-opus-4-6",
    max_tokens: 300,
    messages: [{ role: "user", content: prompt }],
  });

  const suggestion = (response.content[0] as { text: string }).text.trim();

  // If tied to a specific touchpoint, persist the suggestion there
  if (targetTouchpoint?.id) {
    await supabaseAdmin
      .from("sc_touchpoints")
      .update({ ai_follow_up_suggestion: suggestion, ai_suggested_at: new Date().toISOString() })
      .eq("id", targetTouchpoint.id);
  }

  return NextResponse.json({ suggestion, touchpoint_id: targetTouchpoint?.id ?? null });
}