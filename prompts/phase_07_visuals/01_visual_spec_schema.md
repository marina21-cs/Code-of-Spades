# 7.1 Visual Spec Schema & Validation

## Context

<context>
The AI outputs a structured JSON spec (chart type + data, or diagram type + labeled components) that the app renders live (spec 5.4). Because LLM output is untrusted and may be malformed or partial (especially from the smaller offline SLM), the spec must be validated before rendering and fail gracefully if invalid. This step defines the schema (also referenced by the prompt builder in 4.1) and a safe parser used by the chat renderer.
</context>

## Prerequisites

<prerequisites>
- Phase 4.5 (router extracts a fenced ```json visual block)
- Add `zod` (install if not present)
</prerequisites>

## AI Implementation Prompt

<instructions>
Define the visual-spec schema and a tolerant parser.

Think step by step:

1. **Schema** (`src/features/visuals/visual-spec.ts`)
   - Define a discriminated union `VisualSpec` keyed by `type`, covering spec 5.4:
     - `bar_chart` — `{ title?, xLabel?, yLabel?, data: { label, value }[] }`
     - `line_chart` — `{ title?, xLabel?, yLabel?, series: { name?, points: { x, y }[] }[] }`
     - `number_line` — `{ min, max, step?, marks: { value, label? }[] }`
     - `geometric_figure` — `{ shape: 'triangle'|'rectangle'|'circle'|'polygon', vertices?/dimensions, labels?: {...} }`
     - `science_diagram` — `{ subject, title, parts: { id, label, x, y }[], connections?: { from, to }[] , shapeHint? }` (e.g., plant cell parts, body systems, simple circuit nodes)
     - `map` — `{ title, regions: { name, path|points }[] }` (basic)
   - Implement as a `zod` schema; export the inferred TypeScript type.
   - Keep numeric ranges sane (clamp/limit array sizes to avoid pathological specs).

2. **Safe parser** (`src/features/visuals/parse-spec.ts`)
   - `parseVisualSpec(jsonText: string): { ok: true; spec: VisualSpec } | { ok: false; error: string }`.
   - Tolerant: strip code fences if present, attempt `JSON.parse`, then `zod` `safeParse`. Never throw to the caller.
   - Cap the input size and array lengths; reject specs that are too large.

3. **Prompt alignment**
   - Update the Phase 4.1 visual instruction to document this exact schema to the model (a compact schema description + one tiny example), so emitted JSON matches. Keep the instruction short to save tokens, especially for the SLM.

4. **Fallback contract**
   - If parsing fails, the chat renderer (7.2) shows the text answer only (no broken visual). Document this.
</instructions>

<requirements>
### Functional Requirements
- Valid specs parse into typed objects; invalid ones return an error result, never throw.
- The model is told the exact schema so its JSON validates.

### Technical Requirements
- `zod` discriminated union; inferred TS types.
- Input size + array length caps.
- Tolerant of code fences and minor noise.

### File Naming Conventions
- `visual-spec.ts`, `parse-spec.ts`.
</requirements>

<output_files>
1. `suri/src/features/visuals/visual-spec.ts` — zod schema + type
2. `suri/src/features/visuals/parse-spec.ts` — safe parser
3. `suri/src/features/ai/prompt/mode-modifiers.ts` — MODIFIED: document schema to the model
4. `suri/src/features/visuals/index.ts` — MODIFIED barrel
</output_files>

## Directory Structure

```
src/features/visuals/
├── visual-spec.ts   ← NEW
└── parse-spec.ts    ← NEW
```

## Verification

<verification>
- [ ] A valid bar_chart JSON parses to a typed `VisualSpec`
- [ ] Malformed JSON returns `{ ok: false }` without throwing
- [ ] Code-fenced JSON is handled
- [ ] Oversized/abnormal specs are rejected
- [ ] `npm run typecheck` passes
</verification>

## Troubleshooting

| Symptom | Likely Cause | Fix |
|---|---|---|
| Model JSON never validates | Schema not communicated | Add compact schema + example to the prompt |
| Parser throws | Using `parse` not `safeParse` | Use `safeParse`; wrap JSON.parse in try/catch |
| Huge spec freezes render | No caps | Limit array sizes and numeric ranges |

---

**Previous**: [Phase 7 Overview](./00_PHASE_OVERVIEW.md) | **Next**: [7.2 SVG Renderers](./02_svg_renderers.md)
