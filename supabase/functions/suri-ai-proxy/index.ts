/**
 * Suri AI Proxy — Supabase Edge Function (Deno runtime).
 *
 * WHY THIS EXISTS
 *   The mobile client must hold NO LLM provider keys. This function is the only
 *   place the Gemini / Groq / OpenRouter keys live, and it owns the 3-tier
 *   failover cascade (spec 5.2). The client opens a single SSE stream here; this
 *   function picks a healthy provider and pipes its token stream straight back,
 *   so the real-time UX is preserved while the secrets stay server-side.
 *
 * CASCADE (spec 5.2)
 *   Gemini 3 Flash (primary) → Groq llama-3.1-8b-instant (fallback 1) →
 *   OpenRouter gpt-oss-20b (fallback 2). A 429 (rate limit) or 5xx (server
 *   failure) — or a network error — fails over to the next configured provider.
 *
 * AUTH
 *   Accepts a request only if it carries the project's SUPABASE_ANON_KEY or a
 *   PROXY_SHARED_SECRET (constant-time compared). NOTE: when deployed with the
 *   default `verify_jwt = true`, Supabase's gateway already requires a valid JWT
 *   (the anon key is one) BEFORE this runs — this check is defense-in-depth. To
 *   use a non-JWT shared secret instead, deploy with `--no-verify-jwt`.
 *
 * DEPLOY
 *   supabase secrets set GEMINI_API_KEY=... GROQ_API_KEY=... OPENROUTER_API_KEY=...
 *   supabase functions deploy suri-ai-proxy            # anon-key auth (JWT)
 *   # or, for the shared-secret path:
 *   supabase secrets set PROXY_SHARED_SECRET=...
 *   supabase functions deploy suri-ai-proxy --no-verify-jwt
 *
 * This file targets the Deno/Supabase Edge runtime — type-check it with
 * `deno check index.ts`, NOT the app's `tsc` (it is excluded from tsconfig).
 */

type Role = "system" | "user" | "assistant";

interface ChatMessage {
  role: Role;
  content: string;
}

interface ProxyRequestBody {
  messages: ChatMessage[];
  max_tokens?: number;
  temperature?: number;
}

interface UpstreamProvider {
  id: string;
  label: string;
  /** Full OpenAI-compatible chat-completions URL. */
  url: string;
  model: string;
  apiKey: string | undefined;
  extraHeaders?: Record<string, string>;
}

interface CascadeAttempt {
  provider: string;
  status?: number;
  detail?: string;
  error?: string;
  /** Whether the status was a canonical failover signal (429/5xx). */
  failover?: boolean;
}

const DEFAULT_MAX_TOKENS = 800;
const DEFAULT_TEMPERATURE = 0.4;

const CORS_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-suri-proxy-secret",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

/** Build the cascade from server-side env keys (in failover order). */
function buildProviders(): UpstreamProvider[] {
  return [
    {
      id: "gemini",
      label: "Gemini 3 Flash",
      url: "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions",
      // Verified free, HTTP 200. GA "gemini-3-flash" is NOT served on this
      // OpenAI-compat endpoint (404); "gemini-2.5-flash" is a GA free fallback.
      model: "gemini-3-flash-preview",
      apiKey: Deno.env.get("GEMINI_API_KEY"),
    },
    {
      id: "groq",
      label: "Groq Llama 3.1 8B Instant",
      url: "https://api.groq.com/openai/v1/chat/completions",
      model: "llama-3.1-8b-instant",
      apiKey: Deno.env.get("GROQ_API_KEY"),
    },
    {
      id: "openrouter",
      label: "OpenRouter GPT-OSS 20B",
      url: "https://openrouter.ai/api/v1/chat/completions",
      // Verified free (cost 0). DeepSeek V3 0324 ":free" was retired (now paid).
      // OpenRouter free pools can be transiently rate-limited (429); fine here
      // as fallback 2 — the cascade fails over / degrades to cache + on-device.
      model: "openai/gpt-oss-20b:free",
      apiKey: Deno.env.get("OPENROUTER_API_KEY"),
      // OpenRouter asks free-tier traffic to send attribution headers.
      extraHeaders: { "HTTP-Referer": "https://suri.app", "X-Title": "Suri" },
    },
  ];
}

function jsonResponse(status: number, data: unknown): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
  });
}

/** Length-safe, constant-time string comparison (avoids token timing leaks). */
function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length || a.length === 0) {
    return false;
  }
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

/** Accept only requests carrying the anon key or the shared secret. */
function isAuthorized(req: Request): boolean {
  const expectedAnon = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
  const expectedSecret = Deno.env.get("PROXY_SHARED_SECRET") ?? "";

  const authHeader = req.headers.get("Authorization") ?? "";
  const bearer = authHeader.toLowerCase().startsWith("bearer ")
    ? authHeader.slice(7).trim()
    : "";
  const provided =
    bearer ||
    req.headers.get("apikey") ||
    req.headers.get("x-suri-proxy-secret") ||
    "";

  if (!provided) {
    return false;
  }
  return (
    (expectedAnon !== "" && safeEqual(provided, expectedAnon)) ||
    (expectedSecret !== "" && safeEqual(provided, expectedSecret))
  );
}

/** A 429 or any 5xx is a documented "try the next provider" signal (spec 5.2). */
function shouldFailover(status: number): boolean {
  return status === 429 || status >= 500;
}

function isValidBody(body: unknown): body is ProxyRequestBody {
  if (typeof body !== "object" || body === null) {
    return false;
  }
  const messages = (body as { messages?: unknown }).messages;
  return (
    Array.isArray(messages) &&
    messages.length > 0 &&
    messages.every(
      (m) =>
        typeof m === "object" &&
        m !== null &&
        typeof (m as ChatMessage).role === "string" &&
        typeof (m as ChatMessage).content === "string",
    )
  );
}

/**
 * Walk the provider cascade and return the first healthy upstream's SSE stream,
 * piped straight back to the client. Fails over on 429/5xx/network errors.
 */
async function cascade(body: ProxyRequestBody, signal: AbortSignal): Promise<Response> {
  const providers = buildProviders().filter((p) => Boolean(p.apiKey));
  if (providers.length === 0) {
    return jsonResponse(500, {
      error:
        "No upstream provider keys configured on the server. Set GEMINI_API_KEY / GROQ_API_KEY / OPENROUTER_API_KEY via `supabase secrets set`.",
    });
  }

  const attempts: CascadeAttempt[] = [];

  for (const provider of providers) {
    let upstream: Response;
    try {
      upstream = await fetch(provider.url, {
        method: "POST",
        // If the client disconnects, abort the upstream request too.
        signal,
        headers: {
          "Content-Type": "application/json",
          Accept: "text/event-stream",
          Authorization: `Bearer ${provider.apiKey}`,
          ...(provider.extraHeaders ?? {}),
        },
        body: JSON.stringify({
          model: provider.model,
          messages: body.messages,
          stream: true,
          max_tokens: body.max_tokens ?? DEFAULT_MAX_TOKENS,
          temperature: body.temperature ?? DEFAULT_TEMPERATURE,
        }),
      });
    } catch (err) {
      // Network/abort error reaching this provider — fail over.
      attempts.push({ provider: provider.id, error: String(err) });
      continue;
    }

    if (upstream.ok && upstream.body) {
      // Pipe the upstream SSE stream straight through to the mobile client.
      return new Response(upstream.body, {
        status: 200,
        headers: {
          ...CORS_HEADERS,
          "Content-Type": "text/event-stream; charset=utf-8",
          "Cache-Control": "no-cache",
          Connection: "keep-alive",
          // Lets the client/telemetry see which provider actually served.
          "X-Suri-Provider": provider.id,
        },
      });
    }

    const detail = await upstream.text().catch(() => "");
    attempts.push({
      provider: provider.id,
      status: upstream.status,
      detail: detail.slice(0, 200),
      // 429/5xx are the canonical failover signals, but any non-OK status also
      // falls through to the next provider so one misconfig never kills the chain.
      failover: shouldFailover(upstream.status),
    });
  }

  return jsonResponse(502, { error: "All upstream providers failed.", attempts });
}

Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS_HEADERS });
  }
  if (req.method !== "POST") {
    return jsonResponse(405, { error: "Method not allowed. Use POST." });
  }
  if (!isAuthorized(req)) {
    return jsonResponse(401, { error: "Unauthorized." });
  }

  let parsed: unknown;
  try {
    parsed = await req.json();
  } catch {
    return jsonResponse(400, { error: "Request body must be valid JSON." });
  }
  if (!isValidBody(parsed)) {
    return jsonResponse(400, {
      error: "Body must include a non-empty 'messages' array of { role, content }.",
    });
  }

  return cascade(parsed, req.signal);
});
