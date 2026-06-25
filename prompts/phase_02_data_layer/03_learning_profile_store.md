# 2.3 Learning Profile Store (secure-store + Zustand)

## Context

<context>
The Learning Profile shapes every AI response across all three tiers and holds the accessibility settings (spec Section 5.6). It must persist across restarts and be readable synchronously by the theme and the prompt builder. This step persists the profile (response mode, grade level, accessibility settings) in `expo-secure-store` (spec Section 8) and hydrates the in-memory Zustand stores from Phase 1 on boot, closing the persistence seam left in 1.3.
</context>

## Prerequisites

<prerequisites>
- Steps 1.3 (accessibility store with hydrate seam) and 2.1–2.2 complete
- `expo-secure-store` installed (Phase 0)
- `LearningProfile` type in `src/types`
</prerequisites>

## AI Implementation Prompt

<instructions>
Build a persistence layer for the Learning Profile and wire hydration into startup.

Think step by step:

1. **Persistence module** (`src/features/profile/profile-storage.ts`)
   - `loadProfile(): Promise<LearningProfile | null>` — reads the JSON profile from secure-store under a constant key.
   - `saveProfile(profile): Promise<void>` — serializes and writes.
   - `clearProfile(): Promise<void>`.
   - Validate the loaded object against the `LearningProfile` shape; if invalid/missing, return null (triggers first-run later).

2. **Profile store** (`src/features/profile/profile-store.ts`)
   - Zustand store holding the full `LearningProfile`: `responseMode`, `accessibilitySettings`, `gradeLevel`, plus an `isHydrated` flag and `hasCompletedSetup` flag.
   - Actions: `setResponseMode`, `setGradeLevel`, `setAccessibilitySetting`, `setProfile`, `completeSetup`.
   - On every mutation, debounce-write to secure-store via `saveProfile`.

3. **Unify with accessibility store**
   - The accessibility settings live inside the profile. Make the accessibility store (from 1.3) read/write through the profile store (single source of truth), OR have the profile store own settings and the accessibility hooks select from it. Choose one and remove the duplication — document the choice in a code comment.
   - Ensure `useTheme()` and `useLowMotion()` etc. still work unchanged for consumers.

4. **Hydration on boot**
   - In `initDatabase()`/startup, after DB init, call a `hydrateProfile()` that loads from secure-store and populates the store, setting `isHydrated = true`.
   - Gate the router: if `!hasCompletedSetup`, the app should route to `app/onboarding.tsx` (implemented in Phase 6). For now, if no profile exists, create sensible defaults (responseMode `mixed`, gradeLevel 6, all accessibility settings off/standard) and set `hasCompletedSetup = false`.

5. **Defaults**
   - Define `DEFAULT_PROFILE` in `src/constants` or the profile module: `responseMode: 'mixed'`, `gradeLevel: 6`, accessibility all neutral.
</instructions>

<requirements>
### Functional Requirements
- Profile persists across full app restarts.
- Accessibility theme reflects the persisted profile on boot.
- A missing/invalid profile yields defaults and `hasCompletedSetup = false`.

### Technical Requirements
- Single source of truth for accessibility settings (no duplicated state).
- Writes debounced to avoid hammering secure-store on slider drags.
- Profile validated on load.

### File Naming Conventions
- `profile-storage.ts`, `profile-store.ts`.
</requirements>

<output_files>
1. `suri/src/features/profile/profile-storage.ts` — secure-store load/save/clear
2. `suri/src/features/profile/profile-store.ts` — Zustand profile store
3. `suri/src/features/profile/accessibility-hooks.ts` — MODIFIED: select from profile store
4. `suri/src/features/profile/index.ts` — MODIFIED barrel
5. `suri/src/constants/index.ts` — MODIFIED: `DEFAULT_PROFILE`
6. `suri/app/_layout.tsx` — MODIFIED: hydrate profile + onboarding gate
</output_files>

## Directory Structure

```
src/features/profile/
├── profile-storage.ts     ← NEW
├── profile-store.ts        ← NEW
├── accessibility-store.ts  ← (reconciled with profile store)
├── accessibility-hooks.ts  ← MODIFIED
└── index.ts                ← MODIFIED
```

## Verification

<verification>
- [ ] Set grade level + Reader Font, fully restart app → settings persist
- [ ] Theme reflects persisted accessibility settings immediately on boot
- [ ] Fresh install (cleared secure-store) → defaults applied, `hasCompletedSetup` false
- [ ] No duplicated accessibility state (single store owns it)
- [ ] `npm run typecheck` and `npm run lint` pass
</verification>

## Troubleshooting

| Symptom | Likely Cause | Fix |
|---|---|---|
| Settings reset on restart | Writes not flushed / wrong key | Confirm `saveProfile` runs and uses a stable constant key |
| secure-store error on large value | Value exceeds platform limit | Keep profile small (it is); don't store corpus here |
| Theme flicker on boot | Rendering before hydration | Gate data screens on `isHydrated` |

---

**Previous**: [2.2 Schema & Migrations](./02_schema_and_migrations.md) | **Next**: [2.4 Connectivity Detection](./04_connectivity_detection.md)
