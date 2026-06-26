/**
 * Offline-first telemetry queue (spec 5.10).
 *
 * Writes answered-question rows (`quiz_attempts`) and anonymized competency
 * events (`competency_events`) to local SQLite. The sync layer (syncManager.ts)
 * later drains the unsynced events to Supabase when Wi-Fi returns. Nothing here
 * needs connectivity — the queue accumulates entirely on-device, so a student
 * never waits on the network.
 */
import { getDB } from '@/db/database';

import type { CompetencyEvent, CompetencyEventRow, QuizAttemptInput } from './types';

/**
 * Persist one answered question into `quiz_attempts`. This closes the long-
 * standing write gap: the table existed in the schema but nothing wrote to it.
 * Returns the new row id.
 */
export async function recordQuizAttempt(a: QuizAttemptInput): Promise<number> {
  const db = getDB();
  const result = await db.runAsync(
    `INSERT INTO quiz_attempts
       (subject, grade_level, competency_code, question, student_answer, is_correct)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      a.subject ?? null,
      a.gradeLevel ?? null,
      a.competencyCode ?? null,
      a.question,
      a.studentAnswer ?? null,
      a.isCorrect ? 1 : 0,
    ],
  );
  return result.lastInsertRowId;
}

/**
 * Enqueue one anonymized competency event for later B2B sync. `payload` is
 * serialized to JSON; `synced_at` defaults to NULL (pending). Returns the row id.
 */
export async function enqueueCompetencyEvent(e: CompetencyEvent): Promise<number> {
  const db = getDB();
  const payload = e.payload != null ? JSON.stringify(e.payload) : null;
  const isCorrect = e.isCorrect == null ? null : e.isCorrect ? 1 : 0;
  const result = await db.runAsync(
    `INSERT INTO competency_events
       (event_type, competency_code, subject, grade_level, is_correct, payload)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      e.eventType,
      e.competencyCode ?? null,
      e.subject ?? null,
      e.gradeLevel ?? null,
      isCorrect,
      payload,
    ],
  );
  return result.lastInsertRowId;
}

/**
 * Oldest-first batch of not-yet-synced events. The sync drain reads this, pushes
 * the rows, then calls markSynced() with their ids.
 */
export async function getUnsyncedEvents(limit = 100): Promise<CompetencyEventRow[]> {
  const db = getDB();
  return db.getAllAsync<CompetencyEventRow>(
    `SELECT id, event_type, competency_code, subject, grade_level, is_correct, payload, created_at, synced_at
       FROM competency_events
      WHERE synced_at IS NULL
      ORDER BY created_at ASC, id ASC
      LIMIT ?`,
    [limit],
  );
}

/** Stamp the given event ids as synced (idempotent; no-op on empty input). */
export async function markSynced(ids: number[]): Promise<void> {
  if (ids.length === 0) {
    return;
  }
  const db = getDB();
  const placeholders = ids.map(() => '?').join(', ');
  await db.runAsync(
    `UPDATE competency_events SET synced_at = datetime('now') WHERE id IN (${placeholders})`,
    ids,
  );
}

/** Count of events still pending sync (diagnostics / future telemetry UI). */
export async function getUnsyncedCount(): Promise<number> {
  const db = getDB();
  const row = await db.getFirstAsync<{ n: number }>(
    'SELECT COUNT(*) AS n FROM competency_events WHERE synced_at IS NULL',
  );
  return row?.n ?? 0;
}
