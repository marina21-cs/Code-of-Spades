/**
 * Offline-first telemetry queue (spec 5.10).
 *
 * Anonymized competency events accumulate entirely on-device in
 * `competency_events`; syncManager.ts later drains the unsynced rows to Supabase
 * when Wi-Fi returns. Nothing here touches the network, so a student never waits.
 *
 * CONNECTION: we reuse the shared expo-sqlite handle from database.ts via
 * getDB() rather than opening a second `SQLite.openDatabaseAsync`. That handle
 * is the one WAL + the version-guarded migrations were applied to, so a second
 * connection would bypass both. We still import expo-sqlite for its types.
 */
import type { SQLiteDatabase } from 'expo-sqlite';

import { getDB } from '@/db/database';

import type { CompetencyEventRow, CompetencyEventType, QuizAttemptInput } from './types';

/** Input for enqueuing one anonymized competency event. Carries no PII. */
export interface CompetencyEventInput {
  event_type: CompetencyEventType;
  competency_code: string;
  is_correct: boolean;
  /** Pre-serialized JSON (the caller runs JSON.stringify); stored verbatim. */
  payload: string;
}

/**
 * Enqueue one anonymized competency event. Stamps `created_at` with the current
 * timestamp and leaves `synced_at` NULL (pending). Returns the new row id.
 */
export async function enqueueCompetencyEvent(event: CompetencyEventInput): Promise<number> {
  const db: SQLiteDatabase = getDB();
  const result = await db.runAsync(
    `INSERT INTO competency_events (event_type, competency_code, is_correct, payload, created_at, synced_at)
     VALUES (?, ?, ?, ?, datetime('now'), NULL)`,
    [event.event_type, event.competency_code, event.is_correct ? 1 : 0, event.payload],
  );
  return result.lastInsertRowId;
}

/**
 * Oldest-first batch of not-yet-synced events. The sync drain reads this, pushes
 * the rows, then calls markSynced() with their ids.
 */
export async function getUnsyncedEvents(limit = 100): Promise<CompetencyEventRow[]> {
  const db: SQLiteDatabase = getDB();
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
  const db: SQLiteDatabase = getDB();
  const placeholders = ids.map(() => '?').join(', ');
  await db.runAsync(
    `UPDATE competency_events SET synced_at = datetime('now') WHERE id IN (${placeholders})`,
    ids,
  );
}

/** Count of events still pending sync (diagnostics / future telemetry UI). */
export async function getUnsyncedCount(): Promise<number> {
  const db: SQLiteDatabase = getDB();
  const row = await db.getFirstAsync<{ n: number }>(
    'SELECT COUNT(*) AS n FROM competency_events WHERE synced_at IS NULL',
  );
  return row?.n ?? 0;
}

/**
 * Persist one answered question into `quiz_attempts`. Retained from the prior
 * scaffolding so the spaced-repetition log stays writable; completeReview no
 * longer calls it (per the current spec), but it is available if you want to
 * re-add a per-attempt write alongside the telemetry event. Returns the row id.
 */
export async function recordQuizAttempt(a: QuizAttemptInput): Promise<number> {
  const db: SQLiteDatabase = getDB();
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
