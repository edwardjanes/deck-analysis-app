export function whopCheckoutUrl(submissionId: string): string {
  const planId = process.env.NEXT_PUBLIC_WHOP_PLAN_ID ?? "plan_AUP8u87FOYnEZ";
  // Pass submission_id as metadata so the webhook knows which deck to unlock
  const params = new URLSearchParams({
    "metadata[submission_id]": submissionId,
    redirect_url: `${process.env.NEXT_PUBLIC_APP_URL}/results/${submissionId}?unlocked=1`,
  });
  return `https://whop.com/checkout/${planId}/?${params.toString()}`;
}
