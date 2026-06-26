/**
 * Telemetry layer types (spec 5.10 — B2B SaaS competency data).
 *
 * Pure type module: NO runtime imports, so it is fully erased under Node's
 * TypeScript type-stripping and never drags a native dependency into headless
 * verification. The owner of CompetencyEventType lives here because the event
 * taxonomy is a telemetry concern; the gamification layer imports it as a type.
 */

/** Outcome classification logged per reviewed competency. */
export type CompetencyEventType = 'reviewed' | 'mastered' | 'missed';

/** Input for recording a single answered question into `quiz_attempts`. */
export interface QuizAttemptInput {
  /** The question/prompt the student answered. */
  question: string;
  /** Whether the student's answer was correct. */
  isCorrect: boolean;
  competencyCode?: string | null;
  subject?: string | null;
  gradeLevel?: number | null;
  studentAnswer?: string | null;
}

/**
 * An anonymized competency-mastery event queued for B2B sync. Carries NO PII —
 * only competency-level signal plus optional non-identifying extras in payload.
 */
export interface CompetencyEvent {
  eventType: CompetencyEventType;
  competencyCode?: string | null;
  subject?: string | null;
  gradeLevel?: number | null;
  isCorrect?: boolean | null;
  /** Arbitrary non-PII extras (difficulty, mastery, drops, ...). Stored as JSON. */
  payload?: Record<string, unknown> | null;
}

/** A row as stored in / read back from the `competency_events` table. */
export interface CompetencyEventRow {
  id: number;
  event_type: CompetencyEventType;
  competency_code: string | null;
  subject: string | null;
  grade_level: number | null;
  is_correct: number | null;
  payload: string | null;
  created_at: string;
  /** NULL until the row has been pushed to the cloud dashboard. */
  synced_at: string | null;
}
