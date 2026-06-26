# Suri Integration — Audit Report

**Project:** Suri — Offline AI Study Companion for Filipino K-12 Learners
**Stack:** React Native · Expo SDK 54 (`54.0.35` installed) · TypeScript · expo-router
**Spec of record:** `suri-mobile-project-spec-v3.md`
**Audit date:** 2026-06-26
**Method:** Multi-agent concurrent audit (Navigation · Onboarding · Backend/DB · Component trees), aggregated and cross-verified against the live source.

**Legend:** ✅ Complete · 🟡 Partial (logic exists, UI/wiring missing) · ⚠️ Partial · ❌ Missing

> **Correction to Part 1:** Part 1 reported the Misconception module as missing. That was wrong. `src/features/misconception/` exists and is a complete backend (detector, parser, prompt builder, taxonomy lookup, ~18-entry taxonomy, types, Kwento adapter, headless verifier). Only its UI is missing. This report supersedes that finding.

---

## 1. Extraction Summary (Part 1)

| Item | Result |
|---|---|
| Zip located | `./zip(4).zip` (root) |
| Extracted to | `./suri-frontend-extracted` (36 files) |
| Package type | **Vite + React DOM web app** (built in Google AI Studio) — `react-dom`, `vite`, `tailwindcss`, `lucide-react`, `motion`, `@google/genai`, `express` |
| Matches Expo structure? | **No** — `index.html` → `src/main.tsx` (`createRoot`) → `App.tsx` renders `<div>` with Tailwind; navigation is a `useState<View>` switch (no router) |
| Merge action | **Not merged** (blocker rule honored — merging would contaminate the RN tree with incompatible web code) |
| Decision | Treat the prototype as a **visual design reference only**; port screens to RN primitives per spec v3 |
| Expo SDK | **v54 confirmed** (`package.json` `~54.0.0`, installed `54.0.35`) |

The prototype is the design reference for Part 3 porting. It contains views: `Landing`, `Onboarding`, `Chat`, `Library`, `Subject`, `QuizHub`, `QuizQuestion`, `Settings`, `Scanner`, `Sync`, `SyncDashboard`, `Activity`, `Streak`, `Evolution`, `ProfileResult`, `Offline` + `TopBar`/`BottomNav`. It has **no** Kasabay or Kwento screen, and its `BottomNav` models only 4 tabs.

---

## 2. Navigation Audit (Phase 2)

**Routing tree — current state of `app/`:**

```
app/
└── _layout.tsx     ← ONLY file. Root layout: DB init + seed pipeline, then <Slot/>.
```

There is **no `app/(tabs)/` group, no tab navigator, no `index.tsx`**. `expo-router` (~6.0.0), `react-native-screens`, and `react-native-safe-area-context` are installed and `typedRoutes` is enabled, so the `Tabs` navigator is available but unused. **Router strategy = expo-router (aligned with spec); 0 of 6 tab screens exist.**

| Tab (spec order) | Proposed route | Status | Required UI elements to generate | Prototype reference |
|---|---|---|---|---|
| **Kasabay** | `app/(tabs)/index.tsx` (default landing per spec §7) | ❌ Missing | `KasabayModeScreen`, `SuriDeskCanvas` (dark canvas + neon borders), `SuriIdleAnimation` (looping pixel-art; static on Low Motion), `StudyTimer`, `InterruptButton` ("Stuck ka ba?"), resume-timer flow | **None** |
| **Tanong (Chat)** | `app/(tabs)/tanong.tsx` | ❌ Missing (UI); 🟡 backed | Message list, input, streamed tokens, **TTS "Listen" button**, **MisconceptionBadge**, **SVG visual render slot**, scan entry, tier/session header | `Chat.tsx` (+ `Scanner.tsx`) |
| **Kwento** | `app/(tabs)/kwento.tsx` | ❌ Missing (UI); 🟡 backed | `KwentoModeScreen`, `StoryCard`, `ProblemBlock`, `HintReveal`, `SolutionReveal`, `KwentoSettingSelector`, difficulty-scaling UI | **None** |
| **Review** | `app/(tabs)/review.tsx` | ❌ Missing (UI); 🟡 backed | MELC + personal reviewer list (RAG-backed), subject/grade filters, add-note / OCR entry | `Library.tsx` (+ `Subject.tsx`) |
| **Quizzes** | `app/(tabs)/quizzes.tsx` | ❌ Missing | Quiz hub, quiz question screen, result/feedback, adaptive-difficulty surfacing | `QuizHub.tsx` + `QuizQuestion.tsx` |
| **Profile** | `app/(tabs)/profile.tsx` | ❌ Missing (UI); 🟡 backed | Learning-profile display, **6 accessibility toggles**, streak/economy display, misconception history | `Settings.tsx` + `Streak.tsx` + `Evolution.tsx` + `ProfileResult.tsx` |

**Color palette enforcement:** The mandatory palette — **Dark `#1A1A2E` / Teal `#00CEC9` / Lime `#A8FF3E`** — appears **nowhere** in the repo. A shared theme constant must be created and enforced (Kasabay canvas + tab bar especially).

**Navigation gaps:**
- No `(tabs)` route group and no bottom tab navigator at all.
- 0 of 6 tab screens exist; all must be generated from scratch.
- No initial route wired to Kasabay (spec §7 requires the app to open on Kasabay).
- No tab-bar theming; palette unimplemented.
- Prototype reference covers only 4 of 6 tabs and in a different order (Chat-first); **Kasabay and Kwento have no prototype** and must be designed from the spec.

---

## 3. Onboarding Screens Audit (Phase 3)

**Root layout redirect:** **Absent.** `app/_layout.tsx` runs `initDB → seedMELCs → maybeRegisterSLM → (dev) verify`, then renders `<Slot/>` unconditionally. There is **no `isFirstRun()` check and no `<Redirect href="/onboarding/grade-level" />`**. First run and daily use behave identically.

The gating primitives **exist but are unused for routing**: `profileStore.ts` exposes `isFirstRun()` / `markFirstRunComplete()` (key `suri.first_run_complete`), and `useProfile()` re-exposes `isFirstRun`, `completeFirstRun()`, `update()`, `updateAccessibility()`, `save()`.

| Onboarding screen | Proposed route | Status | Backing data field? | Gap |
|---|---|---|---|---|
| Grade level (+ subject) | `/onboarding/grade-level` | ⚠️ Partial | `gradeLevel` ✅ (1–12, default 6); **no `subject`** | UI for grade; **UI + data** for subject |
| Language (Tagalog/Taglish/English) | `/onboarding/language` | ⚠️ Partial | **No `languagePreference` on profile** (`KwentoLanguage` exists only inside kwento-mode) | **UI + data** |
| Learning Profile (5-question) | `/onboarding/learning-profile` | ⚠️ Partial | `responseMode` ✅ is the storage target; **no quiz/scoring logic** | UI + answer→mode scoring logic |
| Accessibility (optional) | `/onboarding/accessibility` | ⚠️ Partial | ✅ all 6 fields exist | **UI only** |
| MELC download (background) | `/onboarding/melc-download` | ⚠️ Partial | ✅ `seedMELCs()` exists (runs silently in `_layout`) | UI + decouple seeding from `_layout` |

> No `app/onboarding/` route group exists — all 5 screens are **screen-less**. Status is ⚠️ Partial because the data layer for several steps is already in place.

**Profile data layer summary** (`src/profile/types.ts`, persisted via `expo-secure-store`):
- `responseMode: 'visual' | 'auditory' | 'reading' | 'kinesthetic' | 'mixed'` — the learning-style enum (storage target for the 5-question quiz).
- `accessibilitySettings`: `readerFont` (OpenDyslexic), `colorVision` (`standard`/`deuteranopia`/`protanopia`/`tritanopia`), `highContrast`, `largeText`, `focusMode`, `lowMotion` — **all six 5.6 comfort settings present**.
- `gradeLevel: number` (clamped 1–12, default 6).
- **Not present:** `languagePreference`, `subject`, an explicit `onboarded` flag on the profile (first-run completion is the separate `suri.first_run_complete` key).
- `serialization.ts` validates/normalizes stored blobs; `systemPrompt.ts` consumes `responseMode`, `gradeLevel`, `focusMode`, `colorVision`, `largeText`, `lowMotion` (readerFont/highContrast are UI-only).

**Onboarding gaps:**
- No router gating (no redirect to onboarding on first run); no post-onboarding destination route either.
- No `app/onboarding/` group; all 5 screens missing.
- `languagePreference` and `subject` need **both** new persisted fields and UI.
- The 5-question learning-profile sequence model + answer→`responseMode` scoring does not exist.
- Accessibility and grade are **UI-only** gaps (data already validated + persisted).
- `melc-download` is screen-less and silently coupled inside `_layout`; it seeds bundled `MELC_SEEDS` (no real network download despite the "background download" wording).
- Optional SmolLM2 model download (spec §7 step 6) has a hook (`useModelDownload.ts`) but no screen.

---

## 4. Component Audit

### 4.1 Kasabay Mode (spec 5.10) — ❌ Not started (0%)

`kasabay` appears only in the spec and README; **no code anywhere**.

| Spec component | Type | Status | Notes |
|---|---|---|---|
| `KasabayModeScreen.tsx` | Screen | ❌ Missing | — |
| `SuriDeskCanvas.tsx` | Component | ❌ Missing | dark canvas + neon teal/lime borders |
| `SuriIdleAnimation.tsx` | Component | ❌ Missing | needs `react-native-reanimated` + sprite assets; static fallback on Low Motion |
| `StudyTimer.tsx` | Component | ❌ Missing | focus-block timer (pure app logic) |
| `InterruptButton.tsx` | Component | ❌ Missing | "Stuck ka ba?" → pause + open help |
| `kasabayPromptBuilder.ts` | Service | ❌ Missing | persona prompt + `{cognitiveModifier}` / `{last_topic_discussed}` injection |

### 4.2 Kwento Mode (spec 5.8) — 🟡 Partial (backend ✅, UI ❌)

**UI components — all missing:**

| Spec component | Status | Note |
|---|---|---|
| `KwentoModeScreen.tsx` | ❌ Missing | orchestration state lives in the hook |
| `StoryCard.tsx` | ❌ Missing | — |
| `ProblemBlock.tsx` | ❌ Missing | — |
| `HintReveal.tsx` | ❌ Missing | `revealHint` exists in hook |
| `SolutionReveal.tsx` | ❌ Missing | `revealSolution`/`solutionRevealed` in hook |
| `KwentoSettingSelector.tsx` | ❌ Missing | selection logic exists |

**Backend — complete:** `kwentoModeService` (orchestration), `kwentoParser` (JSON parse + validation + fallback), `kwentoPromptBuilder` (online + 256-token offline prompts), `kwentoCache` (SQLite cache + attempts), `answerCheck` (deterministic interim grader), `difficultyLogic` (pure adaptive stepping); data `culturalSettings` (7 settings), `gradeComplexity` (6 bands), `kwentoDefaults` (token budgets + system prompts); `kwento.types`; `useKwentoMode` (headless state machine: `idle→generating→story→checking→correct|wrong|misconception`, streak credit, ±difficulty, misconception seam). **Full generate→parse→cache→answer-check→difficulty loop is implemented and wired.** A `verify:kwento` script exists.

### 4.3 Misconception Detection (spec 5.9) — 🟡 Partial (backend ✅ exceeds spec, UI ❌)

| Spec component | Type | Status | Existing file |
|---|---|---|---|
| `MisconceptionDetector.ts` | Service | ✅ Complete | `services/misconceptionDetector.ts` (online via `generateWithPrompt` + offline taxonomy lookup + confidence threshold) |
| `MisconceptionExplainer.tsx` | Component | ❌ Missing | explanation produced in service, never rendered |
| `MisconceptionBadge.tsx` | Component | ❌ Missing | — |
| `MisconceptionHistory.tsx` | Component | ❌ Missing | — |
| `misconceptionTaxonomy.ts` | Data | ✅ Complete | `constants/misconceptionTaxonomy.ts` (~18 Filipino misconceptions, science + math) |

**Extra backend beyond the spec's list (all ✅):** `misconceptionParser.ts`, `misconceptionPromptBuilder.ts`, `misconceptionTaxonomyLookup.ts`, `misconceptionDefaults.ts` (system prompt + confidence bar `0.7` + Socratic fallback), `misconception.types.ts` (`MisconceptionType` 7-member union, `MisconceptionDetectionRequest/Response` mirroring the spec's "AI Output Structure", `MisconceptionRecord`, `MisconceptionTaxonomyEntry`), `kwentoMisconceptionAdapter.ts` (wires the detector into the Kwento hook seam), and `scripts/verify-misconception.mjs`.

**Gap:** detection runs but **never persists** — `toMisconceptionRecord` builds an in-memory object only; there is no `misconception_records`/`misconception_taxonomy` SQLite table and no UI. So spec 5.9 #5 ("track and remember across sessions") is not yet realized.

### 4.4 Services mapping (spec §5.2 / Part 1 service list)

| Spec service | Current file(s) | Status | Action for Part 3 |
|---|---|---|---|
| `aiRouter` | `ai/aiRouter.ts` + pure `routerCore.ts` | 🟡 | Orchestrator correct; only `getProviders()` is wired to the single proxy handle — rewire to ordered named clients |
| `geminiClient` | — (logic in server proxy) | ❌ | Create `ai/geminiClient.ts` (`gemini-3-flash-preview`, OpenAI-compat endpoint) |
| `groqClient` | — | ❌ | Create `ai/groqClient.ts` (`llama-3.1-8b-instant`) |
| `openRouterClient` | — | ❌ | Create `ai/openRouterClient.ts` (`openai/gpt-oss-20b:free` + attribution headers) |
| `localModelClient` | `ai/localModel.ts` + `ai/offlineSLM.ts` | 🟡 | Add thin named `ai/localModelClient.ts` re-exporting `runLocalModel` + SLM registration |
| `signalDetector` | `ai/networkTier.ts` | ✅ | Functionally complete (`getNetworkTier`/`classifyNetwork`); optional alias to spec name |
| `melcRagService` | `db/ragStore.ts` (+ `embedding.ts`) | ✅ | No change (`retrieveTopK` already consumed) |
| `kwentoService` | `features/kwento-mode/services/kwentoModeService.ts` | ✅ | Inherits the client refactor via `generate.ts` |
| `misconceptionService` | `features/misconception/services/misconceptionDetector.ts` | ✅ (detect) / 🟡 (persist) | Add `misconception_records` persistence |

---

## 5. Backend Integration Verification (Phase 4)

### 5.1 3-Tier cascade — current state
- **Entry:** `routeMessage()` (`aiRouter.ts`) → pure `executeRoute()` (`routerCore.ts`) with injected deps.
- **Tier selection** (`networkTier.ts`): wifi/ethernet or 4g/5g → `strong`; 2g/3g/unknown cellular → `weak`; none/unreachable → `offline`.
- **Online path:** `executeRoute` retrieves RAG, builds the system prompt, then iterates `getProviders()` with **failover** (try next on non-abort error). First success caches + returns.
- **Tier 2 reduced payload** (`routerPolicy.ts`): `weak` → top-**1** MELC passage + `maxTokens **150**`; `strong` → top-3 + 800; `offline` → top-5 + 200. **Confirmed — matches spec 5.2.**
- **Tier 3 (offline):** `serveOffline` is cache-first (`response_cache`), then `runLocalModel` (SmolLM2-135M via `llama.rn`, registered by `maybeRegisterSLM` only if the model is downloaded; extractive RAG fallback otherwise).
- **The thing to refactor:** `getProviders()` returns a **single** `{ id: 'proxy' }` handle (server-side cascade), or `[]` when the proxy is unconfigured. There is a **second proxy entry point**: `generate.ts → generateWithPrompt()` calls `streamProxyResponse` directly (used by **Kwento + Misconception**). Both must migrate.

### 5.2 Server proxy cascade (`supabase/functions/suri-ai-proxy/index.ts`)
`buildProviders()` in failover order: **Gemini** (`gemini-3-flash-preview`) → **Groq** (`llama-3.1-8b-instant`) → **OpenRouter** (`openai/gpt-oss-20b:free`, with `HTTP-Referer`/`X-Title`). Failover on **429 / 5xx / network error**; `max_tokens` default 800, `temperature` 0.4; auth via `SUPABASE_ANON_KEY` or `PROXY_SHARED_SECRET` (constant-time compare); pipes upstream SSE straight back with `X-Suri-Provider`.

> **Spec deltas already encoded server-side:** OpenRouter is `openai/gpt-oss-20b:free` (spec lists `deepseek/...:free`, retired); Gemini is `gemini-3-flash-preview` (GA `gemini-3-flash` 404s on the OpenAI-compat endpoint). Carry these exact model IDs into the client clients.

### 5.3 Client refactor plan (to spec's named clients)
1. **Extract a shared SSE primitive** from `cloudClient.streamProxyResponse` → `streamOpenAICompatible({ url, headers, model, messages, maxTokens, temperature, onToken, signal })` (reuses `expo/fetch` + `SSEStreamParser`).
2. **Create 3 named clients**, each exposing a `ProviderHandle` factory matching the `routerCore` contract `({ system, user, maxTokens, onToken, signal }) => Promise<string>`:
   - `geminiClient.ts` → `{ id: 'gemini', stream }`
   - `groqClient.ts` → `{ id: 'groq', stream }`
   - `openRouterClient.ts` → `{ id: 'openrouter', stream }`
   - Each must **throw on non-2xx (429/5xx)** so `executeRoute`'s loop fails over, and honor `signal`.
3. **`localModelClient.ts`** — thin wrapper re-exporting `runLocalModel` + SLM registration. Tier 3 stays the degrade target (`deps.runLocalModel`), **not** a cascade peer.
4. **Rewire `getProviders()`** to return an ordered, per-key-gated array: `[gemini, groq, openrouter].filter(configured)`; `[]` when none configured (preserves cache→SLM degrade). **`routerCore` needs no change** — contract preserved, existing tests valid.
5. **Tier 2** needs no client-specific code — `routerPolicy` already supplies top-1 + 150 tokens; verify each client forwards `maxTokens`→`max_tokens`.
6. **Migrate `generate.ts`** to the same ordered cascade (shared `cascadeStream` helper), keeping degrade-to-`runLocalModel`. Fixes Kwento + Misconception automatically.
7. **Proxy fate:** recommend keeping it as an **optional, config-gated last-resort handle** (appended when `EXPO_PUBLIC_PROXY_URL` is set), so deployments can choose client-direct vs server-proxy.
8. **⚠️ Security tradeoff (must decide):** per-provider keys move client-side as `EXPO_PUBLIC_*`, which Metro **inlines into the JS bundle** → the **billable** provider keys become extractable from the APK. This reverses the current posture (only a public-ish proxy token ships; valuable keys stay server-side). Recommendation: keep the **server proxy as the production default** and gate client-direct behind config / restrict to free-tier keys.
9. **Update `verify-router`** to assert the ordered cascade + per-provider failover with mocked clients.

### 5.4 WAL mode
**Satisfied.** `PRAGMA journal_mode = WAL;` is set in **`src/db/database.ts` → `initDB()`** (immediately after `openDatabaseAsync`, followed by `PRAGMA foreign_keys = ON`). `db/schema.ts` is intentionally **pure DDL** (no PRAGMA) so it stays headlessly verifiable — so the request to verify WAL "in `db/schema.ts`" resolves to `database.ts`, where it is correctly implemented.

### 5.5 Schema migration plan — add misconception tables (SCHEMA_VERSION 3 → 4)
`runMigrations` runs the idempotent `CREATE_TABLES_SQL` every boot and gates on `PRAGMA user_version`; a `if (current < 4)` placeholder comment already exists. Because the new tables are additive (`IF NOT EXISTS`), the migration is a **version bump + appended DDL**:

1. `schema.ts`: `SCHEMA_VERSION = 3` → `4` (+ `v4:` doc line).
2. Append to `CREATE_TABLES_SQL`:

```sql
-- Pre-loaded known wrong beliefs (spec 5.9 taxonomy)
CREATE TABLE IF NOT EXISTS misconception_taxonomy (
  id                    TEXT PRIMARY KEY,            -- e.g. science_photosynthesis_soil
  subject               TEXT,                        -- 'science' | 'math'
  topic                 TEXT    NOT NULL,
  melc_competency       TEXT,
  wrong_belief          TEXT    NOT NULL,
  misconception_type    TEXT    NOT NULL CHECK (misconception_type IN (
    'WRONG_CAUSATION','WRONG_DEFINITION','CONCEPT_CONFUSION','OVERGENERALIZATION',
    'DIRECTIONALITY_ERROR','PARTIAL_UNDERSTANDING','LANGUAGE_CONFUSION')),
  grade_band            TEXT,                         -- matches MisconceptionTaxonomyEntry.gradeBand
  correct_understanding TEXT,
  targeted_explanation  TEXT    NOT NULL,
  keywords              TEXT,                         -- JSON array for offline matching
  created_at            TEXT    NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_misconception_tax_topic ON misconception_taxonomy (topic);

-- Per-student detected misconceptions (spec 5.9 MisconceptionRecord)
CREATE TABLE IF NOT EXISTS misconception_records (
  id                    INTEGER PRIMARY KEY AUTOINCREMENT,
  topic                 TEXT    NOT NULL,
  melc_competency       TEXT    NOT NULL,
  misconception_type    TEXT    CHECK (misconception_type IS NULL OR misconception_type IN (
    'WRONG_CAUSATION','WRONG_DEFINITION','CONCEPT_CONFUSION','OVERGENERALIZATION',
    'DIRECTIONALITY_ERROR','PARTIAL_UNDERSTANDING','LANGUAGE_CONFUSION')),  -- nullable
  specific_wrong_belief TEXT    NOT NULL,
  detected_at           TEXT    NOT NULL DEFAULT (datetime('now')),
  resolved_at           TEXT,
  grade_level           INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_misconception_rec_topic      ON misconception_records (topic);
CREATE INDEX IF NOT EXISTS idx_misconception_rec_unresolved ON misconception_records (resolved_at);
```

3. `database.ts`: bump is enough (the idempotent DDL creates both tables on next boot); optionally add the explicit `if (current < 4) { /* additive */ }` gate.
4. **Follow-ups (beyond migration):** seed `misconception_taxonomy` from `MISCONCEPTION_TAXONOMY` via `INSERT OR IGNORE`; add a small persistence service to write `misconception_records` on detection and set `resolved_at` on a later correct answer (realizes spec 5.9 #5).

Column mapping: `misconception_records` ↔ `MisconceptionRecord` (`melc_competency`↔`melcCompetency`, `misconception_type` nullable, `specific_wrong_belief`↔`specificWrongBelief`, `detected_at`/`resolved_at`/`grade_level`).

---

## 6. ❌ INCOMPLETE / MISSING — Full List

**Missing files / route scaffolding**
- `app/(tabs)/_layout.tsx` and all 6 tab screens (Kasabay, Tanong, Kwento, Review, Quizzes, Profile).
- `app/onboarding/` group + 5 screens (`grade-level`, `language`, `learning-profile`, `accessibility`, `melc-download`).
- Theme module enforcing the palette (`#1A1A2E` / `#00CEC9` / `#A8FF3E`).

**Broken / absent navigation**
- No bottom tab navigator; no initial route to Kasabay.
- No first-run redirect to onboarding (gating primitives exist, unused).
- No post-onboarding destination route.

**Missing UI (logic exists underneath)**
- Kwento: 6 components (`KwentoModeScreen`, `StoryCard`, `ProblemBlock`, `HintReveal`, `SolutionReveal`, `KwentoSettingSelector`).
- Misconception: 3 components (`MisconceptionExplainer`, `MisconceptionBadge`, `MisconceptionHistory`).
- Chat: TTS "Listen" button, MisconceptionBadge wiring, SVG visual render slot.
- Profile: 6 accessibility toggles + streak/economy + misconception history.

**Missing UI + logic**
- Kasabay Mode in full (6 files + sprite assets + timer).
- Quizzes engine (hub, question, result, adaptive surfacing).
- 5-question learning-profile quiz model + answer→`responseMode` scoring.

**Backend gaps**
- Per-provider clients (`geminiClient`/`groqClient`/`openRouterClient`/`localModelClient`) — cascade currently server-side only; `getProviders()` + `generate.ts` both need migration.
- `misconception_taxonomy` + `misconception_records` tables (SCHEMA_VERSION 3 → 4) + taxonomy seeding + record persistence.
- Profile fields: `languagePreference`, `subject`, explicit onboarded flag.
- `melc-download` is silent inside `_layout` (no screen, no real network fetch).

**Accessibility gaps**
- No theme/accessibility runtime (OpenDyslexic font not bundled — `expo-font` missing; no colorblind palette variants; high-contrast/large-text not applied to UI).
- Prototype `Settings` exposes only 4 of 6 toggles (missing High Contrast, Large Text) — must implement all 6 in RN.
- `react-native-svg` missing → colorblind-safe diagram rendering not possible yet (`visualParser.ts` exists without a renderer).

**Dependency gaps (vs spec §6.2)**
`react-native-svg`, `react-native-reanimated`, `react-native-gesture-handler`, `expo-camera` (+ ML Kit), `expo-font`, `expo-task-manager`, `expo-background-fetch`, `expo-notifications`, `whisper.rn` (optional). `expo-av` is present.

---

## 7. ✅ COMPLETE — What's Already Built (and solid)

**Database layer (strong).** `expo-sqlite` with **WAL mode** + foreign keys; 14 tables at `SCHEMA_VERSION 3` (`melc_chunks`, `personal_chunks`, `response_cache`, `chat_messages`, `streaks`, `badges`, `quiz_attempts`, `core_fundamentals`, `resources`, `player_state`, `difficulty_state`, `competency_events`, `kwento_cache`, `kwento_attempts`); idempotent creation + `user_version` migration gate; idempotent seeding (streak row, 6 badges, resources, core fundamentals).

**Store layer (strong).** Learning Profile in `expo-secure-store` (with serialization/normalization); gamification (`streakService`, `resourceService`, `economyLogic`, `streakLogic`, `useStreaks`); telemetry (`eventQueue`, `syncManager`).

**AI orchestration.** Pure `routerCore.executeRoute` 3-tier cascade with failover, tier-aware RAG depth + token caps (`routerPolicy`), response cache, network tiering (`networkTier`), on-device SLM wiring (`localModel`/`offlineSLM`/`modelManager`/`modelPolicy`/`binary`/`useModelDownload`), and the server-side provider cascade (`suri-ai-proxy`).

**RAG.** `ragStore` (cosine `retrieveTopK`, MELC seeding, personal notes + OCR capture, reviewer listing) + `embedding` + bundled `melcData` seeds.

**Kwento Mode backend (complete).** End-to-end generate→parse→cache→answer-check→difficulty loop with cultural settings, grade complexity, prompts, and a headless controller hook.

**Misconception Detection backend (complete, exceeds spec).** Detector (online + offline taxonomy), parser, prompt builder, taxonomy lookup, ~18-entry Filipino taxonomy, full type set, and a Kwento integration adapter.

**Voice + Visual parsing.** `voice/` (TTS via `expo-speech`, STT via `expo-speech-recognition`, policies/hooks); `visuals/visualParser.ts` (structured visual spec parser — renderer pending `react-native-svg`).

**Verification harness.** Headless `scripts/verify-*.mjs` for schema, profile, rag, router, slm, services, telemetry, gamification, kwento, misconception (note: `verify-misconception.mjs` exists but has no `verify:misconception` alias in `package.json`).

**Security note (informational).** `supabase/functions/suri-ai-proxy/.env` holds live-looking provider keys locally, but it is **git-ignored and not tracked** (verified) — no exposure in the repo. Keep it ignored; rotate keys if the file is ever shared.

---

## 8. Action Items — Priority Order for Part 3 Auto-Fixes

**P0 — App shell & navigation (unblocks everything)**
1. Create `theme/` palette constants (`#1A1A2E`, `#00CEC9`, `#A8FF3E`) + typography.
2. Create `app/(tabs)/_layout.tsx` with the 6 tabs in spec order, Kasabay as the initial route.
3. Add first-run gating in `app/_layout.tsx` (`isFirstRun()` → `<Redirect href="/onboarding/grade-level">`).

**P1 — Onboarding flow**
4. Build `app/onboarding/` (5 screens). Add `languagePreference` + `subject` to the profile type + serialization.
5. Implement the 5-question learning-profile quiz + answer→`responseMode` scoring.
6. Surface `melc-download` as a screen; decouple seeding from `_layout`.

**P2 — Wire existing backends to new UI**
7. **Kwento tab:** build the 6 components on top of `useKwentoMode` (already complete).
8. **Tanong (Chat) tab:** message UI + streaming + TTS button + MisconceptionBadge + SVG slot.
9. **Review + Profile tabs:** reviewer list (`ragStore`) + profile display with all 6 accessibility toggles (`useProfile`/`updateAccessibility`).

**P3 — Backend alignment (client refactor + schema)**
10. Refactor to `geminiClient`/`groqClient`/`openRouterClient`/`localModelClient`; rewire `getProviders()` + `generate.ts` to the ordered cascade. **Decide the client-direct vs server-proxy security posture first.**
11. Migrate schema 3 → 4: add `misconception_taxonomy` + `misconception_records`; seed taxonomy; add record persistence.

**P4 — Net-new feature: Kasabay Mode**
12. Build the 6 Kasabay files + `kasabayPromptBuilder`; add Suri sprite assets; static fallback on Low Motion.

**P5 — Quizzes + accessibility runtime + deps**
13. Build the quiz engine (hub/question/result + adaptive surfacing).
14. Add accessibility runtime (OpenDyslexic font, colorblind palettes, high-contrast/large-text application).
15. Install missing deps as features land: `react-native-svg`, `react-native-reanimated`, `react-native-gesture-handler`, `expo-font`, `expo-camera`, `expo-task-manager`, `expo-background-fetch`, `expo-notifications`.

**P6 — Misconception & Misc UI**
16. Build `MisconceptionExplainer` / `MisconceptionBadge` / `MisconceptionHistory`; wire detection into Chat answers and persist records.

---

*End of audit. No source files were modified in Part 2 (this report is the only artifact). Component implementation is held for Part 3.*
