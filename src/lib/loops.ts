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

  const res = await fetch("https://app.loops.so/api/v1/transactional", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      transactionalId,
      email: data.email,
      dataVariables: {
        firstName: data.firstName,
        businessName: data.businessName,
        score: String(data.score),
        verdict: data.verdict,
        resultsUrl: data.resultsUrl,
      },
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    console.error(`[loops] Failed to send email: ${res.status} ${body}`);
  } else {
    console.log(`[loops] Results email sent to ${data.email}`);
  }
}
