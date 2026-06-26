/**
 * Cultural setting library for Kwento Mode (spec 5.8).
 *
 * Each setting carries the vocabulary, natural subject fits, sample characters,
 * and an explicit anti-stereotype note that the prompt builder folds into the
 * system prompt so generated stories stay authentic and respectful. Pure data
 * module — no native imports.
 */
import type { KwentoCulturalSetting, KwentoLanguage } from '../types/kwento.types';

export interface CulturalSettingDef {
  /** Display name. */
  name: string;
  /** One-line description of the setting. */
  description: string;
  /** Subjects that arise naturally here. */
  naturalSubjects: string[];
  /** Register-specific vocabulary to seed authentic language. */
  vocabulary: Partial<Record<KwentoLanguage, string[]>>;
  /** Problem types that emerge organically from this setting. */
  naturalProblems: string[];
  /** Example character archetypes (Filipino names / roles). */
  sampleCharacters: string[];
  /** Anti-stereotype guidance injected into the prompt. */
  avoidStereotypes: string;
}

export const CULTURAL_SETTINGS: Record<KwentoCulturalSetting, CulturalSettingDef> = {
  palengke: {
    name: 'Palengke',
    description: 'Wet market / public market',
    naturalSubjects: ['Math', 'Science', 'Araling Panlipunan'],
    vocabulary: {
      tagalog: ['tindera', 'presyo', 'timbang', 'sukli', 'kilo', 'dosenang'],
      taglish: ['bili', 'how much', 'per kilo', 'change', 'total'],
    },
    naturalProblems: [
      'money computation',
      'weight and measurement',
      'fractions (half kilo)',
      'ratio (price per unit)',
      'food science',
    ],
    sampleCharacters: ['Si Nanay', 'Si Aling Rosa', 'Si Pedro na estudyante'],
    avoidStereotypes:
      'Do not depict palengke as dirty or chaotic. It is a vibrant, busy community hub.',
  },

  laro_sa_kalye: {
    name: 'Laro sa Kalye',
    description: 'Street games (patintero, sipa, tumbang preso, agawan base)',
    naturalSubjects: ['Math', 'Physics', 'PE'],
    vocabulary: {
      tagalog: ['linya', 'tayaan', 'bola', 'distansya', 'kalaro', 'panalo'],
      taglish: ['score', 'player', 'point', 'round', 'team'],
    },
    naturalProblems: [
      'distance and speed',
      'probability (who wins)',
      'geometry (lines and boundaries)',
      'forces and motion',
    ],
    sampleCharacters: ['Si Jun', 'Si Ate Maria', 'ang grupo ni Berto'],
    avoidStereotypes:
      'Depict games as joyful, social activities. Do not associate with poverty.',
  },

  lakad_pauwi: {
    name: 'Lakad Pauwi',
    description: 'Walking home from school, observing surroundings',
    naturalSubjects: ['Science', 'Math', 'Filipino'],
    vocabulary: {
      tagalog: ['kalye', 'puno', 'langit', 'ulap', 'hangin', 'oras', 'panahon'],
      taglish: ['after school', 'walk home', 'along the way', 'sabi niya'],
    },
    naturalProblems: [
      'time and distance',
      'scientific observation (weather, plants, animals)',
      'estimation',
    ],
    sampleCharacters: ['Si Mia', 'Si Kuya Andoy', 'mag-bestfriends na si Ana at Nina'],
    avoidStereotypes:
      'Depict neighborhoods as safe, familiar, and community-oriented.',
  },

  tindahan: {
    name: 'Tindahan ng Kapitbahay',
    description: 'Sari-sari store / neighborhood convenience store',
    naturalSubjects: ['Math', 'Science'],
    vocabulary: {
      tagalog: ['paninda', 'utang', 'suki', 'pasukin', 'labasan', 'stock'],
      taglish: ['piso', 'share', 'per piece', 'abutin', 'bayad'],
    },
    naturalProblems: [
      'fractions and sharing',
      'basic bookkeeping',
      'ratios',
      'percentages',
      'simple interest (utang)',
    ],
    sampleCharacters: ['Si Aling Nena', 'Si Mang Boy', 'ang bata sa gilid'],
    avoidStereotypes:
      'Tindahan is a community institution, not just a small business. Show community relationships.',
  },

  palaruan: {
    name: 'Palaruan / Gym',
    description: 'Playground, school gym, or sports area',
    naturalSubjects: ['Physics', 'Math', 'PE'],
    vocabulary: {
      tagalog: ['palaruan', 'ehersisyo', 'takbo', 'tulon', 'anggulo'],
      taglish: ['playground', 'exercise', 'practice', 'score', 'energy'],
    },
    naturalProblems: [
      'forces (push, pull, gravity)',
      'angles (throwing, jumping)',
      'speed and distance',
      'measurement',
    ],
    sampleCharacters: ['Si Coach Reyes', 'ang basketball team', 'si Luz na bata'],
    avoidStereotypes: 'Show diverse participation. Not only boys play sports.',
  },

  bahay: {
    name: 'Bahay',
    description: 'Home — cooking, chores, family activities',
    naturalSubjects: ['Math', 'Science', 'Home Economics'],
    vocabulary: {
      tagalog: ['lutuin', 'sangkap', 'sukat', 'kulo', 'ihalo', 'amoy', 'temperatura'],
      taglish: ['recipe', 'tablespoon', 'boil', 'mix', 'cool down'],
    },
    naturalProblems: [
      'measurement (cups, tablespoons)',
      'temperature and states of matter',
      'chemical reactions (cooking = chemistry)',
      'ratios in recipes',
    ],
    sampleCharacters: ['Si Lola Caring', 'Si Tatay', 'ang pamilya'],
    avoidStereotypes:
      'Show both male and female family members cooking and doing chores.',
  },

  eskwelahan: {
    name: 'Eskwelahan',
    description: 'School — classroom, canteen, hallways, science lab',
    naturalSubjects: ['Any MELC topic'],
    vocabulary: {
      tagalog: ['guro', 'klase', 'proyekto', 'grupong-gawain', 'eksperimento'],
      taglish: ['project', 'teacher', 'classmates', 'experiment', 'activity'],
    },
    naturalProblems: ['Any subject — neutral setting for all topics'],
    sampleCharacters: ['Si Guro Santos', 'ang grupo ni Liza', 'si buong klase'],
    avoidStereotypes:
      'Show inclusive classrooms. Both male and female students participate equally.',
  },
};

/** All setting ids, ordered. Useful for iteration / validation / UI. */
export const CULTURAL_SETTING_IDS = Object.keys(
  CULTURAL_SETTINGS,
) as KwentoCulturalSetting[];

/** Type guard: is an arbitrary string a known cultural setting? */
export function isCulturalSetting(value: string): value is KwentoCulturalSetting {
  return Object.prototype.hasOwnProperty.call(CULTURAL_SETTINGS, value);
}
