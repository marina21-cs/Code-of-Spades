/**
 * Headless verification for Kasabay Mode (spec 5.10).
 *
 * WHY THIS EXISTS:
 *   The interruption service (kasabayService.ts) depends on the AI stack + native
 *   modules (generateWithPrompt, ragStore, netinfo, the detector) and needs a
 *   device. This script verifies the PURE pieces that drive correctness:
 *     - focus-timer state machine: start/interrupt/resume/complete transitions,
 *       banked-segment accumulation across interruptions, derived elapsed/
 *       remaining/complete, and defensive no-ops on illegal transitions
 *     - prompt builder: GLOBAL placeholder replacement, vibe-check phrasing,
 *       memory fallback, MELC grounding, the rule-#3 misconception note, and the
 *       compact offline shape
 *
 *   It contacts no provider and needs no API key.
 *
 * RUN: node --import ./scripts/register-ts.mjs scripts/verify-kasabay.mjs
 */
import {
  completeFocusBlock,
  createFocusTimer,
  elapsedStudyMs,
  interruptFocusBlock,
  isBlockComplete,
  remainingMs,
  resumeFocusBlock,
  startFocusBlock,
} from '../src/features/kasabay/services/focusTimer.ts';
import {
  buildKasabayOfflinePrompt,
  buildKasabayPrompt,
  buildMisconceptionNote,
  describeCognitiveModifier,
} from '../src/features/kasabay/services/kasabayPromptBuilder.ts';
import { NO_RECENT_TOPIC } from '../src/features/kasabay/constants/kasabayDefaults.ts';

let failures = 0;
function check(condition, message) {
  if (condition) {
    console.log('✅', message);
  } else {
    failures += 1;
    console.error('❌', message);
  }
}

const MIN = 60 * 1000;

function makeRequest(overrides = {}) {
  return {
    studentMessage: 'Bakit po hindi ako makakuha ng tamang sagot sa fractions?',
    melcTopic: 'fractions',
    gradeLevel: 6,
    language: 'taglish',
    cognitiveModifier: 'restless',
    lastTopicDiscussed: 'adding fractions with like denominators',
    melcPassages: ['A fraction shows part of a whole.'],
    isOffline: false,
    ...overrides,
  };
}

function main() {
  // --- 1. focus timer: create + start --------------------------------------
  {
    const t0 = createFocusTimer(25 * MIN);
    check(t0.status === 'idle' && t0.accumulatedMs === 0 && t0.interruptions === 0, 'createFocusTimer starts idle + empty');
    check(t0.durationMs === 25 * MIN, 'createFocusTimer records the planned duration');

    const running = startFocusBlock(t0, 1000);
    check(running.status === 'running' && running.segmentStartedAt === 1000, 'startFocusBlock -> running with a segment start');
    check(elapsedStudyMs(running, 1000 + 3 * MIN) === 3 * MIN, 'elapsedStudyMs counts the in-progress segment');
    check(remainingMs(running, 1000 + 3 * MIN) === 22 * MIN, 'remainingMs subtracts elapsed from the block');
  }

  // --- 2. interrupt banks the segment + counts the interruption ------------
  {
    const running = startFocusBlock(createFocusTimer(25 * MIN), 0);
    const interrupted = interruptFocusBlock(running, 5 * MIN);
    check(interrupted.status === 'interrupted', 'interruptFocusBlock -> interrupted');
    check(interrupted.accumulatedMs === 5 * MIN, 'interrupt banks the running segment into accumulated');
    check(interrupted.segmentStartedAt === null, 'interrupt clears the live segment');
    check(interrupted.interruptions === 1, 'interrupt increments the interruption count');
    // Elapsed is frozen while interrupted (no live segment), regardless of now.
    check(elapsedStudyMs(interrupted, 99 * MIN) === 5 * MIN, 'elapsed is frozen while interrupted');
  }

  // --- 3. resume + multi-segment accumulation ------------------------------
  {
    let t = startFocusBlock(createFocusTimer(25 * MIN), 0);
    t = interruptFocusBlock(t, 5 * MIN); // banked 5
    t = resumeFocusBlock(t, 10 * MIN); // resume at 10:00
    check(t.status === 'running' && t.segmentStartedAt === 10 * MIN, 'resumeFocusBlock -> running again');
    check(elapsedStudyMs(t, 12 * MIN) === 7 * MIN, 'elapsed = banked (5) + new live segment (2)');
    t = interruptFocusBlock(t, 12 * MIN); // banked 7 total
    check(t.accumulatedMs === 7 * MIN && t.interruptions === 2, 'second interrupt banks again + counts again');
  }

  // --- 4. complete + block-complete predicate ------------------------------
  {
    let t = startFocusBlock(createFocusTimer(10 * MIN), 0);
    t = completeFocusBlock(t, 10 * MIN);
    check(t.status === 'completed' && t.accumulatedMs === 10 * MIN, 'completeFocusBlock banks the final segment');
    check(remainingMs(t, 99 * MIN) === 0, 'remaining is 0 once the block is complete');

    const partial = startFocusBlock(createFocusTimer(10 * MIN), 0);
    check(isBlockComplete(partial, 10 * MIN) === true, 'isBlockComplete true once duration is reached');
    check(isBlockComplete(partial, 9 * MIN) === false, 'isBlockComplete false before duration');
  }

  // --- 5. defensive transitions (illegal -> no-op) -------------------------
  {
    const idle = createFocusTimer(10 * MIN);
    check(interruptFocusBlock(idle, 1000) === idle, 'interrupt while idle is a no-op');

    const running = startFocusBlock(idle, 0);
    check(startFocusBlock(running, 5000) === running, 'start while running is a no-op');

    const done = completeFocusBlock(running, 5000);
    check(completeFocusBlock(done, 9000) === done, 'complete is idempotent');
    check(startFocusBlock(done, 9000) === done, 'cannot restart a completed block');
  }

  // --- 6. prompt builder: full online prompt -------------------------------
  {
    const built = buildKasabayPrompt(makeRequest());
    check(!built.systemPrompt.includes('{{'), 'no unreplaced {{tokens}} remain in the system prompt');
    check(built.systemPrompt.includes('restless'), 'vibe-check phrasing (restless) is injected');
    check(built.systemPrompt.includes('adding fractions with like denominators'), 'last_topic_discussed is injected');
    check(built.systemPrompt.includes('A fraction shows part of a whole.'), 'MELC passage grounding is injected');
    check(built.systemPrompt.includes('taglish'), 'language register is injected');
    check(
      built.userPrompt.includes('fractions') && built.userPrompt.includes(makeRequest().studentMessage),
      'user prompt carries the student message + topic',
    );
  }

  // --- 7. memory fallback when no prior session ----------------------------
  {
    const built = buildKasabayPrompt(makeRequest({ lastTopicDiscussed: '' }));
    check(built.systemPrompt.includes(NO_RECENT_TOPIC), 'empty last topic falls back to the no-prior-session note');
  }

  // --- 8. vibe-check phrasing ----------------------------------------------
  {
    check(describeCognitiveModifier('tired').toLowerCase().includes('tired'), 'describeCognitiveModifier(tired) returns tired phrasing');
    check(describeCognitiveModifier('focused') !== describeCognitiveModifier('restless'), 'different modifiers produce different phrasing');
  }

  // --- 9. rule-#3 misconception note ---------------------------------------
  {
    check(buildMisconceptionNote(null) === '', 'no misconception -> empty note');
    const found = {
      has_misconception: true,
      misconception_type: 'WRONG_CAUSATION',
      specific_wrong_belief: 'plants eat soil',
      correct_understanding: 'plants make their own food',
    };
    const note = buildMisconceptionNote(found);
    check(note.includes('plants eat soil') && note.includes('WRONG_CAUSATION'), 'misconception note carries the belief + type');

    const withNote = buildKasabayPrompt(makeRequest(), found);
    check(withNote.systemPrompt.includes('plants eat soil'), 'the misconception note is woven into the system prompt (rule #3)');

    const notDetected = { has_misconception: false };
    check(buildMisconceptionNote(notDetected) === '', 'a not-detected misconception adds no note');
  }

  // --- 10. compact offline prompt ------------------------------------------
  {
    const offline = buildKasabayOfflinePrompt(makeRequest());
    const online = buildKasabayPrompt(makeRequest());
    check(!offline.systemPrompt.includes('{{'), 'offline prompt has no unreplaced tokens');
    check(offline.systemPrompt.length < online.systemPrompt.length, 'offline system prompt is more compact than the online one');
    check(offline.systemPrompt.includes('A fraction shows part of a whole.'), 'offline prompt still carries the MELC note');
    check(offline.userPrompt.includes(makeRequest().studentMessage), 'offline user prompt carries the student message');
  }
}

main();

if (failures > 0) {
  console.error(`\n${failures} check(s) failed.`);
  process.exit(1);
}
console.log('\nAll Kasabay Mode checks passed.');
