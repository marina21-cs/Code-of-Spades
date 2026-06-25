# 1.1 Design Tokens & Theme Provider

## Context

<context>
Suri must re-theme its entire UI live when a student toggles High Contrast or changes Color Vision (spec Section 5.6 — "Two taps, instant effect"). That only works if every component reads from a central theme rather than hardcoding colors. This step defines the design tokens and a `ThemeProvider` + `useTheme` hook that produces the active theme from the current accessibility settings. The accessibility store that feeds it arrives in 1.3; for now the provider accepts settings and derives a theme.
</context>

## Prerequisites

<prerequisites>
- Phase 0 complete
- `src/theme/index.ts` barrel exists
</prerequisites>

## AI Implementation Prompt

<instructions>
Create the token system and a theme provider that derives the active theme from accessibility inputs.

Think step by step:

1. **Base tokens** (`src/theme/tokens.ts`)
   - Color palette per spec Section 7 brand: warm orange/cream base, single accent reserved for "AI thinking" (soft glow). Define semantic tokens: `background`, `surface`, `textPrimary`, `textSecondary`, `accent`, `accentGlow`, `border`, `success`, `danger`, `muted`.
   - Spacing scale (`xs`=4, `sm`=8, `md`=16, `lg`=24, `xl`=32), radius scale (`sm`=8, `md`=12, `lg`=20, `pill`=999), and a base font-size scale.

2. **Theme variants** (`src/theme/themes.ts`)
   - `standardTheme` (warm orange/cream, brand identity).
   - `highContrastTheme` (full white/black, heavier border weights — spec 5.6).
   - A `buildTheme(settings)` function that takes accessibility settings and returns the resolved theme: picks base vs high-contrast, applies the color-vision accent palette (imported from the color-vision module added in 1.3 — for now accept a palette param), and exposes a `scale` multiplier for Large Text (1.0 or 1.3).

3. **ThemeProvider + hook** (`src/theme/ThemeProvider.tsx`, `src/theme/useTheme.ts`)
   - `ThemeProvider` accepts the current accessibility settings (prop now; wired to the store in 1.3) and memoizes `buildTheme`.
   - `useTheme()` returns the resolved theme object plus the `scale` multiplier and a `lowMotion` boolean.
   - Memoize so unrelated re-renders don't rebuild the theme.

4. **Themed primitives** (`src/components/`)
   - `ThemedText`, `ThemedView`, `Card`, `Button` that consume `useTheme()`. `ThemedText` multiplies its font size by `scale`. Export via the components barrel.

5. **Wire into root**
   - Wrap the app in `ThemeProvider` in `app/_layout.tsx` (with hardcoded default settings for now; replaced by the store in 1.3).
</instructions>

<requirements>
### Functional Requirements
- Changing the settings passed to `ThemeProvider` re-themes all themed components.
- High Contrast yields a white/black theme with heavier borders.
- Large Text multiplies text sizes by 1.3 via the `scale`.

### Technical Requirements
- No hardcoded hex colors in components — only token references via `useTheme()`.
- Theme rebuild is memoized on settings identity.

### File Naming Conventions
- Components PascalCase files; theme utilities kebab-case where not components.
</requirements>

<output_files>
1. `suri/src/theme/tokens.ts` — base color/spacing/radius/font tokens
2. `suri/src/theme/themes.ts` — `standardTheme`, `highContrastTheme`, `buildTheme()`
3. `suri/src/theme/ThemeProvider.tsx` — provider
4. `suri/src/theme/useTheme.ts` — hook
5. `suri/src/theme/index.ts` — MODIFIED barrel
6. `suri/src/components/ThemedText.tsx` — text primitive (scales with Large Text)
7. `suri/src/components/ThemedView.tsx`
8. `suri/src/components/Card.tsx`
9. `suri/src/components/Button.tsx`
10. `suri/src/components/index.ts` — MODIFIED barrel
11. `suri/app/_layout.tsx` — MODIFIED: ThemeProvider wrap
</output_files>

## Directory Structure

```
src/
├── theme/
│   ├── tokens.ts          ← NEW
│   ├── themes.ts          ← NEW
│   ├── ThemeProvider.tsx  ← NEW
│   ├── useTheme.ts        ← NEW
│   └── index.ts           ← MODIFIED
└── components/
    ├── ThemedText.tsx     ← NEW
    ├── ThemedView.tsx     ← NEW
    ├── Card.tsx           ← NEW
    ├── Button.tsx         ← NEW
    └── index.ts           ← MODIFIED
```

## Verification

<verification>
- [ ] `useTheme()` returns a theme, `scale`, and `lowMotion`
- [ ] Passing `highContrast: true` to ThemeProvider renders white/black
- [ ] Passing `largeText: true` scales `ThemedText` ~1.3×
- [ ] No raw hex colors in component files (grep for `#` in `src/components`)
- [ ] `npm run typecheck` passes
</verification>

## Troubleshooting

| Symptom | Likely Cause | Fix |
|---|---|---|
| Theme doesn't update on toggle | Theme object not memo-keyed on settings | Memoize `buildTheme` with settings as deps |
| Everything re-renders on any state change | Provider value not memoized | Wrap context value in `useMemo` |
| Text doesn't scale | Component reads token size directly | Route all font sizes through `ThemedText` using `scale` |

---

**Previous**: [Phase 1 Overview](./00_PHASE_OVERVIEW.md) | **Next**: [1.2 Fonts & Typography](./02_fonts_and_typography.md)
