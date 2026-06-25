/**
 * Pure schema + seed definitions for Suri's local SQLite store.
 *
 * This module intentionally has NO native/runtime dependencies (no expo-sqlite
 * import). That keeps the table DDL and seed data portable so they can be
 * exercised by headless verification scripts (node:sqlite) as well as the
 * Expo app at runtime. Keeping a single source of truth avoids schema drift
 * between the app and the validation tooling.
 */

export interface BadgeSeed {
  id: string;
  name: string;
  description: string;
}

/**
 * All 7 core tables in a single multi-statement string for a one-shot
 * `execAsync` call. Every object uses `IF NOT EXISTS`, so running this against
 * an already-initialized database is a no-op (idempotent).
 *
 * Tables:
 *  - melc_chunks      pre-embedded DepEd MELC corpus (RAG grounding layer)
 *  - personal_chunks  student notes + OCR worksheet text, embedded at runtime
 *  - response_cache   cached cloud answers served offline for repeat queries
 *  - chat_messages    conversation history per session
 *  - streaks          single-row gamification streak tracker (id = 1)
 *  - badges           achievement badges (earned_at NULL until unlocked)
 *  - quiz_attempts    answered-question log (feeds future spaced repetition)
 */
export const CREATE_TABLES_SQL = `
CREATE TABLE IF NOT EXISTS melc_chunks (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  competency_code TEXT,
  subject         TEXT    NOT NULL,
  grade_level     INTEGER NOT NULL,
  content         TEXT    NOT NULL,
  embedding       BLOB,
  created_at      TEXT    NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_melc_subject_grade ON melc_chunks (subject, grade_level);
CREATE INDEX IF NOT EXISTS idx_melc_competency    ON melc_chunks (competency_code);

CREATE TABLE IF NOT EXISTS personal_chunks (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  source_type TEXT    NOT NULL DEFAULT 'note' CHECK (source_type IN ('note', 'ocr')),
  title       TEXT,
  content     TEXT    NOT NULL,
  embedding   BLOB,
  subject     TEXT,
  grade_level INTEGER,
  created_at  TEXT    NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_personal_created ON personal_chunks (created_at);

CREATE TABLE IF NOT EXISTS response_cache (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  query_hash    TEXT    NOT NULL UNIQUE,
  query_text    TEXT    NOT NULL,
  response_text TEXT    NOT NULL,
  provider      TEXT,
  hit_count     INTEGER NOT NULL DEFAULT 0,
  created_at    TEXT    NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_cache_query_hash ON response_cache (query_hash);

CREATE TABLE IF NOT EXISTS chat_messages (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id TEXT    NOT NULL,
  role       TEXT    NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content    TEXT    NOT NULL,
  tier       TEXT    CHECK (tier IN ('cloud', 'local')),
  provider   TEXT,
  created_at TEXT    NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_chat_session ON chat_messages (session_id, created_at);

CREATE TABLE IF NOT EXISTS streaks (
  id               INTEGER PRIMARY KEY,
  current_streak   INTEGER NOT NULL DEFAULT 0,
  longest_streak   INTEGER NOT NULL DEFAULT 0,
  last_study_date  TEXT,
  total_study_days INTEGER NOT NULL DEFAULT 0,
  updated_at       TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS badges (
  id          TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  description TEXT,
  earned_at   TEXT DEFAULT NULL
);

CREATE TABLE IF NOT EXISTS quiz_attempts (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  subject         TEXT,
  grade_level     INTEGER,
  competency_code TEXT,
  question        TEXT    NOT NULL,
  student_answer  TEXT,
  is_correct      INTEGER NOT NULL DEFAULT 0 CHECK (is_correct IN (0, 1)),
  created_at      TEXT    NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_quiz_competency ON quiz_attempts (competency_code);
CREATE INDEX IF NOT EXISTS idx_quiz_created    ON quiz_attempts (created_at);
`;

/**
 * The 6 core badges seeded on first run. earned_at stays NULL until the
 * student unlocks each one. IDs match the milestones described in spec 5.9.
 */
export const BADGE_SEEDS: BadgeSeed[] = [
  { id: 'first_chat', name: 'First Words', description: 'Sent your first message to Suri.' },
  { id: 'first_voice', name: 'Speak Up', description: 'Asked Suri a question with your voice.' },
  { id: 'first_camera', name: 'Snapshot Scholar', description: 'Captured your first worksheet with the camera.' },
  { id: 'streak_3', name: '3-Day Streak', description: 'Studied three days in a row.' },
  { id: 'streak_7', name: '7-Day Streak', description: 'Studied seven days in a row.' },
  { id: 'streak_30', name: '30-Day Streak', description: 'Studied thirty days in a row.' },
];
