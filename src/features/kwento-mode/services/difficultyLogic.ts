/**
 * Pure adaptive-difficulty logic for Kwento Mode (spec 5.8).
 *
 * Kept separate from kwentoModeService (which imports native modules) so the
 * stepping rule can be verified headlessly, mirroring the streakLogic /
 * streakService split.
 */
import type { KwentoDifficulty } from '../types/kwento.types';

/** Difficulty order, easy -> hard. */
export const DIFFICULTY_ORDER: readonly KwentoDifficulty[] = ['easy', 'medium', 'hard'];

/**
 * Step difficulty: a correct answer moves up one rung, a wrong answer moves down
 * one rung, clamped to the easy..hard range.
 */
export function getNextDifficulty(
  currentDifficulty: KwentoDifficulty,
  wasCorrect: boolean,
): KwentoDifficulty {
  const index = DIFFICULTY_ORDER.indexOf(currentDifficulty);
  if (wasCorrect && index < DIFFICULTY_ORDER.length - 1) {
    return DIFFICULTY_ORDER[index + 1];
  }
  if (!wasCorrect && index > 0) {
    return DIFFICULTY_ORDER[index - 1];
  }
  return currentDifficulty;
}
