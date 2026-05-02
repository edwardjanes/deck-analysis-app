import { createClient, SupabaseClient } from "@supabase/supabase-js";

function createAdminClient(): SupabaseClient {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error(
      "Missing Supabase environment variables. Copy .env.local.example to .env.local and fill in your values."
    );
  }
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: { autoRefreshToken: false, persistSession: false },
      // Opt out of Next.js's built-in fetch cache so DB reads are always fresh
      global: {
        fetch: (url: RequestInfo | URL, options?: RequestInit) =>
          fetch(url, { ...options, cache: "no-store" }),
      },
    }
  );
}

// Lazily initialised — avoids build-time error when env vars are absent.
// Methods are bound to the real client so `this` is never lost.
let _client: SupabaseClient | null = null;

export const supabaseAdmin = new Proxy({} as SupabaseClient, {
  get(_target, prop: string | symbol) {
    if (!_client) _client = createAdminClient();
    const value = (_client as unknown as Record<string | symbol, unknown>)[prop];
    // Bind functions so `this` refers to the real client, not the proxy
    return typeof value === "function" ? (value as Function).bind(_client) : value;
  },
});
