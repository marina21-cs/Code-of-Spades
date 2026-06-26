/**
 * Headless verification for the B2B telemetry queue (spec 5.10).
 *
 * WHY THIS EXISTS:
 *   eventQueue.ts depends on expo-sqlite (native, device only), so it can't be
 *   imported in plain Node. This script replays the SAME SQL — enqueueCompetencyEvent,
 *   getUnsyncedEvents, markSynced, and recordQuizAttempt — against Node's built-in
 *   node:sqlite using the REAL table DDL (schema.ts). It validates insertion, the
 *   unsynced filter + oldest-first ordering, the payload round-trip, is_correct
 *   coercion, the LIMIT, and that markSynced removes rows from the unsynced set.
 *   The event_type CHECK constraint is exercised too.
 *
 *   It does NOT exercise the expo-sqlite binding itself — that runs on-device.
 *
 * RUN: node --import ./scripts/register-ts.mjs scripts/verify-telemetry.mjs
 */
import { DatabaseSync } from 'node:sqlite';

import { CREATE_TABLES_SQL } from '../src/db/schema.ts';

let failures = 0;
function check(condition, message) {
  if (condition) {
    console.log('✅', message);
  } else {
    failures += 1;
    console.error('❌', message);
  }
}

const db = new DatabaseSync(':memory:');
db.exec(CREATE_TABLES_SQL);

// --- reproduce eventQueue.ts against node:sqlite --------------------------
function enqueueCompetencyEvent(event) {
  const r = db
    .prepare(
      `INSERT INTO competency_events (event_type, competency_code, is_correct, payload, created_at, synced_at)
       VALUES (?, ?, ?, ?, datetime('now'), NULL)`,
    )
    .run(event.event_type, event.competency_code, event.is_correct ? 1 : 0, event.payload);
  return Number(r.lastInsertRowid);
}

function getUnsyncedEvents(limit = 100) {
  return db
    .prepare(
      `SELECT id, event_type, competency_code, subject, grade_level, is_correct, payload, created_at, synced_at
         FROM competency_events
        WHERE synced_at IS NULL
        ORDER BY created_at ASC, id ASC
        LIMIT ?`,
    )
    .all(limit);
}

function markSynced(ids) {
  if (ids.length === 0) return;
  const placeholders = ids.map(() => '?').join(', ');
  db.prepare(`UPDATE competency_events SET synced_at = datetime('now') WHERE id IN (${placeholders})`).run(...ids);
}

function recordQuizAttempt(a) {
  const r = db
    .prepare(
      `INSERT INTO quiz_attempts
         (subject, grade_level, competency_code, question, student_answer, is_correct)
       VALUES (?, ?, ?, ?, ?, ?)`,
    )
    .run(
      a.subject ?? null,
      a.gradeLevel ?? null,
      a.competencyCode ?? null,
      a.question,
      a.studentAnswer ?? null,
      a.isCorrect ? 1 : 0,
    );
  return Number(r.lastInsertRowid);
}

// --- assertions -----------------------------------------------------------
// 1. enqueue two events using the new { event_type, competency_code, is_correct, payload } shape
const e1 = enqueueCompetencyEvent({
  event_type: 'reviewed',
  competency_code: 'S6LT-IIe-f-3',
  is_correct: true,
  payload: JSON.stringify({ difficulty: 3, mastery: 0.4 }),
});
const e2 = enqueueCompetencyEvent({
  event_type: 'missed',
  competency_code: 'S6MT-Ig-h-4',
  is_correct: false,
  payload: JSON.stringify({ difficulty: 2 }),
});
check(e1 > 0 && e2 > e1, `two events enqueued with increasing ids (${e1}, ${e2})`);

// 2. rows persist with a created_at timestamp and a NULL synced_at
const row1 = db.prepare('SELECT * FROM competency_events WHERE id = ?').get(e1);
check(row1.created_at != null, 'enqueued event is stamped with created_at');
check(row1.synced_at === null, 'enqueued event starts with a NULL synced_at (pending)');

// 3. unsynced retrieval + oldest-first ordering
const unsynced = getUnsyncedEvents();
check(unsynced.length === 2, `getUnsyncedEvents returns both pending rows (got ${unsynced.length})`);
check(unsynced[0].id === e1, 'unsynced events are returned oldest-first');

// 4. payload JSON round-trip (payload is stored verbatim as a string)
const parsed = JSON.parse(unsynced[0].payload);
check(parsed.difficulty === 3 && parsed.mastery === 0.4, 'payload JSON round-trips losslessly');

// 5. boolean is_correct is coerced to 0/1
check(unsynced[0].is_correct === 1 && unsynced[1].is_correct === 0, 'is_correct stored as 1 (correct) / 0 (missed)');

// 6. LIMIT is respected
check(getUnsyncedEvents(1).length === 1, 'LIMIT caps the batch size');

// 7. markSynced removes rows from the unsynced set
markSynced([e1]);
const afterSync = getUnsyncedEvents();
check(afterSync.length === 1 && afterSync[0].id === e2, 'markSynced drops the synced event from the queue');
check(db.prepare('SELECT synced_at FROM competency_events WHERE id = ?').get(e1).synced_at != null, 'a synced event carries a synced_at timestamp');

// 8. markSynced([]) is a safe no-op
markSynced([]);
check(getUnsyncedEvents().length === 1, 'markSynced([]) is a safe no-op');

// 9. event_type CHECK constraint rejects invalid values
let rejected = false;
try {
  enqueueCompetencyEvent({ event_type: 'bogus', competency_code: 'X', is_correct: true, payload: '{}' });
} catch {
  rejected = true;
}
check(rejected, 'competency_events.event_type CHECK rejects invalid values');

// 10. recordQuizAttempt still writes the spaced-repetition log
const qid = recordQuizAttempt({
  question: 'What are the parts of a plant cell?',
  isCorrect: true,
  competencyCode: 'S6LT-IIe-f-3',
  subject: 'Science',
  gradeLevel: 6,
  studentAnswer: 'cell wall, nucleus, chloroplast',
});
const qrow = db.prepare('SELECT * FROM quiz_attempts WHERE id = ?').get(qid);
check(qid > 0 && qrow.is_correct === 1 && qrow.competency_code === 'S6LT-IIe-f-3', 'recordQuizAttempt persists an answered question');

db.close();

if (failures > 0) {
  console.error(`\n${failures} check(s) failed.`);
  process.exit(1);
}
console.log('\nAll telemetry queue checks passed.');
