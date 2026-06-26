/**
 * Cloud AI access configuration — SERVER-PROXY model.
 *
 * The client no longer holds ANY LLM provider keys. The real Gemini / Groq /
 * OpenRouter keys and the failover cascade live in the Supabase Edge Function
 * (supabase/functions/suri-ai-proxy). All the client needs is:
 *
 *   EXPO_PUBLIC_PROXY_URL    — the deployed Edge Function URL
 *   EXPO_PUBLIC_PROXY_TOKEN  — the access token sent with every request
 *                              (the Supabase anon key, or a shared secret)
 *
 * ── SECURITY MODEL ───────────────────────────────────────────────────────────
 * `EXPO_PUBLIC_*` values are still inlined into the JS bundle, so this token IS
 * visible in the APK. That is acceptable: the Supabase anon key is PUBLIC by
 * design, and this token only gates access to the proxy (basic abuse control) —
 * it grants NO direct provider access. The valuable, billable provider keys are
 * now server-side only. For stronger abuse protection add per-user auth (a real
 * Supabase Auth JWT) and rate limiting at the proxy.
 *
 * Env vars are read through STATIC `process.env.EXPO_PUBLIC_*` member accesses
 * (inside the accessor) so Metro inlines them at build time. Pure module — no
 * native imports — so the router and its headless verification load cleanly.
 */

export interface ProxyConfig {
  /** Fully-qualified Edge Function URL. */
  url: string;
  /** Bearer/apikey token sent on every request (anon key or shared secret). */
  token: string;
}

/** Trim and treat empty strings as absent. */
function normalize(value: string | undefined): string | null {
  if (typeof value !== "string") {
    return null;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

/**
 * Resolve the proxy endpoint + token, or null if either is missing. Read lazily
 * (still statically inlined by Metro) so the value can be provided at runtime in
 * tests and so the app degrades gracefully when unconfigured.
 */
export function getProxyConfig(): ProxyConfig | null {
  const url = normalize(process.env.EXPO_PUBLIC_PROXY_URL);
  const token = normalize(process.env.EXPO_PUBLIC_PROXY_TOKEN);
  if (!url || !token) {
    return null;
  }
  return { url, token };
}

/** Whether the cloud proxy is configured in this build. */
export function isProxyConfigured(): boolean {
  return getProxyConfig() !== null;
}

// Development-time nudge (never crashes; no-op in production and under the
// headless Node verifiers, where __DEV__ is undefined). Suri stays usable
// without the proxy via cached answers + the on-device SLM.
if (typeof __DEV__ !== "undefined" && __DEV__) {
  if (!isProxyConfigured()) {
    console.warn(
      "[Suri] Cloud proxy not configured. Set EXPO_PUBLIC_PROXY_URL and " +
        "EXPO_PUBLIC_PROXY_TOKEN to enable the online AI tiers. Offline cache " +
        "and the on-device SLM still work.",
    );
  }
}
