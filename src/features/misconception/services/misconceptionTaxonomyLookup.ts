/**
 * Pure taxonomy matching for Misconception Detection (spec 5.9).
 *
 * Two consumers:
 *   - the prompt builder, to inject "known wrong beliefs for this topic" as
 *     detection hints (online RAG augmentation);
 *   - the detector's OFFLINE path, to identify a misconception by keyword lookup
 *     when there is no AI budget to generate one.
 *
 * No native imports -> headlessly verifiable.
 */
import {
  MISCONCEPTION_TAXONOMY,
} from '../constants/misconceptionTaxonomy';
import type { MisconceptionTaxonomyEntry } from '../types/misconception.types';

/** Minimum keyword hits before the offline path will assert a match. */
export const MIN_TAXONOMY_HITS = 2;

function normalize(text: string): string {
  return text.toLowerCase().normalize('NFC');
}

/** Loose topic relatedness: either string contains the other (after normalize). */
function topicRelated(entryTopic: string, queryTopic: string): boolean {
  const a = normalize(entryTopic);
  const b = normalize(queryTopic);
  if (!b) {
    return false;
  }
  return a.includes(b) || b.includes(a);
}

/**
 * All taxonomy entries attached to a topic. Used to seed the online prompt with
 * the specific wrong beliefs worth watching for.
 */
export function entriesForTopic(topic: string): MisconceptionTaxonomyEntry[] {
  return MISCONCEPTION_TAXONOMY.filter((entry) => topicRelated(entry.topic, topic));
}

/** Count how many of an entry's keywords appear in the text (substring match). */
export function countKeywordHits(entry: MisconceptionTaxonomyEntry, text: string): number {
  const haystack = normalize(text);
  let hits = 0;
  for (const keyword of entry.keywords) {
    if (haystack.includes(normalize(keyword))) {
      hits += 1;
    }
  }
  return hits;
}

export interface TaxonomyMatch {
  entry: MisconceptionTaxonomyEntry;
  hits: number;
}

/**
 * Find the single best taxonomy entry for a student's message + topic, or null.
 *
 * Scores every entry by keyword hits against (message + topic). A matching topic
 * adds a small boost so a topic-relevant belief outranks an incidental keyword
 * collision. Requires at least MIN_TAXONOMY_HITS to assert a match, which keeps
 * the offline path conservative (no false "you have a misconception").
 */
export function findTaxonomyMatch(
  studentMessage: string,
  topic: string,
): TaxonomyMatch | null {
  const text = `${studentMessage} ${topic}`;

  let best: TaxonomyMatch | null = null;
  for (const entry of MISCONCEPTION_TAXONOMY) {
    const baseHits = countKeywordHits(entry, text);
    if (baseHits === 0) {
      continue;
    }
    // Topic relevance acts as a tie-breaking boost, not a free pass.
    const score = baseHits + (topicRelated(entry.topic, topic) ? 1 : 0);
    if (!best || score > best.hits) {
      best = { entry, hits: score };
    }
  }

  if (!best || best.hits < MIN_TAXONOMY_HITS) {
    return null;
  }
  return best;
}
