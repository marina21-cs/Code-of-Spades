/**
 * Baseline DepEd MELC curriculum seed data (Grade 6 Science).
 *
 * This is the bundled "Personalized Reviewer" corpus that grounds every AI
 * response when the student is offline (spec 5.3 / 5.5). In production this set
 * grows to the full ~5,700-competency MELC corpus with pre-computed embeddings;
 * for the MVP it is a representative, fully-populated Grade 6 Science slice.
 *
 * Pure data module — no native imports — so it can be seeded by the app and by
 * headless verification alike.
 */

export interface MelcSeed {
  /** DepEd MELC competency code. */
  competencyCode: string;
  /** Learning area. */
  subject: string;
  /** K-12 grade level. */
  gradeLevel: number;
  /** Short human-readable topic title. */
  topic: string;
  /** Salient terms; boosts retrieval signal beyond the prose. */
  keywords: string[];
  /** The grounded passage shown/used as RAG context. */
  content: string;
}

export const MELC_SEEDS: MelcSeed[] = [
  {
    competencyCode: 'S6LT-IIe-f-3',
    subject: 'Science',
    gradeLevel: 6,
    topic: 'Parts of a Plant Cell',
    keywords: [
      'plant cell',
      'parts',
      'cell wall',
      'cell membrane',
      'cytoplasm',
      'nucleus',
      'vacuole',
      'chloroplast',
    ],
    content:
      'A plant cell has several parts that each do a special job. The cell wall is a stiff outer layer that gives the plant cell its shape and protection. Just inside it is the cell membrane, which controls what enters and leaves the cell. The cytoplasm is the jelly-like fluid where the parts float. The nucleus is the control center and holds the cell\u2019s information. A large vacuole stores water and keeps the cell firm. The chloroplast holds the green pigment chlorophyll, where the plant makes food during photosynthesis.',
  },
  {
    competencyCode: 'S6LT-IIe-f-4',
    subject: 'Science',
    gradeLevel: 6,
    topic: 'Animal Cell Structure',
    keywords: ['animal cell', 'cell membrane', 'nucleus', 'mitochondria', 'cytoplasm'],
    content:
      'An animal cell is wrapped by a thin cell membrane instead of a stiff outer wall, so it can take many shapes. It has a nucleus that directs the cell, cytoplasm that fills the inside, and tiny mitochondria that release energy from food. Unlike a plant, an animal cell has no chloroplast, so it cannot make its own food and must eat to get energy.',
  },
  {
    competencyCode: 'S6LT-IIg-h-5',
    subject: 'Science',
    gradeLevel: 6,
    topic: 'Photosynthesis',
    keywords: [
      'photosynthesis',
      'chlorophyll',
      'sunlight',
      'carbon dioxide',
      'water',
      'glucose',
      'oxygen',
      'chloroplast',
    ],
    content:
      'Photosynthesis is how green plants make their own food. Inside the chloroplast, the green pigment chlorophyll traps energy from sunlight. The plant uses that energy to combine carbon dioxide from the air with water from the soil, producing glucose, a kind of sugar, and releasing oxygen into the air. Because they make their own food, plants are called producers.',
  },
  {
    competencyCode: 'S6MT-Ig-h-4',
    subject: 'Science',
    gradeLevel: 6,
    topic: 'Mixtures and Ways to Separate Them',
    keywords: ['mixture', 'separation', 'filtering', 'evaporation', 'decantation', 'sieving', 'magnet'],
    content:
      'A mixture is made of two or more materials combined together but not chemically joined, so they can be separated again. Common ways to separate mixtures include picking, sieving, filtering, decantation, using a magnet, and evaporation. For example, filtering separates sand from water, while evaporation leaves salt behind after the water turns to vapor.',
  },
  {
    competencyCode: 'S6LT-IIa-b-1',
    subject: 'Science',
    gradeLevel: 6,
    topic: 'Vertebrates and Invertebrates',
    keywords: ['vertebrates', 'invertebrates', 'backbone', 'mammals', 'fish', 'insects', 'classification'],
    content:
      'Animals can be grouped into vertebrates and invertebrates. Vertebrates have a backbone, such as fish, amphibians, reptiles, birds, and mammals. Invertebrates have no backbone, such as insects, worms, snails, and crabs. Most of the animals on Earth are invertebrates.',
  },
  {
    competencyCode: 'S6LT-IIIc-d-2',
    subject: 'Science',
    gradeLevel: 6,
    topic: 'The Human Circulatory System',
    keywords: ['circulatory system', 'heart', 'blood', 'blood vessels', 'arteries', 'veins'],
    content:
      'The circulatory system moves blood around the body. The heart is a muscular pump that pushes blood through tubes called blood vessels. Arteries carry blood away from the heart, while veins bring it back. Blood delivers oxygen and nutrients to every cell and carries away wastes.',
  },
  {
    competencyCode: 'S6LT-IIIa-b-1',
    subject: 'Science',
    gradeLevel: 6,
    topic: 'The Human Respiratory System',
    keywords: ['respiratory system', 'lungs', 'breathing', 'oxygen', 'carbon dioxide', 'diaphragm'],
    content:
      'The respiratory system lets the body take in oxygen and remove carbon dioxide. When you breathe in, air travels down the windpipe into the lungs. There, oxygen passes into the blood and carbon dioxide passes out to be breathed away. The diaphragm is a muscle below the lungs that helps you breathe in and out.',
  },
  {
    competencyCode: 'S6FE-IIIe-f-1',
    subject: 'Science',
    gradeLevel: 6,
    topic: 'Forms of Energy',
    keywords: ['energy', 'heat', 'light', 'sound', 'electricity', 'motion', 'mechanical'],
    content:
      'Energy comes in many forms, including heat, light, sound, electrical, and mechanical energy. Energy can change from one form to another. A flashlight changes electrical energy into light energy, while rubbing your hands together changes motion into heat energy. Energy is what lets objects do work.',
  },
  {
    competencyCode: 'S6ES-IVi-j-6',
    subject: 'Science',
    gradeLevel: 6,
    topic: 'The Solar System',
    keywords: ['solar system', 'sun', 'planets', 'earth', 'orbit', 'moon'],
    content:
      'The solar system is made up of the sun and the objects that move around it. Eight planets, including Earth, orbit the sun along their own paths. The sun is a star that gives off light and heat. Some planets have moons that orbit them, and Earth has one moon.',
  },
  {
    competencyCode: 'S6ES-IVa-b-1',
    subject: 'Science',
    gradeLevel: 6,
    topic: 'Weather and Climate',
    keywords: ['weather', 'climate', 'temperature', 'rainfall', 'season', 'wind'],
    content:
      'Weather is the day-to-day condition of the air in a place, including its temperature, rainfall, and wind. Climate is the usual weather of a place measured over many years. The Philippines has a tropical climate with a wet season and a dry season.',
  },
];

/**
 * The text actually fed to the embedder for a seed. Topic + keywords are
 * prepended to the prose so the strongest signal terms are well represented in
 * the vector.
 */
export function melcEmbeddingText(seed: MelcSeed): string {
  return `${seed.topic}. ${seed.keywords.join(', ')}. ${seed.content}`;
}
