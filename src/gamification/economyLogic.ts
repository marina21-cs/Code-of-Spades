/**
 * Pure gamification economy + adaptive-difficulty logic (spec 5.9).
 *
 * No DB, no native imports (only an erased `import type`) → deterministic and
 * unit-testable headlessly. resourceService.ts persists the results; this module
 * only computes them.
 *
 * Reward randomness is INJECTED via an `rng` argument so tests are reproducible;
 * production callers omit it and get Math.random.
 */
import type { CompetencyEventType } from '@/telemetry/types';

export interface ReviewResult {
  wasCorrect: boolean;
  /** Difficulty (1..5) of the item the student just answered. */
  difficulty: number;
}

export interface ResourceDrop {
  resourceType: string;
  quantity: number;
}

export interface DifficultyState {
  competencyCode: string;
  /** Rolling comprehension estimate in [0, 1]. */
  mastery: number;
  /** Current item difficulty, clamped to [1, 5]. */
  difficulty: number;
  /** Reward drop probability in [0.2, 1]; higher for struggling students. */
  dropRate: number;
}

/** Clamp a value into [min, max]. */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/** Default per-competency difficulty (mirrors the difficulty_state DDL defaults). */
export function initialDifficulty(competencyCode: string): DifficultyState {
  return { competencyCode, mastery: 0, difficulty: 2, dropRate: 0.5 };
}

/**
 * Resources earned for a review outcome.
 *  - Correct: 1 `seed` + `difficulty` `coin`s, plus a rare `tool` bonus dropped
 *    with probability `dropRate`.
 *  - Incorrect: a single consolation `seed` so struggling students still progress.
 */
export function resourceDropsFor(
  result: ReviewResult,
  dropRate: number,
  rng: () => number = Math.random,
): ResourceDrop[] {
  if (!result.wasCorrect) {
    return [{ resourceType: 'seed', quantity: 1 }];
  }
  const drops: ResourceDrop[] = [
    { resourceType: 'seed', quantity: 1 },
    { resourceType: 'coin', quantity: Math.max(1, Math.round(result.difficulty)) },
  ];
  if (rng() < clamp(dropRate, 0, 1)) {
    drops.push({ resourceType: 'tool', quantity: 1 });
  }
  return drops;
}

/** XP awarded for a review: scales with difficulty when correct, flat when wrong. */
export function xpForResult(wasCorrect: boolean, difficulty: number): number {
  return wasCorrect ? 10 + Math.max(1, Math.round(difficulty)) * 5 : 5;
}

/**
 * Player level + world stage from cumulative XP.
 * 100 XP per level; a new world stage every 5 levels.
 */
export function levelForXp(xp: number): { level: number; worldStage: number } {
  const safeXp = Math.max(0, Math.floor(xp));
  const level = Math.floor(safeXp / 100) + 1;
  const worldStage = Math.floor((level - 1) / 5);
  return { level, worldStage };
}

/**
 * Next adaptive-difficulty state after a review.
 *  - mastery drifts up on correct (+0.1), down on incorrect (−0.15), clamped [0,1].
 *  - difficulty steps toward the student: +1 when correct, −1 when wrong, [1,5].
 *  - dropRate is higher for low mastery (more encouraging drops) and lower for
 *    high mastery (rarer rewards): 1 − 0.6·mastery, clamped [0.2, 1].
 */
export function nextDifficulty(prev: DifficultyState, wasCorrect: boolean): DifficultyState {
  const mastery = clamp(prev.mastery + (wasCorrect ? 0.1 : -0.15), 0, 1);
  const difficulty = clamp(prev.difficulty + (wasCorrect ? 1 : -1), 1, 5);
  const dropRate = clamp(1 - mastery * 0.6, 0.2, 1);
  return { competencyCode: prev.competencyCode, mastery, difficulty, dropRate };
}

/** Classify a review outcome into a telemetry event type. */
export function eventTypeFor(wasCorrect: boolean, mastery: number): CompetencyEventType {
  if (!wasCorrect) {
    return 'missed';
  }
  return mastery >= 0.8 ? 'mastered' : 'reviewed';
}
