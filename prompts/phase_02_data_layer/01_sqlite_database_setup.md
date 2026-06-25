# 2.1 SQLite Database & WAL Setup

## Context

<context>
Suri stores everything locally so it works with zero connectivity (spec Section 5.1): MELC corpus, embeddings, sessions, streaks, and cached cloud responses. This step opens the `expo-sqlite` database once, enables WAL mode (`PRAGMA journal_mode = WAL`) so RAG reads can run concurrently with background writes without blocking on budget devices (spec Section 10), and exposes a single typed connection module the rest of the app uses.
</context>

## Prerequisites

<prerequisites>
- Phase 0–1 complete
- `expo-sqlite` installed (Phase 0); `src/lib/db/index.ts` barrel exists
- `suri.db` filename constant in `src/constants`
</prerequisites>

## AI Implementation Prompt

<instructions>
Create a single database connection module with WAL enabled and safe pragmas.

Think step by step:

1. **Connection module** (`src/lib/db/connection.ts`)
   - Open the database (async API: `SQLite.openDatabaseAsync(DB_FILENAME)`).
   - Use a module-level singleton promise so the DB is opened exactly once and reused (never open per query).
   - On open, run pragmas in order: `PRAGMA journal_mode = WAL;`, `PRAGMA foreign_keys = ON;`, `PRAGMA busy_timeout = 5000;`.
   - Export `getDb(): Promise<SQLiteDatabase>`.

2. **Query helpers** (`src/lib/db/query.ts`)
   - Thin typed wrappers over the Expo SQLite async API: `runAsync` (writes), `getFirstAsync<T>`, `getAllAsync<T>`. Always use parameterized statements (`?` placeholders) — never string interpolation (security + injection safety).
   - Add a `withTransaction(fn)` helper using `db.withTransactionAsync`.

3. **Health check**
   - Export `getJournalMode(): Promise<string>` that returns the current `journal_mode` so the checklist can assert `wal`.

4. **Barrel + init hook**
   - Re-export from `src/lib/db/index.ts`.
   - Provide an `initDatabase()` function that opens the DB and runs pragmas; call it early in app startup (in `app/_layout.tsx` inside an effect, before rendering data-dependent screens). Migrations (2.2) will be invoked from here.
</instructions>

<requirements>
### Functional Requirements
- DB opens once and is reused across the app.
- WAL mode active after init.

### Technical Requirements
- All SQL parameterized (`?`), never interpolated.
- Async Expo SQLite API only (no legacy callback API).
- Single connection singleton.

### File Naming Conventions
- DB modules kebab-case under `src/lib/db`.
</requirements>

<output_files>
1. `suri/src/lib/db/connection.ts` — singleton open + pragmas
2. `suri/src/lib/db/query.ts` — parameterized helpers + transaction
3. `suri/src/lib/db/index.ts` — MODIFIED barrel + `initDatabase()`
4. `suri/app/_layout.tsx` — MODIFIED: call `initDatabase()` on startup
</output_files>

## Directory Structure

```
src/lib/db/
├── connection.ts   ← NEW
├── query.ts        ← NEW
└── index.ts        ← MODIFIED (exports + initDatabase)
```

## Verification

<verification>
- [ ] `getJournalMode()` returns `wal`
- [ ] `getDb()` returns the same instance on repeated calls
- [ ] A test insert + select round-trips via the parameterized helpers
- [ ] No string-interpolated SQL anywhere (grep for template literals in db files)
- [ ] `npm run typecheck` passes
</verification>

## Troubleshooting

| Symptom | Likely Cause | Fix |
|---|---|---|
| `journal_mode` returns `delete` | WAL pragma not applied / unsupported context | Run the pragma right after open, before queries |
| DB locked errors | Multiple opens / no busy_timeout | Use the singleton; set `busy_timeout` |
| Foreign keys ignored | `foreign_keys` pragma off | Set `PRAGMA foreign_keys = ON` on every open |

---

**Previous**: [Phase 2 Overview](./00_PHASE_OVERVIEW.md) | **Next**: [2.2 Schema & Migrations](./02_schema_and_migrations.md)
