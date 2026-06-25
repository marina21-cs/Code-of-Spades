# Phase 10: Offline Validation & Polish

> **Objective**: Make Suri demo-ready and robust — complete loading/error/empty states, validate the headline Airplane-Mode test, harden performance/memory for budget devices, and prepare the pitch demo script.
> **Duration**: ~3–4 hours of agent execution
> **Dependencies**: All prior phases

---

## Phase Goals

1. ✅ Every screen has proper loading, error, and empty states
2. ✅ The Airplane-Mode test (Tier 1 → Tier 3) works flawlessly and visibly
3. ✅ Performance/memory hardened for ~2GB-RAM devices (no OOM during inference)
4. ✅ A rehearsed demo script mapping to spec Section 11's MVP demo points

## Prompt Files in This Phase

| # | Prompt | Purpose |
|---|--------|---------|
| 10.1 | [01_states_polish.md](01_states_polish.md) | Loading/error/empty states + error boundaries |
| 10.2 | [02_airplane_mode_test.md](02_airplane_mode_test.md) | End-to-end offline transition validation |
| 10.3 | [03_performance_hardening.md](03_performance_hardening.md) | Memory/perf for budget devices |
| 10.4 | [04_demo_prep.md](04_demo_prep.md) | Demo script + seed data + dry run |

## Key Decisions Made

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Offline proof | Live Airplane-Mode test | Spec Section 11 item 9 — validates offline + cascade |
| Memory | Verify OOM mitigations end-to-end | Spec Section 10 budget-device constraints |
| States | Friendly, branded, recoverable | Spec brand voice; never white-screen |
| Demo | Scripted to the 10 MVP points | Spec Section 11 |

## Skills to Load

- `react-ui-patterns` — loading/error/empty state patterns
- `verification-before-completion` — pre-demo verification checklist discipline
- `systematic-debugging` — diagnosing memory/perf issues on device
- `web-performance-optimization` — bundle/startup/runtime perf principles (apply to RN)
- `mobile-design` — budget-device performance, smooth interactions

## Exit Criteria

Project is demo-ready when:

- [ ] No screen can white-screen; all have loading/error/empty states + error boundaries
- [ ] Airplane-Mode test: answer online → enable airplane mode → ask a NEW question → "Suri Local" streams from SmolLM2
- [ ] Provider cascade demo works (simulated Gemini rate-limit → Groq)
- [ ] App runs without OOM on a low-RAM device/emulator during SLM inference
- [ ] Accessibility toggles demo cleanly (Reader Font, High Contrast, Large Text, Low Motion)
- [ ] Visual generation demo works (bar chart + science diagram)
- [ ] TTS Listen demo works
- [ ] `npm run typecheck`, `npm run lint`, and a `preview` APK build all pass

---

**This is the final phase.** After completion, run the post-implementation checklist in `00_MASTER_INDEX.md`.
