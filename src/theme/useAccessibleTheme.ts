/**
 * Live accessibility theme (spec 5.6) — the bridge between the student's saved
 * comfort settings and the design system.
 *
 * Reads the shared Learning Profile and resolves, reactively:
 *   - colors      → high-contrast palette when `highContrast` is on
 *   - typography  → 1.3x scaled (`largeText`) and/or OpenDyslexic (`readerFont`,
 *                   only once the font has actually loaded)
 *   - diagramPalette → colorblind-safe series for `react-native-svg` charts
 *
 * Because the profile is now a single shared runtime, flipping any toggle in
 * Settings updates every component that consumes this hook on the next render.
 */
import { useMemo } from 'react';

import type { AccessibilitySettings, ColorVisionMode } from '@/profile/types';
import { useProfile } from '@/profile/useProfile';

import { getDiagramPalette, getThemeColors, type ThemeColors } from './colors';
import { useDyslexicFontAvailable } from './fonts';
import { createTypography } from './typography';

export interface AccessibleTheme {
  /** High-contrast-aware semantic color tokens. */
  colors: ThemeColors;
  /** Type scale, scaled for Large Text and switched to OpenDyslexic if active. */
  typography: ReturnType<typeof createTypography>;
  /** Ordered colorblind-safe palette for charts/diagrams. */
  diagramPalette: readonly string[];
  /** The student's color-vision mode. */
  colorVision: ColorVisionMode;
  /** Raw accessibility settings (for callers needing individual flags). */
  settings: AccessibilitySettings;
  /** OpenDyslexic requested AND loaded (safe to apply as a fontFamily). */
  readerFontActive: boolean;
  /** Large Text (1.3x) enabled. */
  largeText: boolean;
  /** High Contrast enabled. */
  highContrast: boolean;
}

export function useAccessibleTheme(): AccessibleTheme {
  const { profile } = useProfile();
  const settings = profile.accessibilitySettings;
  const dyslexicAvailable = useDyslexicFontAvailable();

  const readerFontActive = settings.readerFont && dyslexicAvailable;

  const colors = useMemo(
    () => getThemeColors({ highContrast: settings.highContrast }),
    [settings.highContrast],
  );

  const typography = useMemo(
    () => createTypography({ largeText: settings.largeText, readerFont: readerFontActive }),
    [settings.largeText, readerFontActive],
  );

  const diagramPalette = useMemo(
    () => getDiagramPalette(settings.colorVision),
    [settings.colorVision],
  );

  return {
    colors,
    typography,
    diagramPalette,
    colorVision: settings.colorVision,
    settings,
    readerFontActive,
    largeText: settings.largeText,
    highContrast: settings.highContrast,
  };
}
