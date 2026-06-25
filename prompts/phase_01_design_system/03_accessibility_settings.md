# 1.3 Accessibility Settings Engine

## Context

<context>
Suri's accessibility comfort settings (spec Section 5.6) are first-class, user-selectable options framed as "how Suri talks to you" — never as disability labels. This step builds the single store that holds all six settings (Reader Font, Color Vision, High Contrast, Large Text, Focus Mode, Low Motion) and wires it to the ThemeProvider so toggling any setting re-themes the app live. Focus Mode and Low Motion are consumed later (chat chunking in Phase 5/6, animation gating in Phase 5). The color-vision palettes defined here also feed the SVG diagram renderer in Phase 7.
</context>

## Prerequisites

<prerequisites>
- Steps 1.1–1.2 complete
- `zustand` installed (Phase 0)
</prerequisites>

## AI Implementation Prompt

<instructions>
Build the accessibility store, the color-vision palette definitions, and connect everything to the theme.

Think step by step:

1. **Color-vision palettes** (`src/theme/color-vision.ts`)
   - Define accent/data palettes for `standard`, `deuteranopia`, `protanopia`, `tritanopia` (spec 5.4 colorblind-safe by default). Each palette includes the UI accent plus an ordered list of categorical colors used by charts/diagrams in Phase 7.
   - Use established colorblind-safe color sets (e.g., Okabe–Ito-style for the colorblind variants). Export `getColorVisionPalette(mode)`.

2. **Accessibility store** (`src/features/profile/accessibility-store.ts`)
   - Zustand store holding the `accessibilitySettings` object from `LearningProfile` (Section 5.6): `readerFont`, `colorVision`, `highContrast`, `largeText`, `focusMode`, `lowMotion`.
   - Actions: `setSetting(key, value)`, `resetToDefaults()`.
   - Expose a `persist` seam: a `hydrate(settings)` and a subscription hook so Phase 2 can persist to secure-store. For now, in-memory defaults are fine.

3. **Connect store → theme**
   - Update `ThemeProvider` (1.1) to read `accessibilitySettings` from the store instead of props, derive the color-vision palette, and pass `readerFont`, `scale` (largeText → 1.3), `lowMotion`, and `focusMode` through `useTheme()`.
   - Ensure `useTheme()` now exposes: `theme`, `scale`, `lowMotion`, `focusMode`, `readerFont`, `palette`.

4. **Settings selectors**
   - Provide convenience hooks: `useLowMotion()`, `useFocusMode()`, `useColorVisionPalette()` for ergonomic consumption by later phases.

5. **Live demo wiring**
   - Build a small reusable `AccessibilityToggleRow` component (label + switch/segmented control) that the Phase 6 Settings screen will reuse. Verify each toggle re-themes the app immediately.
</instructions>

<requirements>
### Functional Requirements
- Each of the six settings updates the UI live on change.
- Color Vision change updates UI accents now and is available to diagrams in Phase 7.
- Settings are labeled by effect, not by medical condition (spec design note).

### Technical Requirements
- One store is the single source of truth for accessibility settings.
- A persistence seam exists (hydrate + subscribe) for Phase 2 to attach secure-store.
- Colorblind palettes use evidence-based color-safe sets.

### File Naming Conventions
- Store files kebab-case; hooks `useX` camelCase.
</requirements>

<output_files>
1. `suri/src/theme/color-vision.ts` — palettes + `getColorVisionPalette`
2. `suri/src/features/profile/accessibility-store.ts` — Zustand store
3. `suri/src/features/profile/accessibility-hooks.ts` — `useLowMotion`, `useFocusMode`, `useColorVisionPalette`
4. `suri/src/components/AccessibilityToggleRow.tsx` — reusable toggle row
5. `suri/src/theme/ThemeProvider.tsx` — MODIFIED: reads store, derives palette
6. `suri/src/theme/useTheme.ts` — MODIFIED: exposes palette/lowMotion/focusMode/readerFont
7. `suri/src/features/profile/index.ts` — MODIFIED barrel
</output_files>

## Directory Structure

```
src/
├── theme/
│   ├── color-vision.ts     ← NEW
│   ├── ThemeProvider.tsx   ← MODIFIED
│   └── useTheme.ts         ← MODIFIED
├── features/profile/
│   ├── accessibility-store.ts   ← NEW
│   ├── accessibility-hooks.ts   ← NEW
│   └── index.ts                 ← MODIFIED
└── components/
    └── AccessibilityToggleRow.tsx  ← NEW
```

## Verification

<verification>
- [ ] Toggling each of the six settings updates the UI immediately
- [ ] `getColorVisionPalette('deuteranopia')` returns a distinct safe palette
- [ ] `useLowMotion()` reflects the store value
- [ ] No setting is labeled with a medical condition in user-facing strings
- [ ] `npm run typecheck` and `npm run lint` pass
</verification>

## Troubleshooting

| Symptom | Likely Cause | Fix |
|---|---|---|
| Theme not reacting to store | Provider still reads props | Switch ThemeProvider to subscribe to the store |
| Excessive re-renders | Selecting whole store object | Use selector functions in Zustand to subscribe narrowly |
| Palette colors indistinguishable | Generic palette, not color-safe | Use Okabe–Ito-style sets for the colorblind variants |

---

**Previous**: [1.2 Fonts & Typography](./02_fonts_and_typography.md) | **Next**: [1.4 Navigation Skeleton](./04_navigation_skeleton.md)
