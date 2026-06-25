# 10.1 Loading, Error & Empty States

## Context

<context>
A study app used on flaky connections and budget devices must never white-screen or leave the student confused. This step adds consistent, branded loading / error / empty states across every screen and an app-level error boundary, in Suri's encouraging voice (spec Section 7). It also makes failure paths (no API keys, model not downloaded, offline with empty cache, permission denied) friendly and recoverable.
</context>

## Prerequisites

<prerequisites>
- All feature screens exist (Phases 1–9)
- Themed components (Phase 1)
</prerequisites>

## AI Implementation Prompt

<instructions>
Add reusable state components and apply them everywhere.

Think step by step:

1. **Reusable state components** (`src/components/states/`)
   - `LoadingState` (themed spinner + optional message; static under Low Motion).
   - `EmptyState` (Suri illustration + friendly prompt + optional action).
   - `ErrorState` (friendly message + retry action; never shows stack traces).
   - `AppErrorBoundary` (class component) wrapping the router so any render crash shows `ErrorState` with a reload, not a white screen.

2. **Apply per screen**
   - Chat: empty (greeting), thinking/streaming (handled), error (retry; offline-no-model → guide to download or reconnect).
   - Reviewer: empty (no materials yet), loading (retrieving), error.
   - Quizzes: empty, loading, error.
   - Profile/Settings: provider-not-configured hint; model-not-downloaded prompt.

3. **Specific failure messaging** (in Suri's voice, no jargon):
   - No API keys + online → "Add a free API key in Settings to use Suri Cloud, or download the offline model."
   - Offline + no model + no cache → "You're offline and the offline brain isn't downloaded yet. Connect once to download it (~100MB), then Suri works anywhere."
   - Permission denied (mic/notifications) → gentle explanation + settings deep-link.

4. **Network awareness**
   - A subtle, non-blocking offline banner (distinct from the mascot Local state) only when an action needs connectivity it doesn't have.
</instructions>

<requirements>
### Functional Requirements
- Every screen handles loading/empty/error.
- App-level error boundary prevents white screens.
- Failure messages are friendly, specific, and recoverable.

### Technical Requirements
- Reusable state components; no per-screen duplication.
- No stack traces shown to users.
- Low Motion respected in loaders.

### File Naming Conventions
- State components under `src/components/states/`.
</requirements>

<output_files>
1. `suri/src/components/states/LoadingState.tsx`
2. `suri/src/components/states/EmptyState.tsx`
3. `suri/src/components/states/ErrorState.tsx`
4. `suri/src/components/states/AppErrorBoundary.tsx`
5. `suri/app/_layout.tsx` — MODIFIED: wrap with error boundary
6. Feature screens — MODIFIED: apply states (chat, reviewer, quizzes, profile)
7. `suri/src/components/index.ts` — MODIFIED barrel
</output_files>

## Directory Structure

```
src/components/states/
├── LoadingState.tsx
├── EmptyState.tsx
├── ErrorState.tsx
└── AppErrorBoundary.tsx
```

## Verification

<verification>
- [ ] Forcing a render error shows the error boundary UI, not a white screen
- [ ] Offline + no model + no cache shows the friendly guidance
- [ ] No API key configured shows the Settings hint
- [ ] Empty Reviewer/Quizzes show branded empty states
- [ ] Loaders are static under Low Motion
- [ ] `npm run typecheck` and `npm run lint` pass
</verification>

## Troubleshooting

| Symptom | Likely Cause | Fix |
|---|---|---|
| White screen on crash | No boundary | Wrap router in `AppErrorBoundary` |
| Stack trace shown | Raw error rendered | Map to friendly copy; log details only in `__DEV__` |
| Duplicate state UIs | Per-screen reinvention | Use the shared components |

---

**Previous**: [Phase 10 Overview](./00_PHASE_OVERVIEW.md) | **Next**: [10.2 Airplane-Mode Test](./02_airplane_mode_test.md)
