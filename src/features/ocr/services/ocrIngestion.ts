/**
 * OCR ingestion into the personal RAG layer (spec 5.5).
 *
 * Turns recognized worksheet text into retrievable grounding: clean + chunk the
 * text, then persist each chunk as a personal_chunk (source_type 'ocr') with its
 * embedding. After ingestion the captured material is retrievable by retrieveTopK
 * alongside the bundled MELC corpus \u2014 fully offline.
 *
 * The persistence store is INJECTABLE; the default lazily resolves the real
 * ragStore. The lazy import keeps this module free of a top-level native/@-alias
 * dependency, so the pipeline is exercisable headlessly with a fake store.
 */
import type {
  OcrIngestMeta,
  OcrIngestResult,
  RecognizedText,
  TextRecognizer,
} from '../types/ocr.types';
import { recognizedToChunks } from './ocrChunking';
import { recognizeText } from './textRecognition';

/** A single chunk to persist (mirrors ragStore.AddPersonalChunkInput). */
export interface OcrChunkInput {
  content: string;
  title?: string | null;
  subject?: string | null;
  gradeLevel?: number | null;
  sourceType?: 'note' | 'ocr';
}

/** The persistence seam. The default wraps ragStore.addPersonalChunk. */
export interface OcrStore {
  addChunk(input: OcrChunkInput): Promise<number>;
}

/** Resolve the store: the injected one, or the real ragStore (lazily). */
async function resolveStore(store?: OcrStore): Promise<OcrStore> {
  if (store) {
    return store;
  }
  // Lazy so this module carries no top-level @/ runtime import; headless
  // verification always injects a store and never reaches this path.
  const ragStore = await import('@/db/ragStore');
  return { addChunk: (input) => ragStore.addPersonalChunk(input) };
}

export interface IngestOptions {
  meta?: OcrIngestMeta;
  /** Max characters per chunk (default: DEFAULT_MAX_CHUNK_CHARS). */
  maxChars?: number;
  /** Override the persistence store (tests). Defaults to the real ragStore. */
  store?: OcrStore;
}

/**
 * Clean, chunk, and persist recognized text into the personal RAG layer. Returns
 * the inserted chunk ids and totals. Empty/whitespace recognition is a no-op.
 */
export async function ingestRecognizedText(
  recognized: RecognizedText,
  options: IngestOptions = {},
): Promise<OcrIngestResult> {
  const chunks = recognizedToChunks(recognized, options.maxChars);
  if (chunks.length === 0) {
    return { chunkIds: [], chunkCount: 0, totalChars: 0 };
  }

  const store = await resolveStore(options.store);
  const baseTitle = options.meta?.title ?? 'Worksheet capture';
  const subject = options.meta?.subject ?? null;
  const gradeLevel = options.meta?.gradeLevel ?? null;

  const chunkIds: number[] = [];
  let totalChars = 0;
  for (let i = 0; i < chunks.length; i += 1) {
    const content = chunks[i];
    const title = chunks.length > 1 ? `${baseTitle} (${i + 1}/${chunks.length})` : baseTitle;
    // eslint-disable-next-line no-await-in-loop
    const id = await store.addChunk({ content, title, subject, gradeLevel, sourceType: 'ocr' });
    chunkIds.push(id);
    totalChars += content.length;
  }

  return { chunkIds, chunkCount: chunkIds.length, totalChars };
}

export interface CaptureOptions extends IngestOptions {
  /** Override the text recognizer (tests / alternate engines). */
  recognizer?: TextRecognizer;
}

/**
 * End-to-end: recognize text from a captured image URI, then ingest it into the
 * personal RAG layer. Throws OcrNotAvailableError if no recognizer is available
 * and none was injected.
 */
export async function captureAndIngest(
  imageUri: string,
  options: CaptureOptions = {},
): Promise<OcrIngestResult> {
  const recognized = await recognizeText(imageUri, options.recognizer);
  return ingestRecognizedText(recognized, options);
}
