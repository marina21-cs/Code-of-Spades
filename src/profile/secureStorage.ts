/**
 * Cross-platform key/value persistence for the Learning Profile + first-run flag.
 *
 * WHY THIS EXISTS: `expo-secure-store` has NO web implementation in this SDK —
 * its web module is literally `export default {}`, so any SecureStore.*Async call
 * throws "ExpoSecureStore.default.setValueWithKeyAsync is not a function" in the
 * browser (and crashes onboarding the moment it tries to save the profile).
 *
 * On native we keep the encrypted Keychain (iOS) / Keystore-backed (Android)
 * store. On web we fall back to localStorage. The profile is NOT a credential
 * (see profileStore), so localStorage is an acceptable web store; the sensitive
 * provider keys live server-side regardless.
 *
 * All three helpers are best-effort and never throw, so a storage hiccup can
 * never crash the onboarding flow again.
 */
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

const isWeb = Platform.OS === 'web';

/** Safe handle to window.localStorage (undefined in non-browser contexts). */
function webStore(): Storage | null {
  try {
    return typeof globalThis !== 'undefined' && globalThis.localStorage
      ? globalThis.localStorage
      : null;
  } catch {
    return null;
  }
}

/** Read a stored string, or null when absent / on any failure. */
export async function storageGetItem(key: string): Promise<string | null> {
  if (isWeb) {
    return webStore()?.getItem(key) ?? null;
  }
  try {
    return await SecureStore.getItemAsync(key);
  } catch {
    return null;
  }
}

/** Persist a string value. Best-effort: swallows storage errors. */
export async function storageSetItem(key: string, value: string): Promise<void> {
  if (isWeb) {
    try {
      webStore()?.setItem(key, value);
    } catch {
      // quota exceeded / storage disabled — ignore.
    }
    return;
  }
  try {
    await SecureStore.setItemAsync(key, value);
  } catch {
    // ignore: persistence is best-effort and must not crash the caller.
  }
}

/** Remove a stored value. Best-effort: swallows storage errors. */
export async function storageDeleteItem(key: string): Promise<void> {
  if (isWeb) {
    try {
      webStore()?.removeItem(key);
    } catch {
      // ignore.
    }
    return;
  }
  try {
    await SecureStore.deleteItemAsync(key);
  } catch {
    // ignore.
  }
}
