/**
 * Misconception Detection orchestration (spec 5.9).
 *
 * detectMisconception ties the pieces together against the real Suri AI stack:
 *   OFFLINE (Tier 3): taxonomy keyword lookup only \u2014 SmolLM2 cannot reliably
 *     diagnose, so a matched pre-written explanation is served (spec 10.1 #5).
 *   ONLINE: retrieve MELC grounding -> build the detection prompt (seeded with
 *     the topic's known wrong beliefs) -> complete through the shared 3-tier
 *     primitive -> parse -> enforce the confidence bar (Socratic fallback below it).
 *
 * Dependencies are injectable (generate / retrieve / getTier) so the whole flow
 * is exercisable headlessly with fakes; the defaults wire the real stack.
 */
import { generateWithPrompt } from '@/ai/generate';
import { getNetworkTier, type NetworkTier } from '@/ai/networkTier';
import { retrieveTopK } from '@/db/ragStore';

import {
  CONFIDENCE_THRESHOLD,
  MISCONCEPTION_TEMPERATURE,
  ONLINE_MAX_TOKENS,
} from '../constants/misconceptionDefaults';
import type {
  MisconceptionDetectionRequest,
  MisconceptionDetectionResponse,
  MisconceptionTierId,
} from '../types/misconception.types';
import { buildMisconceptionPrompt } from './misconceptionPromptBuilder';
import {
  applyConfidenceThreshold,
  buildNoMisconceptionResponse,
  buildOfflineResponseFromTaxonomy,
  parseMisconceptionResponse,
} from './misconceptionParser';
import { findTaxonomyMatch } from './misconceptionTaxonomyLookup';

/** Map a network tier to the stored tier id (1/2/3). */
export function tierIdForTier(tier: NetworkTier): MisconceptionTierId {
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

/** A minimal completion result the detector needs from its generate dependency. */
export interface DetectGenerateResult {
  text: string;
  tier: NetworkTier;
}

/** Injectable dependencies (default to the real Suri AI stack). */
export interface DetectMisconceptionDeps {
  /** Complete a system+user prompt. Defaults to generateWithPrompt. */
  generate?: (args: {
    system: string;
    user: string;
    maxTokens?: number;
    temperature?: number;
    ragChunks?: string[];
    onToken?: (token: string) => void;
    signal?: AbortSignal;
  }) => Promise<DetectGenerateResult>;
  /** Retrieve top-k MELC passages. Defaults to ragStore.retrieveTopK (texts only). */
  retrieve?: (query: string, gradeLevel: number, k: number) => Promise<string[]>;
  /** Resolve the current network tier. Defaults to getNetworkTier. */
  getTier?: () => Promise<NetworkTier>;
  /** Streamed token callback for the online path. */
  onToken?: (token: string) => void;
  /** Cancellation signal. */
  signal?: AbortSignal;
  /** Override the confidence bar (defaults to CONFIDENCE_THRESHOLD). */
  confidenceThreshold?: number;
}

const defaultGenerate: NonNullable<DetectMisconceptionDeps['generate']> = async (args) => {
  const { text, tier } = await generateWithPrompt(args);
  return { text, tier };
};

const defaultRetrieve: NonNullable<DetectMisconceptionDeps['retrieve']> = async (
  query,
  gradeLevel,
  k,
) => {
  const { texts } = await retrieveTopK(query, gradeLevel, k);
  return texts;
};

/** Number of MELC passages to ground detection in (online). */
const DETECTION_TOP_K = 3;

/**
 * Detect whether a student's message reveals a specific misconception.
 *
 * Always resolves with a response: has_misconception=false means "diagnose
 * nothing, proceed normally", which the caller uses to fall through to a normal
 * explanation or a Socratic check.
 */
export async function detectMisconception(
  request: MisconceptionDetectionRequest,
  deps: DetectMisconceptionDeps = {},
): Promise<MisconceptionDetectionResponse> {
  const generate = deps.generate ?? defaultGenerate;
  const retrieve = deps.retrieve ?? defaultRetrieve;
  const getTier = deps.getTier ?? getNetworkTier;
  const threshold = deps.confidenceThreshold ?? CONFIDENCE_THRESHOLD;

  const tier: NetworkTier = request.isOffline ? 'offline' : await getTier();

  // --- OFFLINE: taxonomy lookup only ---------------------------------------
  if (tier === 'offline') {
    const match = findTaxonomyMatch(request.studentMessage, request.melcTopic);
    return match
      ? buildOfflineResponseFromTaxonomy(match.entry, request)
      : buildNoMisconceptionResponse(request, 3);
  }

  // --- ONLINE: RAG-grounded AI diagnosis -----------------------------------
  let passages = request.melcPassages ?? [];
  if (passages.length === 0) {
    try {
      passages = await retrieve(request.melcTopic, request.gradeLevel, DETECTION_TOP_K);
    } catch {
      passages = [];
    }
  }

  const { systemPrompt, userPrompt } = buildMisconceptionPrompt({
    ...request,
    melcPassages: passages,
  });

  let result: DetectGenerateResult;
  try {
    result = await generate({
      system: systemPrompt,
      user: userPrompt,
      maxTokens: ONLINE_MAX_TOKENS,
      temperature: MISCONCEPTION_TEMPERATURE,
      ragChunks: passages,
      onToken: deps.onToken,
      signal: deps.signal,
    });
  } catch (error) {
    if (deps.signal?.aborted) {
      throw error;
    }
    // Generation failed entirely: degrade to the offline taxonomy path.
    const match = findTaxonomyMatch(request.studentMessage, request.melcTopic);
    return match
      ? buildOfflineResponseFromTaxonomy(match.entry, request)
      : buildNoMisconceptionResponse(request, 3);
  }

  const parsed = parseMisconceptionResponse(
    result.text,
    request,
    tierIdForTier(result.tier),
  );
  return applyConfidenceThreshold(parsed, threshold);
}
