# 5.1 Chat State & Message Store

## Context

<context>
The chat store is the bridge between the Phase 4 `ask()` router and the UI. It manages the message list, consumes the streaming `AskEvent`s (token, tier, cache_hit, reconnecting, done, error), updates the in-progress assistant bubble live, and loads/saves history via the Phase 2 message repository. Keeping this in a store (not the component) keeps streaming performant and lets the mascot/indicators subscribe to the same state.
</context>

## Prerequisites

<prerequisites>
- Phase 4.5 (`ask()` generator + `AskEvent`)
- Phase 2 (message repository, sessions)
- Phase 2.3 (profile store), Phase 2.4 (connectivity)
</prerequisites>

## AI Implementation Prompt

<instructions>
Build the chat store that drives streaming and persistence.

Think step by step:

1. **Chat store** (`src/features/chat/chat-store.ts`)
   - State: `messages: ChatMessage[]`, `status: 'idle' | 'thinking' | 'streaming' | 'error'`, `activeTier`, `activeProvider`, `currentSessionId`, `abortController`.
   - `ChatMessage`: `{ id, role, content, tier?, provider?, visualSpec?, isStreaming? }`.

2. **Send flow** (`sendMessage(question)`):
   - Append the user message; create a session if none.
   - Append an empty assistant message with `isStreaming: true`; set status `thinking`.
   - Read the current `LearningProfile` and recent history; create an `AbortController`.
   - Iterate `ask({ question, profile, history, signal })`:
     - `tier`/`provider` → update `activeTier`/`activeProvider`; flip status to `streaming` on first token.
     - `token` → append to the assistant message content (batch updates with a microtask/throttle to avoid per-token re-render storms).
     - `cache_hit` → mark the message as offline-cached (for a subtle UI hint).
     - `reconnecting` → set a transient flag the UI can show.
     - `done` → finalize content + `visualSpec`; clear `isStreaming`; status `idle`.
     - `error` → set status `error`, attach a friendly message.
   - Persist via the message repository as turns complete (the router also persists; avoid double-write — pick ONE owner; recommend the router persists and the store reloads ids, OR the store persists and router doesn't. Document the choice.)

3. **Stop** (`stopGeneration()`): abort the controller; finalize whatever streamed.

4. **History** (`loadSession(sessionId)` / `startNewSession()`): hydrate `messages` from the repository; map DB rows → `ChatMessage` including `visual_spec` JSON parse.

5. **Selectors/hooks** (`src/features/chat/chat-hooks.ts`): `useMessages()`, `useChatStatus()`, `useActiveTier()` for narrow subscriptions.
</instructions>

<requirements>
### Functional Requirements
- Streaming updates the in-progress bubble live without freezing the UI.
- History persists and reloads.
- Generation can be stopped mid-stream.

### Technical Requirements
- Token updates throttled/batched to avoid re-render storms.
- Single owner of persistence (no duplicate writes).
- Narrow selectors so the mascot/indicators don't re-render on every token.

### File Naming Conventions
- `chat-store.ts`, `chat-hooks.ts`.
</requirements>

<output_files>
1. `suri/src/features/chat/chat-store.ts` — store + send/stop/history
2. `suri/src/features/chat/chat-hooks.ts` — selector hooks
3. `suri/src/features/chat/types.ts` — `ChatMessage`
4. `suri/src/features/chat/index.ts` — MODIFIED barrel
</output_files>

## Directory Structure

```
src/features/chat/
├── chat-store.ts   ← NEW
├── chat-hooks.ts   ← NEW
├── types.ts        ← NEW
└── index.ts        ← MODIFIED
```

## Verification

<verification>
- [ ] `sendMessage` appends user + streaming assistant messages
- [ ] Tokens accumulate live; UI stays responsive (throttled updates)
- [ ] `done` finalizes content + any visual spec
- [ ] `stopGeneration` aborts mid-stream
- [ ] Reload session restores prior messages from SQLite
- [ ] No duplicate-persistence of the same turn
- [ ] `npm run typecheck` passes
</verification>

## Troubleshooting

| Symptom | Likely Cause | Fix |
|---|---|---|
| UI janks while streaming | Per-token setState | Batch tokens (e.g., flush every ~50ms or N tokens) |
| Duplicate messages saved | Both router and store persist | Designate one owner; document it |
| Mascot re-renders each token | Subscribes to whole store | Use `useChatStatus`/`useActiveTier` selectors |

---

**Previous**: [Phase 5 Overview](./00_PHASE_OVERVIEW.md) | **Next**: [5.2 Chat UI & Streaming](./02_chat_ui_streaming.md)
