/**
 * Type definitions for Kwento Mode (spec 5.8).
 *
 * Kwento Mode generates short educational stories set in authentic Filipino
 * cultural contexts (palengke, laro sa kalye, tindahan, ...) that embed exactly
 * one curriculum-accurate problem inside the narrative, grounded in DepEd MELCs
 * and scaled in complexity from Grade 1 to Grade 12.
 *
 * Pure type module (only a type-only import of LearningProfile) so it can be
 * exercised by the headless verification scripts.
 */
import type { LearningProfile } from '@/profile/types';

/** Language register the story is written in. */
export type KwentoLanguage = 'tagalog' | 'taglish' | 'english';

/** Difficulty rung. Adaptive: a correct answer steps up, a wrong one steps down. */
export type KwentoDifficulty = 'easy' | 'medium' | 'hard';

/** The seven authentic Filipino cultural settings a kwento can be set in. */
export type KwentoCulturalSetting =
  | 'palengke'
  | 'laro_sa_kalye'
  | 'lakad_pauwi'
  | 'tindahan'
  | 'palaruan'
  | 'bahay'
  | 'eskwelahan';

/** Signal tier that generated the story: 1 = cloud, 2 = reduced, 3 = on-device. */
export type KwentoTierId = 1 | 2 | 3;

/** Everything the service needs to generate one kwento. */
export interface KwentoModeRequest {
  /** DepEd grade level, 1-12. */
  gradeLevel: number;
  /** Short topic label, e.g. "photosynthesis". */
  melcTopic: string;
  /** Full MELC competency string (optional context for the prompt). */
  melcCompetency?: string;
  /** RAG-retrieved MELC passages (top-3 online, top-1 offline). */
  melcPassages: string[];
  languagePreference: KwentoLanguage;
  /** The student's active learning profile (grade, response mode, a11y). */
  learningProfile: LearningProfile;
  /** Explicit setting, or undefined to let the builder pick the best fit. */
  culturalSetting?: KwentoCulturalSetting;
  difficulty: KwentoDifficulty;
  /** Ids of recent kwentos, so the prompt can avoid repeating characters. */
  previousKwentoIds?: string[];
  /** When true, use the offline-safe (shorter) prompt and the on-device path. */
  isOffline: boolean;
}

/** A fully parsed, ready-to-render kwento. */
export interface KwentoModeResponse {
  /** Stable id for this kwento (also the kwento_cache primary key). */
  id: string;
  /** The full story text — the problem is embedded naturally inside it. */
  kwento: string;
  /** The problem, restated clearly for the student. */
  tanong: string;
  /** A gentle hint in the same language; points at the method, not the answer. */
  hint: string;
  /** Step-by-step solution in the same language as the kwento. */
  suliranin_sagot: string;
  /** The MELC competency the problem addresses. */
  melc_topic: string;
  grade_level: number;
  setting: KwentoCulturalSetting;
  difficulty: KwentoDifficulty;
  language_used: KwentoLanguage;
  /** Optional harder follow-up using the same setting/characters. */
  follow_up?: string;
  /** Character names used, for session-to-session consistency. */
  character_names?: string[];
  generatedAt: Date;
  /** Which AI tier produced this story. */
  tierId: KwentoTierId;
}

/** A single recorded attempt at a kwento's embedded problem. */
export interface KwentoAttempt {
  kwentoId: string;
  studentAnswer: string;
  isCorrect: boolean;
  hintUsed: boolean;
  attemptCount: number;
  completedAt: Date;
  /** Whether a misconception was detected on a wrong answer (spec 5.9). */
  misconceptionDetected?: boolean;
}

/** Per-grade-band narrative complexity envelope used to shape the prompt. */
export interface GradeComplexitySpec {
  gradeBand: string;
  grades: number[];
  maxCharacters: number;
  maxSettings: number;
  problemType: string;
  maxSentences: number;
  dialogueAllowed: boolean;
  variablesAllowed: boolean;
  abstractReasoningRequired: boolean;
}
