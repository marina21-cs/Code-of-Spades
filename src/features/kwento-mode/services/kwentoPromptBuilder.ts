/**
 * Kwento Mode prompt construction (pure).
 *
 * Fills the {{PLACEHOLDER}} tokens in KWENTO_SYSTEM_PROMPT, appends a
 * setting-specific authenticity block (vocabulary + anti-stereotype note), and
 * assembles the matching user prompt. A compact variant is provided for the
 * offline on-device path. No native imports → headlessly verifiable.
 */
import {
  CULTURAL_SETTINGS,
  type CulturalSettingDef,
} from '../constants/culturalSettings';
import { getComplexitySpec } from '../constants/gradeComplexity';
import {
  FALLBACK_SETTING,
  KWENTO_OFFLINE_SYSTEM_PROMPT,
  KWENTO_SYSTEM_PROMPT,
  OFFLINE_FALLBACK_SETTING,
} from '../constants/kwentoDefaults';
import type {
  GradeComplexitySpec,
  KwentoCulturalSetting,
  KwentoModeRequest,
} from '../types/kwento.types';

export interface BuiltPrompt {
  systemPrompt: string;
  userPrompt: string;
}

/**
 * Replace EVERY occurrence of each {{KEY}} token. Uses split/join rather than
 * String.replace (which only swaps the first match) — important because tokens
 * like {{GRADE_LEVEL}} appear more than once in the template.
 */
function fillTemplate(template: string, values: Record<string, string>): string {
  let result = template;
  for (const [key, value] of Object.entries(values)) {
    result = result.split(`{{${key}}}`).join(value);
  }
  return result;
}

/** One-line, model-friendly summary of the grade band's complexity envelope. */
function describeComplexity(spec: GradeComplexitySpec): string {
  const dialogue = spec.dialogueAllowed ? 'dialogue allowed' : 'no dialogue';
  const variables = spec.variablesAllowed ? 'variables allowed' : 'no variables';
  const abstract = spec.abstractReasoningRequired
    ? 'abstract reasoning required'
    : 'concrete reasoning';
  return (
    `${spec.gradeBand}: up to ${spec.maxCharacters} character(s), ` +
    `up to ${spec.maxSettings} setting(s), ${spec.problemType}, ` +
    `max ${spec.maxSentences} sentences, ${dialogue}, ${variables}, ${abstract}.`
  );
}

/**
 * Setting-specific addendum: weave-in vocabulary for the chosen language (falling
 * back to Tagalog) plus the anti-stereotype directive for that setting.
 */
function settingDetailBlock(
  setting: KwentoCulturalSetting,
  data: CulturalSettingDef,
  language: KwentoModeRequest['languagePreference'],
): string {
  const vocab = data.vocabulary[language] ?? data.vocabulary.tagalog ?? [];
  const vocabLine = vocab.length > 0 ? vocab.join(', ') : 'use natural local terms';
  return [
    `SETTING DETAIL — ${data.name} (${data.description}):`,
    `- Weave in authentic vocabulary where natural: ${vocabLine}`,
    `- Natural problem types here: ${data.naturalProblems.join('; ')}`,
    `- Avoid stereotypes: ${data.avoidStereotypes}`,
  ].join('\n');
}

/**
 * Heuristic setting selection from the topic when the caller does not pin one.
 * Keyword-matched to the setting where each problem type arises most naturally;
 * defaults to the neutral fallback that fits any topic.
 */
export function selectBestSetting(melcTopic: string): KwentoCulturalSetting {
  const topic = melcTopic.toLowerCase();
  if (topic.includes('money') || topic.includes('fraction') || topic.includes('weight')) {
    return 'palengke';
  }
  if (topic.includes('force') || topic.includes('motion') || topic.includes('speed')) {
    return 'laro_sa_kalye';
  }
  if (topic.includes('plant') || topic.includes('weather') || topic.includes('observation')) {
    return 'lakad_pauwi';
  }
  if (topic.includes('ratio') || topic.includes('percent') || topic.includes('division')) {
    return 'tindahan';
  }
  if (topic.includes('temperature') || topic.includes('mixture') || topic.includes('measurement')) {
    return 'bahay';
  }
  return FALLBACK_SETTING; // neutral: works for any topic
}

/** Build the full (online) Kwento Mode system + user prompt. */
export function buildKwentoPrompt(request: KwentoModeRequest): BuiltPrompt {
  const complexitySpec = getComplexitySpec(request.gradeLevel);
  const setting = request.culturalSetting ?? selectBestSetting(request.melcTopic);
  const settingData = CULTURAL_SETTINGS[setting];

  const filled = fillTemplate(KWENTO_SYSTEM_PROMPT, {
    GRADE_LEVEL: String(request.gradeLevel),
    MELC_TOPIC: request.melcTopic,
    LANGUAGE_PREFERENCE: request.languagePreference,
    CULTURAL_SETTING: setting,
    DIFFICULTY: request.difficulty,
    GRADE_BAND_DESCRIPTION: describeComplexity(complexitySpec),
    MELC_PASSAGE_1: request.melcPassages[0] ?? '',
    MELC_PASSAGE_2: request.melcPassages[1] ?? '',
    MELC_PASSAGE_3: request.melcPassages[2] ?? '',
  });

  const systemPrompt = `${filled}\n\n---\n\n${settingDetailBlock(
    setting,
    settingData,
    request.languagePreference,
  )}`;

  const previous = request.previousKwentoIds?.length
    ? `\n\nAvoid reusing settings/characters from these recent kwentos: ${request.previousKwentoIds.join(', ')}`
    : '';

  const competency = request.melcCompetency
    ? `\nMELC Competency: ${request.melcCompetency}`
    : '';

  const userPrompt =
    `Generate a Kwento Mode story for a Grade ${request.gradeLevel} student.\n\n` +
    `Topic: ${request.melcTopic}\n` +
    `Setting: ${setting} (${settingData.description})\n` +
    `Language: ${request.languagePreference}\n` +
    `Difficulty: ${request.difficulty}${competency}\n\n` +
    `MELC Reference:\n${request.melcPassages.join('\n\n')}${previous}`;

  return { systemPrompt, userPrompt };
}

/** Build the compact offline (Tier-3) prompt. Difficulty is effectively fixed. */
export function buildKwentoOfflinePrompt(request: KwentoModeRequest): BuiltPrompt {
  const setting = request.culturalSetting ?? OFFLINE_FALLBACK_SETTING;

  const userPrompt =
    `Grade ${request.gradeLevel} ${request.languagePreference} story about ` +
    `"${request.melcTopic}" set in ${setting}.\n\n` +
    `MELC: ${request.melcPassages[0] ?? ''}`;

  return { systemPrompt: KWENTO_OFFLINE_SYSTEM_PROMPT, userPrompt };
}
