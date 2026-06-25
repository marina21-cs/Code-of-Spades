# Appendix A — Design System Reference

Reference for the tokens, typography, palettes, and mascot defined across Phase 1. The executing agent should treat these as the canonical values; refine with the `ui-ux-pro-max` skill.

## Brand (spec Section 7)

- **Name:** Suri (from *suriin*, "to examine/analyze").
- **Personality:** Quick-witted, encouraging, never condescending. Asks before telling (Socratic). Changes *how* it explains, not *what* it knows.
- **Mascot:** Chibi fox — large head/eyes, small body. Philippine accent: sun-ray chest tuft or woven *salakot* (not a generic mortarboard). Warm orange/cream base; a single accent reserved for "AI thinking" (soft glow on the tail tip during inference).

## Color Tokens (semantic)

| Token | Standard theme | High Contrast theme |
|---|---|---|
| `background` | warm cream | pure white (or black in dark HC) |
| `surface` | soft cream/orange tint | white / black |
| `textPrimary` | deep warm brown/near-black | pure black / pure white |
| `textSecondary` | muted brown | high-contrast gray |
| `accent` | warm orange (from color-vision palette) | palette accent, max contrast |
| `accentGlow` | soft glow orange (inference) | n/a or reduced |
| `border` | light warm gray | heavy black/white border |
| `success` / `danger` | color-safe green / red-orange | color-safe, high contrast |

> All accents come from the active **color-vision palette** (Phase 1.3). Never hardcode hex in components.

## Color-Vision Palettes (spec 5.4 / 5.6)

Four modes: `standard`, `deuteranopia`, `protanopia`, `tritanopia`. Colorblind variants use Okabe–Ito-style sets so categories differ in **hue and lightness**. Charts add redundant cues (dash patterns, labels) so meaning is never color-only.

## Spacing & Radius

- Spacing: `xs`=4, `sm`=8, `md`=16, `lg`=24, `xl`=32.
- Radius: `sm`=8, `md`=12, `lg`=20, `pill`=999.

## Typography (spec 5.6 / 5.7)

- Default family: clean sans (e.g., Inter). Reader Font: **OpenDyslexic** (wider letter spacing, no italics) bundled via `expo-font`.
- Roles: `display`, `title`, `heading`, `body`, `bodySmall`, `caption`, `button`.
- **Large Text:** multiply all sizes by 1.3 (theme `scale`), including SVG diagram labels.
- Family chosen via `getFontFamily(readerFont, weight)` — single source.

## Accessibility Settings (effect-labeled, never condition-labeled)

| Setting | Effect |
|---|---|
| Reader Font | OpenDyslexic app-wide, wider spacing, no italics |
| Color Vision | standard / deuteranopia / protanopia / tritanopia palettes |
| High Contrast | white/black UI, heavier borders |
| Large Text | 1.3× all text + diagram labels |
| Focus Mode | ~120-word responses, one idea per message, more micro-rewards, calmer viewport |
| Low Motion | all animation off; mascot becomes a static illustration |

## Mascot States (spec 5.8 / 7)

- **Idle:** slow gentle bounce.
- **Thinking:** ears perk, tail sweeps, tail-tip glow (during inference).
- **Celebrating:** energetic bounce, tail wag (correct answers, streak milestones, level-ups).
- **Listening:** sound-wave ring (STT active).
- **Auditory ring:** audio-wave ring around Suri while TTS speaks.
- **Suri Local (offline):** desaturated palette + moon (*buwan*) icon.
- **Low Motion:** static "calm" illustration for every state.
- **Evolution:** kit → young → elder fox (glowing markings). Distinct from Duolingo.
- Assets: Lottie JSON or vector + reanimated transforms, total <200KB (spec Section 10).

## Motion Rules

- Reanimated worklets on the UI thread; never JS-driven per-frame.
- Every animation must check `lowMotion` and fall back to static.
- Pause/cleanup animations when offscreen.
