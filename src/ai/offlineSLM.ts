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

import { setLocalModelRunner } from './localModel';
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

let context: LlamaContext | null = null;
let initPromise: Promise<LlamaContext> | null = null;

/** Whether the SLM context is loaded and ready for inference. */
export function isSLMReady(): boolean {
  return context != null;
}

/**
 * Load the SLM into memory with the lite config. Safe to call repeatedly;
 * concurrent callers share one initialization. Throws if the model file is
 * missing.
 */
export async function prewarmSLM(): Promise<void> {
  if (context) {
    return;
  }
  if (initPromise) {
    await initPromise;
    return;
  }

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

  try {
    await initPromise;
  } finally {
    initPromise = null;
  }
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

/**
 * Register the SLM as the AI router's Tier-3 runner — but ONLY if the model is
 * already downloaded. When it isn't, the router keeps its extractive fallback.
 * The router supplies the system prompt + user message (already grounded), so
 * this runner does not re-retrieve.
 */
export async function maybeRegisterSLM(): Promise<boolean> {
  if (!(await isModelDownloaded())) {
    return false;
  }
  setLocalModelRunner(({ system, user, onToken, signal }) =>
    completeWithSLM(system, user, { onToken, signal }),
  );
  return true;
}
