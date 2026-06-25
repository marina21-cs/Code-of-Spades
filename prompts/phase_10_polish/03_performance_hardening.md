# 10.3 Performance & Memory Hardening

## Context

<context>
Running a generative model on a 2GB-RAM 2016 device is the hard constraint — the Android OOM killer, not ROM, is what crashes the app (spec Section 10). With only ~400–600MB usable RAM, this step verifies and tightens every memory mitigation end-to-end: the Extreme Lite SLM config, lazy native init, WAL concurrency, and React Native runtime perf (no jank during streaming/animation). The goal is the SLM ingesting a RAG chunk and streaming a 2–3 sentence answer live without force-closing.
</context>

## Prerequisites

<prerequisites>
- Phase 4.4 (SLM config), Phase 2.1 (WAL), Phase 3.2 (lazy embedder), Phase 5 (chat/mascot)
</prerequisites>

## AI Implementation Prompt

<instructions>
Audit and harden runtime memory + performance.

Think step by step:

1. **SLM memory audit** (confirm against spec Section 10)
   - `n_ctx: 256`, `use_mlock: false`, `n_threads` = `min(4, cores−1)` clamped to 1–2 on low-core/old chips.
   - Offline path passes the single most relevant short MELC chunk to the model (retrieve 5 for ranking, feed 1) so the KV cache stays tiny.
   - Output capped at `SLM_MAX_TOKENS` (200).
   - `releaseSlm()` is called when memory pressure is detected or the app backgrounds for a long time; re-init lazily on next offline use.

2. **Lazy initialization**
   - Confirm ML Kit (roadmap) and `whisper.rn` (roadmap) are NOT initialized at startup. The embedder (Phase 3.2) and the SLM context init only on first use / pre-warm. Audit for accidental eager imports of native modules.

3. **DB concurrency**
   - Confirm WAL is active and RAG reads don't block on background writes (cache writes, message persistence). Keep write transactions short.

4. **RN runtime perf**
   - Streaming: token batching (Phase 5.1) verified — no per-token re-render.
   - Lists: memoized rows, stable keys.
   - Animations: reanimated on UI thread; pause offscreen; Low Motion fully static.
   - Confirm Hermes is enabled (Phase 0) and check the JS bundle size.

5. **Low-RAM test pass**
   - Test on a low-RAM device or an emulator configured to ~2GB. Run a full offline inference while the chat list has history and the mascot animates. Watch for OOM/force-close. Document the device tested and the result.

6. **Storage footprint check**
   - Verify the rough target footprint (spec Section 10): ~40MB APK + ~100MB SLM (optional) + ~15MB MELC DB. Report actual numbers.
</instructions>

<requirements>
### Functional Requirements
- Offline inference completes without OOM on a ~2GB device.
- No UI jank during streaming or mascot animation.

### Technical Requirements
- Extreme Lite SLM config verified.
- Native modules lazy-initialized; no eager startup cost.
- WAL concurrency confirmed; short write transactions.
- Hermes on; bundle size reasonable.

### File Naming Conventions
- Any perf utilities under `src/lib/perf/`.
</requirements>

<output_files>
1. `suri/src/features/ai/slm/llama-context.ts` — MODIFIED: confirm config + memory-pressure release
2. `suri/src/lib/perf/memory.ts` — optional memory-pressure listener + release hooks
3. `suri/PERF_NOTES.md` — documented test device, results, footprint numbers
4. Misc MODIFIED: any eager-import or re-render fixes found in the audit
</output_files>

## Directory Structure

```
src/lib/perf/
└── memory.ts   ← NEW (optional)
PERF_NOTES.md   ← NEW
```

## Verification

<verification>
- [ ] Full offline inference on a ~2GB device/emulator completes without force-close
- [ ] No per-token re-render (verified via render logging in dev)
- [ ] Native modules not initialized at startup (verified)
- [ ] WAL active; RAG reads not blocked by writes
- [ ] Footprint numbers documented in PERF_NOTES.md
- [ ] `npm run typecheck` and `npm run lint` pass
</verification>

## Troubleshooting

| Symptom | Likely Cause | Fix |
|---|---|---|
| Force-close during inference | KV cache too big | Lower n_ctx; feed 1 short chunk; use_mlock false |
| UI frozen during generation | Too many threads | Clamp `n_threads` to 1–2 on old chips |
| Slow cold start | Eager native init | Lazy-init embedder/SLM; confirm Hermes |
| Jank scrolling history | Unmemoized list | Memoize rows; stable keys; consider FlashList |

---

**Previous**: [10.2 Airplane-Mode Test](./02_airplane_mode_test.md) | **Next**: [10.4 Demo Prep](./04_demo_prep.md)
