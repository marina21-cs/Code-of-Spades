/**
 * SQLite-backed response cache (spec 5.3): repeat curriculum questions get
 * served from disk so frequently-asked topics become progressively "offline".
 */
import { getDB } from '@/db/database';

import { hashQuery } from './routerPolicy';

/** Return a cached response for an equivalent query, or null. Bumps hit_count. */
export async function getCachedResponse(query: string): Promise<string | null> {
  const db = getDB();
  const queryHash = hashQuery(query);
  const row = await db.getFirstAsync<{ response_text: string }>(
    'SELECT response_text FROM response_cache WHERE query_hash = ?',
    [queryHash],
  );
  if (!row) {
    return null;
  }
  await db.runAsync(
    'UPDATE response_cache SET hit_count = hit_count + 1 WHERE query_hash = ?',
    [queryHash],
  );
  return row.response_text;
}

/** One previously-answered, offline-available question from the cache. */
export interface CachedQuery {
  queryText: string;
  responseText: string;
  provider: string | null;
  hitCount: number;
}

/**
 * List the student's most recent cached answers (spec 5.3) for the Review tab's
 * "Recent AI Cache" section. Newest first, capped to `limit`.
 */
export async function listCachedResponses(limit = 10): Promise<CachedQuery[]> {
  const db = getDB();
  const rows = await db.getAllAsync<{
    query_text: string;
    response_text: string;
    provider: string | null;
    hit_count: number;
  }>(
    `SELECT query_text, response_text, provider, hit_count
     FROM response_cache
     ORDER BY created_at DESC
     LIMIT ?`,
    [limit],
  );
  return rows.map((row) => ({
    queryText: row.query_text,
    responseText: row.response_text,
    provider: row.provider,
    hitCount: row.hit_count,
  }));
}

/** Upsert a response into the cache keyed by the normalized-query hash. */
export async function cacheResponse(
  query: string,
  response: string,
  provider: string,
): Promise<void> {
  const db = getDB();
  const queryHash = hashQuery(query);
  await db.runAsync(
    `INSERT INTO response_cache (query_hash, query_text, response_text, provider)
     VALUES (?, ?, ?, ?)
     ON CONFLICT(query_hash) DO UPDATE SET
       response_text = excluded.response_text,
       provider      = excluded.provider,
       hit_count     = response_cache.hit_count + 1`,
    [queryHash, query, response, provider],
  );
}
