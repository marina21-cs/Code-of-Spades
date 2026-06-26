/**
 * Generic single-shot completion with a caller-supplied prompt.
 *
 * The main router (aiRouter.ts / routeMessage) always builds the STANDARD,
 * profile-aware system prompt and grounds it with RAG — perfect for the chat
 * tab, but wrong for features that need their own bespoke prompt (Kwento Mode,
 * and later Misconception Detection). generateWithPrompt() reuses the same
 * online-vs-offline behaviour — run the cloud cascade when online, on-device SLM
 * (or the extractive fallback) when offline or when every provider fails — but
 * takes the system + user prompt verbatim. It deliberately does NOT touch
 * response_cache; features that cache (Kwento) own their own storage.
 *
 * The cloud cascade is the SAME ordered list the router uses — Gemini → Groq →
 * OpenRouter, then the optional server proxy — built by cloudCascade so the
 * ordering is defined once. On all-fail it degrades to the on-device path.
 */
import { buildCloudProviders, cascadeStream } from './cloudCascade';
import { getNetworkTier, type NetworkTier } from './networkTier';
import { runLocalModel } from './localModel';

export interface GenerateOptions {
  /** The full system prompt, built by the calling feature. */
  system: string;
  /** The user/instruction message. */
  user: string;
  /** Output token cap (proxy-side). Defaults to the proxy default. */
  maxTokens?: number;
  /**
   * Sampling temperature. NOTE: the client-side provider cascade streams through
   * routerCore's ProviderHandle, which carries no temperature, so this currently
   * reaches the cloud only via streamOpenAICompatible's shared default. Kept for
   * signature stability and future use. See cloudCascade / openaiStream.
   */
  temperature?: number;
  /** Streamed token callback, fired for both cloud and on-device paths. */
  onToken?: (token: string) => void;
  /** Cancellation signal. Aborts the in-flight request. */
  signal?: AbortSignal;
  /**
   * Force the offline (on-device) path regardless of connectivity. Used by
   * Kwento Mode's offline mode so the smaller, JSON-lite prompt is honoured.
   */
  forceOffline?: boolean;
  /**
   * Optional grounding passages forwarded to the on-device runner so the
   * extractive fallback (no SLM downloaded) still has curriculum text to lean on.
   */
  ragChunks?: string[];
}

/**
 * Where the completion ultimately came from: a cloud provider id ('gemini',
 * 'groq', 'openrouter', or the legacy 'proxy') or the on-device model ('local').
 */
export type GenerateSource = 'proxy' | 'local' | string;

export interface GenerateResult {
  text: string;
  tier: NetworkTier;
  source: GenerateSource;
}

/** Cloud token cap when the caller doesn't specify one (matches the proxy default). */
const DEFAULT_MAX_TOKENS = 800;

/** Run the on-device model (or extractive fallback) with the given prompt. */
async function runOffline(options: GenerateOptions): Promise<GenerateResult> {
  const text = await runLocalModel({
    system: options.system,
    user: options.user,
    ragChunks: options.ragChunks ?? [],
    onToken: options.onToken,
    signal: options.signal,
  });
  return { text, tier: 'offline', source: 'local' };
}

/**
 * Complete a prompt. Resolves with the final text, the tier it was served from,
 * and the source (the cloud provider id that served it, or 'local').
 *
 * Online (strong/weak): run the ordered cloud cascade (Gemini → Groq →
 * OpenRouter, then the optional server proxy). On ANY all-providers failure
 * (nothing configured, HTTP error, network) degrade to the on-device path.
 * Offline (or forceOffline): go straight to the on-device path.
 */
export async function generateWithPrompt(options: GenerateOptions): Promise<GenerateResult> {
  const tier: NetworkTier = options.forceOffline ? 'offline' : await getNetworkTier();

  if (tier === 'offline') {
    return runOffline(options);
  }

  const providers = buildCloudProviders();
  if (providers.length > 0) {
    try {
      const { text, source } = await cascadeStream(providers, {
        system: options.system,
        user: options.user,
        maxTokens: options.maxTokens ?? DEFAULT_MAX_TOKENS,
        onToken: options.onToken,
        signal: options.signal,
      });
      return { text, tier, source };
    } catch (error) {
      // Caller aborted: surface it rather than silently degrading.
      if (options.signal?.aborted) {
        throw error;
      }
      // Every cloud provider failed — fall through to the on-device path.
    }
  }

  // No cloud provider configured, or the whole cascade failed — degrade offline.
  return runOffline(options);
}
