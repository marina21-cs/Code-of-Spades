/**
 * Adapter: plug Misconception Detection (spec 5.9) into Kwento Mode (spec 5.8).
 *
 * useKwentoMode exposes an OPTIONAL analyzer seam (KwentoMisconceptionAnalyzer)
 * so a wrong answer can be diagnosed before the generic "wrong" state. This
 * factory produces that analyzer, mapping the hook's compact input/result to a
 * full MisconceptionDetectionRequest/Response. Pass the result of
 * createKwentoMisconceptionAnalyzer() as useKwentoMode({ analyzeMisconception }).
 */
import type {
  KwentoMisconceptionAnalyzer,
  KwentoMisconceptionInput,
  KwentoMisconceptionResult,
} from '@/features/kwento-mode/hooks/useKwentoMode';

import type { MisconceptionDetectionRequest } from '../types/misconception.types';
import { detectMisconception, type DetectMisconceptionDeps } from './misconceptionDetector';

/**
 * Build a KwentoMisconceptionAnalyzer backed by detectMisconception. `deps` are
 * forwarded to the detector (injectable generate/retrieve for tests; defaults
 * wire the real AI stack).
 */
export function createKwentoMisconceptionAnalyzer(
  deps: DetectMisconceptionDeps = {},
): KwentoMisconceptionAnalyzer {
  return async (input: KwentoMisconceptionInput): Promise<KwentoMisconceptionResult> => {
    const request: MisconceptionDetectionRequest = {
      studentMessage: input.studentAnswer,
      expectedAnswer: input.expectedSolution,
      melcTopic: input.melcTopic,
      gradeLevel: input.gradeLevel,
      // KwentoLanguage and MisconceptionLanguage share the same members.
      language: input.language,
    };

    const response = await detectMisconception(request, deps);

    return {
      hasMisconception: response.has_misconception,
      explanation: response.has_misconception ? response.targeted_explanation : undefined,
      misconceptionType: response.misconception_type ?? undefined,
    };
  };
}
