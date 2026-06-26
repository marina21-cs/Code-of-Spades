/**
 * Local RAG store: seeding, cosine retrieval, and personal-content persistence.
 *
 * Backs spec 5.3 (Local RAG Store) and 5.5 (camera OCR text). Retrieval scans
 * the bundled MELC corpus plus the student's own notes/worksheets, scores each
 * candidate by cosine similarity to the query, and returns a tier-appropriate
 * number of passages. All vector math is local (see embedding.ts) so this works
 * with zero connectivity.
 */
import { getDB } from './database';
import {
  bytesToFloat,
  embedText,
  floatToBytes,
  rankByCosine,
} from './embedding';
import { MELC_SEEDS, melcEmbeddingText } from './seeds/melcData';

/** Signal tier (spec 5.2). Drives how many passages we feed the model. */
export type Tier = 1 | 2 | 3;

/** Tier -> top-k mapping. Tier 1: 3, Tier 2: 1 (reduced payload), Tier 3: 5. */
const TOP_K_BY_TIER: Record<Tier, number> = { 1: 3, 2: 1, 3: 5 };

/** Resolve the retrieval depth for a signal tier. */
export function topKForTier(tier: Tier): number {
  return TOP_K_BY_TIER[tier];
}

export type ChunkSource = 'melc' | 'personal';

export interface RetrievedChunk {
  id: number;
  source: ChunkSource;
  content: string;
  score: number;
  competencyCode: string | null;
  subject: string | null;
  gradeLevel: number | null;
}

export interface RetrievalResult {
  /** Passage texts, highest similarity first. The primary RAG payload. */
  texts: string[];
  /** Full chunk metadata parallel to `texts`. */
  chunks: RetrievedChunk[];
}

interface MelcRow {
  id: number;
  competency_code: string | null;
  subject: string | null;
  grade_level: number | null;
  content: string;
  embedding: Uint8Array | null;
}

interface PersonalRow {
  id: number;
  subject: string | null;
  grade_level: number | null;
  content: string;
  embedding: Uint8Array | null;
}

/** Collapse runs of whitespace and trim — basic text-cleaning heuristic. */
function normalizeWhitespace(text: string): string {
  return text.replace(/\s+/g, ' ').trim();
}

/**
 * Seed the bundled MELC corpus. Idempotent: if melc_chunks already holds rows,
 * this is a no-op (structural table check on row count). Returns the row count
 * present after seeding.
 */
export async function seedMELCs(): Promise<number> {
  const db = getDB();

  const existing = await db.getFirstAsync<{ n: number }>(
    'SELECT COUNT(*) AS n FROM melc_chunks',
  );
  if ((existing?.n ?? 0) > 0) {
    return existing?.n ?? 0;
  }

  const statement = await db.prepareAsync(
    `INSERT INTO melc_chunks (competency_code, subject, grade_level, content, embedding)
     VALUES ($code, $subject, $grade, $content, $embedding)`,
  );
  try {
    for (const seed of MELC_SEEDS) {
      const embedding = floatToBytes(embedText(melcEmbeddingText(seed)));
      await statement.executeAsync({
        $code: seed.competencyCode,
        $subject: seed.subject,
        $grade: seed.gradeLevel,
        $content: seed.content,
        $embedding: embedding,
      });
    }
  } finally {
    await statement.finalizeAsync();
  }

  return MELC_SEEDS.length;
}

/** Force a clean re-seed (used by tooling/migrations). Destructive. */
export async function reseedMELCs(): Promise<number> {
  const db = getDB();
  await db.runAsync('DELETE FROM melc_chunks');
  return seedMELCs();
}

/**
 * Retrieve the top-k most relevant passages for a query.
 *
 * Scans the MELC corpus for the requested grade plus all personal chunks, scores
 * each by cosine similarity, and returns the best `k`. `k` is typically supplied
 * via topKForTier(tier) (Tier 1: 3, Tier 2: 1, Tier 3: 5).
 */
export async function retrieveTopK(
  query: string,
  gradeLevel: number,
  k: number,
): Promise<RetrievalResult> {
  const db = getDB();
  const queryVector = embedText(query);

  const melcRows = await db.getAllAsync<MelcRow>(
    `SELECT id, competency_code, subject, grade_level, content, embedding
     FROM melc_chunks
     WHERE grade_level = ?`,
    [gradeLevel],
  );

  // A student's own notes are relevant regardless of the grade tag.
  const personalRows = await db.getAllAsync<PersonalRow>(
    `SELECT id, subject, grade_level, content, embedding
     FROM personal_chunks`,
  );

  const candidates: RetrievedChunk[] = [];

  for (const row of melcRows) {
    if (!row.embedding) continue;
    candidates.push({
      id: row.id,
      source: 'melc',
      content: row.content,
      score: 0,
      competencyCode: row.competency_code,
      subject: row.subject,
      gradeLevel: row.grade_level,
    });
  }
  for (const row of personalRows) {
    if (!row.embedding) continue;
    candidates.push({
      id: row.id,
      source: 'personal',
      content: row.content,
      score: 0,
      competencyCode: null,
      subject: row.subject,
      gradeLevel: row.grade_level,
    });
  }

  // Pair each candidate with its decoded vector for ranking.
  const withVectors = candidates.map((chunk, index) => {
    const row = index < melcRows.length ? melcRows[index] : personalRows[index - melcRows.length];
    return { chunk, embedding: bytesToFloat(row.embedding as Uint8Array) };
  });

  const ranked = rankByCosine(queryVector, withVectors, k);
  const chunks = ranked.map(({ chunk, score }) => ({ ...chunk, score }));

  return {
    texts: chunks.map((chunk) => chunk.content),
    chunks,
  };
}

export interface AddPersonalChunkInput {
  content: string;
  title?: string | null;
  subject?: string | null;
  gradeLevel?: number | null;
  sourceType?: 'note' | 'ocr';
}

/**
 * Persist a single personal chunk (note or OCR text) with its embedding.
 * Returns the new row id.
 */
export async function addPersonalChunk(input: AddPersonalChunkInput): Promise<number> {
  const db = getDB();
  const content = normalizeWhitespace(input.content);
  if (!content) {
    throw new Error('Cannot store an empty personal chunk.');
  }

  const embeddingSource = [input.title, content].filter(Boolean).join(' ');
  const embedding = floatToBytes(embedText(embeddingSource));

  const result = await db.runAsync(
    `INSERT INTO personal_chunks (source_type, title, content, embedding, subject, grade_level)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      input.sourceType ?? 'note',
      input.title ?? null,
      content,
      embedding,
      input.subject ?? null,
      input.gradeLevel ?? null,
    ],
  );
  return result.lastInsertRowId;
}

/** Convenience wrapper for typed notes. */
export async function addPersonalNote(
  content: string,
  meta: Omit<AddPersonalChunkInput, 'content' | 'sourceType'> = {},
): Promise<number> {
  return addPersonalChunk({ ...meta, content, sourceType: 'note' });
}

/**
 * Store text captured from a worksheet photo. Accepts either a single string or
 * the array of text blocks an OCR engine (ML Kit) typically returns, which are
 * joined into one chunk. Stored with source_type 'ocr'.
 */
export async function addCameraCapture(
  capture: string | string[],
  meta: Omit<AddPersonalChunkInput, 'content' | 'sourceType'> = {},
): Promise<number> {
  const joined = Array.isArray(capture)
    ? capture.map(normalizeWhitespace).filter(Boolean).join('\n')
    : capture;
  return addPersonalChunk({
    title: 'Worksheet capture',
    ...meta,
    content: joined,
    sourceType: 'ocr',
  });
}

export interface ReviewerItem {
  id: number;
  source: ChunkSource;
  title: string;
  subject: string | null;
  gradeLevel: number | null;
  preview: string;
  /** Full reviewer text (for the detail view). */
  content: string;
  competencyCode: string | null;
}

/**
 * List reviewer items (bundled MELC + the student's personal content) for the
 * "Personalized Reviewer". Optionally filter MELC items to a grade level.
 */
export async function getReviewerItems(gradeLevel?: number): Promise<ReviewerItem[]> {
  const db = getDB();

  const melcRows = await db.getAllAsync<MelcRow>(
    `SELECT id, competency_code, subject, grade_level, content, embedding
     FROM melc_chunks
     ${gradeLevel != null ? 'WHERE grade_level = ?' : ''}
     ORDER BY subject, competency_code`,
    gradeLevel != null ? [gradeLevel] : [],
  );

  const personalRows = await db.getAllAsync<PersonalRow & { title: string | null; source_type: string }>(
    `SELECT id, source_type, title, subject, grade_level, content, embedding
     FROM personal_chunks
     ORDER BY created_at DESC`,
  );

  const preview = (text: string): string =>
    text.length > 120 ? `${text.slice(0, 117)}...` : text;

  const melcItems: ReviewerItem[] = melcRows.map((row) => ({
    id: row.id,
    source: 'melc',
    title: row.competency_code ?? 'MELC competency',
    subject: row.subject,
    gradeLevel: row.grade_level,
    preview: preview(row.content),
    content: row.content,
    competencyCode: row.competency_code,
  }));

  const personalItems: ReviewerItem[] = personalRows.map((row) => ({
    id: row.id,
    source: 'personal',
    title: row.title ?? 'My note',
    subject: row.subject,
    gradeLevel: row.grade_level,
    preview: preview(row.content),
    content: row.content,
    competencyCode: null,
  }));

  return [...melcItems, ...personalItems];
}
