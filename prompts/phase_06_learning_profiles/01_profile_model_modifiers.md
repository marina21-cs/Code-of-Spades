# 6.1 Profile Model & Prompt Modifiers (End-to-End)

## Context

<context>
The profile data model and the prompt modifiers were created in Phase 2.3 and Phase 4.1 respectively. This step finalizes the model (any missing fields), and verifies the full path — changing `responseMode` actually changes the format of Suri's answers across tiers — before building the quiz/settings UI on top. This de-risks the headline demo (spec Section 11, item 4: same question, Visual vs Auditory, side by side).
</context>

## Prerequisites

<prerequisites>
- Phase 2.3 (profile store), Phase 4.1 (mode modifiers), Phase 4.5 (router), Phase 5 (chat)
</prerequisites>

## AI Implementation Prompt

<instructions>
Finalize the profile model and verify the modifier pipeline end-to-end.

Think step by step:

1. **Confirm the model** (`src/types/index.ts`)
   - Ensure `LearningProfile` matches spec 5.6 exactly: `responseMode`, `accessibilitySettings` (readerFont, colorVision, highContrast, largeText, focusMode, lowMotion), `gradeLevel`. Add nothing extraneous.

2. **Mode metadata** (`src/features/profile/response-modes.ts`)
   - A descriptor for each `responseMode`: `{ key, label, description, exampleConceptRender }` used by the quiz and settings UI. Labels are student-friendly ("how Suri talks to you"), not clinical.

3. **End-to-end verification harness** (dev-only)
   - Add a small dev screen or a documented manual test: set mode to `visual`, ask "Explain photosynthesis"; then switch to `auditory`, ask again. Confirm:
     - Visual → response includes/requests a diagram spec, short paragraphs.
     - Auditory → flowing prose, no bullets.
     - Reading → bullets/numbered steps.
   - Confirm the SAME `buildSystemPrompt` is used for cloud and SLM (grep the call sites).

4. **Grade-level effect**
   - Verify `gradeLevel` flows into both the prompt (difficulty) and RAG retrieval filter (Phase 3.2). Changing grade changes retrieved chunks.

5. **Document**
   - In a short comment block in `response-modes.ts`, note that the modifier is zero-extra-compute (same model, different instruction) per spec 5.6.
</instructions>

<requirements>
### Functional Requirements
- Each response mode produces a visibly different answer format.
- Grade level affects both prompt and retrieval.

### Technical Requirements
- One `buildSystemPrompt` used by all tiers (verified).
- Mode descriptors drive UI labels (no duplicated strings).

### File Naming Conventions
- `response-modes.ts` in the profile feature.
</requirements>

<output_files>
1. `suri/src/features/profile/response-modes.ts` — mode descriptors
2. `suri/src/types/index.ts` — MODIFIED if any field drift
3. `suri/src/features/profile/index.ts` — MODIFIED barrel
</output_files>

## Directory Structure

```
src/features/profile/
└── response-modes.ts   ← NEW
```

## Verification

<verification>
- [ ] Visual vs Auditory vs Reading modes produce distinctly formatted answers for the same question
- [ ] `buildSystemPrompt` is the only prompt path for cloud and SLM
- [ ] Changing grade level changes retrieved MELC chunks and answer difficulty
- [ ] `npm run typecheck` passes
</verification>

## Troubleshooting

| Symptom | Likely Cause | Fix |
|---|---|---|
| Modes look identical | Modifier not reaching the model | Trace `buildSystemPrompt` output; confirm router passes profile |
| Grade has no effect | Retrieval ignores grade | Pass `profile.gradeLevel` into `retrieveForTier` |

---

**Previous**: [Phase 6 Overview](./00_PHASE_OVERVIEW.md) | **Next**: [6.2 First-Run Quiz](./02_first_run_quiz.md)
