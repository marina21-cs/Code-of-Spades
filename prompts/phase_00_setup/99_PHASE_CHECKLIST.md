# Phase 0 Completion Checklist

## All Steps Completed

- [ ] 0.1 — Expo project initialized, runs on device via dev client
- [ ] 0.2 — Strict TypeScript, ESLint, Prettier configured
- [ ] 0.3 — Feature-based `src/` structure + typed config module
- [ ] 0.4 — EAS Build with ABI splits + Hermes

## Verification Tests

```bash
npm run typecheck          # Expected: zero errors
npm run lint               # Expected: zero errors
npx expo run:android       # Expected: app launches on device, no red screen
eas build --profile preview --platform android   # Expected: build starts / config valid
```

## Code Quality Checks

- [ ] `npx tsc --noEmit` passes
- [ ] `npm run lint` passes
- [ ] No `console.log` left in committed code
- [ ] All Expo deps installed via `expo install` (SDK-pinned)
- [ ] `.env*` git-ignored; no secrets committed

## Manual Verification

- [ ] App icon shows name "Suri"; package id `ph.suri.app`
- [ ] Running on a **custom dev client**, not Expo Go
- [ ] `@/` imports resolve from `src/`

## Rollback Plan

If this phase breaks something:
1. Revert `babel.config.js` Reanimated plugin if the app won't boot, clear cache (`npx expo start -c`)
2. Delete `eas.json` and re-run `eas build:configure` if EAS config is malformed
3. As a last resort, re-scaffold with `npx create-expo-app` and re-apply 0.2–0.4

---

**Proceed to**: [Phase 1: Design System & Accessibility](../phase_01_design_system/00_PHASE_OVERVIEW.md)
