# 10.4 Demo Script & Pitch Prep

## Context

<context>
The hackathon is won on stage. This step assembles a tight, rehearsed demo that hits all 10 MVP points from spec Section 11 in a logical order, ensures seed data is loaded and keys/model are ready, and produces a one-page run sheet so the demo can't go sideways. Everything here must run on a physical Android device with no special hardware (spec Section 11).
</context>

## Prerequisites

<prerequisites>
- All phases complete and individually verified
- A physical Android device with the `preview` APK installed, Gemini/Groq keys configured, SmolLM2 downloaded
</prerequisites>

## AI Implementation Prompt

<instructions>
Prepare demo data, a run sheet, and a final dry run.

Think step by step:

1. **Seed demo content**
   - Confirm the Grade 6 Science MELC corpus is seeded (Phase 3.1). Add 2–3 known-good demo questions whose answers ground cleanly (e.g., plant cell parts → triggers a science diagram; a data question → triggers a bar chart).
   - Pre-cache one answer so a cache-hit can be shown offline if desired.

2. **Demo run sheet** (`DEMO_SCRIPT.md` at app root) — ordered to Section 11:
   1. App shell + tabs.
   2. Cloud streaming (Gemini) — ask a Grade 6 Science question; tokens stream.
   3. Provider cascade — toggle the dev `__forceRateLimit.gemini` flag; ask again; note it transparently answers (Groq) — narrate "still resilient."
   4. Learning Profile — show first-run quiz (or switch mode in Settings).
   5. Adaptive response — same question in Visual vs Auditory; show diagram vs spoken prose.
   6. Working RAG — point out the grounded, grade-accurate answer + cited passage.
   7. Visuals — bar chart + plant-cell diagram inline.
   8. Accessibility — toggle Reader Font + High Contrast live (two taps).
   9. TTS — Listen button reads a response.
   10. **Airplane-Mode test** — answer online, enable Airplane Mode, ask a NEW question, watch "Suri Local" stream from SmolLM2.
   11. Mascot — point out Idle/Thinking and (if streak set up) evolution.
   - For each step: the exact tap path, the exact question to type, and the expected result. Include a fallback line if a step misbehaves.

3. **Pre-demo checklist** (in `DEMO_SCRIPT.md`)
   - Device charged; brightness up; Do Not Disturb on; keys configured; model downloaded + "Suri Local ready"; one answer pre-cached; app freshly launched; dev flags reset (except the cascade toggle you'll use intentionally).

4. **Dry run**
   - Execute the full script once on the device end-to-end. Note timing (aim to fit the pitch window) and fix any rough transitions.
   - Confirm nothing requires connectivity that won't be available in the venue (the offline parts must truly be offline).

5. **Fallback plan**
   - If live cloud fails (venue Wi-Fi), the offline SLM + cached answers carry the demo. Document this as the safety net (it's also the product's whole point).
</instructions>

<requirements>
### Functional Requirements
- A complete, ordered run sheet covering all 10 MVP demo points.
- Seed data + pre-cached answer ready.
- A successful end-to-end dry run on a physical device.

### Technical Requirements
- Runs on a stock Android device, no special hardware.
- Offline portions verified to need no network.

### File Naming Conventions
- `DEMO_SCRIPT.md` at app root.
</requirements>

<output_files>
1. `suri/DEMO_SCRIPT.md` — run sheet + pre-demo checklist + fallback plan
2. `suri/assets/melc/grade6-science.json` — MODIFIED if demo questions need supporting chunks
3. Any small fixes found during the dry run (MODIFIED as needed)
</output_files>

## Directory Structure

```
suri/
└── DEMO_SCRIPT.md   ← NEW
```

## Verification

<verification>
- [ ] Full script runs end-to-end on a physical device within the pitch window
- [ ] Each of the 10 MVP points demonstrates successfully
- [ ] Airplane-Mode test is reliable across repeated runs
- [ ] Cascade simulation visibly works
- [ ] Offline portions confirmed to need no network
- [ ] `npm run typecheck`, `npm run lint`, and `eas build --profile preview` all succeed
</verification>

## Troubleshooting

| Symptom | Likely Cause | Fix |
|---|---|---|
| Venue Wi-Fi flaky | Relying on cloud live | Lead with offline strengths; cloud is the bonus |
| Diagram didn't trigger | Question didn't request visual | Use a pre-tested question known to emit a spec |
| Cascade didn't switch | Flag not set | Set `__forceRateLimit.gemini` before that step |
| Slow first offline answer | SLM not warmed | Pre-warm before the segment |

---

**Previous**: [10.3 Performance Hardening](./03_performance_hardening.md) | **Next**: [Phase 10 Checklist](./99_PHASE_CHECKLIST.md)
