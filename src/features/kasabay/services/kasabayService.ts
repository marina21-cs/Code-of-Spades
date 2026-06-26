/**
 * Kasabay Mode interruption orchestration (spec 5.10).
 *
 * handleInterruption is what runs when the student pauses the focus timer to ask
 * for help. It ties the pieces together against the real Suri AI stack:
 *   1. probe the network tier (online vs the compact on-device path)
 *   2. retrieve MELC grounding via the local RAG store
 *   3. run Misconception Detection (rule #3) so a confused question is diagnosed,
 *      not just answered
 *   4. build the Kasabay persona prompt (with the misconception note if any)
 *   5. complete through the shared 3-tier primitive (generateWithPrompt)
 *
 * Exposed as a plain async function to match the repo's service convention. The
 * misconception detector is injectable for tests; defaults wire the real one.
 */
import { generateWithPrompt } from '@/ai/generate';
import { getNetworkTier, type NetworkTier } from '@/ai/networkTier';
import { retrieveTopK } from '@/db/ragStore';
import { detectMisconception } from '@/features/misconception/services/misconceptionDetector';
import type { MisconceptionDetectionResponse } from '@/features/misconception/types/misconception.types';

import {
  KASABAY_MAX_TOKENS,
  KASABAY_OFFLINE_MAX_TOKENS,
  KASABAY_TEMPERATURE,
} from '../constants/kasabayDefaults';
import type {
  KasabayInterruptionRequest,
  KasabayInterruptionResponse,
  KasabayTierId,
} from '../types/kasabay.types';
import { buildKasabayOfflinePrompt, buildKasabayPrompt } from './kasabayPromptBuilder';

/** Map a network tier to the stored tier id (1/2/3). */
export function tierIdForTier(tier: NetworkTier): KasabayTierId {
  switch (tier) {
    case 'strong':
      return 1;
    case 'weak':
      return 2;
    case 'offline':
    default:
      return 3;
  }
}

/** Streaming + cancellation + detector-injection options. */
export interface HandleInterruptionDeps {
  onToken?: (token: string) => void;
  signal?: AbortSignal;
  /** Run Misconception Detection before replying (rule #3). Defaults to true. */
  runMisconceptionCheck?: boolean;
  /** Override the detector (tests). Defaults to detectMisconception. */
  detect?: typeof detectMisconception;
}

/** RAG depth: 1 passage offline (token budget), 3 online. */
function topKFor(offline: boolean): number {
  return offline ? 1 : 3;
}

/**
 * Handle a study-timer interruption: diagnose, ground, and reply as a peer who
 * just looked up from her own textbook. Always ends by asking whether the
 * student is ready to resume the timer (promptToResume = true, rule #4).
 */
export async function handleInterruption(
  request: KasabayInterruptionRequest,
  deps: HandleInterruptionDeps = {},
): Promise<KasabayInterruptionResponse> {
  const tier: NetworkTier = request.isOffline ? 'offline' : await getNetworkTier();
  const offline = tier === 'offline';

  // RAG grounding (fall back to caller-supplied passages if retrieval is empty).
  let passages = request.melcPassages ?? [];
  if (passages.length === 0) {
    try {
      passages = (await retrieveTopK(request.melcTopic, request.gradeLevel, topKFor(offline))).texts;
    } catch {
      passages = [];
    }
  }

  const enriched: KasabayInterruptionRequest = {
    ...request,
    melcPassages: passages,
    isOffline: offline,
  };

  // Misconception Detection (rule #3). Best-effort: a failure never blocks help.
  let misconception: MisconceptionDetectionResponse | null = null;
  if (deps.runMisconceptionCheck !== false) {
    const detect = deps.detect ?? detectMisconception;
    try {
      const result = await detect(
        {
          studentMessage: request.studentMessage,
          melcTopic: request.melcTopic,
          gradeLevel: request.gradeLevel,
          melcPassages: passages,
          language: request.language,
          isOffline: offline,
        },
        { signal: deps.signal },
      );
      misconception = result.has_misconception ? result : null;
    } catch {
      misconception = null;
    }
  }

  const { systemPrompt, userPrompt } = offline
    ? buildKasabayOfflinePrompt(enriched)
    : buildKasabayPrompt(enriched, misconception);

  const { text, tier: usedTier } = await generateWithPrompt({
    system: systemPrompt,
    user: userPrompt,
    maxTokens: offline ? KASABAY_OFFLINE_MAX_TOKENS : KASABAY_MAX_TOKENS,
    temperature: KASABAY_TEMPERATURE,
    forceOffline: offline,
    ragChunks: passages,
    onToken: deps.onToken,
    signal: deps.signal,
  });

  return {
    reply: text.trim(),
    misconception,
    tierId: tierIdForTier(usedTier),
    promptToResume: true,
  };
}
