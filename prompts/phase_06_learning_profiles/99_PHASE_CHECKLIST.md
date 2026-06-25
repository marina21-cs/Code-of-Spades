# Phase 6 Completion Checklist

## All Steps Completed

- [ ] 6.1 — Profile model + modifiers verified end-to-end
- [ ] 6.2 — First-run setup quiz
- [ ] 6.3 — Settings screen (profile + accessibility + providers + model)

## Verification Tests

```bash
npm run typecheck    # Expected: zero errors
npm run lint         # Expected: zero errors
npx expo run:android # Expected: onboarding → tabs; settings change answers live
```

## Code Quality Checks

- [ ] Single `buildSystemPrompt` for all tiers
- [ ] No condition labels in user-facing copy
- [ ] API keys masked; never echoed
- [ ] Mode descriptors reused (no duplicated strings)

## Manual Verification

- [ ] Fresh install → quiz → personalized mode
- [ ] Same question, Visual vs Auditory → different formats
- [ ] Reader Font / High Contrast toggle live on the settings screen
- [ ] Returning user skips onboarding

## Rollback Plan

1. If onboarding loops, hard-set `hasCompletedSetup` after completion and verify persistence
2. If a provider key UI mishandles secrets, disable that section and keep keys configured via a one-time setup

---

**Proceed to**: [Phase 7: Generative Visuals](../phase_07_visuals/00_PHASE_OVERVIEW.md)
