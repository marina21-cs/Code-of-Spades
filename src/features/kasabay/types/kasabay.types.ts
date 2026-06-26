/**
 * Type definitions for Kasabay Mode (spec 5.10) \u2014 virtual body doubling.
 *
 * Kasabay Mode turns the dashboard into a study desk: Suri "studies" alongside
 * the student during a focus block, and the student can interrupt the timer at
 * any moment to ask for help ("Stuck ka ba?"). This module covers the headless
 * backend logic: the focus-timer state machine and the interruption request /
 * response shapes. The pixel-art "Tambayan" UI is a separate (UI-layer) concern.
 *
 * Pure type module (type-only imports) so it stays headlessly verifiable.
 */
import type { MisconceptionDetectionResponse } from '@/features/misconception/types/misconception.types';

/** Language register Suri replies in during an interruption. */
export type KasabayLanguage = 'tagalog' | 'taglish' | 'english';

/**
 * The "vibe check" injected into the system prompt as {cognitiveModifier}. A
 * coarse read of the student's current state that nudges Suri's tone/length.
 */
export type CognitiveModifier = 'focused' | 'restless' | 'tired' | 'anxious' | 'neutral';

/** All cognitive modifiers, ordered. Exported for validation + iteration. */
export const COGNITIVE_MODIFIERS: readonly CognitiveModifier[] = [
  'focused',
  'restless',
  'tired',
  'anxious',
  'neutral',
] as const;

/** Focus-timer lifecycle. interrupted = paused so the student can ask for help. */
export type FocusTimerStatus = 'idle' | 'running' | 'interrupted' | 'completed';

/**
 * Immutable focus-timer snapshot. Study time is BANKED into accumulatedMs each
 * time a running segment ends (interrupt/complete); the live elapsed value adds
 * the in-progress segment on top. Keeping the segment start (not a live counter)
 * makes every derived value a pure function of (state, now).
 */
export interface FocusTimerState {
  readonly status: FocusTimerStatus;
  /** Planned block length in ms. */
  readonly durationMs: number;
  /** Study time banked from completed running segments (ms). */
  readonly accumulatedMs: number;
  /** Epoch ms the current running segment began, or null when not running. */
  readonly segmentStartedAt: number | null;
  /** How many times the student interrupted to ask for help. */
  readonly interruptions: number;
}

/** Everything an interruption needs so Suri can "look up from her textbook". */
export interface KasabayInterruptionRequest {
  /** What the student asked when they paused the timer. */
  studentMessage: string;
  /** Short MELC topic label for RAG grounding, e.g. "fractions". */
  melcTopic: string;
  /** DepEd grade level, 1-12. */
  gradeLevel: number;
  /** Reply language register. */
  language: KasabayLanguage;
  /** Current vibe check -> {cognitiveModifier} in the prompt. */
  cognitiveModifier: CognitiveModifier;
  /** Yesterday's topic -> {last_topic_discussed}; referenced only if relevant. */
  lastTopicDiscussed?: string | null;
  /** RAG passages; retrieved by the service if omitted. */
  melcPassages?: string[];
  /** Force the offline (on-device) path. */
  isOffline?: boolean;
}

/** Which AI tier produced the reply: 1 = cloud, 2 = reduced, 3 = on-device. */
export type KasabayTierId = 1 | 2 | 3;

/** Suri's reply to an interruption. */
export interface KasabayInterruptionResponse {
  /** The conversational reply, spoken as a peer looking up from her textbook. */
  reply: string;
  /** Misconception diagnosis, when one was run and found; otherwise null. */
  misconception: MisconceptionDetectionResponse | null;
  /** Which AI tier produced the reply. */
  tierId: KasabayTierId;
  /** Always true: rule #4 asks the student if they're ready to resume the timer. */
  promptToResume: boolean;
}
