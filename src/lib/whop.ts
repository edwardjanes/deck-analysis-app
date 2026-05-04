export function whopCheckoutUrl(submissionId: string): string {
  const planId = process.env.NEXT_PUBLIC_WHOP_PLAN_ID ?? "plan_AUP8u87FOYnEZ";
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://app.sourcecapital.co.uk";
  const params = new URLSearchParams({
    "metadata[submission_id]": submissionId,
    redirect_url: `${appUrl}/thank-you?submission_id=${submissionId}`,
  });
  return `https://whop.com/checkout/${planId}/?${params.toString()}`;
}
