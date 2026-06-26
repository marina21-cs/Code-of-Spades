/**
 * Type definitions for Misconception Detection (spec 5.9).
 *
 * Misconception Detection is Suri's diagnostic layer: when a student gets
 * something wrong — or asks a question that reveals a specific wrong belief —
 * it identifies the EXACT misconception driving the error and produces a
 * targeted explanation that addresses that belief, rather than re-stating the
 * correct answer generically. Built for the silent student (hiya culture) who
 * never raises their hand: detection runs on what they say, not on a request
 * for help.
 *
 * Pure type module (only a type-only import) so it stays headlessly verifiable.
 */
import type { LearningProfile } from '@/profile/types';

/** Language register the student is using (drives the explanation language). */
export type MisconceptionLanguage = 'tagalog' | 'taglish' | 'english';

/**
 * The classification of a detected wrong belief (spec 5.9). `null` is reserved
 * for "no misconception detected" and lives on the response field, not here.
 */
export type MisconceptionType =
  | 'WRONG_CAUSATION' // Wrong thing causes the phenomenon
  | 'WRONG_DEFINITION' // Incorrect definition of a concept
  | 'CONCEPT_CONFUSION' // Two separate concepts conflated
  | 'OVERGENERALIZATION' // Rule applied too broadly
  | 'DIRECTIONALITY_ERROR' // Cause and effect reversed
  | 'PARTIAL_UNDERSTANDING' // Incomplete but not entirely wrong
  | 'LANGUAGE_CONFUSION'; // Tagalog/English term confusion causing the error

/** All misconception types, ordered. Exported for validation + iteration. */
export const MISCONCEPTION_TYPES: readonly MisconceptionType[] = [
  'WRONG_CAUSATION',
  'WRONG_DEFINITION',
  'CONCEPT_CONFUSION',
  'OVERGENERALIZATION',
  'DIRECTIONALITY_ERROR',
  'PARTIAL_UNDERSTANDING',
  'LANGUAGE_CONFUSION',
] as const;

/** Subjects the pre-loaded taxonomy covers. */
export type MisconceptionSubject = 'science' | 'math';

/** Everything the detector needs to analyze one student message/answer. */
export interface MisconceptionDetectionRequest {
  /** The student's raw message: a wrong answer, an explanation, or a question. */
  studentMessage: string;
  /** Short topic label, e.g. "photosynthesis". */
  melcTopic: string;
  /** Full MELC competency string (optional extra context for the prompt). */
  melcCompetency?: string;
  /** DepEd grade level, 1-12. */
  gradeLevel: number;
  /** RAG-retrieved MELC passages. Retrieved by the detector if omitted. */
  melcPassages?: string[];
  /** The expected/correct answer, when detection runs on a graded problem. */
  expectedAnswer?: string;
  /** Language hint; the model still re-detects from the message itself. */
  language?: MisconceptionLanguage;
  /** Active learning profile (focus mode shortens targeted explanations). */
  learningProfile?: LearningProfile;
  /** Force the offline (taxonomy-lookup-only) path regardless of signal. */
  isOffline?: boolean;
}

/** Which AI tier produced the detection: 1 = cloud, 2 = reduced, 3 = on-device. */
export type MisconceptionTierId = 1 | 2 | 3;

/**
 * The structured detection result (spec 5.9 "AI Output Structure"). Field names
 * mirror the JSON contract the model is asked to emit.
 */
export interface MisconceptionDetectionResponse {
  /** True when a specific wrong belief was identified above the confidence bar. */
  has_misconception: boolean;
  /** The classification, or null when none was detected / below threshold. */
  misconception_type: MisconceptionType | null;
  /** The student's exact wrong belief, in their own words. */
  specific_wrong_belief: string;
  /** What is actually true. */
  correct_understanding: string;
  /** What the student already got right (validated before correcting). */
  acknowledgment: string;
  /** Explanation that addresses ONLY the specific wrong belief, not the textbook. */
  targeted_explanation: string;
  /** Optional Filipino cultural analogy used to illustrate the correction. */
  cultural_analogy?: string;
  /** A gentle comprehension check after the explanation. */
  follow_up_question: string;
  /** True if a Kwento Mode story would help consolidate the concept. */
  suggested_kwento?: boolean;
  /** Language the explanation is written in. */
  language_detected: MisconceptionLanguage;
  /** Confidence in the detection, 0.0-1.0. Below the threshold -> Socratic. */
  confidence: number;
  /** Which AI tier produced this result. */
  tierId: MisconceptionTierId;
}

/**
 * A persisted misconception record (spec 5.9). Tracked per student so a future
 * session can proactively check whether a previously detected misconception was
 * resolved. (Mapping helper provided; durable storage is a profile-layer concern.)
 */
export interface MisconceptionRecord {
  topic: string;
  melcCompetency: string;
  misconceptionType: MisconceptionType | null;
  /** The exact wrong belief, in the student's words. */
  specificWrongBelief: string;
  detectedAt: Date;
  resolvedAt?: Date;
  gradeLevel: number;
}

/** One pre-loaded entry in the local misconception taxonomy. */
export interface MisconceptionTaxonomyEntry {
  /** Stable id (subject_topic_short). */
  id: string;
  subject: MisconceptionSubject;
  /** Grade band the wrong belief is common in, e.g. "Grade 3-6". */
  gradeBand: string;
  /** Topic label the entry attaches to. */
  topic: string;
  /** The common wrong belief (Tagalog/Taglish, as students actually phrase it). */
  wrongBelief: string;
  misconceptionType: MisconceptionType;
  /**
   * Lowercase keywords used for offline matching against the student's message
   * (Tier 3 has no AI generation budget for detection — spec 5.9 / 10.1).
   */
  keywords: string[];
  /** Pre-written "what is actually true" served on the offline path. */
  correctUnderstanding: string;
  /** Pre-written targeted explanation served on the offline path. */
  targetedExplanation: string;
}
