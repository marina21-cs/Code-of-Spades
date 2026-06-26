/**
 * Headless verification for the gamification economy + adaptive difficulty
 * (spec 5.9) and its telemetry wiring (spec 5.10).
 *
 * WHY THIS EXISTS:
 *   resourceService.ts depends on expo-sqlite (native), so it can't be imported
 *   in plain Node. This script imports the REAL pure logic (economyLogic.ts) and
 *   replays completeReview()'s persistence against node:sqlite using the REAL
 *   schema DDL — proving both the economy math AND that one review drives the
 *   game-loop tables (resources / player_state / difficulty_state) and the B2B
 *   queue (quiz_attempts + competency_events) at the same time.
 *
 * RUN: node --import ./scripts/register-ts.mjs scripts/verify-gamification.mjs
 */
import { DatabaseSync } from 'node:sqlite';

import {
  eventTypeFor,
  initialDifficulty,
  levelForXp,
  nextDifficulty,
  resourceDropsFor,
  xpForResult,
} from '../src/gamification/economyLogic.ts';
import { CREATE_TABLES_SQL, RESOURCE_TYPES } from '../src/db/schema.ts';

let failures = 0;
function check(condition, message) {
  if (condition) {
    console.log('✅', message);
  } else {
    failures += 1;
    console.error('❌', message);
  }
}

// ===== Part A: pure economy logic (the real functions) ====================
{
  // resourceDropsFor — deterministic via injected rng
  const correctRare = resourceDropsFor({ wasCorrect: true, difficulty: 3 }, 1, () => 0);
  check(correctRare.some((d) => d.resourceType === 'tool'), 'correct + dropRate 1 yields a rare tool drop');
  const coin = correctRare.find((d) => d.resourceType === 'coin');
  check(coin?.quantity === 3, `coins scale with difficulty (got ${coin?.quantity})`);

  const noRare = resourceDropsFor({ wasCorrect: true, difficulty: 3 }, 0.5, () => 0.9);
  check(!noRare.some((d) => d.resourceType === 'tool'), 'rng above dropRate suppresses the rare drop');

  const wrong = resourceDropsFor({ wasCorrect: false, difficulty: 5 }, 1, () => 0);
  check(wrong.length === 1 && wrong[0].resourceType === 'seed', 'incorrect yields only a consolation seed');

  // xpForResult
  check(xpForResult(true, 2) === 20, 'xp for a correct difficulty-2 item is 20');
  check(xpForResult(false, 5) === 5, 'xp for an incorrect item is a flat 5');

  // levelForXp
  check(levelForXp(0).level === 1 && levelForXp(0).worldStage === 0, 'level 1 / stage 0 at 0 xp');
  check(levelForXp(250).level === 3, '250 xp maps to level 3');
  check(levelForXp(500).level === 6 && levelForXp(500).worldStage === 1, '500 xp maps to level 6 / world stage 1');

  // nextDifficulty
  const base = initialDifficulty('S6LT-IIe-f-3'); // mastery 0, difficulty 2, dropRate 0.5
  const up = nextDifficulty(base, true);
  check(Math.abs(up.mastery - 0.1) < 1e-9 && up.difficulty === 3, 'a correct answer raises mastery and difficulty');
  check(up.dropRate > 0.5, 'low mastery keeps the drop rate encouraging (> 0.5)');
  const down = nextDifficulty(base, false);
  check(down.mastery === 0 && down.difficulty === 1, 'a wrong answer floors mastery and lowers difficulty');

  // eventTypeFor
  check(eventTypeFor(false, 0.9) === 'missed', 'wrong answer -> missed');
  check(eventTypeFor(true, 0.85) === 'mastered', 'correct + high mastery -> mastered');
  check(eventTypeFor(true, 0.3) === 'reviewed', 'correct + low mastery -> reviewed');
}

// ===== Part B: completeReview persistence (replayed on node:sqlite) =======
const db = new DatabaseSync(':memory:');
db.exec(CREATE_TABLES_SQL);
db.exec(`INSERT INTO player_state (id, level, xp, world_stage) VALUES (1, 1, 0, 0);`);
for (const t of RESOURCE_TYPES) {
  db.prepare(`INSERT INTO resources (resource_type, quantity) VALUES (?, 0)`).run(t);
}

// Reproduce eventQueue writers + completeReview plumbing using the REAL pure logic.
function recordQuizAttempt(a) {
  db.prepare(
    `INSERT INTO quiz_attempts (subject, grade_level, competency_code, question, student_answer, is_correct)
     VALUES (?, ?, ?, ?, ?, ?)`,
  ).run(
    a.subject ?? null,
    a.gradeLevel ?? null,
    a.competencyCode ?? null,
    a.question,
    a.studentAnswer ?? null,
    a.isCorrect ? 1 : 0,
  );
}

function enqueueCompetencyEvent(e) {
  const payload = e.payload != null ? JSON.stringify(e.payload) : null;
  const isCorrect = e.isCorrect == null ? null : e.isCorrect ? 1 : 0;
  db.prepare(
    `INSERT INTO competency_events (event_type, competency_code, subject, grade_level, is_correct, payload)
     VALUES (?, ?, ?, ?, ?, ?)`,
  ).run(e.eventType, e.competencyCode ?? null, e.subject ?? null, e.gradeLevel ?? null, isCorrect, payload);
}

function getDifficultyState(code) {
  const row = db
    .prepare('SELECT competency_code, mastery, difficulty, drop_rate FROM difficulty_state WHERE competency_code = ?')
    .get(code);
  return row
    ? { competencyCode: row.competency_code, mastery: row.mastery, difficulty: row.difficulty, dropRate: row.drop_rate }
    : initialDifficulty(code);
}

function completeReview(code, wasCorrect, opts = {}) {
  const prev = getDifficultyState(code);
  const drops = resourceDropsFor({ wasCorrect, difficulty: prev.difficulty }, prev.dropRate, opts.rng);
  const next = nextDifficulty(prev, wasCorrect);
  const xpGained = xpForResult(wasCorrect, prev.difficulty);
  const eventType = eventTypeFor(wasCorrect, next.mastery);

  for (const drop of drops) {
    db.prepare(
      `INSERT INTO resources (resource_type, quantity) VALUES (?, ?)
       ON CONFLICT(resource_type) DO UPDATE SET quantity = quantity + excluded.quantity, updated_at = datetime('now')`,
    ).run(drop.resourceType, drop.quantity);
  }

  const xpRow = db.prepare('SELECT xp FROM player_state WHERE id = 1').get();
  const newXp = (xpRow?.xp ?? 0) + xpGained;
  const { level, worldStage } = levelForXp(newXp);
  db.prepare(`UPDATE player_state SET xp = ?, level = ?, world_stage = ?, updated_at = datetime('now') WHERE id = 1`).run(
    newXp,
    level,
    worldStage,
  );

  db.prepare(
    `INSERT INTO difficulty_state (competency_code, mastery, difficulty, drop_rate) VALUES (?, ?, ?, ?)
     ON CONFLICT(competency_code) DO UPDATE SET
       mastery = excluded.mastery, difficulty = excluded.difficulty, drop_rate = excluded.drop_rate, updated_at = datetime('now')`,
  ).run(next.competencyCode, next.mastery, next.difficulty, next.dropRate);

  recordQuizAttempt({
    question: opts.question ?? `Review: ${code}`,
    isCorrect: wasCorrect,
    competencyCode: code,
    subject: opts.subject ?? null,
    gradeLevel: opts.gradeLevel ?? null,
    studentAnswer: opts.studentAnswer ?? null,
  });
  enqueueCompetencyEvent({
    eventType,
    competencyCode: code,
    subject: opts.subject ?? null,
    gradeLevel: opts.gradeLevel ?? null,
    isCorrect: wasCorrect,
    payload: { difficulty: next.difficulty, mastery: next.mastery, xpGained, drops },
  });

  return { drops, xpGained, level, worldStage, difficulty: next, eventType };
}

const CODE = 'S6LT-IIe-f-3';

// --- first review: correct, force the rare drop ---------------------------
const r1 = completeReview(CODE, true, { subject: 'Science', gradeLevel: 6, rng: () => 0 });
check(r1.xpGained === 20, `first review (difficulty 2) awards 20 xp (got ${r1.xpGained})`);

const resources = Object.fromEntries(
  db.prepare('SELECT resource_type, quantity FROM resources').all().map((r) => [r.resource_type, r.quantity]),
);
check(
  resources.seed === 1 && resources.coin === 2 && resources.tool === 1,
  `resources credited (seed=${resources.seed}, coin=${resources.coin}, tool=${resources.tool})`,
);

const player = db.prepare('SELECT xp, level, world_stage FROM player_state WHERE id = 1').get();
check(player.xp === 20 && player.level === 1, `player progression updated (xp=${player.xp}, level=${player.level})`);

const diff = db.prepare('SELECT mastery, difficulty FROM difficulty_state WHERE competency_code = ?').get(CODE);
check(diff.difficulty === 3 && Math.abs(diff.mastery - 0.1) < 1e-9, 'difficulty_state upserted to difficulty 3 / mastery 0.1');

// --- the telemetry wiring: one review wrote BOTH a quiz attempt and an event
check(db.prepare('SELECT COUNT(*) AS n FROM quiz_attempts').get().n === 1, 'completeReview wrote exactly one quiz_attempts row');
const events = db.prepare('SELECT event_type, synced_at, payload FROM competency_events').all();
check(events.length === 1 && events[0].synced_at === null, 'completeReview enqueued exactly one UNSYNCED competency event');
check(events[0].event_type === 'reviewed', 'a first correct review at low mastery is classified "reviewed"');
check(JSON.parse(events[0].payload).xpGained === 20, 'event payload carries the xp gained');

// --- second review: wrong answer adapts difficulty down + logs a miss -----
completeReview(CODE, false, { rng: () => 0.99 });
const diff2 = db.prepare('SELECT difficulty FROM difficulty_state WHERE competency_code = ?').get(CODE);
check(diff2.difficulty === 2, 'a wrong answer steps difficulty back down (3 -> 2)');
const missed = db.prepare(`SELECT COUNT(*) AS n FROM competency_events WHERE event_type = 'missed'`).get().n;
check(missed === 1, 'the wrong answer enqueued a "missed" event');
check(db.prepare('SELECT COUNT(*) AS n FROM quiz_attempts').get().n === 2, 'the second review wrote a second quiz attempt');

db.close();

if (failures > 0) {
  console.error(`\n${failures} check(s) failed.`);
  process.exit(1);
}
console.log('\nAll gamification economy + telemetry-wiring checks passed.');
