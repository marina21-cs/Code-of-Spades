# Phase 0: Project Setup

> **Objective**: Scaffold a React Native + Expo SDK 54 app with strict TypeScript, linting, a clean feature-based directory structure, a typed config module, and EAS Build configured for ABI-split APKs.
> **Duration**: ~1–2 hours of agent execution
> **Dependencies**: None

---

## Phase Goals

1. ✅ Running Expo SDK 54 app (managed workflow) on a physical Android device
2. ✅ TypeScript strict mode, ESLint, and Prettier all passing
3. ✅ Feature-based directory structure with barrel exports and a typed config module
4. ✅ EAS Build configured for ABI splits (`armeabi-v7a` + `arm64-v8a`), Hermes enabled

## Prompt Files in This Phase

| # | Prompt | Purpose |
|---|--------|---------|
| 0.1 | [01_expo_project_initialization.md](01_expo_project_initialization.md) | Create the Expo app, install core deps, run on device |
| 0.2 | [02_tooling_and_linting.md](02_tooling_and_linting.md) | ESLint, Prettier, strict tsconfig, scripts |
| 0.3 | [03_directory_structure_and_config.md](03_directory_structure_and_config.md) | Folder layout, barrel exports, typed env config |
| 0.4 | [04_eas_build_abi_splits.md](04_eas_build_abi_splits.md) | EAS config, ABI splits, Hermes, build profiles |

## Key Decisions Made

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Framework | Expo SDK 54, managed workflow | Spec Section 8; native modules (llama.rn) via prebuild/dev-client |
| Navigation | Expo Router (file-based) | Standard for SDK 54; type-safe routes |
| Language | TypeScript strict | Spec clean-code standards |
| State | Zustand + per-feature stores | Lightweight, no backend; offline-first |
| Build engine | Hermes (default) | ~15% smaller bundle, ~20% faster startup (spec Section 10) |
| Distribution | EAS Build, ABI splits + universal APK | ~35–38MB per-ABI vs 55–60MB universal (spec Section 10) |
| Dev client | `expo-dev-client` required | llama.rn and ML Kit are native; Expo Go cannot host them |

> **Critical note for the executing agent:** Suri uses native modules that are NOT in Expo Go (`llama.rn`, ML Kit, `whisper.rn`). From Phase 0 onward, the app must run on a **custom dev client** (`npx expo run:android` or an EAS dev build), never plain Expo Go. Set this expectation now.

## Skills to Load

Load these from `skills/<skill-id>/SKILL.md` in the skills library:
- `clean-code` — coding standards enforced from the first commit
- `cc-skill-coding-standards` — TypeScript/JS/React conventions, naming, structure
- `environment-setup-guide` — dev environment, SDK install, device setup
- `mobile-design` — Expo/React Native project conventions and performance baseline

## Exit Criteria

Before moving to Phase 1, verify:

- [ ] `npx expo run:android` launches the app on a physical device with no errors
- [ ] `npx tsc --noEmit` reports zero errors
- [ ] `npm run lint` passes with zero warnings
- [ ] The directory structure matches `03_directory_structure_and_config.md`
- [ ] `eas build --profile preview --platform android` produces an APK (or is dry-run validated)
- [ ] `app.json`/`app.config.ts` declares the app name "Suri", correct package id, and Hermes enabled

---

**Next Phase**: [Phase 1: Design System & Accessibility](../phase_01_design_system/00_PHASE_OVERVIEW.md)
