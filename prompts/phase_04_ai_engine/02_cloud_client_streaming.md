# 4.2 Cloud AI Client & SSE Streaming

## Context

<context>
On good signal, Suri streams tokens so they appear immediately even on slow 4G (spec 5.2). All three cloud providers share the OpenAI-compatible message format, so this is a single client parameterized by base URL, API key, and model (spec 5.2, Section 8). This step builds that streaming client over `fetch` + SSE parsing, plus secure API-key storage. The cascade logic that swaps providers lives in 4.3; here we build one provider call done well.
</context>

## Prerequisites

<prerequisites>
- Phase 4.1 (`buildMessages`)
- `expo-secure-store` (Phase 0); `src/config/env.ts` base URLs/models (Phase 0.3)
</prerequisites>

## AI Implementation Prompt

<instructions>
Build a single OpenAI-compatible streaming client and a secure key store.

Think step by step:

1. **API key store** (`src/features/ai/keys.ts`)
   - `getApiKey(provider)` / `setApiKey(provider, key)` / `hasApiKey(provider)` backed by `expo-secure-store` under per-provider keys.
   - NEVER log key values. Provide a `getConfiguredProviders()` returning which providers have keys.
   - (A settings UI to enter keys is added in Phase 6 / appendix B documents how to obtain them.)

2. **Streaming client** (`src/features/ai/cloud-client.ts`)
   - `streamChat(params: { provider, model, baseUrl, apiKey, messages, maxTokens, signal }): AsyncGenerator<string>`:
     - POST to `${baseUrl}chat/completions` with `stream: true`, the messages, `model`, `max_tokens`, and `temperature`.
     - Use `fetch` with the React Native streaming approach. Parse the SSE stream line-by-line: split on `\n`, handle `data: ` lines, ignore comments/keep-alives, stop on `data: [DONE]`.
     - For each chunk, extract `choices[0].delta.content` and `yield` it.
     - Support an `AbortSignal` so the user can stop generation.
   - Note: React Native `fetch` streaming requires reading the response as a stream. If the runtime lacks `response.body.getReader()`, use `expo/fetch` (the streaming-capable fetch in SDK 54) or `XMLHttpRequest` progressive `onreadystatechange`. Choose the approach that works on the dev client and document it.

3. **Rate-limit + error surfacing** (`src/features/ai/provider-errors.ts`)
   - Parse provider responses for HTTP 429 / quota errors. Return a typed result: `{ kind: 'rate_limited' | 'auth_error' | 'network' | 'server' | 'ok' }`.
   - Read rate-limit headers when present (Groq documents them — spec Section 10) so 4.3 can switch proactively.
   - Define a `ProviderError` class with the kind, so the cascade can decide retry vs failover.

4. **Non-streaming helper**
   - Add `completeChat(params)` that awaits the full text (used for cache-warming or when streaming is unavailable). Internally it can consume `streamChat`.
</instructions>

<requirements>
### Functional Requirements
- Tokens stream incrementally from an OpenAI-compatible endpoint.
- Generation can be aborted mid-stream.
- 429/quota detected and typed for the cascade.

### Technical Requirements
- One client works for Gemini, Groq, OpenRouter (only base URL/model/key differ).
- API keys read from secure-store; never logged or thrown in error messages.
- SSE parsing handles partial lines, keep-alives, and `[DONE]`.

### File Naming Conventions
- `cloud-client.ts`, `keys.ts`, `provider-errors.ts`.
</requirements>

<output_files>
1. `suri/src/features/ai/keys.ts` — secure key storage
2. `suri/src/features/ai/cloud-client.ts` — streaming + non-streaming
3. `suri/src/features/ai/provider-errors.ts` — typed errors + header parsing
4. `suri/src/features/ai/index.ts` — MODIFIED barrel
</output_files>

## Directory Structure

```
src/features/ai/
├── keys.ts             ← NEW
├── cloud-client.ts     ← NEW
└── provider-errors.ts  ← NEW
```

## Verification

<verification>
- [ ] With a valid Gemini key, `streamChat` yields tokens progressively (logged in dev)
- [ ] Aborting the signal stops the stream promptly
- [ ] A forced 429 returns `kind: 'rate_limited'`
- [ ] Keys are never printed in logs or error messages
- [ ] `npm run typecheck` passes
</verification>

## Troubleshooting

| Symptom | Likely Cause | Fix |
|---|---|---|
| Whole response arrives at once | `response.body` not streamed | Use `expo/fetch` streaming or XHR progressive events |
| `[DONE]` rendered as text | Sentinel not filtered | Skip `data: [DONE]`; don't yield it |
| Garbled multi-byte chars | Splitting mid-UTF8 | Buffer bytes; decode complete lines only |
| 401 from Gemini | Wrong base URL/endpoint | Use the OpenAI-compatible base in appendix B |

---

**Previous**: [4.1 System Prompt Builder](./01_system_prompt_builder.md) | **Next**: [4.3 Provider Cascade](./03_provider_cascade.md)
