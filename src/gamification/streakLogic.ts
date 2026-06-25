/**
 * Pure streak + evolution + badge logic (spec 5.8 / 5.9).
 *
 * All date math and progression rules live here, decoupled from SQLite, so they
 * are deterministic and testable headlessly. streakService.ts persists the
 * results.
 */

export type EvolutionTier = 'kit' | 'young' | 'elder';

export interface StreakState {
  currentStreak: number;
  longestStreak: number;
  lastStudyDate: string | null; // 'YYYY-MM-DD' (local)
  totalStudyDays: number;
}

export interface StreakUpdate {
  changed: boolean;
  next: StreakState;
}

/** Local calendar date as 'YYYY-MM-DD'. */
export function todayISO(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/** Whole-day difference (b - a) between two 'YYYY-MM-DD' dates. */
export function daysBetween(a: string, b: string): number {
  const [ay, am, ad] = a.split('-').map(Number);
  const [by, bm, bd] = b.split('-').map(Number);
  const ta = Date.UTC(ay, am - 1, ad);
  const tb = Date.UTC(by, bm - 1, bd);
  return Math.round((tb - ta) / 86_400_000);
}

/**
 * Compute the next streak state for a study session on `today`.
 *  - same day as last session   -> no change (idempotent)
 *  - exactly the next day        -> streak + 1
 *  - a gap of more than one day  -> streak resets to 1
 *  - a date before the last one  -> ignored (clock anomaly)
 */
export function computeStreakUpdate(prev: StreakState, today: string): StreakUpdate {
  if (prev.lastStudyDate === today) {
    return { changed: false, next: prev };
  }

  let currentStreak: number;
  if (!prev.lastStudyDate) {
    currentStreak = 1;
  } else {
    const diff = daysBetween(prev.lastStudyDate, today);
    if (diff <= 0) {
      // today is the same or earlier than the last recorded day; ignore.
      return { changed: false, next: prev };
    }
    currentStreak = diff === 1 ? prev.currentStreak + 1 : 1;
  }

  const longestStreak = Math.max(prev.longestStreak, currentStreak);
  const totalStudyDays = prev.totalStudyDays + 1;

  return {
    changed: true,
    next: { currentStreak, longestStreak, lastStudyDate: today, totalStudyDays },
  };
}

/** Ordered evolution tiers by minimum streak (spec: kit -> young -> elder). */
export const EVOLUTION_THRESHOLDS: Array<{ tier: EvolutionTier; minStreak: number }> = [
  { tier: 'kit', minStreak: 0 },
  { tier: 'young', minStreak: 3 },
  { tier: 'elder', minStreak: 7 },
];

/** Visual evolution tier for a given current streak. */
export function evolutionTierForStreak(currentStreak: number): EvolutionTier {
  let tier: EvolutionTier = 'kit';
  for (const threshold of EVOLUTION_THRESHOLDS) {
    if (currentStreak >= threshold.minStreak) {
      tier = threshold.tier;
    }
  }
  return tier;
}

/** Streak-milestone badge ids that should be earned at a given streak. */
export const STREAK_BADGE_THRESHOLDS: Array<{ id: string; minStreak: number }> = [
  { id: 'streak_3', minStreak: 3 },
  { id: 'streak_7', minStreak: 7 },
  { id: 'streak_30', minStreak: 30 },
];

export function badgeIdsForStreak(currentStreak: number): string[] {
  return STREAK_BADGE_THRESHOLDS.filter((b) => currentStreak >= b.minStreak).map((b) => b.id);
}
