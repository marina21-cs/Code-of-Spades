# Appendix D — Security Checklist

Security tier: **MVP** (spec is offline-first, on-device by default, no user accounts/backend in the hackathon scope). The biggest "security" property is privacy-by-architecture: inference and data are on-device by default (spec Section 9).

## Secrets & API keys

- [ ] Provider API keys stored ONLY in `expo-secure-store`; entered at runtime; rotatable without an app update (spec Section 10).
- [ ] Keys never hardcoded, never in `app.json`/env committed to git, never logged, never included in error messages or analytics.
- [ ] `.env*` git-ignored; no secrets in the repo (`git check-ignore .env`).
- [ ] Key values never read back to the UI after saving (show "configured" status only).
- [ ] Keys sent only as `Authorization` headers to their provider — never to any other endpoint.

## Network & data transmission

- [ ] All provider calls over HTTPS.
- [ ] Only the user's question + retrieved MELC context + profile modifier are sent to cloud providers — no device identifiers or PII beyond the question text.
- [ ] STT audio sent to Groq only for transcription; temp audio file deleted immediately after.
- [ ] No analytics/telemetry transmitting student content off-device in MVP (if added later, require consent).
- [ ] No background exfiltration of code, notes, or DB contents to third parties.

## Input handling & untrusted content

- [ ] All SQLite queries parameterized (`?`); no string-interpolated SQL.
- [ ] LLM JSON (visual specs) validated with `zod` before rendering; size/array caps; never `eval`'d.
- [ ] LLM output treated as untrusted: rendered as text/SVG only, never executed.
- [ ] Model file verified by SHA-256 checksum before use (Phase 4.4).
- [ ] Downloaded content size-checked; storage pre-flight before writing.

## Local data & privacy

- [ ] Student notes, chat history, streaks stored locally in SQLite — not synced anywhere in MVP.
- [ ] No login/PII collected. Learning Profile contains no medical/condition data — settings are effect-labeled choices (spec design note).
- [ ] Accessibility settings are user preferences, not health data.

## Permissions

- [ ] Mic permission requested only when the student uses voice; denial keeps the app fully usable via text.
- [ ] Notification permission optional; denial degrades gracefully.
- [ ] Camera (roadmap) requested only on first camera use.

## Build & supply chain

- [ ] Dependencies pinned via `expo install` (SDK-aligned) and reviewed; watch for typosquats.
- [ ] No unexpected native modules with broad permissions.
- [ ] APK signed via EAS-managed keystore stored securely.

## Pre-release review (before wide distribution)

- [ ] Accessibility UX reviewed with representative users (dyslexia, color vision, attention) — spec Section 10 acknowledges this needs user research.
- [ ] Confirm no debug/dev flags (e.g., `__forceRateLimit`) shipped enabled in release builds.
- [ ] Confirm `console.log` of any sensitive values removed.

## Production hardening (post-hackathon, if a backend is added)

If the Phase-2 roadmap adds the Supabase parent/teacher dashboard:
- [ ] Move to JWT access/refresh tokens + RBAC; row-level security on Supabase.
- [ ] Consent tracking, data export, and deletion (minors' data — extra care).
- [ ] Rate limiting on any sync endpoints.
- [ ] Audit logging for sensitive operations.
