# Suri — Offline AI Study Companion — Implementation Guide

> Generated from `suri-mobile-project-spec-v2.md`
> Platform: React Native + Expo SDK 54 (managed workflow), TypeScript strict
> Total Phases: 11 (Phase 0–10)
> Scope: Hackathon MVP → Production-ready core
> Security tier: MVP (offline-first, on-device by default; API keys in `expo-secure-store`)

---

## What This Is

This directory contains **executable prompt files** for an AI coding agent to build Suri step by step. Each file is a self-contained blueprint: context, prerequisites, instructions, requirements, exact file paths, verification, and troubleshooting. The agent writes the actual code — these files tell it precisely what to build and in what order.

Feed one prompt file at a time to your coding agent (GPT-5.3-Codex, Claude Opus, etc.). Complete each phase's `99_PHASE_CHECKLIST.md` before moving on.

---

## Quick Start

1. Start with `phase_00_setup/00_PHASE_OVERVIEW.md`.
2. Execute each numbered step file in order.
3. Run `99_PHASE_CHECKLIST.md` at the end of each phase. Do not advance until it passes.
4. Load the skills listed in each phase overview before starting that phase. Skills live in the sibling workspace skills library, indexed by `skills_index.json`; each skill is at `skills/<skill-id>/SKILL.md`.

---

## Phase Overview

| Phase | Name | Steps | Focus |
|-------|------|-------|-------|
| 0 | [Setup](./phase_00_setup/00_PHASE_OVERVIEW.md) | 4 | Expo scaffolding, TS strict, tooling, EAS/ABI splits, structure |
| 1 | [Design System & Accessibility](./phase_01_design_system/00_PHASE_OVERVIEW.md) | 4 | Tokens, OpenDyslexic, colorblind palettes, a11y settings, nav skeleton |
| 2 | [Data Layer](./phase_02_data_layer/00_PHASE_OVERVIEW.md) | 4 | SQLite (WAL), schema, secure-store profile, netinfo tier detection |
| 3 | [Local RAG Store](./phase_03_rag/00_PHASE_OVERVIEW.md) | 3 | MELC seed, pre-computed embeddings, cosine top-k retrieval |
| 4 | [Hybrid AI Engine](./phase_04_ai_engine/00_PHASE_OVERVIEW.md) | 5 | 3-tier router, cloud cascade SSE, on-device SLM, prompt builder |
| 5 | [Chat & Suri Mascot](./phase_05_chat_mascot/00_PHASE_OVERVIEW.md) | 4 | Streaming chat UI, tier indicator, mascot animation state machine |
| 6 | [Learning Profiles](./phase_06_learning_profiles/00_PHASE_OVERVIEW.md) | 3 | First-run quiz/selector, adaptive response modes |
| 7 | [Generative Visuals](./phase_07_visuals/00_PHASE_OVERVIEW.md) | 3 | LLM JSON spec → react-native-svg, colorblind-safe rendering |
| 8 | [Voice Mode](./phase_08_voice/00_PHASE_OVERVIEW.md) | 3 | expo-speech TTS, Groq Whisper STT + native fallback |
| 9 | [Gamification & Streaks](./phase_09_gamification/00_PHASE_OVERVIEW.md) | 3 | Streaks, mascot evolution, local notifications |
| 10 | [Offline Validation & Polish](./phase_10_polish/00_PHASE_OVERVIEW.md) | 4 | Airplane-mode test, loading/error/empty states, demo prep |

---

## Dependency Graph

```
Phase 0 (Setup)
    │
    ▼
Phase 1 (Design System & Accessibility)
    │
    ▼
Phase 2 (Data Layer) ──────────────┐
    │                              │
    ▼                              ▼
Phase 3 (Local RAG)          Phase 6 (Learning Profiles)
    │                              │
    ▼                              │
Phase 4 (Hybrid AI Engine) ◄───────┘   (router consumes profile + RAG)
    │
    ▼
Phase 5 (Chat & Mascot)
    │
    ├──► Phase 7 (Generative Visuals)   (renders AI JSON in chat)
    ├──► Phase 8 (Voice Mode)           (TTS/STT on chat responses)
    │
    ▼
Phase 9 (Gamification & Streaks)
    │
    ▼
Phase 10 (Offline Validation & Polish)
```

---

## All Prompt Files

### Phase 0: Setup
- [0.1 — Expo Project Initialization](./phase_00_setup/01_expo_project_initialization.md)
- [0.2 — Tooling, Linting & Strict TypeScript](./phase_00_setup/02_tooling_and_linting.md)
- [0.3 — Directory Structure & Config Module](./phase_00_setup/03_directory_structure_and_config.md)
- [0.4 — EAS Build & ABI Splits](./phase_00_setup/04_eas_build_abi_splits.md)

### Phase 1: Design System & Accessibility
- [1.1 — Design Tokens & Theme Provider](./phase_01_design_system/01_design_tokens_and_theme.md)
- [1.2 — Fonts (OpenDyslexic) & Typography Scale](./phase_01_design_system/02_fonts_and_typography.md)
- [1.3 — Accessibility Settings Engine](./phase_01_design_system/03_accessibility_settings.md)
- [1.4 — Navigation Skeleton (Bottom Tabs)](./phase_01_design_system/04_navigation_skeleton.md)

### Phase 2: Data Layer
- [2.1 — SQLite Database & WAL Setup](./phase_02_data_layer/01_sqlite_database_setup.md)
- [2.2 — Schema & Migrations](./phase_02_data_layer/02_schema_and_migrations.md)
- [2.3 — Learning Profile Store (secure-store + Zustand)](./phase_02_data_layer/03_learning_profile_store.md)
- [2.4 — Connectivity & Signal-Tier Detection](./phase_02_data_layer/04_connectivity_detection.md)

### Phase 3: Local RAG Store
- [3.1 — MELC Corpus Seed & Embeddings Bundle](./phase_03_rag/01_melc_corpus_and_embeddings.md)
- [3.2 — Vector Store & Cosine Retrieval](./phase_03_rag/02_vector_store_retrieval.md)
- [3.3 — Response Cache Layer](./phase_03_rag/03_response_cache.md)

### Phase 4: Hybrid AI Engine
- [4.1 — System Prompt Builder (Profile + RAG)](./phase_04_ai_engine/01_system_prompt_builder.md)
- [4.2 — Cloud AI Client & SSE Streaming](./phase_04_ai_engine/02_cloud_client_streaming.md)
- [4.3 — Provider Cascade (Gemini → Groq → OpenRouter)](./phase_04_ai_engine/03_provider_cascade.md)
- [4.4 — On-Device SLM (llama.rn + SmolLM2)](./phase_04_ai_engine/04_ondevice_slm.md)
- [4.5 — Tier Router (orchestration)](./phase_04_ai_engine/05_tier_router.md)

### Phase 5: Chat & Suri Mascot
- [5.1 — Chat State & Message Store](./phase_05_chat_mascot/01_chat_state_store.md)
- [5.2 — Chat UI & Streaming Renderer](./phase_05_chat_mascot/02_chat_ui_streaming.md)
- [5.3 — Suri Mascot Animation State Machine](./phase_05_chat_mascot/03_mascot_state_machine.md)
- [5.4 — Tier & Mode Indicators](./phase_05_chat_mascot/04_tier_mode_indicators.md)

### Phase 6: Learning Profiles
- [6.1 — Profile Model & Prompt Modifiers](./phase_06_learning_profiles/01_profile_model_modifiers.md)
- [6.2 — First-Run Setup Quiz](./phase_06_learning_profiles/02_first_run_quiz.md)
- [6.3 — Settings Screen (Profile + Accessibility)](./phase_06_learning_profiles/03_settings_screen.md)

### Phase 7: Generative Visuals
- [7.1 — Visual Spec Schema & Validation](./phase_07_visuals/01_visual_spec_schema.md)
- [7.2 — SVG Renderers (charts & diagrams)](./phase_07_visuals/02_svg_renderers.md)
- [7.3 — Colorblind-Safe Palette Integration](./phase_07_visuals/03_colorblind_palettes.md)

### Phase 8: Voice Mode
- [8.1 — TTS Engine (expo-speech)](./phase_08_voice/01_tts_engine.md)
- [8.2 — STT (Groq Whisper + native fallback)](./phase_08_voice/02_stt_engine.md)
- [8.3 — Voice UI Integration](./phase_08_voice/03_voice_ui_integration.md)

### Phase 9: Gamification & Streaks
- [9.1 — Streak Engine & Badges](./phase_09_gamification/01_streak_engine.md)
- [9.2 — Mascot Evolution Mechanic](./phase_09_gamification/02_mascot_evolution.md)
- [9.3 — Local Notifications](./phase_09_gamification/03_local_notifications.md)

### Phase 10: Offline Validation & Polish
- [10.1 — Loading, Error & Empty States](./phase_10_polish/01_states_polish.md)
- [10.2 — Airplane-Mode Offline Test](./phase_10_polish/02_airplane_mode_test.md)
- [10.3 — Performance & Memory Hardening](./phase_10_polish/03_performance_hardening.md)
- [10.4 — Demo Script & Pitch Prep](./phase_10_polish/04_demo_prep.md)

---

## Appendix

- [A — Design System Reference](./appendix/A_DESIGN_SYSTEM.md)
- [B — AI Provider Reference](./appendix/B_AI_PROVIDER_REFERENCE.md)
- [C — Troubleshooting](./appendix/C_TROUBLESHOOTING.md)
- [D — Security Checklist](./appendix/D_SECURITY_CHECKLIST.md)

---

## Post-Implementation

After all phases:
- [ ] Full Airplane-Mode test passes (Tier 1 → Tier 3 transition live)
- [ ] Provider cascade verified by simulating a rate-limit hit
- [ ] Accessibility toggles verified live (Reader Font, High Contrast, Large Text, Low Motion)
- [ ] Security audit (see `appendix/D_SECURITY_CHECKLIST.md`)
- [ ] APK built with ABI splits; install size verified (~35–40MB shell)
- [ ] Demo script rehearsed (see `phase_10_polish/04_demo_prep.md`)

---

## Roadmap (Not in this guide — Phase 2 post-hackathon)

Per spec Section 6: camera OCR (ML Kit), offline STT (`whisper.rn`), kinesthetic-mode polish, spaced repetition, parent/teacher dashboard (Supabase), Lite Mode (Qwen2.5-0.5B), classroom mesh sync, fine-tuned Filipino model. These are documented in the spec but intentionally excluded from the MVP build path.
