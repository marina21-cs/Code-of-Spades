# Phase 8: Voice Mode (TTS + STT)

> **Objective**: Add text-to-speech for every Suri response (auto-play in Auditory mode), and speech-to-text via Groq Whisper (primary) with a native OS recognition fallback — making Suri accessible to lower-literacy and reading-difficulty learners.
> **Duration**: ~3 hours of agent execution
> **Dependencies**: Phase 0–7 (chat from Phase 5; profile/Auditory mode from Phase 6; keys from Phase 4.2)

---

## Phase Goals

1. ✅ "Listen" button on every assistant message; auto-play in Auditory mode (`expo-speech`)
2. ✅ Mic input → transcription via Groq Whisper API (online), native fallback when rate-limited
3. ✅ Voice UI wired to the mascot Listening state and the composer

## Prompt Files in This Phase

| # | Prompt | Purpose |
|---|--------|---------|
| 8.1 | [01_tts_engine.md](01_tts_engine.md) | expo-speech TTS service + Listen/auto-play |
| 8.2 | [02_stt_engine.md](02_stt_engine.md) | Groq Whisper STT + native fallback |
| 8.3 | [03_voice_ui_integration.md](03_voice_ui_integration.md) | Mic UI, Listening state, transcript → send |

## Key Decisions Made

| Decision | Choice | Rationale |
|----------|--------|-----------|
| TTS | `expo-speech` (OS engine) | Spec 5.7; offline on iOS, device TTS on Android |
| STT primary | Groq Whisper Large v3 Turbo API | Spec 5.7; 2,000/day free, fast, Filipino+English |
| STT fallback | `expo-speech-recognition` (native OS) | Spec 5.7; when Groq rate-limited |
| Offline STT | `whisper.rn` (ggml-tiny) | Roadmap — NOT in MVP (spec Section 11 "not required") |
| Auditory mode | Auto-play TTS on each response | Spec 5.6/5.7 |
| Voice input | Additive, never required; text always available | Spec 5.7 |

## Skills to Load

- `voice-ai-development` — TTS/STT integration, audio capture, latency handling
- `voice-agents` — voice UX patterns, push-to-talk, transcription flow
- `ai-product` — Whisper API usage, quota handling
- `mobile-design` — permissions UX, mic affordances, accessibility

## Exit Criteria

Before moving to Phase 9, verify:

- [ ] Listen button reads any assistant response aloud; stop works
- [ ] Auditory mode auto-plays TTS on new responses
- [ ] Holding the mic records, transcribes via Groq Whisper, and fills the composer
- [ ] When Groq STT is rate-limited, native recognition fallback engages (or text input is offered)
- [ ] Mascot enters Listening state while recording
- [ ] Mic permission handled gracefully; text input always available
- [ ] `npm run typecheck` and `npm run lint` pass

---

**Next Phase**: [Phase 9: Gamification & Streaks](../phase_09_gamification/00_PHASE_OVERVIEW.md)
