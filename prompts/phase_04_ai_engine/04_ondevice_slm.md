# 4.4 On-Device SLM (llama.rn + SmolLM2)

## Context

<context>
When completely offline, Suri runs a quantized SLM on-device — SmolLM2-135M-Instruct Q4_K_M (~100MB) via `llama.rn` v0.12.5 (spec 5.2 Tier 3). The hard constraint is the Android OOM killer on 2GB devices: only ~400–600MB usable RAM (spec Section 10). So this step uses the "Extreme Lite" config (n_ctx 256, limited threads, no mlock), a resumable checksum-verified model download, and background pre-warming 30s after load. The SLM consumes the SAME system prompt builder (4.1) and RAG grounding (Phase 3) as the cloud path.
</context>

## Prerequisites

<prerequisites>
- Phase 4.1 (prompt builder)
- Phase 3 (RAG retrieval)
- `expo-file-system` (Phase 0) for resumable download
- Running on a **custom dev client** (llama.rn is native — not in Expo Go)
</prerequisites>

## AI Implementation Prompt

<instructions>
Install llama.rn, implement model download + lifecycle, and a guarded inference path.

Think step by step:

1. **Install native module**
   - Add `llama.rn` (v0.12.5). Rebuild the dev client (`npx expo run:android`) so the native module links. Document that Expo Go cannot host it.
   - SmolLM2-135M-Instruct Q4_K_M GGUF is fetched at runtime (not bundled) to keep the APK ~35–40MB.

2. **Model download** (`src/features/ai/slm/model-download.ts`)
   - Use `expo-file-system` `createDownloadResumable` (resumable on flaky connections — spec Section 10). Source: the SmolLM2-135M-Instruct-GGUF Q4_K_M URL (record in `appendix/B_AI_PROVIDER_REFERENCE.md`).
   - Show per-MB progress + ETA via a progress callback. Persist resume data so a paused download continues.
   - Verify a SHA-256 checksum before marking the model usable (spec Section 10). Store the validated path + a "model ready" flag.
   - Pre-flight: if free storage < 200MB, defer with a friendly message rather than failing silently (spec Section 10).
   - Download is opt-in with the storage cost shown ("This download uses ~100MB of storage").

3. **SLM lifecycle** (`src/features/ai/slm/llama-context.ts`)
   - `initSlm()` — initialize a `llama.rn` context with the Extreme Lite config (spec Section 10):
     - `n_ctx: 256`
     - `n_threads: Math.min(4, deviceCpuCount - 1)`, and clamp to 1–2 on very old/low-core devices
     - `use_mlock: false`
     - CPU by default; let llama.rn auto-detect Vulkan where capable (spec 5.2) — keep a flag to disable GPU if it causes instability.
   - Singleton context; never initialize twice. Provide `releaseSlm()` to free memory under pressure.
   - `isSlmReady()` reflects model-downloaded + context-initialized.

4. **Background pre-warm** (`src/features/ai/slm/prewarm.ts`)
   - 30s after the app fully loads, if the model is present, initialize the context in the background (spec 5.2) so the first offline query isn't slow. Do NOT pre-warm on first query.

5. **Inference** (`src/features/ai/slm/slm-generate.ts`)
   - `streamSlm(params: { systemPrompt, userQuestion, signal }): AsyncGenerator<string>`:
     - Build the prompt via the SmolLM2 chat template using the 4.1 system prompt + the user question.
     - Cap output at `SLM_MAX_TOKENS` (200) (spec Section 10). Stream tokens via llama.rn's token callback, yielding each.
     - Frame the response as a structured summary, not open-ended generation (spec Section 10).
     - Honor the abort signal (stop generation).
</instructions>

<requirements>
### Functional Requirements
- Model downloads resumably, checksum-verified, opt-in with storage cost shown.
- Offline inference streams tokens and stops at ~200 tokens.
- Context pre-warms 30s after load when the model exists.

### Technical Requirements
- Extreme Lite config: n_ctx 256, threads min(4, cores−1) clamped low on old chips, use_mlock false.
- Singleton context; releasable under memory pressure.
- Same system prompt builder as cloud.
- CPU default; Vulkan auto-detect with a disable flag.

### File Naming Conventions
- Files under `src/features/ai/slm/`.
</requirements>

<output_files>
1. `suri/src/features/ai/slm/model-download.ts` — resumable download + checksum + storage pre-flight
2. `suri/src/features/ai/slm/llama-context.ts` — context lifecycle (Extreme Lite config)
3. `suri/src/features/ai/slm/prewarm.ts` — 30s background warm-up
4. `suri/src/features/ai/slm/slm-generate.ts` — streaming inference
5. `suri/src/constants/index.ts` — MODIFIED: model URL, checksum, n_ctx, thread rules, min-free-storage
6. `suri/src/features/ai/index.ts` — MODIFIED barrel
7. `suri/package.json` — MODIFIED: `llama.rn` dependency
</output_files>

## Directory Structure

```
src/features/ai/slm/
├── model-download.ts   ← NEW
├── llama-context.ts    ← NEW
├── prewarm.ts          ← NEW
└── slm-generate.ts     ← NEW
```

## Verification

<verification>
- [ ] Model download shows progress, resumes after interruption, verifies checksum
- [ ] Download deferred (not crashed) when free storage < 200MB
- [ ] In Airplane Mode, `streamSlm` produces a coherent 2–3 sentence grounded answer
- [ ] Output stops at ~200 tokens
- [ ] Context initializes once; `releaseSlm()` frees it
- [ ] App does not crash (OOM) during inference on a low-RAM device/emulator
- [ ] `npm run typecheck` passes
</verification>

## Troubleshooting

| Symptom | Likely Cause | Fix |
|---|---|---|
| App force-closes during inference | OOM killer | Confirm n_ctx 256, use_mlock false, threads low; release other buffers |
| UI freezes while generating | Too many threads | Clamp `n_threads` to 1–2 on old chips |
| `llama.rn` not found | Built in Expo Go | Rebuild dev client with `expo run:android` |
| Download stalls forever | No resume data persisted | Persist `createDownloadResumable` save state; resume on retry |
| Checksum mismatch | Partial/corrupt download | Re-download; verify the URL and expected SHA-256 |

---

**Previous**: [4.3 Provider Cascade](./03_provider_cascade.md) | **Next**: [4.5 Tier Router](./05_tier_router.md)
