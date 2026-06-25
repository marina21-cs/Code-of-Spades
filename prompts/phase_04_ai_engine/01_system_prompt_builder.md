# 4.1 System Prompt Builder (Profile + RAG)

## Context

<context>
The Learning Profile is a system-prompt modifier applied identically across all three signal tiers — same intelligence, different format (spec 5.6). This step implements `buildSystemPrompt(profile, ragChunks)` (the exact signature named in spec 5.6) so visual learners get diagrams by default, auditory learners get flowing prose for TTS, reading/writing learners get structured bullets, etc. — all grounded in the retrieved MELC passages and instructed to handle Filipino/English code-switching. This single function is consumed by both the cloud client (4.2) and the SLM (4.4).
</context>

## Prerequisites

<prerequisites>
- Phase 2 (`LearningProfile` type, profile store)
- Phase 3 (retriever returns `RetrievedChunk[]`)
</prerequisites>

## AI Implementation Prompt

<instructions>
Implement the prompt builder and its modifier table.

Think step by step:

1. **Base system prompt** (`src/features/ai/prompt/base-prompt.ts`)
   - Define Suri's persona (spec Section 7): quick-witted, encouraging, never condescending; Socratic by default (leading question first, answer second — spec 5.8) to preempt "does my homework" concerns.
   - Language instruction: respond in the student's preferred language; handle Filipino/Tagalog ↔ English code-switching naturally (spec Section 10 "GPT-OSS resolved" + 5.2). Default to the student's apparent language.
   - Grounding instruction: answer using ONLY the provided MELC context where relevant; stay grade-level appropriate; if context is insufficient, say so simply rather than inventing facts.

2. **Response-mode modifiers** (`src/features/ai/prompt/mode-modifiers.ts`)
   - A map from `responseMode` → instruction snippet, matching spec 5.6 table exactly:
     - `visual` → default to a diagram spec for the concept; reference the visual; short paragraphs.
     - `auditory` → write to be read aloud; flowing sentences; no bullet points.
     - `reading` → structured: bullet points, numbered steps, definitions first.
     - `kinesthetic` → shorter; invite a tap/drag interaction before explaining.
     - `mixed` → balance modalities by topic complexity.

3. **Accessibility-derived modifiers**
   - `focusMode` → cap response to ~120 words, one idea per message (spec 5.6).
   - When `visual` mode or a diagram is appropriate, instruct the model to also emit a fenced ```json visual spec block (schema defined in Phase 7) — but only the spec, not prose duplicating it. Make this opt-in via a flag the router sets so non-visual contexts stay clean.
   - Pass the `colorVision` mode as context so the model knows diagrams will be recolored (rendering enforces palette in Phase 7; the model just produces structure).

4. **Builder** (`src/features/ai/prompt/build-system-prompt.ts`)
   - `buildSystemPrompt(profile: LearningProfile, ragChunks: RetrievedChunk[], opts?: { allowVisual?: boolean; maxTokensHint?: number }): string`.
   - Compose: base + grade level + language + mode modifier + focusMode cap + grounding block (the ragChunks rendered with their competency codes) + visual instruction if allowed.
   - Keep it compact for the weak/offline tiers (the router passes fewer chunks and a token hint).

5. **Message assembly helper** (`src/features/ai/prompt/messages.ts`)
   - `buildMessages(systemPrompt, history, userQuestion)` → OpenAI-style `messages` array (system, prior turns, user). This is shared by the cloud client; the SLM uses the same content flattened to its chat template.
</instructions>

<requirements>
### Functional Requirements
- One builder produces the system prompt for ALL tiers.
- Each response mode visibly changes output format.
- Focus Mode caps length; visual mode requests a JSON spec.
- Code-switching and grade-level instructions always present.

### Technical Requirements
- Pure functions, no side effects, fully unit-testable.
- Grounding block includes competency codes for traceability.
- Token-conscious for weak/offline tiers.

### File Naming Conventions
- Files under `src/features/ai/prompt/`, kebab-case.
</requirements>

<output_files>
1. `suri/src/features/ai/prompt/base-prompt.ts`
2. `suri/src/features/ai/prompt/mode-modifiers.ts`
3. `suri/src/features/ai/prompt/build-system-prompt.ts`
4. `suri/src/features/ai/prompt/messages.ts`
5. `suri/src/features/ai/index.ts` — MODIFIED barrel
</output_files>

## Directory Structure

```
src/features/ai/prompt/
├── base-prompt.ts            ← NEW
├── mode-modifiers.ts         ← NEW
├── build-system-prompt.ts    ← NEW
└── messages.ts               ← NEW
```

## Verification

<verification>
- [ ] `buildSystemPrompt` with `visual` mode includes a diagram/visual-spec instruction
- [ ] `auditory` mode forbids bullet points and requests flowing prose
- [ ] `focusMode: true` adds a ~120-word cap instruction
- [ ] RAG chunks appear in the grounding block with competency codes
- [ ] Language/code-switching instruction present in all modes
- [ ] `npm run typecheck` passes
</verification>

## Troubleshooting

| Symptom | Likely Cause | Fix |
|---|---|---|
| Output ignores mode | Modifier not appended | Confirm builder concatenates the mode snippet |
| Prose duplicates the diagram | Visual instruction unclear | Instruct: emit spec OR short text referencing it, not both fully |
| Prompt too long for SLM | Full chunks passed offline | Router passes top-1 short chunk + token hint for offline |

---

**Previous**: [Phase 4 Overview](./00_PHASE_OVERVIEW.md) | **Next**: [4.2 Cloud Client & Streaming](./02_cloud_client_streaming.md)
