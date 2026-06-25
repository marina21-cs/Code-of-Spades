/**
 * On-device model binary distribution orchestrator (spec 5.2 Tier 3, spec 10).
 *
 * Responsibilities:
 *  - Refuse to start unless there is >= 200MB free (avoids filling a budget device).
 *  - Resumable download with progress + pause/resume that survives app restarts.
 *  - Verify the finished binary by size and SHA-256 before it is considered usable
 *    (a corrupt/truncated GGUF would crash llama.rn at load).
 *
 * Uses the classic FileSystem API, which on SDK 54 lives at
 * `expo-file-system/legacy` (the object-based API became the default there).
 */
import * as FileSystem from 'expo-file-system/legacy';

import { base64ToBytes } from './binary';
import {
  MIN_FREE_BYTES_REQUIRED,
  MODEL_EXPECTED_SHA256,
  MODEL_FILE_NAME,
  MODEL_ID,
  MODEL_URL,
  isValidModelSize,
  meetsStorageRequirement,
} from './modelPolicy';
import { Sha256 } from './sha256';

const MODEL_DIR = `${FileSystem.documentDirectory}models/`;
const RESUME_STATE_PATH = `${MODEL_DIR}${MODEL_ID}.resume.json`;
const HASH_CHUNK_BYTES = 4 * 1024 * 1024; // 4MB chunks keep peak memory low

export interface DownloadProgress {
  writtenBytes: number;
  totalBytes: number;
  /** 0..1 */
  progress: number;
}

export interface ModelIntegrity {
  ok: boolean;
  exists: boolean;
  sizeOk: boolean;
  /** null when no expected checksum is configured. */
  checksumOk: boolean | null;
}

export class InsufficientStorageError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InsufficientStorageError';
  }
}

export class ModelIntegrityError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ModelIntegrityError';
  }
}

/** Absolute file:// path where the model binary lives. */
export function getModelPath(): string {
  return `${MODEL_DIR}${MODEL_FILE_NAME}`;
}

async function ensureModelDir(): Promise<void> {
  const info = await FileSystem.getInfoAsync(MODEL_DIR);
  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(MODEL_DIR, { intermediates: true });
  }
}

/** Free disk space in bytes. */
export async function getFreeStorageBytes(): Promise<number> {
  return FileSystem.getFreeDiskStorageAsync();
}

/** Whether there is enough free space to download the model. */
export async function hasEnoughStorage(): Promise<boolean> {
  return meetsStorageRequirement(await getFreeStorageBytes());
}

/** Fast check: file exists with an acceptable size. Does not hash. */
export async function isModelDownloaded(): Promise<boolean> {
  const info = await FileSystem.getInfoAsync(getModelPath(), { size: true });
  if (!info.exists || info.isDirectory) {
    return false;
  }
  return isValidModelSize(info.size ?? 0);
}

let activeDownload: FileSystem.DownloadResumable | null = null;

function progressCallback(onProgress?: (p: DownloadProgress) => void) {
  return (data: FileSystem.DownloadProgressData) => {
    const total =
      data.totalBytesExpectedToWrite > 0 ? data.totalBytesExpectedToWrite : 0;
    const written = data.totalBytesWritten;
    onProgress?.({
      writtenBytes: written,
      totalBytes: total,
      progress: total > 0 ? Math.min(1, written / total) : 0,
    });
  };
}

/**
 * Download the model with progress reporting. Verifies integrity on completion
 * and deletes the file if the check fails. Throws InsufficientStorageError if
 * there is not enough free space.
 */
export async function downloadModel(
  options: { onProgress?: (p: DownloadProgress) => void } = {},
): Promise<{ uri: string }> {
  await ensureModelDir();

  if (!(await hasEnoughStorage())) {
    const free = await getFreeStorageBytes();
    throw new InsufficientStorageError(
      `Need ${MIN_FREE_BYTES_REQUIRED} bytes free; only ${free} available.`,
    );
  }

  activeDownload = FileSystem.createDownloadResumable(
    MODEL_URL,
    getModelPath(),
    {},
    progressCallback(options.onProgress),
  );

  const result = await activeDownload.downloadAsync();
  activeDownload = null;
  await clearResumeState();

  if (!result?.uri) {
    throw new Error('Model download did not complete.');
  }

  await assertIntegrityOrCleanup();
  return { uri: result.uri };
}

/** Pause an in-flight download and persist resume state. */
export async function pauseDownload(): Promise<boolean> {
  if (!activeDownload) {
    return false;
  }
  await activeDownload.pauseAsync();
  await persistResumeState(activeDownload.savable());
  return true;
}

/**
 * Resume a paused download (same session or after restart via persisted state).
 * Returns null if there is nothing to resume.
 */
export async function resumeDownload(
  options: { onProgress?: (p: DownloadProgress) => void } = {},
): Promise<{ uri: string } | null> {
  if (!activeDownload) {
    const saved = await loadResumeState();
    if (!saved) {
      return null;
    }
    activeDownload = FileSystem.createDownloadResumable(
      saved.url,
      saved.fileUri,
      saved.options,
      progressCallback(options.onProgress),
      saved.resumeData,
    );
  }

  const result = await activeDownload.resumeAsync();
  activeDownload = null;
  await clearResumeState();

  if (!result?.uri) {
    return null;
  }
  await assertIntegrityOrCleanup();
  return { uri: result.uri };
}

/** Verify the on-disk model by size and (if configured) SHA-256. */
export async function verifyModelIntegrity(): Promise<ModelIntegrity> {
  const info = await FileSystem.getInfoAsync(getModelPath(), { size: true });
  if (!info.exists || info.isDirectory) {
    return { ok: false, exists: false, sizeOk: false, checksumOk: null };
  }

  const size = info.size ?? 0;
  const sizeOk = isValidModelSize(size);

  let checksumOk: boolean | null = null;
  if (MODEL_EXPECTED_SHA256) {
    const actual = await sha256OfFile(getModelPath(), size);
    checksumOk = actual.toLowerCase() === MODEL_EXPECTED_SHA256.toLowerCase();
  }

  return { ok: sizeOk && checksumOk !== false, exists: true, sizeOk, checksumOk };
}

/** Remove the model binary and any resume state. */
export async function deleteModel(): Promise<void> {
  await FileSystem.deleteAsync(getModelPath(), { idempotent: true });
  await clearResumeState();
}

async function assertIntegrityOrCleanup(): Promise<void> {
  const integrity = await verifyModelIntegrity();
  if (!integrity.ok) {
    await deleteModel();
    throw new ModelIntegrityError(
      `Model failed integrity check (sizeOk=${integrity.sizeOk}, checksumOk=${integrity.checksumOk}).`,
    );
  }
}

/** Stream-hash a file in chunks so peak memory stays small on 2GB devices. */
async function sha256OfFile(uri: string, size: number): Promise<string> {
  const hasher = new Sha256();
  for (let position = 0; position < size; position += HASH_CHUNK_BYTES) {
    const length = Math.min(HASH_CHUNK_BYTES, size - position);
    // eslint-disable-next-line no-await-in-loop
    const base64 = await FileSystem.readAsStringAsync(uri, {
      encoding: FileSystem.EncodingType.Base64,
      position,
      length,
    });
    hasher.update(base64ToBytes(base64));
  }
  return hasher.digestHex();
}

interface SavableDownload {
  url: string;
  fileUri: string;
  options: FileSystem.DownloadOptions;
  resumeData?: string;
}

async function persistResumeState(savable: SavableDownload): Promise<void> {
  await FileSystem.writeAsStringAsync(RESUME_STATE_PATH, JSON.stringify(savable));
}

async function loadResumeState(): Promise<SavableDownload | null> {
  const info = await FileSystem.getInfoAsync(RESUME_STATE_PATH);
  if (!info.exists) {
    return null;
  }
  try {
    return JSON.parse(await FileSystem.readAsStringAsync(RESUME_STATE_PATH)) as SavableDownload;
  } catch {
    return null;
  }
}

async function clearResumeState(): Promise<void> {
  await FileSystem.deleteAsync(RESUME_STATE_PATH, { idempotent: true });
}
