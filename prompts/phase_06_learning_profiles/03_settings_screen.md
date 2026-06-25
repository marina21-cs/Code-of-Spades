# 6.3 Settings Screen (Profile + Accessibility)

## Context

<context>
The Learning Profile is editable anytime in Settings (spec 5.6), and the accessibility comfort settings are toggled here — the live Reader Font / High Contrast demo (spec Section 11, item 7) happens on this screen. It also hosts the API-key entry for the cloud providers (keys live in secure-store, rotatable without an app update — spec Section 10) and the optional offline-model download (Phase 4.4). This is the Profile tab.
</context>

## Prerequisites

<prerequisites>
- Phase 2.3 (profile store), Phase 1.3 (`AccessibilityToggleRow`, color-vision)
- Phase 4.2 (key store), Phase 4.4 (model download)
- Phase 6.1 (mode descriptors)
</prerequisites>

## AI Implementation Prompt

<instructions>
Build the Profile/Settings screen at `app/(tabs)/profile.tsx`.

Think step by step:

1. **Profile section**
   - Grade level selector (4–10).
   - Response mode selector using the 6.1 descriptors (Visual/Auditory/Reading/Kinesthetic/Mixed) with a one-line description each.
   - "Re-run setup quiz" button → navigates to onboarding.

2. **Accessibility section** (reuse `AccessibilityToggleRow`)
   - Reader Font (switch), High Contrast (switch), Large Text (switch), Low Motion (switch), Focus Mode (switch), Color Vision (segmented: standard/deuteranopia/protanopia/tritanopia).
   - Each applies instantly (live retheme — they already drive the theme from Phase 1.3). Label by effect, not condition.

3. **AI providers section**
   - For each provider (Gemini, Groq, OpenRouter), a masked key input that saves to secure-store via the key store. Show which providers are configured. Never display the stored key value back in plaintext (show "configured" + a change button).
   - Brief helper text linking to where to get free keys (see `appendix/B_AI_PROVIDER_REFERENCE.md`).
   - Security note: keys never leave the device except as Authorization headers to the provider.

4. **Offline model section**
   - Show SLM status (not downloaded / downloading / ready). A download button triggers the resumable download (4.4) with progress + storage cost ("~100MB"). Defer gracefully if storage is low.

5. **Layout**
   - Scrollable, grouped sections, themed; respects all accessibility settings (it's the screen that toggles them).
</instructions>

<requirements>
### Functional Requirements
- All profile + accessibility settings editable and persist immediately.
- Toggling Reader Font / High Contrast re-themes the app live.
- API keys saved to secure-store; never shown in plaintext after save.
- Offline model download with progress + storage guard.

### Technical Requirements
- Reuse `AccessibilityToggleRow` and mode descriptors (no duplicate UI/strings).
- Masked, secure key inputs.

### File Naming Conventions
- Settings sections may be split into components under `src/features/profile/settings/`.
</requirements>

<output_files>
1. `suri/app/(tabs)/profile.tsx` — MODIFIED: full settings screen
2. `suri/src/features/profile/settings/ProfileSection.tsx`
3. `suri/src/features/profile/settings/AccessibilitySection.tsx`
4. `suri/src/features/profile/settings/ProvidersSection.tsx`
5. `suri/src/features/profile/settings/OfflineModelSection.tsx`
6. `suri/src/features/profile/index.ts` — MODIFIED barrel
</output_files>

## Directory Structure

```
app/(tabs)/profile.tsx               ← MODIFIED
src/features/profile/settings/
├── ProfileSection.tsx        ← NEW
├── AccessibilitySection.tsx  ← NEW
├── ProvidersSection.tsx      ← NEW
└── OfflineModelSection.tsx   ← NEW
```

## Verification

<verification>
- [ ] Changing response mode/grade persists and affects the next answer
- [ ] Reader Font + High Contrast toggle re-themes instantly (two-tap demo)
- [ ] Saving an API key persists it; the value is not shown again in plaintext
- [ ] Model download shows progress and reports "ready"; low storage defers gracefully
- [ ] `npm run typecheck` and `npm run lint` pass
</verification>

## Troubleshooting

| Symptom | Likely Cause | Fix |
|---|---|---|
| Toggle doesn't retheme | Writing wrong store | Write through the profile/accessibility store from Phase 2.3 |
| Key visible after save | Echoing stored value | Show status only; never read back the secret to the UI |
| Download button does nothing | Not wired to 4.4 | Call the resumable download + subscribe to progress |

---

**Previous**: [6.2 First-Run Quiz](./02_first_run_quiz.md) | **Next**: [Phase 6 Checklist](./99_PHASE_CHECKLIST.md)
