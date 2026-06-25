# Phase 9: Gamification & Streaks

> **Objective**: Build the local-only streak system, mascot evolution (kit → young → elder fox), badges, and local streak-reminder notifications — all without a backend.
> **Duration**: ~2 hours of agent execution
> **Dependencies**: Phase 0–8 (DB from Phase 2; mascot from Phase 5; Focus Mode from Phase 1)

---

## Phase Goals

1. ✅ Study streaks tracked locally in SQLite (no backend)
2. ✅ Suri evolves visually as streaks build (kit → young → elder fox with glowing markings)
3. ✅ Badges for subject completions, streak milestones, voice sessions, first camera capture (camera = roadmap; badge defined)
4. ✅ Local (no-server) streak reminders at the student's chosen time; Focus Mode boosts micro-rewards

## Prompt Files in This Phase

| # | Prompt | Purpose |
|---|--------|---------|
| 9.1 | [01_streak_engine.md](01_streak_engine.md) | Streak/badge logic over SQLite |
| 9.2 | [02_mascot_evolution.md](02_mascot_evolution.md) | Evolution stages tied to streaks |
| 9.3 | [03_local_notifications.md](03_local_notifications.md) | expo-notifications local reminders |

## Key Decisions Made

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Storage | SQLite (`streaks`, `badges`, `study_log`) | Spec 5.9 — no backend |
| Evolution | kit → young → elder, glowing markings | Spec 5.9/7 — distinct from Duolingo |
| Notifications | `expo-notifications`, local only | Spec 5.9 — no server |
| Focus Mode | More frequent micro-rewards | Spec 5.6/5.9 — attention regulation |
| Micro-rewards | Trigger mascot Celebrating (Phase 5.3) | Spec 5.8 |

## Skills to Load

- `react-patterns` — store + effects for streak updates and reward triggers
- `mobile-design` — notification UX, reward moments, non-intrusive delight
- `clean-code` — keep streak math correct and simple

## Exit Criteria

Before moving to Phase 10, verify:

- [ ] Studying today increments the streak; missing a day resets per the rules
- [ ] Streak milestones evolve the mascot stage and trigger a celebration
- [ ] Badges award and persist; visible somewhere (Profile or a small shelf)
- [ ] A local reminder notification schedules at the chosen time (no server)
- [ ] Focus Mode increases micro-reward frequency
- [ ] `npm run typecheck` and `npm run lint` pass

---

**Next Phase**: [Phase 10: Offline Validation & Polish](../phase_10_polish/00_PHASE_OVERVIEW.md)
