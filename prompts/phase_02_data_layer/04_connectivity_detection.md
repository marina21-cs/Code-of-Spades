# 2.4 Connectivity & Signal-Tier Detection

## Context

<context>
Suri's 3-tier AI routing (spec Section 5.2) depends on knowing the live network state: strong signal (4G/WiFi) → Tier 1, weak signal (2G/3G via `effectiveType`) → Tier 2, no signal → Tier 3 on-device. This step uses `@react-native-community/netinfo` to derive a `SignalTier` and exposes it through a store so the AI router (Phase 4) and the UI tier indicator (Phase 5) can react instantly — including the live Airplane-Mode demo (spec Section 11, item 9).
</context>

## Prerequisites

<prerequisites>
- `@react-native-community/netinfo` installed (Phase 0)
- `SignalTier` type in `src/types`
</prerequisites>

## AI Implementation Prompt

<instructions>
Build a connectivity store that maps netinfo state to a `SignalTier`.

Think step by step:

1. **Tier mapping** (`src/features/ai/signal-tier.ts`)
   - Pure function `deriveSignalTier(state: NetInfoState): SignalTier`:
     - Not connected OR not internet-reachable → `'offline'`.
     - Connected via cellular with `effectiveType` of `'2g'`/`'slow-2g'`/`'3g'` → `'weak'`.
     - Connected via WiFi or cellular `'4g'`/unknown-but-reachable → `'strong'`.
   - Keep the thresholds in `src/constants` so they're tunable.

2. **Connectivity store** (`src/features/ai/connectivity-store.ts`)
   - Zustand store holding `{ tier: SignalTier, isInternetReachable: boolean | null, raw: NetInfoState | null }`.
   - On app start, subscribe with `NetInfo.addEventListener` and update the store on every change. Also do one `NetInfo.fetch()` to seed initial state.
   - Provide a cleanup to unsubscribe.
   - Add light debounce/hysteresis so a brief blip doesn't thrash the tier (e.g., require a state to hold ~750ms before switching to a worse tier; switch to better tier immediately).

3. **Hooks**
   - `useSignalTier(): SignalTier` and `useIsOffline(): boolean` selectors.

4. **Startup wiring**
   - Initialize the listener in `app/_layout.tsx` (effect) and unsubscribe on unmount.

5. **Dev affordance**
   - Add a tiny dev-only overlay (behind `__DEV__`) showing the current tier, so testers can see transitions during the Airplane-Mode test.
</instructions>

<requirements>
### Functional Requirements
- Airplane Mode → tier becomes `offline` within ~1s.
- Restoring WiFi → tier returns to `strong`.
- Weak cellular (`2g`/`3g`) → tier is `weak`.

### Technical Requirements
- One listener; store updated centrally.
- Hysteresis prevents rapid flapping.
- Pure, unit-testable `deriveSignalTier`.

### File Naming Conventions
- `signal-tier.ts`, `connectivity-store.ts`.
</requirements>

<output_files>
1. `suri/src/features/ai/signal-tier.ts` — `deriveSignalTier` pure fn
2. `suri/src/features/ai/connectivity-store.ts` — store + listener
3. `suri/src/features/ai/index.ts` — MODIFIED: export hooks
4. `suri/src/constants/index.ts` — MODIFIED: tier thresholds + hysteresis ms
5. `suri/app/_layout.tsx` — MODIFIED: start/stop netinfo listener
6. `suri/src/components/DevTierBadge.tsx` — `__DEV__`-only overlay
</output_files>

## Directory Structure

```
src/features/ai/
├── signal-tier.ts        ← NEW
├── connectivity-store.ts ← NEW
└── index.ts              ← MODIFIED
```

## Verification

<verification>
- [ ] `deriveSignalTier` returns correct tier for offline / 2g / 3g / 4g / wifi inputs
- [ ] Enabling Airplane Mode flips the store to `offline`
- [ ] Disabling Airplane Mode returns to `strong`
- [ ] Dev tier badge updates live
- [ ] `npm run typecheck` passes
</verification>

## Troubleshooting

| Symptom | Likely Cause | Fix |
|---|---|---|
| Tier stuck on stale value | Listener not started / not updating store | Confirm `addEventListener` runs once at startup and writes the store |
| `isInternetReachable` null forever | Reachability probe blocked | Treat persistent null + connected as `strong`; document fallback |
| Rapid tier flapping | No hysteresis | Add the debounce described above |

---

**Previous**: [2.3 Learning Profile Store](./03_learning_profile_store.md) | **Next**: [Phase 2 Checklist](./99_PHASE_CHECKLIST.md)
