# 5.2 Chat UI & Streaming Renderer

## Context

<context>
This is the screen students spend the most time in (spec Section 11, item 1 — the Chat tab). It renders the conversation, shows tokens appearing live (spec 5.2 "tokens appear immediately"), exposes a Listen button placeholder (wired in Phase 8), and leaves a slot to render the inline generated visual (Phase 7). It must respect every accessibility setting: Reader Font, High Contrast, Large Text, Focus Mode (one idea per message, calmer viewport), and Low Motion.
</context>

## Prerequisites

<prerequisites>
- Phase 5.1 (chat store + hooks)
- Phase 1 (themed components, accessibility hooks)
</prerequisites>

## AI Implementation Prompt

<instructions>
Build the Chat screen and message components.

Think step by step:

1. **Message bubble** (`src/features/chat/components/MessageBubble.tsx`)
   - Renders user vs assistant styling from the theme. Uses `ThemedText` (Reader Font + Large Text aware).
   - Assistant bubble shows a blinking caret/cursor while `isStreaming` (unless Low Motion → static).
   - Reserves a slot below the text for a visual (renders `VisualRenderer` in Phase 7 when `visualSpec` present; for now render nothing/placeholder).
   - Adds a "Listen" button affordance on assistant messages (no-op until Phase 8) and a small offline/cache hint when applicable.

2. **Message list** (`src/features/chat/components/MessageList.tsx`)
   - Use `FlatList`/`FlashList` inverted or auto-scroll-to-bottom on new tokens. Keep it performant: stable keys, memoized rows, no inline functions in the hot path.
   - Empty state: a friendly Suri greeting prompting the first question (spec brand voice — encouraging, never condescending).

3. **Composer** (`src/features/chat/components/Composer.tsx`)
   - Text input + Send button; disabled while `thinking`/`streaming` with a Stop button to abort.
   - A mic button placeholder for STT (Phase 8).
   - Handles keyboard avoidance.

4. **Chat screen** (`app/(tabs)/index.tsx`)
   - Compose mascot (Phase 5.3 slot), tier indicator (5.4 slot), `MessageList`, and `Composer`.
   - Focus Mode: reduce visual clutter (hide non-essential chrome), and rely on the router's ~120-word responses.
   - Error state: friendly retry affordance; if offline & no model, guide toward downloading the model or reconnecting.

5. **Accessibility**
   - Proper `accessibilityRole`/labels on buttons; ensure contrast and tap targets ≥ 44px.
</instructions>

<requirements>
### Functional Requirements
- Live token rendering into the assistant bubble.
- Send disabled during generation; Stop available.
- Empty, streaming, and error states all handled.
- Respects Reader Font, High Contrast, Large Text, Focus Mode, Low Motion.

### Technical Requirements
- Performant list (memoized rows, stable keys).
- All colors/fonts via theme; no hardcoded styling.
- Visual + Listen slots present for Phases 7/8.

### File Naming Conventions
- Components under `src/features/chat/components/`.
</requirements>

<output_files>
1. `suri/src/features/chat/components/MessageBubble.tsx`
2. `suri/src/features/chat/components/MessageList.tsx`
3. `suri/src/features/chat/components/Composer.tsx`
4. `suri/app/(tabs)/index.tsx` — MODIFIED: real chat screen
5. `suri/src/features/chat/index.ts` — MODIFIED barrel
</output_files>

## Directory Structure

```
src/features/chat/components/
├── MessageBubble.tsx  ← NEW
├── MessageList.tsx    ← NEW
└── Composer.tsx       ← NEW
app/(tabs)/index.tsx   ← MODIFIED
```

## Verification

<verification>
- [ ] Type a question → user bubble + streaming assistant bubble
- [ ] Tokens appear progressively; Stop aborts
- [ ] Empty state shows a friendly greeting
- [ ] Reader Font + High Contrast + Large Text all render correctly in chat
- [ ] Focus Mode reduces chat clutter
- [ ] `npm run typecheck` and `npm run lint` pass
</verification>

## Troubleshooting

| Symptom | Likely Cause | Fix |
|---|---|---|
| List scroll jumps | Re-keying rows | Use stable `id` keys; memoize rows |
| Keyboard covers input | No avoidance | Use `KeyboardAvoidingView`/`keyboardVerticalOffset` |
| Streaming caret animates in Low Motion | Not gated | Replace caret animation with static when `lowMotion` |

---

**Previous**: [5.1 Chat State & Store](./01_chat_state_store.md) | **Next**: [5.3 Mascot State Machine](./03_mascot_state_machine.md)
