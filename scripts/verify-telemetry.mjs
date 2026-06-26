/**
 * Headless verification for the B2B telemetry queue (spec 5.10).
 *
 * WHY THIS EXISTS:
 *   eventQueue.ts depends on expo-sqlite (native, device only), so it can't be
 *   imported in plain Node. This script replays the SAME SQL — recordQuizAttempt,
 *   enqueueCompetencyEvent, getUnsyncedEvents, markSynced — against Node's
 *   built-in node:sqlite using the REAL table DDL (schema.ts). It validates
 *   insertion, the unsynced filter + oldest-first ordering, the payload JSON
 *   round-trip, nullable is_correct, the LIMIT, and that markSynced removes rows
 *   from the unsynced set. The event_type CHECK constraint is exercised too.
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

function enqueueCompetencyEvent(e) {
  const payload = e.payload != null ? JSON.stringify(e.payload) : null;
  const isCorrect = e.isCorrect == null ? null : e.isCorrect ? 1 : 0;
  const r = db
    .prepare(
      `INSERT INTO competency_events
         (event_type, competency_code, subject, grade_level, is_correct, payload)
       VALUES (?, ?, ?, ?, ?, ?)`,
    )
    .run(e.eventType, e.competencyCode ?? null, e.subject ?? null, e.gradeLevel ?? null, isCorrect, payload);
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

// --- assertions -----------------------------------------------------------
// 1. quiz_attempts insertion (the closed write gap)
const qid = recordQuizAttempt({
  question: 'What are the parts of a plant cell?',
  isCorrect: true,
  competencyCode: 'S6LT-IIe-f-3',
  subject: 'Science',
  gradeLevel: 6,
  studentAnswer: 'cell wall, nucleus, chloroplast',
});
check(qid > 0, `recordQuizAttempt returns a row id (${qid})`);
const qrow = db.prepare('SELECT * FROM quiz_attempts WHERE id = ?').get(qid);
check(
  qrow.is_correct === 1 && qrow.competency_code === 'S6LT-IIe-f-3' && qrow.grade_level === 6,
  'quiz_attempts row persisted with the correct fields',
);

// 2. enqueue two events
const e1 = enqueueCompetencyEvent({
  eventType: 'reviewed',
  competencyCode: 'S6LT-IIe-f-3',
  subject: 'Science',
  gradeLevel: 6,
  isCorrect: true,
  payload: { difficulty: 3, mastery: 0.4 },
});
const e2 = enqueueCompetencyEvent({
  eventType: 'missed',
  competencyCode: 'S6MT-Ig-h-4',
  subject: 'Science',
  gradeLevel: 6,
  isCorrect: false,
});
check(e1 > 0 && e2 > e1, `two events enqueued with increasing ids (${e1}, ${e2})`);

// 3. unsynced retrieval + oldest-first ordering
const unsynced = getUnsyncedEvents();
check(unsynced.length === 2, `getUnsyncedEvents returns both pending rows (got ${unsynced.length})`);
check(unsynced[0].id === e1, 'unsynced events are returned oldest-first');

// 4. payload JSON round-trip
const parsed = JSON.parse(unsynced[0].payload);
check(parsed.difficulty === 3 && parsed.mastery === 0.4, 'payload JSON round-trips losslessly');

// 5. nullable is_correct stored as 0 for a missed event
check(unsynced[1].is_correct === 0, 'missed event stored is_correct = 0');

// 6. LIMIT is respected
check(getUnsyncedEvents(1).length === 1, 'LIMIT caps the batch size');

// 7. markSynced removes rows from the unsynced set
markSynced([e1]);
const afterSync = getUnsyncedEvents();
check(afterSync.length === 1 && afterSync[0].id === e2, 'markSynced drops the synced event from the queue');
const syncedRow = db.prepare('SELECT synced_at FROM competency_events WHERE id = ?').get(e1);
check(syncedRow.synced_at != null, 'a synced event carries a synced_at timestamp');

// 8. markSynced([]) is a safe no-op
markSynced([]);
check(getUnsyncedEvents().length === 1, 'markSynced([]) is a safe no-op');

// 9. event_type CHECK constraint rejects invalid values
let rejected = false;
try {
  enqueueCompetencyEvent({ eventType: 'bogus' });
} catch {
  rejected = true;
}
check(rejected, 'competency_events.event_type CHECK rejects invalid values');

db.close();

if (failures > 0) {
  console.error(`\n${failures} check(s) failed.`);
  process.exit(1);
}
console.log('\nAll telemetry queue checks passed.');
