# 5.3 Suri Mascot Animation State Machine

## Context

<context>
Suri the fox is the brand and the study companion (spec Section 7, 5.8). Its animation states communicate what's happening without text: Idle (gentle bounce), Thinking (ears perk, tail sweeps during inference), Celebrating (correct answers/streaks), Listening (sound-wave ring during STT). Critically, Low Motion mode replaces all animation with a static "calm" illustration (spec 5.6/5.8), and the offline "Suri Local" state desaturates with a moon icon (spec Section 7). This step builds the reanimated state machine and the asset strategy.
</context>

## Prerequisites

<prerequisites>
- `react-native-reanimated` v4 (Phase 0)
- Phase 1 (`useLowMotion`, theme/palette), Phase 2.4 (tier), Phase 5.1 (chat status)
</prerequisites>

## AI Implementation Prompt

<instructions>
Build the mascot component, its state machine, and assets.

Think step by step:

1. **Mascot assets** (`assets/mascot/`)
   - Per spec Section 10, encode mascot animation states as Lottie JSON (total <200KB) OR use vector/sprite + reanimated transforms. Recommended: a base SVG/vector fox plus reanimated-driven transforms for Idle/Thinking/Celebrating, and a Lottie or animated ring for Listening. Provide a single static "calm" illustration for Low Motion and the desaturated "Local" variant.
   - Keep assets tiny; document the chosen approach.

2. **Mascot state type** (`src/features/chat/mascot/mascot-state.ts`)
   - `MascotState = 'idle' | 'thinking' | 'celebrating' | 'listening'`.
   - A derivation hook `useMascotState()` that maps: chat status `thinking|streaming` → `thinking`; an external celebrate trigger (Phase 9 streaks) → `celebrating` (briefly); STT active (Phase 8) → `listening`; else `idle`.

3. **Mascot component** (`src/features/chat/mascot/SuriMascot.tsx`)
   - Reanimated-driven:
     - Idle: slow gentle bounce (looping translateY).
     - Thinking: ear/tail micro-motion + the accent "tail glow" (spec Section 7 — soft glow on tail tip during inference).
     - Celebrating: energetic bounce + tail wag.
     - Listening: animated sound-wave ring around the face.
   - **Low Motion**: when `useLowMotion()` is true, render ONLY the static calm illustration for every state (no animation). This is mandatory (spec 5.6).
   - **Tier appearance**: when offline (`useSignalTier() === 'offline'`), apply the desaturated palette + show the moon (`buwan`) icon overlay ("Suri Local", spec Section 7). When online, full color with tail glow available.
   - **Focus Mode**: shift to a calmer expression and reduce motion intensity (spec Section 7).

4. **Performance**
   - Drive animations on the UI thread via reanimated worklets; never animate via JS state in the render loop. Pause/cleanup animations when offscreen.

5. **Integrate**
   - Place `SuriMascot` in the chat header area (5.2). It subscribes to its own hooks so it doesn't re-render per token.
</instructions>

<requirements>
### Functional Requirements
- Mascot shows Thinking during inference, Idle when done.
- Low Motion → fully static illustration in all states.
- Offline → desaturated + moon icon ("Suri Local").
- Tail glow accent appears during inference (online).

### Technical Requirements
- Reanimated worklets on the UI thread; no JS-driven per-frame state.
- Assets tiny (<200KB total for animation data).
- No per-token re-renders.

### File Naming Conventions
- Mascot files under `src/features/chat/mascot/`.
</requirements>

<output_files>
1. `suri/assets/mascot/` — fox asset(s): animated + static calm + local variant
2. `suri/src/features/chat/mascot/mascot-state.ts` — state type + `useMascotState`
3. `suri/src/features/chat/mascot/SuriMascot.tsx` — animated component
4. `suri/src/features/chat/index.ts` — MODIFIED barrel
</output_files>

## Directory Structure

```
assets/mascot/                       ← NEW (fox assets)
src/features/chat/mascot/
├── mascot-state.ts   ← NEW
└── SuriMascot.tsx    ← NEW
```

## Verification

<verification>
- [ ] Idle bounce plays at rest; Thinking plays during inference
- [ ] Low Motion ON → mascot is a static illustration in every state
- [ ] Offline → desaturated mascot with moon icon
- [ ] Tail glow appears during online inference
- [ ] Mascot doesn't re-render on every streamed token
- [ ] `npm run typecheck` passes
</verification>

## Troubleshooting

| Symptom | Likely Cause | Fix |
|---|---|---|
| Animation stutters | Driven from JS state | Move to reanimated `useSharedValue`/worklets |
| Low Motion still animates | Flag not gating render | Branch to static illustration when `lowMotion` |
| Big bundle | Heavy Lottie/PNG | Compress; prefer vector + transforms; cap <200KB |
| Mascot re-renders per token | Subscribes to messages | Subscribe only to status/tier selectors |

---

**Previous**: [5.2 Chat UI & Streaming](./02_chat_ui_streaming.md) | **Next**: [5.4 Tier & Mode Indicators](./04_tier_mode_indicators.md)
