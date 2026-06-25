# Phase 5: Chat & Suri Mascot

> **Objective**: Build the streaming chat experience the student actually uses, the Suri fox mascot animation state machine (reanimated, low-motion aware), and the subtle Cloud/Local tier + mode indicators.
> **Duration**: ~3–4 hours of agent execution
> **Dependencies**: Phase 0–4

---

## Phase Goals

1. ✅ Chat store wrapping the Phase 4 `ask()` router with streaming + persistence
2. ✅ Chat UI rendering live tokens, history, and (placeholder slot for) visuals
3. ✅ Suri mascot with Idle / Thinking / Celebrating / Listening states; static under Low Motion
4. ✅ "Suri Cloud" / "Suri Local" indicator + active learning-mode indicator

## Prompt Files in This Phase

| # | Prompt | Purpose |
|---|--------|---------|
| 5.1 | [01_chat_state_store.md](01_chat_state_store.md) | Message store, streaming consumption, history load |
| 5.2 | [02_chat_ui_streaming.md](02_chat_ui_streaming.md) | Chat screen, bubbles, live token render, input |
| 5.3 | [03_mascot_state_machine.md](03_mascot_state_machine.md) | Reanimated mascot states + low-motion fallback |
| 5.4 | [04_tier_mode_indicators.md](04_tier_mode_indicators.md) | Cloud/Local + mode badges |

## Key Decisions Made

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Chat data | `ask()` generator → store → UI | Single AI entry from Phase 4.5 |
| Animation | `react-native-reanimated` v4 | Spec 5.8 mascot states |
| Low Motion | Static illustration replaces all animation | Spec 5.6/5.8 |
| Mascot states | Idle/Thinking/Celebrating/Listening | Spec 5.8 |
| Tier UI | Subtle Cloud/Local indicator; moon icon offline | Spec 5.2/7 — no disruptive labels |
| Visual slot | Message can carry a `visualSpec` rendered in Phase 7 | Spec 5.4 inline in chat |

## Skills to Load

- `react-ui-patterns` — loading/streaming/empty/error states in chat
- `mobile-design` — touch targets, keyboard handling, list performance
- `frontend-design` — polished, distinctive chat UI
- `react-patterns` — performant lists, avoiding re-render storms during streaming

## Exit Criteria

Before moving to Phase 6, verify:

- [ ] Sending a message streams Suri's reply token-by-token into a bubble
- [ ] History persists and reloads from SQLite
- [ ] Mascot animates Thinking during inference and Idle otherwise
- [ ] Low Motion replaces mascot animation with a static image
- [ ] Cloud/Local indicator reflects the tier the answer came from
- [ ] `npm run typecheck` and `npm run lint` pass

---

**Next Phase**: [Phase 6: Learning Profiles](../phase_06_learning_profiles/00_PHASE_OVERVIEW.md)
