/**
 * Headless reactive controller for the on-device model download.
 *
 * Logic-only hook (no UI) the app layer consumes to drive a download and observe
 * its state. Owns the async lifecycle: storage check -> download (with progress)
 * -> integrity verify -> ready, plus pause/resume/remove.
 */
import { useCallback, useEffect, useRef, useState } from 'react';

import {
  type DownloadProgress,
  deleteModel,
  downloadModel,
  getFreeStorageBytes,
  hasEnoughStorage,
  isModelDownloaded,
  pauseDownload,
  resumeDownload,
} from './modelManager';
import { maybeRegisterSLM } from './offlineSLM';

export type DownloadStatus =
  | 'idle'
  | 'checking'
  | 'insufficient-storage'
  | 'downloading'
  | 'paused'
  | 'verifying'
  | 'ready'
  | 'error';

export interface UseModelDownloadResult {
  status: DownloadStatus;
  progress: DownloadProgress;
  error: Error | null;
  freeBytes: number | null;
  start: () => Promise<void>;
  pause: () => Promise<void>;
  resume: () => Promise<void>;
  remove: () => Promise<void>;
  refresh: () => Promise<void>;
}

const ZERO_PROGRESS: DownloadProgress = { writtenBytes: 0, totalBytes: 0, progress: 0 };

export function useModelDownload(): UseModelDownloadResult {
  const [status, setStatus] = useState<DownloadStatus>('checking');
  const [progress, setProgress] = useState<DownloadProgress>(ZERO_PROGRESS);
  const [error, setError] = useState<Error | null>(null);
  const [freeBytes, setFreeBytes] = useState<number | null>(null);

  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const set = useCallback(<T,>(setter: (v: T) => void, value: T) => {
    if (mountedRef.current) {
      setter(value);
    }
  }, []);

  const refresh = useCallback(async () => {
    set(setStatus, 'checking');
    try {
      const [downloaded, free] = await Promise.all([isModelDownloaded(), getFreeStorageBytes()]);
      set(setFreeBytes, free);
      if (downloaded) {
        await maybeRegisterSLM();
        set(setStatus, 'ready');
      } else {
        set(setStatus, (await hasEnoughStorage()) ? 'idle' : 'insufficient-storage');
      }
    } catch (err) {
      set(setError, err as Error);
      set(setStatus, 'error');
    }
  }, [set]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const start = useCallback(async () => {
    set(setError, null);
    set(setProgress, ZERO_PROGRESS);
    set(setStatus, 'downloading');
    try {
      await downloadModel({ onProgress: (p) => set(setProgress, p) });
      set(setStatus, 'verifying');
      await maybeRegisterSLM();
      set(setStatus, 'ready');
    } catch (err) {
      set(setError, err as Error);
      set(setStatus, 'error');
    }
  }, [set]);

  const pause = useCallback(async () => {
    const paused = await pauseDownload();
    if (paused) {
      set(setStatus, 'paused');
    }
  }, [set]);

  const resume = useCallback(async () => {
    set(setStatus, 'downloading');
    try {
      const result = await resumeDownload({ onProgress: (p) => set(setProgress, p) });
      if (result) {
        await maybeRegisterSLM();
        set(setStatus, 'ready');
      } else {
        await refresh();
      }
    } catch (err) {
      set(setError, err as Error);
      set(setStatus, 'error');
    }
  }, [refresh, set]);

  const remove = useCallback(async () => {
    await deleteModel();
    set(setProgress, ZERO_PROGRESS);
    await refresh();
  }, [refresh, set]);

  return { status, progress, error, freeBytes, start, pause, resume, remove, refresh };
}
