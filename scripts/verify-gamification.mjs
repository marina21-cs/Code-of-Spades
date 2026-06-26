/**
 * Headless verification for the gamification economy + adaptive difficulty
 * (spec 5.9) and its telemetry wiring (spec 5.10).
 *
 * WHY THIS EXISTS:
 *   resourceService.ts depends on expo-sqlite (native), so it can't be imported
 *   in plain Node. This script imports the REAL pure logic (economyLogic.ts) and
 *   replays completeReview()'s transaction body against node:sqlite using the
 *   REAL schema DDL — proving both the economy math AND that one review drives
 *   the game-loop tables (resources / player_state / difficulty_state) and the
 *   B2B queue (competency_events) together.
 *
 * RUN: node --import ./scripts/register-ts.mjs scripts/verify-gamification.mjs
 */
import { DatabaseSync } from 'node:sqlite';

import {
  eventTypeFor,
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
const approx = (a, b) => Math.abs(a - b) < 1e-9;
const byType = (drops) => Object.fromEntries(drops.map((d) => [d.type, d.amount]));

// ===== Part A: pure economy logic (the real functions) ====================
{
  // resourceDropsFor — deterministic via injected rng.
  const rich = byType(resourceDropsFor(0.5, 1, () => 0));
  check(rich.tool === 1, 'dropRate 1 + winning roll yields a rare tool');
  check(rich.coin === 3, `coins scale with mastery (got ${rich.coin})`);
  check(rich.seed === 2, `seed count grows with mastery (got ${rich.seed})`);

  const noRare = byType(resourceDropsFor(0, 0, () => 0));
  check(noRare.coin === undefined && noRare.tool === undefined, 'dropRate 0 yields no coin/tool (heavily rate-gated)');
  check(noRare.seed === 1, 'a seed is always awarded for participation');

  const mastered = byType(resourceDropsFor(0.9, 0.15, () => 0.5));
  check(mastered.coin === undefined && mastered.tool === undefined, 'high mastery + low dropRate suppresses rare drops');

  // xpForResult
  check(xpForResult(true) === 20, 'a correct review grants 20 xp');
  check(xpForResult(false) === 5, 'an incorrect review still grants 5 xp');

  // levelForXp — square-root curve, floored at level 1, world stage every 5.
  check(levelForXp(0).level === 1 && levelForXp(0).worldStage === 0, 'level 1 / stage 0 at 0 xp');
  check(levelForXp(100).level === 1, '100 xp is still level 1 on the sqrt curve');
  check(levelForXp(400).level === 2, '400 xp maps to level 2');
  check(levelForXp(2500).level === 5 && levelForXp(2500).worldStage === 1, '2500 xp -> level 5 / world stage 1');
  check(levelForXp(10000).level === 10 && levelForXp(10000).worldStage === 2, '10000 xp -> level 10 / world stage 2');

  // nextDifficulty — rolling weighted average prevMastery*0.7 + (correct?0.3:0).
  const up = nextDifficulty(0, true);
  check(approx(up.newMastery, 0.3), `correct from 0 -> mastery 0.3 (got ${up.newMastery})`);
  check(approx(up.dropRate, 0.48), `mid mastery keeps an encouraging drop rate (got ${up.dropRate})`);
  const flat = nextDifficulty(0.5, true);
  check(approx(flat.newMastery, 0.65), `rolling average: 0.5 -> 0.65 (got ${flat.newMastery})`);
  const down = nextDifficulty(0, false);
  check(approx(down.newMastery, 0) && approx(down.dropRate, 0.6), 'wrong from 0 keeps mastery 0 and a generous 0.6 drop rate');
  const masteredUpdate = nextDifficulty(0.9, true);
  check(masteredUpdate.newMastery > 0.8 && approx(masteredUpdate.dropRate, 0.15), 'mastery > 0.8 sharply reduces the drop rate to 0.15');

  // eventTypeFor
  check(eventTypeFor(false, 0.9) === 'missed', 'wrong answer -> missed');
  check(eventTypeFor(true, 0.85) === 'mastered', 'correct + high mastery -> mastered');
  check(eventTypeFor(true, 0.3) === 'reviewed', 'correct + low mastery -> reviewed');
}

// ===== Part B: completeReview transaction (replayed on node:sqlite) =======
const db = new DatabaseSync(':memory:');
db.exec(CREATE_TABLES_SQL);
db.exec(`INSERT INTO player_state (id, level, xp, world_stage) VALUES (1, 1, 0, 0);`);
for (const t of RESOURCE_TYPES) {
  db.prepare(`INSERT INTO resources (resource_type, quantity) VALUES (?, 0)`).run(t);
}

function enqueueCompetencyEvent(e) {
  db.prepare(
    `INSERT INTO competency_events (event_type, competency_code, is_correct, payload, created_at, synced_at)
     VALUES (?, ?, ?, ?, datetime('now'), NULL)`,
  ).run(e.event_type, e.competency_code, e.is_correct ? 1 : 0, e.payload);
}

// Mirror of resourceService.completeReview's transaction body, with injected rng.
function completeReview(code, wasCorrect, rng) {
  const prevRow = db.prepare('SELECT mastery FROM difficulty_state WHERE competency_code = ?').get(code);
  const prevMastery = prevRow?.mastery ?? 0;

  const { newMastery, dropRate } = nextDifficulty(prevMastery, wasCorrect);
  const drops = resourceDropsFor(newMastery, dropRate, rng);
  const xpGained = xpForResult(wasCorrect);
  const eventType = eventTypeFor(wasCorrect, newMastery);
  const difficulty = Math.min(5, Math.max(1, Math.round(1 + newMastery * 4)));

  db.prepare(
    `INSERT INTO difficulty_state (competency_code, mastery, difficulty, drop_rate) VALUES (?, ?, ?, ?)
     ON CONFLICT(competency_code) DO UPDATE SET
       mastery = excluded.mastery, difficulty = excluded.difficulty, drop_rate = excluded.drop_rate, updated_at = datetime('now')`,
  ).run(code, newMastery, difficulty, dropRate);

  for (const drop of drops) {
    db.prepare(
      `INSERT INTO resources (resource_type, quantity) VALUES (?, ?)
       ON CONFLICT(resource_type) DO UPDATE SET quantity = quantity + excluded.quantity, updated_at = datetime('now')`,
    ).run(drop.type, drop.amount);
  }

  const xpRow = db.prepare('SELECT xp FROM player_state WHERE id = 1').get();
  const newXp = (xpRow?.xp ?? 0) + xpGained;
  const { level, worldStage } = levelForXp(newXp);
  db.prepare(`UPDATE player_state SET xp = ?, level = ?, world_stage = ?, updated_at = datetime('now') WHERE id = 1`).run(
    newXp,
    level,
    worldStage,
  );

  enqueueCompetencyEvent({
    event_type: eventType,
    competency_code: code,
    is_correct: wasCorrect,
    payload: JSON.stringify({ newMastery, dropRate, difficulty, xpGained, drops }),
  });

  return { newMastery, dropRate, difficulty, drops, xpGained, level, worldStage, eventType };
}

const CODE = 'S6LT-IIe-f-3';

// --- first review: correct, winning rolls (rng -> 0) ----------------------
const r1 = completeReview(CODE, true, () => 0);
check(r1.xpGained === 20, `first correct review awards 20 xp (got ${r1.xpGained})`);
check(r1.eventType === 'reviewed', 'a first correct review at low mastery is "reviewed"');
check(r1.difficulty === 2, `difficulty derived from mastery 0.3 is 2 (got ${r1.difficulty})`);

const res1 = Object.fromEntries(db.prepare('SELECT resource_type, quantity FROM resources').all().map((r) => [r.resource_type, r.quantity]));
check(
  res1.seed === 1 && res1.wood === 2 && res1.coin === 2 && res1.tool === 1,
  `resources credited (seed=${res1.seed}, wood=${res1.wood}, coin=${res1.coin}, tool=${res1.tool})`,
);

const p1 = db.prepare('SELECT xp, level, world_stage FROM player_state WHERE id = 1').get();
check(p1.xp === 20 && p1.level === 1, `player progression updated (xp=${p1.xp}, level=${p1.level})`);

const d1 = db.prepare('SELECT mastery, difficulty, drop_rate FROM difficulty_state WHERE competency_code = ?').get(CODE);
check(approx(d1.mastery, 0.3) && d1.difficulty === 2 && approx(d1.drop_rate, 0.48), 'difficulty_state upserted (mastery 0.3, difficulty 2, dropRate 0.48)');

// --- telemetry wiring: one review enqueued exactly one UNSYNCED event ------
const ev = db.prepare('SELECT event_type, synced_at, payload FROM competency_events').all();
check(ev.length === 1 && ev[0].synced_at === null, 'completeReview enqueued exactly one unsynced competency event');
check(ev[0].event_type === 'reviewed', 'the enqueued event type is "reviewed"');
check(JSON.parse(ev[0].payload).xpGained === 20, 'event payload carries the xp gained');
check(db.prepare('SELECT COUNT(*) AS n FROM quiz_attempts').get().n === 0, 'completeReview does not write quiz_attempts (per current spec)');

// --- second review: wrong, losing rolls (rng -> 0.99) ---------------------
const r2 = completeReview(CODE, false, () => 0.99);
check(r2.eventType === 'missed', 'a wrong review is classified "missed"');
check(r2.drops.length === 1 && r2.drops[0].type === 'seed', 'a wrong review at low dropRate yields only a consolation seed');

const d2 = db.prepare('SELECT mastery FROM difficulty_state WHERE competency_code = ?').get(CODE);
check(approx(d2.mastery, 0.21), `wrong answer lowers mastery via rolling average (0.3 -> 0.21, got ${d2.mastery})`);

const res2 = Object.fromEntries(db.prepare('SELECT resource_type, quantity FROM resources').all().map((r) => [r.resource_type, r.quantity]));
check(res2.seed === 2 && res2.wood === 2, 'only the seed count grew on the missed review');

const p2 = db.prepare('SELECT xp FROM player_state WHERE id = 1').get();
check(p2.xp === 25, `xp accumulated across reviews (20 + 5 = ${p2.xp})`);

const missed = db.prepare(`SELECT COUNT(*) AS n FROM competency_events WHERE event_type = 'missed'`).get().n;
check(missed === 1, 'the wrong review enqueued exactly one "missed" event');

db.close();

if (failures > 0) {
  console.error(`\n${failures} check(s) failed.`);
  process.exit(1);
}
console.log('\nAll gamification economy + telemetry-wiring checks passed.');
