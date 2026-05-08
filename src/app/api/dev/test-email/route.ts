import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { sendAnalysisResultEmail } from "@/lib/loops";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const { submissionId, overrideEmail } = await req.json();
    if (!submissionId) return NextResponse.json({ error: "submissionId required" }, { status: 400 });

    const { data, error } = await supabaseAdmin
      .from("deck_submissions")
      .select("id, first_name, email, business_name, score, verdict")
      .eq("id", submissionId)
      .single();

    if (error || !data) return NextResponse.json({ error: "Submission not found" }, { status: 404 });

    const toEmail = overrideEmail || data.email;
    if (!toEmail) return NextResponse.json({ error: "No email address" }, { status: 400 });

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://app.sourcecapital.co.uk";

    const result = await sendAnalysisResultEmail({
      email: toEmail,
      firstName: data.first_name ?? "there",
      businessName: data.business_name,
      score: data.score,
      verdict: data.verdict,
      resultsUrl: `${appUrl}/investment-score/results/${data.id}`,
    });

    return NextResponse.json({
      ok: result.success,
      sentTo: toEmail,
      transactionalId: result.transactionalId,
      loopsResponse: result.body,
      payload: {
        deckFirstName: data.first_name,
        deckBusinessName: data.business_name,
        deckScore: data.score,
        deckVerdict: data.verdict?.slice(0, 80) + "...",
        deckResultsUrl: `${appUrl}/investment-score/results/${data.id}`,
      },
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}
