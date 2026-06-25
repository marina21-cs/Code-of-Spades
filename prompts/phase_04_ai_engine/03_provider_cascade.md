# 4.3 Provider Cascade (Gemini → Groq → OpenRouter)

## Context

<context>
The original single-provider design (200 RPD) was a single point of failure. The cascade routes Gemini 3 Flash (1,500 RPD) → Groq llama-3.1-8b-instant (~14,400 RPD) → OpenRouter DeepSeek V3 (200 RPD), giving ~16,000 RPD combined — an 80× improvement (spec 5.2, Section 10). Because all three share the OpenAI-compatible format, the cascade is essentially a single try/catch over three base URLs (spec 5.2). Failover is invisible to the student (spec 5.2). This step wraps the 4.2 client in that cascade with proactive, rate-limit-aware switching.
</context>

## Prerequisites

<prerequisites>
- Phase 4.2 (streaming client, typed provider errors, key store)
- Provider base URLs/models in `src/config/env.ts`
</prerequisites>

## AI Implementation Prompt

<instructions>
Implement the ordered provider cascade with streaming passthrough.

Think step by step:

1. **Provider registry** (`src/features/ai/providers.ts`)
   - An ordered array describing each provider: `{ name, baseUrl, model, maxTokensCap }` for `gemini`, `groq`, `openrouter`, pulled from `config`.
   - A separate ordered list for the weak tier could cap tokens lower (the router passes `maxTokens`; providers just respect it).
   - Skip providers with no API key (`hasApiKey`), so a missing OpenRouter key doesn't break the chain.

2. **Rate-limit bookkeeping** (`src/features/ai/rate-limit-tracker.ts`)
   - Track per-provider state in memory: `cooldownUntil` timestamp when a 429 or exhausted-quota is seen (use `Retry-After`/reset headers when present).
   - `isAvailable(provider)` returns false during cooldown so the cascade proactively skips it (spec Section 10 — switch before failing).
   - Reset naturally as cooldowns expire.

3. **Cascade** (`src/features/ai/cascade.ts`)
   - `streamWithCascade(params: { messages, maxTokens, signal, onProvider? }): AsyncGenerator<{ token: string; provider: ProviderName }>`:
     - Iterate providers in order, skipping unavailable/keyless ones.
     - For each, call `streamChat` (4.2). On the first token, mark the active provider (callback so the UI/log can note which answered — but this stays invisible to the student per spec).
     - On `rate_limited`/`server`/`network` error BEFORE any token streamed, record cooldown (if rate-limited) and move to the next provider.
     - If an error occurs AFTER tokens have started, surface a graceful mid-stream recovery state (spec 5.2 Tier 2 behavior) rather than silently restarting — emit what was received and a reconnecting marker; the router decides whether to retry on the next provider with a continuation note.
     - If all providers fail, throw a typed `AllProvidersFailedError` so the router falls back to cache/SLM.

4. **Simulation hook for the demo**
   - Add a dev-only flag (e.g., `__forceRateLimit: { gemini: true }`) so the pitch can demonstrate failover by simulating a Gemini rate-limit hit (spec Section 11, item 2). When set, the cascade treats that provider as rate-limited.
</instructions>

<requirements>
### Functional Requirements
- Cascade tries Gemini → Groq → OpenRouter in order.
- A rate-limited provider is skipped proactively (cooldown), not retried each call.
- Failover is invisible to the student (no error UI when another provider succeeds).
- All-providers-failed throws a typed error for the router.

### Technical Requirements
- Reuses the single 4.2 client (no provider-specific code paths beyond config).
- Keyless providers skipped gracefully.
- Dev simulation flag for the demo.

### File Naming Conventions
- `providers.ts`, `rate-limit-tracker.ts`, `cascade.ts`.
</requirements>

<output_files>
1. `suri/src/features/ai/providers.ts` — ordered registry from config
2. `suri/src/features/ai/rate-limit-tracker.ts` — cooldown bookkeeping
3. `suri/src/features/ai/cascade.ts` — streaming cascade + simulation hook
4. `suri/src/features/ai/index.ts` — MODIFIED barrel
</output_files>

## Directory Structure

```
src/features/ai/
├── providers.ts          ← NEW
├── rate-limit-tracker.ts ← NEW
└── cascade.ts            ← NEW
```

## Verification

<verification>
- [ ] Normal path streams from Gemini
- [ ] Setting the dev `__forceRateLimit.gemini` flag transparently streams from Groq instead
- [ ] Forcing Gemini + Groq unavailable streams from OpenRouter
- [ ] A rate-limited provider is skipped on the next request during cooldown
- [ ] All-fail throws `AllProvidersFailedError`
- [ ] No provider error surfaces to the user when a later provider succeeds
- [ ] `npm run typecheck` passes
</verification>

## Troubleshooting

| Symptom | Likely Cause | Fix |
|---|---|---|
| Cascade never advances | Error thrown not caught per-provider | Wrap each provider attempt; classify error; continue |
| Student sees an error then an answer | Surfacing failover errors | Only show errors when ALL providers fail |
| Cooldown never clears | Timestamp comparison wrong | Compare `Date.now()` to `cooldownUntil`; clear when passed |
| Skips a working provider | Missing key check inverted | Confirm `hasApiKey` logic |

---

**Previous**: [4.2 Cloud Client & Streaming](./02_cloud_client_streaming.md) | **Next**: [4.4 On-Device SLM](./04_ondevice_slm.md)
