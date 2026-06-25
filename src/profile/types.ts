/**
 * Immutable type definitions for Suri's Learning Profile.
 *
 * The profile is a small, structured configuration that shapes EVERY downstream
 * LLM inference (see systemPrompt.ts). It is the single differentiator described
 * in spec 5.6 — a system-prompt modifier, not a separate model.
 *
 * Fields are marked `readonly` to signal intent: treat a profile as immutable
 * and produce a new object (spread / cloneProfile) rather than mutating in place.
 */

/** How Suri formats every response. Maps 1:1 to spec 5.6 response modes. */
export type ResponseMode = 'visual' | 'auditory' | 'reading' | 'kinesthetic' | 'mixed';

/** Colorblind-safe palette selection applied to generated diagrams/charts. */
export type ColorVisionMode = 'standard' | 'deuteranopia' | 'protanopia' | 'tritanopia';

/** All response modes, ordered. Exported for validation + UI iteration later. */
export const RESPONSE_MODES: readonly ResponseMode[] = [
  'visual',
  'auditory',
  'reading',
  'kinesthetic',
  'mixed',
] as const;

/** All color-vision modes, ordered. */
export const COLOR_VISION_MODES: readonly ColorVisionMode[] = [
  'standard',
  'deuteranopia',
  'protanopia',
  'tritanopia',
] as const;

/**
 * Accessibility comfort settings (spec 5.6). Labeled by effect, never by
 * condition. readerFont / highContrast are purely presentational (consumed by
 * the UI layer); the rest also influence AI output via the prompt builder.
 */
export interface AccessibilitySettings {
  readonly readerFont: boolean;
  readonly colorVision: ColorVisionMode;
  readonly highContrast: boolean;
  readonly largeText: boolean;
  readonly focusMode: boolean;
  readonly lowMotion: boolean;
}

/** The full learning profile persisted per-student. */
export interface LearningProfile {
  readonly responseMode: ResponseMode;
  readonly accessibilitySettings: AccessibilitySettings;
  readonly gradeLevel: number;
}

/** Sane grade bounds for DepEd K-12 (used to clamp untrusted stored values). */
export const MIN_GRADE_LEVEL = 1;
export const MAX_GRADE_LEVEL = 12;

const DEFAULT_ACCESSIBILITY_SETTINGS: AccessibilitySettings = Object.freeze({
  readerFont: false,
  colorVision: 'standard',
  highContrast: false,
  largeText: false,
  focusMode: false,
  lowMotion: false,
});

/**
 * Default profile for a brand-new student or one who skips the first-run quiz.
 * 'mixed' is the spec default; Grade 6 matches the MVP demo corpus (5.5 / 11).
 * Deep-frozen so accidental mutation throws in development.
 */
export const DEFAULT_PROFILE: LearningProfile = Object.freeze({
  responseMode: 'mixed',
  accessibilitySettings: DEFAULT_ACCESSIBILITY_SETTINGS,
  gradeLevel: 6,
});

/** Produce a fresh, mutable-shaped copy (nested settings copied too). */
export function cloneProfile(profile: LearningProfile): LearningProfile {
  return {
    responseMode: profile.responseMode,
    gradeLevel: profile.gradeLevel,
    accessibilitySettings: { ...profile.accessibilitySettings },
  };
}
