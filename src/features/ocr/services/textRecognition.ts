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
 * The default recognizer: lazily load the native ML Kit module and run it. Throws
 * OcrNotAvailableError if the module isn't available at runtime (e.g. Expo Go or
 * a build without the native module linked).
 */
export const defaultTextRecognizer: TextRecognizer = async (imageUri: string) => {
  try {
    // Static specifier so Metro can resolve it at bundle time; still lazy (only
    // evaluated when OCR actually runs), so headless/node contexts that never
    // call this never touch the native module.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const mod: any = await import('@react-native-ml-kit/text-recognition');
    const engine = mod?.default ?? mod;
    if (engine && typeof engine.recognize === 'function') {
      return normalizeNativeResult(await engine.recognize(imageUri));
    }
  } catch {
    // Fall through to the not-available error below.
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
