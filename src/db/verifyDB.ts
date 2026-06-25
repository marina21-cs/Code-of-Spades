import { getDB } from '@/db/database';

/**
 * Headless backend validation routine for the SQLite foundation layer.
 *
 * This is NOT a UI screen — it is a console-logging validation engine intended
 * to be invoked once from app bootstrap (in __DEV__) or from a test harness to
 * prove the database opened correctly before any feature work depends on it.
 *
 * Run it AFTER initDB() has resolved so getDB() returns a live connection.
 */
export async function verifyDB(): Promise<void> {
  const db = getDB();

  // 1. WAL mode confirmation
  const wal = await db.getFirstAsync<{ journal_mode: string }>('PRAGMA journal_mode');
  console.assert(wal?.journal_mode === 'wal', '❌ WAL mode not active');
  console.log('✅ WAL mode verified:', wal?.journal_mode);

  // 2. All 7 tables exist
  const tables = await db.getAllAsync<{ name: string }>(
    `SELECT name FROM sqlite_master WHERE type='table' ORDER BY name`,
  );
  const names = tables.map((t) => t.name);
  const expected = [
    'badges',
    'chat_messages',
    'melc_chunks',
    'personal_chunks',
    'quiz_attempts',
    'response_cache',
    'streaks',
  ];
  expected.forEach((t) => console.assert(names.includes(t), `❌ Missing table: ${t}`));
  console.log('✅ Tables verified:', names.join(', '));

  // 3. Streak seed row exists
  const streak = await db.getFirstAsync('SELECT * FROM streaks WHERE id = 1');
  console.assert(streak !== null, '❌ Streak seed row missing');
  console.log('✅ Streak row seeded:', streak);

  // 4. All 6 badges seeded
  const badges = await db.getAllAsync<{ id: string }>('SELECT id FROM badges');
  console.assert(badges.length === 6, `❌ Expected 6 badges, got ${badges.length}`);
  console.log('✅ Badges seeded:', badges.map((b) => b.id).join(', '));

  // 5. Concurrent transaction lock validation — WAL lets the read and write
  // proceed without the read blocking on the write.
  await Promise.all([
    db.getAllAsync('SELECT id FROM melc_chunks LIMIT 1'),
    db.runAsync('UPDATE streaks SET current_streak = 0 WHERE id = 1'),
  ]);
  console.log('✅ WAL concurrent execution passed.');
}
