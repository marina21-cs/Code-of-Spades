/**
 * Resource economy + adaptive-difficulty persistence (spec 5.9) and the single
 * funnel that drives BOTH the game loop and the B2B telemetry queue (spec 5.10).
 *
 * completeReview() is the master controller a reviewer flow calls when a student
 * answers an item. In ONE SQLite transaction it folds the outcome into mastery,
 * computes drops/XP via the pure economyLogic, persists difficulty_state /
 * resources / player_state, and enqueues an anonymized competency event — so a
 * single review feeds the game economy and the analytics dashboard atomically.
 */
import type { SQLiteDatabase } from 'expo-sqlite';

import { getDB } from '@/db/database';
import { enqueueCompetencyEvent } from '@/telemetry/eventQueue';
import type { CompetencyEventType } from '@/telemetry/types';

import {
  clamp,
  eventTypeFor,
  levelForXp,
  nextDifficulty,
  resourceDropsFor,
  xpForResult,
  type ResourceDrop,
} from './economyLogic';

/** A read-only snapshot of a competency's adaptive-difficulty row. */
export interface DifficultySnapshot {
  competencyCode: string;
  mastery: number;
  difficulty: number;
  dropRate: number;
}

/** A read-only snapshot of player progression. */
export interface PlayerState {
  level: number;
  xp: number;
  worldStage: number;
}

/** Everything a single completeReview() produced, for the caller/UI to render. */
export interface RewardSummary {
  competencyCode: string;
  wasCorrect: boolean;
  newMastery: number;
  dropRate: number;
  /** Integer 1..5 derived from mastery, stored in difficulty_state.difficulty. */
  difficulty: number;
  drops: ResourceDrop[];
  xpGained: number;
  level: number;
  worldStage: number;
  eventType: CompetencyEventType;
}

/** Map a [0,1] mastery onto the difficulty_state.difficulty column (1..5). */
function difficultyForMastery(mastery: number): number {
  return clamp(Math.round(1 + clamp(mastery, 0, 1) * 4), 1, 5);
}

/** Current adaptive-difficulty row for a competency, or its defaults. */
export async function getDifficultyState(competencyCode: string): Promise<DifficultySnapshot> {
  const db: SQLiteDatabase = getDB();
  const row = await db.getFirstAsync<{ mastery: number; difficulty: number; drop_rate: number }>(
    'SELECT mastery, difficulty, drop_rate FROM difficulty_state WHERE competency_code = ?',
    [competencyCode],
  );
  return {
    competencyCode,
    mastery: row?.mastery ?? 0,
    difficulty: row?.difficulty ?? 2,
    dropRate: row?.drop_rate ?? 0.5,
  };
}

/** Current resource inventory as a { resource_type: quantity } map. */
export async function getResources(): Promise<Record<string, number>> {
  const db: SQLiteDatabase = getDB();
  const rows = await db.getAllAsync<{ resource_type: string; quantity: number }>(
    'SELECT resource_type, quantity FROM resources ORDER BY resource_type',
  );
  const out: Record<string, number> = {};
  for (const r of rows) {
    out[r.resource_type] = r.quantity;
  }
  return out;
}

/** Current player progression snapshot. */
export async function getPlayerState(): Promise<PlayerState> {
  const db: SQLiteDatabase = getDB();
  const row = await db.getFirstAsync<{ level: number; xp: number; world_stage: number }>(
    'SELECT level, xp, world_stage FROM player_state WHERE id = 1',
  );
  return { level: row?.level ?? 1, xp: row?.xp ?? 0, worldStage: row?.world_stage ?? 0 };
}

/**
 * Complete one MELC review. Runs a single transaction that:
 *   a) fetches the current difficulty_state for the competency,
 *   b) computes the new mastery, drop-rate, resource drops, XP and event type,
 *   c) upserts difficulty_state, credits resources, and updates player_state XP,
 *   d) enqueues the anonymized competency event for B2B sync.
 *
 * Because enqueueCompetencyEvent() shares the same connection, its INSERT runs
 * inside this transaction — the game-loop writes and the telemetry row commit
 * together or not at all.
 */
export async function completeReview(
  competencyCode: string,
  wasCorrect: boolean,
): Promise<RewardSummary> {
  const db: SQLiteDatabase = getDB();
  let summary: RewardSummary | undefined;

  await db.withTransactionAsync(async () => {
    // a) Current state for this competency (default mastery 0 if never seen).
    const prevRow = await db.getFirstAsync<{ mastery: number }>(
      'SELECT mastery FROM difficulty_state WHERE competency_code = ?',
      [competencyCode],
    );
    const prevMastery = prevRow?.mastery ?? 0;

    // b) Pure computations.
    const { newMastery, dropRate } = nextDifficulty(prevMastery, wasCorrect);
    const drops = resourceDropsFor(newMastery, dropRate);
    const xpGained = xpForResult(wasCorrect);
    const eventType = eventTypeFor(wasCorrect, newMastery);
    const difficulty = difficultyForMastery(newMastery);

    // c) Persist adaptive difficulty.
    await db.runAsync(
      `INSERT INTO difficulty_state (competency_code, mastery, difficulty, drop_rate)
       VALUES (?, ?, ?, ?)
       ON CONFLICT(competency_code) DO UPDATE SET
         mastery = excluded.mastery,
         difficulty = excluded.difficulty,
         drop_rate = excluded.drop_rate,
         updated_at = datetime('now')`,
      [competencyCode, newMastery, difficulty, dropRate],
    );

    // c) Credit resources (UPSERT quantity += amount).
    for (const drop of drops) {
      // eslint-disable-next-line no-await-in-loop
      await db.runAsync(
        `INSERT INTO resources (resource_type, quantity) VALUES (?, ?)
         ON CONFLICT(resource_type) DO UPDATE SET
           quantity = quantity + excluded.quantity,
           updated_at = datetime('now')`,
        [drop.type, drop.amount],
      );
    }

    // c) Credit XP and recompute progression from cumulative XP.
    const playerRow = await db.getFirstAsync<{ xp: number }>('SELECT xp FROM player_state WHERE id = 1');
    const newXp = (playerRow?.xp ?? 0) + xpGained;
    const { level, worldStage } = levelForXp(newXp);
    await db.runAsync(
      `UPDATE player_state SET xp = ?, level = ?, world_stage = ?, updated_at = datetime('now') WHERE id = 1`,
      [newXp, level, worldStage],
    );

    // d) Enqueue the anonymized B2B telemetry event (same connection => same txn).
    await enqueueCompetencyEvent({
      event_type: eventType,
      competency_code: competencyCode,
      is_correct: wasCorrect,
      payload: JSON.stringify({ newMastery, dropRate, difficulty, xpGained, drops }),
    });

    summary = {
      competencyCode,
      wasCorrect,
      newMastery,
      dropRate,
      difficulty,
      drops,
      xpGained,
      level,
      worldStage,
      eventType,
    };
  });

  // The transaction callback above is awaited, so `summary` is always assigned.
  return summary as RewardSummary;
}
