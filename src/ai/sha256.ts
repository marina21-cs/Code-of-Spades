/**
 * Streaming SHA-256 (pure, dependency-free).
 *
 * Used to verify the integrity of the downloaded model binary. It is incremental
 * so a ~100MB file can be hashed in small chunks without ever holding the whole
 * file in memory — essential on the 2GB target devices (spec 10).
 *
 * No imports -> cross-checkable headlessly against node:crypto.
 */

// SHA-256 round constants.
const K = new Uint32Array([
  0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
  0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
  0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
  0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
  0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
  0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
  0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
  0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
]);

function rotr(value: number, shift: number): number {
  return ((value >>> shift) | (value << (32 - shift))) >>> 0;
}

export class Sha256 {
  private state = Uint32Array.from([
    0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19,
  ]);
  private block = new Uint8Array(64);
  private blockLen = 0;
  private bytesLo = 0; // total processed length, low 32 bits
  private bytesHi = 0; // ... high 32 bits
  private readonly w = new Uint32Array(64);
  private finished = false;

  /** Feed more bytes into the hash. */
  update(data: Uint8Array): this {
    if (this.finished) {
      throw new Error('Sha256: cannot update() after digest()');
    }

    const lo = (this.bytesLo + data.length) >>> 0;
    if (lo < this.bytesLo) {
      this.bytesHi = (this.bytesHi + 1) >>> 0;
    }
    this.bytesLo = lo;

    this.absorb(data);
    return this;
  }

  /** Finalize and return the 32-byte digest. */
  digest(): Uint8Array {
    if (this.finished) {
      throw new Error('Sha256: digest() already called');
    }
    this.finished = true;

    const bitsHi = ((this.bytesHi << 3) | (this.bytesLo >>> 29)) >>> 0;
    const bitsLo = (this.bytesLo << 3) >>> 0;

    const padLen = this.blockLen < 56 ? 56 - this.blockLen : 120 - this.blockLen;
    const pad = new Uint8Array(padLen + 8);
    pad[0] = 0x80;
    const end = pad.length;
    pad[end - 8] = (bitsHi >>> 24) & 0xff;
    pad[end - 7] = (bitsHi >>> 16) & 0xff;
    pad[end - 6] = (bitsHi >>> 8) & 0xff;
    pad[end - 5] = bitsHi & 0xff;
    pad[end - 4] = (bitsLo >>> 24) & 0xff;
    pad[end - 3] = (bitsLo >>> 16) & 0xff;
    pad[end - 2] = (bitsLo >>> 8) & 0xff;
    pad[end - 1] = bitsLo & 0xff;
    this.absorb(pad);

    const out = new Uint8Array(32);
    for (let i = 0; i < 8; i += 1) {
      out[i * 4] = (this.state[i] >>> 24) & 0xff;
      out[i * 4 + 1] = (this.state[i] >>> 16) & 0xff;
      out[i * 4 + 2] = (this.state[i] >>> 8) & 0xff;
      out[i * 4 + 3] = this.state[i] & 0xff;
    }
    return out;
  }

  /** Finalize and return the digest as a lowercase hex string. */
  digestHex(): string {
    const bytes = this.digest();
    let hex = '';
    for (let i = 0; i < bytes.length; i += 1) {
      hex += bytes[i].toString(16).padStart(2, '0');
    }
    return hex;
  }

  private absorb(data: Uint8Array): void {
    let i = 0;
    const len = data.length;

    if (this.blockLen > 0) {
      while (i < len && this.blockLen < 64) {
        this.block[this.blockLen] = data[i];
        this.blockLen += 1;
        i += 1;
      }
      if (this.blockLen === 64) {
        this.processBlock(this.block, 0);
        this.blockLen = 0;
      }
    }

    while (i + 64 <= len) {
      this.processBlock(data, i);
      i += 64;
    }

    while (i < len) {
      this.block[this.blockLen] = data[i];
      this.blockLen += 1;
      i += 1;
    }
  }

  private processBlock(buf: Uint8Array, offset: number): void {
    const w = this.w;
    for (let t = 0; t < 16; t += 1) {
      const j = offset + t * 4;
      w[t] = ((buf[j] << 24) | (buf[j + 1] << 16) | (buf[j + 2] << 8) | buf[j + 3]) >>> 0;
    }
    for (let t = 16; t < 64; t += 1) {
      const s0 = rotr(w[t - 15], 7) ^ rotr(w[t - 15], 18) ^ (w[t - 15] >>> 3);
      const s1 = rotr(w[t - 2], 17) ^ rotr(w[t - 2], 19) ^ (w[t - 2] >>> 10);
      w[t] = (w[t - 16] + s0 + w[t - 7] + s1) >>> 0;
    }

    let a = this.state[0];
    let b = this.state[1];
    let c = this.state[2];
    let d = this.state[3];
    let e = this.state[4];
    let f = this.state[5];
    let g = this.state[6];
    let h = this.state[7];

    for (let t = 0; t < 64; t += 1) {
      const s1 = rotr(e, 6) ^ rotr(e, 11) ^ rotr(e, 25);
      const ch = (e & f) ^ (~e & g);
      const temp1 = (h + s1 + ch + K[t] + w[t]) >>> 0;
      const s0 = rotr(a, 2) ^ rotr(a, 13) ^ rotr(a, 22);
      const maj = (a & b) ^ (a & c) ^ (b & c);
      const temp2 = (s0 + maj) >>> 0;

      h = g;
      g = f;
      f = e;
      e = (d + temp1) >>> 0;
      d = c;
      c = b;
      b = a;
      a = (temp1 + temp2) >>> 0;
    }

    this.state[0] = (this.state[0] + a) >>> 0;
    this.state[1] = (this.state[1] + b) >>> 0;
    this.state[2] = (this.state[2] + c) >>> 0;
    this.state[3] = (this.state[3] + d) >>> 0;
    this.state[4] = (this.state[4] + e) >>> 0;
    this.state[5] = (this.state[5] + f) >>> 0;
    this.state[6] = (this.state[6] + g) >>> 0;
    this.state[7] = (this.state[7] + h) >>> 0;
  }
}

/** One-shot convenience: hash bytes to a lowercase hex digest. */
export function sha256Hex(data: Uint8Array): string {
  return new Sha256().update(data).digestHex();
}
