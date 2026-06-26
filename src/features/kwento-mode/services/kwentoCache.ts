/**
 * SQLite persistence for Kwento Mode (spec 5.8): generated stories are cached so
 * they can be reopened offline and for session continuity, and every answer
 * attempt is logged for adaptive difficulty + telemetry.
 *
 * Mirrors the streakService pattern: this layer only reads/writes SQLite via the
 * shared getDB() connection; all decision logic lives in the pure modules.
 */
import { getDB } from '@/db/database';

import type {
  KwentoAttempt,
  KwentoCulturalSetting,
  KwentoDifficulty,
  KwentoLanguage,
  KwentoModeResponse,
  KwentoTierId,
} from '../types/kwento.types';

interface KwentoRow {
  id: string;
  grade_level: number;
  melc_topic: string;
  setting: string;
  difficulty: string;
  language_used: string;
  kwento: string;
  tanong: string;
  hint: string;
  suliranin_sagot: string;
  follow_up: string | null;
  character_names: string | null;
  tier_id: number;
  generated_at: string;
}

function parseCharacterNames(value: string | null): string[] | undefined {
  if (!value) {
    return undefined;
  }
  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed)) {
      const names = parsed.filter((n): n is string => typeof n === 'string');
      return names.length > 0 ? names : undefined;
    }
  } catch {
    // Corrupt JSON — treat as no names rather than throwing.
  }
  return undefined;
}

function rowToKwento(row: KwentoRow): KwentoModeResponse {
  return {
    id: row.id,
    kwento: row.kwento,
    tanong: row.tanong,
    hint: row.hint,
    suliranin_sagot: row.suliranin_sagot,
    melc_topic: row.melc_topic,
    grade_level: row.grade_level,
    setting: row.setting as KwentoCulturalSetting,
    difficulty: row.difficulty as KwentoDifficulty,
    language_used: row.language_used as KwentoLanguage,
    follow_up: row.follow_up ?? '',
    character_names: parseCharacterNames(row.character_names),
    generatedAt: new Date(row.generated_at),
    tierId: row.tier_id as KwentoTierId,
  };
}

/** Upsert a generated kwento into the cache. Idempotent on id. */
export async function saveKwento(kwento: KwentoModeResponse): Promise<void> {
  const db = getDB();
  await db.runAsync(
    `INSERT INTO kwento_cache (
       id, grade_level, melc_topic, setting, difficulty, language_used,
       kwento, tanong, hint, suliranin_sagot, follow_up, character_names,
       tier_id, generated_at
     ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET
       kwento          = excluded.kwento,
       tanong          = excluded.tanong,
       hint            = excluded.hint,
       suliranin_sagot = excluded.suliranin_sagot,
       follow_up       = excluded.follow_up,
       character_names = excluded.character_names`,
    [
      kwento.id,
      kwento.grade_level,
      kwento.melc_topic,
      kwento.setting,
      kwento.difficulty,
      kwento.language_used,
      kwento.kwento,
      kwento.tanong,
      kwento.hint,
      kwento.suliranin_sagot,
      kwento.follow_up ?? '',
      JSON.stringify(kwento.character_names ?? []),
      kwento.tierId,
      kwento.generatedAt.toISOString(),
    ],
  );
}

/** Fetch a single cached kwento by id, or null if not present. */
export async function getKwentoById(id: string): Promise<KwentoModeResponse | null> {
  const db = getDB();
  const row = await db.getFirstAsync<KwentoRow>(
    'SELECT * FROM kwento_cache WHERE id = ?',
    [id],
  );
  return row ? rowToKwento(row) : null;
}

/**
 * List cached kwentos for a grade (optionally filtered by topic), newest first.
 * Used for offline reuse when generation isn't possible.
 */
export async function getCachedKwentos(
  gradeLevel: number,
  melcTopic?: string,
  limit = 20,
): Promise<KwentoModeResponse[]> {
  const db = getDB();
  const rows = melcTopic
    ? await db.getAllAsync<KwentoRow>(
        `SELECT * FROM kwento_cache
         WHERE grade_level = ? AND melc_topic = ?
         ORDER BY generated_at DESC LIMIT ?`,
        [gradeLevel, melcTopic, limit],
      )
    : await db.getAllAsync<KwentoRow>(
        `SELECT * FROM kwento_cache
         WHERE grade_level = ?
         ORDER BY generated_at DESC LIMIT ?`,
        [gradeLevel, limit],
      );
  return rows.map(rowToKwento);
}

/** Record a single answer attempt. Returns the new row id. */
export async function recordKwentoAttempt(attempt: KwentoAttempt): Promise<number> {
  const db = getDB();
  const result = await db.runAsync(
    `INSERT INTO kwento_attempts (
       kwento_id, student_answer, is_correct, hint_used, attempt_count,
       misconception_detected, completed_at
     ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      attempt.kwentoId,
      attempt.studentAnswer,
      attempt.isCorrect ? 1 : 0,
      attempt.hintUsed ? 1 : 0,
      attempt.attemptCount,
      attempt.misconceptionDetected == null ? null : attempt.misconceptionDetected ? 1 : 0,
      attempt.completedAt.toISOString(),
    ],
  );
  return result.lastInsertRowId;
}

interface AttemptRow {
  kwento_id: string;
  student_answer: string;
  is_correct: number;
  hint_used: number;
  attempt_count: number;
  misconception_detected: number | null;
  completed_at: string;
}

/** All attempts recorded for a kwento, oldest first. */
export async function getAttemptsForKwento(kwentoId: string): Promise<KwentoAttempt[]> {
  const db = getDB();
  const rows = await db.getAllAsync<AttemptRow>(
    `SELECT kwento_id, student_answer, is_correct, hint_used, attempt_count,
            misconception_detected, completed_at
     FROM kwento_attempts WHERE kwento_id = ? ORDER BY completed_at ASC`,
    [kwentoId],
  );
  return rows.map((row) => ({
    kwentoId: row.kwento_id,
    studentAnswer: row.student_answer,
    isCorrect: row.is_correct === 1,
    hintUsed: row.hint_used === 1,
    attemptCount: row.attempt_count,
    misconceptionDetected:
      row.misconception_detected == null ? undefined : row.misconception_detected === 1,
    completedAt: new Date(row.completed_at),
  }));
}
