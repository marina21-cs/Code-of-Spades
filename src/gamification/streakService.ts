/**
 * Streak + badge persistence (spec 5.9), backed by the single streaks row
 * (id = 1) and the badges table from the schema foundation.
 *
 * All progression rules come from the pure streakLogic module; this layer only
 * reads/writes SQLite. recordStudySession is idempotent within a calendar day,
 * and badge unlocks are atomic (only set earned_at when still NULL).
 */
import { getDB } from '@/db/database';

import {
  type EvolutionTier,
  type StreakState,
  badgeIdsForStreak,
  computeStreakUpdate,
  evolutionTierForStreak,
  todayISO,
} from './streakLogic';

export interface StreakData extends StreakState {
  evolutionTier: EvolutionTier;
}

export interface Badge {
  id: string;
  name: string;
  description: string | null;
  earnedAt: string | null;
}

interface StreakRow {
  current_streak: number;
  longest_streak: number;
  last_study_date: string | null;
  total_study_days: number;
}

const EMPTY_ROW: StreakRow = {
  current_streak: 0,
  longest_streak: 0,
  last_study_date: null,
  total_study_days: 0,
};

async function readStreakRow(): Promise<StreakRow> {
  const db = getDB();
  const row = await db.getFirstAsync<StreakRow>(
    'SELECT current_streak, longest_streak, last_study_date, total_study_days FROM streaks WHERE id = 1',
  );
  return row ?? EMPTY_ROW;
}

function toStreakData(state: StreakState): StreakData {
  return { ...state, evolutionTier: evolutionTierForStreak(state.currentStreak) };
}

function rowToState(row: StreakRow): StreakState {
  return {
    currentStreak: row.current_streak,
    longestStreak: row.longest_streak,
    lastStudyDate: row.last_study_date,
    totalStudyDays: row.total_study_days,
  };
}

/** Current streak snapshot, including the visual evolution tier. */
export async function getStreakData(): Promise<StreakData> {
  return toStreakData(rowToState(await readStreakRow()));
}

/**
 * Record a study session for `date` (defaults to today). Idempotent: a second
 * call on the same day returns the same streak without advancing it. Unlocks any
 * streak-milestone badges that become eligible.
 */
export async function recordStudySession(date: string = todayISO()): Promise<StreakData> {
  const db = getDB();
  const prev = rowToState(await readStreakRow());
  const { changed, next } = computeStreakUpdate(prev, date);

  if (changed) {
    await db.runAsync(
      `UPDATE streaks
         SET current_streak = ?, longest_streak = ?, last_study_date = ?, total_study_days = ?,
             updated_at = datetime('now')
       WHERE id = 1`,
      [next.currentStreak, next.longestStreak, next.lastStudyDate, next.totalStudyDays],
    );
    await unlockStreakBadges(next.currentStreak);
  }

  return toStreakData(next);
}

/**
 * Atomically award any streak-milestone badges earned at `currentStreak`.
 * Returns the ids newly unlocked. Idempotent — earned badges are left untouched.
 */
export async function unlockStreakBadges(currentStreak: number): Promise<string[]> {
  const db = getDB();
  const unlocked: string[] = [];
  for (const id of badgeIdsForStreak(currentStreak)) {
    // eslint-disable-next-line no-await-in-loop
    const result = await db.runAsync(
      `UPDATE badges SET earned_at = datetime('now') WHERE id = ? AND earned_at IS NULL`,
      [id],
    );
    if (result.changes > 0) {
      unlocked.push(id);
    }
  }
  return unlocked;
}

/**
 * Award a specific badge (e.g. first_chat, first_voice, first_camera) once.
 * Returns true only if it was newly unlocked.
 */
export async function awardBadge(badgeId: string): Promise<boolean> {
  const db = getDB();
  const result = await db.runAsync(
    `UPDATE badges SET earned_at = datetime('now') WHERE id = ? AND earned_at IS NULL`,
    [badgeId],
  );
  return result.changes > 0;
}

/** All badges with their earned state. */
export async function getBadges(): Promise<Badge[]> {
  const db = getDB();
  const rows = await db.getAllAsync<{
    id: string;
    name: string;
    description: string | null;
    earned_at: string | null;
  }>('SELECT id, name, description, earned_at FROM badges ORDER BY id');
  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    description: r.description,
    earnedAt: r.earned_at,
  }));
}
