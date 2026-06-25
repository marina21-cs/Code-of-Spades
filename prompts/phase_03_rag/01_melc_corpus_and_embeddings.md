# 3.1 MELC Corpus Seed & Embeddings Bundle

## Context

<context>
Every AI response is grounded in DepEd MELC content so answers stay curriculum-accurate (spec Sections 3, 5.3). Base MELC embeddings are pre-computed at build time and bundled — there is no runtime embedding model for base content (spec 5.3). This step builds the bundled corpus (Grade 6 Science for the demo, spec Section 11 item 5), a build-time script that computes embeddings, and a one-time seeder that loads them into SQLite on first run.
</context>

## Prerequisites

<prerequisites>
- Phase 2 complete (schema: `melc_competencies`, `melc_embeddings`; repositories)
- Decide the embedding model (see instructions)
</prerequisites>

## AI Implementation Prompt

<instructions>
Create the corpus data, a build-time embedding generator, and a first-run seeder.

Think step by step:

1. **Corpus data file** (`assets/melc/grade6-science.json`)
   - Author a structured JSON array of MELC competency chunks for Grade 6 Science. Each entry: `{ competency_code, subject: "Science", grade_level: 6, content }`. Content should be short, grade-appropriate passages (target ~20–40 chunks for the demo) covering common topics (e.g., parts of a plant cell, simple circuits, the digestive system, states of matter) so the demo questions in spec Section 11 have grounding.
   - Keep chunks 1–3 sentences each so the SLM (Tier 3) can ingest a single chunk under tight context (spec Section 10, `n_ctx: 256`).

2. **Choose the embedding model**
   - Use a compact sentence-embedding approach that can also run at runtime for queries/personal content (3.2). Recommended: a small model served via a build-time Node script for the bundle (e.g., a MiniLM-class model through `@xenova/transformers` running in Node), and the SAME model on-device via `@xenova/transformers` (WASM/JSI) or an equivalent compact RN-compatible embedder for runtime query embedding.
   - Record the chosen model id and embedding dimension in `src/constants` (`EMBEDDING_MODEL`, `EMBEDDING_DIM`). Build-time and runtime MUST use the same model/dim or vectors won't be comparable.

3. **Build-time embedding script** (`scripts/build-embeddings.ts`)
   - A Node script (run via `ts-node`/`tsx`, NOT in the app) that reads `grade6-science.json`, computes an embedding per chunk, L2-normalizes it, and writes `assets/melc/grade6-science.embeddings.json` as `[{ competency_code, vector, dim }]`.
   - Add an npm script `build:embeddings`.
   - Document that this is run at build time and the output is committed/bundled.

4. **First-run seeder** (`src/features/rag/seed.ts`)
   - `seedMelcIfNeeded()`: if `melc_competencies` is empty, load the bundled corpus + embeddings JSON (via `expo-asset`/bundled import), insert competencies and their normalized vectors into SQLite in a transaction, matching by `competency_code`.
   - Idempotent: skip if already seeded (check a count or a `user_version`-style marker).
   - Call it during startup after migrations.

5. **Wire startup**
   - Invoke `seedMelcIfNeeded()` from `initDatabase()` flow after `runMigrations()`.
</instructions>

<requirements>
### Functional Requirements
- Bundled corpus + embeddings load into SQLite exactly once on first run.
- Build-time and runtime embeddings use the same model and dimension.
- Vectors are L2-normalized before storage (so cosine = dot product).

### Technical Requirements
- No network needed to seed (assets bundled).
- Seeder runs in a transaction; idempotent.
- `EMBEDDING_MODEL` and `EMBEDDING_DIM` constants are the single source of truth.

### File Naming Conventions
- Corpus assets under `assets/melc/`; build scripts under `scripts/`.
</requirements>

<output_files>
1. `suri/assets/melc/grade6-science.json` — corpus chunks
2. `suri/assets/melc/grade6-science.embeddings.json` — generated, bundled vectors
3. `suri/scripts/build-embeddings.ts` — build-time generator
4. `suri/src/features/rag/seed.ts` — first-run seeder
5. `suri/src/constants/index.ts` — MODIFIED: `EMBEDDING_MODEL`, `EMBEDDING_DIM`
6. `suri/package.json` — MODIFIED: `build:embeddings` script
7. `suri/src/lib/db/index.ts` — MODIFIED: seed after migrations
</output_files>

## Directory Structure

```
suri/
├── assets/melc/
│   ├── grade6-science.json             ← NEW
│   └── grade6-science.embeddings.json  ← NEW (generated)
├── scripts/
│   └── build-embeddings.ts             ← NEW
└── src/features/rag/
    └── seed.ts                         ← NEW
```

## Verification

<verification>
- [ ] `npm run build:embeddings` produces a vectors file with `dim === EMBEDDING_DIM`
- [ ] First app run seeds the corpus; `melc_competencies` and `melc_embeddings` populated
- [ ] Second run does not re-seed (count check passes, no duplicate rows)
- [ ] Stored vectors are normalized (L2 norm ≈ 1.0)
- [ ] `npm run typecheck` passes
</verification>

## Troubleshooting

| Symptom | Likely Cause | Fix |
|---|---|---|
| Vectors not comparable to queries | Different model/dim at build vs runtime | Use one `EMBEDDING_MODEL`/`EMBEDDING_DIM` for both |
| Seed runs every boot | No idempotency check | Skip when `melc_competencies` count > 0 |
| Bundled JSON not found at runtime | Asset not registered | Load via `expo-asset` or static `require`; confirm it's in the bundle |
| Huge bundle size | Too many chunks / fp64 vectors | Limit demo chunks; store Float32; round to reduce JSON size |

---

**Previous**: [Phase 3 Overview](./00_PHASE_OVERVIEW.md) | **Next**: [3.2 Vector Store & Retrieval](./02_vector_store_retrieval.md)
