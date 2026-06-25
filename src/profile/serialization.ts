/**
 * Pure (no native dependency) serialization + normalization for LearningProfile.
 *
 * Kept separate from profileStore.ts so the JSON round-trip and validation logic
 * can be exercised headlessly (node:sqlite-style) without the expo-secure-store
 * native module. It also hardens the app: data read back from storage is treated
 * as untrusted and normalized against the known schema, so a corrupted or
 * out-of-date blob degrades to safe defaults instead of crashing.
 */
import {
  COLOR_VISION_MODES,
  type ColorVisionMode,
  DEFAULT_PROFILE,
  type LearningProfile,
  MAX_GRADE_LEVEL,
  MIN_GRADE_LEVEL,
  RESPONSE_MODES,
  type ResponseMode,
  cloneProfile,
} from './types';

function asBoolean(value: unknown, fallback: boolean): boolean {
  return typeof value === 'boolean' ? value : fallback;
}

function asResponseMode(value: unknown): ResponseMode {
  return RESPONSE_MODES.includes(value as ResponseMode)
    ? (value as ResponseMode)
    : DEFAULT_PROFILE.responseMode;
}

function asColorVision(value: unknown): ColorVisionMode {
  return COLOR_VISION_MODES.includes(value as ColorVisionMode)
    ? (value as ColorVisionMode)
    : DEFAULT_PROFILE.accessibilitySettings.colorVision;
}

function asGradeLevel(value: unknown): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return DEFAULT_PROFILE.gradeLevel;
  }
  const rounded = Math.round(value);
  return Math.min(MAX_GRADE_LEVEL, Math.max(MIN_GRADE_LEVEL, rounded));
}

/**
 * Coerce arbitrary parsed input into a complete, valid LearningProfile by
 * merging against defaults and validating every field.
 */
export function normalizeProfile(input: unknown): LearningProfile {
  const obj = input && typeof input === 'object' ? (input as Record<string, unknown>) : {};
  const accInput =
    obj.accessibilitySettings && typeof obj.accessibilitySettings === 'object'
      ? (obj.accessibilitySettings as Record<string, unknown>)
      : {};
  const defaults = DEFAULT_PROFILE.accessibilitySettings;

  return {
    responseMode: asResponseMode(obj.responseMode),
    gradeLevel: asGradeLevel(obj.gradeLevel),
    accessibilitySettings: {
      readerFont: asBoolean(accInput.readerFont, defaults.readerFont),
      colorVision: asColorVision(accInput.colorVision),
      highContrast: asBoolean(accInput.highContrast, defaults.highContrast),
      largeText: asBoolean(accInput.largeText, defaults.largeText),
      focusMode: asBoolean(accInput.focusMode, defaults.focusMode),
      lowMotion: asBoolean(accInput.lowMotion, defaults.lowMotion),
    },
  };
}

/** Serialize a profile to the string form stored in secure storage. */
export function serializeProfile(profile: LearningProfile): string {
  return JSON.stringify(normalizeProfile(profile));
}

/**
 * Parse a stored string back into a valid profile. Returns a fresh copy of the
 * defaults when the input is empty or unparseable.
 */
export function deserializeProfile(raw: string | null | undefined): LearningProfile {
  if (!raw) {
    return cloneProfile(DEFAULT_PROFILE);
  }
  try {
    return normalizeProfile(JSON.parse(raw));
  } catch {
    return cloneProfile(DEFAULT_PROFILE);
  }
}
