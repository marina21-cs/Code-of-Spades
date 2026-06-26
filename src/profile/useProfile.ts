/**
 * Headless reactive controller for the Learning Profile.
 *
 * This is a logic-only hook (no JSX, no UI). It now reads from a single
 * process-wide runtime (see profileRuntime.ts) via `useSyncExternalStore`, so
 * EVERY consumer shares one profile object: toggling a setting in the Profile
 * tab instantly re-renders Kasabay, Tanong, charts, etc. The public API is
 * unchanged, so existing call sites keep working as-is.
 */
import { useCallback, useEffect, useSyncExternalStore } from 'react';

import {
  applyAccessibility,
  applyProfile,
  applyUpdate,
  completeFirstRunRuntime,
  ensureLoaded,
  getSnapshot,
  reloadRuntime,
  resetRuntime,
  subscribe,
} from './profileRuntime';
import { type AccessibilitySettings, type LearningProfile } from './types';

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
  const state = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  // Trigger the one-time load. `ensureLoaded` is idempotent across the app.
  useEffect(() => {
    ensureLoaded();
  }, []);

  const save = useCallback((next: LearningProfile) => applyProfile(next), []);
  const update = useCallback(
    (patch: Partial<Omit<LearningProfile, 'accessibilitySettings'>>) => applyUpdate(patch),
    [],
  );
  const updateAccessibility = useCallback(
    (patch: Partial<AccessibilitySettings>) => applyAccessibility(patch),
    [],
  );
  const completeFirstRun = useCallback(() => completeFirstRunRuntime(), []);
  const reset = useCallback(() => resetRuntime(), []);
  const reload = useCallback(() => reloadRuntime(), []);

  return {
    profile: state.profile,
    isLoading: state.isLoading,
    isFirstRun: state.firstRun,
    error: state.error,
    save,
    update,
    updateAccessibility,
    completeFirstRun,
    reset,
    reload,
  };
}
