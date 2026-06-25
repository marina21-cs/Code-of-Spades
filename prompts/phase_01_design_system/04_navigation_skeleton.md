# 1.4 Navigation Skeleton (Bottom Tabs)

## Context

<context>
The MVP demo (spec Section 11, item 1) requires bottom-tab navigation across Chat, Reviewer, Quizzes, and Profile. This step builds the Expo Router tab layout and placeholder screens, fully themed via the Phase 1 design system, so later phases drop their real screens into a working navigation shell. Each tab respects the accessibility theme (contrast, font, scale) from the start.
</context>

## Prerequisites

<prerequisites>
- Steps 1.1–1.3 complete (theme + accessibility store)
- `expo-router` installed (Phase 0)
</prerequisites>

## AI Implementation Prompt

<instructions>
Create a themed bottom-tab navigator with four placeholder screens.

Think step by step:

1. **Tabs layout** (`app/(tabs)/_layout.tsx`)
   - Use Expo Router's `Tabs`. Define four tabs: Chat, Reviewer, Quizzes, Profile.
   - Style the tab bar from `useTheme()` (background = surface, active tint = accent, inactive = textSecondary, border from theme). Respect High Contrast.
   - Use clear icons (e.g., `@expo/vector-icons`) with accessible labels. Ensure labels scale with Large Text where feasible.

2. **Placeholder screens**
   - `app/(tabs)/index.tsx` → Chat (placeholder; real chat in Phase 5)
   - `app/(tabs)/reviewer.tsx` → Reviewer (placeholder; RAG-backed in Phase 3+)
   - `app/(tabs)/quizzes.tsx` → Quizzes (placeholder)
   - `app/(tabs)/profile.tsx` → Profile (placeholder; settings in Phase 6)
   - Each renders a themed header, a one-line description of the tab, and uses `ThemedView`/`ThemedText`.

3. **Root routing**
   - Update `app/_layout.tsx` so the default route lands on the tabs group. Keep providers (GestureHandler, SafeArea, ThemeProvider) wrapping the `Stack`/`Slot`.
   - Add a placeholder route for the first-run flow (`app/onboarding.tsx`, empty for now) that Phase 6 will implement; default to tabs when no onboarding gate exists yet.

4. **Accessibility pass**
   - Add `accessibilityRole`/`accessibilityLabel` to tab items.
   - Confirm tab bar contrast meets the High Contrast theme.
</instructions>

<requirements>
### Functional Requirements
- Four tabs navigate to four distinct themed screens.
- Tab bar restyles under High Contrast and respects accent color (incl. color-vision palette).

### Technical Requirements
- Expo Router file-based tabs under `app/(tabs)/`.
- All colors via `useTheme()`; no hardcoded hex.
- Tab items have accessibility roles/labels.

### File Naming Conventions
- Route files lowercase per Expo Router; components PascalCase.
</requirements>

<output_files>
1. `suri/app/(tabs)/_layout.tsx` — themed Tabs navigator
2. `suri/app/(tabs)/index.tsx` — Chat placeholder
3. `suri/app/(tabs)/reviewer.tsx` — Reviewer placeholder
4. `suri/app/(tabs)/quizzes.tsx` — Quizzes placeholder
5. `suri/app/(tabs)/profile.tsx` — Profile placeholder
6. `suri/app/onboarding.tsx` — empty first-run placeholder
7. `suri/app/_layout.tsx` — MODIFIED: route to tabs group
</output_files>

## Directory Structure

```
app/
├── _layout.tsx          ← MODIFIED
├── onboarding.tsx       ← NEW (placeholder)
└── (tabs)/
    ├── _layout.tsx      ← NEW
    ├── index.tsx        ← NEW (Chat)
    ├── reviewer.tsx     ← NEW
    ├── quizzes.tsx      ← NEW
    └── profile.tsx      ← NEW
```

## Verification

<verification>
- [ ] App opens to the tab bar with Chat, Reviewer, Quizzes, Profile
- [ ] Tapping each tab shows its themed placeholder screen
- [ ] High Contrast retheme applies to the tab bar live
- [ ] Color Vision change updates the active-tab accent
- [ ] `npm run typecheck` and `npm run lint` pass
</verification>

## Troubleshooting

| Symptom | Likely Cause | Fix |
|---|---|---|
| Blank screen / route not found | Group folder misnamed | Use exactly `app/(tabs)/` with parentheses |
| Tab bar unstyled | Reading theme outside provider | Ensure ThemeProvider wraps the router in `_layout.tsx` |
| Icons missing | Vector icons not installed | `npx expo install @expo/vector-icons` |

---

**Previous**: [1.3 Accessibility Settings](./03_accessibility_settings.md) | **Next**: [Phase 1 Checklist](./99_PHASE_CHECKLIST.md)
