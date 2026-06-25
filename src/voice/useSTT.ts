/**
 * Headless reactive controller for speech-to-text. Logic only (no UI).
 */
import { useCallback, useEffect, useRef, useState } from 'react';

import type { STTEngine } from './sttPolicy';
import { isListening as serviceIsListening, startListening, stopListening } from './sttService';

export interface UseSTTResult {
  isListening: boolean;
  transcript: string;
  partial: string;
  engine: STTEngine | null;
  error: Error | null;
  start: (lang?: string) => Promise<void>;
  stop: () => Promise<string>;
}

export function useSTT(): UseSTTResult {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [partial, setPartial] = useState('');
  const [engine, setEngine] = useState<STTEngine | null>(null);
  const [error, setError] = useState<Error | null>(null);

  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (serviceIsListening()) {
        void stopListening().catch(() => {});
      }
    };
  }, []);

  const set = useCallback(<T,>(setter: (v: T) => void, value: T) => {
    if (mountedRef.current) {
      setter(value);
    }
  }, []);

  const start = useCallback(
    async (lang?: string) => {
      set(setError, null);
      set(setPartial, '');
      set(setTranscript, '');
      try {
        const selected = await startListening({
          lang,
          onPartial: (t) => set(setPartial, t),
          onError: (err) => set(setError, err),
        });
        set(setEngine, selected);
        set(setIsListening, true);
      } catch (err) {
        set(setError, err as Error);
        set(setIsListening, false);
      }
    },
    [set],
  );

  const stop = useCallback(async (): Promise<string> => {
    try {
      const result = await stopListening();
      set(setTranscript, result.text);
      set(setPartial, '');
      set(setIsListening, false);
      return result.text;
    } catch (err) {
      set(setError, err as Error);
      set(setIsListening, false);
      return '';
    }
  }, [set]);

  return { isListening, transcript, partial, engine, error, start, stop };
}
