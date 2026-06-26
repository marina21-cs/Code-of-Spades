/**
 * Core System Prompt Builder.
 *
 * buildSystemPrompt() turns a LearningProfile + retrieved MELC passages into the
 * single system prompt prepended to EVERY LLM call across all three signal tiers
 * (spec 5.6 / 8). The same function runs for cloud and on-device inference, so
 * personalization costs zero extra compute — only different instructions.
 *
 * Pure module (no native imports) → fully unit-testable headlessly.
 */
import type { AccessibilitySettings, LearningProfile, ResponseMode } from './types';

/** Word cap applied in Focus Mode (spec 5.6: responses capped at ~120 words). */
export const FOCUS_MODE_WORD_LIMIT = 120;

const PERSONA = [
  'You are Suri, an offline-first study companion for Filipino learners following the DepEd K-12 curriculum.',
  'Be warm, encouraging, and never condescending. Favor a Socratic nudge: ask one short guiding question before revealing the full answer when it helps the student think.',
  'Respond in the language the student uses and support natural Filipino/English code-switching (Taglish). Keep examples locally relevant to the Philippines.',
].join('\n');

/**
 * Distinct instruction block per response mode. Each is meaningfully different
 * so that, holding everything else equal, the five modes yield five different
 * system prompts (verified in verifyProfile / verify-profile.mjs).
 */
const MODE_INSTRUCTIONS: Record<ResponseMode, string> = {
  visual: [
    'RESPONSE MODE — VISUAL:',
    '- Lead with a visual. For any concept that can be shown, emit a structured diagram/chart spec the app can render (bar or line chart, number line, labeled science diagram, or simple map).',
    '- Keep prose short and have each paragraph reference the visual (e.g. "As the diagram shows, ...").',
    '- Prefer one clear visual over several competing ones.',
  ].join('\n'),
  auditory: [
    'RESPONSE MODE — AUDITORY:',
    '- Write to be read ALOUD by text-to-speech. Use full, flowing sentences and a natural spoken rhythm.',
    '- Do NOT use bullet points, numbered lists, tables, headings, or markdown symbols — they sound wrong when spoken.',
    '- Use commas and periods to pace natural pauses instead of punctuation a screen reader skips.',
  ].join('\n'),
  reading: [
    'RESPONSE MODE — READING / WRITING:',
    '- Use structured, note-takeable text: a one-line definition first, then bullet points or numbered steps.',
    '- Bold each key term once. Keep every bullet to a single idea.',
    '- End with a short 2-3 item recap the student can copy into their notes.',
  ].join('\n'),
  kinesthetic: [
    'RESPONSE MODE — KINESTHETIC:',
    '- Keep explanations short and hands-on. Before explaining fully, invite the student to DO something first: a tap-to-reveal guess, a drag-and-drop ordering, or a quick "try this" step.',
    '- Reveal the full explanation only after prompting the student to act, so the learning stays active.',
  ].join('\n'),
  mixed: [
    'RESPONSE MODE — MIXED:',
    '- Balance modalities by topic complexity: a short visual for spatial ideas, clean prose for narrative ideas, and a brief structured recap.',
    '- Default to clarity; never overload a single answer with every format at once.',
  ].join('\n'),
};

/** Map a numeric grade to age-appropriate language guidance. */
function gradeGuidance(gradeLevel: number): string {
  let band: string;
  if (gradeLevel <= 6) {
    band =
      'Use simple, concrete vocabulary and short sentences. Introduce any new term with an everyday example.';
  } else if (gradeLevel <= 10) {
    band =
      'Use clear language, introduce subject-specific terms correctly, and you may walk through multi-step reasoning.';
  } else {
    band = 'Use precise academic vocabulary suitable for senior-high-school review.';
  }
  return `GRADE LEVEL: The student is in Grade ${gradeLevel}. ${band}`;
}

/**
 * Code/visual/math formatting contract. Contextual: in auditory mode markdown is
 * suppressed because the answer is spoken; otherwise code and visual specs use
 * fenced blocks the app can detect and render.
 */
function formattingContract(mode: ResponseMode): string {
  if (mode === 'auditory') {
    return [
      'FORMATTING:',
      '- This answer will be spoken aloud: do not output code blocks, tables, or markdown. If code is unavoidable, describe it step by step in plain words.',
    ].join('\n');
  }
  return [
    'FORMATTING:',
    '- Wrap any code in a fenced markdown block with a language tag (e.g. ```python).',
    '- To render a visual, output exactly one fenced ```json block containing the diagram spec and nothing after it.',
    '- Write math with plain, app-renderable symbols; avoid LaTeX-only constructs.',
  ].join('\n');
}

/**
 * Accessibility directives that actually change MODEL OUTPUT. readerFont and
 * highContrast are intentionally omitted — they are purely presentational and
 * handled by the UI layer, not the prompt.
 */
function accessibilityDirectives(settings: AccessibilitySettings): string {
  const lines: string[] = [];

  if (settings.focusMode) {
    lines.push(
      `- FOCUS MODE: Keep every response under ${FOCUS_MODE_WORD_LIMIT} words and to a single idea. If more detail is needed, finish by offering to continue, and add one short encouraging line.`,
    );
  }
  if (settings.colorVision !== 'standard') {
    lines.push(
      `- COLOR VISION (${settings.colorVision}): Any diagram spec must use a ${settings.colorVision}-safe palette and must never rely on color alone — always add text labels or patterns.`,
    );
  }
  if (settings.largeText) {
    lines.push(
      '- LARGE TEXT: Keep sentences compact and avoid wide tables that overflow when the font is scaled up.',
    );
  }
  if (settings.lowMotion) {
    lines.push(
      '- LOW MOTION: Prefer static visuals; do not describe or request animations.',
    );
  }

  if (lines.length === 0) {
    return '';
  }
  return ['ACCESSIBILITY DIRECTIVES:', ...lines].join('\n');
}

/**
 * Render retrieved MELC passages as a markdown numbered list that grounds the
 * answer. When nothing was retrieved, instruct the model to avoid guessing.
 */
function ragSection(ragChunks: string[]): string {
  if (!ragChunks || ragChunks.length === 0) {
    return [
      'CURRICULUM SOURCES (MELC): none were retrieved for this question.',
      '- If you are not confident the answer is covered by the DepEd MELC curriculum, say so plainly and ask a guiding question instead of inventing facts.',
    ].join('\n');
  }

  const list = ragChunks
    .map((chunk, index) => `${index + 1}. ${chunk.trim()}`)
    .join('\n');

  return [
    'CURRICULUM SOURCES (MELC) — ground your answer ONLY in these passages:',
    list,
    '- If the sources do not cover the question, say what is missing rather than inventing facts.',
    '- When you use a source, refer to it naturally (e.g. "based on your reviewer ...").',
  ].join('\n');
}

/**
 * Distinct LANGUAGE directive per language preference (spec 5.8). Each value
 * yields a meaningfully different instruction, so the same profile rendered in
 * a different language produces a different system prompt.
 */
function languageDirective(language: LearningProfile['languagePreference']): string {
  switch (language) {
    case 'tagalog':
      return 'LANGUAGE: Respond entirely in Tagalog (Filipino). Use English only for unavoidable technical terms, and briefly gloss them in Filipino.';
    case 'taglish':
      return 'LANGUAGE: Respond in natural Taglish — conversational Filipino that code-switches with English for technical terms, the way many Filipino students actually speak.';
    case 'english':
      return 'LANGUAGE: Respond in clear, simple English suited to a Filipino learner; you may briefly clarify a difficult term in Filipino when it helps.';
  }
}

/**
 * Build the full system prompt for a single inference.
 *
 * @param profile   the student's learning profile (mode + accessibility + grade)
 * @param ragChunks top-k retrieved MELC passages (may be empty offline)
 */
export function buildSystemPrompt(profile: LearningProfile, ragChunks: string[] = []): string {
  const { responseMode, accessibilitySettings, gradeLevel, languagePreference } = profile;

  const sections = [
    PERSONA,
    gradeGuidance(gradeLevel),
    languageDirective(languagePreference),
    MODE_INSTRUCTIONS[responseMode],
    formattingContract(responseMode),
    accessibilityDirectives(accessibilitySettings),
    ragSection(ragChunks),
  ].filter((section) => section.length > 0);

  return sections.join('\n\n');
}
