/**
 * Headless verification for the Learning Profile layer.
 *
 * WHY THIS EXISTS:
 *   expo-secure-store is a native module and can't run in plain Node, so the
 *   in-app verifyProfile() (src/profile/verifyProfile.ts) needs a device. This
 *   script verifies everything that is NOT native:
 *     - the REAL buildSystemPrompt() (prompt polymorphism + focus bounds), and
 *     - the REAL serialize/deserialize/normalize logic that profileStore relies
 *       on, driven through an in-memory fake of the secure-store API so the
 *       save/load/first-run flow is exercised end-to-end at the logic level.
 *
 *   It does NOT prove the on-device Keychain/Keystore binding — that is what
 *   verifyProfile() covers on a simulator/device.
 *
 * RUN: node scripts/verify-profile.mjs
 */
import { buildSystemPrompt } from '../src/profile/systemPrompt.ts';
import { serializeProfile, deserializeProfile } from '../src/profile/serialization.ts';
import { DEFAULT_PROFILE } from '../src/profile/types.ts';

let failures = 0;
function check(condition, message) {
  if (condition) {
    console.log('✅', message);
  } else {
    failures += 1;
    console.error('❌', message);
  }
}

// --- In-memory fake of the expo-secure-store API ---------------------------
// profileStore.ts uses set/get/deleteItemAsync; we reproduce that surface and
// route persistence through the real serialize/deserialize functions.
const store = new Map();
const fakeSecureStore = {
  setItemAsync: async (k, v) => void store.set(k, v),
  getItemAsync: async (k) => (store.has(k) ? store.get(k) : null),
  deleteItemAsync: async (k) => void store.delete(k),
};

const PROFILE_KEY = 'suri.learning_profile';
const FIRST_RUN_DONE_KEY = 'suri.first_run_complete';

const saveProfile = async (p) => fakeSecureStore.setItemAsync(PROFILE_KEY, serializeProfile(p));
const loadProfile = async () => deserializeProfile(await fakeSecureStore.getItemAsync(PROFILE_KEY));
const isFirstRun = async () => (await fakeSecureStore.getItemAsync(FIRST_RUN_DONE_KEY)) == null;
const markFirstRunComplete = async () => fakeSecureStore.setItemAsync(FIRST_RUN_DONE_KEY, '1');
const resetProfile = async () => {
  await fakeSecureStore.deleteItemAsync(PROFILE_KEY);
  await fakeSecureStore.deleteItemAsync(FIRST_RUN_DONE_KEY);
};

async function main() {
  // 1. Serialization round-trip
  await saveProfile({ ...DEFAULT_PROFILE, responseMode: 'auditory', gradeLevel: 8 });
  const loaded = await loadProfile();
  check(loaded.responseMode === 'auditory', `responseMode persists (got ${loaded.responseMode})`);
  check(loaded.gradeLevel === 8, `gradeLevel persists (got ${loaded.gradeLevel})`);

  // 2. Onboarding state isolation
  await resetProfile();
  check((await isFirstRun()) === true, 'isFirstRun() true after resetProfile()');
  await markFirstRunComplete();
  check((await isFirstRun()) === false, 'isFirstRun() false after markFirstRunComplete()');

  // 3. Prompt polymorphism across all 5 modes
  const dummyChunks = ['Grade 6 Science: Photosynthesis occurs in the chloroplast.'];
  const modes = ['visual', 'auditory', 'reading', 'kinesthetic', 'mixed'];
  const variations = modes.map((m) =>
    buildSystemPrompt({ ...DEFAULT_PROFILE, responseMode: m }, dummyChunks),
  );
  check(new Set(variations).size === 5, `5 unique prompts across modes (got ${new Set(variations).size})`);

  // Every prompt must embed the RAG chunk as a markdown-numbered source.
  check(
    variations.every((p) => p.includes('1. Grade 6 Science: Photosynthesis occurs in the chloroplast.')),
    'RAG chunks rendered as a numbered markdown list',
  );

  // 4. Focus-mode word bound present, absent by default
  const focused = buildSystemPrompt(
    { ...DEFAULT_PROFILE, accessibilitySettings: { ...DEFAULT_PROFILE.accessibilitySettings, focusMode: true } },
    dummyChunks,
  );
  check(focused.includes('120 words'), 'Focus mode injects the 120-word bound');
  const unfocused = buildSystemPrompt(DEFAULT_PROFILE, dummyChunks);
  check(!unfocused.includes('120 words'), 'No word bound when focus mode is off');

  // 5. Normalization hardening: corrupt / partial / out-of-range input degrades safely
  const corrupt = deserializeProfile('{not valid json');
  check(corrupt.responseMode === DEFAULT_PROFILE.responseMode, 'Corrupt JSON falls back to defaults');

  const partial = deserializeProfile(JSON.stringify({ responseMode: 'bogus', gradeLevel: 999 }));
  check(partial.responseMode === DEFAULT_PROFILE.responseMode, 'Invalid responseMode coerced to default');
  check(partial.gradeLevel === 12, `Out-of-range gradeLevel clamped (got ${partial.gradeLevel})`);
  check(
    partial.accessibilitySettings.colorVision === 'standard',
    'Missing accessibility settings filled from defaults',
  );

  // Auditory mode must suppress markdown formatting; others must allow code fences.
  const auditory = buildSystemPrompt({ ...DEFAULT_PROFILE, responseMode: 'auditory' }, dummyChunks);
  const visual = buildSystemPrompt({ ...DEFAULT_PROFILE, responseMode: 'visual' }, dummyChunks);
  check(!auditory.includes('```'), 'Auditory formatting contract avoids code fences');
  check(visual.includes('```json'), 'Non-auditory formatting contract keeps visual JSON fences');
}

main()
  .then(() => {
    if (failures > 0) {
      console.error(`\n${failures} check(s) failed.`);
      process.exit(1);
    }
    console.log('\nAll profile + prompt checks passed.');
  })
  .catch((err) => {
    console.error('Verification crashed:', err);
    process.exit(1);
  });
