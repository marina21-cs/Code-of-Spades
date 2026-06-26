/**
 * Misconception Detection prompt construction (pure).
 *
 * Fills the {{PLACEHOLDER}} tokens in MISCONCEPTION_SYSTEM_PROMPT and injects the
 * topic's known wrong beliefs (from the local taxonomy) as detection hints, then
 * assembles the matching user prompt from the student's message. No native
 * imports -> headlessly verifiable.
 */
import {
  DEFAULT_MISCONCEPTION_LANGUAGE,
  MISCONCEPTION_SYSTEM_PROMPT,
} from '../constants/misconceptionDefaults';
import type {
  MisconceptionDetectionRequest,
  MisconceptionLanguage,
} from '../types/misconception.types';
import { entriesForTopic } from './misconceptionTaxonomyLookup';

export interface BuiltMisconceptionPrompt {
  systemPrompt: string;
  userPrompt: string;
}

/** Replace EVERY occurrence of each {{KEY}} token (tokens repeat in the template). */
function fillTemplate(template: string, values: Record<string, string>): string {
  let result = template;
  for (const [key, value] of Object.entries(values)) {
    result = result.split(`{{${key}}}`).join(value);
  }
  return result;
}

/** Render the topic's known misconceptions as a compact, model-readable list. */
export function buildTaxonomyHints(topic: string): string {
  const entries = entriesForTopic(topic);
  if (entries.length === 0) {
    return '(none catalogued for this topic \u2014 diagnose from the message itself)';
  }
  return entries
    .map((entry) => `- [${entry.misconceptionType}] ${entry.wrongBelief}`)
    .join('\n');
}

/** Resolve the language register the explanation should be written in. */
export function resolveLanguage(
  request: MisconceptionDetectionRequest,
): MisconceptionLanguage {
  return request.language ?? DEFAULT_MISCONCEPTION_LANGUAGE;
}

/** Build the full (online) Misconception Detection system + user prompt. */
export function buildMisconceptionPrompt(
  request: MisconceptionDetectionRequest,
): BuiltMisconceptionPrompt {
  const language = resolveLanguage(request);
  const passages = request.melcPassages ?? [];

  const systemPrompt = fillTemplate(MISCONCEPTION_SYSTEM_PROMPT, {
    GRADE_LEVEL: String(request.gradeLevel),
    MELC_TOPIC: request.melcTopic,
    LANGUAGE_PREFERENCE: language,
    EXPECTED_ANSWER: request.expectedAnswer ?? '(not applicable \u2014 open dialogue)',
    MELC_PASSAGES: passages.length > 0 ? passages.join('\n\n') : '(no passage retrieved)',
    TAXONOMY_HINTS: buildTaxonomyHints(request.melcTopic),
  });

  const competency = request.melcCompetency
    ? `\nMELC Competency: ${request.melcCompetency}`
    : '';
  const expected = request.expectedAnswer
    ? `\nExpected answer: ${request.expectedAnswer}`
    : '';

  const userPrompt =
    `A Grade ${request.gradeLevel} student said the following about "${request.melcTopic}".${competency}${expected}\n\n` +
    `Student: "${request.studentMessage}"\n\n` +
    `Analyze ONLY this message. If it reveals a specific wrong belief, diagnose it and explain in ${language}. ` +
    `If you are not confident, set has_misconception=false with a low confidence. Respond with JSON only.`;

  return { systemPrompt, userPrompt };
}
