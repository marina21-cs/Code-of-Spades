/**
 * Headless verification for Misconception Detection (spec 5.9).
 *
 * WHY THIS EXISTS:
 *   The detector orchestration (misconceptionDetector.ts) depends on the AI
 *   stack + native modules (generateWithPrompt, ragStore, netinfo) and needs a
 *   device. This script verifies all the PURE pieces that drive correctness:
 *     - taxonomy lookup: the OFFLINE detection path (keyword match), incl. the
 *       headline behaviour "different wrong belief -> different entry" and the
 *       conservative no-match case
 *     - prompt builder: GLOBAL placeholder replacement + taxonomy-hint injection
 *     - JSON parser: clean JSON, ```json-fenced JSON, prose -> safe fallback,
 *       missing flag -> fallback, invalid enum coercion, confidence clamping
 *     - confidence threshold: Socratic downgrade below the bar (spec 10.1 #3)
 *     - offline response construction from a taxonomy entry
 *     - record mapping
 *
 *   It contacts no provider and needs no API key.
 *
 * RUN: node --import ./scripts/register-ts.mjs scripts/verify-misconception.mjs
 */
import {
  countKeywordHits,
  entriesForTopic,
  findTaxonomyMatch,
} from '../src/features/misconception/services/misconceptionTaxonomyLookup.ts';
import {
  buildMisconceptionPrompt,
  buildTaxonomyHints,
} from '../src/features/misconception/services/misconceptionPromptBuilder.ts';
import {
  applyConfidenceThreshold,
  buildNoMisconceptionResponse,
  buildOfflineResponseFromTaxonomy,
  clampConfidence,
  parseMisconceptionResponse,
  toMisconceptionRecord,
} from '../src/features/misconception/services/misconceptionParser.ts';
import {
  MISCONCEPTION_TAXONOMY,
} from '../src/features/misconception/constants/misconceptionTaxonomy.ts';
import {
  CONFIDENCE_THRESHOLD,
  SOCRATIC_FOLLOW_UP,
} from '../src/features/misconception/constants/misconceptionDefaults.ts';

let failures = 0;
function check(condition, message) {
  if (condition) {
    console.log('✅', message);
  } else {
    failures += 1;
    console.error('❌', message);
  }
}

function makeRequest(overrides = {}) {
  return {
    studentMessage: '',
    melcTopic: 'photosynthesis',
    gradeLevel: 6,
    language: 'taglish',
    isOffline: false,
    ...overrides,
  };
}

function entryById(id) {
  return MISCONCEPTION_TAXONOMY.find((e) => e.id === id);
}

function main() {
  // --- 1. offline taxonomy lookup: the core detection path -----------------
  {
    const night = findTaxonomyMatch('nagpo-photosynthesis pa rin ba kahit gabi?', 'photosynthesis');
    check(night?.entry.id === 'science_photosynthesis_night', 'detects the "photosynthesis at night" belief');

    const soil = findTaxonomyMatch('ang halaman ay kumakain ng lupa kaya lumalaki', 'photosynthesis');
    check(soil?.entry.id === 'science_photosynthesis_soil', 'detects the "plants eat soil" belief');

    // The headline spec behaviour: SAME topic, DIFFERENT belief -> DIFFERENT entry.
    check(
      night?.entry.id !== soil?.entry.id &&
        night?.entry.targetedExplanation !== soil?.entry.targetedExplanation,
      'two different misconceptions about photosynthesis map to different targeted explanations',
    );

    const fraction = findTaxonomyMatch('1/3 is bigger than 1/2 kasi mas malaki ang 3', 'fractions');
    check(fraction?.entry.id === 'math_fractions_denominator', 'detects the fraction-denominator belief');

    const seasons = findTaxonomyMatch('mainit sa tag-araw kasi malapit tayo sa araw', 'seasons');
    check(seasons?.entry.id === 'science_seasons_distance', 'detects the seasons/distance belief');
  }

  // --- 2. lookup is conservative (no false positives) ----------------------
  {
    const none = findTaxonomyMatch('Ano ang kabisera ng Pilipinas?', 'araling panlipunan');
    check(none === null, 'an unrelated message returns NO match (conservative offline path)');

    // A single incidental keyword is below MIN_TAXONOMY_HITS.
    const weak = findTaxonomyMatch('may halaman sa bakuran namin', 'gardening');
    check(weak === null, 'a single incidental keyword does not trigger a match');
  }

  // --- 3. countKeywordHits + entriesForTopic -------------------------------
  {
    const soilEntry = entryById('science_photosynthesis_soil');
    check(
      countKeywordHits(soilEntry, 'kumakain ng lupa ang halaman') >= 3,
      'countKeywordHits tallies multiple keyword matches',
    );
    const photo = entriesForTopic('photosynthesis');
    check(photo.length >= 3, `entriesForTopic('photosynthesis') returns the catalogued beliefs (got ${photo.length})`);
    check(
      entriesForTopic('completely unknown topic').length === 0,
      'entriesForTopic returns nothing for an uncatalogued topic',
    );
  }

  // --- 4. prompt builder: placeholder fill + taxonomy hints -----------------
  {
    const built = buildMisconceptionPrompt(
      makeRequest({ melcTopic: 'photosynthesis', gradeLevel: 5, melcPassages: ['Plants make food.'] }),
    );
    check(!built.systemPrompt.includes('{{'), 'no unreplaced {{tokens}} remain in the system prompt');
    check(built.systemPrompt.includes('Grade Level: 5'), 'GRADE_LEVEL filled');
    check(built.systemPrompt.includes('taglish'), 'language register filled');
    check(built.systemPrompt.includes('Plants make food.'), 'MELC passage injected');
    check(
      built.systemPrompt.toLowerCase().includes('soil') || built.systemPrompt.toLowerCase().includes('lupa'),
      'known wrong beliefs (taxonomy hints) injected into the prompt',
    );
    check(built.userPrompt.includes('Student:'), 'user prompt frames the student message');
  }

  // --- 5. buildTaxonomyHints ------------------------------------------------
  {
    const hints = buildTaxonomyHints('fractions');
    check(hints.includes('WRONG_DEFINITION'), 'taxonomy hints carry the misconception type');
    check(buildTaxonomyHints('nonexistent').includes('none catalogued'), 'empty topic hints degrade gracefully');
  }

  // --- 6. parser: clean JSON ------------------------------------------------
  {
    const valid = JSON.stringify({
      has_misconception: true,
      misconception_type: 'WRONG_CAUSATION',
      specific_wrong_belief: 'soil is food',
      correct_understanding: 'plants make their own food',
      acknowledgment: 'you know plants need soil',
      targeted_explanation: 'the soil gives water, not food',
      follow_up_question: 'gets it?',
      language_detected: 'english',
      confidence: 0.88,
    });
    const r = parseMisconceptionResponse(valid, makeRequest());
    check(r.has_misconception === true && r.misconception_type === 'WRONG_CAUSATION', 'clean JSON parses flag + type');
    check(r.confidence === 0.88 && r.language_detected === 'english', 'confidence + language parsed');
    check(r.tierId === 1, 'online request -> tierId 1');
  }

  // --- 7. parser: fenced JSON, prose, missing flag -------------------------
  {
    const fenced = '```json\n' + JSON.stringify({ has_misconception: false }) + '\n```';
    check(parseMisconceptionResponse(fenced, makeRequest()).has_misconception === false, 'fenced ```json``` stripped + parsed');

    const prose = parseMisconceptionResponse('Wala akong makitang JSON dito.', makeRequest());
    check(prose.has_misconception === false, 'prose -> safe no-misconception fallback');
    check(prose.follow_up_question === SOCRATIC_FOLLOW_UP.taglish, 'fallback uses the Socratic follow-up');

    const noFlag = parseMisconceptionResponse(JSON.stringify({ confidence: 0.9 }), makeRequest());
    check(noFlag.has_misconception === false, 'missing has_misconception -> fallback');
  }

  // --- 8. parser: enum coercion + confidence clamping ----------------------
  {
    const badType = JSON.stringify({ has_misconception: true, misconception_type: 'BANANA', confidence: 0.9 });
    check(parseMisconceptionResponse(badType, makeRequest()).misconception_type === null, 'invalid misconception_type coerced to null');

    const overConf = JSON.stringify({ has_misconception: true, misconception_type: 'WRONG_DEFINITION', confidence: 1.7 });
    check(parseMisconceptionResponse(overConf, makeRequest()).confidence === 1, 'confidence > 1 clamps to 1');

    check(clampConfidence(-0.5) === 0, 'clampConfidence floors at 0');
    check(clampConfidence('not a number') === 0, 'clampConfidence handles non-numbers');
    check(clampConfidence(0.5) === 0.5, 'clampConfidence passes valid values through');
  }

  // --- 9. confidence threshold: Socratic downgrade below the bar -----------
  {
    const low = parseMisconceptionResponse(
      JSON.stringify({
        has_misconception: true,
        misconception_type: 'WRONG_CAUSATION',
        specific_wrong_belief: 'heavier falls faster',
        targeted_explanation: 'actually they fall together',
        confidence: 0.5,
        language_detected: 'english',
      }),
      makeRequest(),
    );
    const downgraded = applyConfidenceThreshold(low, CONFIDENCE_THRESHOLD);
    check(downgraded.has_misconception === false, 'below-threshold detection is downgraded (not asserted)');
    check(downgraded.targeted_explanation === '', 'downgrade clears the targeted explanation');
    check(downgraded.follow_up_question.includes('heavier falls faster'), 'downgrade keeps an "is this what you meant?" reframe');

    const high = parseMisconceptionResponse(
      JSON.stringify({ has_misconception: true, misconception_type: 'WRONG_CAUSATION', confidence: 0.85 }),
      makeRequest(),
    );
    check(applyConfidenceThreshold(high, CONFIDENCE_THRESHOLD).has_misconception === true, 'above-threshold detection is kept');
  }

  // --- 10. offline response from a taxonomy entry --------------------------
  {
    const entry = entryById('science_photosynthesis_night');
    const r = buildOfflineResponseFromTaxonomy(entry, makeRequest({ isOffline: true }));
    check(r.has_misconception === true && r.misconception_type === entry.misconceptionType, 'offline response carries the entry type');
    check(r.targeted_explanation === entry.targetedExplanation, 'offline serves the PRE-WRITTEN targeted explanation');
    check(r.confidence === 0.9 && r.tierId === 3, 'offline response is high-confidence + Tier 3');
  }

  // --- 11. no-misconception response + record mapping ----------------------
  {
    const none = buildNoMisconceptionResponse(makeRequest(), 1, 'tagalog');
    check(none.has_misconception === false && none.follow_up_question === SOCRATIC_FOLLOW_UP.tagalog, 'no-misconception response is Socratic');

    const rec = toMisconceptionRecord(
      buildOfflineResponseFromTaxonomy(entryById('math_fractions_denominator'), makeRequest({ melcTopic: 'fractions', gradeLevel: 4 })),
      makeRequest({ melcTopic: 'fractions', gradeLevel: 4 }),
    );
    check(rec.topic === 'fractions' && rec.gradeLevel === 4, 'record carries topic + grade');
    check(rec.misconceptionType === 'WRONG_DEFINITION' && rec.detectedAt instanceof Date, 'record carries type + detectedAt Date');
  }
}

main();

if (failures > 0) {
  console.error(`\n${failures} check(s) failed.`);
  process.exit(1);
}
console.log('\nAll Misconception Detection checks passed.');
