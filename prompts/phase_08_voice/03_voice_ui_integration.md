# 8.3 Voice UI Integration

## Context

<context>
This step wires the recorder/STT into the chat composer and connects the mascot's Listening state (spec 5.8 — animated sound-wave ring while STT is active) and the Auditory-mode audio-wave ring around Suri (spec Section 7). It completes the voice loop: tap mic → Suri listens → transcript fills the composer → send.
</context>

## Prerequisites

<prerequisites>
- Phase 8.1 (TTS), 8.2 (STT orchestrator + recorder)
- Phase 5.2 (Composer mic placeholder), Phase 5.3 (mascot Listening state)
</prerequisites>

## AI Implementation Prompt

<instructions>
Connect voice capture to the composer and mascot.

Think step by step:

1. **Voice input store** (`src/features/voice/voice-input-store.ts`)
   - State: `isRecording`, `isTranscribing`, `lastError`, `partialDuration`.
   - Actions: `beginRecording()` (permission → start), `endRecordingAndTranscribe()` (stop → `transcribe` → return text), `cancel()`.

2. **Mic button in Composer** (`src/features/chat/components/Composer.tsx`)
   - Push-to-talk: press-and-hold to record, release to transcribe; or tap-to-toggle — pick one and make it discoverable. Show recording duration + a clear stop/cancel.
   - On transcript: populate the input field (don't auto-send — let the student review/edit, since STT isn't perfect). Provide a one-tap send.
   - Disable mic while a response is streaming.

3. **Mascot Listening state**
   - When `isRecording`, drive the mascot to `listening` (Phase 5.3) — the sound-wave ring. Under Low Motion, show a static "listening" indicator instead.

4. **Auditory-mode ring**
   - When TTS is actively speaking (8.1), show the audio-wave ring around Suri (spec Section 7). Gate under Low Motion.

5. **Errors + accessibility**
   - Friendly messaging for permission denial, offline, and rate-limit-with-fallback. All controls have accessible labels; text input always present.
</instructions>

<requirements>
### Functional Requirements
- Mic records, transcribes, and fills the composer for review before send.
- Mascot shows Listening during recording and the audio ring during TTS.
- Mic disabled during streaming; text always available.

### Technical Requirements
- Low Motion replaces voice animations with static indicators.
- No auto-send of transcripts (review-first).

### File Naming Conventions
- `voice-input-store.ts`.
</requirements>

<output_files>
1. `suri/src/features/voice/voice-input-store.ts` — recording/transcribing state
2. `suri/src/features/chat/components/Composer.tsx` — MODIFIED: mic wired
3. `suri/src/features/chat/mascot/mascot-state.ts` — MODIFIED: listening from voice store
4. `suri/src/features/chat/mascot/SuriMascot.tsx` — MODIFIED: TTS audio ring
5. `suri/src/features/voice/index.ts` — MODIFIED barrel
</output_files>

## Directory Structure

```
src/features/voice/
└── voice-input-store.ts   ← NEW
(Composer + mascot MODIFIED)
```

## Verification

<verification>
- [ ] Hold/tap mic → records → transcript appears in the composer
- [ ] Transcript is editable before sending (not auto-sent)
- [ ] Mascot shows Listening while recording; audio ring while TTS speaks
- [ ] Low Motion → static listening/speaking indicators
- [ ] Mic disabled during streaming; permission denial handled
- [ ] `npm run typecheck` and `npm run lint` pass
</verification>

## Troubleshooting

| Symptom | Likely Cause | Fix |
|---|---|---|
| Transcript auto-sends | Wired to send | Fill input only; require explicit send |
| Ring animates in Low Motion | Not gated | Use static indicator when `lowMotion` |
| Mascot stuck Listening | State not cleared | Clear `isRecording` on stop/cancel/error |

---

**Previous**: [8.2 STT Engine](./02_stt_engine.md) | **Next**: [Phase 8 Checklist](./99_PHASE_CHECKLIST.md)
