# 7.2 SVG Renderers (Charts & Diagrams)

## Context

<context>
This step renders the validated `VisualSpec` into live SVG inside the chat bubble (spec 5.4). Every diagram is generated fresh for the specific question (spec 5.4) — these renderers are generic over the spec, not a fixed picture library. Coverage per spec: bar/line charts, number lines, geometric figures, labeled science diagrams (cell parts, body systems, simple circuits), and basic maps.
</context>

## Prerequisites

<prerequisites>
- Phase 7.1 (schema + parser)
- `react-native-svg` (Phase 0); Phase 5.2 chat render slot
</prerequisites>

## AI Implementation Prompt

<instructions>
Build a dispatcher and per-type SVG renderers.

Think step by step:

1. **Dispatcher** (`src/features/visuals/VisualRenderer.tsx`)
   - Props: `{ spec: VisualSpec }` (already validated). Switch on `spec.type` to the matching renderer. Wrap in an error boundary so a render error shows the text answer fallback, never a crash.
   - Container sizes responsively to the chat width; respects theme background.

2. **Renderers** (`src/features/visuals/renderers/`)
   - `BarChartSvg.tsx` — axes, labeled bars, value labels; categorical colors from the palette (7.3).
   - `LineChartSvg.tsx` — axes, polylines per series, point markers.
   - `NumberLineSvg.tsx` — horizontal axis, ticks, labeled marks.
   - `GeometricFigureSvg.tsx` — triangle/rectangle/circle/polygon with vertex/side labels.
   - `ScienceDiagramSvg.tsx` — positioned labeled parts with connector lines/leader lines; handles plant cell, body systems, simple circuits via the generic `parts`/`connections` model.
   - `MapSvg.tsx` — basic region polygons with labels.
   - Each renderer: pure, memoized, derives geometry from the spec, scales labels by the theme `scale` (Large Text), and reads colors from a passed palette prop (wired in 7.3).

3. **Layout safety**
   - Compute a viewBox from data; clamp to sane min/max sizes; avoid overflow. Truncate or wrap long labels.

4. **Integrate into chat**
   - In `MessageBubble` (5.2), when a message has a parsed `visualSpec`, render `<VisualRenderer spec={...} />` below the text.
</instructions>

<requirements>
### Functional Requirements
- Each spec type renders a correct, legible diagram inline in chat.
- A render failure falls back to text-only without crashing chat.

### Technical Requirements
- Pure, memoized renderers; geometry derived from spec.
- Responsive sizing; labels scale with Large Text.
- Colors come from a palette prop (not hardcoded).

### File Naming Conventions
- Renderers under `src/features/visuals/renderers/`, PascalCase.
</requirements>

<output_files>
1. `suri/src/features/visuals/VisualRenderer.tsx` — dispatcher + error boundary
2. `suri/src/features/visuals/renderers/BarChartSvg.tsx`
3. `suri/src/features/visuals/renderers/LineChartSvg.tsx`
4. `suri/src/features/visuals/renderers/NumberLineSvg.tsx`
5. `suri/src/features/visuals/renderers/GeometricFigureSvg.tsx`
6. `suri/src/features/visuals/renderers/ScienceDiagramSvg.tsx`
7. `suri/src/features/visuals/renderers/MapSvg.tsx`
8. `suri/src/features/chat/components/MessageBubble.tsx` — MODIFIED: render visual slot
9. `suri/src/features/visuals/index.ts` — MODIFIED barrel
</output_files>

## Directory Structure

```
src/features/visuals/
├── VisualRenderer.tsx
└── renderers/
    ├── BarChartSvg.tsx
    ├── LineChartSvg.tsx
    ├── NumberLineSvg.tsx
    ├── GeometricFigureSvg.tsx
    ├── ScienceDiagramSvg.tsx
    └── MapSvg.tsx
```

## Verification

<verification>
- [ ] Bar chart renders from a sample spec with correct bar heights + labels
- [ ] Labeled plant-cell diagram renders parts with leader lines
- [ ] A deliberately broken spec falls back to text-only (no crash)
- [ ] Diagrams fit the chat width; long labels don't overflow
- [ ] Large Text scales diagram labels
- [ ] `npm run typecheck` and `npm run lint` pass
</verification>

## Troubleshooting

| Symptom | Likely Cause | Fix |
|---|---|---|
| Diagram overflows bubble | Fixed width | Size to container; compute viewBox |
| Bars wrong height | Not normalizing to max value | Scale values to chart height |
| Labels clipped | No wrap/truncate | Truncate with ellipsis or wrap; reduce font for long labels |
| Crash on bad spec | No boundary | Wrap renderer in an error boundary → text fallback |

---

**Previous**: [7.1 Visual Spec Schema](./01_visual_spec_schema.md) | **Next**: [7.3 Colorblind-Safe Palettes](./03_colorblind_palettes.md)
