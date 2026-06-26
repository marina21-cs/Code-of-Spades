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

<br/>

> **ACM TechSprint × Accenture**
> Many Filipino students face barriers to quality educational support due to limited access to tutors, connectivity constraints, and language differences. Existing learning platforms often fail to accommodate diverse learning needs, particularly for students who prefer learning in Filipino or require personalized guidance aligned with their grade level.
> 
> Your challenge is to develop an AI-powered study companion that provides accessible and personalized academic assistance for Filipino learners. The solution should be capable of explaining concepts in both Filipino and English, generating practice exercises, and adapting to a student's learning level. Teams are encouraged to design solutions optimized for mobile devices and low-bandwidth environments to ensure that quality educational support is accessible to learners regardless of their location or circumstances.

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

### 🤝 Kasabay Mode — Study Together, Never Alone

Open the app and Suri is already at her desk, studying *with* you. **Kasabay Mode** is virtual **body doubling** — a focus technique validated for learners with ADHD (RA 11650) — that turns the dashboard into a shared study desk instead of a blank chat box.

- **Tambayan UI** — high-contrast dark canvas (battery-friendly on OLED) framed with neon teal and electric lime accents
- **Pixel-art Suri** — she flips pages, taps her pencil, and sips a drink while you work on paper, so you never feel like you're studying alone
- **Interrupt anytime** — pause your focus timer with a tap ("Stuck ka ba?") and Suri looks up from her textbook to help, then offers to resume
- **Low-Motion friendly** — switches to a gentle static image when the Low Motion accessibility setting is on

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

## 📊 Progress Map

> **Overall Progress: `████████████░░░░░░░░` ~60%** — backend logic is strong (now including Misconception Detection, Kasabay Mode, and OCR ingestion); the UI layer has not been started.

### Current Sprint Status

| Component | Status | Progress | Notes |
|---|---|---|---|
| 🗄️ Repository Setup | ✅ Done | ██████████ 100% | Git init, remote config, initial push |
| 📄 Project Documentation | ✅ Done | ██████████ 100% | README, specs, project structure |
| 🏗 App Shell & Navigation | 🟡 In Progress | ██░░░░░░░░ 20% | Root layout only, no screens |
| 🧠 Hybrid AI Router | 🟡 In Progress | █████████░ 90% | 3-tier cascade logic complete |
| ☁️ Cloud AI Integration | 🟡 In Progress | ████████░░ 85% | SSE streaming + provider cascade |
| 📱 On-Device SLM | 🟡 In Progress | ███████░░░ 75% | llama.rn wired, not device-tested |
| 📚 Local RAG (DepEd MELCs) | 🟡 In Progress | ██████░░░░ 60% | SQLite store live, lexical embeddings |
| 🎨 Learning Profile Quiz | 🟡 In Progress | █████░░░░░ 55% | Profile/prompt done, quiz UI missing |
| 🖼 Visual Generation (SVG) | 🟡 In Progress | ████░░░░░░ 40% | Parser done, no SVG renderer |
| ♿ Accessibility Features | 🟡 In Progress | ████░░░░░░ 45% | TTS works, no font/contrast UI |
| 🦊 Suri Mascot Animation | 🔲 Not Started | ░░░░░░░░░░ 0% | No code, dependency missing |
| 🩺 Misconception Detection | 🟡 In Progress | ███████░░░ 70% | Detector + taxonomy + prompt + Kwento wiring done (verified); no UI |
| 📷 Camera OCR (Worksheets) | 🟡 In Progress | █████░░░░░ 55% | Clean + chunk + ingest to personal RAG done (verified); native ML Kit recognizer not wired |
| 🤝 Kasabay Mode (Body Doubling) | 🟡 In Progress | ███████░░░ 70% | Focus timer + persona prompt + interruption logic done (verified); no UI |
| 🧪 Testing & QA | 🟡 In Progress | █████░░░░░ 45% | 12 headless verifiers pass, no test framework |
| 🎮 Gamification & Economy | 🟡 In Progress | ████████░░ 85% | Economy + streak logic, no UI |
| 📡 B2B Telemetry Sync | 🟡 In Progress | █████░░░░░ 55% | Local queue works, sync stubbed |

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

---

<div align="center">

**Made for ACM TechSprint × Accenture · Philippines 🇵🇭**

</div>
