/**
 * Parse + validate the model's Misconception Detection JSON (pure), plus the
 * deterministic response constructors used by the non-AI paths.
 *
 * Models occasionally wrap JSON in a ```json fence or return prose. The parser
 * strips any fence, parses, coerces the enum-like fields, clamps confidence to
 * [0,1], and degrades to a safe "no misconception" response so the caller can
 * always fall through to a normal explanation.
 */
import {
  DEFAULT_MISCONCEPTION_LANGUAGE,
  SOCRATIC_FOLLOW_UP,
} from '../constants/misconceptionDefaults';
import type {
  MisconceptionDetectionRequest,
  MisconceptionDetectionResponse,
  MisconceptionLanguage,
  MisconceptionRecord,
  MisconceptionTaxonomyEntry,
  MisconceptionTierId,
  MisconceptionType,
} from '../types/misconception.types';
import { MISCONCEPTION_TYPES } from '../types/misconception.types';

const LANGUAGES: readonly MisconceptionLanguage[] = ['tagalog', 'taglish', 'english'];

/** tierId implied by whether the request ran offline, unless explicitly provided. */
function defaultTierId(request: MisconceptionDetectionRequest): MisconceptionTierId {
  return request.isOffline ? 3 : 1;
}

/** Remove a leading/trailing markdown code fence (```json ... ```), if present. */
function stripCodeFence(raw: string): string {
  return raw
    .replace(/```json\s*/gi, '')
    .replace(/```/g, '')
    .trim();
}

function asString(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback;
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function coerceType(value: unknown): MisconceptionType | null {
  return MISCONCEPTION_TYPES.includes(value as MisconceptionType)
    ? (value as MisconceptionType)
    : null;
}

function coerceLanguage(
  value: unknown,
  fallback: MisconceptionLanguage,
): MisconceptionLanguage {
  return LANGUAGES.includes(value as MisconceptionLanguage)
    ? (value as MisconceptionLanguage)
    : fallback;
}

/** Clamp an arbitrary value into a [0,1] confidence; non-numbers -> 0. */
export function clampConfidence(value: unknown): number {
  const n = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(n)) {
    return 0;
  }
  return Math.min(1, Math.max(0, n));
}

/** A safe "no misconception detected" response (also the parser's fallback). */
export function buildNoMisconceptionResponse(
  request: MisconceptionDetectionRequest,
  tierId: MisconceptionTierId = defaultTierId(request),
  language: MisconceptionLanguage = request.language ?? DEFAULT_MISCONCEPTION_LANGUAGE,
): MisconceptionDetectionResponse {
  return {
    has_misconception: false,
    misconception_type: null,
    specific_wrong_belief: '',
    correct_understanding: '',
    acknowledgment: '',
    targeted_explanation: '',
    cultural_analogy: undefined,
    follow_up_question: SOCRATIC_FOLLOW_UP[language],
    suggested_kwento: false,
    language_detected: language,
    confidence: 0,
    tierId,
  };
}

/**
 * Parse a raw model response into a validated MisconceptionDetectionResponse.
 * Falls back to a safe "no misconception" response when the payload is not valid
 * JSON or omits the required has_misconception flag.
 */
export function parseMisconceptionResponse(
  rawResponse: string,
  request: MisconceptionDetectionRequest,
  tierId: MisconceptionTierId = defaultTierId(request),
): MisconceptionDetectionResponse {
  const language = request.language ?? DEFAULT_MISCONCEPTION_LANGUAGE;

  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(stripCodeFence(rawResponse)) as Record<string, unknown>;
  } catch {
    return buildNoMisconceptionResponse(request, tierId, language);
  }

  if (typeof parsed.has_misconception !== 'boolean') {
    return buildNoMisconceptionResponse(request, tierId, language);
  }

  const detectedLanguage = coerceLanguage(parsed.language_detected, language);
  const hasMisconception = parsed.has_misconception === true;
  const culturalAnalogy = asString(parsed.cultural_analogy);

  return {
    has_misconception: hasMisconception,
    misconception_type: hasMisconception ? coerceType(parsed.misconception_type) : null,
    specific_wrong_belief: asString(parsed.specific_wrong_belief),
    correct_understanding: asString(parsed.correct_understanding),
    acknowledgment: asString(parsed.acknowledgment),
    targeted_explanation: asString(parsed.targeted_explanation),
    cultural_analogy: isNonEmptyString(culturalAnalogy) ? culturalAnalogy : undefined,
    follow_up_question: isNonEmptyString(parsed.follow_up_question)
      ? (parsed.follow_up_question as string)
      : SOCRATIC_FOLLOW_UP[detectedLanguage],
    suggested_kwento: parsed.suggested_kwento === true,
    language_detected: detectedLanguage,
    confidence: clampConfidence(parsed.confidence),
    tierId,
  };
}

/**
 * Build a detection response from a matched taxonomy entry (the OFFLINE path).
 * The pre-written correct understanding + targeted explanation are served as-is,
 * with a high fixed confidence since pre-mapped beliefs are exact (spec 10.1 #5).
 */
export function buildOfflineResponseFromTaxonomy(
  entry: MisconceptionTaxonomyEntry,
  request: MisconceptionDetectionRequest,
  language: MisconceptionLanguage = request.language ?? DEFAULT_MISCONCEPTION_LANGUAGE,
): MisconceptionDetectionResponse {
  return {
    has_misconception: true,
    misconception_type: entry.misconceptionType,
    specific_wrong_belief: entry.wrongBelief,
    correct_understanding: entry.correctUnderstanding,
    acknowledgment: '',
    targeted_explanation: entry.targetedExplanation,
    cultural_analogy: undefined,
    follow_up_question: SOCRATIC_FOLLOW_UP[language],
    suggested_kwento: true,
    language_detected: language,
    confidence: 0.9,
    tierId: 3,
  };
}

/**
 * Enforce the confidence bar (spec 10.1 #3). When a misconception was asserted
 * but confidence is below the threshold, downgrade to a Socratic check: do not
 * assert the belief, keep the student in control with an "is this what you
 * meant?" follow-up (spec 5.9 #4).
 */
export function applyConfidenceThreshold(
  response: MisconceptionDetectionResponse,
  threshold: number,
): MisconceptionDetectionResponse {
  if (!response.has_misconception || response.confidence >= threshold) {
    return response;
  }

  const followUp = isNonEmptyString(response.specific_wrong_belief)
    ? socraticReframe(response.specific_wrong_belief, response.language_detected)
    : SOCRATIC_FOLLOW_UP[response.language_detected];

  return {
    ...response,
    has_misconception: false,
    misconception_type: null,
    targeted_explanation: '',
    cultural_analogy: undefined,
    follow_up_question: followUp,
  };
}

/** "Is this what you meant?" framing around a tentatively-detected belief. */
function socraticReframe(belief: string, language: MisconceptionLanguage): string {
  switch (language) {
    case 'tagalog':
      return `Parang ang naiisip mo ay ganito: "${belief}". Tama ba ang pagkaintindi ko? Pa-paliwanag nga.`;
    case 'english':
      return `It sounds like you might be thinking: "${belief}". Did I get that right? Tell me more.`;
    case 'taglish':
    default:
      return `Parang ang dating sa akin ay ganito ang iniisip mo: "${belief}". Did I get that right? Tell me more.`;
  }
}

/** Map a detection result to a persistable record (durable storage is profile-layer). */
export function toMisconceptionRecord(
  response: MisconceptionDetectionResponse,
  request: MisconceptionDetectionRequest,
  detectedAt: Date = new Date(),
): MisconceptionRecord {
  return {
    topic: request.melcTopic,
    melcCompetency: request.melcCompetency ?? request.melcTopic,
    misconceptionType: response.misconception_type,
    specificWrongBelief: response.specific_wrong_belief,
    detectedAt,
    gradeLevel: request.gradeLevel,
  };
}
