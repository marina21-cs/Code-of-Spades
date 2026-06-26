/**
 * Headless verification for Camera-Based Worksheet OCR (spec 5.5).
 *
 * WHY THIS EXISTS:
 *   The real recognizer (ML Kit) and the real personal_chunks store depend on
 *   native modules + a device. This script verifies the PURE + INJECTED pieces:
 *     - text cleaning + chunking: whitespace/control-char cleanup, paragraph +
 *       sentence-aligned chunking under a max size, over-long hard-split
 *     - the recognizer boundary: an injected recognizer passes through; the
 *       default throws OcrNotAvailableError when no engine is installed
 *     - the ingestion pipeline against a fake store: chunk count, 'ocr' source,
 *       paginated titles, empty -> no-op, and captureAndIngest end-to-end
 *     - retrievability: ingest through a REAL node:sqlite personal_chunks store
 *       (real embedText + schema) and confirm the captured text is retrievable
 *       and outranks an unrelated note (mirrors verify-rag)
 *
 *   It contacts no provider, needs no API key, and installs no native module.
 *
 * RUN: node --import ./scripts/register-ts.mjs scripts/verify-ocr.mjs
 */
import { DatabaseSync } from 'node:sqlite';

import {
  chunkOcrText,
  cleanOcrText,
  recognizedToChunks,
} from '../src/features/ocr/services/ocrChunking.ts';
import {
  OcrNotAvailableError,
  recognizeText,
} from '../src/features/ocr/services/textRecognition.ts';
import {
  captureAndIngest,
  ingestRecognizedText,
} from '../src/features/ocr/services/ocrIngestion.ts';
import { bytesToFloat, embedText, floatToBytes, rankByCosine } from '../src/db/embedding.ts';
import { CREATE_TABLES_SQL } from '../src/db/schema.ts';

let failures = 0;
function check(condition, message) {
  if (condition) {
    console.log('✅', message);
  } else {
    failures += 1;
    console.error('❌', message);
  }
}

function makeFakeStore() {
  const rows = [];
  return {
    rows,
    addChunk: async (input) => {
      rows.push(input);
      return rows.length; // synthetic row id
    },
  };
}

const WORKSHEET =
  'Photosynthesis is how green plants make their own food. ' +
  'They use sunlight, water, and carbon dioxide from the air. ' +
  'The chloroplast holds the green pigment called chlorophyll. ' +
  'Chlorophyll captures the energy of sunlight.\n\n' +
  'Answer the following:\n' +
  '1. What gas do plants take in during photosynthesis?\n' +
  '2. Where in the cell does photosynthesis happen?';

async function main() {
  // --- 1. cleaning ----------------------------------------------------------
  {
    const dirty = '  Line\tone   \r\n\r\n\r\n  Line   two  ';
    const clean = cleanOcrText(dirty);
    check(!clean.includes('\t') && !clean.includes('\r'), 'cleanOcrText strips tabs + CR');
    check(!/ {2,}/.test(clean), 'cleanOcrText collapses repeated spaces');
    check(!/\n{3,}/.test(clean), 'cleanOcrText collapses 3+ blank lines to a paragraph break');
    check(cleanOcrText('') === '', 'cleanOcrText handles empty input');
  }

  // --- 2. chunking ----------------------------------------------------------
  {
    check(chunkOcrText('') .length === 0, 'empty text -> no chunks');
    check(chunkOcrText('   \n\n  ').length === 0, 'whitespace-only text -> no chunks');

    const short = chunkOcrText('A short worksheet line.', 600);
    check(short.length === 1 && short[0] === 'A short worksheet line.', 'a short paragraph -> a single chunk');

    const chunks = chunkOcrText(WORKSHEET, 120);
    check(chunks.length > 1, `a long worksheet splits into multiple chunks (got ${chunks.length})`);
    check(chunks.every((c) => c.length <= 120), 'no chunk exceeds the max size');
    check(chunks.every((c) => c.trim().length > 0), 'no empty chunks');

    // A single over-long sentence (no terminators) is hard-split.
    const longWord = 'x'.repeat(500);
    const hard = chunkOcrText(longWord, 100);
    check(hard.length === 5 && hard.every((c) => c.length <= 100), 'an over-long sentence is hard-split to the cap');
  }

  // --- 3. recognizedToChunks ------------------------------------------------
  {
    const fromFull = recognizedToChunks({ fullText: 'Hello. World.', blocks: ['ignored'] }, 600);
    check(fromFull.join(' ').includes('Hello'), 'recognizedToChunks prefers fullText when present');
    const fromBlocks = recognizedToChunks({ fullText: '', blocks: ['Block A.', 'Block B.'] }, 600);
    check(fromBlocks.join(' ').includes('Block A') && fromBlocks.join(' ').includes('Block B'), 'recognizedToChunks falls back to blocks');
  }

  // --- 4. recognizer boundary ----------------------------------------------
  {
    const injected = async (uri) => ({ fullText: `text of ${uri}`, blocks: [] });
    const r = await recognizeText('file://abc.jpg', injected);
    check(r.fullText === 'text of file://abc.jpg', 'an injected recognizer is used as-is');

    let threw = null;
    try {
      await recognizeText('file://abc.jpg');
    } catch (e) {
      threw = e;
    }
    check(threw instanceof OcrNotAvailableError, 'the default recognizer throws OcrNotAvailableError when no engine is installed');
  }

  // --- 5. ingestion against a fake store -----------------------------------
  {
    const store = makeFakeStore();
    const result = await ingestRecognizedText(
      { fullText: WORKSHEET, blocks: [] },
      { store, maxChars: 120, meta: { subject: 'Science', gradeLevel: 6 } },
    );
    check(result.chunkCount === store.rows.length && result.chunkCount > 1, 'ingest stores one row per chunk');
    check(result.chunkIds.length === result.chunkCount, 'ingest returns an id per stored chunk');
    check(store.rows.every((r) => r.sourceType === 'ocr'), 'every stored chunk is tagged source_type ocr');
    check(store.rows.every((r) => r.subject === 'Science' && r.gradeLevel === 6), 'metadata is attached to every chunk');
    check(store.rows[0].title.includes('(1/'), 'multi-chunk captures get paginated titles');
    check(result.totalChars > 0, 'ingest reports total characters stored');

    const empty = await ingestRecognizedText({ fullText: '', blocks: [] }, { store: makeFakeStore() });
    check(empty.chunkCount === 0 && empty.chunkIds.length === 0, 'empty recognition is a no-op');
  }

  // --- 6. captureAndIngest end-to-end --------------------------------------
  {
    const store = makeFakeStore();
    const recognizer = async () => ({ fullText: 'Ang tubig ay sumisingaw kapag pinainit.', blocks: [] });
    const res = await captureAndIngest('file://w.jpg', { recognizer, store });
    check(res.chunkCount >= 1 && store.rows[0].content.includes('tubig'), 'captureAndIngest recognizes then ingests');
  }

  // --- 7. retrievability through a REAL node:sqlite personal store ---------
  {
    const db = new DatabaseSync(':memory:');
    db.exec(CREATE_TABLES_SQL);
    const insert = db.prepare(
      `INSERT INTO personal_chunks (source_type, title, content, embedding, subject, grade_level)
       VALUES (?, ?, ?, ?, ?, ?)`,
    );
    const dbStore = {
      addChunk: async (input) => {
        const source = [input.title, input.content].filter(Boolean).join(' ');
        const embedding = floatToBytes(embedText(source));
        const info = insert.run(
          input.sourceType ?? 'note',
          input.title ?? null,
          input.content,
          Buffer.from(embedding),
          input.subject ?? null,
          input.gradeLevel ?? null,
        );
        return Number(info.lastInsertRowid);
      },
    };

    await ingestRecognizedText(
      { fullText: WORKSHEET, blocks: [] },
      { store: dbStore, maxChars: 160, meta: { subject: 'Science', gradeLevel: 6 } },
    );
    // An unrelated personal note that should NOT win the photosynthesis query.
    await dbStore.addChunk({ content: 'Ang kabayo ay hayop na mabilis tumakbo.', sourceType: 'note', title: 'note' });

    const storedRows = db.prepare('SELECT COUNT(*) AS n FROM personal_chunks').get().n;
    check(storedRows > 1, `OCR chunks persisted to personal_chunks (got ${storedRows} rows)`);
    check(
      db.prepare(`SELECT COUNT(*) AS n FROM personal_chunks WHERE source_type = 'ocr'`).get().n >= 1,
      'persisted OCR chunks carry source_type = ocr',
    );

    const rows = db.prepare('SELECT id, content, embedding FROM personal_chunks').all();
    const candidates = rows.map((r) => ({ content: r.content, embedding: bytesToFloat(r.embedding) }));
    const top = rankByCosine(embedText('photosynthesis chlorophyll sunlight'), candidates, 1);
    check(
      top.length === 1 && /photosynthesis|chlorophyll|sunlight/i.test(top[0].content),
      'OCR-ingested worksheet text is retrievable from the personal RAG layer',
    );
    check(top[0].content !== 'Ang kabayo ay hayop na mabilis tumakbo.', 'the relevant OCR chunk outranks an unrelated note');

    db.close();
  }
}

main()
  .then(() => {
    if (failures > 0) {
      console.error(`\n${failures} check(s) failed.`);
      process.exit(1);
    }
    console.log('\nAll Camera OCR checks passed.');
  })
  .catch((err) => {
    console.error('Verification crashed:', err);
    process.exit(1);
  });
