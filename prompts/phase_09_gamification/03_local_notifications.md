# 9.3 Local Notifications

## Context

<context>
`expo-notifications` sends local (no-server) streak reminder notifications at the student's preferred study time (spec 5.9). Because everything is local, reminders work fully offline — fitting Suri's offline-first promise. This step schedules a daily reminder, lets the student choose the time, and nudges to protect a streak.
</context>

## Prerequisites

<prerequisites>
- `expo-notifications` (Phase 0), Phase 9.1 (streak state)
- Phase 6.3 (Settings screen to choose the time)
</prerequisites>

## AI Implementation Prompt

<instructions>
Build local notification scheduling and a settings control.

Think step by step:

1. **Notification service** (`src/features/gamification/notifications.ts`)
   - Request notification permission (graceful denial). Configure the notification handler.
   - `scheduleDailyReminder(hour, minute)`: schedule a repeating daily local notification at the chosen time with an encouraging, streak-aware message (e.g., "Tara, Suri's waiting — keep your X-day streak alive!"). Cancel any previous scheduled reminder first to avoid duplicates.
   - `cancelReminder()` and `getReminderTime()`.
   - All local — no push server, no network.

2. **Preferred time setting**
   - Persist the chosen reminder time (in the profile/secure-store or a small settings store). Add a time picker row in the Profile/Settings screen (Phase 6.3) and an enable/disable switch.

3. **Streak-aware copy**
   - Message reflects current streak when possible (read at schedule time; since content is fixed at schedule, re-schedule when the streak changes meaningfully, or keep a generic encouraging message — pick the simpler reliable option and document it).

4. **Lifecycle**
   - Re-assert the schedule on app start (in case the OS cleared it). Don't stack duplicates.
</instructions>

<requirements>
### Functional Requirements
- A daily local reminder fires at the chosen time, offline.
- Student can enable/disable and pick the time.
- No duplicate notifications scheduled.

### Technical Requirements
- Local notifications only (no server/push).
- Permission denial handled gracefully.
- Re-assert schedule on boot without stacking.

### File Naming Conventions
- `notifications.ts` in gamification.
</requirements>

<output_files>
1. `suri/src/features/gamification/notifications.ts` — schedule/cancel local reminders
2. `suri/src/features/profile/settings/ProfileSection.tsx` — MODIFIED: reminder time + toggle (or a new ReminderSection)
3. `suri/app/_layout.tsx` — MODIFIED: re-assert schedule on boot
4. `suri/app.json` — MODIFIED: notification config/permissions if needed
5. `suri/src/features/gamification/index.ts` — MODIFIED barrel
</output_files>

## Directory Structure

```
src/features/gamification/
└── notifications.ts   ← NEW
```

## Verification

<verification>
- [ ] Setting a reminder time schedules a daily local notification
- [ ] Disabling cancels it; no duplicates after toggling repeatedly
- [ ] Notification fires offline (airplane mode) at the set time
- [ ] Permission denial doesn't crash; feature degrades gracefully
- [ ] `npm run typecheck` and `npm run lint` pass
</verification>

## Troubleshooting

| Symptom | Likely Cause | Fix |
|---|---|---|
| Duplicate reminders | Not cancelling before re-scheduling | Cancel existing, then schedule |
| No notification on Android | Channel not set | Create an Android notification channel |
| Fires at wrong time | UTC vs local trigger | Use a daily local time trigger (hour/minute) |

---

**Previous**: [9.2 Mascot Evolution](./02_mascot_evolution.md) | **Next**: [Phase 9 Checklist](./99_PHASE_CHECKLIST.md)
