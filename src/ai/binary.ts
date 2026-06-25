/**
 * Minimal, dependency-free base64 -> bytes decoder.
 *
 * expo-file-system reads file chunks as base64 strings; we decode them to bytes
 * to feed the streaming hasher. Avoids relying on atob/Buffer being present in
 * the React Native runtime.
 */

const BASE64_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

const DECODE_LOOKUP = (() => {
  const table = new Int16Array(256).fill(-1);
  for (let i = 0; i < BASE64_ALPHABET.length; i += 1) {
    table[BASE64_ALPHABET.charCodeAt(i)] = i;
  }
  return table;
})();

/** Decode a base64 string (padding/whitespace tolerant) into a Uint8Array. */
export function base64ToBytes(input: string): Uint8Array {
  // Strip anything that is not a base64 symbol (whitespace, '=', newlines).
  const clean = input.replace(/[^A-Za-z0-9+/]/g, '');
  const length = clean.length;
  const outLength = Math.floor((length * 3) / 4);
  const out = new Uint8Array(outLength);

  let outIndex = 0;
  let accumulator = 0;
  let bits = 0;

  for (let i = 0; i < length; i += 1) {
    const value = DECODE_LOOKUP[clean.charCodeAt(i)];
    if (value < 0) {
      continue;
    }
    accumulator = (accumulator << 6) | value;
    bits += 6;
    if (bits >= 8) {
      bits -= 8;
      out[outIndex] = (accumulator >> bits) & 0xff;
      outIndex += 1;
    }
  }

  return out;
}
