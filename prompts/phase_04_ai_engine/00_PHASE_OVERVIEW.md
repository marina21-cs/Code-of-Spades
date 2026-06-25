# Phase 4: Hybrid AI Engine (3-Tier Routing)

> **Objective**: Build Suri's brain — a system-prompt builder that fuses the Learning Profile + RAG context, an SSE-streaming cloud client, the Gemini→Groq→OpenRouter provider cascade, the on-device SmolLM2 SLM via `llama.rn`, and the tier router that orchestrates all of it.
> **Duration**: ~4–6 hours of agent execution
> **Dependencies**: Phase 0–3

---

## Phase Goals

1. ✅ `buildSystemPrompt(profile, ragChunks)` applied identically across all tiers
2. ✅ Streaming cloud client (one client, OpenAI-compatible) emitting tokens live
3. ✅ Provider cascade with rate-limit-aware proactive failover (invisible to student)
4. ✅ On-device SmolLM2-135M Q4_K_M via `llama.rn` with the Extreme Lite config
5. ✅ Tier router that selects path by `SignalTier`, grounds via RAG, and caches results

## Prompt Files in This Phase

| # | Prompt | Purpose |
|---|--------|---------|
| 4.1 | [01_system_prompt_builder.md](01_system_prompt_builder.md) | Profile + RAG → system prompt |
| 4.2 | [02_cloud_client_streaming.md](02_cloud_client_streaming.md) | OpenAI-compatible SSE streaming fetch |
| 4.3 | [03_provider_cascade.md](03_provider_cascade.md) | Gemini → Groq → OpenRouter failover |
| 4.4 | [04_ondevice_slm.md](04_ondevice_slm.md) | llama.rn + SmolLM2 + model download |
| 4.5 | [05_tier_router.md](05_tier_router.md) | Orchestration across all tiers |

## Key Decisions Made

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Cloud format | OpenAI-compatible messages for all 3 providers | Spec 5.2 — cascade is a single try/catch with different base URLs |
| Primary | Gemini 3 Flash | Best validated Filipino/Tagalog; 1,500 RPD free |
| Fallback 1 | Groq llama-3.1-8b-instant | ~14,400 RPD, <200ms TTFT |
| Fallback 2 | OpenRouter DeepSeek V3 | 200 RPD, strong multilingual |
| Offline model | SmolLM2-135M Q4_K_M (~100MB) | Fits ~400–600MB usable RAM (spec Section 10) |
| SLM config | n_ctx 256, n_threads min(4, cores−1) (1–2 on old chips), use_mlock false | OOM-killer mitigation (spec Section 10) |
| API keys | `expo-secure-store`, runtime-entered, rotatable | Spec Section 10 — no app update to rotate |
| Model warm-up | 30s after app fully loads, background | Spec 5.2 — not on first query |

## Skills to Load

- `ai-product` — LLM integration, RAG grounding, cost/quota strategy
- `llm-app-patterns` — production LLM patterns, streaming, fallback, retries
- `prompt-engineer` — system-prompt design, profile modifiers, code-switching instruction
- `api-security-best-practices` — secure key storage, request hardening, no key leakage
- `ai-wrapper-product` — multi-provider routing and rate-limit handling

## Exit Criteria

Before moving to Phase 5, verify:

- [ ] Same prompt builder used by both cloud and on-device paths
- [ ] Cloud responses stream token-by-token from Gemini
- [ ] Simulating a Gemini rate-limit transparently fails over to Groq, then OpenRouter
- [ ] Provider failover is invisible (no error shown to the student)
- [ ] SmolLM2 downloads (resumable, checksum-verified) and answers offline under the Extreme Lite config
- [ ] Tier router: strong/weak → cloud cascade with reduced payload on weak; offline → cache-then-SLM
- [ ] API keys read from secure-store; never logged
- [ ] `npm run typecheck` and `npm run lint` pass

---

**Next Phase**: [Phase 5: Chat & Suri Mascot](../phase_05_chat_mascot/00_PHASE_OVERVIEW.md)
