/**
 * Speech-to-text manager (spec 5.7) — native on-device recognition.
 *
 * Cloud Whisper (Groq) STT required an API key ON THE CLIENT. After the security
 * refactor that moved every provider key to the server proxy, the client no
 * longer holds that key, so STT now uses the native OS recognizer
 * (expo-speech-recognition) for all tiers — voice input always has a working,
 * offline-capable path.
 *
 * To re-enable cloud Whisper, add a dedicated audio-transcription endpoint to the
 * proxy (it streams chat completions today, not audio) and switch resolveEngine()
 * back to the tiered policy in sttPolicy.ts. The pure policy + endpoint constants
 * are intentionally kept there for that follow-up.
 *
 * Native modules are imported lazily so this module stays importable in non-RN
 * contexts.
 */
import type { STTEngine } from './sttPolicy';

export interface STTResult {
  text: string;
  engine: STTEngine;
}

export interface STTCallbacks {
  onPartial?: (text: string) => void;
  onResult?: (result: STTResult) => void;
  onError?: (error: Error) => void;
}

const DEFAULT_LANG = 'fil-PH';

let currentEngine: STTEngine | null = null;
let nativeStop: (() => Promise<STTResult>) | null = null;

/** Whether a listening session is currently active. */
export function isListening(): boolean {
  return currentEngine != null;
}

/**
 * Resolve the STT engine. The client always uses the native recognizer now that
 * the Groq Whisper key lives only on the server proxy (see module header).
 */
export async function resolveEngine(): Promise<STTEngine> {
  return 'native';
}

/** Begin a native live-recognition session (with optional partial results). */
export async function startListening(
  options: { lang?: string } & STTCallbacks = {},
): Promise<STTEngine> {
  if (currentEngine) {
    throw new Error('STT session already in progress.');
  }
  const lang = options.lang ?? DEFAULT_LANG;
  currentEngine = await resolveEngine();

  try {
    await startNativeRecognition(lang, options);
  } catch (err) {
    currentEngine = null;
    throw err;
  }
  return currentEngine;
}

/** Stop the active session and resolve the transcript. */
export async function stopListening(): Promise<STTResult> {
  const engine = currentEngine;
  if (!engine) {
    throw new Error('No STT session in progress.');
  }

  try {
    return nativeStop ? await nativeStop() : { text: '', engine };
  } finally {
    currentEngine = null;
    nativeStop = null;
  }
}

// --- Native OS recognition -------------------------------------------------

async function startNativeRecognition(
  lang: string,
  callbacks: STTCallbacks,
): Promise<void> {
  const speechRecognition = await import('expo-speech-recognition');
  const { ExpoSpeechRecognitionModule } = speechRecognition;

  const permission = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
  if (!permission.granted) {
    throw new Error('Speech recognition permission denied.');
  }

  let finalText = '';
  const subscriptions: Array<{ remove: () => void }> = [];

  subscriptions.push(
    ExpoSpeechRecognitionModule.addListener('result', (event: { results?: Array<{ transcript: string }> }) => {
      const transcript = event.results?.[0]?.transcript ?? '';
      finalText = transcript;
      callbacks.onPartial?.(transcript);
    }),
  );
  subscriptions.push(
    ExpoSpeechRecognitionModule.addListener('error', (event: { message?: string }) => {
      callbacks.onError?.(new Error(event.message ?? 'Speech recognition error'));
    }),
  );

  ExpoSpeechRecognitionModule.start({
    lang,
    interimResults: true,
    continuous: false,
  });

  nativeStop = async () => {
    ExpoSpeechRecognitionModule.stop();
    subscriptions.forEach((s) => s.remove());
    const result: STTResult = { text: finalText.trim(), engine: 'native' };
    callbacks.onResult?.(result);
    return result;
  };
}
