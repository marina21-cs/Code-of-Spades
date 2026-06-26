/**
 * Local misconception taxonomy (spec 5.9, "Known Misconception Taxonomy").
 *
 * Ships with the app and serves two jobs:
 *   1. ONLINE — the matching entries for a topic are injected into the detection
 *      prompt as "known wrong beliefs to watch for" (RAG augmentation), which
 *      raises detection accuracy (spec 10.1 mitigation #2).
 *   2. OFFLINE (Tier 3) — SmolLM2 cannot reliably diagnose misconceptions, so
 *      detection degrades to a pure keyword lookup here; a matched entry serves
 *      its PRE-WRITTEN explanation rather than an AI-generated one (spec 5.9
 *      "Offline (Tier 3)" + 10.1 mitigation #5). 100% accurate for mapped beliefs.
 *
 * Pure data module — no native imports — so it is headlessly verifiable.
 */
import type { MisconceptionTaxonomyEntry } from '../types/misconception.types';

/**
 * The seeded taxonomy. This is the demo/MVP subset described in spec 11 (5-10
 * pre-loaded misconceptions); the full corpus is synced from the backend later.
 * Beliefs are phrased the way Filipino students actually say them.
 */
export const MISCONCEPTION_TAXONOMY: readonly MisconceptionTaxonomyEntry[] = [
  // --- Science · Grade 3-6 -------------------------------------------------
  {
    id: 'science_photosynthesis_soil',
    subject: 'science',
    gradeBand: 'Grade 3-6',
    topic: 'photosynthesis',
    wrongBelief: 'Ang halaman ay kumakain ng lupa (soil is the plant\u2019s food).',
    misconceptionType: 'WRONG_CAUSATION',
    keywords: ['photosynthesis', 'plant', 'halaman', 'soil', 'lupa', 'kumakain', 'eat', 'pagkain', 'food'],
    correctUnderstanding:
      'Plants make their own food from sunlight, water, and carbon dioxide. Soil mainly provides water and minerals, not food.',
    targetedExplanation:
      'Madaling isipin na lupa ang pagkain ng halaman kasi dun naka-ugat, di ba? Pero ang totoo, ang halaman mismo ang gumagawa ng pagkain niya gamit ang sikat ng araw, tubig, at hangin (CO\u2082). Ang lupa ay para sa tubig at minerals lang \u2014 parang inumin, hindi ulam.',
  },
  {
    id: 'science_photosynthesis_night',
    subject: 'science',
    gradeBand: 'Grade 3-6',
    topic: 'photosynthesis',
    wrongBelief: 'Nagpo-photosynthesis pa rin ang halaman kahit gabi.',
    misconceptionType: 'WRONG_DEFINITION',
    keywords: ['photosynthesis', 'gabi', 'night', 'madilim', 'dark', 'araw', 'sunlight', 'liwanag'],
    correctUnderstanding:
      'Photosynthesis needs light, so it happens during the day. At night plants only respire (they still take in oxygen and release CO\u2082).',
    targetedExplanation:
      'Tama ka na mahalaga ang araw sa halaman! Pero dahil dyan, hindi na nagpo-photosynthesis sa gabi \u2014 walang ilaw na panggatong. Sa gabi, humihinga pa rin sila (respiration), pero ang paggawa ng pagkain ay tumitigil hanggang sumikat ulit ang araw.',
  },
  {
    id: 'science_gravity_heavier_faster',
    subject: 'science',
    gradeBand: 'Grade 3-6',
    topic: 'gravity',
    wrongBelief: 'Mas mabilis bumagsak ang mas mabigat na bagay.',
    misconceptionType: 'WRONG_CAUSATION',
    keywords: ['gravity', 'bagsak', 'fall', 'mabigat', 'heavy', 'mabilis', 'bigat', 'weight', 'drop'],
    correctUnderstanding:
      'Ignoring air resistance, all objects fall at the same rate regardless of weight. A feather falls slower only because of air, not weight.',
    targetedExplanation:
      'Parang lohika nga na mas mabigat = mas mabilis bumagsak, pero hindi ang bigat ang dahilan. Kung wala ang hangin, sabay bumabagsak ang bato at papel. Ang dahan-dahan ng papel ay dahil sa hangin na humaharang, hindi dahil magaan ito.',
  },
  {
    id: 'science_water_cycle_sea',
    subject: 'science',
    gradeBand: 'Grade 3-6',
    topic: 'water cycle',
    wrongBelief: 'Ang ulan ay tubig-dagat na direktang umakyat sa langit.',
    misconceptionType: 'WRONG_CAUSATION',
    keywords: ['water cycle', 'ulan', 'rain', 'dagat', 'sea', 'tubig', 'evaporation', 'singaw', 'ulap', 'cloud'],
    correctUnderstanding:
      'Sea water evaporates (turns to vapor), rises, cools into clouds, then falls as rain. The salt is left behind, which is why rain is not salty.',
    targetedExplanation:
      'Malapit ka na! Galing nga sa dagat ang tubig, pero hindi ito basta umaakyat na buo. Una, sumisingaw ito (evaporation) \u2014 vapor na lang ang umaakyat, naiiwan ang asin. Kaya nga hindi maalat ang ulan. Sa taas, lumalamig ito, nagiging ulap, tapos bumabagsak bilang ulan.',
  },
  {
    id: 'science_states_ice_air',
    subject: 'science',
    gradeBand: 'Grade 3-6',
    topic: 'states of matter',
    wrongBelief: 'May hangin sa loob ng yelo kaya ito malamig.',
    misconceptionType: 'WRONG_CAUSATION',
    keywords: ['states of matter', 'yelo', 'ice', 'malamig', 'cold', 'hangin', 'air', 'tubig', 'water', 'frozen'],
    correctUnderstanding:
      'Ice is just water in solid form. It is cold because heat was removed (freezing), not because air is trapped inside.',
    targetedExplanation:
      'Ang yelo ay tubig din lang \u2014 nag-solid kasi inalis ang init nito (freezing). Hindi hangin ang nasa loob ang dahilan ng lamig; ang lamig ay dahil mababa ang temperatura nito. Pag tumunaw, babalik itong tubig \u2014 walang hangin na lalabas.',
  },

  // --- Science · Grade 7-10 ------------------------------------------------
  {
    id: 'science_evolution_lifetime',
    subject: 'science',
    gradeBand: 'Grade 7-10',
    topic: 'evolution',
    wrongBelief: 'Nag-a-adapt ang isang hayop habang buhay ito.',
    misconceptionType: 'WRONG_DEFINITION',
    keywords: ['evolution', 'adapt', 'hayop', 'animal', 'habang buhay', 'lifetime', 'species', 'natural selection'],
    correctUnderstanding:
      'Adaptation happens across generations through natural selection, not within a single organism\u2019s lifetime. Individuals do not evolve; populations do.',
    targetedExplanation:
      'Common talaga itong mix-up. Hindi nagbabago ang isang hayop para mag-survive habang buhay ito \u2014 ang nagbabago ay ang BUONG species sa paglipas ng maraming henerasyon. Yung mga may angkop na katangian ay mas nakaka-survive at nakaka-pagpasa ng genes. Kaya population ang nag-e-evolve, hindi ang isang indibidwal.',
  },
  {
    id: 'science_seasons_distance',
    subject: 'science',
    gradeBand: 'Grade 7-10',
    topic: 'seasons',
    wrongBelief: 'Mainit sa tag-araw kasi mas malapit ang Earth sa araw.',
    misconceptionType: 'WRONG_CAUSATION',
    keywords: ['seasons', 'tag-araw', 'summer', 'mainit', 'hot', 'malapit', 'distance', 'araw', 'sun', 'tilt', 'season'],
    correctUnderstanding:
      'Seasons are caused by the tilt of the Earth\u2019s axis, which changes how directly sunlight hits a region \u2014 not by distance from the sun.',
    targetedExplanation:
      'Logical isipin na init = lapit, pero hindi distansya ang dahilan ng seasons. Nakatagilid (tilted) ang axis ng Earth. Pag mas diretso tumama ang sikat ng araw sa lugar mo, mas mainit \u2014 yun ang tag-init. Patunay: magkaibang season ang Northern at Southern Hemisphere kahit pareho ang layo nila sa araw.',
  },
  {
    id: 'science_electricity_returns',
    subject: 'science',
    gradeBand: 'Grade 7-10',
    topic: 'electricity',
    wrongBelief: 'Bumabalik sa baterya ang kuryente kapag naubos.',
    misconceptionType: 'DIRECTIONALITY_ERROR',
    keywords: ['electricity', 'kuryente', 'current', 'baterya', 'battery', 'circuit', 'charge', 'electron', 'naubos'],
    correctUnderstanding:
      'In a circuit, charge flows continuously in one direction around the loop. The battery supplies energy to the charges; it does not "refill" from returning charge.',
    targetedExplanation:
      'Ang andar ng circuit ay parang umiikot na tubig sa loop \u2014 tuloy-tuloy ang daloy ng charge sa isang direksyon. Hindi "bumabalik para mapuno" ang baterya; ang baterya ang NAGBIBIGAY ng energy sa dumadaloy na charge. Kapag ubos ang chemical energy ng baterya, dun na ito humihina.',
  },
  {
    id: 'science_photosynthesis_co2_waste',
    subject: 'science',
    gradeBand: 'Grade 7-10',
    topic: 'photosynthesis',
    wrongBelief: 'Ang CO\u2082 ay waste product ng photosynthesis.',
    misconceptionType: 'DIRECTIONALITY_ERROR',
    keywords: ['photosynthesis', 'co2', 'carbon dioxide', 'oxygen', 'waste', 'product', 'reactant', 'pasok', 'labas'],
    correctUnderstanding:
      'CO\u2082 is a reactant (input) of photosynthesis; oxygen is the by-product (output). The student has the direction reversed.',
    targetedExplanation:
      'Baliktad lang ang pumasok at lumabas. Sa photosynthesis, ang CO\u2082 ay PINAPASOK (reactant) \u2014 ginagamit ito ng halaman kasama ang tubig at sikat ng araw. Ang LUMALABAS (by-product) ay oxygen. Kaya nakakatulong ang halaman sa hangin natin: sinisipsip ang CO\u2082, binibigay ang oxygen.',
  },

  // --- Math · Grade 1-6 ----------------------------------------------------
  {
    id: 'math_fractions_denominator',
    subject: 'math',
    gradeBand: 'Grade 1-6',
    topic: 'fractions',
    wrongBelief: '1/3 ay mas malaki sa 1/2 kasi mas malaki ang 3.',
    misconceptionType: 'WRONG_DEFINITION',
    keywords: ['fraction', 'fractions', 'denominator', 'hati', '1/3', '1/2', 'malaki', 'bigger', 'parte', 'piraso'],
    correctUnderstanding:
      'A larger denominator means the whole is cut into more, smaller pieces. So 1/3 < 1/2: thirds are smaller than halves.',
    targetedExplanation:
      'Tingnan natin gamit ang pizza. Pag hinati mo sa 2 (1/2), malalaki ang piraso. Pag hinati sa 3 (1/3), mas marami pero mas MALILIIT ang piraso. Kaya mas malaki ang 1/2 kaysa 1/3 \u2014 mas malaki ang denominator, mas maliit ang bawat parte.',
  },
  {
    id: 'math_multiplication_bigger',
    subject: 'math',
    gradeBand: 'Grade 1-6',
    topic: 'multiplication',
    wrongBelief: 'Palaging lumalaki ang sagot kapag nagmu-multiply.',
    misconceptionType: 'OVERGENERALIZATION',
    keywords: ['multiplication', 'multiply', 'lumalaki', 'bigger', 'laki', 'product', 'fraction', 'decimal', 'beses'],
    correctUnderstanding:
      'Multiplying by a number less than 1 (a fraction or decimal) makes the result smaller. "Multiplication makes bigger" only holds for factors greater than 1.',
    targetedExplanation:
      'Totoo \u2018yan pag whole numbers ang ino-multiply (3 x 4 = 12, lumaki nga). Pero pag nag-multiply ka sa numerong mas maliit sa 1, LUMILIIT ang sagot. Halimbawa: 8 x 1/2 = 4. Parang kinuha mo lang ang kalahati. Kaya hindi laging "lumalaki" \u2014 depende sa multiplier.',
  },
  {
    id: 'math_place_value_zero',
    subject: 'math',
    gradeBand: 'Grade 1-6',
    topic: 'place value',
    wrongBelief: 'Walang halaga ang 0 sa dulo ng numero.',
    misconceptionType: 'PARTIAL_UNDERSTANDING',
    keywords: ['place value', 'zero', '0', 'dulo', 'halaga', 'value', 'numero', 'number', 'sampu', 'ten'],
    correctUnderstanding:
      'Zero by itself is nothing, but as a placeholder it sets the value of the other digits. 5 vs 50: the 0 makes the 5 worth ten times more.',
    targetedExplanation:
      'Tama ka na ang 0 mag-isa ay wala ngang halaga. Pero sa dulo ng numero, may MALAKING trabaho ito: hawak nito ang lugar (place value). Tingnan: 5 lang ay lima; pero 50, ang 0 ang nagtulak sa 5 papunta sa tens place \u2014 kaya naging limampu. Kaya importante pala \u2018yang 0.',
  },
  {
    id: 'math_word_less_subtract',
    subject: 'math',
    gradeBand: 'Grade 1-6',
    topic: 'word problems',
    wrongBelief: 'Pag may "less" sa word problem, laging subtraction.',
    misconceptionType: 'OVERGENERALIZATION',
    keywords: ['word problem', 'less', 'subtract', 'bawas', 'keyword', 'more', 'dagdag', 'less than', 'fewer'],
    correctUnderstanding:
      'Keywords are hints, not rules. "8 is 3 less than what number?" actually needs addition (8 + 3 = 11). You must read the whole situation.',
    targetedExplanation:
      'Delikado ang "keyword = operation" na shortcut. Hindi laging minus ang "less". Halimbawa: "Si Ana ay may 3 LESS than si Ben, na may 10." Para makuha si Ben... teka, basahin ang buong sitwasyon \u2014 minsan addition pala ang kailangan (8 is 3 less than 11). Intindihin ang kwento, huwag lang ang salita.',
  },

  // --- Math · Grade 7-10 ---------------------------------------------------
  {
    id: 'math_negatives_unreal',
    subject: 'math',
    gradeBand: 'Grade 7-10',
    topic: 'negative numbers',
    wrongBelief: 'Walang negatibong numero sa totoong buhay.',
    misconceptionType: 'WRONG_DEFINITION',
    keywords: ['negative', 'negatibo', 'numero', 'number', 'totoong buhay', 'real', 'utang', 'temperatura', 'debt'],
    correctUnderstanding:
      'Negative numbers model real things: debt (utang), temperature below zero, elevation below sea level, and losses.',
    targetedExplanation:
      'May kasama palang negatibo sa araw-araw! Ang utang na P50 ay -50 sa pera mo. Ang lamig na 2 degrees below zero ay -2\u00b0C. Ang lugar sa ilalim ng dagat ay negatibong elevation. Hindi sila "imahinasyon" \u2014 paraan sila para ipakita ang kulang, baba, o kabaligtaran.',
  },
  {
    id: 'math_probability_gambler',
    subject: 'math',
    gradeBand: 'Grade 7-10',
    topic: 'probability',
    wrongBelief: 'Kung 5 beses nang tails, malamang heads na sa susunod.',
    misconceptionType: 'WRONG_CAUSATION',
    keywords: ['probability', 'tails', 'heads', 'coin', 'barya', 'toss', 'chance', 'malamang', 'next', 'beses'],
    correctUnderstanding:
      'A fair coin has no memory: each toss is independent and stays 50/50, no matter what came before (the "gambler\u2019s fallacy").',
    targetedExplanation:
      'Pakiramdam mo "due na" ang heads, pero walang memorya ang barya. Bawat toss ay 50/50 pa rin \u2014 hindi nito alam na 5 beses nang tails. Independent ang bawat pagpukpok. Kaya kahit 5 tails na, 50% pa rin ang heads sa susunod, hindi mas mataas.',
  },
  {
    id: 'math_algebra_variable_fixed',
    subject: 'math',
    gradeBand: 'Grade 7-10',
    topic: 'algebra',
    wrongBelief: 'Ang variable na x ay iisang espesipikong numero lang.',
    misconceptionType: 'WRONG_DEFINITION',
    keywords: ['algebra', 'variable', 'x', 'numero', 'number', 'specific', 'value', 'unknown', 'pwede'],
    correctUnderstanding:
      'A variable can represent a range of values (a quantity that varies). In a specific equation it may resolve to one value, but x itself is a placeholder for any allowed value.',
    targetedExplanation:
      'Ang x ay hindi laging iisang sagot \u2014 placeholder ito na pwedeng maraming halaga. Sa "x + 2 = 5", oo, x = 3 lang dun. Pero sa "y = x + 1", nagbabago ang x (1, 2, 3...) at sumasabay ang y. Kaya nga tinawag itong VARIABLE \u2014 nagva-vary.',
  },
  {
    id: 'math_division_by_zero',
    subject: 'math',
    gradeBand: 'Grade 7-10',
    topic: 'division by zero',
    wrongBelief: 'May sagot ang isang numerong hinati sa zero (e.g., 5/0 = 0).',
    misconceptionType: 'WRONG_DEFINITION',
    keywords: ['division', 'divide', 'zero', '0', 'hati', 'sagot', 'undefined', 'walang', '5/0', 'divided'],
    correctUnderstanding:
      'Division by zero is undefined: there is no number that, multiplied by 0, gives a non-zero result. It is not 0 and not infinity \u2014 it has no answer.',
    targetedExplanation:
      'Ang division ay tanong na "ilang grupo?". Ang 6 \u00f7 2 = 3 kasi 3 x 2 = 6. Ngayon, 5 \u00f7 0 = ? \u2014 anong numero ang pwede mong i-multiply sa 0 para maging 5? Wala! Kahit anong numero x 0 ay 0, hindi 5. Kaya UNDEFINED ito \u2014 walang sagot, hindi 0.',
  },
];

/** Topics that the taxonomy has at least one entry for (lowercased). */
export const TAXONOMY_TOPICS: readonly string[] = Array.from(
  new Set(MISCONCEPTION_TAXONOMY.map((entry) => entry.topic.toLowerCase())),
);
