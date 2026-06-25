# 10.2 Airplane-Mode Offline Test

## Context

<context>
This is Suri's signature validation (spec Section 11, item 9): answer a question online (Tier 1), enable Airplane Mode, ask a NEW, distinctly different question, and watch the UI switch to "Suri Local" and stream tokens from SmolLM2 — validating the offline architecture and the fallback strategy simultaneously. This step makes that flow bulletproof and verifies every transition the judges will see.
</context>

## Prerequisites

<prerequisites>
- Phase 4 (router + SLM), Phase 5 (chat + Local indicator), Phase 2.4 (tier)
- SmolLM2 model downloaded on the test device
</prerequisites>

## AI Implementation Prompt

<instructions>
Validate and harden the full online→offline transition.

Think step by step:

1. **Pre-flight readiness**
   - Add a "Suri Local ready" check surfaced in Settings: model downloaded + checksum valid + context can initialize. The demo requires this to be green before going on stage.
   - Ensure the SLM is pre-warmed (Phase 4.4) so the first offline answer isn't slow.

2. **Transition correctness**
   - Verify the connectivity store flips to `offline` within ~1s of Airplane Mode (Phase 2.4 hysteresis tuned so it doesn't lag the demo).
   - Verify the router, when offline, checks cache first, then SLM — and the chat shows "Suri Local" + moon (Phase 5.4) and the desaturated mascot (Phase 5.3).
   - Ensure a brand-new question (not previously cached) goes to the SLM and streams.

3. **Mid-stream drop (Tier 2 → offline)**
   - Optional but strong: start a weak-signal answer, drop connectivity mid-stream, confirm the `reconnecting` hint then graceful fall to cache/SLM (Phase 4.5).

4. **Recovery**
   - Disable Airplane Mode → tier returns to `strong`, indicator back to "Suri Cloud", next answer uses the cloud cascade.

5. **Scripted self-test (dev)**
   - Add a `__DEV__` "Run offline self-test" button that programmatically: asks a question (cloud), toggles a simulated-offline flag, asks a different question (expects SLM), then clears the flag. Logs PASS/FAIL per step. (Real Airplane Mode is used in the actual demo; the simulated flag helps rehearse without toggling OS settings.)
</instructions>

<requirements>
### Functional Requirements
- Online → offline → online transitions are correct and visible.
- New offline question is answered by the SLM with grounding.
- Indicators (Cloud/Local, moon, mascot desaturation) reflect state.

### Technical Requirements
- Tier flip within ~1s; pre-warmed SLM.
- Dev self-test logs pass/fail per step.

### File Naming Conventions
- Self-test under `src/features/ai/diagnostics/`.
</requirements>

<output_files>
1. `suri/src/features/ai/diagnostics/offline-self-test.ts` — scripted transition test
2. `suri/src/features/profile/settings/OfflineModelSection.tsx` — MODIFIED: "Suri Local ready" status
3. `suri/src/features/ai/connectivity-store.ts` — MODIFIED if hysteresis needs tuning for the demo
4. `suri/src/components/DevTierBadge.tsx` — MODIFIED: show SLM-ready + tier for the demo
</output_files>

## Directory Structure

```
src/features/ai/diagnostics/
└── offline-self-test.ts   ← NEW
```

## Verification

<verification>
- [ ] Settings shows "Suri Local ready" (model + checksum + context OK)
- [ ] Online question answered via cloud (Cloud indicator)
- [ ] Airplane Mode → indicator flips to Local + moon within ~1s
- [ ] New offline question streams from SmolLM2, grounded in MELC
- [ ] Disable Airplane Mode → returns to Cloud; next answer cloud-served
- [ ] Dev self-test logs PASS for each step
- [ ] `npm run typecheck` passes
</verification>

## Troubleshooting

| Symptom | Likely Cause | Fix |
|---|---|---|
| Offline answer slow to start | SLM not pre-warmed | Confirm 30s pre-warm; warm before demo |
| Indicator lags | Hysteresis too long | Reduce to-offline delay for the demo |
| Offline returns cache for a "new" question | Question too similar to a cached one | Use a clearly different question in the demo |
| SLM not ready | Model not downloaded/verified | Download + verify before going on stage |

---

**Previous**: [10.1 States Polish](./01_states_polish.md) | **Next**: [10.3 Performance Hardening](./03_performance_hardening.md)
