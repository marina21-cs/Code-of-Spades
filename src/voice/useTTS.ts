/**
 * Headless reactive controller for text-to-speech. Logic only (no UI).
 */
import { useCallback, useEffect, useRef, useState } from 'react';

import { type SpeakOptions, isSpeakingAsync, speak, stopSpeaking } from './tts';

export interface UseTTSResult {
  isSpeaking: boolean;
  error: unknown;
  speak: (text: string, options?: SpeakOptions) => void;
  stop: () => void;
}

export function useTTS(): UseTTSResult {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [error, setError] = useState<unknown>(null);

  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      void stopSpeaking();
    };
  }, []);

  const safeSet = useCallback(<T,>(setter: (v: T) => void, value: T) => {
    if (mountedRef.current) {
      setter(value);
    }
  }, []);

  const speakText = useCallback(
    (text: string, options: SpeakOptions = {}) => {
      setError(null);
      const dispatched = speak(text, {
        ...options,
        onStart: () => {
          safeSet(setIsSpeaking, true);
          options.onStart?.();
        },
        onDone: () => {
          safeSet(setIsSpeaking, false);
          options.onDone?.();
        },
        onStopped: () => {
          safeSet(setIsSpeaking, false);
          options.onStopped?.();
        },
        onError: (err) => {
          safeSet(setError, err);
          safeSet(setIsSpeaking, false);
          options.onError?.(err);
        },
      });
      // Nothing speakable (e.g. text was only markdown/code).
      if (dispatched === null) {
        safeSet(setIsSpeaking, false);
      }
    },
    [safeSet],
  );

  const stop = useCallback(() => {
    void stopSpeaking();
    safeSet(setIsSpeaking, false);
  }, [safeSet]);

  // Keep state honest if speech ends without firing a callback.
  useEffect(() => {
    if (!isSpeaking) {
      return;
    }
    const interval = setInterval(async () => {
      const speaking = await isSpeakingAsync();
      if (!speaking) {
        safeSet(setIsSpeaking, false);
      }
    }, 500);
    return () => clearInterval(interval);
  }, [isSpeaking, safeSet]);

  return { isSpeaking, error, speak: speakText, stop };
}
