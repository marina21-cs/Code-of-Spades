# Appendix C — Troubleshooting

Cross-cutting issues spanning multiple phases. Phase-specific issues live in each step file's troubleshooting table.

## Native modules & dev client

| Symptom | Cause | Fix |
|---|---|---|
| `llama.rn`/`whisper.rn`/ML Kit "module not found" | Running in Expo Go | Use a **custom dev client** (`npx expo run:android` or EAS dev build). Expo Go cannot host native modules. |
| Native changes not reflected | Stale native build | Rebuild the dev client after adding native deps |
| Metro can't resolve `@/...` | Alias not applied | Confirm tsconfig paths + Metro/Babel alias; restart `npx expo start -c` |

## Streaming

| Symptom | Cause | Fix |
|---|---|---|
| Full response arrives at once | `fetch` not streaming in RN | Use `expo/fetch` streaming or XHR progressive events |
| `[DONE]` shows as text | Sentinel not filtered | Skip `data: [DONE]` |
| Garbled characters | Split mid-UTF8 | Buffer bytes; decode complete SSE lines only |
| UI janks while streaming | Per-token re-render | Batch token updates (Phase 5.1) |

## Provider cascade

| Symptom | Cause | Fix |
|---|---|---|
| Cascade never advances | Per-provider error not caught | Wrap each attempt; classify; continue |
| Student sees error then answer | Surfacing failover errors | Only show errors when ALL providers fail |
| 401 from Gemini | Wrong base URL | Use the OpenAI-compatible base (Appendix B) |

## On-device SLM / memory

| Symptom | Cause | Fix |
|---|---|---|
| App force-closes during inference | Android OOM killer | n_ctx 256, use_mlock false, low threads, feed 1 short chunk |
| UI frozen during generation | Too many threads | Clamp `n_threads` to 1–2 on old chips |
| Model download stalls | No resume state | Persist `createDownloadResumable` data; resume |
| Checksum mismatch | Corrupt/partial download | Re-download; verify URL + SHA-256 |

## RAG / embeddings

| Symptom | Cause | Fix |
|---|---|---|
| Irrelevant retrieval | Model mismatch build vs runtime | One `EMBEDDING_MODEL`/`EMBEDDING_DIM` for both; re-seed |
| All scores ~equal | Vectors not normalized | L2-normalize at build and runtime |
| Seeds every boot | No idempotency | Skip when corpus count > 0 |

## Database

| Symptom | Cause | Fix |
|---|---|---|
| `journal_mode` not `wal` | Pragma not applied | Run pragma right after open |
| DB locked | Multiple opens / no busy_timeout | Use the singleton; set `busy_timeout` |
| Migrations re-run | `user_version` not set | Set it inside the migration transaction |

## Accessibility / theming

| Symptom | Cause | Fix |
|---|---|---|
| Toggle doesn't retheme | Wrong store / props | Write through the profile/accessibility store; provider subscribes |
| Reader Font flashes system font | Render not gated on fonts | Gate first paint on `useFonts` |
| Animations run in Low Motion | Flag not gating | Branch to static when `lowMotion` |

## Voice

| Symptom | Cause | Fix |
|---|---|---|
| No TTS on Android | No TTS engine | Detect + hint; never crash |
| Groq STT 400 | Wrong audio format/multipart | Use a supported format + correct fields |
| Native STT fails offline | OS engine needs network | Detect offline; prompt text input |

## Build / distribution

| Symptom | Cause | Fix |
|---|---|---|
| APK too large | Universal APK | Enable ABI splits (Phase 0.4) |
| Slow cold start | Hermes off / eager init | Enable Hermes; lazy-init native modules |
| minSdk error | Dep needs > API 26 | Raise minSdk only if required; document |
