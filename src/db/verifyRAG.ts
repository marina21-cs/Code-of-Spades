import { getDB } from '@/db/database';
import { getReviewerItems, retrieveTopK } from '@/db/ragStore';

/**
 * In-app headless validation for the MELC RAG store. Run after initDB() and
 * seedMELCs() have resolved (e.g. from app bootstrap under __DEV__). Console
 * logging validation engine — not a UI screen.
 */
export async function verifyRAG(): Promise<void> {
  const db = getDB();

  // 1. Data volume test
  const count = await db.getFirstAsync<{ n: number }>('SELECT COUNT(*) as n FROM melc_chunks');
  console.assert((count?.n ?? 0) >= 8, '❌ Seeding operations failed, missing dataset');
  console.log(`✅ Seed populations active across ${count?.n} rows.`);

  // 2. Local retrieval validation
  const cellResult = await retrieveTopK('parts of plant cell', 6, 3);
  console.assert(cellResult.texts.length > 0, '❌ Empty index search query results returned');
  console.assert(
    cellResult.texts[0].toLowerCase().includes('cell wall') ||
      cellResult.texts[0].toLowerCase().includes('chloroplast'),
    '❌ Index ranking operations returned wrong sequence matches',
  );
  console.log('✅ Query context retrieval matches targets.');

  // 3. Tier volume constraint checks
  const tierTwoCheck = await retrieveTopK('photosynthesis', 6, 1);
  console.assert(
    tierTwoCheck.texts.length === 1,
    '❌ Multi-record payload leaking into weak network profiles',
  );

  const tierThreeCheck = await retrieveTopK('science biology cell', 6, 5);
  console.assert(tierThreeCheck.texts.length <= 5, '❌ Context limit exceeded bounds criteria');
  console.log('✅ Context allocation lengths successfully mapped across network variations.');

  // Touch the reviewer listing so a regression here surfaces in dev too.
  const reviewer = await getReviewerItems(6);
  console.assert(reviewer.length >= 8, '❌ Reviewer listing did not include the seeded corpus');
  console.log(`✅ Reviewer listing exposes ${reviewer.length} items.`);
}
