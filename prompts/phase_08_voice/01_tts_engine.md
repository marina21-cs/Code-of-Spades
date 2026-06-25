# 8.1 TTS Engine (expo-speech)

## Context

<context>
Text-to-Speech reads every Suri response aloud; Auditory mode auto-enables it, and a "Listen" button appears on every response in all modes (spec 5.7). TTS works offline on iOS (native OS engine) and uses the device's installed TTS engine on Android (spec 5.7/8). This is a low-effort, high-impact accessibility win (spec Section 11, item 8) for lower-literacy and reading-difficulty learners.
</context>

## Prerequisites

<prerequisites>
- `expo-speech` (Phase 0)
- Phase 5 (chat + MessageBubble Listen slot), Phase 6 (Auditory mode in profile)
</prerequisites>

## AI Implementation Prompt

<instructions>
Build a TTS service and wire Listen + auto-play.

Think step by step:

1. **TTS service** (`src/features/voice/tts.ts`)
   - Wrap `expo-speech`: `speak(text, opts)`, `stop()`, `isSpeaking()`.
   - Choose language/voice: prefer Filipino (`fil`/`tl`) when the response is Filipino, else English; allow rate/pitch tuning. Detect language heuristically from the text (simple Tagalog-keyword heuristic is fine for MVP) or use the profile.
   - Strip the visual-spec JSON and markdown artifacts before speaking (speak the prose only).
   - Handle Android's dependency on an installed TTS engine: if unavailable, surface a gentle hint; never crash.

2. **TTS store/hook** (`src/features/voice/tts-store.ts`)
   - Track `speakingMessageId` so the UI shows which message is playing and only one plays at a time. `toggleSpeak(messageId, text)` stops if same, switches if different.

3. **Listen button**
   - In `MessageBubble` (5.2), implement the Listen affordance: tap to play/stop; reflects `speakingMessageId`. Accessible label.

4. **Auto-play in Auditory mode**
   - When the chat store finalizes (`done`) an assistant message AND `responseMode === 'auditory'`, auto-call `speak` on it. Respect a user mute/disable option.
   - Don't auto-play cached/replayed history on session load — only new responses.

5. **Lifecycle**
   - Stop speech when leaving the chat screen or sending a new message.
</instructions>

<requirements>
### Functional Requirements
- Listen button plays/stops any assistant response.
- Auditory mode auto-plays new responses only.
- Filipino vs English voice chosen appropriately.
- Visual JSON/markdown not spoken.

### Technical Requirements
- One active utterance at a time.
- Graceful handling when no Android TTS engine is present.

### File Naming Conventions
- `tts.ts`, `tts-store.ts`.
</requirements>

<output_files>
1. `suri/src/features/voice/tts.ts` — speak/stop service + language pick + text cleaning
2. `suri/src/features/voice/tts-store.ts` — playing-state store
3. `suri/src/features/chat/components/MessageBubble.tsx` — MODIFIED: Listen button wired
4. `suri/src/features/chat/chat-store.ts` — MODIFIED: auto-play hook on done (Auditory)
5. `suri/src/features/voice/index.ts` — MODIFIED barrel
</output_files>

## Directory Structure

```
src/features/voice/
├── tts.ts        ← NEW
└── tts-store.ts  ← NEW
```

## Verification

<verification>
- [ ] Listen button reads a response aloud; tapping again stops
- [ ] Only one message speaks at a time
- [ ] Auditory mode auto-plays new responses, not reloaded history
- [ ] Visual JSON is not read aloud
- [ ] Filipino response uses a Filipino/Tagalog voice when available
- [ ] `npm run typecheck` passes
</verification>

## Troubleshooting

| Symptom | Likely Cause | Fix |
|---|---|---|
| No audio on Android | No TTS engine installed | Detect + hint to install Google TTS; don't crash |
| Speaks JSON/markdown | Text not cleaned | Strip fenced blocks + markdown before speaking |
| Two messages overlap | No single-utterance guard | Stop current before starting next |
| Auto-plays old history | Triggered on load | Only auto-play on `done` of a fresh response |

---

**Previous**: [Phase 8 Overview](./00_PHASE_OVERVIEW.md) | **Next**: [8.2 STT Engine](./02_stt_engine.md)
