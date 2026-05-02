export function whopCheckoutUrl(submissionId: string): string {
  const productId = process.env.WHOP_PRODUCT_ID ?? process.env.NEXT_PUBLIC_WHOP_PRODUCT_ID;
  // Pass submission_id as metadata so the webhook knows which deck to unlock
  const params = new URLSearchParams({
    "metadata[submission_id]": submissionId,
    redirect_url: `${process.env.NEXT_PUBLIC_APP_URL}/results/${submissionId}?unlocked=1`,
  });
  return `https://whop.com/checkout/${productId}/?${params.toString()}`;
}
