import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";

// Loops sends webhooks with an Authorization header containing a shared secret.
// Set LOOPS_WEBHOOK_SECRET in your Vercel environment variables,
// then paste the same value into Loops → Settings → Webhooks → Secret.
const WEBHOOK_SECRET = process.env.LOOPS_WEBHOOK_SECRET;

// Loops contact event payload (subset of fields we care about)
interface LoopsContact {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  userGroup?: string;
  subscribed?: boolean;
  source?: string;
  // custom properties you may have defined in Loops
  company?: string;
  jobTitle?: string;
  linkedinUrl?: string;
  location?: string;
  notes?: string;
}

interface LoopsEvent {
  type: "contactCreated" | "contactUpdated" | "contactDeleted" | string;
  data: LoopsContact;
}

export async function POST(req: NextRequest) {
  // ── 1. Verify secret ──────────────────────────────────────────────────────
  if (WEBHOOK_SECRET) {
    const authHeader = req.headers.get("authorization") ?? "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : authHeader;
    if (token !== WEBHOOK_SECRET) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  // ── 2. Parse payload ──────────────────────────────────────────────────────
  let event: LoopsEvent;
  try {
    event = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { type, data } = event;

  // Only handle contact creation (and optionally updates)
  if (type !== "contactCreated" && type !== "contactUpdated") {
    return NextResponse.json({ ok: true, skipped: true });
  }

  if (!data?.email) {
    return NextResponse.json({ error: "No email in payload" }, { status: 400 });
  }

  // ── 3. Upsert into sc_prospects ───────────────────────────────────────────
  // Check if a prospect with this email already exists
  const { data: existing } = await supabaseAdmin
    .from("sc_prospects")
    .select("id, stage")
    .eq("email", data.email.toLowerCase().trim())
    .maybeSingle();

  if (existing) {
    // Already in the CRM — update contact details but don't downgrade stage
    const { error } = await supabaseAdmin
      .from("sc_prospects")
      .update({
        first_name:   data.firstName ?? existing.id,   // keep existing if not provided
        last_name:    data.lastName   ?? null,
        company_name: data.company    ?? null,
        role:         data.jobTitle   ?? null,
        linkedin_url: data.linkedinUrl ?? null,
        location:     data.location   ?? null,
      })
      .eq("id", existing.id);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, action: "updated", id: existing.id });
  }

  // New prospect — insert at connection_request stage
  const { data: inserted, error } = await supabaseAdmin
    .from("sc_prospects")
    .insert({
      first_name:   data.firstName?.trim() || data.email.split("@")[0],
      last_name:    data.lastName?.trim()  || null,
      email:        data.email.toLowerCase().trim(),
      company_name: data.company?.trim()   || null,
      role:         data.jobTitle?.trim()  || null,
      linkedin_url: data.linkedinUrl?.trim() || null,
      location:     data.location?.trim()  || null,
      notes:        data.notes?.trim()     || null,
      stage:        "connection_request",
      source:       "loops",
    })
    .select("id")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Log the initial touchpoint
  await supabaseAdmin.from("sc_touchpoints").insert({
    prospect_id:  inserted.id,
    type:         "note",
    subject:      "Added via Loops",
    body:         `Subscribed on Loops${data.userGroup ? ` (group: ${data.userGroup})` : ""}.`,
    occurred_at:  new Date().toISOString(),
  });

  return NextResponse.json({ ok: true, action: "created", id: inserted.id }, { status: 201 });
}