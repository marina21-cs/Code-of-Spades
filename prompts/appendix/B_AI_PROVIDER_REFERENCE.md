# Appendix B — AI Provider Reference

Canonical configuration for the Phase 4 hybrid engine. All cloud providers use the **OpenAI-compatible** chat-completions message format, so the cascade is one client parameterized by base URL, model, and API key (spec 5.2). Values reflect the spec as of June 2026 — verify against current provider docs before relying on quotas.

> **Security:** API keys live in `expo-secure-store`, entered at runtime, rotatable without an app update (spec Section 10). Never hardcode keys, never log them, never commit them.

## Cloud Provider Cascade (spec 5.2)

| Order | Provider | Base URL | Model | Free quota (per spec) | Role |
|---|---|---|---|---|---|
| 1 | Gemini 3 Flash | `https://generativelanguage.googleapis.com/v1beta/openai/` | `gemini-3-flash` | 10 RPM · 1,500 RPD · 1M TPM | Primary — best Filipino/Tagalog |
| 2 | Groq | `https://api.groq.com/openai/v1` | `llama-3.1-8b-instant` | 30 RPM · ~14,400 RPD | Fallback 1 — LPU <200ms TTFT |
| 3 | OpenRouter | `https://openrouter.ai/api/v1` | `deepseek/deepseek-v3-0324:free` | 20 RPM · ~200 RPD | Fallback 2 — multilingual |

**Combined free capacity:** ~16,000 RPD (≈80× the original single-provider design).

### Request shape (all three)
- `POST {baseUrl}chat/completions`
- Headers: `Authorization: Bearer <key>`, `Content-Type: application/json`. (OpenRouter additionally accepts `HTTP-Referer` / `X-Title` — optional.)
- Body: `{ model, messages, stream: true, max_tokens, temperature }`.
- Stream: Server-Sent Events; tokens in `choices[0].delta.content`; terminate on `data: [DONE]`.

### Tier payloads (spec 5.2)
- **Tier 1 (strong):** top-3 MELC passages + question + profile modifier; full output.
- **Tier 2 (weak):** top-1 MELC passage; `max_tokens` ~150.
- **Tier 3 (offline):** cache → SmolLM2 (below).

### Failover rules
- Skip providers with no configured key.
- On 429 / quota / network error **before** first token → record cooldown (use `Retry-After`/reset headers when present) and advance to the next provider.
- Failover is invisible to the student; only an all-providers-failed condition surfaces (then cache/SLM).
- Provider identity is never shown to students (dev-only reveal allowed).

## On-Device SLM (Tier 3, spec 5.2 / Section 10)

| Item | Value |
|---|---|
| Library | `llama.rn` v0.12.5 |
| Model | SmolLM2-135M-Instruct, Q4_K_M GGUF (~100MB) |
| Source | Hugging Face SmolLM2-135M-Instruct-GGUF (record exact URL + SHA-256 in `src/constants`) |
| Download | `expo-file-system` `createDownloadResumable` (resumable, checksum-verified, opt-in, deferred if <200MB free) |
| Context | `n_ctx: 256` |
| Threads | `n_threads = min(4, cores − 1)`, clamp 1–2 on old/low-core chips |
| Memory | `use_mlock: false` |
| Accel | CPU default; Vulkan auto-detected where capable (disable flag available) |
| Output | cap `max_tokens` 200; framed as a structured summary |
| Warm-up | initialize context in background 30s after app load (not on first query) |

## STT — Groq Whisper (spec 5.7)

| Item | Value |
|---|---|
| Endpoint | Groq audio transcription (OpenAI-compatible audio API) |
| Model | `whisper-large-v3-turbo` |
| Free quota | ~2,000 transcriptions/day · 7,200 audio-sec/hour |
| Language | Filipino + English |
| Fallback | `expo-speech-recognition` (native OS) when rate-limited; text input always available |
| Offline STT | `whisper.rn` v0.6.0 + ggml-tiny multilingual (~75MB) — **roadmap, not MVP** |

## TTS (spec 5.7)
- `expo-speech` using the OS engine. Offline on iOS; Android depends on the installed TTS engine (Google TTS on most devices). Auditory mode auto-plays; a Listen button appears on every response.

## Embeddings (RAG, Phase 3)
- Base MELC embeddings **pre-computed at build time** and bundled (no runtime model for base content).
- Runtime query/personal-content embeddings use the **same** compact model (e.g., MiniLM-class via `@xenova/transformers`) and the same dimension — set `EMBEDDING_MODEL` / `EMBEDDING_DIM` in `src/constants`.
- Vectors L2-normalized; similarity = cosine (dot product). top-k = 3 online, 5 offline.

## Deprecated — do NOT use (spec Section 10)
- `openai/gpt-oss-120b:free` (poor Filipino coverage; demoted).
- Gemini 2.0 Flash (shut down March 3, 2026) and 2.0 Flash-Lite (shut down June 1, 2026).
