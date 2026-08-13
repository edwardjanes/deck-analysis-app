import * as Sentry from "@sentry/nextjs";

const GHL_API_BASE = "https://services.leadconnectorhq.com";
const GHL_LOCATION_ID = "Px7umc3EewzT2DNAvJxr"; // Source Capital
const GHL_API_VERSION = "2021-07-28";

export async function createOrUpdateContact(data: {
  email: string;
  firstName: string;
  lastName?: string;
  customFieldValues?: Array<{ id: string; value: string }>;
}): Promise<void> {
  const apiToken = process.env.GHL_API_TOKEN;
  if (!apiToken) {
    console.warn("[ghl] GHL_API_TOKEN not set — skipping contact upsert");
    return;
  }

  const contactData: Record<string, unknown> = {
    locationId: GHL_LOCATION_ID,
    email: data.email,
    firstName: data.firstName,
    lastName: data.lastName ?? "",
  };

  if (data.customFieldValues && data.customFieldValues.length > 0) {
    contactData.customFields = data.customFieldValues;
  }

  try {
    console.log("[ghl] Attempting contact upsert:", { email: data.email, apiBase: GHL_API_BASE, locationId: GHL_LOCATION_ID });

    const res = await fetch(`${GHL_API_BASE}/contacts/upsert`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiToken}`,
        Version: GHL_API_VERSION,
      },
      body: JSON.stringify(contactData),
    });

    console.log(`[ghl] Response status: ${res.status}`);

    let body;
    const text = await res.text();
    try {
      body = text ? JSON.parse(text) : {};
    } catch {
      body = text;
    }

    if (!res.ok) {
      const error = new Error(`GHL API error ${res.status}: ${typeof body === 'string' ? body : JSON.stringify(body)}`);
      console.error(`[ghl] Failed to upsert contact ${data.email}: ${res.status}`, { body, request: contactData });
      Sentry.captureException(error, {
        tags: { type: "ghl_api_error" },
        extra: { status: res.status, body, email: data.email, request: contactData },
      });
      return;
    }

    console.log(`[ghl] Contact upserted successfully: ${data.email}`, body);
  } catch (err) {
    console.error("[ghl] Contact upsert error:", err, { email: data.email });
    Sentry.captureException(err, {
      tags: { type: "ghl_contact_exception" },
      extra: { email: data.email },
    });
  }
}
