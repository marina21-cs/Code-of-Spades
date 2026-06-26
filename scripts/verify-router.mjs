/**
 * Headless verification for the AI router.
 *
 * WHY THIS EXISTS:
 *   The live router (aiRouter.ts) depends on native modules (netinfo,
 *   expo-sqlite, expo/fetch), so the in-app verifyRouter() needs a device. This
 *   script verifies everything that is pure/injectable:
 *     - SSEStreamParser byte-chunk buffering + [DONE] handling (real parser)
 *     - streamProxyResponse end-to-end with a mock streaming fetch (real client)
 *     - executeRoute branching for strong / weak / offline / cache / full-failover
 *       (the REAL orchestration, with mocked collaborators)
 *     - query hashing + tier policy
 *
 *   It does NOT contact any provider and needs no API key.
 *
 * RUN: node --import ./scripts/register-ts.mjs scripts/verify-router.mjs
 */
import { SSEStreamParser } from '../src/ai/sse.ts';
import { ProxyHttpError, streamProxyResponse } from '../src/ai/cloudClient.ts';
import { executeRoute } from '../src/ai/routerCore.ts';
import {
  hashQuery,
  maxTokensForNetworkTier,
  normalizeQuery,
  topKForNetworkTier,
} from '../src/ai/routerPolicy.ts';

let failures = 0;
function check(condition, message) {
  if (condition) {
    console.log('✅', message);
  } else {
    failures += 1;
    console.error('❌', message);
  }
}

const PROFILE = { responseMode: 'mixed', accessibilitySettings: {}, gradeLevel: 6 };

function sseLine(content) {
  return `data: ${JSON.stringify({ choices: [{ delta: { content } }] })}\n\n`;
}

/** Build a mock streaming fetch that emits the given text chunks then [DONE]. */
function mockFetch(chunks, { ok = true, status = 200 } = {}) {
  return async () => ({
    ok,
    status,
    statusText: ok ? 'OK' : 'Error',
    text: async () => 'mock error body',
    body: ok
      ? (() => {
          const encoder = new TextEncoder();
          let i = 0;
          return new ReadableStream({
            pull(controller) {
              if (i < chunks.length) {
                controller.enqueue(encoder.encode(chunks[i]));
                i += 1;
              } else {
                controller.close();
              }
            },
          });
        })()
      : null,
  });
}

function makeDeps(overrides = {}) {
  return {
    getNetworkTier: async () => 'strong',
    retrieve: async () => ['Photosynthesis happens in the chloroplast.'],
    buildPrompt: () => 'SYSTEM PROMPT',
    getCached: async () => null,
    putCached: async () => {},
    getProviders: async () => [],
    runLocalModel: async ({ onToken }) => {
      onToken?.('local');
      return 'local answer';
    },
    ...overrides,
  };
}

function provider(id, impl) {
  return { id, stream: impl };
}

async function main() {
  // Proxy config is read lazily by getProxyConfig(), so set it before streaming.
  process.env.EXPO_PUBLIC_PROXY_URL = 'https://proxy.test/functions/v1/suri-ai-proxy';
  process.env.EXPO_PUBLIC_PROXY_TOKEN = 'test-token';

  // --- 1. SSE parser: split a token across chunk boundaries -----------------
  {
    const parser = new SSEStreamParser();
    const events = [];
    for (const evt of parser.push('data: {"choices":[{"delta":{"content":"Pho')) events.push(evt);
    for (const evt of parser.push('to"}}]}\n\n' + sseLine('synthesis'))) events.push(evt);
    for (const evt of parser.push('data: [DONE]\n\n')) events.push(evt);
    const tokens = events.filter((e) => e.type === 'token').map((e) => e.value);
    check(tokens.join('') === 'Photosynthesis', `SSE reassembles split tokens (got "${tokens.join('')}")`);
    check(events.some((e) => e.type === 'done'), 'SSE emits a done event on [DONE]');
  }

  // --- 2. cloudClient: full stream from the proxy over a mock fetch ---------
  {
    const tokens = [];
    const full = await streamProxyResponse({
      messages: [{ role: 'user', content: 'hi' }],
      onToken: (t) => tokens.push(t),
      fetchImpl: mockFetch([sseLine('Hello'), sseLine(', world'), 'data: [DONE]\n\n']),
    });
    check(full === 'Hello, world', `streamProxyResponse concatenates deltas (got "${full}")`);
    check(tokens.length === 2, `onToken fired once per delta (got ${tokens.length})`);
  }

  // --- 3. cloudClient: non-OK proxy response throws ProxyHttpError ----------
  {
    let thrown = null;
    try {
      await streamProxyResponse({
        messages: [{ role: 'user', content: 'hi' }],
        fetchImpl: mockFetch([], { ok: false, status: 429 }),
      });
    } catch (err) {
      thrown = err;
    }
    check(thrown instanceof ProxyHttpError && thrown.status === 429, 'HTTP 429 surfaces as ProxyHttpError');
  }

  // --- 4. strong tier: cascade fails over to the second provider ------------
  {
    const order = [];
    let retrieveK = null;
    let cached = null;
    const tiers = [];
    const result = await executeRoute(
      { message: 'q', profile: PROFILE, onTierChange: (t) => tiers.push(t) },
      makeDeps({
        retrieve: async (_q, _g, k) => {
          retrieveK = k;
          return ['chunk'];
        },
        putCached: async (_q, resp, prov) => {
          cached = { resp, prov };
        },
        getProviders: async () => [
          provider('gemini', async () => {
            order.push('gemini');
            throw new Error('rate limited');
          }),
          provider('groq', async ({ onToken }) => {
            order.push('groq');
            onToken?.('hi');
            return 'groq answer';
          }),
        ],
      }),
    );
    check(order.join(',') === 'gemini,groq', `cascade tried gemini then groq (got ${order.join(',')})`);
    check(result.source === 'groq' && result.tier === 'strong', 'strong result attributed to groq');
    check(retrieveK === 3, `strong tier retrieved top-3 (got ${retrieveK})`);
    check(cached?.prov === 'groq' && cached?.resp === 'groq answer', 'successful answer was cached');
    check(tiers[0] === 'strong', 'onTierChange announced strong');
  }

  // --- 5. weak tier: condensed payload (top-1, 150 tokens) ------------------
  {
    let retrieveK = null;
    let sentMaxTokens = null;
    const result = await executeRoute(
      { message: 'q', profile: PROFILE },
      makeDeps({
        getNetworkTier: async () => 'weak',
        retrieve: async (_q, _g, k) => {
          retrieveK = k;
          return ['chunk'];
        },
        getProviders: async () => [
          provider('gemini', async ({ maxTokens }) => {
            sentMaxTokens = maxTokens;
            return 'weak answer';
          }),
        ],
      }),
    );
    check(retrieveK === 1, `weak tier retrieved top-1 (got ${retrieveK})`);
    check(sentMaxTokens === 150, `weak tier capped output at 150 tokens (got ${sentMaxTokens})`);
    check(result.tier === 'weak' && result.source === 'gemini', 'weak result attributed to provider');
  }

  // --- 6. offline tier: cache miss -> on-device model (top-5), no providers -
  {
    let providersCalled = false;
    let retrieveK = null;
    const result = await executeRoute(
      { message: 'q', profile: PROFILE },
      makeDeps({
        getNetworkTier: async () => 'offline',
        retrieve: async (_q, _g, k) => {
          retrieveK = k;
          return ['chunk'];
        },
        getProviders: async () => {
          providersCalled = true;
          return [];
        },
        runLocalModel: async () => 'local offline answer',
      }),
    );
    check(result.source === 'local' && result.tier === 'offline', 'offline served by local model');
    check(retrieveK === 5, `offline retrieved top-5 (got ${retrieveK})`);
    check(providersCalled === false, 'offline never reaches cloud providers');
  }

  // --- 7. offline tier: cache HIT short-circuits the local model ------------
  {
    let localCalled = false;
    const result = await executeRoute(
      { message: 'q', profile: PROFILE },
      makeDeps({
        getNetworkTier: async () => 'offline',
        getCached: async () => 'cached answer',
        runLocalModel: async () => {
          localCalled = true;
          return 'should not run';
        },
      }),
    );
    check(result.source === 'cache' && result.text === 'cached answer', 'offline cache hit served from cache');
    check(localCalled === false, 'cache hit short-circuits the local model');
  }

  // --- 8. online but all providers fail -> degrade to local, announce offline
  {
    const tiers = [];
    const result = await executeRoute(
      { message: 'q', profile: PROFILE, onTierChange: (t) => tiers.push(t) },
      makeDeps({
        getNetworkTier: async () => 'strong',
        getCached: async () => null,
        getProviders: async () => [
          provider('gemini', async () => {
            throw new Error('down');
          }),
          provider('groq', async () => {
            throw new Error('down');
          }),
        ],
        runLocalModel: async () => 'degraded local answer',
      }),
    );
    check(result.source === 'local' && result.tier === 'offline', 'full cloud failure degrades to local');
    check(tiers[0] === 'strong' && tiers.includes('offline'), 'tier change announced strong then offline');
  }

  // --- 9. policy + hashing --------------------------------------------------
  {
    check(topKForNetworkTier('strong') === 3 && topKForNetworkTier('weak') === 1 && topKForNetworkTier('offline') === 5, 'topK per tier correct');
    check(maxTokensForNetworkTier('weak') === 150, 'weak token cap is 150');
    check(hashQuery('  Ano ang Photosynthesis? ') === hashQuery('ano ang photosynthesis?'), 'query hash is normalization-stable');
    check(normalizeQuery('  A   B ') === 'a b', 'normalizeQuery collapses whitespace + lowercases');
  }
}

main()
  .then(() => {
    if (failures > 0) {
      console.error(`\n${failures} check(s) failed.`);
      process.exit(1);
    }
    console.log('\nAll AI router checks passed.');
  })
  .catch((err) => {
    console.error('Verification crashed:', err);
    process.exit(1);
  });
