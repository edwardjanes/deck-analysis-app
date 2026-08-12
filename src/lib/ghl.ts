const GHL_API_BASE = "https://api.higherlevel.com/crm/v1";
const GHL_LOCATION_ID = "Px7umc3EewzT2DNAvJxr"; // Source Capital

export async function createOrUpdateContact(data: {
  email: string;
  firstName: string;
  lastName?: string;
  customFields?: Record<string, string>;
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

  if (data.customFields) {
    contactData.customFields = data.customFields;
  }

  try {
    const res = await fetch(`${GHL_API_BASE}/contacts/upsert`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiToken}`,
      },
      body: JSON.stringify(contactData),
    });

    const body = await res.json().catch(() => res.text());

    if (!res.ok) {
      console.error(`[ghl] Failed to upsert contact ${data.email}: ${res.status}`, body);
      return;
    }

    console.log(`[ghl] Contact upserted: ${data.email}`);
  } catch (err) {
    console.error("[ghl] Contact upsert error:", err);
  }
}
