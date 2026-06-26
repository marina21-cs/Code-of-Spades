/**
 * Type definitions for Camera-Based Worksheet OCR (spec 5.5).
 *
 * The flow: expo-camera captures a worksheet/textbook page; an on-device text
 * recognizer (ML Kit) extracts the text; this module cleans + chunks it and adds
 * each chunk to the student's PERSONAL RAG layer (personal_chunks, source 'ocr')
 * so it becomes retrievable grounding for future questions. Fully offline.
 *
 * Pure type module \u2014 no native imports \u2014 so it stays headlessly verifiable.
 */

/** The result of running text recognition over a single captured image. */
export interface RecognizedText {
  /** The full extracted text (all blocks joined). */
  fullText: string;
  /** Per-block text as the OCR engine segmented it (paragraphs/lines). */
  blocks: string[];
}

/**
 * Pluggable text-recognition engine. The default lazily loads a native ML Kit
 * module; tests (and alternate engines) inject their own. Takes an image URI
 * (file:// from expo-camera) and resolves the recognized text.
 */
export type TextRecognizer = (imageUri: string) => Promise<RecognizedText>;

/** Optional metadata attached to ingested OCR chunks. */
export interface OcrIngestMeta {
  /** Display title for the captured material. Defaults to "Worksheet capture". */
  title?: string | null;
  subject?: string | null;
  gradeLevel?: number | null;
}

/** Outcome of ingesting recognized text into the personal RAG layer. */
export interface OcrIngestResult {
  /** Row ids of the inserted personal_chunks (one per chunk). */
  chunkIds: number[];
  /** Number of chunks stored. */
  chunkCount: number;
  /** Total characters stored across all chunks. */
  totalChars: number;
}
