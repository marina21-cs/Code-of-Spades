/**
 * B2B sync orchestration (spec 5.10) — Supabase wiring is intentionally stubbed.
 *
 * pushBatch() is the single seam the real Supabase client will implement later
 * (@supabase/supabase-js + an expo-task-manager / expo-background-fetch Wi-Fi
 * trigger). Today it accepts the batch without a network call so the offline
 * queue can be drained end-to-end in development and the gamification →
 * telemetry pipeline is provably wired.
 *
 * SECURITY NOTE: only anonymized, competency-level rows belong in this batch.
 * Raw student content and the Learning Profile must never leave the device.
 */
import { getUnsyncedEvents, markSynced } from './eventQueue';
import type { CompetencyEventRow } from './types';

export interface PushResult {
  ok: boolean;
  pushed: number;
}

/**
 * Push a batch of anonymized events to the cloud dashboard backend.
 *
 * STUB: returns success without making a network call. Replace the body with a
 * Supabase insert when the B2B backend is provisioned, e.g.:
 *   const { error } = await supabase.from('competency_events').insert(rows.map(toDTO));
 *   return { ok: !error, pushed: error ? 0 : rows.length };
 */
export async function pushBatch(rows: CompetencyEventRow[]): Promise<PushResult> {
  if (rows.length === 0) {
    return { ok: true, pushed: 0 };
  }
  // TODO(supabase): POST anonymized rows to the LGU/School dashboard backend.
  return { ok: true, pushed: rows.length };
}

/**
 * Drain the local queue in batches: read unsynced events, push them, and mark
 * the successfully-pushed ids synced. Returns the total number pushed. Stops on
 * the first failed batch so nothing is marked synced prematurely (the rows stay
 * queued for the next Wi-Fi window).
 */
export async function syncPendingEvents(batchSize = 100): Promise<number> {
  let totalPushed = 0;
  for (;;) {
    const rows = await getUnsyncedEvents(batchSize);
    if (rows.length === 0) {
      break;
    }
    const result = await pushBatch(rows);
    if (!result.ok) {
      break;
    }
    await markSynced(rows.map((r) => r.id));
    totalPushed += result.pushed;
    // A short final batch means the queue is drained.
    if (rows.length < batchSize) {
      break;
    }
  }
  return totalPushed;
}
