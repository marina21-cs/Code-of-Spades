/**
 * Public AI router. Wires the real (native) collaborators into the pure
 * executeRoute() orchestration and exposes a single routeMessage() entry point.
 *
 * Streaming, network detection, retrieval, caching, the cloud path, and the
 * offline SLM fallback all flow through here. The cloud path is now an ORDERED
 * cascade of named providers — Gemini → Groq → OpenRouter — built client-side
 * (see cloudCascade.buildCloudProviders), with the optional legacy server proxy
 * appended last. With nothing configured, routing still succeeds by degrading to
 * cache and then the on-device fallback.
 */
import { buildSystemPrompt } from '@/profile/systemPrompt';
import { retrieveTopK } from '@/db/ragStore';

import { getNetworkTier } from './networkTier';
import { cacheResponse, getCachedResponse } from './responseCache';
import { runLocalModel } from './localModel';
import { buildCloudProviders } from './cloudCascade';
import { executeRoute } from './routerCore';
import type { ProviderHandle, RouteDeps, RouteOptions, RouteResult } from './routerCore';

/**
 * The cloud tier is now an ORDERED cascade of named providers — Gemini → Groq →
 * OpenRouter — each included only when its EXPO_PUBLIC_* key is set, with the
 * optional legacy server proxy appended LAST. Returns an empty list when nothing
 * is configured, so the router degrades to cache then the on-device SLM. The
 * ordering itself lives in cloudCascade.buildCloudProviders so generate.ts can
 * reuse the exact same list.
 */
async function getProviders(): Promise<ProviderHandle[]> {
  return buildCloudProviders();
}

const deps: RouteDeps = {
  getNetworkTier,
  retrieve: async (query, gradeLevel, k) => (await retrieveTopK(query, gradeLevel, k)).texts,
  buildPrompt: (profile, ragChunks) => buildSystemPrompt(profile, ragChunks),
  getCached: getCachedResponse,
  putCached: cacheResponse,
  getProviders,
  runLocalModel,
};

/**
 * Route a student message through the 3-tier cascade, streaming tokens via the
 * provided callbacks. Resolves with the final text, tier, and source.
 */
export async function routeMessage(options: RouteOptions): Promise<RouteResult> {
  return executeRoute(options, deps);
}

export type { RouteOptions, RouteResult } from './routerCore';
