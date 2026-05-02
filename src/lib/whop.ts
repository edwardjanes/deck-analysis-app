export function whopCheckoutUrl(submissionId: string): string {
  const planId = process.env.NEXT_PUBLIC_WHOP_PLAN_ID ?? "plan_AUP8u87FOYnEZ";
  // Pass submission_id as metadata so the webhook knows which deck to unlock
  const params = new URLSearchParams({
    "metadata[submission_id]": submissionId,
  });
  return `https://whop.com/checkout/${planId}/?${params.toString()}`;
}
