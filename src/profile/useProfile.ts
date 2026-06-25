/**
 * Headless reactive controller for the Learning Profile.
 *
 * This is a logic-only hook (no JSX, no UI) that the application layer consumes
 * later to read and mutate the profile. It owns the async load/save lifecycle so
 * screens don't each reimplement it, and exposes a synchronous snapshot of the
 * current profile plus loading/first-run/error state.
 */
import { useCallback, useEffect, useRef, useState } from 'react';

import {
  isFirstRun as readIsFirstRun,
  loadProfile,
  markFirstRunComplete,
  resetProfile,
  saveProfile,
} from './profileStore';
import {
  type AccessibilitySettings,
  DEFAULT_PROFILE,
  type LearningProfile,
  cloneProfile,
} from './types';

export interface UseProfileResult {
  /** Current profile. Seeded with defaults until the first load resolves. */
  profile: LearningProfile;
  /** True while the initial load (or a reload) is in flight. */
  isLoading: boolean;
  /** True until onboarding is marked complete. */
  isFirstRun: boolean;
  /** Last error from a store operation, if any. */
  error: Error | null;
  /** Overwrite the whole profile and persist it. */
  save: (next: LearningProfile) => Promise<void>;
  /** Patch top-level fields (e.g. responseMode, gradeLevel) and persist. */
  update: (patch: Partial<Omit<LearningProfile, 'accessibilitySettings'>>) => Promise<void>;
  /** Patch nested accessibility settings and persist. */
  updateAccessibility: (patch: Partial<AccessibilitySettings>) => Promise<void>;
  /** Mark first-run onboarding complete. */
  completeFirstRun: () => Promise<void>;
  /** Reset to defaults + first-run state. */
  reset: () => Promise<void>;
  /** Re-read profile + first-run flag from storage. */
  reload: () => Promise<void>;
}

export function useProfile(): UseProfileResult {
  const [profile, setProfile] = useState<LearningProfile>(() => cloneProfile(DEFAULT_PROFILE));
  const [isLoading, setIsLoading] = useState(true);
  const [firstRun, setFirstRun] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Avoid setState after unmount.
  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const reload = useCallback(async () => {
    setIsLoading(true);
    try {
      const [loaded, first] = await Promise.all([loadProfile(), readIsFirstRun()]);
      if (mountedRef.current) {
        setProfile(loaded);
        setFirstRun(first);
        setError(null);
      }
    } catch (err) {
      if (mountedRef.current) {
        setError(err as Error);
      }
    } finally {
      if (mountedRef.current) {
        setIsLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  const save = useCallback(async (next: LearningProfile) => {
    try {
      await saveProfile(next);
      if (mountedRef.current) {
        setProfile(cloneProfile(next));
        setError(null);
      }
    } catch (err) {
      if (mountedRef.current) {
        setError(err as Error);
      }
      throw err;
    }
  }, []);

  const update = useCallback(
    async (patch: Partial<Omit<LearningProfile, 'accessibilitySettings'>>) => {
      const next: LearningProfile = { ...profile, ...patch };
      await save(next);
    },
    [profile, save],
  );

  const updateAccessibility = useCallback(
    async (patch: Partial<AccessibilitySettings>) => {
      const next: LearningProfile = {
        ...profile,
        accessibilitySettings: { ...profile.accessibilitySettings, ...patch },
      };
      await save(next);
    },
    [profile, save],
  );

  const completeFirstRun = useCallback(async () => {
    await markFirstRunComplete();
    if (mountedRef.current) {
      setFirstRun(false);
    }
  }, []);

  const reset = useCallback(async () => {
    await resetProfile();
    if (mountedRef.current) {
      setProfile(cloneProfile(DEFAULT_PROFILE));
      setFirstRun(true);
      setError(null);
    }
  }, []);

  return {
    profile,
    isLoading,
    isFirstRun: firstRun,
    error,
    save,
    update,
    updateAccessibility,
    completeFirstRun,
    reset,
    reload,
  };
}
