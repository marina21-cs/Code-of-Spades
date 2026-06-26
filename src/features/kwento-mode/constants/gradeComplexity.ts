/**
 * Grade-band narrative complexity specs for Kwento Mode (spec 5.8).
 *
 * The complexity envelope (character count, dialogue, sentence cap, whether
 * abstract reasoning is required) is folded into the system prompt so a Grade 1
 * story stays a single-character, single-step, ~5-sentence narrative while a
 * Grade 12 story can integrate multiple concepts across up to 18 sentences.
 * Pure data module.
 */
import type { GradeComplexitySpec } from '../types/kwento.types';

export const GRADE_COMPLEXITY: GradeComplexitySpec[] = [
  {
    gradeBand: 'Grade 1-2',
    grades: [1, 2],
    maxCharacters: 1,
    maxSettings: 1,
    problemType: 'one-step, concrete objects, addition/subtraction only',
    maxSentences: 5,
    dialogueAllowed: false,
    variablesAllowed: false,
    abstractReasoningRequired: false,
  },
  {
    gradeBand: 'Grade 3-4',
    grades: [3, 4],
    maxCharacters: 2,
    maxSettings: 1,
    problemType: 'two-step, familiar units, multiplication/division introduced',
    maxSentences: 8,
    dialogueAllowed: true,
    variablesAllowed: false,
    abstractReasoningRequired: false,
  },
  {
    gradeBand: 'Grade 5-6',
    grades: [5, 6],
    maxCharacters: 3,
    maxSettings: 2,
    problemType: 'multi-step, fractions, ratios, basic variables',
    maxSentences: 12,
    dialogueAllowed: true,
    variablesAllowed: true,
    abstractReasoningRequired: false,
  },
  {
    gradeBand: 'Grade 7-8',
    grades: [7, 8],
    maxCharacters: 4,
    maxSettings: 2,
    problemType: 'multi-variable, algebraic setup, cause-effect relationships',
    maxSentences: 14,
    dialogueAllowed: true,
    variablesAllowed: true,
    abstractReasoningRequired: false,
  },
  {
    gradeBand: 'Grade 9-10',
    grades: [9, 10],
    maxCharacters: 5,
    maxSettings: 3,
    problemType: 'complex word problem, requires analysis, proof or explanation',
    maxSentences: 16,
    dialogueAllowed: true,
    variablesAllowed: true,
    abstractReasoningRequired: true,
  },
  {
    gradeBand: 'Grade 11-12',
    grades: [11, 12],
    maxCharacters: 6,
    maxSettings: 3,
    problemType: 'multi-concept integration, synthesis, real-world application',
    maxSentences: 18,
    dialogueAllowed: true,
    variablesAllowed: true,
    abstractReasoningRequired: true,
  },
];

/**
 * Resolve the complexity spec for a grade level. Out-of-range grades clamp to
 * the nearest band (Grade 1-2 below the range, Grade 11-12 above it) rather than
 * silently defaulting to the easiest band.
 */
export function getComplexitySpec(gradeLevel: number): GradeComplexitySpec {
  const match = GRADE_COMPLEXITY.find((spec) => spec.grades.includes(gradeLevel));
  if (match) {
    return match;
  }
  return gradeLevel >= 11
    ? GRADE_COMPLEXITY[GRADE_COMPLEXITY.length - 1]
    : GRADE_COMPLEXITY[0];
}
