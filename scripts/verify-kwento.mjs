/**
 * Headless verification for Kwento Mode (spec 5.8).
 *
 * WHY THIS EXISTS:
 *   The orchestration service + cache depend on native modules (expo-sqlite,
 *   expo-secure-store, netinfo) and need a device. This script verifies all the
 *   PURE pieces that drive correctness:
 *     - prompt builder: GLOBAL placeholder replacement (the {{GRADE_LEVEL}} token
 *       appears twice), setting-detail injection, auto setting selection
 *     - offline prompt shape
 *     - JSON parser: clean JSON, ```json-fenced JSON, prose -> fallback,
 *       missing-field -> fallback, invalid enum coercion, tierId mapping
 *     - grade-band complexity resolution (incl. out-of-range clamping)
 *     - adaptive difficulty stepping
 *     - the interim answer checker (numeric + textual)
 *
 *   It contacts no provider and needs no API key.
 *
 * RUN: node --import ./scripts/register-ts.mjs scripts/verify-kwento.mjs
 */
import {
  buildKwentoOfflinePrompt,
  buildKwentoPrompt,
  selectBestSetting,
} from '../src/features/kwento-mode/services/kwentoPromptBuilder.ts';
import { parseKwentoResponse } from '../src/features/kwento-mode/services/kwentoParser.ts';
import {
  checkKwentoAnswer,
  extractNumbers,
  normalizeAnswer,
} from '../src/features/kwento-mode/services/answerCheck.ts';
import { getComplexitySpec } from '../src/features/kwento-mode/constants/gradeComplexity.ts';
import { getNextDifficulty } from '../src/features/kwento-mode/services/difficultyLogic.ts';
import {
  KWENTO_FALLBACK,
  KWENTO_OFFLINE_SYSTEM_PROMPT,
} from '../src/features/kwento-mode/constants/kwentoDefaults.ts';

let failures = 0;
function check(condition, message) {
  if (condition) {
    console.log('✅', message);
  } else {
    failures += 1;
    console.error('❌', message);
  }
}

const PROFILE = { responseMode: 'mixed', accessibilitySettings: {}, gradeLevel: 6 };

function makeRequest(overrides = {}) {
  return {
    gradeLevel: 6,
    melcTopic: 'fractions',
    melcPassages: ['Passage A', 'Passage B', 'Passage C'],
    languagePreference: 'taglish',
    learningProfile: PROFILE,
    difficulty: 'medium',
    isOffline: false,
    ...overrides,
  };
}

const VALID = JSON.stringify({
  kwento: 'Si Ana ay pumunta sa palengke kasama ang nanay niya.',
  tanong: 'Ilan lahat ang prutas?',
  hint: 'Pagsamahin ang mga prutas.',
  suliranin_sagot: '3 + 5 = 8 prutas.',
  melc_topic: 'addition of whole numbers',
  grade_level: 2,
  setting: 'palengke',
  difficulty: 'easy',
  language_used: 'tagalog',
  follow_up: '',
  character_names: ['Ana'],
});

function main() {
  // --- 1. prompt builder: global placeholder replacement -------------------
  {
    const built = buildKwentoPrompt(
      makeRequest({ gradeLevel: 5, culturalSetting: 'palengke', difficulty: 'easy', melcTopic: 'fractions' }),
    );
    check(!built.systemPrompt.includes('{{'), 'no unreplaced {{tokens}} remain in the system prompt');
    check(built.systemPrompt.includes('Grade Level: 5'), 'GRADE_LEVEL filled in the context block');
    check(
      built.systemPrompt.includes('"grade_level": 5'),
      'GRADE_LEVEL ALSO filled in the output schema (global replace, not first-only)',
    );
    check(built.systemPrompt.includes('SETTING DETAIL'), 'setting-detail block is appended');
    check(built.systemPrompt.includes('per kilo'), 'palengke taglish vocabulary is injected');
    check(
      built.userPrompt.includes('Grade 5') &&
        built.userPrompt.includes('fractions') &&
        built.userPrompt.includes('palengke'),
      'user prompt carries grade, topic, and setting',
    );
  }

  // --- 2. prompt builder: automatic setting selection ----------------------
  {
    const auto = buildKwentoPrompt(makeRequest({ culturalSetting: undefined, melcTopic: 'force and motion', gradeLevel: 7 }));
    check(auto.systemPrompt.includes('laro_sa_kalye'), 'force/motion topic auto-selects laro_sa_kalye');
  }

  // --- 3. selectBestSetting keyword mapping --------------------------------
  {
    check(selectBestSetting('fractions and money') === 'palengke', 'money/fractions -> palengke');
    check(selectBestSetting('Newton force and motion') === 'laro_sa_kalye', 'force/motion -> laro_sa_kalye');
    check(selectBestSetting('observe the plants') === 'lakad_pauwi', 'plants/observation -> lakad_pauwi');
    check(selectBestSetting('percent and ratio') === 'tindahan', 'percent/ratio -> tindahan');
    check(selectBestSetting('temperature of mixtures') === 'bahay', 'temperature/mixture -> bahay');
    check(selectBestSetting('grammar and nouns') === 'eskwelahan', 'unmatched topic -> eskwelahan fallback');
  }

  // --- 4. offline prompt shape ---------------------------------------------
  {
    const off = buildKwentoOfflinePrompt(makeRequest({ melcTopic: 'addition', culturalSetting: undefined, gradeLevel: 2 }));
    check(off.systemPrompt === KWENTO_OFFLINE_SYSTEM_PROMPT, 'offline uses the compact system prompt');
    check(
      off.userPrompt.includes('addition') && off.userPrompt.includes('tindahan'),
      'offline user prompt has topic + the offline fallback setting (tindahan)',
    );
  }

  // --- 5. parser: clean JSON ------------------------------------------------
  {
    const r = parseKwentoResponse(VALID, makeRequest());
    check(r.kwento.startsWith('Si Ana') && r.tanong === 'Ilan lahat ang prutas?', 'clean JSON parses story + tanong');
    check(r.setting === 'palengke' && r.difficulty === 'easy' && r.language_used === 'tagalog', 'enum fields preserved');
    check(Array.isArray(r.character_names) && r.character_names[0] === 'Ana', 'character_names parsed');
    check(r.generatedAt instanceof Date, 'generatedAt is a Date');
    check(r.tierId === 1, 'online request -> tierId 1');
  }

  // --- 6. parser: markdown-fenced JSON -------------------------------------
  {
    const fenced = '```json\n' + VALID + '\n```';
    const r = parseKwentoResponse(fenced, makeRequest());
    check(r.tanong === 'Ilan lahat ang prutas?', 'fenced ```json``` wrapper is stripped and parsed');
  }

  // --- 7. parser: prose (non-JSON) -> fallback -----------------------------
  {
    const r = parseKwentoResponse('Hindi ito JSON, kwento lang ito.', makeRequest());
    check(r.tanong === KWENTO_FALLBACK.tanong, 'non-JSON falls back to the safe tanong');
    check(r.kwento.includes('Hindi ito JSON'), 'fallback keeps the raw text as the kwento');
    check(r.suliranin_sagot === '', 'fallback has an empty solution');
  }

  // --- 8. parser: missing required field -> fallback -----------------------
  {
    const missing = JSON.stringify({ kwento: 'x', tanong: 'y', hint: 'z' }); // no suliranin_sagot
    const r = parseKwentoResponse(missing, makeRequest());
    check(r.tanong === KWENTO_FALLBACK.tanong, 'missing required field (suliranin_sagot) -> fallback');
  }

  // --- 9. parser: invalid enum coercion + tierId ---------------------------
  {
    const badSetting = JSON.stringify({
      kwento: 'a', tanong: 'b', hint: 'c', suliranin_sagot: 'd', setting: 'mars',
    });
    const r = parseKwentoResponse(badSetting, makeRequest());
    check(r.setting === 'eskwelahan', 'invalid setting coerced to the neutral fallback');

    const offlineReq = parseKwentoResponse(VALID, makeRequest({ isOffline: true }));
    check(offlineReq.tierId === 3, 'offline request -> tierId 3');

    const explicit = parseKwentoResponse(VALID, makeRequest(), 2);
    check(explicit.tierId === 2, 'explicit tierId argument is respected');
  }

  // --- 10. grade-band complexity (incl. clamping) --------------------------
  {
    check(getComplexitySpec(1).gradeBand === 'Grade 1-2', 'grade 1 -> Grade 1-2');
    check(getComplexitySpec(6).gradeBand === 'Grade 5-6', 'grade 6 -> Grade 5-6');
    check(getComplexitySpec(12).gradeBand === 'Grade 11-12', 'grade 12 -> Grade 11-12');
    check(getComplexitySpec(0).gradeBand === 'Grade 1-2', 'grade 0 clamps to the lowest band');
    check(getComplexitySpec(99).gradeBand === 'Grade 11-12', 'grade 99 clamps to the highest band');
  }

  // --- 11. adaptive difficulty stepping ------------------------------------
  {
    check(getNextDifficulty('easy', true) === 'medium', 'easy + correct -> medium');
    check(getNextDifficulty('medium', true) === 'hard', 'medium + correct -> hard');
    check(getNextDifficulty('hard', true) === 'hard', 'hard + correct stays hard (clamped)');
    check(getNextDifficulty('medium', false) === 'easy', 'medium + wrong -> easy');
    check(getNextDifficulty('easy', false) === 'easy', 'easy + wrong stays easy (clamped)');
  }

  // --- 12. interim answer checker ------------------------------------------
  {
    check(checkKwentoAnswer('8', 'Sagot: 3 + 5 = 8 prutas.') === true, 'matches the final numeric answer');
    check(checkKwentoAnswer('90', '180 x 1/2 = 90') === true, 'matches a computed numeric answer');
    check(checkKwentoAnswer('7', 'Sagot: 3 + 5 = 8 prutas.') === false, 'rejects a wrong number');
    check(checkKwentoAnswer('', 'anything') === false, 'empty answer is rejected');
    check(checkKwentoAnswer('tama', 'tama') === true, 'exact normalized match');
    check(checkKwentoAnswer('noun', 'A noun is a word that names a person.') === true, 'textual containment match');
    check(extractNumbers('P30.50 at 8 piraso, -2').join(',') === '30.5,8,-2', 'extractNumbers reads signed decimals');
    check(normalizeAnswer('  Hello,  WORLD! ') === 'hello world', 'normalizeAnswer lowercases + strips punctuation');
  }
}

main();

if (failures > 0) {
  console.error(`\n${failures} check(s) failed.`);
  process.exit(1);
}
console.log('\nAll Kwento Mode checks passed.');
