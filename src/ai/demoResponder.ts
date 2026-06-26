/**
 * Built-in demo responder — provides realistic AI responses for demo / hackathon
 * presentations when no cloud API keys are configured and no local model is
 * registered. Covers common Grade 6 Science DepEd MELC topics in
 * Filipino/English (Taglish) style, matching Suri's Socratic personality.
 *
 * The responder does fuzzy keyword matching against the user's question to pick
 * the best pre-written response, then streams it word-by-word with realistic
 * delays so the UI behaves exactly like a live AI session.
 *
 * Pure module — no native imports.
 */

export interface DemoResponderParams {
  user: string;
  onToken?: (token: string) => void;
  signal?: AbortSignal;
}

interface DemoEntry {
  keywords: string[];
  response: string;
}

/**
 * Pre-written responses covering DepEd Grade 6 Science topics plus general
 * study tips. Each entry has keywords (matched case-insensitively) and a
 * Taglish response in Suri's warm, Socratic tone.
 */
const DEMO_RESPONSES: DemoEntry[] = [
  {
    keywords: ['photosynthesis', 'photosynthesis', 'halaman', 'plants', 'food', 'pagkain ng halaman', 'sunlight'],
    response:
      'Magandang tanong! 🌱 Ang photosynthesis ay ang proseso kung paano gumagawa ng pagkain ang mga halaman. Ganito ang nangyayari:\n\n' +
      '1. **Sisinghot ng halaman ang carbon dioxide** (CO₂) mula sa hangin sa pamamagitan ng mga stomata sa mga dahon.\n' +
      '2. **Sisinipsip ng tubig** (H₂O) mula sa lupa sa pamamagitan ng mga ugat.\n' +
      '3. **Gagamitin ang sikat ng araw** bilang energy source — dito pumapasok ang chlorophyll, ang green pigment sa mga dahon!\n' +
      '4. **Magiging glucose** (asukal) at **oxygen** (O₂) ang resulta.\n\n' +
      'Kaya pala berde ang mga dahon — dahil sa chlorophyll! 🍃\n\n' +
      'Tanong ko naman sa iyo: Ano sa tingin mo ang mangyayari sa halaman kung walang sikat ng araw? 🤔',
  },
  {
    keywords: ['eclipse', 'eklipse', 'lunar', 'solar', 'moon', 'buwan', 'araw', 'sun'],
    response:
      'Ayos na tanong! 🌑 May dalawang uri ng eclipse:\n\n' +
      '**Solar Eclipse (Eclipse ng Araw)** ☀️\n' +
      '- Nangyayari kapag ang Buwan ay nasa pagitan ng Araw at Lupa\n' +
      '- Nababalot ng anino ng Buwan ang bahagi ng Lupa\n' +
      '- Kaya parang "nawawala" ang Araw sa ating paningin\n\n' +
      '**Lunar Eclipse (Eclipse ng Buwan)** 🌙\n' +
      '- Nangyayari kapag ang Lupa ay nasa pagitan ng Araw at Buwan\n' +
      '- Ang anino ng Lupa ang tumatama sa Buwan\n' +
      '- Kaya parang pumupula o dumidilim ang Buwan\n\n' +
      'Paalala: Hindi lahat ng buwan ay may eclipse — kailangan na magka-align ang tatlong celestial bodies! ✨\n\n' +
      'Ano sa tingin mo, alin ang mas madalas mangyari — solar o lunar eclipse? 🤔',
  },
  {
    keywords: ['matter', 'bagay', 'solid', 'liquid', 'gas', 'states', 'katayuan'],
    response:
      'Great question! 🧪 Ang matter o bagay ay kahit anong may mass at sumasakop ng espasyo. May tatlong pangunahing estado ito:\n\n' +
      '**Solid (Solidong Bagay)** 🧊\n' +
      '- May tiyak na hugis at volume\n' +
      '- Halimbawa: yelo, bato, papel\n' +
      '- Ang mga particles ay siksikan at halos hindi gumagalaw\n\n' +
      '**Liquid (Likido)** 💧\n' +
      '- Walang tiyak na hugis pero may tiyak na volume\n' +
      '- Sumusunod sa hugis ng lalagyan\n' +
      '- Halimbawa: tubig, gatas, mantika\n\n' +
      '**Gas (Gas)** 💨\n' +
      '- Walang tiyak na hugis at volume\n' +
      '- Pumupuno sa anumang lalagyan\n' +
      '- Halimbawa: hangin, oxygen, steam\n\n' +
      'Fun fact: Ang tubig ang isa sa iilang substances na makikita sa lahat ng tatlong estado sa natural na kapaligiran! 🌊❄️☁️\n\n' +
      'Paano sa tingin mo nagbabago ang estado ng matter? Ano ang kailangan? 🤔',
  },
  {
    keywords: ['ecosystem', 'ekosistema', 'food chain', 'food web', 'kadena ng pagkain', 'producer', 'consumer'],
    response:
      'Napakagandang tanong! 🌿 Ang ecosystem ay isang komunidad ng mga living at non-living things na nag-iinteract sa isang environment.\n\n' +
      '**Sa Food Chain:**\n' +
      '1. 🌿 **Producers** (Mga Halaman) — gumagawa ng sariling pagkain sa pamamagitan ng photosynthesis\n' +
      '2. 🐛 **Primary Consumers** (Herbivores) — kumakain ng halaman (hal. kuneho, deer)\n' +
      '3. 🐍 **Secondary Consumers** (Carnivores) — kumakain ng herbivores (hal. ahas, palaka)\n' +
      '4. 🦅 **Tertiary Consumers** (Top Predators) — kumakain ng ibang carnivores (hal. agila)\n' +
      '5. 🍂 **Decomposers** — binabreak-down ang patay na organismo (hal. fungi, bacteria)\n\n' +
      'Tandaan: Kung mawawala ang isang parte ng food chain, maaapektuhan ang buong ecosystem! ⚠️\n\n' +
      'Tanong: Ano kaya ang mangyayari kung biglang mawala ang lahat ng producers sa isang ecosystem? 🤔',
  },
  {
    keywords: ['energy', 'enerhiya', 'electricity', 'kuryente', 'power', 'renewable', 'solar energy'],
    response:
      'Magaling na tanong! ⚡ Ang energy ay ang kakayahang gumawa ng trabaho o magdulot ng pagbabago.\n\n' +
      '**Mga Uri ng Energy:**\n' +
      '- ☀️ **Solar Energy** — mula sa araw\n' +
      '- 💨 **Wind Energy** — mula sa hangin\n' +
      '- 💧 **Hydroelectric** — mula sa umaagos na tubig\n' +
      '- 🔥 **Thermal/Heat Energy** — mula sa init\n' +
      '- ⚡ **Electrical Energy** — kuryente\n' +
      '- 🏃 **Kinetic Energy** — energy ng galaw\n' +
      '- 📦 **Potential Energy** — nakaimbak na energy\n\n' +
      '**Renewable vs Non-renewable:**\n' +
      '- ♻️ Renewable: solar, wind, hydro — hindi nauubos!\n' +
      '- ⛽ Non-renewable: coal, oil, natural gas — mauubos at nakakapinsala sa kalikasan\n\n' +
      'Sa Pilipinas, maraming potensyal para sa solar at wind energy dahil tropical climate tayo! 🇵🇭\n\n' +
      'Ano sa tingin mo ang pinaka-angkop na renewable energy para sa ating bansa? 🤔',
  },
  {
    keywords: ['body', 'katawan', 'organ', 'digestive', 'respiratory', 'circulatory', 'system', 'heart', 'puso', 'lungs', 'baga'],
    response:
      'Napakagandang tanong about our body! 🫀 Ang katawan natin ay may mga organ systems na nagtatrabaho nang magkakasama:\n\n' +
      '**Digestive System (Sistemang Pantunaw)** 🍽️\n' +
      '- Bunganga → Esophagus → Tiyan → Bituka → Paglabas\n' +
      '- Tinutunaw ang pagkain para maging nutrients\n\n' +
      '**Respiratory System (Sistemang Pang-paghinga)** 🫁\n' +
      '- Ilong → Lalamunan → Trachea → Bronchi → Baga\n' +
      '- Kumuha ng oxygen, palabasin ang carbon dioxide\n\n' +
      '**Circulatory System (Sistemang Pang-dugo)** ❤️\n' +
      '- Puso + Ugat + Dugo\n' +
      '- Ipinapamahagi ang oxygen at nutrients sa buong katawan\n\n' +
      'Fun fact: Ang puso mo ay tumitibok ng halos **100,000 beses** sa isang araw! 💓\n\n' +
      'Tanong ko sa iyo: Bakit kaya bumibilis ang tibok ng puso mo kapag tumatakbo ka? 🏃‍♂️🤔',
  },
  {
    keywords: ['weather', 'panahon', 'climate', 'klima', 'rain', 'ulan', 'typhoon', 'bagyo', 'cloud', 'ulap'],
    response:
      'Magandang tanong! 🌦️ Ang weather at climate ay magkaiba:\n\n' +
      '**Weather (Panahon)** — pang-araw-araw na kondisyon\n' +
      '- Maaraw, maulap, maulan, mahangin\n' +
      '- Nagbabago-bago araw-araw\n\n' +
      '**Climate (Klima)** — average na panahon sa mahabang panahon\n' +
      '- Ang Pilipinas ay may tropical climate 🌴\n' +
      '- May dalawang season: tag-ulan at tag-init\n\n' +
      '**Water Cycle (Siklo ng Tubig):** 💧\n' +
      '1. ☀️ **Evaporation** — tubig → singaw (dahil sa init ng araw)\n' +
      '2. ☁️ **Condensation** — singaw → ulap (paglalamig sa itaas)\n' +
      '3. 🌧️ **Precipitation** — ulap → ulan/snow (bumibigat ang ulap)\n' +
      '4. 🏞️ **Collection** — tubig → ilog/dagat (balik sa simula)\n\n' +
      'Sa Pilipinas, average na **20 bagyo** ang dumaraan bawat taon! 🌀\n\n' +
      'Bakit kaya mas madalas umulan sa tag-ulan kaysa sa tag-init? 🤔',
  },
  {
    keywords: ['mixture', 'halo', 'solution', 'solusyon', 'homogeneous', 'heterogeneous', 'separation'],
    response:
      'Nice question! 🧪 Ang mixture o halo-halo ay pinagsamang dalawa o higit pang substances na hindi chemically bonded:\n\n' +
      '**Homogeneous Mixture** — pantay-pantay ang halo\n' +
      '- Halimbawa: asukal sa tubig, suka, gatas\n' +
      '- Hindi mo makikita ang mga bahagi nito\n\n' +
      '**Heterogeneous Mixture** — hindi pantay ang halo\n' +
      '- Halimbawa: halo-halo 🍧, buhangin sa tubig, salad\n' +
      '- Makikita mo ang iba-ibang bahagi\n\n' +
      '**Mga Paraan ng Paghihiwalay:**\n' +
      '- 🧲 Magnet — para sa metal particles\n' +
      '- 🔬 Filtration — para sa solid sa liquid\n' +
      '- ☀️ Evaporation — para sa dissolved solids (pasingawin ang tubig)\n' +
      '- 💧 Decanting — ibaba ang likido mula sa nag-settle na solid\n\n' +
      'Alam mo ba? Ang hangin na hinihinga natin ay mixture rin — 78% nitrogen at 21% oxygen! 🌬️\n\n' +
      'Paano mo ihihiwalay ang buhangin sa asin? May idea ka ba? 🤔',
  },
  {
    keywords: ['hello', 'hi', 'kumusta', 'kamusta', 'magandang', 'good morning', 'good afternoon'],
    response:
      'Kumusta! 🦊 Ako si Suri, ang iyong AI study companion!\n\n' +
      'Handa akong tumulong sa iyo sa pag-aaral. Narito ang ilan sa pwede nating pag-usapan:\n\n' +
      '📚 **Science** — Photosynthesis, Ecosystem, Human Body, Weather\n' +
      '🔬 **Experiments** — Matter, Mixtures, Energy\n' +
      '🌍 **Earth Science** — Eclipse, Climate, Water Cycle\n' +
      '📖 **Study Tips** — Paano mag-review nang effective\n\n' +
      'Magtanong ka lang! Gagabayan kita gamit ang Socratic method — ibig sabihin, ' +
      'magtanong din ako sa iyo para mas malalim ang pag-intindi mo. 🧠✨\n\n' +
      'Ano ang gusto mong pag-aralan ngayon? 😊',
  },
  {
    keywords: ['study', 'aral', 'review', 'tip', 'paano', 'how to', 'mag-aral', 'help', 'tulong'],
    response:
      'Narito ang mga effective study tips para sa iyo! 📚✨\n\n' +
      '**1. Pomodoro Technique** 🍅\n' +
      '- Mag-aral ng 25 minuto, magpahinga ng 5 minuto\n' +
      '- Pagkatapos ng 4 na round, 15-30 min break\n\n' +
      '**2. Active Recall** 🧠\n' +
      '- Huwag basta-basta magbasa lang\n' +
      '- Takpan ang notes at subukang alalahanin\n' +
      '- Gumawa ng sariling quiz\n\n' +
      '**3. Spaced Repetition** 📅\n' +
      '- Huwag mag-cram!\n' +
      '- I-review pagkatapos ng 1 araw, 3 araw, 1 linggo\n\n' +
      '**4. Teach Someone** 👨‍🏫\n' +
      '- Ipaliwanag sa kaibigan o pamilya\n' +
      '- Kung kaya mong i-explain nang simple, naintindihan mo na talaga!\n\n' +
      '**5. Study Buddy** 🤝\n' +
      '- Kasama mo na ako bilang study buddy mo — si Suri! 🦊\n' +
      '- Gamitin ang Kasabay mode para mag-focus tayo magkasama\n\n' +
      'Alin sa mga tips na ito ang gusto mong subukan? 🤔',
  },
];

/** Generic fallback when no keyword match is found. */
const FALLBACK_RESPONSE =
  'Magandang tanong! 🦊 Bilang si Suri, handa akong tumulong sa iyo.\n\n' +
  'Para mas matulungan kita, subukan mong itanong ang mga ganitong uri ng tanong:\n\n' +
  '🌱 "Ano ang photosynthesis?"\n' +
  '🌑 "Paano nangyayari ang eclipse?"\n' +
  '🧪 "Ano ang tatlong estado ng matter?"\n' +
  '🌿 "Ano ang food chain?"\n' +
  '⚡ "Ano ang renewable energy?"\n' +
  '🫀 "Paano gumagana ang digestive system?"\n' +
  '🌦️ "Ano ang water cycle?"\n\n' +
  'Subukan mong magtanong tungkol sa Science at tutulungan kita! 😊✨';

/**
 * Score a user message against a demo entry's keywords.
 * Returns the number of keyword matches (case-insensitive).
 */
function scoreMatch(userLower: string, entry: DemoEntry): number {
  let score = 0;
  for (const kw of entry.keywords) {
    if (userLower.includes(kw.toLowerCase())) {
      score += 1;
    }
  }
  return score;
}

/**
 * Pick the best demo response for the given user message, or the fallback.
 */
function pickResponse(user: string): string {
  const lower = user.toLowerCase();
  let best: DemoEntry | null = null;
  let bestScore = 0;

  for (const entry of DEMO_RESPONSES) {
    const s = scoreMatch(lower, entry);
    if (s > bestScore) {
      bestScore = s;
      best = entry;
    }
  }

  return best ? best.response : FALLBACK_RESPONSE;
}

/**
 * Run the demo responder: pick a response by keyword match and stream it
 * word-by-word with a small delay to simulate real AI inference.
 *
 * Returns the full response text.
 */
export async function runDemoResponse(params: DemoResponderParams): Promise<string> {
  const { user, onToken, signal } = params;
  const response = pickResponse(user);

  // Stream word-by-word with small delays for a natural feel.
  const words = response.split(' ');
  let full = '';

  for (let i = 0; i < words.length; i += 1) {
    if (signal?.aborted) {
      break;
    }
    const piece = i === 0 ? words[i] : ` ${words[i]}`;
    full += piece;
    onToken?.(piece);

    // Small delay every few words to simulate streaming.
    if (i % 3 === 0) {
      await new Promise((resolve) => setTimeout(resolve, 30));
    }
  }

  return full;
}

/**
 * Whether demo mode should activate: true when no cloud provider keys are
 * configured (the typical hackathon / demo scenario).
 */
export function isDemoMode(): boolean {
  const gemini = (process.env.EXPO_PUBLIC_GEMINI_API_KEY ?? '').trim();
  const groq = (process.env.EXPO_PUBLIC_GROQ_API_KEY ?? '').trim();
  const openrouter = (process.env.EXPO_PUBLIC_OPENROUTER_API_KEY ?? '').trim();
  return gemini.length === 0 && groq.length === 0 && openrouter.length === 0;
}
