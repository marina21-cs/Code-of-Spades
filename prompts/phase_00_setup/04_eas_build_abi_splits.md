# 0.4 EAS Build & ABI Splits

## Context

<context>
Suri targets storage-constrained student devices (spec Section 10: "App install size on storage-constrained devices"). EAS Build with ABI splits produces per-architecture APKs (~35–38MB) instead of a universal APK (~55–60MB), which matters because schools sideload the APK over local Wi-Fi/Bluetooth/USB (spec Section 2, APK-first distribution). This step configures EAS so later phases can produce shareable builds, and confirms Hermes is on for the bundle-size/startup wins.
</context>

## Prerequisites

<prerequisites>
- Steps 0.1–0.3 complete
- An Expo account (free) and `eas-cli` installed (`npm install -g eas-cli`)
- Logged in via `eas login`
</prerequisites>

## AI Implementation Prompt

<instructions>
Configure EAS Build with profiles that produce both a development client and an ABI-split release APK.

Think step by step:

1. **Initialize EAS**
   - Run `eas build:configure` to generate `eas.json` and link the project.

2. **Define build profiles in `eas.json`:**
   - `development` — `developmentClient: true`, `distribution: "internal"`, Android `buildType: "apk"`. Used for on-device debugging with native modules.
   - `preview` — `distribution: "internal"`, Android `buildType: "apk"`, ABI splits enabled. This is the shareable APK for schools.
   - `production` — Play Store track; Android `buildType: "app-bundle"` (AAB) for Play, but ALSO document how to produce a universal/ABI-split APK for sideloading.

3. **Enable ABI splits**
   - Configure the Android build to split per ABI: `armeabi-v7a` (32-bit, 2016-era devices) and `arm64-v8a` (modern). Use the Gradle `splits` mechanism via an Expo config plugin or `expo-build-properties` (`android.enableProguardInReleaseBuilds`, and the ABI filter / universalApk settings).
   - Add `expo-build-properties` plugin to set `android.enableHermes: true` (confirm Hermes), minSdkVersion 26 (Android 8.0, per spec compatibility matrix), and the ABI split config.

4. **Confirm Hermes & engine**
   - Verify `jsEngine: "hermes"` in app config; Hermes precompiles the JS bundle (spec: ~15% smaller, ~20% faster startup).

5. **Document the build commands** in a short `BUILD.md` at the app root:
   - Dev client: `eas build --profile development --platform android`
   - Shareable APK: `eas build --profile preview --platform android`
   - Note that the preview profile yields per-ABI APKs (~35–38MB each).
</instructions>

<requirements>
### Technical Requirements
- `minSdkVersion = 26` (Android 8.0) — practical minimum for full feature set (spec Section 10.1).
- ABI splits: `armeabi-v7a` + `arm64-v8a`.
- Hermes enabled.
- `preview` profile produces a sideloadable internal APK.

### Functional Requirements
- A `preview` build can be triggered and produces an APK artifact (or validates via dry run if cloud build minutes are constrained).
</requirements>

<output_files>
1. `suri/eas.json` — build profiles (development, preview, production)
2. `suri/app.json` (or `app.config.ts`) — MODIFIED: `expo-build-properties` plugin (minSdk 26, Hermes, ABI splits), Android `package`
3. `suri/BUILD.md` — build command reference
</output_files>

## Directory Structure

```
suri/
├── eas.json     ← NEW
├── BUILD.md     ← NEW
└── app.json     ← MODIFIED (build-properties plugin)
```

## Verification

<verification>
- [ ] `eas.json` defines `development`, `preview`, and `production` profiles
- [ ] `expo-build-properties` sets `minSdkVersion: 26` and Hermes enabled
- [ ] ABI split config targets `armeabi-v7a` and `arm64-v8a`
- [ ] `eas build --profile preview --platform android` starts a build (or `--local`/dry run validates config)
- [ ] `BUILD.md` documents the dev and preview build commands
</verification>

## Troubleshooting

| Symptom | Likely Cause | Fix |
|---|---|---|
| Build fails: minSdk too low for a native dep | A library requires API > 26 | Raise minSdk only if required; document the bumped floor |
| Universal APK still produced | `universalApk` left true | Set per-ABI splits and disable universal in the build-properties/Gradle config |
| Hermes not active | `jsEngine` unset | Set `jsEngine: "hermes"` in app config and rebuild |
| EAS asks for credentials interactively | First Android build | Let EAS generate a keystore, or supply one; store securely |

---

**Previous**: [0.3 Directory Structure & Config](./03_directory_structure_and_config.md) | **Next**: [Phase 0 Checklist](./99_PHASE_CHECKLIST.md)
