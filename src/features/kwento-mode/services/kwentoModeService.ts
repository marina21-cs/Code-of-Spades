/**
 * Kwento Mode orchestration (spec 5.8).
 *
 * generateKwento ties the pieces together against the REAL Suri AI stack:
 *   1. retrieve MELC grounding via the local RAG store (retrieveTopK)
 *   2. probe the network tier to decide online vs offline prompt shape
 *   3. build the system + user prompt (full online, or compact offline)
 *   4. complete through the shared 3-tier primitive (generateWithPrompt)
 *   5. parse + validate the JSON into a KwentoModeResponse
 *   6. cache it for offline reuse (best-effort)
 *
 * Exposed as plain async functions to match the repo's service convention
 * (streakService, ragStore, responseCache).
 */
import { generateWithPrompt } from '@/ai/generate';
import { getNetworkTier, type NetworkTier } from '@/ai/networkTier';
import { retrieveTopK } from '@/db/ragStore';

import {
  KWENTO_TEMPERATURE,
  OFFLINE_MAX_TOKENS,
  ONLINE_MAX_TOKENS,
} from '../constants/kwentoDefaults';
import type {
  KwentoModeRequest,
  KwentoModeResponse,
  KwentoTierId,
} from '../types/kwento.types';
import { saveKwento } from './kwentoCache';
import { buildLocalKwento } from './kwentoFallbackContent';
import { buildKwentoOfflinePrompt, buildKwentoPrompt } from './kwentoPromptBuilder';
import { parseKwentoResponse } from './kwentoParser';

// Re-export the pure difficulty stepping so callers can import it from the
// service while the logic itself stays headlessly verifiable (difficultyLogic).
export { getNextDifficulty } from './difficultyLogic';

/** Streaming + cancellation callbacks for a generation. */
export interface GenerateKwentoCallbacks {
  onToken?: (token: string) => void;
  signal?: AbortSignal;
}

/** Map the network tier the answer came from to the stored tier id (1/2/3). */
export function tierIdForTier(tier: NetworkTier): KwentoTierId {
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

/**
 * Generate one kwento end-to-end. Retrieves its own MELC grounding (so callers
 * don't have to pre-populate request.melcPassages) and degrades to the compact
 * offline prompt + on-device model when there is no signal.
 */
export async function generateKwento(
  request: KwentoModeRequest,
  callbacks: GenerateKwentoCallbacks = {},
): Promise<KwentoModeResponse> {
  // Decide offline up front so we pick the right prompt SHAPE (the compact
  // offline prompt fits the 256-token on-device context; the full prompt does not).
  const tier: NetworkTier = request.isOffline ? 'offline' : await getNetworkTier();
  const offline = tier === 'offline';

  // RAG grounding: 1 passage offline (token budget), 3 online. Fall back to any
  // passages the caller supplied if retrieval comes back empty.
  const retrieved = await retrieveTopK(request.melcTopic, request.gradeLevel, offline ? 1 : 3);
  const melcPassages = retrieved.texts.length > 0 ? retrieved.texts : request.melcPassages;

  const enrichedRequest: KwentoModeRequest = { ...request, melcPassages, isOffline: offline };

  const { systemPrompt, userPrompt } = offline
    ? buildKwentoOfflinePrompt(enrichedRequest)
    : buildKwentoPrompt(enrichedRequest);

  const result = await generateWithPrompt({
    system: systemPrompt,
    user: userPrompt,
    maxTokens: offline ? OFFLINE_MAX_TOKENS : ONLINE_MAX_TOKENS,
    temperature: KWENTO_TEMPERATURE,
    forceOffline: offline,
    ragChunks: melcPassages,
    onToken: callbacks.onToken,
    signal: callbacks.signal,
  });

  const tierId = tierIdForTier(result.tier);
  let kwento = parseKwentoResponse(result.text, enrichedRequest, tierId);

  // When the model could not be reached (cloud cascade exhausted, or offline with
  // no on-device SLM), generateWithPrompt returns plain prose instead of JSON, so
  // the parser degrades to a fallback with an EMPTY solution. An empty
  // `suliranin_sagot` is the reliable signal for that (a valid parse always has a
  // non-empty one). In that case serve a complete, curriculum-grounded local
  // kwento so the student still gets a real, solvable story — not an empty shell.
  if (kwento.suliranin_sagot.trim().length === 0) {
    kwento = buildLocalKwento(enrichedRequest, tierId);
  }

  // Cache for offline reuse / session continuity — never fail generation on a
  // cache write error.
  try {
    await saveKwento(kwento);
  } catch {
    // best-effort
  }

  return kwento;
}
