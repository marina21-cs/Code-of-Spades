/**
 * On-device text-recognition boundary for Camera OCR (spec 5.5).
 *
 * The recognizer is the one native seam in the OCR pipeline. It is fully
 * INJECTABLE so the rest of the flow (clean -> chunk -> embed -> personal RAG)
 * stays pure and testable. The default attempts to load a native ML Kit module
 * lazily (so this file imports cleanly outside React Native and in headless
 * verification); if no engine is installed, it throws OcrNotAvailableError with
 * guidance rather than crashing.
 *
 * To wire the real engine, install a text-recognition module (e.g. expo-camera +
 * ML Kit, or @react-native-ml-kit/text-recognition) and either let the default
 * pick it up or pass your own TextRecognizer to recognizeText().
 */
import type { RecognizedText, TextRecognizer } from '../types/ocr.types';

/** Thrown when no OCR engine is available and none was injected. */
export class OcrNotAvailableError extends Error {
  constructor(detail?: string) {
    super(
      'No on-device OCR engine available. Install a text-recognition module ' +
        '(e.g. @react-native-ml-kit/text-recognition or expo-camera + ML Kit) ' +
        'and pass a TextRecognizer to recognizeText()/captureAndIngest()' +
        (detail ? ` [${detail}]` : '') +
        '.',
    );
    this.name = 'OcrNotAvailableError';
  }
}

/** Candidate native modules, tried in order. A variable specifier keeps tsc from
 *  requiring these (uninstalled) packages and lets the import fail gracefully. */
const NATIVE_OCR_MODULES = ['@react-native-ml-kit/text-recognition'];

/** Normalize a variety of native result shapes into our RecognizedText. */
function normalizeNativeResult(result: unknown): RecognizedText {
  const r = (result ?? {}) as { text?: unknown; blocks?: unknown };
  const fullText = typeof r.text === 'string' ? r.text : '';
  const blocks = Array.isArray(r.blocks)
    ? r.blocks
        .map((b) => (b && typeof (b as { text?: unknown }).text === 'string'
          ? (b as { text: string }).text
          : ''))
        .filter((t): t is string => t.length > 0)
    : [];
  return { fullText, blocks: blocks.length > 0 ? blocks : fullText ? [fullText] : [] };
}

/**
 * The default recognizer: lazily load a native ML Kit module and run it. Throws
 * OcrNotAvailableError if no supported module is installed.
 */
export const defaultTextRecognizer: TextRecognizer = async (imageUri: string) => {
  for (const moduleName of NATIVE_OCR_MODULES) {
    try {
      // Variable specifier: not statically resolved by tsc; resolves at runtime
      // only if the package is actually installed.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const mod: any = await import(moduleName);
      const engine = mod?.default ?? mod;
      if (engine && typeof engine.recognize === 'function') {
        return normalizeNativeResult(await engine.recognize(imageUri));
      }
    } catch {
      // Try the next candidate, then fall through to the not-available error.
    }
  }
  throw new OcrNotAvailableError('no supported native module found');
};

/**
 * Recognize text from a captured image URI. Uses the injected recognizer when
 * provided, otherwise the lazy native default.
 */
export function recognizeText(
  imageUri: string,
  recognizer: TextRecognizer = defaultTextRecognizer,
): Promise<RecognizedText> {
  return recognizer(imageUri);
}
