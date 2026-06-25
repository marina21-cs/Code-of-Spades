/**
 * Public AI router. Wires the real (native) collaborators into the pure
 * executeRoute() orchestration and exposes a single routeMessage() entry point.
 *
 * Streaming, network detection, retrieval, caching, the provider cascade, and
 * the offline SLM fallback all flow through here. With no API keys configured,
 * routing still succeeds by degrading to cache and then the on-device fallback.
 */
import { buildSystemPrompt } from '@/profile/systemPrompt';
import { retrieveTopK } from '@/db/ragStore';

import { streamChatCompletion } from './cloudClient';
import { getNetworkTier } from './networkTier';
import { cacheResponse, getCachedResponse } from './responseCache';
import { runLocalModel } from './localModel';
import { PROVIDERS, PROVIDER_CASCADE, getApiKey } from './providerConfig';
import { executeRoute } from './routerCore';
import type { ProviderHandle, RouteDeps, RouteOptions, RouteResult } from './routerCore';

/** Build streaming handles for every provider that currently has a key. */
async function getProviders(): Promise<ProviderHandle[]> {
  const handles: ProviderHandle[] = [];

  for (const id of PROVIDER_CASCADE) {
    const config = PROVIDERS[id];
    // eslint-disable-next-line no-await-in-loop
    const apiKey = await getApiKey(id);
    if (!apiKey) {
      continue;
    }

    handles.push({
      id,
      stream: ({ system, user, maxTokens, onToken, signal }) =>
        streamChatCompletion({
          baseURL: config.baseURL,
          apiKey,
          model: config.model,
          maxTokens,
          onToken,
          signal,
          messages: [
            { role: 'system', content: system },
            { role: 'user', content: user },
          ],
          // OpenRouter recommends attribution headers for free-tier traffic.
          extraHeaders:
            id === 'openrouter'
              ? { 'HTTP-Referer': 'https://suri.app', 'X-Title': 'Suri' }
              : undefined,
        }),
    });
  }

  return handles;
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
