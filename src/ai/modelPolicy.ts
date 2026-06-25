/**
 * On-device model asset descriptor + pure decision helpers.
 *
 * Asset values are pinned to the validated bartowski SmolLM2-135M-Instruct
 * Q4_K_M GGUF (spec 5.2 Tier 3). The git-LFS object id of an HF file IS its
 * SHA-256, so MODEL_EXPECTED_SHA256 below is taken directly from the repo tree
 * and can be verified after download.
 *
 * No native imports -> the helpers are unit-testable headlessly.
 */

export const MODEL_ID = 'smollm2-135m-instruct-q4_k_m';
export const MODEL_FILE_NAME = 'SmolLM2-135M-Instruct-Q4_K_M.gguf';

/** Direct resolve URL for the GGUF weight (~100MB). */
export const MODEL_URL =
  'https://huggingface.co/bartowski/SmolLM2-135M-Instruct-GGUF/resolve/main/SmolLM2-135M-Instruct-Q4_K_M.gguf?download=true';

/** Exact file size in bytes (from the HF repo tree). */
export const MODEL_EXPECTED_BYTES = 105_454_432;

/** SHA-256 of the file (HF git-LFS oid). Used for post-download integrity. */
export const MODEL_EXPECTED_SHA256 =
  '2e8040ceae7815abe0dcb3540b9995eaa1fa0d2ca9e797d0a635ae4433c68c2d';

/** Floor used to detect truncated/partial downloads when an exact size is absent. */
export const MODEL_MIN_VALID_BYTES = 50 * 1024 * 1024;

/** Minimum free storage required before a download is allowed (spec: 200MB). */
export const MIN_FREE_BYTES_REQUIRED = 200 * 1024 * 1024;

/** Whether the device has enough free space to download safely. */
export function meetsStorageRequirement(
  freeBytes: number,
  requiredBytes: number = MIN_FREE_BYTES_REQUIRED,
): boolean {
  return freeBytes >= requiredBytes;
}

/**
 * Whether an on-disk file size is acceptable: an exact match when the expected
 * size is known, otherwise above the partial-download floor.
 */
export function isValidModelSize(
  actualBytes: number,
  expected: number = MODEL_EXPECTED_BYTES,
  minValid: number = MODEL_MIN_VALID_BYTES,
): boolean {
  if (expected > 0) {
    return actualBytes === expected;
  }
  return actualBytes >= minValid;
}

/** Clamp a written/total ratio to [0, 1]. */
export function computeProgress(writtenBytes: number, totalBytes: number): number {
  if (!totalBytes || totalBytes <= 0) {
    return 0;
  }
  const fraction = writtenBytes / totalBytes;
  if (fraction < 0) return 0;
  if (fraction > 1) return 1;
  return fraction;
}

/** Human-readable byte size (e.g. for "uses ~100MB" copy upstream). */
export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const units = ['KB', 'MB', 'GB'];
  let value = bytes / 1024;
  let unitIndex = 0;
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }
  return `${value.toFixed(1)} ${units[unitIndex]}`;
}
