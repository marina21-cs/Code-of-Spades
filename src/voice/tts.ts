/**
 * Text-to-speech wrapper over expo-speech (spec 5.7).
 *
 * Cleans markdown out of the text before speaking so the OS TTS engine reads
 * natural prose. Works offline on iOS; on Android depends on the installed TTS
 * engine (Google TTS on most devices).
 */
import * as Speech from 'expo-speech';

import { cleanMarkdownForSpeech } from './speechText';

export interface SpeakOptions {
  /** BCP-47 language tag. Defaults to Filipino. */
  language?: string;
  /** 0.1 .. ~2.0 */
  rate?: number;
  /** 0.5 .. 2.0 */
  pitch?: number;
  voice?: string;
  onStart?: () => void;
  onDone?: () => void;
  onStopped?: () => void;
  onError?: (error: unknown) => void;
}

export const DEFAULT_TTS_LANGUAGE = 'fil-PH';

/**
 * Speak text aloud after stripping markdown. Resolves once speech has been
 * dispatched (not when it finishes — use onDone for completion).
 */
export function speak(text: string, options: SpeakOptions = {}): string | null {
  const clean = cleanMarkdownForSpeech(text);
  if (!clean) {
    return null;
  }

  Speech.speak(clean, {
    language: options.language ?? DEFAULT_TTS_LANGUAGE,
    rate: options.rate ?? 1.0,
    pitch: options.pitch ?? 1.0,
    voice: options.voice,
    onStart: options.onStart,
    onDone: options.onDone,
    onStopped: options.onStopped,
    onError: options.onError,
  });

  return clean;
}

/** Stop any in-progress speech. */
export function stopSpeaking(): Promise<void> {
  return Speech.stop();
}

export function pauseSpeaking(): Promise<void> {
  return Speech.pause();
}

export function resumeSpeaking(): Promise<void> {
  return Speech.resume();
}

export function isSpeakingAsync(): Promise<boolean> {
  return Speech.isSpeakingAsync();
}

/** Available device voices (for picking a Filipino/English voice upstream). */
export function getAvailableVoices() {
  return Speech.getAvailableVoicesAsync();
}
