/**
 * Parse + validate the model's Kwento Mode JSON response (pure).
 *
 * Models occasionally wrap JSON in a ```json fence or return prose instead of
 * JSON. parseKwentoResponse strips any fence, parses, validates the four
 * required string fields, and normalizes the enum-like fields against the known
 * sets. Anything malformed degrades to a deterministic fallback so the UI always
 * has a renderable kwento.
 */
import { isCulturalSetting } from '../constants/culturalSettings';
import { KWENTO_FALLBACK } from '../constants/kwentoDefaults';
import type {
  KwentoCulturalSetting,
  KwentoDifficulty,
  KwentoLanguage,
  KwentoModeRequest,
  KwentoModeResponse,
  KwentoTierId,
} from '../types/kwento.types';

const DIFFICULTIES: readonly KwentoDifficulty[] = ['easy', 'medium', 'hard'];
const LANGUAGES: readonly KwentoLanguage[] = ['tagalog', 'taglish', 'english'];

/** Required string fields that must be present and non-empty to trust the JSON. */
const REQUIRED_FIELDS = ['kwento', 'tanong', 'hint', 'suliranin_sagot'] as const;

/** tierId implied by whether the request ran offline, unless explicitly provided. */
function defaultTierId(request: KwentoModeRequest): KwentoTierId {
  return request.isOffline ? 3 : 1;
}

/** Remove a leading/trailing markdown code fence (```json ... ```), if present. */
function stripCodeFence(raw: string): string {
  return raw
    .replace(/```json\s*/gi, '')
    .replace(/```/g, '')
    .trim();
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function coerceSetting(value: unknown, fallback: KwentoCulturalSetting): KwentoCulturalSetting {
  return typeof value === 'string' && isCulturalSetting(value) ? value : fallback;
}

function coerceDifficulty(value: unknown, fallback: KwentoDifficulty): KwentoDifficulty {
  return DIFFICULTIES.includes(value as KwentoDifficulty)
    ? (value as KwentoDifficulty)
    : fallback;
}

function coerceLanguage(value: unknown, fallback: KwentoLanguage): KwentoLanguage {
  return LANGUAGES.includes(value as KwentoLanguage)
    ? (value as KwentoLanguage)
    : fallback;
}

function coerceCharacterNames(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) {
    return undefined;
  }
  const names = value.filter((v): v is string => typeof v === 'string' && v.trim().length > 0);
  return names.length > 0 ? names : undefined;
}

/**
 * Parse a raw model response into a validated KwentoModeResponse. Falls back to
 * a safe, renderable response when the payload is not valid, complete JSON.
 */
export function parseKwentoResponse(
  rawResponse: string,
  request: KwentoModeRequest,
  tierId: KwentoTierId = defaultTierId(request),
): KwentoModeResponse {
  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(stripCodeFence(rawResponse)) as Record<string, unknown>;
  } catch {
    return buildFallbackResponse(rawResponse, request, tierId);
  }

  for (const field of REQUIRED_FIELDS) {
    if (!isNonEmptyString(parsed[field])) {
      return buildFallbackResponse(rawResponse, request, tierId);
    }
  }

  const fallbackSetting = request.culturalSetting ?? 'eskwelahan';

  return {
    id: generateKwentoId(),
    kwento: parsed.kwento as string,
    tanong: parsed.tanong as string,
    hint: parsed.hint as string,
    suliranin_sagot: parsed.suliranin_sagot as string,
    melc_topic: isNonEmptyString(parsed.melc_topic) ? parsed.melc_topic : request.melcTopic,
    grade_level:
      typeof parsed.grade_level === 'number' ? parsed.grade_level : request.gradeLevel,
    setting: coerceSetting(parsed.setting, fallbackSetting),
    difficulty: coerceDifficulty(parsed.difficulty, request.difficulty),
    language_used: coerceLanguage(parsed.language_used, request.languagePreference),
    follow_up: isNonEmptyString(parsed.follow_up) ? parsed.follow_up : '',
    character_names: coerceCharacterNames(parsed.character_names),
    generatedAt: new Date(),
    tierId,
  };
}

/**
 * Build a minimal, valid response from an unparseable generation: the raw text
 * (trimmed) becomes the kwento, with localized fallback tanong/hint so the
 * screen still works.
 */
export function buildFallbackResponse(
  raw: string,
  request: KwentoModeRequest,
  tierId: KwentoTierId = defaultTierId(request),
): KwentoModeResponse {
  return {
    id: generateKwentoId(),
    kwento: stripCodeFence(raw).slice(0, 800),
    tanong: KWENTO_FALLBACK.tanong,
    hint: KWENTO_FALLBACK.hint,
    suliranin_sagot: KWENTO_FALLBACK.suliranin_sagot,
    melc_topic: request.melcTopic,
    grade_level: request.gradeLevel,
    setting: request.culturalSetting ?? 'eskwelahan',
    difficulty: request.difficulty,
    language_used: request.languagePreference,
    follow_up: '',
    character_names: undefined,
    generatedAt: new Date(),
    tierId,
  };
}

/** Generate a unique-enough id for a kwento (also its kwento_cache PK). */
export function generateKwentoId(): string {
  return `kwento_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
}
