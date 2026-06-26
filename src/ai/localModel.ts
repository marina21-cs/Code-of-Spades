/**
 * Tier 3 (offline) on-device model seam.
 *
 * The production implementation is the quantized SmolLM2-135M SLM via llama.rn
 * (spec 5.2 Tier 3), which is a separate, heavier task. To keep that pluggable,
 * the real runner is registered at runtime via setLocalModelRunner(). Until it
 * is, runLocalModel() falls back to an EXTRACTIVE responder that returns the
 * top retrieved MELC passage — so the offline path is still grounded and the
 * cascade is end-to-end functional for development and demos.
 *
 * This is intentionally NOT a generative model; it is an honest interim that
 * never fabricates content beyond the retrieved curriculum text.
 */

export interface LocalModelParams {
  system: string;
  user: string;
  ragChunks: string[];
  onToken?: (token: string) => void;
  signal?: AbortSignal;
}

export type LocalModelRunner = (params: LocalModelParams) => Promise<string>;

let registeredRunner: LocalModelRunner | null = null;

/** Register the real on-device model runner (e.g. the llama.rn SmolLM2 wrapper). */
export function setLocalModelRunner(runner: LocalModelRunner | null): void {
  registeredRunner = runner;
}

/** Whether a real generative on-device model has been registered. */
export function hasLocalModel(): boolean {
  return registeredRunner != null;
}

/** Run the on-device model, or the extractive fallback if none is registered. */
export async function runLocalModel(params: LocalModelParams): Promise<string> {
  if (registeredRunner) {
    return registeredRunner(params);
  }
  return runExtractiveFallback(params);
}

/**
 * Extractive grounding fallback: returns the top retrieved MELC passage as the
 * answer (streamed word-by-word so the UI still sees a token stream), or an
 * honest "offline, no local model" message when there is no grounding. It never
 * fabricates content beyond the retrieved curriculum text.
 *
 * Exported and reusable so the offline SLM path can degrade to it cleanly when
 * the on-device model hits an out-of-memory / load failure on a budget 2GB
 * device (spec 10) instead of crashing the router. Behavior is identical to the
 * original private fallback.
 */
export async function runExtractiveFallback(params: LocalModelParams): Promise<string> {
  const { user, ragChunks, onToken } = params;
  const top = ragChunks[0]?.trim();

  const answer = top
    ? `Habang offline tayo, ito ang nakita ko sa iyong reviewer: ${top}`
    : `Naka-offline tayo ngayon at wala pang na-download na lokal na modelo, kaya hindi ko pa masagot nang buo ang tanong na "${user}". Subukan ulit kapag may signal, o i-download ang offline model.`;

  // Stream word-by-word so the UI behaves like a real token stream.
  const words = answer.split(' ');
  let full = '';
  for (let i = 0; i < words.length; i += 1) {
    if (params.signal?.aborted) {
      break;
    }
    const piece = i === 0 ? words[i] : ` ${words[i]}`;
    full += piece;
    onToken?.(piece);
  }
  return full;
}
