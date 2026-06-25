# 4.5 Tier Router (Orchestration)

## Context

<context>
This is the conductor that ties the engine together. Per spec 5.2: Tier 1 (strong) → cloud cascade with full payload (top-3 MELC); Tier 2 (weak) → cloud cascade with reduced payload (top-1 MELC, 150-token cap) then cached responses; Tier 3 (offline) → cached response if available, else the on-device SLM with top-5 MELC. Tier transitions are automatic and invisible (spec 5.2). The router exposes one streaming API the chat layer (Phase 5) calls, and it grounds every request via RAG and caches successful cloud answers.
</context>

## Prerequisites

<prerequisites>
- Phases 4.1–4.4 complete (prompt builder, cascade, SLM)
- Phase 2.4 (`useSignalTier`/connectivity store)
- Phase 3 (retriever + cache)
</prerequisites>

## AI Implementation Prompt

<instructions>
Implement the router that selects a path by tier, grounds via RAG, streams, and caches.

Think step by step:

1. **Router types** (`src/features/ai/router/types.ts`)
   - `AskParams { question; profile; history; signal }`.
   - `AskEvent` union streamed to the caller: `{ type: 'token'; value }`, `{ type: 'tier'; tier; provider? }`, `{ type: 'cache_hit' }`, `{ type: 'reconnecting' }`, `{ type: 'done'; fullText; visualSpec? }`, `{ type: 'error'; message }`.

2. **Router** (`src/features/ai/router/ask.ts`)
   - `async function* ask(params): AsyncGenerator<AskEvent>`:
     - Read current `SignalTier` from the connectivity store.
     - Emit a `tier` event up front.
     - **Strong:** retrieve top-3 (online k) via `retrieveForTier(q,'strong',profile)`; build system prompt (allowVisual per profile mode); stream via `streamWithCascade`; accumulate text; on success, write to response cache; emit `done`.
     - **Weak:** retrieve top-1; build a compact system prompt with `maxTokensHint=150`; stream via cascade with `maxTokens=150`. If the cascade fails or signal drops mid-stream, emit `reconnecting`, then check the response cache for the query; if hit, emit `cache_hit` + the cached text; else fall through to offline.
     - **Offline:** first check `getCachedResponse(q, grade)`; if hit → emit `cache_hit` + stream the cached text in chunks → `done`. Else, ensure SLM ready (`isSlmReady`); retrieve top-5; build a tight system prompt (top-1 short chunk passed to the model to respect n_ctx per spec Section 10, even though 5 are retrieved for ranking — pass the single best to the model, keep others for potential re-ranking); `streamSlm`; emit tokens; `done`. If the model isn't downloaded, emit an `error` event instructing the student to download it or connect.
     - Wrap the whole thing so `AllProvidersFailedError` on online tiers degrades to the offline path (cache → SLM) automatically — making the fallback truly graceful.

3. **Visual spec extraction**
   - As tokens accumulate, detect a fenced ```json visual block (Phase 7 schema). On `done`, parse it out, set `visualSpec`, and strip it from the displayed text. Keep extraction tolerant (only when `allowVisual`).

4. **Persistence**
   - On `done` for any tier, persist the user + assistant messages (with `tier` and `provider`) via the message repository (Phase 2), and the `visual_spec` JSON when present.

5. **Single public API**
   - Export `ask` from the ai barrel. Phase 5's chat store consumes only this.
</instructions>

<requirements>
### Functional Requirements
- Strong → cloud cascade, top-3, cache the answer.
- Weak → cloud cascade, top-1, 150-token cap, graceful mid-stream recovery to cache.
- Offline → cache-first, else SLM with tight context.
- Online failure degrades to offline path automatically.
- Tier and failover are invisible beyond a subtle indicator (Phase 5).

### Technical Requirements
- One `ask()` async generator is the only public entry the UI uses.
- Every completed turn persisted with tier/provider/visual spec.
- Reuses cascade, SLM, prompt builder, retriever, cache — no duplicated logic.

### File Naming Conventions
- Files under `src/features/ai/router/`.
</requirements>

<output_files>
1. `suri/src/features/ai/router/types.ts` — `AskParams`, `AskEvent`
2. `suri/src/features/ai/router/ask.ts` — orchestration generator
3. `suri/src/features/ai/router/visual-extract.ts` — JSON visual-spec extraction
4. `suri/src/features/ai/index.ts` — MODIFIED: export `ask`
</output_files>

## Directory Structure

```
src/features/ai/router/
├── types.ts          ← NEW
├── ask.ts            ← NEW
└── visual-extract.ts ← NEW
```

## Verification

<verification>
- [ ] Strong signal: streams from cloud, caches the answer, persists the turn
- [ ] Weak signal: uses top-1 + 150-token cap; mid-stream drop emits `reconnecting`
- [ ] Offline with cached answer: emits `cache_hit` and replays cached text
- [ ] Offline without cache: SLM answers using grounded context
- [ ] Online all-fail: automatically degrades to cache/SLM without a hard error
- [ ] A visual-spec fenced block is parsed out of the text on `done`
- [ ] `npm run typecheck` and `npm run lint` pass
</verification>

## Troubleshooting

| Symptom | Likely Cause | Fix |
|---|---|---|
| Offline path errors instead of using cache | Cache check after SLM | Check cache BEFORE attempting SLM |
| Online failure shows raw error | Not catching `AllProvidersFailedError` | Catch it and fall through to offline path |
| Visual JSON shown as text | Extraction not stripping block | Strip the fenced block from display text on done |
| Turn not saved | Persistence only on cloud path | Persist on `done` for ALL tiers |

---

**Previous**: [4.4 On-Device SLM](./04_ondevice_slm.md) | **Next**: [Phase 4 Checklist](./99_PHASE_CHECKLIST.md)
