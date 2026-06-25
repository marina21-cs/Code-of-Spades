# 6.2 First-Run Setup Quiz

## Context

<context>
On first run, Suri presents a short 5-question interactive sequence showing the same concept in different formats and asking which felt clearest; the student can skip to manual selection (spec 5.6). This is the moment personalization is established and is shown early in the demo (spec Section 11, item 3). The result sets `responseMode` and `gradeLevel`, marks `hasCompletedSetup`, and routes into the app.
</context>

## Prerequisites

<prerequisites>
- Phase 2.3 (profile store, onboarding gate, `hasCompletedSetup`)
- Phase 6.1 (mode descriptors)
- Phase 1 (themed components)
</prerequisites>

## AI Implementation Prompt

<instructions>
Build the onboarding flow at `app/onboarding.tsx` (placeholder created in Phase 1.4).

Think step by step:

1. **Welcome + grade step**
   - Friendly Suri intro (brand voice). Ask the student's grade level (4–10 selector) — needed for RAG + difficulty.

2. **Five preference questions** (`src/features/profile/onboarding/quiz-questions.ts`)
   - Each question presents the SAME small concept rendered in different formats (e.g., a simple idea shown as: a diagram, a spoken/prose version, a bulleted version, an interactive tap version) and asks "Which felt clearest?".
   - Map answers to modality votes (visual / auditory / reading / kinesthetic). Tally across the 5 questions.
   - Keep each question lightweight; use real Suri-style mini examples (can be static for the quiz; not AI-generated, to stay offline and fast).

3. **Scoring** (`src/features/profile/onboarding/score.ts`)
   - Tally votes → dominant modality → `responseMode`. Ties or no clear winner → `mixed`.
   - Pure, testable function.

4. **Skip / manual path**
   - A "Choose manually" option on any screen that jumps to a mode selector (reuse mode descriptors from 6.1). Skipping entirely → `mixed`.

5. **Completion**
   - Save `responseMode` + `gradeLevel` to the profile store (persists via secure-store), set `hasCompletedSetup = true`, and navigate to the tabs.
   - The onboarding gate (Phase 2.3) ensures this screen only shows when `!hasCompletedSetup`.

6. **Accessibility**
   - Offer a quick "I prefer larger text / easier-to-read font" optional toggle here too (sets Large Text / Reader Font), framed as comfort — not condition. Optional, skippable.
</instructions>

<requirements>
### Functional Requirements
- 5-question quiz sets `responseMode`; skip → `mixed`.
- Grade level captured.
- Completion persists profile and routes to tabs; shown only on first run.

### Technical Requirements
- Quiz examples are static (offline, fast) — not AI-generated.
- Scoring is a pure function.
- Reuses mode descriptors; no duplicated copy.

### File Naming Conventions
- Onboarding files under `src/features/profile/onboarding/`.
</requirements>

<output_files>
1. `suri/app/onboarding.tsx` — MODIFIED: real multi-step flow
2. `suri/src/features/profile/onboarding/quiz-questions.ts` — questions + format examples
3. `suri/src/features/profile/onboarding/score.ts` — vote tally → mode
4. `suri/src/features/profile/onboarding/OnboardingSteps.tsx` — step components
5. `suri/src/features/profile/index.ts` — MODIFIED barrel
</output_files>

## Directory Structure

```
app/onboarding.tsx                       ← MODIFIED
src/features/profile/onboarding/
├── quiz-questions.ts     ← NEW
├── score.ts              ← NEW
└── OnboardingSteps.tsx   ← NEW
```

## Verification

<verification>
- [ ] Fresh install shows onboarding; completing it sets a non-default mode based on answers
- [ ] Choosing visual-leaning answers yields `visual`; mixed answers yield `mixed`
- [ ] Skip → `mixed` and proceeds
- [ ] Grade level saved and used by RAG afterwards
- [ ] Re-launch after completion goes straight to tabs
- [ ] `npm run typecheck` and `npm run lint` pass
</verification>

## Troubleshooting

| Symptom | Likely Cause | Fix |
|---|---|---|
| Onboarding shows every launch | `hasCompletedSetup` not persisted | Ensure completion writes to secure-store |
| Always lands on `mixed` | Scoring not tallying | Verify answer→modality mapping and tally |
| Can't reach tabs after finishing | Navigation not triggered | Navigate after persisting; clear the gate |

---

**Previous**: [6.1 Profile Model & Modifiers](./01_profile_model_modifiers.md) | **Next**: [6.3 Settings Screen](./03_settings_screen.md)
