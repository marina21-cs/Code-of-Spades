/**
 * Quiz (Pagsusulit) generation service.
 *
 * Mirrors the Kwento service pattern against the real AI stack:
 *   1. retrieve MELC grounding for the topic via the local RAG store
 *   2. build a strict JSON multiple-choice prompt (language-aware via the
 *      student's profile, so it honors the Pure Filipino / Taglish / English
 *      setting)
 *   3. complete through the shared 3-tier primitive (generateWithPrompt), which
 *      checks connectivity then runs the cloud cascade Gemini → Groq →
 *      OpenRouter (tier 1 first) and degrades on-device only when offline
 *   4. parse + validate the JSON into QuizQuestion[]
 *
 * Pure-ish service module (no JSX); only depends on the AI + RAG layers.
 */
import { generateWithPrompt } from '@/ai/generate';
import { retrieveTopK } from '@/db/ragStore';
import type { LanguagePreference, LearningProfile } from '@/profile/types';

import { QuizGenerationError, type Quiz, type QuizQuestion } from './types';

/** Default number of questions per quiz. */
export const DEFAULT_QUIZ_LENGTH = 5;
/** Token budget for generation — enough for ~5 grounded MCQs with rationales. */
const QUIZ_MAX_TOKENS = 1100;
/** Slightly higher than chat so distractors vary, but still grounded. */
const QUIZ_TEMPERATURE = 0.5;

export interface GenerateQuizOptions {
  profile: LearningProfile;
  /** Topic to quiz on (e.g. "Photosynthesis"). Falls back to the subject. */
  topic?: string;
  /** How many questions to generate. Default DEFAULT_QUIZ_LENGTH. */
  count?: number;
  signal?: AbortSignal;
}

/** Per-language instruction for the question + choice text. */
function languageDirective(language: LanguagePreference): string {
  switch (language) {
    case 'tagalog':
      return 'Isulat ang mga tanong, pagpipilian, at paliwanag sa MALINIS na Filipino (Tagalog). Gumamit ng Ingles lamang para sa mga teknikal na termino.';
    case 'english':
      return 'Write the questions, choices, and explanations in clear, simple English suited to a Filipino learner.';
    case 'taglish':
    default:
      return 'Write the questions, choices, and explanations in natural Taglish — conversational Filipino that code-switches with English for technical terms.';
  }
}

/** Build the strict-JSON quiz prompt (system + user). */
export function buildQuizPrompt(
  profile: LearningProfile,
  topic: string,
  count: number,
  passages: string[],
): { system: string; user: string } {
  const grounding =
    passages.length > 0
      ? passages.map((p, i) => `[${i + 1}] ${p}`).join('\n')
      : '(walang karagdagang konteksto — gumamit ng pangkalahatang kaalaman sa DepEd MELC)';

  const system = [
    `You are Suri, generating a multiple-choice quiz (pagsusulit) for a Grade ${profile.gradeLevel} Filipino student following the DepEd K-12 MELC curriculum.`,
    languageDirective(profile.languagePreference),
    'Ground every question in the CURRICULUM SOURCES below; do not invent facts outside DepEd MELC scope.',
    '',
    'CURRICULUM SOURCES (MELC):',
    grounding,
    '',
    'OUTPUT CONTRACT — read carefully:',
    `- Return ONLY a raw JSON array of exactly ${count} objects. No prose, no markdown, no code fence.`,
    '- Each object: {"question": string, "choices": [string, string, string, string], "correctIndex": number, "explanation": string}',
    '- "choices" MUST have exactly 4 distinct options. "correctIndex" is the 0-based index (0-3) of the one correct option.',
    '- Exactly one option is correct; the other three are plausible distractors.',
    '- "explanation" is 1-2 sentences saying why the correct answer is right.',
    '- Keep language age-appropriate for the grade. Every question must be different.',
  ].join('\n');

  const user = `Generate a ${count}-question multiple-choice quiz about "${topic}" for a Grade ${profile.gradeLevel} student. Return ONLY the JSON array.`;

  return { system, user };
}

/** Remove a leading/trailing markdown code fence (```json ... ```), if present. */
function stripCodeFence(raw: string): string {
  return raw
    .replace(/```json\s*/gi, '')
    .replace(/```/g, '')
    .trim();
}

/** Extract the first top-level JSON array substring, tolerating leading prose. */
function extractJsonArray(text: string): string {
  const start = text.indexOf('[');
  const end = text.lastIndexOf(']');
  if (start !== -1 && end !== -1 && end > start) {
    return text.slice(start, end + 1);
  }
  return text;
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

/** Validate + normalize one raw object into a QuizQuestion, or null if invalid. */
function coerceQuestion(raw: unknown): QuizQuestion | null {
  if (typeof raw !== 'object' || raw === null) {
    return null;
  }
  const obj = raw as Record<string, unknown>;
  const question = obj.question;
  const choices = obj.choices;
  const correctIndex = obj.correctIndex;
  const explanation = obj.explanation;

  if (!isNonEmptyString(question)) {
    return null;
  }
  if (!Array.isArray(choices)) {
    return null;
  }
  const cleanChoices = choices.filter(isNonEmptyString).map((c) => c.trim());
  if (cleanChoices.length !== 4) {
    return null;
  }
  const idx = typeof correctIndex === 'number' ? Math.trunc(correctIndex) : -1;
  if (idx < 0 || idx > 3) {
    return null;
  }

  return {
    question: question.trim(),
    choices: cleanChoices,
    correctIndex: idx,
    explanation: isNonEmptyString(explanation) ? explanation.trim() : '',
  };
}

/** Parse a raw model response into validated questions (best-effort, never throws). */
export function parseQuiz(rawResponse: string): QuizQuestion[] {
  let parsed: unknown;
  try {
    parsed = JSON.parse(extractJsonArray(stripCodeFence(rawResponse)));
  } catch {
    return [];
  }
  if (!Array.isArray(parsed)) {
    return [];
  }
  const questions: QuizQuestion[] = [];
  for (const item of parsed) {
    const q = coerceQuestion(item);
    if (q) {
      questions.push(q);
    }
  }
  return questions;
}

/** Unique-enough id for a generated quiz. */
function generateQuizId(): string {
  return `quiz_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

/**
 * Generate one quiz end-to-end. Retrieves its own MELC grounding for the topic,
 * runs the cloud-first cascade (tier 1 / Gemini first), and parses the JSON.
 *
 * @throws QuizGenerationError when no valid questions could be produced (e.g.
 *         fully offline with no model, or an unparseable response) so the screen
 *         can show a friendly retry.
 */
export async function generateQuiz(options: GenerateQuizOptions): Promise<Quiz> {
  const { profile, signal } = options;
  const count = options.count ?? DEFAULT_QUIZ_LENGTH;
  const topic = (options.topic ?? profile.subject ?? 'Agham (Science)').trim();

  // RAG grounding for the topic (top-3, same as the online chat tier).
  const retrieved = await retrieveTopK(topic, profile.gradeLevel, 3);

  const { system, user } = buildQuizPrompt(profile, topic, count, retrieved.texts);

  const result = await generateWithPrompt({
    system,
    user,
    maxTokens: QUIZ_MAX_TOKENS,
    temperature: QUIZ_TEMPERATURE,
    ragChunks: retrieved.texts,
    signal,
  });

  const questions = parseQuiz(result.text);
  if (questions.length === 0) {
    throw new QuizGenerationError(
      'Hindi makabuo ng pagsusulit ngayon. Kailangan ng internet para sa bagong pagsusulit — subukan muli.',
    );
  }

  return {
    id: generateQuizId(),
    topic,
    gradeLevel: profile.gradeLevel,
    questions: questions.slice(0, count),
  };
}
