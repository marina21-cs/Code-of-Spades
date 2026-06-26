# Suri: Offline AI Study Companion for Filipino Learners
**Mobile App Edition — ACM TechSprint × Accenture | Spec v3**

> *"Matalinong kasama sa pag-aaral, kahit walang internet."*
> A study buddy that adapts to how you learn — offline or online, visual or auditory, standard or accessible — and knows exactly where you got confused.

---

## 1. Problem Statement

Filipino students face two compounding barriers that existing EdTech platforms haven't resolved together.

**Barrier 1 — Connectivity.** As of 2023, only about 28% of Philippine households had fixed home internet, and more than 35% of public schools have no internet connectivity at all (Borgen Project, 2025, citing PSA/DICT data). Meanwhile, field studies in rural provinces consistently find that almost all students already own a smartphone (Nueva Ecija digital-literacy study, 2025). The device gap is mostly closed. The connectivity gap is not.

**Barrier 2 — Inclusive support.** Republic Act 11650 (2022), the Inclusive Education Act, mandates that every Filipino learner with a disability receives quality education. The data shows the system cannot deliver on that mandate: only 391,089 learners with disabilities (LWDs) were enrolled in public schools in 2024–25 — just 8% of the estimated 5 million Filipino children with disabilities nationwide (EDCOM 2 / IDinsight, 2025). Of those enrolled, roughly 60% have no access to SPED programs, centers, or trained teachers at their school. In rural areas that number drops to one in four (Inquirer, 2025). Only 12.3% of teachers have SPED specialization (IJRISS, 2025), and classrooms of 40+ students with mixed needs and no aide are the norm.

**Barrier 3 — The Silent Student Problem.** Filipino cultural dynamics around *hiya* (shame/face-saving) mean students in 40-50 person classrooms rarely admit confusion to authority figures. This is not a technology gap — it is a pedagogical design gap. Every existing EdTech platform was built for students who raise their hand and ask questions. Suri is built for the student who doesn't.

**Barrier 4 — Decontextualized learning.** Math and Science in the Philippines are taught in English — a second language for most students — using problems set in Western or abstract contexts. PISA 2022 showed 84% of Filipino students scored below minimum math proficiency. Research consistently identifies the absence of culturally grounded, locally relatable problems as a contributing factor.

Suri addresses all four barriers together.

---

## 2. Why Mobile App, Not PWA

| PWA failure mode | How mobile solves it |
|---|---|
| WebGPU crashes silently on budget Android Chrome | Native llama.cpp via `llama.rn` uses Android Vulkan/CPU directly |
| IndexedDB can be silently evicted by Chrome's storage manager | `expo-sqlite` is persistent OS-controlled storage |
| Service workers fail opaquely on Android in low-memory conditions | `expo-task-manager` + `expo-background-fetch` are explicit and debuggable |
| Web camera API is inconsistent across budget Android browsers | `expo-camera` + ML Kit give hardware-accelerated, consistent OCR |
| TTS/STT browser support varies dramatically across Android Chrome versions | `expo-speech` and `expo-speech-recognition` use native OS voice engines |
| PWA install prompt is buried and easy to miss | A real app icon on the home screen is what students and schools already understand |
| PWA cache is cleared by Chrome storage cleanup | App storage is under the app's control, not the browser's discretion |

**APK-first distribution** is critical for the target demographic. Schools can share the APK over local Wi-Fi, Bluetooth, or USB drives. No Play Store data charges. No Google account required. No bandwidth barrier at install time.

---

## 3. Solution Overview

Suri is a React Native / Expo mobile app with a fox mascot/study companion that combines six core capabilities:

**Hybrid AI tutoring** — A 3-tier architecture routes requests through a cascade of free cloud providers on good signal (Gemini 3 Flash primary → Groq secondary → OpenRouter tertiary), a reduced-payload cloud path on weak signal, and a quantized on-device SLM (SmolLM2-135M via `llama.rn`) when completely offline.

**Adaptive learning modes** — A Learning Profile shapes every response the AI generates. Visual learners get diagrams. Auditory learners hear responses. Students who prefer structured text get bullet-pointed explanations.

**Built-in accessibility** — Dyslexia-friendly font, colorblind-safe diagram palettes, high-contrast mode, ADHD focus mode, and low-vision support are all user-selectable settings.

**Kwento Mode** *(new in v3)* — AI-generated educational stories set in Filipino cultural contexts (palengke, laro sa kalye, tindahan, lakad pauwi) in Tagalog, Taglish, or English. Stories embed curriculum-accurate exercises and scale in narrative complexity from single-character elementary scenarios to multi-variable high school problems.

**Misconception Detection** *(new in v3)* — Identifies the specific wrong belief a student holds about a topic, not just whether they got an answer wrong. Produces different targeted explanations for different misconceptions about the same topic. Designed specifically for the silent student who cannot or will not raise their hand in a 50-person class.

**Kasabay Mode** *(new in v3)* — A virtual body-doubling study desk. Instead of opening to a blank chat log, the dashboard shows Suri sitting at a desk studying alongside the student — a scientifically validated focus technique especially effective for learners with ADHD (RA 11650). The student studies their physical textbook or worksheet while Suri studies on-screen, and can interrupt a focus timer anytime to ask for help.

---

## 4. Target Users & Scope

- **Primary:** Grades 1–12 students using DepEd's K-12 curriculum, with emphasis on rural/low-connectivity areas, students who study in Filipino or code-switch between Filipino and English, learners with disabilities, and students who lack access to private tutoring.
- **Secondary:** Teachers and parents (via optional sync dashboard) and senior high students reviewing for board-prep subjects.
- **Curriculum anchor:** DepEd Most Essential Learning Competencies (MELCs) — the streamlined 5,700-competency corpus — stored locally in `expo-sqlite` and used as the RAG grounding layer for all AI responses.

---

## 5. Core Features

### 5.1 Offline-First Mobile Architecture

- Distributed as an APK for sideloading and via Google Play Store.
- All core tutoring, quizzing, and reviewer features work with zero connectivity after the initial install and first-run curriculum download.
- `expo-task-manager` + `expo-background-fetch` handle silent background sync when a device comes back online.
- `@react-native-community/netinfo` monitors signal type in real time and routes AI requests to the correct tier automatically.

### 5.2 Hybrid AI Engine (3-Tier Routing)

```
TIER 1 — Strong signal (4G / WiFi)
  Primary → Google Gemini 3 Flash  [gemini-3-flash]
    • Free quota (June 2026): 10 RPM, 1,500 RPD, 1M TPM
    • OpenAI-compatible REST endpoint
    • Native Filipino/Tagalog + English/code-switching support (validated)
    • SSE streaming: tokens appear immediately, even on slow 4G
    • Payload: top-3 MELC passages + question + learning profile modifier

  Fallback 1 → Groq  [llama-3.1-8b-instant]
    • Free quota (June 2026): 30 RPM, up to ~14,400 RPD
    • OpenAI-compatible: base URL swap only
    • LPU inference: <200ms first-token latency

  Fallback 2 → OpenRouter  [deepseek/deepseek-v3-0324:free]
    • 20 RPM, ~200 RPD

  Combined free daily capacity: ≈16,000 RPD (80× the original design)

TIER 2 — Weak signal (2G / 3G)
  Primary → Gemini 3 Flash with reduced payload (top-1 MELC passage, 150-token max output)
  Fallback 1 → Groq llama-3.1-8b-instant
  Fallback 2 → Serve cached SQLite RAG responses for repeat curriculum queries

TIER 3 — No signal
  → llama.rn v0.12.5: SmolLM2-135M-Instruct Q4_K_M GGUF (~100MB)
    • CPU-only inference, auto-Vulkan on capable GPUs
    • Context window capped at 256 tokens (Extreme Lite Config)
    • n_threads = min(4, deviceCPUCount − 1)
    • Top-k retrieval expanded 3 → 5 MELC passages
    • Model pre-warmed 30s after app loads
```

### 5.3 Local RAG Store ("Personalized Reviewer")

- `expo-sqlite` database holding pre-embedded MELC competency content, chunked by subject and grade level.
- MELC corpus embeddings are pre-computed at build time and bundled with the app.
- Students add their own materials: typed notes or photos of worksheets via on-device OCR. Personal content is embedded at runtime.
- Every AI response retrieves top-k relevant passages before generation, keeping answers curriculum-accurate and grade-level-appropriate.
- Cached cloud responses are stored and served on subsequent offline requests for the same query.

### 5.4 Generative Visual Questions

- The AI outputs a structured JSON spec (chart type + data values, or diagram type + labeled components) which `react-native-svg` renders live within the chat.
- Every diagram is generated fresh for the specific question.
- **Colorblind-safe by default:** the SVG renderer uses palette variants matched to the student's accessibility setting.

### 5.5 Camera-Based Worksheet OCR

- Students photograph printed worksheets, textbook pages, or material written on a board.
- `expo-camera` captures; ML Kit Text Recognition (bundled, no network) extracts text on-device.
- Extracted text is embedded and added to the student's personal RAG layer.

### 5.6 Adaptive Learning Profiles

| Mode | What changes in every AI response |
|---|---|
| **Visual** | Suri defaults to a diagram spec for every concept |
| **Auditory** | Responses written to read naturally aloud; TTS auto-plays |
| **Reading / Writing** | Structured text: bullet points, numbered steps, definitions first |
| **Kinesthetic** | Shorter responses; drag-and-drop or tap-to-reveal before explaining |
| **Mixed** | Suri balances all modalities per topic complexity |

**Accessibility comfort settings:**

| Setting | What it does |
|---|---|
| **Reader Font** | Switches to OpenDyslexic across the entire app |
| **Color Vision** | Deuteranopia / protanopia / tritanopia palette on all diagrams and UI |
| **High Contrast** | Full white/black UI, increased border weight |
| **Large Text** | Scales all text 1.3×; SVG diagram labels scale to match |
| **Focus Mode** | Responses capped at ~120 words; one idea per message |
| **Low Motion** | Disables all non-essential animation |

### 5.7 Voice (TTS + STT)

- **TTS:** `expo-speech` reads any Suri response aloud; auditory mode auto-plays every response.
- **STT (online):** Groq Whisper API — 2,000 RPD free, ultra-fast, Filipino + English.
- **STT (online fallback):** `expo-speech-recognition` SDK 54 — native OS recognition.
- **STT (offline, optional):** `whisper.rn` v0.6.0 + ggml-tiny multilingual (~75MB) — fully offline, Android 8.0+.

---

### 5.8 Kwento Mode

> *"Ang pagkatuto ay mas masaya kapag nasa kwentong pamilyar ka."*

#### Overview

Kwento Mode generates short educational stories set in Filipino cultural contexts — palengke, laro sa kalye, lakad pauwi, tindahan ng kapitbahay, palaruan, bahay, eskwelahan — that embed curriculum-accurate math, science, or language exercises inside a conversational narrative. The student reads the story, encounters the embedded problem naturally within the narrative, and solves it. Stories are generated fresh for each session in Tagalog, Taglish, or English based on the student's language preference and Learning Profile.

**Why it matters:**
- 84% of Filipino students scored below minimum math proficiency in PISA 2022. Research consistently identifies decontextualized problems and second-language instruction (English) as contributing factors.
- Kwento Mode closes both gaps simultaneously: problems live inside familiar Filipino settings, in the student's actual language register.
- Unlike existing tools (Khanmigo, MagicSchool) that generate generic word problems or use Western cultural frames, Kwento Mode is built from the ground up for Filipino student life.

#### Grade-Level Narrative Complexity

| Grade Band | Narrative Structure | Problem Type | Story Length |
|---|---|---|---|
| Grades 1–2 | 1 character, 1 setting, no dialogue | 1-step, concrete objects | 3–5 sentences |
| Grades 3–4 | 1–2 characters, 1 setting, basic dialogue | 2-step, familiar units | 5–8 sentences |
| Grades 5–6 | 2–3 characters, 2 settings, cause-effect | Multi-step, fractions/ratios | 8–12 sentences |
| Grades 7–8 | Multiple characters, relationships, variables | Multi-variable, word problem with unknowns | 10–14 sentences |
| Grades 9–10 | Complex scenario, multi-stakeholder | Abstract relationships, proof/reasoning | 12–16 sentences |
| Grades 11–12 | Systems-level scenario | Analysis, synthesis, multi-concept integration | 14–18 sentences |

#### Cultural Setting Library

| Setting | Natural Subject Areas | Example Elements |
|---|---|---|
| Palengke | Math (money, weight, fractions), Science (food science, biology) | Tindera, presyo, timbang, sukli |
| Laro sa kalye (patintero, sipa, tumbang preso) | Math (distance, speed, geometry), Physics | Linya, tayaan, puwersa, distansya |
| Lakad pauwi | Science (observation), Math (time, distance) | Langit, halaman, hangin, oras |
| Tindahan ng kapitbahay (sari-sari) | Math (fractions, ratio, percent) | Stock, utang, sukli, servings |
| Palaruan / gym | Physics (forces, motion), Math (geometry) | Gravity, momentum, anggulo |
| Bahay (cooking, chores) | Math (measurement), Science (chemistry, biology) | Sangkap, sukat, temperatura |
| Eskwelahan (canteen, classroom) | Any MELC topic | Proyekto, grupo, eksperimento |

#### Story Generation Architecture

**Input to AI:**
```typescript
interface KwentoModeRequest {
  gradeLevel: number;              // 1–12
  melcTopic: string;               // e.g., "photosynthesis Grade 5 Science"
  melcPassages: string[];          // top-3 RAG-retrieved passages
  languagePreference: 'tagalog' | 'taglish' | 'english';
  learningProfile: LearningProfile;
  culturalSetting?: string;        // optional override; AI selects if null
  difficulty: 'easy' | 'medium' | 'hard';
}
```

**AI output (structured JSON):**
```typescript
interface KwentoModeResponse {
  kwento: string;          // The story text
  tanong: string;          // The embedded problem/question
  hint: string;            // Gentle hint in same language as kwento
  suliranin_sagot: string; // Answer with step-by-step solution
  melc_topic: string;      // Confirmed MELC competency addressed
  grade_level: number;     // Confirmed grade level
  setting: string;         // Cultural setting used
  difficulty: string;      // Confirmed difficulty
  follow_up: string;       // Optional follow-up problem if student solves correctly
}
```

**System prompt template (see `ai-validation-prompts-kwento-mode.md` for full prompt):**

The system prompt instructs the AI to:
1. Generate a story grounded in the selected Filipino cultural setting
2. Embed exactly one educational problem (or two for advanced grades) into the story naturally — not bolted on at the end as "Tanong:"
3. Use the student's language register (Tagalog, Taglish, or English) naturally throughout, including natural code-switching within Taglish mode
4. Keep the narrative at the appropriate complexity level for the grade band
5. Output structured JSON so the app can parse story, problem, hint, and solution separately
6. Ground the problem in the MELC passage provided via RAG

**Offline behavior (Tier 3 / SmolLM2):**
- Story is shorter (4–6 sentences max) due to 256-token context window
- Cultural setting is pre-selected from a local cache of 10 common settings
- Problem difficulty is fixed at "easy" in offline mode
- Hint is always generated and shown immediately (no second AI call)

#### React Native Component Structure

```
KwentoModeScreen/
├── KwentoModeScreen.tsx        # Main screen, orchestrates state
├── StoryCard.tsx               # Renders the kwento with reading mode support
├── ProblemBlock.tsx            # Shows the embedded tanong with input field
├── HintReveal.tsx              # Animated hint reveal (tap to show)
├── SolutionReveal.tsx          # Step-by-step answer after attempt
└── KwentoSettingSelector.tsx   # Optional: let student pick cultural setting
```

#### Integration with Other Features

- **Learning Profile:** Story length, reading level, and TTS auto-play are all controlled by the student's active profile.
- **Misconception Detection:** If a student gets the problem wrong, the answer attempt is routed through Misconception Detection before a generic "try again" is shown.
- **Adaptive difficulty:** A correct answer triggers a new Kwento at +1 difficulty. Two consecutive wrong answers trigger a new Kwento at −1 difficulty.
- **Streaks & rewards:** Completed Kwentos count toward the daily learning streak.

---

### 5.9 Misconception Detection

> *"Ang pinaka-mapanganib na maling kaalaman ay 'yung akala mong tama."*

#### Overview

Misconception Detection is Suri's most pedagogically sophisticated feature. When a student gets something wrong — or asks a question that reveals a specific wrong belief — Suri doesn't just re-explain the correct answer. It identifies the exact misconception driving the error and delivers a targeted explanation that addresses that specific wrong belief. A student who thinks "plants eat soil" gets a different explanation than a student who thinks "photosynthesis stops at night" — even though both are asking about photosynthesis.

This is the private tutor capability that no existing consumer app in the Philippines offers. Private tutors diagnose specific misconceptions and explain accordingly. Suri democratizes that diagnostic capability for every Filipino student with a phone.

**What makes it different from other AI tutors:**
- Khanmigo, Socratic, ChatGPT: detect a wrong answer → re-explain the correct answer generically
- Eedi: pre-mapped MCQ distractors → static pre-written hints (requires multiple choice, pre-defined wrong answers)
- Suri Misconception Detection: open dialogue → detect specific wrong belief → different explanation per belief → in Tagalog/Taglish

**The silent student design:**
Misconception Detection is specifically designed for students who cannot or will not raise their hand in a 50-person class (*hiya* culture). The student doesn't need to admit confusion — Suri detects it from how they answer, what they say, or what question they ask.

#### Misconception Detection Flow

```
Student message / wrong answer
         │
         ▼
  [MELC topic identified]
         │
         ▼
  AI: Analyze for misconception signals
  ─ Wrong causal chain ("kasi...")
  ─ Incorrect definition used as fact
  ─ Confused related concepts
  ─ Overgeneralization of a rule
  ─ Reversed directionality (effect ≠ cause)
  ─ Partial understanding (incomplete but not entirely wrong)
         │
    ┌────┴────┐
    │         │
 No misc.  Misconception found
    │         │
    ▼         ▼
 Normal   Classify misconception type
 explain       │
               ▼
         Generate TARGETED explanation
         (addresses wrong belief directly,
          not the correct answer generically)
               │
               ▼
         Check comprehension
         (follow-up question)
               │
               ▼
         Flag in student profile
         (for future session awareness)
```

#### Misconception Classification System

```typescript
type MisconceptionType =
  | 'WRONG_CAUSATION'       // Wrong thing causes the phenomenon
  | 'WRONG_DEFINITION'      // Incorrect definition of a concept
  | 'CONCEPT_CONFUSION'     // Two separate concepts conflated
  | 'OVERGENERALIZATION'    // Rule applied too broadly
  | 'DIRECTIONALITY_ERROR'  // Cause and effect reversed
  | 'PARTIAL_UNDERSTANDING' // Incomplete but not entirely wrong
  | 'LANGUAGE_CONFUSION'    // Tagalog/English term confusion causing error
  | null;                   // No misconception detected

interface MisconceptionRecord {
  topic: string;
  melcCompetency: string;
  misconceptionType: MisconceptionType;
  specificWrongBelief: string;      // Exact wrong belief in student's words
  detectedAt: Date;
  resolvedAt?: Date;
  gradeLevel: number;
}
```

#### Known Misconception Taxonomy (pre-loaded in SQLite)

The app ships with a local taxonomy of common Filipino student misconceptions per subject. This taxonomy is used as additional context in the RAG layer when Misconception Detection is active.

**Science — Grade 3–6 (selected examples):**
| Topic | Wrong Belief | Misconception Type |
|---|---|---|
| Photosynthesis | Ang plants ay kumakain ng lupa (soil is food) | WRONG_CAUSATION |
| Photosynthesis | Nagpophotosynthesis pa rin sa gabi | WRONG_DEFINITION |
| Gravity | Mas mabilis mababagsak ang mas mabigat | WRONG_CAUSATION |
| Water cycle | Ang ulan ay tubig na mula sa dagat (teleported, not evaporated) | WRONG_CAUSATION |
| States of matter | Ang yelo ay may hangin sa loob kaya malamig | WRONG_CAUSATION |

**Science — Grade 7–10 (selected examples):**
| Topic | Wrong Belief | Misconception Type |
|---|---|---|
| Evolution | Ang hayop ay mag-a-adapt habang buhay | WRONG_DEFINITION |
| Seasons | Mainit sa tag-araw kasi malapit tayo sa araw | WRONG_CAUSATION |
| Electricity | Bumabalik sa baterya ang kuryente kapag naubos | DIRECTIONALITY_ERROR |
| Photosynthesis | Ang CO₂ ay waste product ng photosynthesis | DIRECTIONALITY_ERROR |

**Math — Grades 1–6 (selected examples):**
| Topic | Wrong Belief | Misconception Type |
|---|---|---|
| Fractions | 1/3 > 1/2 kasi mas malaki ang 3 | WRONG_DEFINITION |
| Multiplication | Palagi nagpapalaki ang multiplication | OVERGENERALIZATION |
| Place value | Ang 0 sa dulo ay walang halaga | PARTIAL_UNDERSTANDING |
| Word problems | "Less" = subtract always | OVERGENERALIZATION |

**Math — Grades 7–10 (selected examples):**
| Topic | Wrong Belief | Misconception Type |
|---|---|---|
| Negative numbers | Wala sa realidad ang negatibong numero | WRONG_DEFINITION |
| Probability | Kung 5 beses tails, malamang heads na | WRONG_CAUSATION |
| Algebra | Ang variable x ay specific na numero | WRONG_DEFINITION |
| Division by zero | May sagot ang divided by zero | WRONG_DEFINITION |

#### AI Output Structure

```typescript
interface MisconceptionDetectionResponse {
  has_misconception: boolean;
  misconception_type: MisconceptionType;
  specific_wrong_belief: string;        // Student's exact wrong belief identified
  correct_understanding: string;        // What is actually true
  acknowledgment: string;               // What student got right (if anything)
  targeted_explanation: string;         // Addresses ONLY the specific wrong belief
  cultural_analogy?: string;            // Optional: Filipino cultural analogy to illustrate
  follow_up_question: string;           // Check comprehension after explanation
  suggested_kwento?: boolean;           // True if a Kwento Mode story would help consolidate
  language_detected: 'tagalog' | 'taglish' | 'english';
  confidence: number;                   // 0.0–1.0 confidence in misconception detection
}
```

#### Key Design Principles

1. **Address the wrong belief first, not the correct answer.** The explanation starts from where the student's thinking went wrong, not from the textbook definition.

2. **Acknowledge what is correct.** Even a student who thinks "photosynthesis happens at night" probably knows that plants need sunlight. Suri acknowledges that before correcting.

3. **Use the same language and cultural context.** If the student wrote in Taglish, the explanation is in Taglish. If they mentioned a specific Filipino example, the explanation uses that example.

4. **Never make the student feel stupid.** The tone is always "that's a really common thing to mix up, kasi..." not "that's wrong because..."

5. **Track and remember across sessions.** Detected misconceptions are stored in the student's profile. If the same topic comes up in a future session, Suri proactively checks whether the previously detected misconception was resolved.

#### React Native Component Structure

```
MisconceptionDetectionModule/
├── MisconceptionDetector.ts          # Service: analyzes student input
├── MisconceptionExplainer.tsx        # Renders targeted explanation in chat
├── MisconceptionBadge.tsx            # Subtle UI indicator when misconception found
├── MisconceptionHistory.tsx          # Optional: shows student's resolved misconceptions
└── misconceptionTaxonomy.ts          # Local taxonomy for RAG augmentation
```

#### Integration with Other Features

- **Kwento Mode:** If Misconception Detection flags a specific wrong belief, Kwento Mode can generate a story that illustrates the correct concept through the cultural narrative, rather than re-stating the textbook definition.
- **Learning Profile:** The Focused Mode setting (for ADHD/attention regulation) splits the targeted explanation into shorter segments with micro-rewards between each.
- **Offline (Tier 3):** SmolLM2 has limited misconception detection capability in offline mode. In Tier 3, detection falls back to checking if the student's answer matches any known wrong beliefs in the local `misconceptionTaxonomy.ts`. If matched, the pre-written explanation from the taxonomy is served rather than AI-generated.

---

### 5.10 Kasabay Mode (Virtual Body Doubling)

> *"Hindi ka nag-aaral mag-isa. Kasabay mo si Suri."*

#### Overview

Kasabay Mode turns Suri's primary dashboard from a blank chat log into a **virtual study desk**. Instead of opening the app to an empty input box, the student opens it to find Suri — the fox companion — already seated at a desk, studying alongside them.

This is **body doubling**: a scientifically validated focus technique where simply having another person present and working keeps you anchored on your own task. It is especially effective for students with ADHD and executive-function difficulties, which ties directly into the **RA 11650 (Inclusive Education Act)** mandate Suri is built to serve. The student works through a physical textbook or paper worksheet; Suri studies on-screen; neither is alone.

**Why it matters:**
- Body doubling is one of the most reliable, low-cost focus interventions for learners with ADHD and attention-regulation challenges — no medication, no specialist, and no extra hardware required.
- Students in 40–50 person classrooms rarely receive individual focus support. A study companion who is simply *present* helps fill that gap.
- It reframes solo studying — often isolating and easy to abandon — as a shared *tambayan* session, lowering the activation energy needed to start and to keep going.

#### The "Tambayan" UI (Visual Experience)

When the student enters Kasabay Mode, the screen transitions into a **high-contrast dark canvas** — chosen deliberately to save battery on OLED budget phones and to reduce eye strain during long study sessions. The canvas is accented with sleek **neon teal and electric lime** borders. At the center sits a beautifully rendered **2D pixel-art animation of Suri** at a desk, studying.

| Element | Design intent |
|---|---|
| Dark canvas | Battery saving on OLED screens; reduced eye strain for long sessions |
| Neon teal + electric lime accents | High-contrast, calm-but-energizing "study tambayan" vibe |
| Centered pixel-art Suri at a desk | Warm, low-fidelity companion presence — an anchor, not a distracting hyper-real avatar |
| Minimal chrome | Keeps the focus anchor in the student's peripheral vision while they work on paper |

**Idle Animation.** While the student reads a physical textbook or solves a worksheet on paper, Suri mirrors the behavior on-screen — flipping pages, occasionally tapping a pencil, or sipping a drink. These looping micro-animations give the immediate, comforting feeling that the student is *not* studying alone.

**Low-Motion Support.** Honoring Suri's accessibility commitments, the animation is gentle by default and **can be toggled to a single static image** when the student enables the **Low Motion** accessibility setting. The companion presence remains; only the motion is removed.

#### Study Timer & Interruption Flow

Kasabay Mode is built around a focus timer — the student sets a study block, and Suri "studies" for its duration. The student can **interrupt the timer at any moment** to ask for help. That interruption is the core moment Kasabay Mode is designed around: Suri looks up from her own textbook to help a peer.

```
Student opens app → Kasabay Mode (virtual study desk)
        │
        ▼
  Start a focus block → Suri studies (idle animation loop)
        │
   ┌────┴───────────────────────┐
   │                            │
 Timer runs                Student taps "Stuck ka ba?" (interrupt)
   │                            │
   ▼                            ▼
 Block ends               Suri "looks up from her textbook"
   │                            │
   ▼                            ▼
 Micro-reward +           Answer via MELC RAG + Misconception Detection
 streak credit                  │
                                ▼
                    "Ready ka na bang ituloy ang timer?" → resume block
```

#### Kasabay Mode System Prompt

The interruption is handled by a dedicated persona prompt that frames Suri as a peer studying *with* the student, not a professor lecturing *at* them. `{cognitiveModifier}` is injected from the Learning Profile "vibe check" and `{last_topic_discussed}` is pulled from the student's recent session history (local SQLite), so memory references work even offline.

```
You are Suri, an AI study companion. You are currently sitting at a virtual desk
studying alongside the student in "Kasabay Mode". The student has just interrupted
their study timer to ask you for help.

### CORE PERSONA & TONE
- Act as a peer, not a professor. You are studying *with* them.
- Use conversational Tagalog, Taglish, or English depending on the student's input.
- Keep the tone encouraging, warm, and highly collaborative.

### CURRENT CONTEXT
- Study Session Status: Active Interruption.
- Current Vibe Check: {cognitiveModifier}
- Memory: Yesterday, you and the student successfully studied: {last_topic_discussed}.
  (Reference this naturally ONLY if it connects to their current question to build confidence.)

### RESPONSE RULES
1. Acknowledge the interruption gently (e.g., "Stuck ka ba? Patingin nga," or
   "No problem, let's look at this together.")
2. Address the student's specific question using the provided DepEd MELC context.
3. If they are confused (Misconception Detection), address the specific wrong belief
   before explaining the correct answer.
4. End your response by asking if they understand the concept well enough to resume
   the study timer.

DO NOT output markdown headers or long introductory essays. Speak directly to the
student as if you are looking up from your own textbook.
```

#### React Native Component Structure

```
KasabayMode/
├── KasabayModeScreen.tsx       # Main "study desk" dashboard; orchestrates timer + state
├── SuriDeskCanvas.tsx          # Dark canvas + neon teal/lime borders; hosts the animation
├── SuriIdleAnimation.tsx       # Looping pixel-art (page flip, pencil tap, sip); static fallback on Low Motion
├── StudyTimer.tsx              # Focus-block timer with start / pause / interrupt
├── InterruptButton.tsx         # "Stuck ka ba?" — pauses timer, opens the help input
└── kasabayPromptBuilder.ts     # Builds the Kasabay system prompt (vibe check + memory injection)
```

#### Integration with Other Features

- **Learning Profile & Accessibility:** The **Low Motion** setting swaps the idle animation for a static image; **High Contrast** already aligns with the dark canvas; **Focus Mode** caps the length of help responses during an interruption.
- **Misconception Detection:** Every interruption is routed through Misconception Detection (system prompt rule #3) so a confused question is diagnosed, not just re-answered.
- **Kwento Mode:** If an interruption reveals a misconception, Suri can offer a quick Kwento to consolidate the concept before the student resumes their block.
- **Streaks & rewards:** Completed focus blocks count toward the daily learning streak, the same economy that rewards completed Kwentos and resolved misconceptions.
- **Memory:** `{last_topic_discussed}` is read from local session history so Suri can reference "yesterday's" topic naturally to build confidence.

#### Offline behavior (Tier 3 / SmolLM2)

- The desk canvas, idle animation, and focus timer are **fully local** — they require no connectivity at all.
- Interruptions raised while offline route to the on-device SmolLM2 (Tier 3) using the same Kasabay persona prompt, trimmed to fit the 256-token context window.
- `{last_topic_discussed}` comes from local SQLite session history, so the memory reference still works with zero signal.

---

## 6. Technical Architecture

### 6.1 System Architecture Diagram

```
Student Input
    │
    ▼
[Learning Profile Modifier]
    │
    ├──── Kasabay Mode ── [Study Desk + Focus Timer] ──► [Interrupt] ──► Chat / Q&A
    │
    ├──── Chat / Q&A ────────────────────────────────►[Adaptive Response]
    │
    ├──── Kwento Mode ─── [Story Generator] ──────►[Kwento + Tanong]
    │          │                │
    │          │         [MELC RAG Layer]
    │          │
    │     [Student Answer]
    │          │
    │          ▼
    │    [Misconception Detector]
    │          │
    │     ┌────┴────┐
    │     │         │
    │  No misc.   Misc. found
    │     │         │
    │     ▼         ▼
    │  [Normal]  [Targeted Explanation]
    │              │
    │              ▼
    │         [Kwento Mode follow-up?]
    │
    └──── Misconception Detection ──────────────────►[Targeted Explanation]
              (standalone entry point)
```

### 6.2 Full Technology Stack

| Layer | Technology | Notes |
|---|---|---|
| Framework | React Native + Expo SDK 54 | Managed workflow |
| Distribution | APK sideload + Play Store | APK-first for school Wi-Fi sharing |
| Tier 1 AI (primary) | Gemini 3 Flash via Google AI API | 10 RPM · 1,500 RPD free · best Filipino/Tagalog coverage |
| Tier 1 AI (fallback 1) | Groq `llama-3.1-8b-instant` | 30 RPM · ~14,400 RPD free · LPU <200ms TTFT |
| Tier 1 AI (fallback 2) | OpenRouter `deepseek/deepseek-v3-0324:free` | 20 RPM · 200 RPD · strong multilingual |
| Tier 2 AI | Same cascade with reduced payload (top-1 MELC, 150-token cap) | Groq LPU speed compensates for weak-signal latency |
| Tier 3 AI | `llama.rn` v0.12.5 + SmolLM2-135M-Instruct Q4_K_M | ~100MB · CPU-default + auto-Vulkan |
| Local database | `expo-sqlite` | MELC corpus, sessions, streaks, cached responses, misconception records; WAL mode |
| Vector store | `expo-sqlite` + cosine similarity | Pre-computed MELC embeddings + runtime personal content |
| Misconception taxonomy | `expo-sqlite` | Local pre-loaded taxonomy; updated on sync |
| Learning Profile | `expo-secure-store` | Profile, grade level, accessibility settings, misconception history |
| Visual rendering | `react-native-svg` | JSON spec → charts and diagrams; colorblind palette variants |
| Camera OCR | `expo-camera` + ML Kit Text Recognition | On-device, offline, lazy-initialized |
| TTS | `expo-speech` | Works offline on iOS; Android depends on device TTS engine |
| STT (online) | Groq Whisper API | 2,000 RPD free · ultra-fast · Filipino + English |
| STT (online fallback) | `expo-speech-recognition` SDK 54 | Native OS recognition |
| STT (offline, optional) | `whisper.rn` v0.6.0 + ggml-tiny multilingual (~75MB) | Fully offline · Android 8.0+ |
| Accessibility font | `expo-font` + OpenDyslexic | Bundled at build time |
| Signal detection | `@react-native-community/netinfo` | `effectiveType` for tier routing |
| Background sync | `expo-task-manager` + `expo-background-fetch` | Silent curriculum + taxonomy updates |
| Notifications | `expo-notifications` | Local streak reminders, no server required |
| Animations | `react-native-reanimated` v4+ | Suri state machine; respects lowMotion setting |
| Kasabay Mode | `react-native-reanimated` + sprite-sheet pixel art | Idle study-desk animation (page flip, pencil tap, sip); static-image fallback on Low Motion; focus timer is pure app logic |
| Kinesthetic | `react-native-gesture-handler` | Drag-and-drop quizzes |

---

## 7. User Experience Flow

```
First run
  → Grade level + subject selection
  → Language preference (Tagalog / Taglish / English)
  → Learning Profile setup (5-question interactive sequence)
  → Accessibility comfort settings (optional)
  → MELC database download (background)
  → Optional: SmolLM2 offline model download

Daily use
  → App opens to Kasabay Mode (virtual study desk): Suri is already studying alongside you
  → Bottom tab navigation: Kasabay | Chat | Kwento | Review | Quizzes | Profile
  → Kasabay tab: start a focus block → study on paper → interrupt anytime to ask for help → resume
  → Kwento tab: browse by subject, tap to generate a new story
  → Chat tab: ask any question → Misconception Detection runs on every answer
  → Streaks + micro-rewards on every completed focus block, completed Kwento, or resolved misconception
```

---

## 8. Adaptive Learning Loop

The three intelligent features work together as a single adaptive learning loop:

```
[Kwento Mode] → surfaces learning and generates problems
      ↓ (wrong answer)
[Misconception Detection] → diagnoses specific wrong belief
      ↓ (explanation + follow-up)
[Kwento Mode] → generates a new story that illustrates the correct concept
      ↓ (correct)
[Adaptive difficulty] → next Kwento is harder; misconception marked resolved
```

The student's Learning Profile continuously updates based on:
- Kwento Mode answer accuracy per topic
- Detected misconception types per subject
- Grade-level performance signals

---

## 9. Why This Is Differentiated

| | Typical "AI study app" | Khanmigo (best in class) | Suri |
|---|---|---|---|
| Offline mode | Caches pre-made content | Cloud-only | Full AI tutoring on-device via native llama.cpp |
| Visuals | None, or a fixed pick-from-library | None | Generated fresh per question, colorblind-safe |
| Language | English-first | English-first; limited other languages | Native Tagalog/Taglish code-switching; Filipino cultural register |
| Personalization | Same response format for every student | Same format for every student | Learning Profile adapts mode, modality, depth per student |
| Misconception detection | None — re-explains correct answer | Socratic guiding questions, not specific diagnosis | Diagnoses SPECIFIC wrong belief; different explanation per misconception |
| Culturally grounded problems | None | US-centric contexts | Filipino cultural settings (palengke, kalye, tindahan); Taglish |
| Silent student design | Not considered | Not considered | All features designed for *hiya* culture — no hand-raising required |
| Accessibility | Not designed for LWDs | Basic | Multiple comfort settings addressing RA 11650 mandate |
| Focus & body doubling | None | None | Kasabay Mode — a virtual study-desk companion for ADHD/attention support (RA 11650) |
| Distribution | Requires internet to install | Requires internet | APK over local Wi-Fi, USB, or Bluetooth — no data charges |
| Private tutoring gap | Not addressed | Partially (Socratic) | Diagnoses misconceptions + Kwento Mode = affordable private tutor for all |

---

## 10. Risks & Validated Mitigations

### 10.1 Misconception Detection Accuracy

**Risk:** LLMs are currently weaker at identifying incorrect reasoning containing misconceptions than at identifying correct reasoning (MISTAKE, ACL 2025).

**Mitigation (layered):**
1. MELC RAG grounding gives the AI curriculum context — it isn't working blind when diagnosing.
2. Local misconception taxonomy in SQLite provides known wrong beliefs as additional context during detection.
3. Confidence threshold: if `confidence < 0.7`, Suri falls back to Socratic questioning rather than asserting a specific misconception.
4. The app never asserts "you believe X" — it asks "I think I noticed something — is this what you meant?" framing, leaving the student in control.
5. Offline (Tier 3): Detection is taxonomy-lookup only (no AI generation), which is 100% accurate for pre-mapped misconceptions.

### 10.2 Kwento Mode Cultural Appropriateness

**Risk:** AI-generated Filipino cultural settings could be stereotypical or inaccurate.

**Mitigation:**
1. Cultural settings are specified from a curated list (not free-generated by the AI) with Filipino-specific vocabulary constraints.
2. The system prompt explicitly prohibits stereotypical framing (e.g., "do not depict characters as poor or struggling — depict them as ordinary Filipino students in everyday situations").
3. The MELC RAG layer grounds the story's subject matter in curriculum content, preventing factual errors in the educational content.
4. Post-generation: the app displays the story to the student for 2 seconds before showing the problem, allowing the student to read and flag inappropriate content via a thumbs-down.

### 10.3 Kwento Mode Offline Limitations

**Risk:** SmolLM2-135M cannot generate coherent 15-sentence multi-variable stories.

**Mitigation:**
- Offline Kwento Mode caps story length at 5 sentences (Grade 1–4 complexity regardless of student grade level).
- In offline mode, the AI assembles a story from pre-templated sentences rather than free generation, using fill-in-the-blank slots from the MELC passage.
- Students are informed: "Suri is in local mode — shorter stories today."

### 10.4 On-device SLM is weaker than cloud model

*Validated mitigation:* SmolLM2-135M-Instruct Q4_K_M (~100MB). Top-k expanded 3→5 in offline mode. Output capped at 200 tokens. Framed as structured summary. ✅ Confirmed compatible with llama.cpp.

### 10.5 Budget device performance (RAM, OOM)

- Model: SmolLM2-135M-Instruct Q4_K_M — under 100MB.
- `n_ctx: 256`, `n_threads: 1 or 2`, `use_mlock: false`.
- SQLite WAL mode: `PRAGMA journal_mode = WAL`.
- Lazy native initialization: ML Kit and `whisper.rn` initialized only on first use.

### 10.6 App install size

- EAS Build with ABI splits: ~35–38MB APK.
- SmolLM2 model: ~100MB (optional download).
- MELC database: ~15MB.
- Total fully offline: ~230MB. Cloud-only: ~55MB.

---

## 11. MVP Scope for the Hackathon

All of the following can be demoed on a physical Android device with no special hardware:

1. **App shell** — React Native/Expo with offline detection, bottom-tab navigation (Kasabay, Chat, Kwento, Reviewer, Quizzes, Profile).
2. **Cloud AI streaming** — Gemini 3 Flash via OpenAI-compatible endpoint with SSE streaming. Provider cascade (Gemini → Groq → OpenRouter) demonstrated by simulating a rate-limit hit.
3. **Learning Profile setup** — First-run quiz or direct selector.
4. **Adaptive response demo** — Same question in Visual mode vs. Auditory mode side-by-side.
5. **Working RAG** — Pre-loaded Grade 6 Science MELCs in SQLite. Show grounded, grade-level-accurate answer with source passage cited.
6. **Kwento Mode demo** — Generate a palengke math story for Grade 5 (Taglish) and a multi-character Grade 9 Physics story (English). Show the embedded problem and hint. Show difficulty scaling on a second generation.
7. **Misconception Detection demo** — Type a message revealing a known misconception (e.g., "photosynthesis stops at night ba?"). Show Suri identifying the specific wrong belief and delivering a targeted explanation. Then type a *different* misconception about the same topic and show a *different* explanation.
8. **2–3 visual types** — Bar chart + labeled science diagram.
9. **Accessibility demo** — Toggle Reader Font and High Contrast live on stage.
10. **TTS** — "Listen" button on any Suri response reads it aloud.
11. **Offline fallback (The Airplane Mode Test)** — Answer online → switch to Airplane Mode → ask new question → Suri Local with SmolLM2. For Kwento Mode: show the shorter offline story format. For Misconception Detection: show taxonomy-based offline detection.
12. **Kasabay Mode demo** — Open the app to the virtual study desk: dark canvas, neon teal/lime accents, pixel-art Suri studying. Start a focus block, then tap the interrupt ("Stuck ka ba?") to ask a question — Suri "looks up" and answers via RAG, then offers to resume the timer. Toggle Low Motion to show the static-image fallback.

**Not required for hackathon:**
- whisper.rn offline STT
- Camera OCR
- Spaced repetition, parent dashboard, mesh sync
- Full misconception taxonomy (demo uses 5–10 pre-loaded misconceptions in SQLite)

---

## 12. One-Line Pitch

*"Suri is the only study companion that diagnoses the exact thing you misunderstood — then tells you a Filipino story that fixes it — working entirely offline on any Filipino student's phone, thinking in Tagalog, and costing nothing to install."*

---

*Sources: Borgen Project (2025); DICT NICTHS (2019); Nueva Ecija rural digital-literacy study (2025); EDCOM 2 / IDinsight Policy Brief (November 2025); Inquirer Opinion (May 2025); IJRISS (2025); Republic Act 11650 (2022); PISA 2022 Philippines results; Multiple Philippine education research studies on contextualised learning (2024–2025); MISTAKE paper — Learning to Make MISTAKEs: Modeling Incorrect Student Thinking And Key Errors (ACL 2025); Eedi AI tutoring RCT (2025); llama.rn documentation; DepEd MELC guidance materials.*
