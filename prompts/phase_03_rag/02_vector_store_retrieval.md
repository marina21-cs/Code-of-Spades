# 3.2 Vector Store & Cosine Retrieval

## Context

<context>
This step turns the seeded vectors into a working retriever. Every AI response on every tier retrieves top-k relevant MELC passages before generation (spec 5.3) — k=3 online, k=5 offline (spec 5.2) to compensate for the smaller on-device model. It also adds the runtime query embedder so a student's question (and later their personal notes) can be matched against the bundled corpus.
</context>

## Prerequisites

<prerequisites>
- Step 3.1 complete (corpus seeded, `EMBEDDING_MODEL`/`EMBEDDING_DIM` set)
</prerequisites>

## AI Implementation Prompt

<instructions>
Build the runtime embedder and cosine top-k retrieval.

Think step by step:

1. **Runtime embedder** (`src/features/rag/embedder.ts`)
   - `embedText(text: string): Promise<Float32Array>` using the same `EMBEDDING_MODEL` as build time (compact MiniLM-class via `@xenova/transformers` or chosen RN-compatible embedder), L2-normalized output.
   - Lazy-initialize the model on first use (spec Section 10 lazy native init philosophy); cache the instance.
   - Keep it CPU-friendly; this runs on budget devices.

2. **Cosine math** (`src/features/rag/similarity.ts`)
   - `cosineSimilarity(a, b)` for normalized vectors = dot product. Provide a plain dot-product fast path and a guarded general path.

3. **Retriever** (`src/features/rag/retriever.ts`)
   - `retrieveTopK(query: string, k: number, opts?: { gradeLevel?, subject?, includePersonal?: boolean }): Promise<RetrievedChunk[]>`:
     - Embed the query.
     - Load candidate vectors from SQLite (filter by grade/subject when provided to shrink the scan).
     - Score each by cosine, sort desc, return top-k with `{ competencyCode, content, score }`.
     - When `includePersonal`, also scan `personal_embeddings` and merge.
   - Add `retrieveForTier(query, tier, profile)` convenience that picks k from constants: `MELC_TOP_K_ONLINE` (strong/weak) vs `MELC_TOP_K_OFFLINE` (offline), filters by `profile.gradeLevel`.

4. **Performance**
   - For the demo corpus size, a full in-memory scan is fine. Read vectors once, decode to Float32Array, score in a tight loop. Note in comments where an ANN index would go for a larger corpus (post-MVP).

5. **Expose**
   - Export retriever functions from the rag barrel for Phase 4's prompt builder.
</instructions>

<requirements>
### Functional Requirements
- `retrieveTopK` returns the most relevant passages for a query, scored.
- Tier-aware retrieval uses k=3 (online) / k=5 (offline).
- Grade-level filtering narrows results to the student's grade.

### Technical Requirements
- Query embeddings use the same model/dim as bundled vectors.
- Embedder lazy-loaded and cached.
- Cosine via dot product on normalized vectors.

### File Naming Conventions
- `embedder.ts`, `similarity.ts`, `retriever.ts`.
</requirements>

<output_files>
1. `suri/src/features/rag/embedder.ts` — runtime embedding
2. `suri/src/features/rag/similarity.ts` — cosine/dot product
3. `suri/src/features/rag/retriever.ts` — top-k + tier-aware retrieval
4. `suri/src/features/rag/index.ts` — MODIFIED barrel
</output_files>

## Directory Structure

```
src/features/rag/
├── embedder.ts     ← NEW
├── similarity.ts   ← NEW
├── retriever.ts    ← NEW
└── index.ts        ← MODIFIED
```

## Verification

<verification>
- [ ] Asking "What are the parts of a plant cell?" returns the relevant cell chunk(s) at top rank
- [ ] `retrieveForTier(q, 'offline', profile)` returns 5 chunks; `'strong'` returns 3
- [ ] Grade-level filter excludes other grades
- [ ] Scores are in [-1, 1] and ordered descending
- [ ] First retrieval lazy-loads the embedder without crashing on device
- [ ] `npm run typecheck` passes
</verification>

## Troubleshooting

| Symptom | Likely Cause | Fix |
|---|---|---|
| Irrelevant top results | Model mismatch build vs runtime | Confirm identical `EMBEDDING_MODEL`/dim; re-seed if needed |
| Embedder OOM on device | Model too large | Use a MiniLM-class compact model; lazy-load; reuse instance |
| Slow retrieval | Decoding vectors every call | Cache decoded Float32 arrays in memory after first load |
| All scores ~equal | Vectors not normalized | Normalize at both build and runtime |

---

**Previous**: [3.1 MELC Corpus & Embeddings](./01_melc_corpus_and_embeddings.md) | **Next**: [3.3 Response Cache](./03_response_cache.md)
