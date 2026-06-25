# 8.2 STT (Groq Whisper + Native Fallback)

## Context

<context>
Speech-to-text lets students ask questions by voice — vital for lower-literacy learners and anyone for whom typing on a small screen is slow (spec 5.7). The MVP demo path is online: Groq Whisper Large v3 Turbo (2,000 transcriptions/day free, sub-second, Filipino + English). When Groq is rate-limited, fall back to `expo-speech-recognition` (native OS). Offline `whisper.rn` is explicitly roadmap, not MVP (spec Section 11). Text input is always available, so voice is purely additive (spec 5.7).
</context>

## Prerequisites

<prerequisites>
- Phase 4.2 (Groq key in secure-store), Phase 2.4 (signal tier)
- Add `expo-av`/`expo-audio` for recording, and `expo-speech-recognition` for the native fallback (install via `expo install`)
</prerequisites>

## AI Implementation Prompt

<instructions>
Build the STT service with a Groq-primary, native-fallback strategy.

Think step by step:

1. **Audio capture** (`src/features/voice/recorder.ts`)
   - Request mic permission (handle denial gracefully → keep text input). Record to a temp file in a Whisper-friendly format (e.g., m4a/wav). Provide `startRecording()`, `stopRecording(): Promise<{ uri, durationMs }>`, and a level/duration signal for UI.

2. **Groq Whisper client** (`src/features/voice/stt-groq.ts`)
   - POST the recorded audio (multipart) to Groq's audio transcription endpoint with model `whisper-large-v3-turbo`, language hint Filipino/English, using the Groq key from secure-store.
   - Return transcript text. Detect 429/quota → throw a typed `SttRateLimited` so the caller falls back.
   - Respect the free quota (2,000/day, 7,200 audio-sec/hour) — keep recordings short; warn if very long.

3. **Native fallback** (`src/features/voice/stt-native.ts`)
   - Use `expo-speech-recognition` (native OS SpeechRecognizer) with Filipino/English locale. This may need a brief network call on some devices (spec 5.7) — surface that transparently.
   - Expose the same `transcribe()`-style contract.

4. **STT orchestrator** (`src/features/voice/stt.ts`)
   - `transcribe(audioOrLive)`:
     - If online (strong/weak tier) and Groq key present → try Groq Whisper.
     - On `SttRateLimited`/network error → fall back to native recognition.
     - If offline or both unavailable → return null and prompt text input (offline `whisper.rn` is roadmap).
   - Return `{ text, source: 'groq' | 'native' }`.

5. **Permissions + privacy**
   - Audio is sent to Groq only for transcription; document this. Delete the temp audio file after transcription.
</instructions>

<requirements>
### Functional Requirements
- Record → Groq Whisper transcript online; native fallback when rate-limited.
- Offline/unavailable → graceful prompt to type instead.
- Filipino + English supported.

### Technical Requirements
- Groq key from secure-store; never logged.
- Temp audio deleted after use.
- Typed rate-limit error drives fallback.

### File Naming Conventions
- `recorder.ts`, `stt-groq.ts`, `stt-native.ts`, `stt.ts`.
</requirements>

<output_files>
1. `suri/src/features/voice/recorder.ts` — mic capture
2. `suri/src/features/voice/stt-groq.ts` — Groq Whisper transcription
3. `suri/src/features/voice/stt-native.ts` — native OS fallback
4. `suri/src/features/voice/stt.ts` — orchestrator
5. `suri/src/features/voice/index.ts` — MODIFIED barrel
6. `suri/app.json` — MODIFIED: mic permission (RECORD_AUDIO / NSMicrophoneUsageDescription)
</output_files>

## Directory Structure

```
src/features/voice/
├── recorder.ts    ← NEW
├── stt-groq.ts    ← NEW
├── stt-native.ts  ← NEW
└── stt.ts         ← NEW
```

## Verification

<verification>
- [ ] Recording a short Filipino/English question returns an accurate transcript via Groq
- [ ] Forcing a Groq 429 falls back to native recognition
- [ ] Offline → returns null and prompts text input (no crash)
- [ ] Mic permission denial keeps the app usable via text
- [ ] Temp audio file removed after transcription
- [ ] `npm run typecheck` passes
</verification>

## Troubleshooting

| Symptom | Likely Cause | Fix |
|---|---|---|
| Groq 400 on audio | Wrong format/multipart | Use a supported format; correct multipart field names |
| Empty transcript | Recording too quiet/short | Check mic level; set a minimum duration |
| Native fallback errors offline | OS engine needs network | Detect offline first; prompt text input |
| Permission loop | Not handling denial | Branch to text input; offer settings deep-link |

---

**Previous**: [8.1 TTS Engine](./01_tts_engine.md) | **Next**: [8.3 Voice UI Integration](./03_voice_ui_integration.md)
