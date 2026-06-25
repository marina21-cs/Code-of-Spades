# Phase 7: Generative Visuals

> **Objective**: Turn the AI's structured JSON visual spec into live, colorblind-safe diagrams rendered inline in chat via `react-native-svg` — charts, number lines, geometric figures, and labeled science diagrams.
> **Duration**: ~3–4 hours of agent execution
> **Dependencies**: Phase 0–6 (router emits visual specs from 4.5; chat has a render slot from 5.2; palettes from 1.3)

---

## Phase Goals

1. ✅ A validated visual-spec schema the AI emits and the app safely parses
2. ✅ SVG renderers for the spec's chart and diagram types
3. ✅ Colorblind-safe palettes applied to every visual by the student's Color Vision setting

## Prompt Files in This Phase

| # | Prompt | Purpose |
|---|--------|---------|
| 7.1 | [01_visual_spec_schema.md](01_visual_spec_schema.md) | Zod schema + safe parsing of LLM JSON |
| 7.2 | [02_svg_renderers.md](02_svg_renderers.md) | Chart + diagram renderers |
| 7.3 | [03_colorblind_palettes.md](03_colorblind_palettes.md) | Palette wiring + label/large-text scaling |

## Key Decisions Made

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Spec format | Structured JSON (chart/diagram type + data/labels) | Spec 5.4 |
| Render | `react-native-svg`, fresh per question | Spec 5.4 — not from a fixed library |
| Safety | Zod-validate before render; fail gracefully | LLM output is untrusted |
| Palette | Color-vision variants from Phase 1.3 | Spec 5.4 colorblind-safe by default |
| Coverage | bar/line charts, number lines, geometric figures, labeled science diagrams, basic maps | Spec 5.4 |

## Skills to Load

- `frontend-design` — clear, legible diagram composition
- `react-patterns` — memoized rendering, safe parsing boundaries
- `ui-ux-pro-max` — color-safe palettes, visual hierarchy, labels
- `mobile-design` — readable diagrams on small screens, scaling

## Exit Criteria

Before moving to Phase 8, verify:

- [ ] A bar chart and a labeled plant-cell diagram render from AI JSON inline in chat (spec demo item 6)
- [ ] Malformed/partial JSON does not crash chat — it degrades gracefully
- [ ] Switching Color Vision recolors every diagram with a safe palette
- [ ] Large Text scales diagram labels (spec 5.6)
- [ ] `npm run typecheck` and `npm run lint` pass

---

**Next Phase**: [Phase 8: Voice Mode](../phase_08_voice/00_PHASE_OVERVIEW.md)
