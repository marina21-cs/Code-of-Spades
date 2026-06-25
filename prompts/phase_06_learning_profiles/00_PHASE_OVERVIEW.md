# Phase 6: Learning Profiles

> **Objective**: Deliver Suri's core differentiator — the first-run Learning Profile setup quiz, the response-mode model that reshapes every answer, and the Settings screen for profile + accessibility (all editable anytime).
> **Duration**: ~2–3 hours of agent execution
> **Dependencies**: Phase 0–5 (profile store from Phase 2; prompt modifiers from Phase 4.1)

---

## Phase Goals

1. ✅ First-run 5-question interactive quiz (with skip-to-manual) that sets the response mode
2. ✅ Response mode drives the prompt builder live (already wired in 4.1 — verify end-to-end)
3. ✅ Settings screen: grade level, response mode, and all six accessibility settings
4. ✅ Onboarding gate routes new users to setup; returning users go straight to tabs

## Prompt Files in This Phase

| # | Prompt | Purpose |
|---|--------|---------|
| 6.1 | [01_profile_model_modifiers.md](01_profile_model_modifiers.md) | Finalize profile model + verify modifier end-to-end |
| 6.2 | [02_first_run_quiz.md](02_first_run_quiz.md) | Interactive setup quiz + manual selector |
| 6.3 | [03_settings_screen.md](03_settings_screen.md) | Editable profile + accessibility settings |

## Key Decisions Made

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Quiz | 5 questions showing same concept in different formats | Spec 5.6 — pick what felt clearest |
| Skip path | Manual selection; skip → `mixed` default | Spec 5.6 |
| Framing | "How Suri talks to you" — no condition labels | Spec design note |
| Editability | Everything editable in Settings anytime | Spec 5.6 |
| Mechanism | System-prompt modifier (zero extra compute) | Spec 5.6 — same model, different format |

## Skills to Load

- `onboarding-cro` — first-run activation, reducing setup friction
- `form-cro` — selection UX, defaults, skip paths
- `react-ui-patterns` — segmented controls, settings rows, instant feedback
- `mobile-design` — touch-first settings, platform conventions

## Exit Criteria

Before moving to Phase 7, verify:

- [ ] Fresh install routes to the first-run quiz; completing it sets the profile
- [ ] Skipping the quiz sets `mixed` and proceeds
- [ ] Asking the same question in Visual vs Auditory mode yields different formats (spec demo item 4)
- [ ] Settings changes (mode, grade, accessibility) persist and apply immediately
- [ ] Returning users skip onboarding and land on tabs
- [ ] `npm run typecheck` and `npm run lint` pass

---

**Next Phase**: [Phase 7: Generative Visuals](../phase_07_visuals/00_PHASE_OVERVIEW.md)
