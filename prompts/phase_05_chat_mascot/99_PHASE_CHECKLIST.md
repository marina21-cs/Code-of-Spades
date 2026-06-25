# Phase 5 Completion Checklist

## All Steps Completed

- [ ] 5.1 — Chat store with streaming + persistence
- [ ] 5.2 — Chat UI with live token rendering
- [ ] 5.3 — Mascot state machine (low-motion + offline aware)
- [ ] 5.4 — Tier & mode indicators

## Verification Tests

```bash
npm run typecheck    # Expected: zero errors
npm run lint         # Expected: zero errors
npx expo run:android # Expected: full chat loop with streaming + mascot
```

## Code Quality Checks

- [ ] Token updates batched; list rows memoized
- [ ] Single persistence owner
- [ ] Mascot/indicators use narrow selectors (no per-token re-render)
- [ ] No hardcoded colors/fonts

## Manual Verification

- [ ] Ask a question → streamed answer in a bubble
- [ ] History reloads after restart
- [ ] Thinking animation during inference; Idle after
- [ ] Low Motion → static mascot
- [ ] Cloud/Local indicator correct online vs airplane mode

## Rollback Plan

1. If streaming jank persists, increase token batch interval or switch list to FlashList
2. If reanimated crashes, fall back to the static mascot temporarily and debug worklets

---

**Proceed to**: [Phase 6: Learning Profiles](../phase_06_learning_profiles/00_PHASE_OVERVIEW.md)
