import { NextRequest, NextResponse } from "next/server";
import { createOrUpdateContact } from "@/lib/loops";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const { email, firstName, lastName, score, verdict, businessName, resultsUrl } = await req.json();

    if (!email) return NextResponse.json({ error: "email required" }, { status: 400 });

    await createOrUpdateContact({
      email,
      firstName: firstName ?? "Test",
      lastName: lastName ?? "User",
      customProperties: {
        score: score ?? 72,
        verdict: verdict ?? "Strong fundamentals with a compelling narrative. The team demonstrates clear domain expertise and the market opportunity is well-defined.",
        businessName: businessName ?? "Test Company Ltd",
        results: resultsUrl ?? "https://app.sourcecapital.co.uk/investment-score/results/test",
      },
    });

    return NextResponse.json({
      ok: true,
      contact: { email, firstName: firstName ?? "Test", score: score ?? 72, businessName: businessName ?? "Test Company Ltd" },
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}
