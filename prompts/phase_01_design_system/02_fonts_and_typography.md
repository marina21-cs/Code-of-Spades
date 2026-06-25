# 1.2 Fonts (OpenDyslexic) & Typography Scale

## Context

<context>
The Reader Font accessibility setting switches the entire app to OpenDyslexic with wider letter spacing and no italics (spec Section 5.6). This is one of Suri's headline accessibility demos (spec Section 11, item 7 — toggled live on stage). This step bundles OpenDyslexic and a clean default font via `expo-font`, defines the typography scale, and makes the active font family a function of the Reader Font setting so 1.3's settings engine can flip it instantly.
</context>

## Prerequisites

<prerequisites>
- Step 1.1 complete (theme + `ThemedText`)
- `expo-font` installed (Phase 0)
</prerequisites>

## AI Implementation Prompt

<instructions>
Bundle fonts, expose a typography system, and make font family respond to the Reader Font setting.

Think step by step:

1. **Add font assets**
   - Place OpenDyslexic (Regular + Bold) and a clean default sans (e.g., Inter Regular/Medium/Bold, or the Expo default) under `assets/fonts/`.
   - OpenDyslexic is free/open-source; bundle the `.otf`/`.ttf` files at build time (no runtime download).

2. **Load fonts** (`src/theme/fonts.ts`)
   - Use `expo-font`'s `useFonts` (or `Font.loadAsync`) to load both families at app start.
   - Gate the app's first render on fonts loaded (show a minimal splash/null until ready) in `app/_layout.tsx`.

3. **Typography scale** (`src/theme/typography.ts`)
   - Define semantic text roles: `display`, `title`, `heading`, `body`, `bodySmall`, `caption`, `button`. Each role has a base size, line height, and weight.
   - Provide a `getFontFamily(readerFont: boolean, weight)` helper that returns OpenDyslexic family when `readerFont` is true, otherwise the default family.
   - When Reader Font is active: increase letter spacing and force non-italic per spec.

4. **Integrate with `ThemedText`**
   - Update `ThemedText` (from 1.1) to accept a `role` prop, pull size/line-height from the typography scale, multiply size by the theme `scale` (Large Text), and choose family via `getFontFamily(readerFont)`.
   - `readerFont` comes from the theme/settings context.

5. **Verify swap**
   - Add a temporary dev toggle (or a Storybook-style demo screen) to flip Reader Font and confirm the whole screen changes font family.
</instructions>

<requirements>
### Functional Requirements
- Reader Font ON → entire app renders in OpenDyslexic with wider letter spacing, no italics.
- Large Text continues to scale sizes by 1.3 (from 1.1) regardless of font family.

### Technical Requirements
- Fonts bundled at build time via `expo-font` (offline; no network).
- App waits for fonts to load before first paint.
- Single source for font-family selection (`getFontFamily`), used by `ThemedText`.

### File Naming Conventions
- Font assets: descriptive kebab-case (`open-dyslexic-regular.otf`).
</requirements>

<output_files>
1. `suri/assets/fonts/` — OpenDyslexic + default font files
2. `suri/src/theme/fonts.ts` — font loading + `getFontFamily`
3. `suri/src/theme/typography.ts` — typography scale + roles
4. `suri/src/components/ThemedText.tsx` — MODIFIED: role + family + scale
5. `suri/app/_layout.tsx` — MODIFIED: gate render on fonts loaded
6. `suri/src/theme/index.ts` — MODIFIED barrel
</output_files>

## Directory Structure

```
suri/
├── assets/fonts/
│   ├── open-dyslexic-regular.otf   ← NEW
│   ├── open-dyslexic-bold.otf      ← NEW
│   └── inter-*.ttf                 ← NEW (default family)
└── src/theme/
    ├── fonts.ts        ← NEW
    └── typography.ts   ← NEW
```

## Verification

<verification>
- [ ] App boots with custom fonts loaded (no flash of system font after load)
- [ ] Reader Font toggle swaps every text element to OpenDyslexic
- [ ] OpenDyslexic mode applies wider letter spacing and removes italics
- [ ] Large Text + Reader Font work together (scaled OpenDyslexic)
- [ ] `npm run typecheck` passes
</verification>

## Troubleshooting

| Symptom | Likely Cause | Fix |
|---|---|---|
| Text shows system font briefly | Render not gated on load | Return `null`/splash until `useFonts` resolves |
| Bold not applying | Wrong family name string | Match the exact family name registered in `useFonts` |
| Letter spacing ignored | Set on wrong style prop | Use `letterSpacing` in the text style; verify not overridden |
| App size jumped a lot | Too many font weights bundled | Bundle only the weights actually used (Regular + Bold) |

---

**Previous**: [1.1 Design Tokens & Theme](./01_design_tokens_and_theme.md) | **Next**: [1.3 Accessibility Settings](./03_accessibility_settings.md)
