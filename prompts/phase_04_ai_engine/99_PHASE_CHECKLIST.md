# Phase 4 Completion Checklist

## All Steps Completed

- [ ] 4.1 — System prompt builder (profile + RAG), shared by all tiers
- [ ] 4.2 — OpenAI-compatible SSE streaming client + secure keys
- [ ] 4.3 — Provider cascade (Gemini → Groq → OpenRouter)
- [ ] 4.4 — On-device SmolLM2 via llama.rn (Extreme Lite)
- [ ] 4.5 — Tier router orchestration

## Verification Tests

```bash
npm run typecheck    # Expected: zero errors
npm run lint         # Expected: zero errors
npx expo run:android # Expected: streaming cloud + offline SLM both work
```

## Code Quality Checks

- [ ] One streaming client serves all three providers
- [ ] API keys read from secure-store; never logged
- [ ] SLM uses n_ctx 256 / low threads / no mlock
- [ ] Router is the single public entry (`ask`)
- [ ] Failover and tier transitions invisible to the student

## Manual Verification

- [ ] Gemini streams tokens live
- [ ] Simulated Gemini rate-limit → Groq answers transparently
- [ ] Airplane Mode → cache hit or SLM answers, grounded in MELC
- [ ] Each turn persisted with tier + provider

## Rollback Plan

1. If llama.rn destabilizes the build, gate the SLM behind a flag and keep cloud+cache working; rebuild dev client
2. If streaming fails on device, fall back to `completeChat` (non-streaming) while debugging the SSE reader
3. If a provider's endpoint changed, update base URL/model in `config/env.ts` (no architectural change)

---

**Proceed to**: [Phase 5: Chat & Suri Mascot](../phase_05_chat_mascot/00_PHASE_OVERVIEW.md)
