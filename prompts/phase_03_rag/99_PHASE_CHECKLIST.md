# Phase 3 Completion Checklist

## All Steps Completed

- [ ] 3.1 — MELC corpus + pre-computed embeddings bundled & seeded
- [ ] 3.2 — Cosine top-k retrieval + runtime query embedder
- [ ] 3.3 — Response cache layer

## Verification Tests

```bash
npm run build:embeddings   # Expected: vectors file with correct dim
npm run typecheck          # Expected: zero errors
npm run lint               # Expected: zero errors
npx expo run:android       # Expected: seed on first run, retrieval returns relevant chunks
```

## Code Quality Checks

- [ ] Build-time and runtime embeddings share one `EMBEDDING_MODEL`/`EMBEDDING_DIM`
- [ ] Vectors L2-normalized at both ends
- [ ] Embedder lazy-loaded and cached
- [ ] Cache upserts on unique `query_hash`; parameterized SQL

## Manual Verification

- [ ] "Parts of a plant cell?" retrieves the correct passage at top rank
- [ ] Online k=3, offline k=5
- [ ] Repeat question hits cache and increments hit_count

## Rollback Plan

1. If embeddings mismatch, regenerate with `build:embeddings` and clear/re-seed the DB (delete app data or bump a seed marker)
2. If retrieval is too slow, reduce demo corpus size or cache decoded vectors in memory

---

**Proceed to**: [Phase 4: Hybrid AI Engine](../phase_04_ai_engine/00_PHASE_OVERVIEW.md)
