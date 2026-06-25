# Phase 2: Data Layer

> **Objective**: Stand up the offline-first persistence layer — `expo-sqlite` in WAL mode with a versioned schema, the Learning Profile in `expo-secure-store`, and real-time signal-tier detection via `netinfo`.
> **Duration**: ~2–3 hours of agent execution
> **Dependencies**: Phase 0, Phase 1

---

## Phase Goals

1. ✅ SQLite database opens in WAL mode with a migration runner
2. ✅ Tables for MELC corpus, embeddings, sessions, messages, streaks, cached responses
3. ✅ Learning Profile + accessibility settings persisted in secure-store and hydrated on boot
4. ✅ `SignalTier` (strong / weak / offline) derived from netinfo and observable app-wide

## Prompt Files in This Phase

| # | Prompt | Purpose |
|---|--------|---------|
| 2.1 | [01_sqlite_database_setup.md](01_sqlite_database_setup.md) | Open DB, WAL pragma, connection module |
| 2.2 | [02_schema_and_migrations.md](02_schema_and_migrations.md) | Versioned schema + migration runner |
| 2.3 | [03_learning_profile_store.md](03_learning_profile_store.md) | secure-store persistence + Zustand hydration |
| 2.4 | [04_connectivity_detection.md](04_connectivity_detection.md) | netinfo → SignalTier store |

## Key Decisions Made

| Decision | Choice | Rationale |
|----------|--------|-----------|
| DB | `expo-sqlite` | Persistent OS-controlled storage; spec Section 2 vs IndexedDB eviction |
| Journal | `PRAGMA journal_mode = WAL` | Concurrent reads during writes (spec Section 10) |
| Profile storage | `expo-secure-store` | Spec Section 8; small, sensitive-ish, per-device |
| Vector store | Same SQLite DB, cosine in app code | Spec Section 8 — no separate vector DB |
| Tier model | `strong / weak / offline` | Maps to netinfo type + `effectiveType` (spec 5.2) |

## Skills to Load

- `database-design` — schema design, indexing strategy, SQLite specifics
- `clean-code` — keep the data layer thin and single-responsibility
- `react-patterns` — store/subscription patterns for the tier + profile stores
- `cc-skill-coding-standards` — typed query helpers, no raw string-concatenated SQL

## Exit Criteria

Before moving to Phase 3, verify:

- [ ] DB opens and `PRAGMA journal_mode` returns `wal`
- [ ] Migration runner creates all tables and records schema version
- [ ] Re-running migrations is idempotent (no errors on second boot)
- [ ] Learning Profile saved to secure-store survives an app restart
- [ ] Accessibility store hydrates from the persisted profile on boot
- [ ] Toggling Airplane Mode flips `SignalTier` to `offline`; restoring Wi-Fi returns `strong`
- [ ] `npm run typecheck` and `npm run lint` pass

---

**Next Phase**: [Phase 3: Local RAG Store](../phase_03_rag/00_PHASE_OVERVIEW.md)
