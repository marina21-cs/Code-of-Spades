/**
 * Tier 3 offline inference core: SmolLM2-135M via llama.rn.
 *
 * Memory guardrails for budget 2GB devices (spec 10 — the Android OOM killer):
 *   n_ctx = 256       small KV cache, fed only the most relevant grounding
 *   n_threads = 2     never starve the UI thread on old quad-core chips
 *   use_mlock = false do NOT pin RAM; let Android page rather than force-close
 *   n_gpu_layers = 0  CPU by default; the build auto-detects Vulkan when capable
 *
 * llama.rn is imported lazily so this module (and the router that depends on it)
 * loads without the native binding present until inference is actually needed.
 */
import type { LlamaContext } from 'llama.rn';

import { buildSystemPrompt } from '@/profile/systemPrompt';
import { retrieveTopK } from '@/db/ragStore';
import type { LearningProfile } from '@/profile/types';

import { runExtractiveFallback, setLocalModelRunner } from './localModel';
import { getModelPath, isModelDownloaded } from './modelManager';
import { SLM_STOP_WORDS, formatChatML } from './slmPrompt';

/** Extreme-lite configuration (spec 10). */
export const SLM_CONFIG = {
  nCtx: 256,
  nThreads: 2,
  useMlock: false,
  nGpuLayers: 0,
  nPredict: 200,
  temperature: 0.4,
  topK: 40,
  topP: 0.95,
} as const;

/** Offline expands retrieval to top-5 to compensate for the smaller model. */
export const OFFLINE_TOP_K = 5;

export class SLMNotDownloadedError extends Error {
  constructor() {
    super('SmolLM2 model is not downloaded. Download it via the model manager first.');
    this.name = 'SLMNotDownloadedError';
  }
}

/**
 * Raised when the on-device SLM fails to load or run because the device ran out
 * of memory (spec 10 — the Android OOM killer on budget 2GB devices). Callers
 * treat this as recoverable: free the context and degrade to the extractive
 * grounding fallback rather than crashing the router.
 */
export class SLMOutOfMemoryError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SLMOutOfMemoryError';
  }
}

/**
 * Substrings (matched against the lowercased error message) that mark a
 * recoverable on-device inference failure — almost always the Android OOM
 * killer or a GGUF load/mmap allocation failure on a budget 2GB device
 * (spec 10). When any of these appears we free the SLM context and degrade to
 * the extractive fallback instead of letting the router throw.
 */
const SLM_RECOVERABLE_ERROR_SIGNATURES = [
  'out of memory',
  'oom',
  'alloc',
  'failed to load',
  'mmap',
  'cannot allocate',
  'std::bad_alloc',
] as const;

/**
 * Null-safe classifier: returns true when `err` looks like a recoverable
 * out-of-memory / model-load failure (see SLM_RECOVERABLE_ERROR_SIGNATURES).
 * Accepts anything — Error, string, an object with a `message`, or null/
 * undefined — and never throws.
 */
export function isRecoverableSLMError(err: unknown): boolean {
  const rawMessage =
    err instanceof Error
      ? err.message
      : typeof err === 'string'
        ? err
        : err && typeof err === 'object' && 'message' in err
          ? String((err as { message?: unknown }).message ?? '')
          : '';
  const message = rawMessage.toLowerCase();
  if (!message) {
    return false;
  }
  return SLM_RECOVERABLE_ERROR_SIGNATURES.some((signature) => message.includes(signature));
}

let context: LlamaContext | null = null;
let initPromise: Promise<LlamaContext> | null = null;

/** Whether the SLM context is loaded and ready for inference. */
export function isSLMReady(): boolean {
  return context != null;
}

/**
 * Load the SmolLM2-135M-Instruct Q4_K_M GGUF into memory with the extreme-lite
 * config (n_ctx 256, n_threads 2, no mlock, CPU layers) and return the live
 * llama.rn context. Safe to call repeatedly; concurrent callers share one
 * initialization. Throws SLMNotDownloadedError if the model file is missing.
 */
export async function initLocalModel(): Promise<LlamaContext> {
  if (context) {
    return context;
  }
  if (!initPromise) {
    initPromise = (async () => {
      if (!(await isModelDownloaded())) {
        throw new SLMNotDownloadedError();
      }
      const { initLlama } = await import('llama.rn');
      const ctx = await initLlama({
        model: getModelPath(),
        n_ctx: SLM_CONFIG.nCtx,
        n_threads: SLM_CONFIG.nThreads,
        use_mlock: SLM_CONFIG.useMlock,
        use_mmap: true,
        n_gpu_layers: SLM_CONFIG.nGpuLayers,
      });
      context = ctx;
      return ctx;
    })();
  }

  try {
    return await initPromise;
  } finally {
    initPromise = null;
  }
}

/**
 * Load the SLM into memory with the lite config. Safe to call repeatedly;
 * concurrent callers share one initialization. Throws if the model file is
 * missing. Thin void-returning alias over initLocalModel() — used to pre-warm
 * the model ~30s after app load (spec 5.2 Tier 3).
 */
export async function prewarmSLM(): Promise<void> {
  await initLocalModel();
}

/** Release the SLM and free its memory. */
export async function releaseSLM(): Promise<void> {
  if (context) {
    await context.release();
    context = null;
  }
}

/** Core completion: format ChatML, stream tokens, return the full text. */
async function completeWithSLM(
  system: string,
  user: string,
  callbacks: { onToken?: (token: string) => void; signal?: AbortSignal } = {},
): Promise<string> {
  if (!context) {
    await prewarmSLM();
  }
  const ctx = context;
  if (!ctx) {
    throw new SLMNotDownloadedError();
  }

  const prompt = formatChatML(system, user);
  let streamed = '';

  const result = await ctx.completion(
    {
      prompt,
      n_predict: SLM_CONFIG.nPredict,
      temperature: SLM_CONFIG.temperature,
      top_k: SLM_CONFIG.topK,
      top_p: SLM_CONFIG.topP,
      stop: SLM_STOP_WORDS,
    },
    (data: { token?: string }) => {
      if (callbacks.signal?.aborted) {
        return;
      }
      const token = data?.token;
      if (token) {
        streamed += token;
        callbacks.onToken?.(token);
      }
    },
  );

  return (result?.text ?? streamed).trim();
}

export interface OfflineInferenceParams {
  message: string;
  profile: LearningProfile;
  onToken?: (token: string) => void;
  onDone?: (full: string) => void;
  signal?: AbortSignal;
}

/**
 * Run a fully offline inference: retrieve top-5 MELC grounding, build the
 * profile-aware system prompt, and stream the SmolLM2 completion.
 */
export async function runOfflineInference(params: OfflineInferenceParams): Promise<string> {
  const { message, profile, onToken, onDone, signal } = params;

  const ragChunks = (await retrieveTopK(message, profile.gradeLevel, OFFLINE_TOP_K)).texts;
  const system = buildSystemPrompt(profile, ragChunks);
  const full = await completeWithSLM(system, message, { onToken, signal });

  onDone?.(full);
  return full;
}

export interface LocalResponseParams {
  /** Top-k MELC passages retrieved for grounding (spec 5.2 Tier 3 uses top-5). */
  ragContext: string[];
  /** The student's question / instruction. */
  userPrompt: string;
  /**
   * Optional learning profile. When provided, the full profile-aware system
   * prompt is used; otherwise a minimal RAG-grounded prompt is built so callers
   * can drive the SLM with just context + prompt.
   */
  profile?: LearningProfile;
  onToken?: (token: string) => void;
  signal?: AbortSignal;
}

/** Minimal grounding prompt used when no learning profile is supplied. */
function buildGroundedSystemPrompt(ragContext: string[]): string {
  const grounding =
    ragContext.length > 0
      ? ragContext.map((chunk, i) => `[${i + 1}] ${chunk}`).join('\n')
      : '(walang karagdagang konteksto)';
  return (
    'Ikaw si Suri, isang offline na study companion para sa mga mag-aaral na Pilipino. ' +
    'Sumagot nang maikli at tama gamit LAMANG ang curriculum context sa ibaba. ' +
    'Kung kulang ang konteksto, sabihin ito nang tapat.\n\n' +
    `MELC context:\n${grounding}`
  );
}

/**
 * Generate a fully on-device response from the top-k MELC RAG context and the
 * user prompt. Inference stays within the extreme-lite caps (n_ctx 256,
 * n_threads 2) enforced at init by initLocalModel(), so it is safe on budget
 * 2GB devices. Lazily initializes the model on first use and streams tokens via
 * onToken. Throws SLMNotDownloadedError if the model is not on disk.
 */
export async function generateLocalResponse(params: LocalResponseParams): Promise<string> {
  const { ragContext, userPrompt, profile, onToken, signal } = params;
  const system = profile
    ? buildSystemPrompt(profile, ragContext)
    : buildGroundedSystemPrompt(ragContext);
  return completeWithSLM(system, userPrompt, { onToken, signal });
}

/**
 * Register the SLM as the AI router's Tier-3 runner — but ONLY if the model is
 * already downloaded. When it isn't, the router keeps its extractive fallback.
 * The router supplies the system prompt + user message (already grounded), so
 * this runner does not re-retrieve.
 *
 * OOM-safe (spec 10): the registered runner wraps the SLM completion in a
 * try/catch. If inference fails with a recoverable out-of-memory / load error
 * (see isRecoverableSLMError), it frees the context, deregisters itself so
 * subsequent calls fall straight through to the extractive fallback, and still
 * answers the CURRENT request with grounded curriculum text via
 * runExtractiveFallback — degrading cleanly instead of crashing the router.
 * Non-recoverable errors are rethrown unchanged.
 */
export async function maybeRegisterSLM(): Promise<boolean> {
  if (!(await isModelDownloaded())) {
    return false;
  }
  setLocalModelRunner(async ({ system, user, ragChunks, onToken, signal }) => {
    try {
      return await completeWithSLM(system, user, { onToken, signal });
    } catch (err) {
      if (isRecoverableSLMError(err)) {
        // Budget-device OOM / load failure: free the context, deregister so
        // future calls use the extractive fallback, then still return grounded
        // curriculum text for THIS request instead of throwing.
        await releaseSLM();
        setLocalModelRunner(null);
        return await runExtractiveFallback({ system, user, ragChunks, onToken, signal });
      }
      throw err;
    }
  });
  return true;
}
