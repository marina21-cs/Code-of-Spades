/**
 * OCR text cleaning + chunking (pure).
 *
 * Worksheet OCR returns noisy, multi-paragraph text. Storing it as one giant
 * personal_chunk hurts retrieval (the cosine vector blurs across many topics).
 * This module cleans the text and splits it into bounded, paragraph/sentence-
 * aligned chunks so each becomes a focused, retrievable unit in the personal RAG
 * layer. No native imports -> headlessly verifiable.
 */

/** Default upper bound on a single chunk's length (characters). */
export const DEFAULT_MAX_CHUNK_CHARS = 600;

/**
 * Clean raw OCR text: normalize line endings, strip control characters, collapse
 * intra-line whitespace, and reduce blank-line runs to a single paragraph break.
 * Paragraph breaks (double newline) are preserved because chunking uses them.
 */
export function cleanOcrText(raw: string): string {
  if (!raw) {
    return '';
  }
  const normalized = raw.normalize('NFC').replace(/\r\n?/g, '\n');
  const lines = normalized
    .split('\n')
    // Drop control chars (keep printable + accented); collapse runs of spaces/tabs.
    .map((line) =>
      line
        // eslint-disable-next-line no-control-regex
        .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
        .replace(/[ \t]+/g, ' ')
        .trim(),
    );
  return lines
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/** Split a flat (single-line) string into sentences without regex lookbehind. */
function splitSentences(text: string): string[] {
  const out: string[] = [];
  let buffer = '';
  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];
    buffer += ch;
    if (ch === '.' || ch === '!' || ch === '?') {
      // Absorb trailing whitespace so the next sentence starts clean.
      while (i + 1 < text.length && /\s/.test(text[i + 1])) {
        buffer += text[i + 1];
        i += 1;
      }
      const trimmed = buffer.trim();
      if (trimmed) {
        out.push(trimmed);
      }
      buffer = '';
    }
  }
  const tail = buffer.trim();
  if (tail) {
    out.push(tail);
  }
  return out;
}

/** Greedily pack sentences into <= maxChars chunks; hard-split any over-long one. */
function packSentences(sentences: string[], maxChars: number): string[] {
  const chunks: string[] = [];
  let buffer = '';

  const flush = (): void => {
    const trimmed = buffer.trim();
    if (trimmed) {
      chunks.push(trimmed);
    }
    buffer = '';
  };

  for (const sentence of sentences) {
    if (sentence.length > maxChars) {
      flush();
      for (let i = 0; i < sentence.length; i += maxChars) {
        const slice = sentence.slice(i, i + maxChars).trim();
        if (slice) {
          chunks.push(slice);
        }
      }
      continue;
    }
    if (buffer && buffer.length + 1 + sentence.length > maxChars) {
      flush();
      buffer = sentence;
    } else {
      buffer = buffer ? `${buffer} ${sentence}` : sentence;
    }
  }
  flush();
  return chunks;
}

/**
 * Clean then split text into retrieval-friendly chunks (<= maxChars). Splits on
 * paragraph breaks first, then packs sentences within a long paragraph. Returns
 * [] for empty/whitespace input.
 */
export function chunkOcrText(text: string, maxChars: number = DEFAULT_MAX_CHUNK_CHARS): string[] {
  const clean = cleanOcrText(text);
  if (!clean) {
    return [];
  }
  const cap = Math.max(1, Math.floor(maxChars));
  const paragraphs = clean
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean);

  const chunks: string[] = [];
  for (const paragraph of paragraphs) {
    const flat = paragraph.replace(/\n/g, ' ').replace(/\s+/g, ' ').trim();
    if (!flat) {
      continue;
    }
    if (flat.length <= cap) {
      chunks.push(flat);
      continue;
    }
    chunks.push(...packSentences(splitSentences(flat), cap));
  }
  return chunks;
}

/**
 * Turn a recognizer's output into chunks. Prefers fullText; falls back to joining
 * the per-block text. Useful directly: recognizedToChunks(await recognizer(uri)).
 */
export function recognizedToChunks(
  recognized: { fullText?: string; blocks?: string[] },
  maxChars: number = DEFAULT_MAX_CHUNK_CHARS,
): string[] {
  const text =
    recognized.fullText && recognized.fullText.trim().length > 0
      ? recognized.fullText
      : (recognized.blocks ?? []).join('\n');
  return chunkOcrText(text, maxChars);
}
