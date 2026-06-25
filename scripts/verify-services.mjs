/**
 * Headless verification for the voice/visual/gamification service layer.
 *
 * WHY THIS EXISTS:
 *   TTS/STT and the streak service touch native modules / expo-sqlite (device
 *   only). This script verifies the pure, logic-heavy parts plus the streak
 *   persistence behavior (replayed against node:sqlite using the REAL schema DDL
 *   and the REAL streakLogic):
 *     - parseVisualSpec block isolation + typed validation + palettes
 *     - cleanMarkdownForSpeech
 *     - selectSTTEngine routing
 *     - streak consecutive-date math, evolution tiers, badge thresholds
 *     - recordStudySession idempotency + badge unlock (via node:sqlite)
 *
 * RUN: node --import ./scripts/register-ts.mjs scripts/verify-services.mjs
 */
import { DatabaseSync } from 'node:sqlite';

import { parseVisualSpec, paletteFor, applyColorVisionPalette } from '../src/visuals/visualParser.ts';
import { cleanMarkdownForSpeech } from '../src/voice/speechText.ts';
import { selectSTTEngine } from '../src/voice/sttPolicy.ts';
import {
  computeStreakUpdate,
  evolutionTierForStreak,
  badgeIdsForStreak,
  daysBetween,
} from '../src/gamification/streakLogic.ts';
import { CREATE_TABLES_SQL } from '../src/db/schema.ts';

let failures = 0;
function check(condition, message) {
  if (condition) {
    console.log('✅', message);
  } else {
    failures += 1;
    console.error('❌', message);
  }
}

// --- 1. Visual spec parsing (the spec script case + more) -----------------
{
  const payload =
    'Sample text here... ```json\n{"type":"bar_chart","title":"Cell Stats","data":{"labels":["A","B"],"values":[10,20]}}\n``` trailing thoughts.';
  const spec = parseVisualSpec(payload);
  check(spec !== null, 'parseVisualSpec isolates the fenced JSON block');
  check(spec?.type === 'bar_chart', 'parsed spec type is bar_chart');
  check(spec?.title === 'Cell Stats' && spec?.data?.values?.[1] === 20, 'bar_chart fields extracted correctly');

  check(parseVisualSpec('no json here') === null, 'plain prose yields null');
  check(parseVisualSpec('```json\n{"type":"bar_chart","data":{"labels":["A"],"values":[1,2]}}\n```') === null, 'mismatched labels/values rejected');
  check(parseVisualSpec('```json\n{"type":"unknown_kind"}\n```') === null, 'unknown visual type rejected');

  const rawObject = parseVisualSpec('{"type":"number_line","min":0,"max":10,"step":2}');
  check(rawObject?.type === 'number_line', 'balanced-brace fallback parses a raw JSON object');

  const diagram = parseVisualSpec('```json\n{"type":"diagram","components":[{"label":"Nucleus"}]}\n```');
  check(diagram?.type === 'diagram', 'diagram spec parsed');

  const withPalette = applyColorVisionPalette(spec, 'deuteranopia');
  check(Array.isArray(withPalette.palette) && withPalette.palette.length === 2, 'palette applied sized to data');
  check(paletteFor('tritanopia', 3).length === 3, 'paletteFor returns requested count');
}

// --- 2. Markdown -> speech cleanup ----------------------------------------
{
  const dirty = '# Title\n\nThis is **bold** and `code` and a [link](http://x).\n\n- item one\n\n```json\n{"type":"bar_chart"}\n```';
  const clean = cleanMarkdownForSpeech(dirty);
  check(!clean.includes('#') && !clean.includes('*') && !clean.includes('`'), 'markdown symbols stripped');
  check(!clean.includes('{') && !clean.toLowerCase().includes('bar_chart'), 'fenced JSON block removed from speech');
  check(clean.includes('bold') && clean.includes('link') && clean.includes('item one'), 'readable words preserved');
}

// --- 3. STT engine routing ------------------------------------------------
{
  check(selectSTTEngine('strong', true) === 'groq', 'strong + key -> groq');
  check(selectSTTEngine('weak', true) === 'groq', 'weak + key -> groq');
  check(selectSTTEngine('strong', false) === 'native', 'no key -> native');
  check(selectSTTEngine('offline', true) === 'native', 'offline -> native');
}

// --- 4. Streak logic ------------------------------------------------------
{
  check(daysBetween('2026-06-01', '2026-06-02') === 1, 'daysBetween consecutive = 1');
  check(daysBetween('2026-06-01', '2026-07-01') === 30, 'daysBetween across month = 30');

  let state = { currentStreak: 0, longestStreak: 0, lastStudyDate: null, totalStudyDays: 0 };
  state = computeStreakUpdate(state, '2026-06-01').next;
  check(state.currentStreak === 1 && state.totalStudyDays === 1, 'first session starts streak at 1');

  const same = computeStreakUpdate(state, '2026-06-01');
  check(same.changed === false, 'same-day session does not change streak');

  state = computeStreakUpdate(state, '2026-06-02').next;
  check(state.currentStreak === 2, 'next-day session increments streak');

  state = computeStreakUpdate(state, '2026-06-05').next;
  check(state.currentStreak === 1, 'a gap resets the streak');
  check(state.longestStreak === 2, 'longest streak is retained');

  check(evolutionTierForStreak(0) === 'kit' && evolutionTierForStreak(3) === 'young' && evolutionTierForStreak(7) === 'elder', 'evolution tiers map correctly');
  check(badgeIdsForStreak(7).join(',') === 'streak_3,streak_7', 'badge thresholds at streak 7');
}

// --- 5. recordStudySession idempotency + badge unlock (node:sqlite) -------
{
  const db = new DatabaseSync(':memory:');
  db.exec(CREATE_TABLES_SQL);
  db.exec(`INSERT INTO streaks (id, current_streak, longest_streak, total_study_days) VALUES (1, 0, 0, 0);`);
  const badgeStmt = db.prepare(`INSERT INTO badges (id, name, description, earned_at) VALUES (?, ?, ?, NULL)`);
  for (const id of ['streak_3', 'streak_7', 'streak_30']) badgeStmt.run(id, id, id);

  // Replays streakService.recordStudySession against node:sqlite using the real logic.
  function recordStudySession(date) {
    const row = db
      .prepare('SELECT current_streak, longest_streak, last_study_date, total_study_days FROM streaks WHERE id = 1')
      .get();
    const prev = {
      currentStreak: row.current_streak,
      longestStreak: row.longest_streak,
      lastStudyDate: row.last_study_date,
      totalStudyDays: row.total_study_days,
    };
    const { changed, next } = computeStreakUpdate(prev, date);
    if (changed) {
      db.prepare(
        `UPDATE streaks SET current_streak=?, longest_streak=?, last_study_date=?, total_study_days=? WHERE id=1`,
      ).run(next.currentStreak, next.longestStreak, next.lastStudyDate, next.totalStudyDays);
      for (const id of badgeIdsForStreak(next.currentStreak)) {
        db.prepare(`UPDATE badges SET earned_at = datetime('now') WHERE id = ? AND earned_at IS NULL`).run(id);
      }
    }
    return { currentStreak: next.currentStreak, evolutionTier: evolutionTierForStreak(next.currentStreak) };
  }

  const run1 = recordStudySession('2026-06-01');
  const run2 = recordStudySession('2026-06-01');
  check(run1.currentStreak === run2.currentStreak && run1.currentStreak === 1, 'recordStudySession idempotent within a day');

  // Advance to a 3-day streak and confirm the badge unlocks once.
  recordStudySession('2026-06-02');
  const day3 = recordStudySession('2026-06-03');
  check(day3.currentStreak === 3, 'three consecutive days -> streak 3');
  const streak3Badge = db.prepare(`SELECT earned_at FROM badges WHERE id = 'streak_3'`).get();
  check(streak3Badge.earned_at != null, 'streak_3 badge unlocked at streak 3');
  const streak7Badge = db.prepare(`SELECT earned_at FROM badges WHERE id = 'streak_7'`).get();
  check(streak7Badge.earned_at == null, 'streak_7 badge still locked at streak 3');

  db.close();
}

if (failures > 0) {
  console.error(`\n${failures} check(s) failed.`);
  process.exit(1);
}
console.log('\nAll voice/visual/gamification service checks passed.');
