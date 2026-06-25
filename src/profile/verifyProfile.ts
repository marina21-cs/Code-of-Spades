/**
 * In-app headless validation for the Learning Profile layer.
 *
 * Exercises the REAL expo-secure-store backend, so run it on a device/simulator
 * (e.g. from app bootstrap under __DEV__). It is a console-logging validation
 * engine, not a UI screen.
 *
 * WARNING: this mutates and resets the stored profile — only run it in dev.
 */
import { buildSystemPrompt } from '@/profile/systemPrompt';
import {
  isFirstRun,
  loadProfile,
  markFirstRunComplete,
  resetProfile,
  saveProfile,
} from '@/profile/profileStore';
import { DEFAULT_PROFILE } from '@/profile/types';

export async function verifyProfile(): Promise<void> {
  // 1. Serialization round-trip validation
  await saveProfile({ ...DEFAULT_PROFILE, responseMode: 'auditory', gradeLevel: 8 });
  const loaded = await loadProfile();
  console.assert(loaded.responseMode === 'auditory', '❌ responseMode persistence broken');
  console.assert(loaded.gradeLevel === 8, '❌ gradeLevel persistence broken');
  console.log('✅ Encryption storage round-trip working.');

  // 2. Onboarding state isolation flags
  await resetProfile();
  console.assert((await isFirstRun()) === true, '❌ First run reset failed');
  await markFirstRunComplete();
  console.assert((await isFirstRun()) === false, '❌ Onboarding state flag failed');
  console.log('✅ First-run pipeline states operating cleanly.');

  // 3. Prompt polymorphism verification
  const dummyChunks = ['Grade 6 Science: Photosynthesis occurs in the chloroplast.'];
  const modes = ['visual', 'auditory', 'reading', 'kinesthetic', 'mixed'] as const;
  const variations = modes.map((m) =>
    buildSystemPrompt({ ...DEFAULT_PROFILE, responseMode: m }, dummyChunks),
  );
  const uniqueSet = new Set(variations);
  console.assert(uniqueSet.size === 5, '❌ Structural instructions collision across types');
  console.log('✅ Polymorphic prompt generation validated across all modes.');

  // 4. Focus boundaries
  const focused = buildSystemPrompt(
    {
      ...DEFAULT_PROFILE,
      accessibilitySettings: { ...DEFAULT_PROFILE.accessibilitySettings, focusMode: true },
    },
    dummyChunks,
  );
  console.assert(focused.includes('120 words'), '❌ Focus length bounds missing');
  console.log('✅ Word management directives active.');
}
