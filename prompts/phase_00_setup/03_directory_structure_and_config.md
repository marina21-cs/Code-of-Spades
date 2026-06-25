# 0.3 Directory Structure & Typed Config Module

## Context

<context>
This step establishes the feature-based folder structure every later phase will populate, plus a typed configuration module so secrets and constants are accessed through one place instead of raw `process.env` (clean-code standard). Suri's architecture (spec Section 8) has clear domains — AI routing, RAG, voice, visuals, profile, gamification — so the structure is organized by feature, not by file type. Getting this right now prevents painful refactors later and keeps the dependency order in the master index honest.
</context>

## Prerequisites

<prerequisites>
- Steps 0.1 and 0.2 complete (app runs, linting/strict TS configured)
- `@/` path alias points at `src/`
</prerequisites>

## AI Implementation Prompt

<instructions>
Create the `src/` feature-based structure, barrel exports, a constants file, and a typed config module. The `app/` directory stays as the Expo Router routing layer; all logic lives in `src/`.

Think step by step:

1. **Create the feature-based `src/` tree** (folders listed in Directory Structure below). Each feature folder gets an `index.ts` barrel export. Create placeholder `index.ts` files that re-export nothing yet (they'll be filled by later phases).

2. **Constants module** (`src/constants/index.ts`)
   - Define app-wide constants: `MELC_TOP_K_ONLINE = 3`, `MELC_TOP_K_OFFLINE = 5`, `SLM_MAX_TOKENS = 200`, `SLM_N_CTX = 256`, `WEAK_SIGNAL_MAX_TOKENS = 150`, storage keys, and the SQLite DB filename `suri.db`.
   - No magic numbers anywhere else in the codebase — they reference these.

3. **Typed config module** (`src/config/env.ts`)
   - Export a typed `config` object. Provider API keys are NOT read from env at build time — per spec Section 10 they live in `expo-secure-store` and are entered/rotated at runtime. So `env.ts` holds only non-secret build config: provider base URLs, default model IDs, feature flags.
   - Define base URLs and model IDs as documented in `appendix/B_AI_PROVIDER_REFERENCE.md`:
     - Gemini base `https://generativelanguage.googleapis.com/v1beta/openai/`, model `gemini-3-flash`
     - Groq base `https://api.groq.com/openai/v1`, model `llama-3.1-8b-instant`, Whisper model `whisper-large-v3-turbo`
     - OpenRouter base `https://openrouter.ai/api/v1`, model `deepseek/deepseek-v3-0324:free`
   - Export a typed `AppConfig` interface; never let callers read raw `process.env`.

4. **Shared types** (`src/types/index.ts`)
   - Add the `LearningProfile` interface exactly as defined in spec Section 5.6 (responseMode, accessibilitySettings, gradeLevel).
   - Add `SignalTier = 'strong' | 'weak' | 'offline'` and `ProviderName = 'gemini' | 'groq' | 'openrouter'`.

5. **Root provider wiring**
   - In `app/_layout.tsx`, wrap the router with `GestureHandlerRootView` and `SafeAreaProvider` (theme/profile providers added in Phase 1/2). Keep it minimal but correct.
</instructions>

<requirements>
### Technical Requirements
- Feature-based organization (group by domain). Barrel `index.ts` in each feature folder.
- All shared constants in `src/constants`. No magic strings/numbers in feature code.
- Config accessed only through `src/config/env.ts`. No raw `process.env` in feature code.
- API keys are NOT in env config — they are runtime secure-store values (Phase 4).

### File Naming Conventions
- Folders and files kebab-case; types PascalCase; constants UPPER_SNAKE_CASE.
</requirements>

<output_files>
1. `suri/src/config/env.ts` — typed non-secret config (base URLs, model IDs, flags)
2. `suri/src/constants/index.ts` — app-wide constants
3. `suri/src/types/index.ts` — `LearningProfile`, `SignalTier`, `ProviderName`
4. `suri/src/features/ai/index.ts` — barrel (empty for now)
5. `suri/src/features/rag/index.ts` — barrel
6. `suri/src/features/chat/index.ts` — barrel
7. `suri/src/features/profile/index.ts` — barrel
8. `suri/src/features/voice/index.ts` — barrel
9. `suri/src/features/visuals/index.ts` — barrel
10. `suri/src/features/gamification/index.ts` — barrel
11. `suri/src/lib/db/index.ts` — barrel (DB created in Phase 2)
12. `suri/src/components/index.ts` — shared UI barrel
13. `suri/src/theme/index.ts` — barrel (tokens added in Phase 1)
14. `suri/app/_layout.tsx` — MODIFIED: GestureHandler + SafeArea providers
</output_files>

## Directory Structure

```
suri/
├── app/                          ← Expo Router routes only
│   ├── _layout.tsx               ← MODIFIED
│   └── index.tsx
└── src/
    ├── components/               ← shared UI primitives
    │   └── index.ts
    ├── config/
    │   └── env.ts                ← typed non-secret config
    ├── constants/
    │   └── index.ts
    ├── theme/
    │   └── index.ts
    ├── lib/
    │   └── db/
    │       └── index.ts
    ├── types/
    │   └── index.ts
    └── features/
        ├── ai/        index.ts
        ├── rag/       index.ts
        ├── chat/      index.ts
        ├── profile/   index.ts
        ├── voice/     index.ts
        ├── visuals/   index.ts
        └── gamification/ index.ts
```

## Verification

<verification>
- [ ] `npm run typecheck` passes
- [ ] `import { config } from '@/config/env'` resolves and is typed
- [ ] `import { MELC_TOP_K_OFFLINE } from '@/constants'` resolves
- [ ] `LearningProfile` type matches spec Section 5.6 field-for-field
- [ ] App still launches via dev client with the updated root layout
</verification>

## Troubleshooting

| Symptom | Likely Cause | Fix |
|---|---|---|
| `@/config/env` unresolved | Alias not applied to Metro | Confirm tsconfig paths + Metro/Babel alias; restart `-c` |
| Gesture handler not working | Root not wrapped | Ensure `GestureHandlerRootView` wraps the whole tree in `_layout.tsx` with `style={{ flex: 1 }}` |
| Circular import warnings | Barrels re-exporting each other | Keep barrels feature-local; avoid cross-feature barrel imports |

---

**Previous**: [0.2 Tooling & Linting](./02_tooling_and_linting.md) | **Next**: [0.4 EAS Build & ABI Splits](./04_eas_build_abi_splits.md)
