# 3.3 Response Cache Layer

## Context

<context>
Cached cloud responses are stored in SQLite and served on subsequent offline requests for the same query, so frequently asked topics become progressively more "offline" over time (spec 5.3). In a classroom working the same MELC topic, questions 2–N hit cache, cutting API calls (spec Section 10, quota mitigation). This step builds the cache read/write keyed by a normalized query hash, used by the Phase 4 router before and after generation.
</context>

## Prerequisites

<prerequisites>
- Phase 2 (`response_cache` table + `cache-repository.ts`)
- Phase 3.2 (retriever) complete
</prerequisites>

## AI Implementation Prompt

<instructions>
Build a query-normalization + caching service over the `response_cache` table.

Think step by step:

1. **Query normalization** (`src/features/rag/cache.ts`)
   - `normalizeQuery(text)`: lowercase, trim, collapse whitespace, strip trailing punctuation. Keep it simple and deterministic.
   - `hashQuery(normalized, gradeLevel)`: stable hash (e.g., FNV-1a or a small SHA over the string + grade) → `query_hash`. Grade level is part of the key so the same question at different grades caches separately.

2. **Cache API**
   - `getCachedResponse(query, gradeLevel): Promise<string | null>` — look up by hash; on hit, increment `hit_count` and return `response_text`.
   - `putCachedResponse(query, gradeLevel, responseText): Promise<void>` — upsert by `query_hash` (unique). Store `query_text` for debugging.
   - `getCacheStats(): Promise<{ entries, totalHits }>` for a later "X questions answered offline" stat.

3. **Eviction (light)**
   - Add an optional cap (`RESPONSE_CACHE_MAX_ENTRIES` in constants, e.g., 500). When exceeded, delete the least-recently-created / lowest-hit entries. Keep it simple for MVP.

4. **Integration contract**
   - Document the intended router flow (implemented in Phase 4):
     1. Offline tier → check cache first; if hit, return immediately.
     2. Online tiers → after a successful cloud response, write it to cache.
   - Export the cache API from the rag barrel.
</instructions>

<requirements>
### Functional Requirements
- Same normalized question returns the cached answer.
- `hit_count` increments on each cache hit.
- Different grade levels cache independently.

### Technical Requirements
- Deterministic normalization + stable hash.
- Upsert by unique `query_hash`.
- Optional size cap with simple eviction.

### File Naming Conventions
- `cache.ts` in the rag feature.
</requirements>

<output_files>
1. `suri/src/features/rag/cache.ts` — normalization, hashing, cache API
2. `suri/src/lib/db/repositories/cache-repository.ts` — MODIFIED: upsert, increment-hit, stats, evict
3. `suri/src/constants/index.ts` — MODIFIED: `RESPONSE_CACHE_MAX_ENTRIES`
4. `suri/src/features/rag/index.ts` — MODIFIED barrel
</output_files>

## Directory Structure

```
src/features/rag/
└── cache.ts   ← NEW
src/lib/db/repositories/
└── cache-repository.ts  ← MODIFIED
```

## Verification

<verification>
- [ ] `putCachedResponse` then `getCachedResponse` for the same question returns the stored text
- [ ] Trailing punctuation / casing differences still hit the same cache entry
- [ ] `hit_count` increments on repeat reads
- [ ] Grade 4 vs Grade 6 same question → separate entries
- [ ] Exceeding the cap evicts without error
- [ ] `npm run typecheck` passes
</verification>

## Troubleshooting

| Symptom | Likely Cause | Fix |
|---|---|---|
| Cache misses on near-identical queries | Over-strict normalization | Normalize whitespace/case/punctuation; don't over-engineer |
| Duplicate rows for same query | Not upserting on unique hash | Use `INSERT ... ON CONFLICT(query_hash) DO UPDATE` |
| Hash collisions | Weak hash | Use FNV-1a/SHA over normalized text + grade |

---

**Previous**: [3.2 Vector Store & Retrieval](./02_vector_store_retrieval.md) | **Next**: [Phase 3 Checklist](./99_PHASE_CHECKLIST.md)
