import { NextRequest, NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { sendPaymentConfirmationEmail } from "@/lib/loops";

// Whop sends webhook events when a payment completes.
// We verify the signature, extract the submission_id from metadata,
// and mark the submission as paid so the results page unlocks.

export const dynamic = "force-dynamic";

async function verifyWhopSignature(
  body: string,
  signature: string | null,
  secret: string
): Promise<boolean> {
  if (!signature) return false;
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["verify"]
  );
  const sigBytes = Buffer.from(signature.replace("sha256=", ""), "hex");
  return crypto.subtle.verify("HMAC", key, sigBytes, encoder.encode(body));
}

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get("whop-signature");
  const webhookSecret = process.env.WHOP_WEBHOOK_SECRET;

  // Verify signature if secret is configured
  if (webhookSecret) {
    const valid = await verifyWhopSignature(body, signature, webhookSecret);
    if (!valid) {
      console.warn("[whop/webhook] Invalid signature");
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }
  }

  let event: Record<string, unknown>;
  try {
    event = JSON.parse(body);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const action = event.action as string;
  console.log(`[whop/webhook] Received event: ${action}`);

  // Handle payment completion events
  if (action === "payment.completed" || action === "membership.went_valid") {
    const data = event.data as Record<string, unknown> ?? {};
    const metadata = (data.metadata ?? data.checkout_metadata ?? {}) as Record<string, string>;
    const submissionId = metadata.submission_id;
    const orderId = (data.id ?? data.order_id ?? "") as string;

    if (!submissionId) {
      console.warn("[whop/webhook] No submission_id in metadata", data);
      // Still return 200 so Whop doesn't retry endlessly
      return NextResponse.json({ received: true });
    }

    const { data: submission, error } = await supabaseAdmin
      .from("deck_submissions")
      .update({ paid: true, whop_order_id: orderId })
      .eq("id", submissionId)
      .select("email, first_name, business_name")
      .single();

    if (error) {
      Sentry.captureException(new Error(error.message), {
        tags: { context: "whop_webhook" },
        extra: { submissionId, orderId, action },
      });
      console.error("[whop/webhook] DB update failed:", error);
      return NextResponse.json({ error: "DB update failed" }, { status: 500 });
    }

    console.log(`[whop/webhook] Marked submission ${submissionId} as paid (order: ${orderId})`);

    // Send payment confirmation email
    if (submission?.email) {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://app.sourcecapital.co.uk";
      sendPaymentConfirmationEmail({
        email: submission.email,
        firstName: submission.first_name ?? "there",
        businessName: submission.business_name,
        resultsUrl: `${appUrl}/results/${submissionId}`,
        orderId: orderId || "—",
      }).catch(err => console.error("[loops] Payment email error:", err));
    }
  }

  return NextResponse.json({ received: true });
}
