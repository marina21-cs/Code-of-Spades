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

export interface FundamentalSeed {
  category: string;
  promptKey: string;
  answer: string;
}

/**
 * Current schema version. Bump this whenever CREATE_TABLES_SQL changes in a way
 * that needs a migration step in database.ts (runMigrations). The base table DDL
 * below is idempotent (IF NOT EXISTS), so additive table changes only need a
 * version bump; destructive/altering changes get an explicit, version-gated step.
 *
 * v2: added core_fundamentals, resources, player_state, difficulty_state, and
 *     competency_events on top of the original 7-table foundation (v1).
 * v3: added kwento_cache + kwento_attempts for Kwento Mode (spec 5.8) — generated
 *     stories cached for offline reuse, and per-story answer attempts.
 * v4: added misconception_taxonomy + misconception_records for Misconception
 *     Detection (spec 5.9) — pre-loaded known wrong beliefs (RAG augmentation +
 *     offline lookup) and per-student detected misconceptions tracked over time.
 */
export const SCHEMA_VERSION = 4;

/**
 * All 16 core tables in a single multi-statement string for a one-shot
 * `execAsync` call. Every object uses `IF NOT EXISTS`, so running this against
 * an already-initialized database is a no-op (idempotent).
 *
 * Tables:
 *  - melc_chunks        pre-embedded DepEd MELC corpus (RAG grounding layer)
 *  - personal_chunks    student notes + OCR worksheet text, embedded at runtime
 *  - response_cache     cached cloud answers served offline for repeat queries
 *  - chat_messages      conversation history per session
 *  - streaks            single-row gamification streak tracker (id = 1)
 *  - badges             achievement badges (earned_at NULL until unlocked)
 *  - quiz_attempts      answered-question log (feeds spaced repetition + telemetry)
 *  - core_fundamentals  text-only non-Science fallback facts (no embeddings)
 *  - resources          Stardew-style economy, one row per resource type
 *  - player_state       single-row world/level/xp progression (id = 1)
 *  - difficulty_state   per-competency adaptive difficulty + reward drop-rate
 *  - competency_events  anonymized B2B telemetry queue (synced_at NULL until pushed)
 *  - kwento_cache       generated Kwento Mode stories cached for offline reuse
 *  - kwento_attempts    per-story answer attempts (hint use, correctness, misconception)
 *  - misconception_taxonomy  pre-loaded known wrong beliefs (spec 5.9 RAG + offline)
 *  - misconception_records   per-student detected misconceptions, tracked over time
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

CREATE TABLE IF NOT EXISTS core_fundamentals (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  category   TEXT NOT NULL,
  prompt_key TEXT NOT NULL UNIQUE,
  answer     TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_fundamentals_category ON core_fundamentals (category);

CREATE TABLE IF NOT EXISTS resources (
  resource_type TEXT    PRIMARY KEY,
  quantity      INTEGER NOT NULL DEFAULT 0 CHECK (quantity >= 0),
  updated_at    TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS player_state (
  id          INTEGER PRIMARY KEY CHECK (id = 1),
  level       INTEGER NOT NULL DEFAULT 1,
  xp          INTEGER NOT NULL DEFAULT 0,
  world_stage INTEGER NOT NULL DEFAULT 0,
  updated_at  TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS difficulty_state (
  competency_code TEXT    PRIMARY KEY,
  mastery         REAL    NOT NULL DEFAULT 0,
  difficulty      INTEGER NOT NULL DEFAULT 2 CHECK (difficulty BETWEEN 1 AND 5),
  drop_rate       REAL    NOT NULL DEFAULT 0.5,
  updated_at      TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS competency_events (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  event_type      TEXT    NOT NULL CHECK (event_type IN ('reviewed', 'mastered', 'missed')),
  competency_code TEXT,
  subject         TEXT,
  grade_level     INTEGER,
  is_correct      INTEGER CHECK (is_correct IN (0, 1)),
  payload         TEXT,
  created_at      TEXT    NOT NULL DEFAULT (datetime('now')),
  synced_at       TEXT
);
CREATE INDEX IF NOT EXISTS idx_events_unsynced ON competency_events (synced_at);

CREATE TABLE IF NOT EXISTS kwento_cache (
  id              TEXT    PRIMARY KEY,
  grade_level     INTEGER NOT NULL,
  melc_topic      TEXT    NOT NULL,
  setting         TEXT    NOT NULL,
  difficulty      TEXT    NOT NULL,
  language_used   TEXT    NOT NULL,
  kwento          TEXT    NOT NULL,
  tanong          TEXT    NOT NULL,
  hint            TEXT    NOT NULL,
  suliranin_sagot TEXT    NOT NULL,
  follow_up       TEXT,
  character_names TEXT,
  tier_id         INTEGER NOT NULL CHECK (tier_id IN (1, 2, 3)),
  generated_at    TEXT    NOT NULL DEFAULT (datetime('now')),
  created_at      TEXT    NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_kwento_grade_topic ON kwento_cache (grade_level, melc_topic);

CREATE TABLE IF NOT EXISTS kwento_attempts (
  id                     INTEGER PRIMARY KEY AUTOINCREMENT,
  kwento_id              TEXT    NOT NULL REFERENCES kwento_cache(id),
  student_answer         TEXT    NOT NULL,
  is_correct             INTEGER NOT NULL DEFAULT 0 CHECK (is_correct IN (0, 1)),
  hint_used              INTEGER NOT NULL DEFAULT 0 CHECK (hint_used IN (0, 1)),
  attempt_count          INTEGER NOT NULL DEFAULT 1,
  misconception_detected INTEGER CHECK (misconception_detected IN (0, 1)),
  completed_at           TEXT    NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_kwento_attempts_kwento ON kwento_attempts (kwento_id);

CREATE TABLE IF NOT EXISTS misconception_taxonomy (
  id                    TEXT    PRIMARY KEY,
  subject               TEXT,
  topic                 TEXT    NOT NULL,
  melc_competency       TEXT,
  wrong_belief          TEXT    NOT NULL,
  misconception_type    TEXT    NOT NULL CHECK (misconception_type IN (
    'WRONG_CAUSATION','WRONG_DEFINITION','CONCEPT_CONFUSION','OVERGENERALIZATION',
    'DIRECTIONALITY_ERROR','PARTIAL_UNDERSTANDING','LANGUAGE_CONFUSION')),
  grade_band            TEXT,
  correct_understanding TEXT,
  targeted_explanation  TEXT    NOT NULL,
  keywords              TEXT,
  created_at            TEXT    NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_misconception_tax_topic ON misconception_taxonomy (topic);

CREATE TABLE IF NOT EXISTS misconception_records (
  id                    INTEGER PRIMARY KEY AUTOINCREMENT,
  topic                 TEXT    NOT NULL,
  melc_competency       TEXT    NOT NULL,
  misconception_type    TEXT    CHECK (misconception_type IS NULL OR misconception_type IN (
    'WRONG_CAUSATION','WRONG_DEFINITION','CONCEPT_CONFUSION','OVERGENERALIZATION',
    'DIRECTIONALITY_ERROR','PARTIAL_UNDERSTANDING','LANGUAGE_CONFUSION')),
  specific_wrong_belief TEXT    NOT NULL,
  detected_at           TEXT    NOT NULL DEFAULT (datetime('now')),
  resolved_at           TEXT,
  grade_level           INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_misconception_rec_topic      ON misconception_records (topic);
CREATE INDEX IF NOT EXISTS idx_misconception_rec_unresolved ON misconception_records (resolved_at);
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

/**
 * Resource types for the Stardew-style economy (spec 5.9). One row per type is
 * seeded at quantity 0 so the inventory is complete from first run.
 */
export const RESOURCE_TYPES = ['seed', 'wood', 'stone', 'coin', 'tool'] as const;
export type ResourceType = (typeof RESOURCE_TYPES)[number];

/**
 * Five baseline "Core Fundamentals" facts (spec 5.3): high-frequency, text-only
 * answers used as a fast fallback when MELC retrieval misses. prompt_key is the
 * normalized lookup key and is UNIQUE, so INSERT OR IGNORE seeding is idempotent.
 */
export const CORE_FUNDAMENTALS_SEEDS: FundamentalSeed[] = [
  {
    category: 'math',
    promptKey: 'order of operations',
    answer:
      'Order of operations (PEMDAS): Parentheses first, then Exponents, then Multiplication and Division from left to right, then Addition and Subtraction from left to right.',
  },
  {
    category: 'math',
    promptKey: 'multiply by zero',
    answer: 'Any number multiplied by zero equals zero. For example, 7 x 0 = 0.',
  },
  {
    category: 'grammar',
    promptKey: 'what is a noun',
    answer:
      'A noun is a word that names a person, place, thing, or idea (for example: teacher, Manila, book, freedom).',
  },
  {
    category: 'grammar',
    promptKey: 'what is a verb',
    answer:
      'A verb is a word that shows an action or a state of being (for example: run, write, is, become).',
  },
  {
    category: 'definition',
    promptKey: 'states of water',
    answer:
      'Water exists in three states: solid (ice), liquid (water), and gas (water vapor or steam).',
  },
];
