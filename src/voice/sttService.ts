/**
 * 3-tier speech-to-text manager (spec 5.7).
 *
 *   online + Groq key : record audio (expo-av) -> Groq Whisper API -> text
 *   offline / no key   : native OS recognition (expo-speech-recognition)
 *
 * Native modules are imported lazily so the engine-selection policy stays
 * importable in non-RN contexts. The Groq API key is reused from the AI router's
 * secure provider config (no separate key).
 */
import { getApiKey } from '@/ai/providerConfig';
import { getNetworkTier } from '@/ai/networkTier';

import {
  GROQ_WHISPER_MODEL,
  GROQ_WHISPER_URL,
  type STTEngine,
  selectSTTEngine,
} from './sttPolicy';

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
let recordingHandle: { stopAndUnloadAsync: () => Promise<void>; getURI: () => string | null } | null = null;
let nativeStop: (() => Promise<STTResult>) | null = null;

/** Whether a listening session is currently active. */
export function isListening(): boolean {
  return currentEngine != null;
}

/** Decide which engine to use right now (tier + key availability). */
export async function resolveEngine(): Promise<STTEngine> {
  const [tier, groqKey] = await Promise.all([getNetworkTier(), getApiKey('groq')]);
  return selectSTTEngine(tier, Boolean(groqKey));
}

/**
 * Begin a listening session. For Groq this starts an audio recording; for the
 * native engine it starts live recognition (with optional partial results).
 */
export async function startListening(
  options: { lang?: string } & STTCallbacks = {},
): Promise<STTEngine> {
  if (currentEngine) {
    throw new Error('STT session already in progress.');
  }
  const lang = options.lang ?? DEFAULT_LANG;
  currentEngine = await resolveEngine();

  try {
    if (currentEngine === 'groq') {
      await startGroqRecording();
    } else {
      await startNativeRecognition(lang, options);
    }
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
    if (engine === 'native') {
      const result = nativeStop ? await nativeStop() : { text: '', engine };
      return result;
    }
    const uri = await stopGroqRecording();
    const text = uri ? await transcribeWithGroq(uri, DEFAULT_LANG) : '';
    return { text, engine };
  } finally {
    currentEngine = null;
    nativeStop = null;
    recordingHandle = null;
  }
}

// --- Groq (record + upload) ------------------------------------------------

async function startGroqRecording(): Promise<void> {
  const { Audio } = await import('expo-av');
  const permission = await Audio.requestPermissionsAsync();
  if (!permission.granted) {
    throw new Error('Microphone permission denied.');
  }
  await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
  const { recording } = await Audio.Recording.createAsync(
    Audio.RecordingOptionsPresets.HIGH_QUALITY,
  );
  recordingHandle = recording;
}

async function stopGroqRecording(): Promise<string | null> {
  if (!recordingHandle) {
    return null;
  }
  await recordingHandle.stopAndUnloadAsync();
  return recordingHandle.getURI();
}

/** Upload a recorded audio file to Groq Whisper and return the transcript. */
export async function transcribeWithGroq(uri: string, lang: string = DEFAULT_LANG): Promise<string> {
  const apiKey = await getApiKey('groq');
  if (!apiKey) {
    throw new Error('Groq API key not configured.');
  }

  const form = new FormData();
  // React Native FormData file shape:
  form.append('file', { uri, name: 'speech.m4a', type: 'audio/m4a' } as unknown as Blob);
  form.append('model', GROQ_WHISPER_MODEL);
  form.append('language', lang.split('-')[0]);
  form.append('response_format', 'json');

  const response = await fetch(GROQ_WHISPER_URL, {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}` },
    body: form,
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => '');
    throw new Error(`Groq Whisper failed: HTTP ${response.status} ${detail}`.trim());
  }
  const json = (await response.json()) as { text?: string };
  return (json.text ?? '').trim();
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
