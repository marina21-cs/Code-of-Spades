# 9.2 Mascot Evolution Mechanic

## Context

<context>
Suri evolves visually as streaks build: kit fox → young fox → elder fox with subtle glowing markings — in the spirit of, but visually distinct from, Duolingo (spec 5.9/7). This step maps streak milestones to evolution stages, persists the stage, and updates the mascot's appearance, with a celebratory transition when the student levels up.
</context>

## Prerequisites

<prerequisites>
- Phase 5.3 (`SuriMascot`), Phase 9.1 (streak engine, `evolution_stage` in `streaks`)
</prerequisites>

## AI Implementation Prompt

<instructions>
Add evolution stages and tie them to streaks.

Think step by step:

1. **Stage model** (`src/features/gamification/evolution.ts`)
   - `EvolutionStage = 0 | 1 | 2` → kit / young / elder. Thresholds in constants, e.g., kit (streak < 7), young (7–29), elder (30+). Tunable.
   - `stageForStreak(currentStreak): EvolutionStage`.
   - On `recordStudyActivity`, compute the stage; if it increased, persist `evolution_stage` and return a `leveledUp` signal.

2. **Mascot appearance** (`src/features/chat/mascot/SuriMascot.tsx`)
   - Accept/derive the current stage and render the matching variant: kit (smaller, simpler), young, elder (subtle glowing markings). Keep distinct from Duolingo's owl/visual language.
   - Respect Low Motion (static variant per stage) and offline desaturation (Phase 5.3) — stage still reflected, just static/desaturated.

3. **Level-up celebration**
   - When `leveledUp`, play a one-time celebratory transition (Celebrating state + a brief "Suri grew!" moment). Under Low Motion, show a static congratulatory card instead.

4. **Profile display**
   - Show the current stage + streak on the Profile tab (small Suri portrait + "X-day streak").
</instructions>

<requirements>
### Functional Requirements
- Mascot appearance reflects the evolution stage.
- Crossing a threshold persists the new stage and celebrates once.
- Low Motion + offline states still reflect the stage (static/desaturated).

### Technical Requirements
- Stage thresholds in constants; `stageForStreak` pure.
- Stage persisted in `streaks.evolution_stage`.

### File Naming Conventions
- `evolution.ts` in gamification.
</requirements>

<output_files>
1. `suri/src/features/gamification/evolution.ts` — stage mapping + persistence
2. `suri/src/features/chat/mascot/SuriMascot.tsx` — MODIFIED: stage variants
3. `suri/app/(tabs)/profile.tsx` — MODIFIED: show stage + streak
4. `suri/src/constants/index.ts` — MODIFIED: stage thresholds
5. `suri/src/features/gamification/index.ts` — MODIFIED barrel
</output_files>

## Directory Structure

```
src/features/gamification/
└── evolution.ts   ← NEW
(mascot + profile MODIFIED)
```

## Verification

<verification>
- [ ] `stageForStreak` returns kit/young/elder at the right thresholds
- [ ] Crossing 7-day streak evolves the mascot and celebrates once
- [ ] Stage persists across restarts
- [ ] Low Motion shows a static stage variant; offline desaturates it
- [ ] Profile shows stage + streak
- [ ] `npm run typecheck` and `npm run lint` pass
</verification>

## Troubleshooting

| Symptom | Likely Cause | Fix |
|---|---|---|
| Celebrates every study | leveledUp computed wrong | Only signal when stage strictly increased |
| Stage resets | Not persisting `evolution_stage` | Persist on change; read on boot |
| Looks like Duolingo | Too-similar art | Use the fox identity + glowing markings (spec 7) |

---

**Previous**: [9.1 Streak Engine & Badges](./01_streak_engine.md) | **Next**: [9.3 Local Notifications](./03_local_notifications.md)
