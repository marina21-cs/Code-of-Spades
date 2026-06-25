/**
 * Persistent Learning Profile store backed by expo-secure-store.
 *
 * Per spec section 8, the profile lives in encrypted device storage
 * (Keychain on iOS, Keystore-backed encryption on Android) rather than plain
 * SQLite/AsyncStorage. The profile is not a credential, but secure-store gives
 * us at-rest isolation for free and keeps personalization data off any backend.
 *
 * NOTE: expo-secure-store stores string values only and caps each value at
 * ~2KB on Android. The serialized profile is well under that. Keys must match
 * /^[A-Za-z0-9._-]+$/.
 */
import * as SecureStore from 'expo-secure-store';

import { deserializeProfile, serializeProfile } from './serialization';
import type { LearningProfile } from './types';

const PROFILE_KEY = 'suri.learning_profile';
const FIRST_RUN_DONE_KEY = 'suri.first_run_complete';

/** Persist the full profile (normalized + serialized) to secure storage. */
export async function saveProfile(profile: LearningProfile): Promise<void> {
  await SecureStore.setItemAsync(PROFILE_KEY, serializeProfile(profile));
}

/**
 * Load the stored profile. Always resolves to a complete, valid profile —
 * defaults are returned when nothing is stored or the blob is corrupt.
 */
export async function loadProfile(): Promise<LearningProfile> {
  const raw = await SecureStore.getItemAsync(PROFILE_KEY);
  return deserializeProfile(raw);
}

/** True only when no profile has ever been written. */
export async function hasStoredProfile(): Promise<boolean> {
  const raw = await SecureStore.getItemAsync(PROFILE_KEY);
  return raw != null;
}

/**
 * First-run detection is tracked by an explicit completion flag rather than by
 * profile presence, so the onboarding quiz state is independent of whether a
 * profile happens to exist.
 */
export async function isFirstRun(): Promise<boolean> {
  const done = await SecureStore.getItemAsync(FIRST_RUN_DONE_KEY);
  return done == null;
}

/** Mark onboarding as finished so isFirstRun() returns false on next launch. */
export async function markFirstRunComplete(): Promise<void> {
  await SecureStore.setItemAsync(FIRST_RUN_DONE_KEY, '1');
}

/**
 * Clear the stored profile AND the first-run flag, returning the app to a
 * pristine first-run state. Used by Settings "reset" and by verification.
 */
export async function resetProfile(): Promise<void> {
  await SecureStore.deleteItemAsync(PROFILE_KEY);
  await SecureStore.deleteItemAsync(FIRST_RUN_DONE_KEY);
}
