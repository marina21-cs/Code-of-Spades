# Phase 9 Completion Checklist

## All Steps Completed

- [ ] 9.1 — Streak engine + badges + rewards
- [ ] 9.2 — Mascot evolution mechanic
- [ ] 9.3 — Local notifications

## Verification Tests

```bash
npm run typecheck    # Expected: zero errors
npm run lint         # Expected: zero errors
npx expo run:android # Expected: streaks update, mascot evolves, reminder schedules
```

## Code Quality Checks

- [ ] Local-date streak math (no timezone bugs)
- [ ] Badges unique-keyed; awarded once
- [ ] Notifications local-only; no duplicates
- [ ] Evolution stage persisted

## Manual Verification

- [ ] Study today → streak +1; simulate gap → reset
- [ ] Cross a milestone → evolve + celebrate once
- [ ] Reminder fires offline at chosen time
- [ ] Focus Mode increases micro-rewards

## Rollback Plan

1. If notifications misbehave on a device, disable the feature flag; core app unaffected
2. If streak math is off, fix `computeNextStreak` (pure) and re-test the date cases

---

**Proceed to**: [Phase 10: Offline Validation & Polish](../phase_10_polish/00_PHASE_OVERVIEW.md)
