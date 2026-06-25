/**
 * Local, deterministic text embedding + cosine retrieval primitives.
 *
 * DESIGN: This is an OFFLINE vectorizer — no network, no API key, no native
 * model. Each text is turned into a fixed-length L2-normalized Float32 vector
 * using a hashed sublinear term-frequency scheme (a "hashing vectorizer").
 * Cosine similarity over these vectors gives solid lexical retrieval for
 * curriculum Q&A and is fully reproducible, which keeps the RAG layer testable
 * and honest to Suri's offline-first promise.
 *
 * The storage format (Float32 vector -> BLOB) and the ranking math (cosine) are
 * exactly what neural sentence embeddings need too. To upgrade retrieval quality
 * later, replace embedText() with a real pre-computed/bundled embedding model —
 * nothing else in ragStore.ts has to change.
 *
 * Pure module (no native imports) so it is unit-testable headlessly.
 */

/** Vector dimensionality. 512 keeps hash collisions low for short curriculum text. */
export const EMBED_DIM = 512;

/** High-frequency words that carry little retrieval signal. */
const STOPWORDS = new Set([
  'the', 'a', 'an', 'and', 'or', 'of', 'to', 'in', 'is', 'are', 'was', 'were',
  'be', 'been', 'by', 'for', 'with', 'as', 'at', 'on', 'it', 'its', 'this',
  'that', 'these', 'those', 'from', 'into', 'than', 'then', 'so', 'such', 'can',
  'will', 'would', 'their', 'they', 'them', 'you', 'your', 'we', 'our', 'has',
  'have', 'had', 'do', 'does', 'did', 'but', 'not', 'no', 'if', 'when', 'while',
  'which', 'who', 'what', 'how', 'about', 'each', 'some', 'many', 'more', 'most',
  'one', 'two', 'also', 'there', 'here', 'over', 'out', 'up', 'down', 'all',
]);

/**
 * Light singularization: drop a trailing plural "s" so "cells"/"plants"/"parts"
 * match "cell"/"plant"/"part". Intentionally simple (no full stemmer) — good
 * enough for short curriculum text and fully deterministic.
 */
function singularize(token: string): string {
  if (token.length > 3 && token.endsWith('s') && !token.endsWith('ss')) {
    return token.slice(0, -1);
  }
  return token;
}

/** Tokenize text into normalized, meaningful terms. */
export function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(Boolean)
    .map(singularize)
    .filter((token) => token.length >= 2 && !STOPWORDS.has(token));
}

/** FNV-1a 32-bit hash, folded into the embedding dimension. */
function hashToken(token: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < token.length; i += 1) {
    hash ^= token.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0) % EMBED_DIM;
}

/**
 * Embed text into an L2-normalized Float32 vector using hashed sublinear TF
 * weighting (weight = 1 + ln(count)). Normalization means cosine similarity
 * reduces to a dot product and long passages are not unfairly favored.
 */
export function embedText(text: string): Float32Array {
  const vector = new Float32Array(EMBED_DIM);
  const tokens = tokenize(text);
  if (tokens.length === 0) {
    return vector;
  }

  const counts = new Map<number, number>();
  for (const token of tokens) {
    const index = hashToken(token);
    counts.set(index, (counts.get(index) ?? 0) + 1);
  }
  for (const [index, count] of counts) {
    vector[index] = 1 + Math.log(count);
  }

  let norm = 0;
  for (let i = 0; i < EMBED_DIM; i += 1) {
    norm += vector[i] * vector[i];
  }
  norm = Math.sqrt(norm);
  if (norm > 0) {
    for (let i = 0; i < EMBED_DIM; i += 1) {
      vector[i] /= norm;
    }
  }
  return vector;
}

/** Cosine similarity in [-1, 1]. Robust to non-normalized inputs. */
export function cosineSimilarity(a: Float32Array, b: Float32Array): number {
  const len = Math.min(a.length, b.length);
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < len; i += 1) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  if (normA === 0 || normB === 0) {
    return 0;
  }
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

/** Pack a Float32 vector into bytes for storage in a SQLite BLOB column. */
export function floatToBytes(vector: Float32Array): Uint8Array {
  return new Uint8Array(vector.buffer, vector.byteOffset, vector.byteLength);
}

/**
 * Decode a BLOB (Uint8Array/Buffer from SQLite) back into a Float32 vector.
 * Copies the bytes first to guarantee 4-byte alignment regardless of how the
 * driver returns the buffer.
 */
export function bytesToFloat(bytes: Uint8Array): Float32Array {
  const copy = new Uint8Array(bytes.byteLength);
  copy.set(bytes);
  return new Float32Array(copy.buffer);
}

/**
 * Rank items by cosine similarity to a query vector and return the top k
 * (descending score). k is floored at 0; returns at most `items.length`.
 */
export function rankByCosine<T extends { embedding: Float32Array }>(
  queryVector: Float32Array,
  items: T[],
  k: number,
): Array<T & { score: number }> {
  const scored = items.map((item) => ({
    ...item,
    score: cosineSimilarity(queryVector, item.embedding),
  }));
  scored.sort((a, b) => b.score - a.score);
  const limit = Math.max(0, Math.floor(k));
  return scored.slice(0, limit);
}
