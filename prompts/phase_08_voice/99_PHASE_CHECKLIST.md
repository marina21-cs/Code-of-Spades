# Phase 8 Completion Checklist

## All Steps Completed

- [ ] 8.1 — TTS engine + Listen + Auditory auto-play
- [ ] 8.2 — Groq Whisper STT + native fallback
- [ ] 8.3 — Voice UI integration (mic + mascot states)

## Verification Tests

```bash
npm run typecheck    # Expected: zero errors
npm run lint         # Expected: zero errors
npx expo run:android # Expected: full voice loop on a physical device (mic required)
```

## Code Quality Checks

- [ ] Groq key from secure-store; never logged
- [ ] Temp audio deleted after transcription
- [ ] Visual JSON not spoken by TTS
- [ ] Voice animations gated under Low Motion

## Manual Verification

- [ ] Listen reads responses; Auditory auto-plays new ones
- [ ] Voice question → transcript → review → send
- [ ] Groq rate-limit → native fallback
- [ ] Text input always available

## Rollback Plan

1. If STT is flaky in the demo venue, default to text input and keep TTS (which is the high-impact, low-risk piece)
2. If recording format fails with Groq, switch container/codec and retry

---

**Proceed to**: [Phase 9: Gamification & Streaks](../phase_09_gamification/00_PHASE_OVERVIEW.md)
