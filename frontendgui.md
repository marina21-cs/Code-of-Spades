# Suri — Frontend UI Guide
> Design & tech constraints for the frontend team. Follow this so that accessibility modes, theming, and data contracts don't break during UI implementation.

---

## 1. Navigation Structure

```
Bottom Tab Navigator (4 tabs)
├── Chat          → MainChatScreen
├── Reviewer      → ReviewerScreen
├── Quizzes       → QuizzesScreen
└── Profile       → ProfileScreen (settings + learning profile)
```

First-run flow lives **outside** the tab navigator — it's a modal stack shown before the tabs are mounted. It must write to `expo-secure-store` before dismissing.

---

## 2. Color Tokens

All colors must come from the theme object returned by `useTheme()`. **Never hardcode hex values** — accessibility modes swap these at runtime.

```ts
// src/theme/tokens.ts
export const baseTokens = {
  // Brand
  suriOrange:   '#F97316',
  suriCream:    '#FEF3E2',
  suriTailGlow: '#FBBF24', // AI "thinking" accent

  // Neutral
  ink:          '#1C1917',
  inkSoft:      '#57534E',
  surface:      '#FFFFFF',
  surfaceAlt:   '#F5F5F4',
  border:       '#E7E5E3',

  // Status
  success:      '#22C55E',
  warn:         '#F59E0B',
  error:        '#EF4444',

  // Signal tier badges
  tierCloud:    '#3B82F6',  // blue
  tierLocal:    '#8B5CF6',  // purple/offline
};
```

### High Contrast overrides (when `highContrast: true`)
```ts
{ surface: '#000000', ink: '#FFFFFF', border: '#FFFFFF', suriOrange: '#FFD700' }
```

### Color Vision palette variants
Applied **only** to SVG diagrams and chart fills. UI chrome stays on brand.
```ts
const colorVisionPalettes = {
  standard:     ['#F97316','#3B82F6','#22C55E','#A855F7','#EF4444'],
  deuteranopia: ['#005AB5','#DC3220','#1AFF1A','#994F00','#E1BE6A'],
  protanopia:   ['#0050C0','#FFB347','#1AFF1A','#994F00','#000000'],
  tritanopia:   ['#FF6DB6','#009292','#920000','#490092','#006DDB'],
};
```

---

## 3. Typography

```ts
// src/theme/typography.ts
const fontFamilies = {
  default:    'System', // OS default
  dyslexic:   'OpenDyslexic', // loaded via expo-font, toggle via readerFont setting
};

const scale = {
  xs:   12, sm: 14, base: 16, lg: 18, xl: 22, '2xl': 28,
};
```

**Large Text mode** multiplies every scale value by `1.3`. Use `useScaledFont()` hook — never hardcode font sizes inline.

**Reader Font (OpenDyslexic) rules:**
- No italic text anywhere when enabled
- Letter spacing: `0.05em` minimum
- Line height: `1.6` minimum
- Applied app-wide via the root `<ThemeProvider>`

---

## 4. Suri Mascot Component

`<SuriMascot state={...} />` — a single component that handles all states internally.

```ts
type SuriState =
  | 'idle'         // slow gentle bounce
  | 'thinking'     // ears perk, tail sweeps — plays during AI inference
  | 'celebrating'  // energetic bounce + tail wag
  | 'listening'    // animated sound-wave ring around face — STT active
  | 'static';      // forced when lowMotion: true — renders a PNG fallback

type SuriTier = 'cloud' | 'local';
// 'local' = Tier 3 offline: desaturated palette + small buwan (moon) icon above head
```

Animation is handled by `react-native-reanimated v4`. All animations **must** check `lowMotion` from the profile and skip to `static` if true. Never animate directly — always go through `<SuriMascot>`.

---

## 5. Signal Tier Indicator

A small persistent badge at the top of `MainChatScreen`.

```ts
// Sourced from useAIRouter() hook
type TierBadge = {
  label: 'Suri Cloud' | 'Suri Local';
  color: string; // tierCloud or tierLocal from tokens
  icon: '☁️' | '🌙';
};
```

- Place it in the chat header, right-aligned.
- It must not block the user's input or Suri's response.
- It updates reactively as netinfo changes tier — no tap needed.

---

## 6. Chat UI Data Contract

```ts
// What the AI router emits to the chat screen
type ChatMessage = {
  id: string;
  role: 'user' | 'suri';
  text: string;             // main response text
  visualSpec?: VisualSpec;  // if present, render SVG diagram below text
  isStreaming: boolean;     // show skeleton/typing indicator while true
  tier: 'cloud' | 'local';
  ragSources?: string[];    // source MELC competencies cited (show as footnote)
  timestamp: number;
};

type VisualSpec = {
  type: 'bar_chart' | 'line_chart' | 'labeled_diagram' | 'number_line' | 'geometric';
  title: string;
  data: Record<string, unknown>; // parsed from LLM JSON, passed to SVGRenderer
  colorPalette: string[];        // resolved at render time from colorVision setting
};
```

The **"Listen" button** appears on every `suri` message. Tapping it calls `expo-speech` with the `text` field. It is never hidden — not even in non-auditory modes.

**Focus Mode:** When `focusMode: true`, cap each `suri` message render to 120 words. If the full response is longer, show a "Show more" inline expansion — don't truncate silently.

---

## 7. Learning Profile Screen

Reads from and writes to `expo-secure-store` via `useLearningProfile()` hook.

```ts
// What the Profile screen must render controls for:
interface LearningProfile {
  responseMode: 'visual' | 'auditory' | 'reading' | 'kinesthetic' | 'mixed';
  gradeLevel: number;           // 4–10
  accessibilitySettings: {
    readerFont: boolean;
    colorVision: 'standard' | 'deuteranopia' | 'protanopia' | 'tritanopia';
    highContrast: boolean;
    largeText: boolean;
    focusMode: boolean;
    lowMotion: boolean;
  };
}
```

**UX rule:** No setting is labeled as a disability. Use copy like:
- ❌ "Dyslexia mode"
- ✅ "Reader Font — easier to read typeface"

---

## 8. Reviewer & Quizzes Data Contract

```ts
// Reviewer screen pulls from SQLite via useRAG() hook
type ReviewerItem = {
  id: string;
  subject: string;       // e.g. "Science"
  gradeLevel: number;
  competency: string;    // MELC competency text
  summary: string;       // AI-generated summary stored in cache
  lastReviewed?: number; // timestamp, null if never
};

// Quizzes screen
type QuizQuestion = {
  id: string;
  prompt: string;
  type: 'multiple_choice' | 'drag_drop' | 'tap_reveal';
  choices?: string[];
  correctIndex?: number;
  relatedMELC: string;
};
```

---

## 9. Gamification UI Data Contract

```ts
// Sourced from useStreaks() hook (SQLite)
type StreakData = {
  currentStreak: number;     // days
  longestStreak: number;
  todayComplete: boolean;
  suriEvolution: 'kit' | 'young' | 'elder'; // affects mascot asset shown
  badges: Badge[];
};

type Badge = {
  id: string;
  label: string;             // e.g. "First Voice Session"
  earnedAt: number | null;   // null = locked
  icon: string;              // emoji or asset key
};
```

Suri's evolution state (`suriEvolution`) maps to different asset variants. The mascot component reads this and swaps between `suri-kit.json`, `suri-young.json`, `suri-elder.json` Lottie files.

---

## 10. Accessibility Mode Constraints

| Mode | Where applied | What frontend must do |
|---|---|---|
| `readerFont` | All `<Text>` | Switch fontFamily to `OpenDyslexic`, disable italic |
| `highContrast` | Entire app | Swap surface/ink tokens; add 2px borders to all interactive elements |
| `largeText` | All `<Text>` | Multiply all font sizes by 1.3; SVG diagram labels must scale too |
| `focusMode` | Chat only | Cap Suri messages at 120 words; increase micro-celebration frequency |
| `lowMotion` | All animations | Freeze Suri to static PNG; disable skeleton shimmers; use instant transitions |
| `colorVision` | SVG only | Pass correct palette array to `<SVGRenderer>` — never affects UI chrome |

---

## 11. Package Constraints

```
react-native-reanimated    v4+       (not v3 — worklet runtime changed)
react-native-svg           latest    (all charts and diagrams rendered here)
react-native-gesture-handler latest  (drag-drop quizzes in kinesthetic mode)
expo-font                  SDK 54    (OpenDyslexic bundled, not fetched at runtime)
expo-speech                SDK 54    (TTS — works offline on iOS)
expo-camera                SDK 54    (camera OCR — lazy init on first use)
```

**Do not** use `Animated` from React Native core — only `react-native-reanimated`.
**Do not** render charts in WebView — everything is native `react-native-svg`.
**Do not** call ML Kit or `whisper.rn` on mount — both are lazy-init only.

---

## 12. First-Run Quiz Screens

A 5-screen onboarding sequence shown once. Each screen shows the same sample concept in a different format and asks "Which felt clearest?"

```
Screen 1 → Visual format (SVG diagram)
Screen 2 → Auditory format (prose + TTS auto-play)
Screen 3 → Reading format (bullet list)
Screen 4 → Kinesthetic format (tap-to-reveal)
Screen 5 → Result + confirmation (or manual override)
```

On completion, write `LearningProfile` to `expo-secure-store` and navigate to the tab navigator. Skipping defaults to `responseMode: 'mixed'`.

---

## 13. What the Backend Provides (Do Not Re-implement in UI)

| Feature | Hook/Function | What it returns |
|---|---|---|
| AI responses | `useAIRouter()` | AsyncIterator of tokens + final `ChatMessage` |
| RAG search | `useRAG(query)` | `ReviewerItem[]` sorted by relevance |
| Learning profile | `useLearningProfile()` | `LearningProfile` + setter |
| Streak data | `useStreaks()` | `StreakData` |
| Signal tier | `useNetworkTier()` | `'cloud' \| 'local'` |
| TTS | `useTTS()` | `speak(text)` + `stop()` |
| STT | `useSTT()` | `startListening()` + transcript stream |
| Model download | `useModelDownload()` | `{progress, status, start()}` |

The frontend never touches `expo-sqlite` directly, never calls provider APIs directly, and never manages API keys. All of that lives in the backend services layer.
