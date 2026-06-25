/**
 * Headless verification for the MELC RAG store.
 *
 * WHY THIS EXISTS:
 *   ragStore.retrieveTopK()/seedMELCs() depend on expo-sqlite (native, device
 *   only). This script reproduces those two routines against Node's built-in
 *   node:sqlite using the SAME building blocks — the real embedText/rankByCosine
 *   (embedding.ts), the real seed data (melcData.ts), and the real table DDL
 *   (schema.ts). It therefore validates the seed-data quality, the Float32 BLOB
 *   round-trip, the cosine ranking order, and the tier-aware top-k limits.
 *
 *   It does NOT exercise the expo-sqlite binding itself — verifyRAG.ts covers
 *   that on-device.
 *
 * RUN: node --import ./scripts/register-ts.mjs scripts/verify-rag.mjs
 */
import { DatabaseSync } from 'node:sqlite';

import { bytesToFloat, embedText, floatToBytes, rankByCosine } from '../src/db/embedding.ts';
import { MELC_SEEDS, melcEmbeddingText } from '../src/db/seeds/melcData.ts';
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

const db = new DatabaseSync(':memory:');
db.exec(CREATE_TABLES_SQL);

// --- reproduce seedMELCs() -------------------------------------------------
const insert = db.prepare(
  `INSERT INTO melc_chunks (competency_code, subject, grade_level, content, embedding)
   VALUES (?, ?, ?, ?, ?)`,
);
for (const seed of MELC_SEEDS) {
  const embedding = floatToBytes(embedText(melcEmbeddingText(seed)));
  insert.run(seed.competencyCode, seed.subject, seed.gradeLevel, seed.content, Buffer.from(embedding));
}

// --- reproduce retrieveTopK() ---------------------------------------------
function retrieveTopK(query, gradeLevel, k) {
  const rows = db
    .prepare(`SELECT id, content, embedding FROM melc_chunks WHERE grade_level = ?`)
    .all(gradeLevel);
  const candidates = rows.map((row) => ({
    id: row.id,
    content: row.content,
    embedding: bytesToFloat(row.embedding),
  }));
  const ranked = rankByCosine(embedText(query), candidates, k);
  return { texts: ranked.map((r) => r.content), chunks: ranked };
}

// --- assertions (mirror verifyRAG) ----------------------------------------
const count = db.prepare('SELECT COUNT(*) AS n FROM melc_chunks').get().n;
check(count >= 8, `Seed populations active across ${count} rows`);

const cellResult = retrieveTopK('parts of plant cell', 6, 3);
check(cellResult.texts.length > 0, 'Non-empty retrieval for "parts of plant cell"');
const top = (cellResult.texts[0] ?? '').toLowerCase();
check(
  top.includes('cell wall') || top.includes('chloroplast'),
  `Top match is the plant-cell passage ("${(cellResult.texts[0] ?? '').slice(0, 48)}...")`,
);

const tierTwo = retrieveTopK('photosynthesis', 6, 1);
check(tierTwo.texts.length === 1, `Tier 2 returns exactly 1 passage (got ${tierTwo.texts.length})`);
check(
  (tierTwo.texts[0] ?? '').toLowerCase().includes('photosynthesis'),
  'Tier 2 single passage is the photosynthesis topic',
);

const tierThree = retrieveTopK('science biology cell', 6, 5);
check(tierThree.texts.length <= 5, `Tier 3 capped at 5 passages (got ${tierThree.texts.length})`);

// extra: ranking is monotonically non-increasing
const scores = cellResult.chunks.map((c) => c.score);
check(
  scores.every((s, i) => i === 0 || scores[i - 1] >= s),
  'Cosine scores are sorted descending',
);

// extra: Float32 BLOB round-trip is lossless
const original = embedText('cell wall chloroplast nucleus');
const restored = bytesToFloat(floatToBytes(original));
let lossless = original.length === restored.length;
for (let i = 0; lossless && i < original.length; i += 1) {
  if (Math.abs(original[i] - restored[i]) > 1e-7) lossless = false;
}
check(lossless, 'Float32 vector survives the BLOB encode/decode round-trip');

db.close();

if (failures > 0) {
  console.error(`\n${failures} check(s) failed.`);
  process.exit(1);
}
console.log('\nAll RAG retrieval checks passed.');
