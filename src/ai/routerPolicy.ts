/**
 * Pure routing-policy helpers shared by the router and its verification.
 *
 * No native imports -> headlessly testable. These functions encode the spec 5.2
 * payload rules and the cache key derivation.
 */
import type { NetworkTier } from './networkTier';

/**
 * Top-k retrieved MELC passages per tier:
 *  - strong  (Tier 1): 3 passages
 *  - weak    (Tier 2): 1 passage  (reduced payload)
 *  - offline (Tier 3): 5 passages (smaller model needs more grounding)
 */
export function topKForNetworkTier(tier: NetworkTier): number {
  switch (tier) {
    case 'weak':
      return 1;
    case 'offline':
      return 5;
    case 'strong':
    default:
      return 3;
  }
}

/**
 * Max output tokens per tier. Weak signal caps hard at 150 (spec 5.2); offline
 * caps at 200 to keep on-device inference fast; strong allows a fuller answer.
 */
export function maxTokensForNetworkTier(tier: NetworkTier): number {
  switch (tier) {
    case 'weak':
      return 150;
    case 'offline':
      return 200;
    case 'strong':
    default:
      return 800;
  }
}

/** Normalize a query so trivially different phrasings share a cache entry. */
export function normalizeQuery(query: string): string {
  return query.trim().toLowerCase().replace(/\s+/g, ' ');
}

/**
 * Stable FNV-1a 32-bit hash (hex) of the normalized query, used as the
 * response_cache key. Deterministic and dependency-free.
 */
export function hashQuery(query: string): string {
  const normalized = normalizeQuery(query);
  let hash = 0x811c9dc5;
  for (let i = 0; i < normalized.length; i += 1) {
    hash ^= normalized.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
}
