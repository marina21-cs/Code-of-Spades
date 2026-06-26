import * as SQLite from 'expo-sqlite';

import {
  BADGE_SEEDS,
  CORE_FUNDAMENTALS_SEEDS,
  CREATE_TABLES_SQL,
  RESOURCE_TYPES,
  SCHEMA_VERSION,
} from './schema';

const DB_NAME = 'suri.db';

/**
 * Single shared connection. expo-sqlite connections are cheap to keep open for
 * the lifetime of the app, and a single instance keeps WAL behaviour and the
 * statement cache predictable.
 */
let dbInstance: SQLite.SQLiteDatabase | null = null;

/**
 * Guards against concurrent initialization. If two callers hit initDB() before
 * the first open resolves, they share the same in-flight promise instead of
 * opening the database twice.
 */
let initPromise: Promise<SQLite.SQLiteDatabase> | null = null;

/**
 * Open (or reuse) the persistent suri.db database, enable WAL, create all
 * tables, and seed baseline data. Safe to call multiple times — subsequent
 * calls return the already-initialized connection.
 *
 * WAL (Write-Ahead Logging) is the key offline-first lever: it lets RAG reads
 * run concurrently with background sync/cache writes without blocking the UI
 * thread on budget devices (see spec section 10).
 */
export async function initDB(): Promise<SQLite.SQLiteDatabase> {
  if (dbInstance) {
    return dbInstance;
  }
  if (initPromise) {
    return initPromise;
  }

  initPromise = (async () => {
    const db = await SQLite.openDatabaseAsync(DB_NAME);

    // Enable WAL so reads (RAG retrieval) don't block on background writes.
    await db.execAsync('PRAGMA journal_mode = WAL;');
    // Enforce declared foreign keys (off by default in SQLite).
    await db.execAsync('PRAGMA foreign_keys = ON;');

    // Idempotent schema creation + version-guarded migrations.
    await runMigrations(db);

    // Idempotent baseline data.
    await seedInitialData(db);

    dbInstance = db;
    return db;
  })();

  try {
    return await initPromise;
  } catch (err) {
    // Reset so a later call can retry a failed initialization.
    initPromise = null;
    throw err;
  }
}

/**
 * Synchronous accessor for the already-initialized connection.
 *
 * Throws if called before initDB() has resolved. Call initDB() once during app
 * bootstrap (app/_layout.tsx) and use getDB() everywhere else.
 */
export function getDB(): SQLite.SQLiteDatabase {
  if (!dbInstance) {
    throw new Error(
      'Suri database not initialized. Await initDB() during app bootstrap before calling getDB().',
    );
  }
  return dbInstance;
}

/**
 * Run idempotent schema creation, then version-guarded migrations.
 *
 * The base table DDL (CREATE_TABLES_SQL) is safe to run on every boot because
 * every statement uses IF NOT EXISTS. `PRAGMA user_version` records the schema
 * version on disk so future destructive/altering migrations can run exactly
 * once, in order. A fresh database reports user_version 0 and is brought up to
 * SCHEMA_VERSION here.
 */
export async function runMigrations(db: SQLite.SQLiteDatabase): Promise<void> {
  // 1. Ensure all tables/indexes exist (idempotent).
  await db.execAsync(CREATE_TABLES_SQL);

  // 2. Read the on-disk schema version (0 for a brand-new or legacy database).
  const row = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  const current = row?.user_version ?? 0;

  if (current >= SCHEMA_VERSION) {
    return;
  }

  // 3. Future incremental migrations slot in here, each gated on `current`, e.g.:
  //      if (current < 5) { await db.execAsync('ALTER TABLE ...'); }
  //    Everything up to SCHEMA_VERSION 4 is additive (new tables via IF NOT
  //    EXISTS) and covered by the idempotent DDL above, so no extra steps are
  //    needed yet. The misconception_taxonomy / misconception_records tables
  //    (v4) — like kwento_cache / kwento_attempts (v3) before them — are created
  //    by the DDL on the next boot for already-initialized databases.

  // 4. Stamp the database at the current schema version. user_version only
  //    accepts a literal, so we interpolate the trusted in-code constant.
  await db.execAsync(`PRAGMA user_version = ${SCHEMA_VERSION};`);
}

/**
 * Seed baseline rows. Uses INSERT OR IGNORE throughout so re-running on an
 * existing database never duplicates or overwrites data.
 *
 *  - Guarantees the single streaks row (id = 1).
 *  - Seeds the 6 core badges with earned_at = NULL (unlocked later).
 *  - Guarantees the single player_state row (id = 1) for the game economy.
 *  - Seeds every resource type at quantity 0 so the inventory is complete.
 *  - Seeds the 5 baseline Core Fundamentals facts (text-only fallback).
 */
export async function seedInitialData(db: SQLite.SQLiteDatabase): Promise<void> {
  // Baseline streak row. The streaks table is a single-row table keyed on id=1.
  await db.runAsync(
    `INSERT OR IGNORE INTO streaks (id, current_streak, longest_streak, total_study_days)
     VALUES (1, 0, 0, 0);`,
  );

  // Single-row player progression state for the resource-management loop.
  await db.runAsync(
    `INSERT OR IGNORE INTO player_state (id, level, xp, world_stage)
     VALUES (1, 1, 0, 0);`,
  );

  // Seed badges via a prepared statement reused across all 6 inserts.
  const badgeStatement = await db.prepareAsync(
    `INSERT OR IGNORE INTO badges (id, name, description, earned_at)
     VALUES ($id, $name, $description, NULL);`,
  );
  try {
    for (const badge of BADGE_SEEDS) {
      await badgeStatement.executeAsync({
        $id: badge.id,
        $name: badge.name,
        $description: badge.description,
      });
    }
  } finally {
    await badgeStatement.finalizeAsync();
  }

  // Zero out the resource economy: one row per resource type.
  const resourceStatement = await db.prepareAsync(
    `INSERT OR IGNORE INTO resources (resource_type, quantity) VALUES ($type, 0);`,
  );
  try {
    for (const type of RESOURCE_TYPES) {
      await resourceStatement.executeAsync({ $type: type });
    }
  } finally {
    await resourceStatement.finalizeAsync();
  }

  // Seed the text-only Core Fundamentals fallback facts (idempotent on prompt_key).
  const fundamentalStatement = await db.prepareAsync(
    `INSERT OR IGNORE INTO core_fundamentals (category, prompt_key, answer)
     VALUES ($category, $promptKey, $answer);`,
  );
  try {
    for (const fact of CORE_FUNDAMENTALS_SEEDS) {
      await fundamentalStatement.executeAsync({
        $category: fact.category,
        $promptKey: fact.promptKey,
        $answer: fact.answer,
      });
    }
  } finally {
    await fundamentalStatement.finalizeAsync();
  }
}

/**
 * Close and forget the shared connection. Primarily useful for tests and for
 * forcing a clean re-init; the app itself keeps the connection open.
 */
export async function closeDB(): Promise<void> {
  if (dbInstance) {
    await dbInstance.closeAsync();
    dbInstance = null;
    initPromise = null;
  }
}
