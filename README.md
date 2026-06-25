# Suri: Offline AI Study Companion for Filipino Learners

> *"Matalinong kasama sa pag-aaral, kahit walang internet."*

## Project Case

**Mobile App Edition — ACM TechSprint × Accenture**

This repository contains the mobile app project: **Suri**, a study buddy that adapts to how students learn — offline or online, visual or auditory, standard or accessible. It is designed specifically to address the dual barriers of poor internet connectivity and the lack of inclusive support for learners with disabilities in the Philippines.

## AI Disclosure

*Note: The initial setup, repository structure, and documentation for this project were assisted by AI tools.*

**Core AI Functionality in Suri:**
Suri itself is an AI-powered application that utilizes a robust **Hybrid AI Engine** with a 3-tier routing architecture:
*   **Tier 1 (Strong Signal):** Cloud models via Gemini 3 Flash (Primary), Groq `llama-3.1-8b-instant`, and OpenRouter DeepSeek V3.
*   **Tier 2 (Weak Signal):** Reduced payload querying for low-bandwidth environments.
*   **Tier 3 (Offline/No Signal):** On-device small language model (SLM) using `llama.rn` running SmolLM2-135M-Instruct Q4_K_M locally.

## MVP Scope

The minimum viable product (MVP) for the hackathon focuses on demonstrating Suri's offline-first architecture and adaptive learning capabilities:

1.  **App Shell:** React Native/Expo app with offline detection and bottom-tab navigation (Chat, Reviewer, Quizzes, Profile).
2.  **Cloud AI Streaming:** Token streaming from primary cloud models, including automatic provider cascade failovers.
3.  **Learning Profile Setup:** Personalized first-run quiz to select Visual, Auditory, Reading, or Mixed learning modes.
4.  **Adaptive Responses:** The AI changes its format (e.g., text vs. diagram vs. spoken) based on the user's learning profile.
5.  **Local RAG (Retrieval-Augmented Generation):** Pre-loaded Grade 6 Science DepEd MELCs in an SQLite vector store for grounded, curriculum-accurate answers.
6.  **Visual Generation:** Generating charts and labeled science diagrams dynamically from LLM JSON specs to `react-native-svg`.
7.  **Accessibility Toggles:** Live demonstration of Reader Font (OpenDyslexic) and High Contrast modes.
8.  **Text-to-Speech (TTS):** Integrated voice readout of Suri's responses.
9.  **Offline Fallback Validation:** Seamless, automatic transition to the local SLM when the device enters Airplane Mode.
10. **Suri Mascot:** UI integration of the animated fox companion (Idle, Thinking states).

## Skills & Technologies Used

*   **Mobile Framework:** React Native + Expo (SDK 54)
*   **Local AI Inference:** `llama.rn` v0.12.5
*   **Database & Vector Store:** `expo-sqlite`
*   **Generative UI:** `react-native-svg`
*   **State & Networking:** `@react-native-community/netinfo`, `expo-task-manager`
*   **Accessibility:** `expo-font` (OpenDyslexic), `react-native-reanimated`
*   **Voice/TTS:** `expo-speech`
