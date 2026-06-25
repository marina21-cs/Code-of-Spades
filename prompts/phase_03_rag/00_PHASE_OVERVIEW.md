# Phase 3: Local RAG Store ("Personalized Reviewer")

> **Objective**: Seed the MELC competency corpus with pre-computed embeddings, build cosine-similarity top-k retrieval over SQLite, and add the response cache that makes repeat questions progressively offline.
> **Duration**: ~2–3 hours of agent execution
> **Dependencies**: Phase 0–2

---

## Phase Goals

1. ✅ Grade 6 Science MELC corpus seeded into SQLite with pre-computed embeddings at build time
2. ✅ Cosine-similarity retrieval returning top-k passages (k=3 online, k=5 offline per spec)
3. ✅ A query embedder for runtime (personal content + query vectors)
4. ✅ Response cache read/write keyed by normalized query hash

## Prompt Files in This Phase

| # | Prompt | Purpose |
|---|--------|---------|
| 3.1 | [01_melc_corpus_and_embeddings.md](01_melc_corpus_and_embeddings.md) | Build-time corpus + embeddings bundle + seeder |
| 3.2 | [02_vector_store_retrieval.md](02_vector_store_retrieval.md) | Cosine retrieval, top-k, query embedding |
| 3.3 | [03_response_cache.md](03_response_cache.md) | Cache layer for offline reuse |

## Key Decisions Made

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Base embeddings | Pre-computed at build time, bundled | Spec 5.3 — no runtime embedding model for base content |
| Runtime embeddings | Compact model for personal content + queries | Spec 5.3 personal layer |
| Similarity | Cosine over normalized vectors | Spec Section 8 (expo-sqlite + cosine) |
| top-k | 3 online, 5 offline | Spec 5.2/5.3 — more context compensates for smaller SLM |
| Cache key | Normalized + hashed query (+ grade level) | Spec 5.3 progressive-offline behavior |
| Demo corpus | Grade 6 Science MELCs | Spec Section 11, item 5 |

## Skills to Load

- `rag-implementation` — chunking strategy, retrieval, grounding patterns
- `rag-engineer` — embeddings, vector search, top-k tuning
- `ai-product` — RAG architecture and cost/perf trade-offs for on-device
- `database-design` — efficient vector storage and indexed reads in SQLite

## Exit Criteria

Before moving to Phase 4, verify:

- [ ] On first run, the MELC corpus + embeddings seed into SQLite exactly once
- [ ] `retrieveTopK(query, k)` returns relevant Grade 6 Science passages with scores
- [ ] Online path requests k=3, offline path requests k=5 (configurable via constants)
- [ ] A query can be embedded at runtime and matched against bundled vectors
- [ ] Cache write then read returns the stored response and increments `hit_count`
- [ ] `npm run typecheck` and `npm run lint` pass

---

**Next Phase**: [Phase 4: Hybrid AI Engine](../phase_04_ai_engine/00_PHASE_OVERVIEW.md)
