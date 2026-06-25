# 2.2 Schema & Migrations

## Context

<context>
This step defines the full local schema and a forward-only migration runner. The schema backs the RAG store (MELC corpus + embeddings + personal content), chat history, streaks/gamification, and the response cache that makes frequently asked topics progressively offline (spec Sections 5.1, 5.3, 5.9). A versioned migration runner using `PRAGMA user_version` keeps upgrades safe across app updates and background sync.
</context>

## Prerequisites

<prerequisites>
- Step 2.1 complete (connection + query helpers)
</prerequisites>

## AI Implementation Prompt

<instructions>
Define the schema and a `user_version`-based migration runner.

Think step by step:

1. **Migration runner** (`src/lib/db/migrations.ts`)
   - Read `PRAGMA user_version`. Maintain an ordered array of migrations `{ version, up(db) }`.
   - Apply each migration whose version > current, inside a transaction, then set `PRAGMA user_version` to the latest. Idempotent on re-run.
   - Export `runMigrations()`; call it from `initDatabase()` (2.1) after pragmas.

2. **Schema (migration v1)** — create these tables with appropriate types, PKs, FKs, and indexes:
   - `melc_competencies` — `id` (PK), `subject`, `grade_level` (INT), `competency_code`, `content` (TEXT), `chunk_index` (INT). Index on (`subject`, `grade_level`).
   - `melc_embeddings` — `id` (PK), `competency_id` (FK → melc_competencies), `vector` (BLOB or JSON TEXT of floats), `dim` (INT). Index on `competency_id`.
   - `personal_content` — `id` (PK), `source` ('note' | 'ocr'), `title`, `content` (TEXT), `created_at`. (OCR is roadmap; schema is ready.)
   - `personal_embeddings` — `id` (PK), `personal_content_id` (FK), `vector` (BLOB/JSON), `dim`.
   - `sessions` — `id` (PK), `started_at`, `subject`, `grade_level`.
   - `messages` — `id` (PK), `session_id` (FK), `role` ('user' | 'assistant'), `content` (TEXT), `tier` (TEXT: strong/weak/offline), `provider` (TEXT nullable), `created_at`, `visual_spec` (TEXT JSON nullable). Index on `session_id`.
   - `response_cache` — `id` (PK), `query_hash` (TEXT UNIQUE), `query_text`, `response_text`, `grade_level`, `created_at`, `hit_count` (INT default 0). Unique index on `query_hash`.
   - `streaks` — `id` (PK), `current_streak` (INT), `longest_streak` (INT), `last_study_date` (TEXT), `evolution_stage` (INT). Single-row table.
   - `badges` — `id` (PK), `badge_key` (TEXT UNIQUE), `earned_at`.
   - `study_log` — `id` (PK), `study_date` (TEXT), `questions_answered` (INT). Index on `study_date`.

3. **Typed row models** (`src/lib/db/models.ts`)
   - Export TypeScript interfaces mirroring each table row. These types are the contract for repositories in later phases.

4. **Repositories scaffold** (`src/lib/db/repositories/`)
   - Create thin repository modules with typed CRUD for the tables that later phases need first: `melc-repository.ts`, `message-repository.ts`, `cache-repository.ts`, `streak-repository.ts`. Implement only the methods needed now (insert/select); later phases extend them. Use the parameterized query helpers.
</instructions>

<requirements>
### Functional Requirements
- First boot creates all tables; subsequent boots are no-ops.
- Vectors stored compactly (BLOB preferred; JSON acceptable for MVP) with a `dim` column.

### Technical Requirements
- Forward-only migrations keyed by `user_version`.
- All FKs enforced (`foreign_keys = ON` from 2.1).
- Typed row models for every table.
- Repositories use parameterized queries only.

### File Naming Conventions
- Repositories: `<entity>-repository.ts`.
</requirements>

<output_files>
1. `suri/src/lib/db/migrations.ts` — runner + v1 schema
2. `suri/src/lib/db/models.ts` — row interfaces
3. `suri/src/lib/db/repositories/melc-repository.ts`
4. `suri/src/lib/db/repositories/message-repository.ts`
5. `suri/src/lib/db/repositories/cache-repository.ts`
6. `suri/src/lib/db/repositories/streak-repository.ts`
7. `suri/src/lib/db/index.ts` — MODIFIED: export repositories + `runMigrations`
8. `suri/src/lib/db/index.ts` init flow — MODIFIED: `initDatabase()` calls `runMigrations()`
</output_files>

## Directory Structure

```
src/lib/db/
├── migrations.ts   ← NEW
├── models.ts       ← NEW
├── repositories/
│   ├── melc-repository.ts      ← NEW
│   ├── message-repository.ts   ← NEW
│   ├── cache-repository.ts     ← NEW
│   └── streak-repository.ts    ← NEW
└── index.ts        ← MODIFIED
```

## Verification

<verification>
- [ ] First boot creates all tables; `PRAGMA user_version` = 1
- [ ] Second boot applies no migrations and throws no errors
- [ ] Insert + read round-trips through each scaffolded repository
- [ ] A row in `melc_embeddings` stores a vector and its `dim`
- [ ] FK violation (e.g., orphan message) is rejected
- [ ] `npm run typecheck` passes
</verification>

## Troubleshooting

| Symptom | Likely Cause | Fix |
|---|---|---|
| Migrations re-run every boot | `user_version` not set after apply | Set `PRAGMA user_version = N` inside the migration transaction |
| FK errors on insert order | Inserting child before parent | Insert parents first; wrap related writes in a transaction |
| Vector blob unreadable | Encoding mismatch | Standardize: Float32 → bytes, or JSON.stringify; decode symmetrically |

---

**Previous**: [2.1 SQLite Setup](./01_sqlite_database_setup.md) | **Next**: [2.3 Learning Profile Store](./03_learning_profile_store.md)
