import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { parseStoredError } from "@/lib/errorHandler";

export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;

  if (!id) {
    return NextResponse.json({ error: "Missing ID" }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from("deck_submissions")
    .select(
      "id, status, business_name, score, verdict, verdict_type, most_damaging_issue, best_asset, analysis_summary, analysis_json, error_message, paid"
    )
    .eq("id", id)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "Submission not found" }, { status: 404 });
  }

  // Parse structured error info so the frontend doesn't need to
  const recovery = parseStoredError(data.error_message);

  return NextResponse.json({
    ...data,
    // Expose recovery fields at the top level for easy consumption
    recovery_action: recovery?.action ?? null,
    recovery_message: recovery?.message ?? data.error_message ?? null,
    recovery_attempt: recovery?.attempt ?? null,
  });
}
