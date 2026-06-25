/**
 * Speech-to-text routing policy (pure) for the 3-tier STT manager (spec 5.7).
 *
 *   online (strong/weak) + Groq key  -> Groq Whisper API (fast, Filipino+English)
 *   otherwise                        -> native OS recognition (expo-speech-recognition)
 *
 * No native imports -> testable headlessly.
 */
import type { NetworkTier } from '../ai/networkTier';

export type STTEngine = 'groq' | 'native';

/** Groq Whisper transcription endpoint + model (OpenAI-compatible audio API). */
export const GROQ_WHISPER_URL = 'https://api.groq.com/openai/v1/audio/transcriptions';
export const GROQ_WHISPER_MODEL = 'whisper-large-v3-turbo';

/**
 * Choose the transcription engine. Groq is preferred only when there is signal
 * AND a key is available; everything else (offline, or no key) uses the native
 * recognizer so voice input always has a working path.
 */
export function selectSTTEngine(tier: NetworkTier, hasGroqKey: boolean): STTEngine {
  if ((tier === 'strong' || tier === 'weak') && hasGroqKey) {
    return 'groq';
  }
  return 'native';
}
