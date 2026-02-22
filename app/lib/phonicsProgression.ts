export const PHONICS_VOWELS = ["a", "e", "i", "o", "u"] as const;

export type PhonicsVowel = (typeof PHONICS_VOWELS)[number];
export type PhonicsMaterialId =
  | "moveable-alphabet"
  | "phonic-labels"
  | "phonic-three-part-cards"
  | "phonic-three-part-cards-labels-only"
  | "phonic-three-part-cards-labels"
  | "reading-book";

type CompletionAction = {
  href: string;
  label: string;
};

type MaterialDefinition = {
  id: PhonicsMaterialId;
  title: string;
  hrefForVowel: (vowel: PhonicsVowel) => string;
};

export type PhonicsCompletionSteps = {
  isEndOfSeries: boolean;
  nextInSeries?: CompletionAction;
  nextMaterial?: CompletionAction;
};

const PHONICS_MATERIALS: MaterialDefinition[] = [
  {
    id: "moveable-alphabet",
    title: "Moveable Alphabet",
    hrefForVowel: (vowel) => `/lessons/language-arts/moveable-alphabet/${vowel}`,
  },
  {
    id: "phonic-labels",
    title: "Phonic Labels",
    hrefForVowel: (vowel) => `/lessons/language-arts/phonic-labels/${vowel}`,
  },
  {
    id: "phonic-three-part-cards",
    title: "Phonic Three-Part Cards",
    hrefForVowel: (vowel) => `/lessons/language-arts/phonic-three-part-cards/${vowel}`,
  },
  {
    id: "phonic-three-part-cards-labels-only",
    title: "Phonic Three-Part Cards Labels",
    hrefForVowel: (vowel) => `/lessons/language-arts/phonic-three-part-cards-labels-only/${vowel}`,
  },
  {
    id: "phonic-three-part-cards-labels",
    title: "Phonic Three-Part Cards + Labels",
    hrefForVowel: (vowel) => `/lessons/language-arts/phonic-three-part-cards-labels/${vowel}`,
  },
  {
    id: "reading-book",
    title: "Phonic Reading Booklets",
    hrefForVowel: (vowel) => `/lessons/language-arts/phonics/reading-book?vowel=${vowel}`,
  },
];

const NEXT_AFTER_PHONICS: CompletionAction = {
  href: "/lessons/language-arts/lilac-word-lists",
  label: "Next Material: Lilac Word Lists",
};

const toValidVowel = (value: string): PhonicsVowel => {
  const normalized = value.toLowerCase();
  return PHONICS_VOWELS.includes(normalized as PhonicsVowel) ? (normalized as PhonicsVowel) : "a";
};

export const getPhonicsCompletionSteps = (
  materialId: PhonicsMaterialId,
  vowel: string
): PhonicsCompletionSteps => {
  const materialIndex = PHONICS_MATERIALS.findIndex((item) => item.id === materialId);
  if (materialIndex === -1) {
    return { isEndOfSeries: false };
  }

  const material = PHONICS_MATERIALS[materialIndex];
  const currentVowel = toValidVowel(vowel);
  const vowelIndex = PHONICS_VOWELS.indexOf(currentVowel);
  const nextVowel = PHONICS_VOWELS[vowelIndex + 1];
  const isEndOfSeries = !nextVowel;

  if (!isEndOfSeries) {
    return {
      isEndOfSeries: false,
      nextInSeries: {
        href: material.hrefForVowel(nextVowel),
        label: `Next Lesson: ${material.title} (${nextVowel.toUpperCase()})`,
      },
    };
  }

  const nextMaterial = PHONICS_MATERIALS[materialIndex + 1];
  if (nextMaterial) {
    return {
      isEndOfSeries: true,
      nextMaterial: {
        href: nextMaterial.hrefForVowel("a"),
        label: `Next Material: ${nextMaterial.title}`,
      },
    };
  }

  return {
    isEndOfSeries: true,
    nextMaterial: NEXT_AFTER_PHONICS,
  };
};
