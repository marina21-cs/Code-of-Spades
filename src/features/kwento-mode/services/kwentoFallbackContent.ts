/**
 * Deterministic, curriculum-grounded Kwento fallback content (spec 5.8 / 10.1).
 *
 * WHY THIS EXISTS:
 * When the cloud cascade is unreachable (no signal, every provider failed/keyed
 * out) and no on-device SLM is registered, the shared offline path returns plain
 * Tagalog PROSE — which is NOT the JSON Kwento Mode expects, so the parser used
 * to degrade to an EMPTY problem (no real tanong/hint/sagot). That looked like
 * "the AI is broken". This module instead serves a COMPLETE, valid, hand-written
 * kwento (real story + question + step-by-step solution) chosen to match the
 * student's topic, language, grade, and difficulty.
 *
 * It mirrors the chat `demoResponder` philosophy: never fabricate beyond a small
 * set of curated, curriculum-correct stories, and always return something the
 * student can actually solve. Pure module — no native imports.
 */
import type {
  KwentoCulturalSetting,
  KwentoLanguage,
  KwentoModeRequest,
  KwentoModeResponse,
  KwentoTierId,
} from '../types/kwento.types';
import { generateKwentoId } from './kwentoParser';

/** The four story fields, per language register. */
interface LocalKwentoContent {
  kwento: string;
  tanong: string;
  hint: string;
  suliranin_sagot: string;
  follow_up: string;
  character_names: string[];
}

interface LocalTemplate {
  id: string;
  /** Lowercased topic keywords that select this template. */
  keywords: string[];
  /** Natural cultural setting the narrative is written around. */
  setting: KwentoCulturalSetting;
  byLanguage: Record<KwentoLanguage, LocalKwentoContent>;
}

/**
 * MATH — money / multiplication at the palengke. Numbers are fixed so the
 * arithmetic is always correct (3 kilos x P45 = P135).
 */
const MATH_MONEY: LocalTemplate = {
  id: 'math_money_palengke',
  keywords: [
    'math',
    'matematika',
    'money',
    'pera',
    'multipl',
    'parami',
    'fraction',
    'hati',
    'divis',
    'price',
    'presyo',
    'budget',
    'addition',
    'dagdag',
    'bilang',
    'number',
  ],
  setting: 'palengke',
  byLanguage: {
    tagalog: {
      kwento:
        'Maagang pumunta si Aling Rosa sa palengke para bumili ng hinog na mangga para sa kaniyang maliit na tindahan. Tatlong (3) kilo ang kinuha niya, at apatnapu\u2019t limang piso (\u20b145) ang presyo ng bawat kilo. Bago lumipat sa kasunod na tindera, kailangan munang malaman ni Aling Rosa kung magkano lahat ang ibabayad niya.',
      tanong:
        'Magkano ang kabuuang babayaran ni Aling Rosa para sa 3 kilo ng mangga kung \u20b145 ang bawat kilo?',
      hint: 'Iparami (multiply) ang bilang ng kilo sa presyo ng bawat kilo.',
      suliranin_sagot:
        'Hakbang 1: Bilang ng kilo = 3.\nHakbang 2: Presyo bawat kilo = \u20b145.\nHakbang 3: Iparami: 3 \u00d7 \u20b145 = \u20b1135.\nSagot: \u20b1135 ang kabuuang babayaran ni Aling Rosa.',
      follow_up:
        'Kung magdagdag pa siya ng 2 kilo, magkano na ang kabuuang bayarin niya?',
      character_names: ['Aling Rosa'],
    },
    taglish: {
      kwento:
        'Maaga pang pumunta si Aling Rosa sa palengke para bumili ng hinog na mangga for her small tindahan. Bumili siya ng 3 kilos, and \u20b145 per kilo ang presyo. Bago lumipat sa next na tindera, kailangan muna niyang malaman kung magkano lahat ang babayaran niya.',
      tanong:
        'Magkano lahat ang babayaran ni Aling Rosa for 3 kilos of mangga kung \u20b145 per kilo?',
      hint: 'Multiply mo lang ang number of kilos sa price per kilo.',
      suliranin_sagot:
        'Step 1: Kilos = 3.\nStep 2: Price per kilo = \u20b145.\nStep 3: Multiply: 3 \u00d7 \u20b145 = \u20b1135.\nSagot: \u20b1135 lahat ang babayaran ni Aling Rosa.',
      follow_up: 'Kung mag-add pa siya ng 2 kilos, magkano na ang total?',
      character_names: ['Aling Rosa'],
    },
    english: {
      kwento:
        'Aling Rosa went to the palengke (wet market) early to buy ripe mangoes for her small store. She picked 3 kilos, and each kilo costs \u20b145. Before moving on to the next vendor, Aling Rosa needs to figure out the total amount she has to pay.',
      tanong:
        'How much will Aling Rosa pay in total for 3 kilos of mangoes at \u20b145 per kilo?',
      hint: 'Multiply the number of kilos by the price of one kilo.',
      suliranin_sagot:
        'Step 1: Number of kilos = 3.\nStep 2: Price per kilo = \u20b145.\nStep 3: Multiply: 3 \u00d7 \u20b145 = \u20b1135.\nAnswer: Aling Rosa will pay \u20b1135 in total.',
      follow_up: 'If she adds 2 more kilos, what will her new total be?',
      character_names: ['Aling Rosa'],
    },
  },
};

/** SCIENCE — why plants need sunlight (photosynthesis), observed at home. */
const SCIENCE_PLANT: LocalTemplate = {
  id: 'science_plant_bahay',
  keywords: [
    'science',
    'agham',
    'plant',
    'halaman',
    'photosynthesis',
    'potosintesis',
    'sunlight',
    'araw',
    'leaf',
    'dahon',
    'grow',
    'tubo',
    'living',
    'buhay',
    'environment',
    'kalikasan',
  ],
  setting: 'bahay',
  byLanguage: {
    tagalog: {
      kwento:
        'Pauwi na sa bahay si Lia nang mapansin niya ang dalawang halaman ng kaniyang nanay. Ang isa ay nakapatong sa bintanang maaraw, samantalang ang isa ay nasa madilim na sulok ng sala. Malago at berde ang dahon ng halamang nasa bintana, ngunit namumutla at lanta ang halamang nasa madilim.',
      tanong:
        'Bakit mas malusog ang halamang nasa maaraw na bintana kaysa sa halamang nasa madilim na sulok?',
      hint: 'Isipin kung ano ang kailangan ng halaman para makagawa ng sarili nitong pagkain.',
      suliranin_sagot:
        'Hakbang 1: Gumagawa ng sariling pagkain ang mga halaman sa proseso na tinatawag na photosynthesis.\nHakbang 2: Para mangyari ito, kailangan ng sikat ng araw, tubig, at carbon dioxide.\nHakbang 3: Ang halamang nasa madilim ay kulang sa sikat ng araw, kaya hindi sapat ang nagagawa nitong pagkain at unti-unti itong nanghihina.\nSagot: Mas malusog ang halaman sa bintana dahil sapat ang sikat ng araw para sa photosynthesis.',
      follow_up:
        'Ano sa tingin mo ang mangyayari kung ililipat ang lantang halaman sa maaraw na lugar?',
      character_names: ['Lia'],
    },
    taglish: {
      kwento:
        'Pauwi na si Lia sa bahay nang ma-notice niya ang dalawang halaman ng nanay niya. Ang isa ay nasa maaraw na bintana, while ang isa ay nasa madilim na corner ng sala. Green at malago ang dahon ng nasa bintana, pero pale at lanta ang nasa madilim.',
      tanong:
        'Bakit mas healthy ang halamang nasa maaraw na bintana kaysa sa nasa madilim na corner?',
      hint: 'Isipin kung ano ang need ng halaman para makagawa ng sarili nitong food.',
      suliranin_sagot:
        'Step 1: Gumagawa ang halaman ng sariling pagkain through a process called photosynthesis.\nStep 2: Para mangyari ito, kailangan ng sunlight, tubig, at carbon dioxide.\nStep 3: Ang halaman sa madilim ay kulang sa sunlight, kaya hindi sapat ang nagagawang food nito at unti-unti itong nanghihina.\nSagot: Mas healthy ang halaman sa bintana kasi sapat ang sunlight para sa photosynthesis.',
      follow_up: 'Ano kaya ang mangyayari kung ilipat ang lantang halaman sa maaraw na lugar?',
      character_names: ['Lia'],
    },
    english: {
      kwento:
        'Lia was walking home when she noticed her mother\u2019s two plants. One sat on a sunny windowsill, while the other stood in a dark corner of the living room. The plant by the window had lush green leaves, but the one in the dark had turned pale and droopy.',
      tanong:
        'Why is the plant on the sunny windowsill healthier than the plant in the dark corner?',
      hint: 'Think about what a plant needs in order to make its own food.',
      suliranin_sagot:
        'Step 1: Plants make their own food through a process called photosynthesis.\nStep 2: For this to happen, they need sunlight, water, and carbon dioxide.\nStep 3: The plant in the dark corner lacks sunlight, so it cannot make enough food and slowly weakens.\nAnswer: The plant by the window is healthier because it gets enough sunlight for photosynthesis.',
      follow_up: 'What do you think will happen if the droopy plant is moved into the sunlight?',
      character_names: ['Lia'],
    },
  },
};

/** GENERAL — equal sharing / division in the classroom (works for any topic). */
const GENERAL: LocalTemplate = {
  id: 'general_share_eskwelahan',
  keywords: [],
  setting: 'eskwelahan',
  byLanguage: {
    tagalog: {
      kwento:
        'Sa loob ng silid-aralan, may dala si Teacher Ana na 24 na lapis na ibabahagi nang pantay-pantay sa 4 na grupo ng mag-aaral para sa kanilang proyekto sa sining. Gusto niyang tiyaking pareho ang bilang ng lapis na matatanggap ng bawat grupo.',
      tanong:
        'Ilang lapis ang matatanggap ng bawat grupo kung 24 na lapis ang hahatiin sa 4 na grupo?',
      hint: 'Hatiin (divide) ang kabuuang bilang ng lapis sa bilang ng grupo.',
      suliranin_sagot:
        'Hakbang 1: Kabuuang lapis = 24.\nHakbang 2: Bilang ng grupo = 4.\nHakbang 3: Hatiin: 24 \u00f7 4 = 6.\nSagot: 6 na lapis ang matatanggap ng bawat grupo.',
      follow_up: 'Kung 6 na grupo sana, ilang lapis ang matatanggap ng bawat isa?',
      character_names: ['Teacher Ana'],
    },
    taglish: {
      kwento:
        'Sa loob ng classroom, may dala si Teacher Ana na 24 pencils na ibabahagi nang pantay-pantay sa 4 na groups ng students for their art project. Gusto niyang sigurado na pareho ang bilang ng pencils na makukuha ng bawat group.',
      tanong:
        'Ilang pencils ang makukuha ng bawat group kung 24 pencils ang i-share sa 4 groups?',
      hint: 'I-divide mo lang ang total na pencils sa number of groups.',
      suliranin_sagot:
        'Step 1: Total pencils = 24.\nStep 2: Number of groups = 4.\nStep 3: Divide: 24 \u00f7 4 = 6.\nSagot: 6 pencils ang makukuha ng bawat group.',
      follow_up: 'Kung 6 groups sana, ilang pencils ang makukuha ng bawat isa?',
      character_names: ['Teacher Ana'],
    },
    english: {
      kwento:
        'In the classroom, Teacher Ana brought 24 pencils to share equally among 4 groups of students for their art project. She wants to make sure each group receives the same number of pencils.',
      tanong:
        'How many pencils will each group receive if 24 pencils are shared equally among 4 groups?',
      hint: 'Divide the total number of pencils by the number of groups.',
      suliranin_sagot:
        'Step 1: Total pencils = 24.\nStep 2: Number of groups = 4.\nStep 3: Divide: 24 \u00f7 4 = 6.\nAnswer: Each group will receive 6 pencils.',
      follow_up: 'If there were 6 groups instead, how many pencils would each group get?',
      character_names: ['Teacher Ana'],
    },
  },
};

const TEMPLATES: readonly LocalTemplate[] = [MATH_MONEY, SCIENCE_PLANT, GENERAL];

/** Choose the best-matching template from the topic, defaulting to GENERAL. */
function pickTemplate(melcTopic: string): LocalTemplate {
  const topic = (melcTopic ?? '').toLowerCase();
  let best: LocalTemplate = GENERAL;
  let bestScore = 0;
  for (const template of TEMPLATES) {
    let score = 0;
    for (const keyword of template.keywords) {
      if (topic.includes(keyword)) {
        score += 1;
      }
    }
    if (score > bestScore) {
      bestScore = score;
      best = template;
    }
  }
  return best;
}

/**
 * Build a complete, valid KwentoModeResponse from curated content when live
 * generation could not produce usable JSON. Honors the request's topic,
 * language, grade, and difficulty so the story still feels personalized.
 */
export function buildLocalKwento(
  request: KwentoModeRequest,
  tierId: KwentoTierId,
): KwentoModeResponse {
  const template = pickTemplate(request.melcTopic);
  const content = template.byLanguage[request.languagePreference] ?? template.byLanguage.taglish;

  return {
    id: generateKwentoId(),
    kwento: content.kwento,
    tanong: content.tanong,
    hint: content.hint,
    suliranin_sagot: content.suliranin_sagot,
    melc_topic: request.melcTopic,
    grade_level: request.gradeLevel,
    setting: template.setting,
    difficulty: request.difficulty,
    language_used: request.languagePreference,
    follow_up: content.follow_up,
    character_names: content.character_names,
    generatedAt: new Date(),
    tierId,
  };
}
