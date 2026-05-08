export async function createOrUpdateContact(data: {
  email: string;
  firstName: string;
  lastName?: string;
  userGroup?: string;
}): Promise<void> {
  const apiKey = process.env.LOOPS_API_KEY;
  if (!apiKey) {
    console.warn("[loops] LOOPS_API_KEY not set — skipping contact create");
    return;
  }
  const res = await fetch("https://app.loops.so/api/v1/contacts/create", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      email: data.email,
      firstName: data.firstName,
      lastName: data.lastName ?? "",
      userGroup: data.userGroup ?? "Pitch Deck Review",
      source: "deck-analysis-app",
    }),
  });
  if (!res.ok) {
    const body = await res.text();
    console.error(`[loops] Failed to create contact: ${res.status} ${body}`);
  } else {
    console.log(`[loops] Contact created/updated: ${data.email}`);
  }
}

async function sendTransactional(apiKey: string, transactionalId: string, email: string, dataVariables: Record<string, string>): Promise<void> {
  const res = await fetch("https://app.loops.so/api/v1/transactional", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({ transactionalId, email, dataVariables }),
  });
  if (!res.ok) {
    const body = await res.text();
    console.error(`[loops] Failed to send email (${transactionalId}): ${res.status} ${body}`);
  }
}

interface AnalysisEmailData {
  email: string;
  firstName: string;
  businessName: string;
  score: number;
  verdict: string;
  resultsUrl: string;
}

export async function sendAnalysisResultEmail(data: AnalysisEmailData): Promise<void> {
  const apiKey = process.env.LOOPS_API_KEY;
  const transactionalId = process.env.LOOPS_TRANSACTIONAL_ID;
  if (!apiKey || !transactionalId) {
    console.warn("[loops] LOOPS_API_KEY or LOOPS_TRANSACTIONAL_ID not set — skipping email");
    return;
  }
  await sendTransactional(apiKey, transactionalId, data.email, {
    firstName: data.firstName,
    businessName: data.businessName,
    score: String(data.score),
    verdict: data.verdict,
    resultsUrl: data.resultsUrl,
  });
  console.log(`[loops] Results email sent to ${data.email}`);
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
    firstName: data.firstName,
    businessName: data.businessName,
    resultsUrl: data.resultsUrl,
    orderId: data.orderId,
  });
  console.log(`[loops] Payment confirmation sent to ${data.email}`);
}
