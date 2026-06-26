/**
 * Resource economy + adaptive-difficulty persistence (spec 5.9), and the single
 * funnel that drives BOTH the game loop and the B2B telemetry queue (spec 5.10).
 *
 * completeReview() is the master entry point a reviewer flow calls when a student
 * answers an item: it computes drops/xp/difficulty via the pure economyLogic,
 * writes resources / player_state / difficulty_state, and records the attempt +
 * enqueues an anonymized competency event in one shot — so a single review feeds
 * the game economy and the analytics dashboard simultaneously.
 */
import { getDB } from '@/db/database';
import { enqueueCompetencyEvent, recordQuizAttempt } from '@/telemetry/eventQueue';
import type { CompetencyEventType } from '@/telemetry/types';

import {
  type DifficultyState,
  type ResourceDrop,
  eventTypeFor,
  initialDifficulty,
  levelForXp,
  nextDifficulty,
  resourceDropsFor,
  xpForResult,
} from './economyLogic';

export interface CompleteReviewOptions {
  subject?: string | null;
  gradeLevel?: number | null;
  /** Question text stored in quiz_attempts; defaults to a synthesized label. */
  question?: string;
  studentAnswer?: string | null;
  /** Injectable RNG for deterministic tests. */
  rng?: () => number;
}

export interface RewardSummary {
  drops: ResourceDrop[];
  xpGained: number;
  level: number;
  worldStage: number;
  difficulty: DifficultyState;
  eventType: CompetencyEventType;
}

/** Read the current adaptive-difficulty row for a competency, or its default. */
export async function getDifficultyState(competencyCode: string): Promise<DifficultyState> {
  const db = getDB();
  const row = await db.getFirstAsync<{
    competency_code: string;
    mastery: number;
    difficulty: number;
    drop_rate: number;
  }>(
    'SELECT competency_code, mastery, difficulty, drop_rate FROM difficulty_state WHERE competency_code = ?',
    [competencyCode],
  );
  if (!row) {
    return initialDifficulty(competencyCode);
  }
  return {
    competencyCode: row.competency_code,
    mastery: row.mastery,
    difficulty: row.difficulty,
    dropRate: row.drop_rate,
  };
}

/** Current resource inventory as a { resource_type: quantity } map. */
export async function getResources(): Promise<Record<string, number>> {
  const db = getDB();
  const rows = await db.getAllAsync<{ resource_type: string; quantity: number }>(
    'SELECT resource_type, quantity FROM resources ORDER BY resource_type',
  );
  const out: Record<string, number> = {};
  for (const r of rows) {
    out[r.resource_type] = r.quantity;
  }
  return out;
}

/**
 * Complete one MELC review. The master function that:
 *   1. computes drops at the difficulty/drop-rate the student just faced,
 *   2. adapts the difficulty for next time,
 *   3. credits resources + XP (recomputing level/world stage),
 *   4. upserts difficulty_state,
 *   5. records the quiz attempt, and
 *   6. enqueues an anonymized competency event for B2B sync.
 *
 * Steps 5-6 are what make a single review drive the game loop AND telemetry.
 */
export async function completeReview(
  competencyCode: string,
  wasCorrect: boolean,
  opts: CompleteReviewOptions = {},
): Promise<RewardSummary> {
  const db = getDB();

  // 1-2. Pure computations off the CURRENT difficulty the student just faced.
  const prev = await getDifficultyState(competencyCode);
  const drops = resourceDropsFor({ wasCorrect, difficulty: prev.difficulty }, prev.dropRate, opts.rng);
  const next = nextDifficulty(prev, wasCorrect);
  const xpGained = xpForResult(wasCorrect, prev.difficulty);
  const eventType = eventTypeFor(wasCorrect, next.mastery);

  // 3. Credit resources (UPSERT quantity += drop).
  for (const drop of drops) {
    // eslint-disable-next-line no-await-in-loop
    await db.runAsync(
      `INSERT INTO resources (resource_type, quantity) VALUES (?, ?)
       ON CONFLICT(resource_type) DO UPDATE SET
         quantity = quantity + excluded.quantity,
         updated_at = datetime('now')`,
      [drop.resourceType, drop.quantity],
    );
  }

  // 3b. Credit XP and recompute progression from cumulative XP.
  const playerRow = await db.getFirstAsync<{ xp: number }>('SELECT xp FROM player_state WHERE id = 1');
  const newXp = (playerRow?.xp ?? 0) + xpGained;
  const { level, worldStage } = levelForXp(newXp);
  await db.runAsync(
    `UPDATE player_state SET xp = ?, level = ?, world_stage = ?, updated_at = datetime('now') WHERE id = 1`,
    [newXp, level, worldStage],
  );

  // 4. Upsert the adapted difficulty for next time.
  await db.runAsync(
    `INSERT INTO difficulty_state (competency_code, mastery, difficulty, drop_rate) VALUES (?, ?, ?, ?)
     ON CONFLICT(competency_code) DO UPDATE SET
       mastery = excluded.mastery,
       difficulty = excluded.difficulty,
       drop_rate = excluded.drop_rate,
       updated_at = datetime('now')`,
    [next.competencyCode, next.mastery, next.difficulty, next.dropRate],
  );

  // 5. Record the answered question (closes the quiz_attempts write gap).
  await recordQuizAttempt({
    question: opts.question ?? `Review: ${competencyCode}`,
    isCorrect: wasCorrect,
    competencyCode,
    subject: opts.subject ?? null,
    gradeLevel: opts.gradeLevel ?? null,
    studentAnswer: opts.studentAnswer ?? null,
  });

  // 6. Enqueue the anonymized B2B telemetry event.
  await enqueueCompetencyEvent({
    eventType,
    competencyCode,
    subject: opts.subject ?? null,
    gradeLevel: opts.gradeLevel ?? null,
    isCorrect: wasCorrect,
    payload: { difficulty: next.difficulty, mastery: next.mastery, xpGained, drops },
  });

  return { drops, xpGained, level, worldStage, difficulty: next, eventType };
}
