/**
 * Headless verification for the Tier-3 on-device SLM support modules.
 *
 * WHY THIS EXISTS:
 *   The runtime pieces (llama.rn, expo-file-system) are native and need a
 *   device, so the in-app verifyOfflineInference() runs there. This script
 *   verifies the pure, safety-critical logic those modules depend on:
 *     - the streaming SHA-256 (cross-checked against node:crypto, incl. a 1MB
 *       random buffer fed in odd-sized chunks — this is the integrity guard)
 *     - base64 decoding (cross-checked against Buffer)
 *     - the ChatML prompt formatter + stop words
 *     - the pinned asset descriptor + storage/size/progress policy
 *
 *   It does NOT run llama.rn inference or touch the filesystem.
 *
 * RUN: node --import ./scripts/register-ts.mjs scripts/verify-slm.mjs
 */
import { createHash, randomBytes } from 'node:crypto';

import { Sha256, sha256Hex } from '../src/ai/sha256.ts';
import { base64ToBytes } from '../src/ai/binary.ts';
import { SLM_STOP_WORDS, formatChatML } from '../src/ai/slmPrompt.ts';
import {
  MIN_FREE_BYTES_REQUIRED,
  MODEL_EXPECTED_BYTES,
  MODEL_EXPECTED_SHA256,
  computeProgress,
  isValidModelSize,
  meetsStorageRequirement,
} from '../src/ai/modelPolicy.ts';

let failures = 0;
function check(condition, message) {
  if (condition) {
    console.log('✅', message);
  } else {
    failures += 1;
    console.error('❌', message);
  }
}

function nodeSha(bytes) {
  return createHash('sha256').update(bytes).digest('hex');
}

// --- 1. SHA-256 known vectors --------------------------------------------
check(
  sha256Hex(new TextEncoder().encode('')) === 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
  'SHA-256 of empty string matches the known vector',
);
check(
  sha256Hex(new TextEncoder().encode('abc')) === 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad',
  'SHA-256 of "abc" matches the known vector',
);

// --- 2. SHA-256 cross-checked against node:crypto -------------------------
for (const text of ['', 'abc', 'The quick brown fox jumps over the lazy dog', 'a'.repeat(1000)]) {
  const bytes = new TextEncoder().encode(text);
  check(sha256Hex(bytes) === nodeSha(bytes), `SHA-256 matches node:crypto for input length ${bytes.length}`);
}

// --- 3. SHA-256 streaming: 1MB random fed in odd chunks == one-shot -------
{
  const data = new Uint8Array(randomBytes(1024 * 1024));
  const hasher = new Sha256();
  let offset = 0;
  const sizes = [1, 7, 64, 65, 4095, 4096, 100000];
  let s = 0;
  while (offset < data.length) {
    const len = Math.min(sizes[s % sizes.length], data.length - offset);
    hasher.update(data.subarray(offset, offset + len));
    offset += len;
    s += 1;
  }
  check(hasher.digestHex() === nodeSha(data), 'Streaming SHA-256 over 1MB (odd chunks) matches node:crypto');
}

// --- 4. base64 decoding cross-checked against Buffer ----------------------
for (const text of ['', 'f', 'fo', 'foo', 'foob', 'fooba', 'foobar', 'Suri 🦊 offline']) {
  const b64 = Buffer.from(text, 'utf8').toString('base64');
  const decoded = Buffer.from(base64ToBytes(b64)).toString('utf8');
  check(decoded === text, `base64ToBytes round-trips "${text}"`);
}

// --- 5. ChatML prompt formatting -----------------------------------------
{
  const prompt = formatChatML('SYS', 'hello');
  check(
    prompt === '<|im_start|>system\nSYS<|im_end|>\n<|im_start|>user\nhello<|im_end|>\n<|im_start|>assistant\n',
    'formatChatML emits the SmolLM2 ChatML template',
  );
  check(SLM_STOP_WORDS.includes('<|im_end|>'), 'ChatML stop words include <|im_end|>');
}

// --- 6. Asset descriptor + policy ----------------------------------------
check(MODEL_EXPECTED_BYTES === 105_454_432, 'Pinned model size matches the HF repo (105,454,432 bytes)');
check(/^[0-9a-f]{64}$/.test(MODEL_EXPECTED_SHA256), 'Pinned SHA-256 is a 64-char hex string');
check(MIN_FREE_BYTES_REQUIRED === 200 * 1024 * 1024, 'Storage requirement is 200MB');

check(meetsStorageRequirement(250 * 1024 * 1024) === true, 'meetsStorageRequirement true at 250MB free');
check(meetsStorageRequirement(150 * 1024 * 1024) === false, 'meetsStorageRequirement false at 150MB free');

check(isValidModelSize(MODEL_EXPECTED_BYTES) === true, 'exact expected size is valid');
check(isValidModelSize(MODEL_EXPECTED_BYTES - 1) === false, 'a truncated size is rejected');

check(computeProgress(0, 0) === 0, 'progress is 0 when total unknown');
check(computeProgress(50, 100) === 0.5, 'progress is 0.5 at halfway');
check(computeProgress(200, 100) === 1, 'progress clamps to 1');

if (failures > 0) {
  console.error(`\n${failures} check(s) failed.`);
  process.exit(1);
}
console.log('\nAll on-device SLM support checks passed.');
