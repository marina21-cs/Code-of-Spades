import * as SQLite from 'expo-sqlite';

import { BADGE_SEEDS, CREATE_TABLES_SQL } from './schema';

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

    // Idempotent schema creation (every statement uses IF NOT EXISTS).
    await db.execAsync(CREATE_TABLES_SQL);

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
 * Seed baseline rows. Uses INSERT OR IGNORE throughout so re-running on an
 * existing database never duplicates or overwrites data.
 *
 *  - Guarantees the single streaks row (id = 1).
 *  - Seeds the 6 core badges with earned_at = NULL (unlocked later).
 */
export async function seedInitialData(db: SQLite.SQLiteDatabase): Promise<void> {
  // Baseline streak row. The streaks table is a single-row table keyed on id=1.
  await db.runAsync(
    `INSERT OR IGNORE INTO streaks (id, current_streak, longest_streak, total_study_days)
     VALUES (1, 0, 0, 0);`,
  );

  // Seed badges via a prepared statement reused across all 6 inserts.
  const statement = await db.prepareAsync(
    `INSERT OR IGNORE INTO badges (id, name, description, earned_at)
     VALUES ($id, $name, $description, NULL);`,
  );
  try {
    for (const badge of BADGE_SEEDS) {
      await statement.executeAsync({
        $id: badge.id,
        $name: badge.name,
        $description: badge.description,
      });
    }
  } finally {
    await statement.finalizeAsync();
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
