export const PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID ?? "1282130217454807";

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    fbq: (...args: any[]) => void;
  }
}

function fbq(...args: unknown[]) {
  if (typeof window !== "undefined" && typeof window.fbq === "function") {
    window.fbq(...args);
  }
}

export const pixel = {
  pageview: () => fbq("track", "PageView"),
  lead: (email?: string) =>
    fbq("track", "Lead", email ? { em: email } : undefined),
  viewContent: (name: string) =>
    fbq("track", "ViewContent", { content_name: name }),
  initiateCheckout: () =>
    fbq("track", "InitiateCheckout"),
};
