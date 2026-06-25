/**
 * Headless schema + seed verification using Node's built-in node:sqlite.
 *
 * WHY THIS EXISTS:
 *   expo-sqlite is a native module and can only run on a device/simulator, so
 *   the in-app verifyDB() routine cannot be executed from a plain Node process.
 *   This script imports the SAME schema and seed constants (src/db/schema.ts)
 *   and replays them against a throwaway SQLite file using the standard library
 *   driver. It proves the DDL is valid SQLite, that WAL engages on a file db,
 *   that all 7 tables are created, that seeding produces exactly the expected
 *   rows, and that the seed is idempotent when run twice.
 *
 *   It does NOT exercise the expo-sqlite runtime itself — see the README notes
 *   from the agent for the on-device verification path (verifyDB()).
 *
 * RUN: node scripts/verify-schema.mjs   (requires Node >= 22.5 for node:sqlite)
 */
import { DatabaseSync } from 'node:sqlite';
import { rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { BADGE_SEEDS, CREATE_TABLES_SQL } from '../src/db/schema.ts';

let failures = 0;
function check(condition, message) {
  if (condition) {
    console.log('✅', message);
  } else {
    failures += 1;
    console.error('❌', message);
  }
}

const dbPath = join(tmpdir(), `suri-verify-${Date.now()}.db`);
const db = new DatabaseSync(dbPath);

try {
  // --- mirror initDB() ---------------------------------------------------
  db.exec('PRAGMA journal_mode = WAL;');
  db.exec('PRAGMA foreign_keys = ON;');
  db.exec(CREATE_TABLES_SQL);

  function seed() {
    db.exec(
      `INSERT OR IGNORE INTO streaks (id, current_streak, longest_streak, total_study_days)
       VALUES (1, 0, 0, 0);`,
    );
    const stmt = db.prepare(
      `INSERT OR IGNORE INTO badges (id, name, description, earned_at)
       VALUES (?, ?, ?, NULL);`,
    );
    for (const badge of BADGE_SEEDS) {
      stmt.run(badge.id, badge.name, badge.description);
    }
  }

  seed();
  // Run a second time to prove idempotency (INSERT OR IGNORE).
  seed();

  // --- assertions (mirror verifyDB) -------------------------------------
  const wal = db.prepare('PRAGMA journal_mode').get();
  check(wal.journal_mode === 'wal', `WAL mode active (journal_mode=${wal.journal_mode})`);

  const names = db
    .prepare(`SELECT name FROM sqlite_master WHERE type='table' ORDER BY name`)
    .all()
    .map((r) => r.name);
  const expected = [
    'badges',
    'chat_messages',
    'melc_chunks',
    'personal_chunks',
    'quiz_attempts',
    'response_cache',
    'streaks',
  ];
  check(
    expected.every((t) => names.includes(t)),
    `All 7 tables present (${names.join(', ')})`,
  );

  const streakCount = db.prepare('SELECT COUNT(*) AS c FROM streaks').get().c;
  check(streakCount === 1, `Exactly one streak row after double-seed (got ${streakCount})`);

  const streak = db.prepare('SELECT * FROM streaks WHERE id = 1').get();
  check(!!streak, 'Streak seed row (id = 1) exists');

  const badgeCount = db.prepare('SELECT COUNT(*) AS c FROM badges').get().c;
  check(badgeCount === 6, `Exactly 6 badges after double-seed (got ${badgeCount})`);

  const unearned = db.prepare('SELECT COUNT(*) AS c FROM badges WHERE earned_at IS NULL').get().c;
  check(unearned === 6, `All seeded badges start unearned (earned_at NULL: ${unearned})`);

  // Concurrent-style read + write (synchronous here, but proves both paths run).
  db.prepare('SELECT id FROM melc_chunks LIMIT 1').all();
  db.prepare('UPDATE streaks SET current_streak = 0 WHERE id = 1').run();
  check(true, 'Read + write against seeded schema executed without error');

  // CHECK-constraint enforcement sanity (bad role should throw).
  let constraintEnforced = false;
  try {
    db.prepare(`INSERT INTO chat_messages (session_id, role, content) VALUES ('s', 'bogus', 'x')`).run();
  } catch {
    constraintEnforced = true;
  }
  check(constraintEnforced, 'chat_messages.role CHECK constraint rejects invalid values');
} finally {
  db.close();
  for (const suffix of ['', '-wal', '-shm']) {
    rmSync(dbPath + suffix, { force: true });
  }
}

if (failures > 0) {
  console.error(`\n${failures} check(s) failed.`);
  process.exit(1);
}
console.log('\nAll schema + seed checks passed.');
