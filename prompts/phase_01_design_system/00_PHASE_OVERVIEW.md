# Phase 1: Design System & Accessibility

> **Objective**: Build the theming foundation, typography (including OpenDyslexic), the accessibility settings engine (Reader Font, Color Vision, High Contrast, Large Text, Low Motion), and the bottom-tab navigation skeleton.
> **Duration**: ~2–3 hours of agent execution
> **Dependencies**: Phase 0

---

## Phase Goals

1. ✅ Design tokens + theme provider that re-themes the whole app live
2. ✅ OpenDyslexic font bundled and swappable app-wide via one toggle
3. ✅ Accessibility settings engine driving font, palette, contrast, scale, and motion
4. ✅ Bottom-tab navigation (Chat, Reviewer, Quizzes, Profile) rendering with the theme

## Prompt Files in This Phase

| # | Prompt | Purpose |
|---|--------|---------|
| 1.1 | [01_design_tokens_and_theme.md](01_design_tokens_and_theme.md) | Color/spacing/radius tokens, ThemeProvider, useTheme |
| 1.2 | [02_fonts_and_typography.md](02_fonts_and_typography.md) | OpenDyslexic + default fonts, typography scale, large-text scaling |
| 1.3 | [03_accessibility_settings.md](03_accessibility_settings.md) | Accessibility store + how each setting transforms the theme |
| 1.4 | [04_navigation_skeleton.md](04_navigation_skeleton.md) | Expo Router bottom tabs, themed |

## Key Decisions Made

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Theming | Token-based theme object + React context | Spec requires live re-theme on toggle (Section 5.6) |
| A11y framing | Settings labeled by effect, not by condition | Spec design note: "how Suri talks to you," no diagnosis labels |
| Font | OpenDyslexic bundled at build via `expo-font` | Spec Section 8; free/open-source, offline |
| Color vision | Palette variants: standard/deuteranopia/protanopia/tritanopia | Spec 5.4 + 5.6; drives both UI accents and SVG diagrams later |
| Motion | `lowMotion` flag read by every animation | Spec 5.8; mascot becomes static |
| Persistence | Accessibility settings persist in secure-store (with profile) | Single source of truth set up in Phase 2; Phase 1 uses an in-memory store with a persistence seam |

## Skills to Load

- `ui-ux-pro-max` — palettes, font pairing, design-system generation, color-vision-safe palette construction
- `frontend-design` — production-grade, distinctive UI structure
- `core-components` — design-token and component-library patterns
- `react-patterns` — context/provider patterns, avoiding unnecessary re-renders on theme change

## Exit Criteria

Before moving to Phase 2, verify:

- [ ] Toggling Reader Font swaps the entire app to OpenDyslexic instantly
- [ ] Toggling High Contrast switches to a white/black high-contrast theme
- [ ] Large Text scales all text ~1.3×
- [ ] Switching Color Vision changes accent colors app-wide
- [ ] Low Motion is readable by a hook other components can consume
- [ ] Bottom tabs (Chat, Reviewer, Quizzes, Profile) render and are themed
- [ ] `npm run typecheck` and `npm run lint` pass

---

**Next Phase**: [Phase 2: Data Layer](../phase_02_data_layer/00_PHASE_OVERVIEW.md)
