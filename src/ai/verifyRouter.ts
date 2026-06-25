import { routeMessage } from '@/ai/aiRouter';
import { DEFAULT_PROFILE } from '@/profile/types';

/**
 * In-app smoke test for the AI router. Device-only (needs netinfo + Expo fetch +
 * any configured keys). Run from a dev screen or bootstrap under __DEV__.
 *
 * With no keys configured this still completes: the router degrades to cache and
 * then the on-device fallback. Configure keys via setApiKey() to exercise the
 * live cloud cascade.
 */
export async function verifyRouter(): Promise<void> {
  console.log('Starting Network Routing Integration Asserts...');

  await routeMessage({
    message: 'Ano ang photosynthesis?',
    profile: DEFAULT_PROFILE,
    onToken: (t) => console.log('[STREAM TOKEN RECEIVED]:', t),
    onDone: (full, tier) => console.log(`\nStream Closed successfully under Tier: (${tier})`),
    onTierChange: (t) => console.log('[Network State Router Alert]: Mode shifted to', t),
  });
}
