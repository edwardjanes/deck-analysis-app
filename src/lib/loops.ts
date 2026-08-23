export async function createOrUpdateContact(data: {
  email: string;
  firstName: string;
  lastName?: string;
  userGroup?: string;
  customProperties?: Record<string, string | number>;
}): Promise<void> {
  const apiKey = process.env.LOOPS_API_KEY;
  if (!apiKey) {
    console.warn("[loops] LOOPS_API_KEY not set — skipping contact create");
    return;
  }
  const res = await fetch("https://app.loops.so/api/v1/contacts/update", {
    method: "PUT",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      email: data.email,
      firstName: data.firstName,
      lastName: data.lastName ?? "",
      userGroup: data.userGroup ?? "Pitch Deck Review",
      source: "deck-analysis-app",
      ...data.customProperties,
    }),
  });
  if (!res.ok) {
    // If contact doesn't exist yet, create it
    if (res.status === 404) {
      const createRes = await fetch("https://app.loops.so/api/v1/contacts/create", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({
          email: data.email,
          firstName: data.firstName,
          lastName: data.lastName ?? "",
          userGroup: data.userGroup ?? "Pitch Deck Review",
          source: "deck-analysis-app",
          ...data.customProperties,
        }),
      });
      if (!createRes.ok) {
        const body = await createRes.text();
        console.error(`[loops] Failed to create contact: ${createRes.status} ${body}`);
      } else {
        console.log(`[loops] Contact created: ${data.email}`);
      }
    } else {
      const body = await res.text();
      console.error(`[loops] Failed to update contact: ${res.status} ${body}`);
    }
  } else {
    console.log(`[loops] Contact updated: ${data.email}`);
  }
}

async function sendTransactional(apiKey: string, transactionalId: string, email: string, dataVariables: Record<string, string>): Promise<{ success: boolean; body: unknown }> {
  const res = await fetch("https://app.loops.so/api/v1/transactional", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({ transactionalId, email, dataVariables }),
  });
  const body = await res.json().catch(() => res.text());
  if (!res.ok) {
    console.error(`[loops] Failed to send email (${transactionalId}): ${res.status}`, body);
  }
  return { success: res.ok, body };
}

interface AnalysisEmailData {
  email: string;
  firstName: string;
  businessName: string;
  score: number;
  verdict: string;
  resultsUrl: string;
}

export async function sendAnalysisResultEmail(data: AnalysisEmailData): Promise<{ success: boolean; body: unknown; transactionalId: string }> {
  const apiKey = process.env.LOOPS_API_KEY;
  const transactionalId = process.env.LOOPS_TRANSACTIONAL_ID ?? "";
  if (!apiKey || !transactionalId) {
    console.warn("[loops] LOOPS_API_KEY or LOOPS_TRANSACTIONAL_ID not set — skipping email");
    return { success: false, body: "env vars not set", transactionalId };
  }
  const result = await sendTransactional(apiKey, transactionalId, data.email, {
    deckFirstName: data.firstName,
    deckBusinessName: data.businessName,
    deckScore: String(data.score),
    deckVerdict: data.verdict,
    deckResultsUrl: data.resultsUrl,
  });
  console.log(`[loops] Results email sent to ${data.email}:`, result);
  return { ...result, transactionalId };
}

interface PaymentConfirmationData {
  email: string;
  firstName: string;
  businessName: string;
  resultsUrl: string;
  orderId: string;
}

export async function sendPaymentConfirmationEmail(data: PaymentConfirmationData): Promise<void> {
  const apiKey = process.env.LOOPS_API_KEY;
  const transactionalId = process.env.LOOPS_PAYMENT_TRANSACTIONAL_ID;
  if (!apiKey || !transactionalId) {
    console.warn("[loops] LOOPS_PAYMENT_TRANSACTIONAL_ID not set — skipping payment email");
    return;
  }
  await sendTransactional(apiKey, transactionalId, data.email, {
    deckFirstName: data.firstName,
    deckBusinessName: data.businessName,
    deckResultsUrl: data.resultsUrl,
    deckOrderId: data.orderId,
  });
  console.log(`[loops] Payment confirmation sent to ${data.email}`);
}
