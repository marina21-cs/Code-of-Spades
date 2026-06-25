<div align="center">

<img src="https://raw.githubusercontent.com/yourusername/suri/main/assets/suri-logo.png" alt="Suri Fox Mascot" width="120" />

# 🦊 Suri

### *Matalinong kasama sa pag-aaral, kahit walang internet.*
**Offline-first AI Study Companion for Filipino Learners**

<br/>

[![Built with Expo](https://img.shields.io/badge/Built%20with-Expo%20SDK%2054-000020?style=for-the-badge&logo=expo&logoColor=white)](https://expo.dev)
[![React Native](https://img.shields.io/badge/React%20Native-0.74-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://reactnative.dev)
[![llama.rn](https://img.shields.io/badge/On--Device%20AI-llama.rn-ff6b35?style=for-the-badge)](https://github.com/mybigday/llama.rn)
[![DepEd Aligned](https://img.shields.io/badge/Curriculum-DepEd%20MELCs-0038a8?style=for-the-badge)](https://www.deped.gov.ph)
[![License MIT](https://img.shields.io/badge/License-MIT-22c55e?style=for-the-badge)](LICENSE)

<br/>

> **ACM TechSprint × Accenture — Mobile App Edition**
> Addressing the dual barriers of **poor internet connectivity** and **lack of inclusive learning support** for students across the Philippines.

<br/>

[📱 Try the Demo](#getting-started) · [🏗 Architecture](#architecture) · [✨ Features](#features) · [🗺 Roadmap](#roadmap)

</div>

---

## The Problem

In the Philippines, **millions of students** face two overlapping barriers:

| Barrier | Impact |
|---|---|
| 🌐 Unreliable internet | AI study tools become useless mid-session |
| ♿ Limited inclusive support | Learners with dyslexia, visual, or auditory needs are underserved |

Suri is built to work for **every Filipino student** — with or without signal, with or without disability accommodations.

---

## Features

### 🧠 Hybrid AI Engine — 3-Tier Routing

Suri never drops a session. When one signal disappears, the next tier takes over automatically.

```
Strong Signal  ──►  ☁️  Cloud AI       Gemini 3 Flash · Groq llama-3.1-8b · DeepSeek V3
Weak Signal    ──►  📡  Reduced Payload Optimized queries for low-bandwidth environments
No Signal      ──►  📱  On-Device SLM  SmolLM2-135M-Instruct Q4_K_M via llama.rn
```

### 📚 Curriculum-Grounded Answers (Local RAG)

Pre-loaded **Grade 6 Science DepEd MELCs** in an on-device SQLite vector store. Every answer Suri gives is grounded in the official curriculum — no hallucinations, no off-topic content.

### 🎨 Adaptive Learning Profiles

Suri learns *how you learn* on first launch. Four modes, one quiz:

| Mode | What Suri Does |
|---|---|
| 👁 Visual | Generates labeled SVG science diagrams from LLM JSON specs |
| 👂 Auditory | Prioritizes TTS voice readout via `expo-speech` |
| 📖 Reading | Rich structured markdown with headers and summaries |
| 🔀 Mixed | Balanced format with elements of all modes |

### ♿ Accessibility First

- **OpenDyslexic font** — toggleable live, no reload required
- **High Contrast mode** — full palette swap for low-vision learners
- **Text-to-Speech** — works offline using the device's native TTS engine
- Toggleable any time from the Profile tab

### 🦊 Suri — Your Study Buddy

An animated fox companion lives in the app header. She has two states:
- **Idle** — gentle breathing loop when you're reading
- **Thinking** — ear-perk + tail-wag while the AI generates a response

---

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                   React Native / Expo               │
│  ┌──────────┬──────────┬──────────┬──────────────┐  │
│  │   Chat   │ Reviewer │ Quizzes  │   Profile    │  │
│  └──────────┴──────────┴──────────┴──────────────┘  │
│                     ▼                               │
│  ┌───────────────────────────────────────────────┐  │
│  │            Hybrid AI Router                   │  │
│  │  netinfo ──► Tier 1 / Tier 2 / Tier 3        │  │
│  └──────┬──────────────┬──────────────┬──────────┘  │
│         │              │              │              │
│   ☁️ Cloud API    📡 Reduced     📱 llama.rn        │
│   Gemini/Groq/    Payload        SmolLM2-135M       │
│   DeepSeek                       Q4_K_M             │
│                                                     │
│  ┌───────────────────────────────────────────────┐  │
│  │     Local RAG — expo-sqlite vector store      │  │
│  │     Grade 6 Science DepEd MELCs               │  │
│  └───────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────┘
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Mobile Framework | React Native + Expo SDK 54 |
| On-Device AI | `llama.rn` v0.12.5 · SmolLM2-135M-Instruct Q4_K_M |
| Cloud AI | Gemini 3 Flash · Groq `llama-3.1-8b-instant` · OpenRouter DeepSeek V3 |
| Database & Vector Store | `expo-sqlite` |
| Generative UI | `react-native-svg` |
| Connectivity | `@react-native-community/netinfo` · `expo-task-manager` |
| Accessibility | `expo-font` (OpenDyslexic) · `react-native-reanimated` |
| Voice / TTS | `expo-speech` |

---

## MVP Scope

The hackathon MVP demonstrates Suri's core value props end-to-end:

- [x] **App shell** — Expo app with offline detection and bottom-tab navigation
- [x] **Cloud AI streaming** — token streaming with automatic provider cascade failover
- [x] **Learning profile setup** — first-run quiz for Visual / Auditory / Reading / Mixed modes
- [x] **Adaptive responses** — AI format changes based on the user's learning profile
- [x] **Local RAG** — pre-loaded DepEd MELCs in SQLite for curriculum-grounded answers
- [x] **Visual generation** — LLM JSON → SVG science diagrams via `react-native-svg`
- [x] **Accessibility toggles** — OpenDyslexic font and High Contrast mode
- [x] **Text-to-Speech** — voice readout of Suri's responses
- [x] **Offline fallback validation** — seamless auto-switch to local SLM in airplane mode
- [x] **Suri mascot** — animated fox companion with Idle and Thinking states

---

## Getting Started

### Prerequisites

- Node.js 18+
- Expo CLI (`npm install -g expo-cli`)
- Android or iOS device / emulator

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/suri.git
cd suri

# Install dependencies
npm install

# Start the development server
npx expo start
```

### Running on Device

```bash
# Android
npx expo run:android

# iOS
npx expo run:ios
```

> **Note:** The on-device SLM (`llama.rn`) requires a native build — Expo Go will not work for Tier 3 offline inference. Use `npx expo run:android` or `npx expo run:ios`.

### Testing Offline Mode

1. Build and install the app on a physical device
2. Open the Chat tab and ask Suri a question to confirm Cloud AI is working
3. Enable **Airplane Mode** on the device
4. Ask another question — Suri should seamlessly switch to the on-device SLM (the status banner will update to reflect the active tier)

---

## Roadmap

| Phase | Features |
|---|---|
| **MVP (Hackathon)** | Offline AI, Cloud streaming, Local RAG, Learning profiles, A11y toggles, TTS |
| **v1.0** | Quizzes tab, spaced repetition, full Grade 7–10 MELC corpus |
| **v1.5** | Teacher dashboard, class progress tracking, Ilocano / Cebuano UI localization |
| **v2.0** | Collaborative study rooms, peer Q&A, parent-facing reports |

---

## 📊 Progress Map & Timeline

> **Overall Progress: `█░░░░░░░░░░░░░░░░░░░` 1%**

### Current Sprint Status

| Component | Status | Progress | Notes |
|---|---|---|---|
| 📄 Project Documentation | ✅ Done | █████████░ 100% | README, specs, project structure |
| 🏗 App Shell & Navigation | 🔲 Not Started | ░░░░░░░░░░ 0% | Expo init, tab navigation, routing |
| 🧠 Hybrid AI Router | 🔲 Not Started | ░░░░░░░░░░ 0% | Net detection, tier switching logic |
| ☁️ Cloud AI Integration | 🔲 Not Started | ░░░░░░░░░░ 0% | Gemini / Groq / DeepSeek streaming |
| 📱 On-Device SLM | 🔲 Not Started | ░░░░░░░░░░ 0% | llama.rn setup, model loading |
| 📚 Local RAG (DepEd MELCs) | 🔲 Not Started | ░░░░░░░░░░ 0% | SQLite vector store, MELC data |
| 🎨 Learning Profile Quiz | 🔲 Not Started | ░░░░░░░░░░ 0% | Onboarding flow, profile storage |
| 🖼 Visual Generation (SVG) | 🔲 Not Started | ░░░░░░░░░░ 0% | LLM JSON → SVG diagrams |
| ♿ Accessibility Features | 🔲 Not Started | ░░░░░░░░░░ 0% | OpenDyslexic, high contrast, TTS |
| 🦊 Suri Mascot Animation | 🔲 Not Started | ░░░░░░░░░░ 0% | Idle & thinking states |
| 🧪 Testing & QA | 🔲 Not Started | ░░░░░░░░░░ 0% | Offline fallback, provider cascade |

### Development Timeline

```
Week 1 (Current)
├── ✅ Day 1-2: Project planning & documentation
├── 🔲 Day 3-4: Expo project init, navigation shell
└── 🔲 Day 5-7: Hybrid AI router + Cloud AI streaming

Week 2
├── 🔲 Day 8-9:  On-device SLM (llama.rn) integration
├── 🔲 Day 10-11: Local RAG with DepEd MELCs
└── 🔲 Day 12-14: Learning profile quiz + adaptive responses

Week 3
├── 🔲 Day 15-16: SVG visual generation
├── 🔲 Day 17-18: Accessibility (font, contrast, TTS)
├── 🔲 Day 19-20: Suri mascot animations
└── 🔲 Day 21: Testing, polish, demo prep
```

### Legend

| Symbol | Meaning |
|---|---|
| ✅ | Completed |
| 🟡 | In Progress |
| 🔲 | Not Started |
| 🚫 | Blocked |

---

## AI Disclosure

*The initial repository structure and documentation for this project were assisted by AI tools.*

Core AI Functionality in Suri: Suri itself is an AI-powered application that utilizes a robust Hybrid AI Engine with a 3-tier routing architecture:

Tier 1 (Strong Signal): Cloud models via Gemini 3 Flash (Primary), Groq llama-3.1-8b-instant, and OpenRouter DeepSeek V3.
Tier 2 (Weak Signal): Reduced payload querying for low-bandwidth environments.
Tier 3 (Offline/No Signal): On-device small language model (SLM) using llama.rn running SmolLM2-135M-Instruct Q4_K_M locally.

---

## Contributing

# 👥 The Team

Suri was proudly built by:

* **Lorenz Gabriel Velasco**
* **Eunice Angeline Y. Cruz**
* **Ardiel Drew L. Cristobal**
* **Ma. Ellery Brienne B. Santiago**

---

## License

[MIT](LICENSE) — built with 💙 for Filipino learners.

---

<div align="center">

**Made for ACM TechSprint × Accenture · Philippines 🇵🇭**

</div>
