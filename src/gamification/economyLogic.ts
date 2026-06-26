/**
 * Pure gamification economy + adaptive-difficulty logic (spec 5.9).
 *
 * No DB and no runtime imports (only an erased `import type`), so every function
 * here is deterministic and headlessly unit-testable. resourceService.ts
 * persists the results; this module only computes them.
 *
 * Randomness is INJECTED via an optional `rng` argument so tests are
 * reproducible. Production callers pass two arguments and get Math.random; the
 * declared 2-argument signature is preserved.
 */
import type { CompetencyEventType } from '@/telemetry/types';

/** The four resource kinds in the Stardew-style economy. */
export type ResourceType = 'seed' | 'wood' | 'tool' | 'coin';

/** A single resource award produced by a review. */
export interface ResourceDrop {
  type: ResourceType;
  amount: number;
}

/** Player progression derived from cumulative XP. */
export interface LevelInfo {
  level: number;
  worldStage: number;
}

/** Result of folding one review outcome into a competency's mastery. */
export interface MasteryUpdate {
  /** Rolling comprehension estimate in [0, 1]. */
  newMastery: number;
  /** Reward drop probability in [0, 1] for the next review. */
  dropRate: number;
}

/** Clamp `value` into the inclusive range [min, max]. */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/**
 * Randomized resource drops for a review, in the spirit of a Stardew Valley
 * harvest. Output is HEAVILY influenced by `dropRate`:
 *  - `seed`  — always awarded (participation); count grows with mastery.
 *  - `wood`  — common; its roll is nudged up by dropRate.
 *  - `coin`  — the skill reward; amount scales with mastery, gated by dropRate.
 *  - `tool`  — the rare drop; gated by dropRate squared, so it is scarce and
 *              becomes far scarcer once dropRate is reduced for mastered topics.
 *
 * `rng` is injectable for deterministic tests; it defaults to Math.random.
 */
export function resourceDropsFor(
  masteryLevel: number,
  dropRate: number,
  rng: () => number = Math.random,
): ResourceDrop[] {
  const mastery = clamp(masteryLevel, 0, 1);
  const rate = clamp(dropRate, 0, 1);
  const drops: ResourceDrop[] = [];

  // Common participation reward — always at least one seed, more with mastery.
  drops.push({ type: 'seed', amount: 1 + Math.floor(mastery * 2) });

  // Wood is common but still a roll, so harvests vary review-to-review.
  if (rng() < 0.5 + rate * 0.3) {
    drops.push({ type: 'wood', amount: 1 + Math.round(mastery * 2) });
  }

  // Coins are the skill payout: amount scales with mastery, gated by dropRate.
  if (rng() < rate) {
    drops.push({ type: 'coin', amount: Math.max(1, Math.round(1 + mastery * 4)) });
  }

  // Tools are the rare drop, heavily gated by dropRate (squared => scarce).
  if (rng() < rate * rate) {
    drops.push({ type: 'tool', amount: 1 });
  }

  return drops;
}

/**
 * Player level + world stage from cumulative XP on a scaling (square-root)
 * curve: `level = floor(sqrt(xp / 100))`, floored at 1 so a fresh player is
 * level 1 (matching the seeded player_state). The curve means each level costs
 * progressively more XP. A new world stage unlocks every 5 levels.
 */
export function levelForXp(xp: number): LevelInfo {
  const safeXp = Math.max(0, xp);
  const level = Math.max(1, Math.floor(Math.sqrt(safeXp / 100)));
  const worldStage = Math.floor(level / 5);
  return { level, worldStage };
}

/**
 * Fold one review outcome into a competency's mastery using a rolling weighted
 * average: `newMastery = prevMastery * 0.7 + (wasCorrect ? 0.3 : 0)`.
 *
 * The reward drop-rate falls as mastery climbs, and once a competency is
 * mastered (mastery > 0.8) the rate is sharply reduced so rare resources become
 * much harder to earn from material the student already knows.
 */
export function nextDifficulty(prevMastery: number, wasCorrect: boolean): MasteryUpdate {
  const newMastery = clamp(clamp(prevMastery, 0, 1) * 0.7 + (wasCorrect ? 0.3 : 0), 0, 1);
  const dropRate = newMastery > 0.8 ? 0.15 : clamp(0.6 - newMastery * 0.4, 0.2, 0.6);
  return { newMastery, dropRate };
}

/**
 * XP awarded for a review. Correct answers are worth more; an incorrect answer
 * still grants a little so effort always advances the world. Supports the
 * player_state XP update in resourceService.
 */
export function xpForResult(wasCorrect: boolean): number {
  return wasCorrect ? 20 : 5;
}

/** Classify a review outcome into a B2B telemetry event type. */
export function eventTypeFor(wasCorrect: boolean, mastery: number): CompetencyEventType {
  if (!wasCorrect) {
    return 'missed';
  }
  return mastery >= 0.8 ? 'mastered' : 'reviewed';
}
