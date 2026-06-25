# 5.4 Tier & Mode Indicators

## Context

<context>
The UI shows a subtle "Suri Cloud" / "Suri Local" indicator; tier transitions are automatic and invisible, and provider failover within Tier 1 is never shown to the student (spec 5.2). This step builds that subtle indicator plus a small active learning-mode badge (Visual/Auditory/Reading/etc.), so the demo can show the system working without disrupting the student. This is what the judges watch flip during the Airplane-Mode test (spec Section 11, item 9).
</context>

## Prerequisites

<prerequisites>
- Phase 2.4 (signal tier), Phase 5.1 (active tier on chat store), Phase 2.3 (profile response mode)
</prerequisites>

## AI Implementation Prompt

<instructions>
Build the tier indicator and learning-mode badge.

Think step by step:

1. **Tier indicator** (`src/features/chat/components/TierIndicator.tsx`)
   - Reads the effective tier (prefer the tier of the last/active answer from the chat store; fall back to live `useSignalTier`).
   - Renders subtly: "Suri Cloud" (online) vs "Suri Local" (offline) with the moon icon offline. Small, low-emphasis, themed; never an alarming banner.
   - Does NOT reveal which provider answered (Gemini/Groq/OpenRouter) — failover stays invisible per spec.
   - Optional `__DEV__`-only detail showing the provider for debugging/demo narration.

2. **Mode badge** (`src/features/chat/components/ModeBadge.tsx`)
   - Shows the active `responseMode` (Visual/Auditory/Reading/Kinesthetic/Mixed) as a tiny chip, so the adaptive-response demo (spec Section 11, items 3–4) is legible. Tapping it can deep-link to Settings (Phase 6).

3. **Reconnecting/cache hints**
   - A transient inline hint when the router emits `reconnecting` (spec 5.2 graceful recovery) and a subtle "answered offline" marker when a message came from cache/SLM. Keep these gentle and non-blocking.

4. **Placement**
   - Mount both near the chat header alongside the mascot. Ensure they read accessibility theme and scale.
</instructions>

<requirements>
### Functional Requirements
- Cloud/Local indicator reflects the answer's tier; flips on the Airplane-Mode test.
- Provider identity hidden from students (dev-only reveal allowed).
- Active learning mode visible as a small chip.

### Technical Requirements
- Subtle, non-disruptive UI; themed; accessible.
- Subscribes via narrow selectors (no per-token re-render).

### File Naming Conventions
- Components under `src/features/chat/components/`.
</requirements>

<output_files>
1. `suri/src/features/chat/components/TierIndicator.tsx`
2. `suri/src/features/chat/components/ModeBadge.tsx`
3. `suri/app/(tabs)/index.tsx` — MODIFIED: mount indicators
4. `suri/src/features/chat/index.ts` — MODIFIED barrel
</output_files>

## Directory Structure

```
src/features/chat/components/
├── TierIndicator.tsx  ← NEW
└── ModeBadge.tsx      ← NEW
```

## Verification

<verification>
- [ ] Online answer → "Suri Cloud"; Airplane Mode answer → "Suri Local" + moon
- [ ] Provider name not shown to the student (only in `__DEV__`)
- [ ] Mode badge reflects the current response mode and updates when changed
- [ ] `reconnecting` shows a gentle transient hint
- [ ] `npm run typecheck` and `npm run lint` pass
</verification>

## Troubleshooting

| Symptom | Likely Cause | Fix |
|---|---|---|
| Indicator shows provider | Leaking provider to UI | Restrict provider display to `__DEV__` |
| Indicator lags the answer | Reading only live netinfo | Prefer the tier attached to the answered message |
| Badge re-renders per token | Wide subscription | Select only `responseMode`/`activeTier` |

---

**Previous**: [5.3 Mascot State Machine](./03_mascot_state_machine.md) | **Next**: [Phase 5 Checklist](./99_PHASE_CHECKLIST.md)
