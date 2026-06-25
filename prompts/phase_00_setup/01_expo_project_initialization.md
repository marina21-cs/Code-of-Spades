# 0.1 Expo Project Initialization

## Context

<context>
This is the first step of the Suri build. It creates the React Native + Expo SDK 54 application (managed workflow) that all subsequent phases extend. Suri is an offline-first AI study companion for Filipino learners (spec Section 3), so the app must run on a custom dev client from the start — several core features depend on native modules (`llama.rn`, ML Kit) that Expo Go cannot host. This step gets a blank app running on a physical Android device so every later phase has a verified baseline.
</context>

## Prerequisites

<prerequisites>
- Node.js 20+ and npm installed
- A physical Android device (Android 8.0 / API 26+) with USB debugging enabled, OR an Android emulator with API 26+
- Android Studio + Android SDK installed (required for `expo run:android`)
- Git installed; working directory is the project root (`d:\Code-of-Spades` or the chosen app root)
</prerequisites>

## AI Implementation Prompt

<instructions>
Create a new Expo SDK 54 app named "Suri" using the TypeScript + Expo Router template, then convert it to run on a custom dev client.

Think step by step:

1. **Create the project**
   - Initialize an Expo app with the default Expo Router + TypeScript template into a folder named `suri`.
   - Use the package identifier `ph.suri.app` for both Android `package` and iOS `bundleIdentifier`.
   - Set the display name to "Suri".

2. **Install the dev client and core navigation deps**
   - Add `expo-dev-client` (required because Expo Go cannot host llama.rn / ML Kit).
   - Ensure `expo-router`, `react-native-safe-area-context`, `react-native-screens`, and `react-native-gesture-handler` are installed at versions compatible with SDK 54 (use `npx expo install` so versions are pinned to the SDK).

3. **Install the foundational libraries used across phases** (use `npx expo install` for all Expo-managed ones so versions match SDK 54):
   - `expo-sqlite`, `expo-secure-store`, `expo-file-system`, `expo-font`, `expo-speech`, `expo-camera`, `expo-notifications`, `expo-task-manager`, `expo-background-fetch`
   - `@react-native-community/netinfo`
   - `react-native-svg`
   - `react-native-reanimated` (v4+ for SDK 54)
   - `zustand`
   - Do NOT install `llama.rn`, `whisper.rn`, or ML Kit yet — those are added in the phases that use them (Phase 4 / roadmap) to keep early builds fast.

4. **Configure Reanimated**
   - Add the Reanimated Babel plugin to `babel.config.js` (must be listed last).

5. **Configure the app metadata**
   - In `app.json` (or migrate to `app.config.ts` if cleaner), set: name "Suri", slug "suri", orientation portrait, the package ids above, `jsEngine: "hermes"`, and register the `expo-router` plugin.

6. **Run on device**
   - Run `npx expo run:android` to produce and launch the dev client on the connected device/emulator.
   - Confirm the default Expo Router home screen renders.
</instructions>

<requirements>
### Functional Requirements
- The app launches on a physical Android device (API 26+) via a custom dev client.
- The default route renders without a red error screen.

### Technical Requirements
- Expo SDK 54, managed workflow with `expo-dev-client`.
- Hermes JS engine enabled.
- All Expo packages installed via `npx expo install` (SDK-pinned versions), not raw `npm install`.
- Reanimated Babel plugin present and last in the plugin list.

### File Naming Conventions
- App root folder: `suri/`
- Config: `app.json` or `app.config.ts`
</requirements>

<output_files>
Generate / modify the following:

1. `suri/package.json` — dependencies and scripts
2. `suri/app.json` (or `suri/app.config.ts`) — app metadata, Hermes, plugins
3. `suri/babel.config.js` — Reanimated plugin added
4. `suri/tsconfig.json` — extends `expo/tsconfig.base` (strict mode tightened in step 0.2)
5. `suri/app/_layout.tsx` — root layout (from template, kept as-is for now)
6. `suri/app/index.tsx` — default route (from template)
</output_files>

## Directory Structure

After this step:

```
suri/
├── app/
│   ├── _layout.tsx
│   └── index.tsx
├── assets/
├── app.json            (or app.config.ts)
├── babel.config.js
├── package.json
└── tsconfig.json
```

## Verification

<verification>
- [ ] `npx expo run:android` builds and launches the app on a device/emulator with no red error screen
- [ ] `npx tsc --noEmit` runs (errors from strict mode are addressed in 0.2)
- [ ] `app.json`/`app.config.ts` shows name "Suri", package `ph.suri.app`, and `jsEngine: "hermes"`
- [ ] `babel.config.js` lists `react-native-reanimated/plugin` as the last plugin
- [ ] All listed Expo packages appear in `package.json` at SDK-54-compatible versions
</verification>

## Troubleshooting

| Symptom | Likely Cause | Fix |
|---|---|---|
| `expo run:android` fails: no SDK | Android SDK path not set | Set `ANDROID_HOME`; install platform-tools via Android Studio |
| App crashes on launch citing Reanimated | Babel plugin missing or not last | Add `react-native-reanimated/plugin` as the final entry in `babel.config.js`, then clear cache: `npx expo start -c` |
| "Unable to resolve module" after install | Metro cache stale | Restart with `npx expo start -c` |
| Native module errors in Expo Go | Running in Expo Go, not dev client | Always use `npx expo run:android` / the custom dev client |
| Version mismatch warnings | Used `npm install` instead of `expo install` | Reinstall the package with `npx expo install <pkg>` |

---

**Previous**: — | **Next**: [0.2 Tooling & Linting](./02_tooling_and_linting.md)
