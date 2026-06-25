# 9.1 Streak Engine & Badges

## Context

<context>
Study streaks are tracked locally in SQLite with no backend (spec 5.9). Streaks build engagement, drive the mascot's evolution (9.2), and Focus Mode increases mid-session micro-rewards to sustain attention (spec 5.6/5.9). This step implements the streak math, the study log, and the badge system over the Phase 2 tables.
</context>

## Prerequisites

<prerequisites>
- Phase 2 (`streaks`, `badges`, `study_log` tables + `streak-repository.ts`)
- Phase 5.3 (mascot Celebrating trigger)
</prerequisites>

## AI Implementation Prompt

<instructions>
Build the streak/badge engine and a reward trigger.

Think step by step:

1. **Streak logic** (`src/features/gamification/streak.ts`)
   - `recordStudyActivity()`: called when the student meaningfully studies (e.g., sends a question / completes a quiz item). Logic:
     - Compare today's local date to `last_study_date`. Same day → no streak change, increment `study_log.questions_answered`. Consecutive day → `current_streak += 1`. Gap > 1 day → reset `current_streak = 1`. Update `longest_streak`. Use local-date math (ignore time-of-day; handle timezone via local date string).
   - `getStreak()` returns current/longest/stage.
   - Pure helpers (`computeNextStreak(prevDate, today, current)`) kept testable; the repository call is separate.

2. **Badges** (`src/features/gamification/badges.ts`)
   - Define badge keys: `streak_3`, `streak_7`, `streak_30`, `subject_complete_<x>`, `voice_first`, `camera_first` (camera = roadmap; keep the key), `quiz_10`.
   - `checkAndAwardBadges(context)`: evaluate which badges are newly earned given the current state; insert into `badges` (unique key) and return newly awarded ones for UI celebration.

3. **Reward trigger** (`src/features/gamification/rewards.ts`)
   - On streak increment / badge / correct quiz answer, fire a `celebrate()` that triggers the mascot Celebrating state (Phase 5.3) and a small toast.
   - Focus Mode: increase micro-reward cadence (spec 5.6) — e.g., celebrate more often between responses. Read `focusMode` from the store; keep it tasteful, not spammy.

4. **Store** (`src/features/gamification/gamification-store.ts`)
   - Holds current streak/stage/recent badges for UI; refreshed after `recordStudyActivity`.

5. **Wire in**
   - Call `recordStudyActivity()` from the chat send flow (Phase 5.1) on a successful turn, and from quiz interactions if present.
</instructions>

<requirements>
### Functional Requirements
- Same-day study doesn't inflate streak; consecutive day increments; gap resets.
- Badges award once and persist.
- Rewards trigger mascot celebration; Focus Mode increases frequency.

### Technical Requirements
- Local-date math; no backend.
- Pure, testable streak computation.
- Badge keys unique in DB.

### File Naming Conventions
- Files under `src/features/gamification/`.
</requirements>

<output_files>
1. `suri/src/features/gamification/streak.ts` — streak math + study log
2. `suri/src/features/gamification/badges.ts` — badge definitions + awarding
3. `suri/src/features/gamification/rewards.ts` — celebration triggers
4. `suri/src/features/gamification/gamification-store.ts` — UI state
5. `suri/src/features/chat/chat-store.ts` — MODIFIED: record activity on successful turn
6. `suri/src/features/gamification/index.ts` — MODIFIED barrel
</output_files>

## Directory Structure

```
src/features/gamification/
├── streak.ts              ← NEW
├── badges.ts              ← NEW
├── rewards.ts             ← NEW
├── gamification-store.ts  ← NEW
└── index.ts               ← MODIFIED
```

## Verification

<verification>
- [ ] `computeNextStreak` returns correct values for same-day / consecutive / gap cases
- [ ] Studying today updates streak + study_log
- [ ] `streak_3` badge awards at 3-day streak and persists (not re-awarded)
- [ ] Correct answer / milestone triggers mascot Celebrating
- [ ] Focus Mode increases micro-reward frequency
- [ ] `npm run typecheck` passes
</verification>

## Troubleshooting

| Symptom | Likely Cause | Fix |
|---|---|---|
| Streak inflates same day | Comparing timestamps not dates | Compare local date strings (YYYY-MM-DD) |
| Streak resets across timezones | UTC vs local | Use device-local date consistently |
| Badge re-awards | Not unique-keyed | Unique index on `badge_key`; insert-or-ignore |

---

**Previous**: [Phase 9 Overview](./00_PHASE_OVERVIEW.md) | **Next**: [9.2 Mascot Evolution](./02_mascot_evolution.md)
