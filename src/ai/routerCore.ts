/**
 * Pure orchestration core for the 3-tier AI router.
 *
 * executeRoute() contains the actual shipping decision logic but takes ALL of
 * its collaborators (network probe, retrieval, cache, providers, local model)
 * as injected dependencies. That keeps it free of native imports so the exact
 * production branching can be verified headlessly with mocks. aiRouter.ts wires
 * the real implementations in.
 *
 * Routing (spec 5.2):
 *   offline -> serve cache, else on-device SLM (top-5 RAG)
 *   weak    -> reduced payload (top-1 RAG, 150 tokens) through the cloud cascade
 *   strong  -> full payload (top-3 RAG) through the cloud cascade
 *   cloud cascade exhausted -> degrade to cache, then on-device SLM
 */
import type { LearningProfile } from '@/profile/types';
import type { NetworkTier } from './networkTier';
import { maxTokensForNetworkTier, topKForNetworkTier } from './routerPolicy';

export interface ProviderHandle {
  id: string;
  stream: (args: {
    system: string;
    user: string;
    maxTokens: number;
    onToken?: (token: string) => void;
    signal?: AbortSignal;
  }) => Promise<string>;
}

export interface RouteCallbacks {
  onToken?: (token: string) => void;
  onDone?: (full: string, tier: NetworkTier) => void;
  onError?: (error: Error) => void;
  onTierChange?: (tier: NetworkTier) => void;
}

export interface RouteOptions extends RouteCallbacks {
  message: string;
  profile: LearningProfile;
  signal?: AbortSignal;
}

export interface RouteDeps {
  getNetworkTier: () => Promise<NetworkTier>;
  retrieve: (query: string, gradeLevel: number, k: number) => Promise<string[]>;
  buildPrompt: (profile: LearningProfile, ragChunks: string[]) => string;
  getCached: (query: string) => Promise<string | null>;
  putCached: (query: string, response: string, provider: string) => Promise<void>;
  getProviders: () => Promise<ProviderHandle[]>;
  runLocalModel: (args: {
    system: string;
    user: string;
    ragChunks: string[];
    onToken?: (token: string) => void;
    signal?: AbortSignal;
  }) => Promise<string>;
}

/** Where the answer ultimately came from: a provider id, the cache, or local. */
export type RouteSource = 'cache' | 'local' | string;

export interface RouteResult {
  text: string;
  tier: NetworkTier;
  source: RouteSource;
}

export async function executeRoute(options: RouteOptions, deps: RouteDeps): Promise<RouteResult> {
  const { message, profile, onToken, onDone, onError, onTierChange, signal } = options;
  const gradeLevel = profile.gradeLevel;

  try {
    const tier = await deps.getNetworkTier();
    onTierChange?.(tier);

    if (tier === 'offline') {
      return await serveOffline({
        message,
        profile,
        gradeLevel,
        deps,
        onToken,
        onDone,
        signal,
        cacheTier: 'offline',
      });
    }

    // Online: strong or weak. Condense payload according to tier.
    const k = topKForNetworkTier(tier);
    const maxTokens = maxTokensForNetworkTier(tier);
    const ragChunks = await deps.retrieve(message, gradeLevel, k);
    const system = deps.buildPrompt(profile, ragChunks);

    const providers = await deps.getProviders();
    for (const provider of providers) {
      try {
        const full = await provider.stream({ system, user: message, maxTokens, onToken, signal });
        await safePutCached(deps, message, full, provider.id);
        onDone?.(full, tier);
        return { text: full, tier, source: provider.id };
      } catch (err) {
        // Caller aborted: stop the cascade and surface it.
        if (signal?.aborted) {
          throw err;
        }
        // Otherwise fail over to the next provider.
      }
    }

    // Every provider failed (or none configured) — degrade gracefully.
    return await serveOffline({
      message,
      profile,
      gradeLevel,
      deps,
      onToken,
      onDone,
      signal,
      cacheTier: tier,
      onTierChange,
    });
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    onError?.(err);
    throw err;
  }
}

interface ServeOfflineArgs {
  message: string;
  profile: LearningProfile;
  gradeLevel: number;
  deps: RouteDeps;
  onToken?: (token: string) => void;
  onDone?: (full: string, tier: NetworkTier) => void;
  signal?: AbortSignal;
  /** Tier to report when a cache hit is served. */
  cacheTier: NetworkTier;
  /** When degrading from online, announce the drop to offline before the SLM. */
  onTierChange?: (tier: NetworkTier) => void;
}

/** Cache-first, then on-device SLM. Shared by the offline tier and degradation. */
async function serveOffline(args: ServeOfflineArgs): Promise<RouteResult> {
  const { message, profile, gradeLevel, deps, onToken, onDone, signal, cacheTier, onTierChange } = args;

  const cached = await deps.getCached(message);
  if (cached != null) {
    emitAsStream(cached, onToken);
    onDone?.(cached, cacheTier);
    return { text: cached, tier: cacheTier, source: 'cache' };
  }

  // No cache: announce the drop to local (if degrading) and run the SLM with
  // expanded grounding (top-5) to compensate for the smaller model.
  onTierChange?.('offline');
  const ragChunks = await deps.retrieve(message, gradeLevel, topKForNetworkTier('offline'));
  const system = deps.buildPrompt(profile, ragChunks);
  const full = await deps.runLocalModel({ system, user: message, ragChunks, onToken, signal });
  onDone?.(full, 'offline');
  return { text: full, tier: 'offline', source: 'local' };
}

/** Stream a stored string back word-by-word so cached hits behave like a live stream. */
function emitAsStream(text: string, onToken?: (token: string) => void): void {
  if (!onToken) {
    return;
  }
  const words = text.split(' ');
  words.forEach((word, index) => {
    onToken(index === 0 ? word : ` ${word}`);
  });
}

/** Cache writes must never fail a successful response. */
async function safePutCached(
  deps: RouteDeps,
  query: string,
  response: string,
  provider: string,
): Promise<void> {
  try {
    await deps.putCached(query, response, provider);
  } catch {
    // Non-fatal: caching is best-effort.
  }
}
