/**
 * Process-wide Learning Profile runtime (single source of truth).
 *
 * `useProfile` used to keep its own `useState` per component, so toggling a
 * setting in the Profile tab never reached the other mounted screens until they
 * remounted. That is why accessibility settings appeared not to apply globally.
 *
 * This module hoists the profile into a tiny module-level external store with a
 * stable snapshot reference, consumed via `useSyncExternalStore`. Every
 * `useProfile()` consumer now shares ONE profile object and re-renders the
 * instant any screen mutates it — the persistence backend (secure-store) is
 * unchanged, so nothing downstream (AI router, prompt builder) is affected.
 */
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

export interface ProfileRuntimeState {
  readonly profile: LearningProfile;
  readonly isLoading: boolean;
  readonly firstRun: boolean;
  readonly error: Error | null;
}

/**
 * The current snapshot. Its identity only changes when something actually
 * changes, which `useSyncExternalStore` relies on to avoid render loops.
 */
let snapshot: ProfileRuntimeState = {
  profile: cloneProfile(DEFAULT_PROFILE),
  isLoading: true,
  firstRun: true,
  error: null,
};

const listeners = new Set<() => void>();

function emit(): void {
  for (const listener of listeners) {
    listener();
  }
}

function patch(next: Partial<ProfileRuntimeState>): void {
  snapshot = { ...snapshot, ...next };
  emit();
}

/** Subscribe to runtime changes. Returns an unsubscribe fn. */
export function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** Stable snapshot getter for `useSyncExternalStore`. */
export function getSnapshot(): ProfileRuntimeState {
  return snapshot;
}

let loadStarted = false;

/** Kick off the initial load exactly once across the whole app. */
export function ensureLoaded(): void {
  if (loadStarted) {
    return;
  }
  loadStarted = true;
  void reloadRuntime();
}

/** Force a fresh read of the profile + first-run flag from storage. */
export async function reloadRuntime(): Promise<void> {
  patch({ isLoading: true });
  try {
    const [loaded, first] = await Promise.all([loadProfile(), readIsFirstRun()]);
    patch({ profile: loaded, firstRun: first, error: null, isLoading: false });
  } catch (err) {
    patch({ error: err as Error, isLoading: false });
  }
}

/** Persist + broadcast a whole new profile. */
export async function applyProfile(next: LearningProfile): Promise<void> {
  try {
    await saveProfile(next);
    patch({ profile: cloneProfile(next), error: null });
  } catch (err) {
    patch({ error: err as Error });
    throw err;
  }
}

/** Patch top-level profile fields (everything except accessibility settings). */
export async function applyUpdate(
  fields: Partial<Omit<LearningProfile, 'accessibilitySettings'>>,
): Promise<void> {
  await applyProfile({ ...snapshot.profile, ...fields });
}

/** Patch nested accessibility settings and broadcast. */
export async function applyAccessibility(
  fields: Partial<AccessibilitySettings>,
): Promise<void> {
  await applyProfile({
    ...snapshot.profile,
    accessibilitySettings: { ...snapshot.profile.accessibilitySettings, ...fields },
  });
}

/** Mark onboarding complete. */
export async function completeFirstRunRuntime(): Promise<void> {
  await markFirstRunComplete();
  patch({ firstRun: false });
}

/** Reset to defaults + first-run state. */
export async function resetRuntime(): Promise<void> {
  await resetProfile();
  patch({ profile: cloneProfile(DEFAULT_PROFILE), firstRun: true, error: null });
}
