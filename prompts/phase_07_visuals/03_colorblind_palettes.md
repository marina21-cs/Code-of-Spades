# 7.3 Colorblind-Safe Palette Integration

## Context

<context>
Every chart and diagram must be usable by every student: the SVG renderer uses palette variants matched to the student's accessibility setting (standard / deuteranopia / protanopia / tritanopia) — colorblind-safe by default (spec 5.4). The palettes were defined in Phase 1.3 (`getColorVisionPalette`). This step wires them into the renderers so changing Color Vision recolors every visual live, and ensures categorical colors stay distinguishable.
</context>

## Prerequisites

<prerequisites>
- Phase 1.3 (`getColorVisionPalette`, `useColorVisionPalette`)
- Phase 7.2 (renderers accept a palette prop)
</prerequisites>

## AI Implementation Prompt

<instructions>
Connect the color-vision palette to the visual renderers.

Think step by step:

1. **Palette adapter** (`src/features/visuals/palette.ts`)
   - `useVisualPalette()` reads the active color-vision mode (from the profile/accessibility store) and returns an ordered categorical palette + semantic colors (axis, grid, text, accent) suitable for SVG.
   - Ensure adjacent categories differ in BOTH hue and lightness (so they're distinguishable even when hue perception is reduced). Use Okabe–Ito-style sets for the colorblind variants (from 1.3).

2. **Wire into dispatcher**
   - `VisualRenderer` reads `useVisualPalette()` and passes it to each renderer. Renderers must not hardcode colors — all categorical and semantic colors come from the palette.

3. **Pattern/shape redundancy (robustness)**
   - For bar/line charts and maps, add a secondary distinguishing cue beyond color where feasible (e.g., distinct dash patterns for line series, or labels on bars), so meaning never relies on color alone. Keep it subtle.

4. **High Contrast interplay**
   - When High Contrast is on, increase stroke weights and ensure text/axis colors meet contrast against the background. Pull these from the theme.

5. **Live switching**
   - Confirm changing Color Vision in Settings recolors already-rendered diagrams (palette comes from a hook → re-render on change).
</instructions>

<requirements>
### Functional Requirements
- Changing Color Vision recolors all visuals live.
- Categorical colors remain distinguishable in each mode; meaning not color-only.
- High Contrast strengthens strokes/axis legibility.

### Technical Requirements
- Renderers take colors only from the palette/theme (no hardcoded hex).
- Palettes use color-safe sets with hue + lightness separation.

### File Naming Conventions
- `palette.ts` in the visuals feature.
</requirements>

<output_files>
1. `suri/src/features/visuals/palette.ts` — `useVisualPalette`
2. `suri/src/features/visuals/VisualRenderer.tsx` — MODIFIED: inject palette
3. `suri/src/features/visuals/renderers/*` — MODIFIED: consume palette (no hardcoded colors)
4. `suri/src/features/visuals/index.ts` — MODIFIED barrel
</output_files>

## Directory Structure

```
src/features/visuals/
└── palette.ts   ← NEW
(renderers MODIFIED to consume palette)
```

## Verification

<verification>
- [ ] Switching Color Vision in Settings recolors a visible chart immediately
- [ ] Deuteranopia/protanopia palettes keep series distinguishable (hue + lightness)
- [ ] Line series also differ by dash pattern (not color alone)
- [ ] High Contrast thickens strokes and keeps axis text legible
- [ ] No hardcoded hex remains in renderers (grep)
- [ ] `npm run typecheck` and `npm run lint` pass
</verification>

## Troubleshooting

| Symptom | Likely Cause | Fix |
|---|---|---|
| Colors don't change on toggle | Palette read once, not via hook | Use `useVisualPalette()` so it re-renders |
| Series indistinguishable | Palette too similar | Use Okabe–Ito-style; add dash/label redundancy |
| Low contrast text | Ignoring High Contrast theme | Pull axis/text color from theme; bump weights |

---

**Previous**: [7.2 SVG Renderers](./02_svg_renderers.md) | **Next**: [Phase 7 Checklist](./99_PHASE_CHECKLIST.md)
