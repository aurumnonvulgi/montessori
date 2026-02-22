"use client";

import {
  type DragEvent,
  type PointerEvent as ReactPointerEvent,
  type TouchEvent as ReactTouchEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import HomeLink from "../../../../components/HomeLink";
import CompletionOverlay from "../../../../components/CompletionOverlay";
import MaterialTeachersGuide from "../../../../components/MaterialTeachersGuide";
import MicrophoneLessonBanner from "../../../../components/MicrophoneLessonBanner";
import { BLUE_BOOKLETS_TEACHERS_GUIDE } from "../../../../data/languageArtsTeachersGuides";
import {
  confirmMicrophonePreferenceChange,
  useMicrophoneEnabled,
} from "../../../../lib/microphonePreferences";
import { trackLessonEvent } from "../../../../lib/lessonTelemetry";
import { speakWithPreferredVoice } from "../../../../lib/speech";
import { getVoiceEnabled, getVoiceVolume } from "../../../../lib/voicePreferences";

const BLEND_ORDER = [
  "bl",
  "br",
  "cl",
  "cr",
  "dr",
  "fl",
  "fr",
  "gl",
  "gr",
  "pl",
  "pr",
  "sc",
  "sk",
  "sl",
  "sm",
  "sn",
  "sp",
  "st",
  "sw",
  "tr",
  "tw",
] as const;

type BlendKey = (typeof BLEND_ORDER)[number];

type FileListResponse = {
  files?: unknown;
};

type BookPage = {
  blend: BlendKey;
  word: string;
  order: number;
  file: string;
  sentence: string;
};

const BLEND_WORDS: Record<BlendKey, string[]> = {
  bl: ["blab", "blob", "blot", "bluff", "blink"],
  br: ["brag", "brim", "brad", "bran", "brunt"],
  cl: ["clap", "clam", "clad", "clip", "clog"],
  cr: ["crab", "cram", "crib", "crop", "crust"],
  dr: ["drab", "drag", "drip", "drop", "drum"],
  fl: ["flap", "flag", "flip", "flop", "fluff"],
  fr: ["fret", "frog", "from", "frill", "frost"],
  gl: ["glad", "glib", "glob", "glen", "glum"],
  gr: ["grab", "grin", "grit", "grub", "gruff"],
  pl: ["plan", "plum", "plot", "plug", "plop"],
  pr: ["pram", "prim", "prod", "prop", "press"],
  sc: ["scan", "scat", "scalp", "scuff", "scum"],
  sk: ["skid", "skim", "skin", "skip", "skit"],
  sl: ["slab", "slam", "slip", "slot", "slug"],
  sm: ["small", "smell", "smog", "smug", "smirk"],
  sn: ["snag", "snap", "snip", "snub", "sniff"],
  sp: ["span", "spin", "spit", "spot", "spud"],
  st: ["step", "stem", "stiff", "stop", "stump"],
  sw: ["swam", "swap", "swell", "swig", "swim"],
  tr: ["trap", "trim", "trip", "trot", "trunk"],
  tw: ["twin", "twins", "twig", "twill", "twist"],
};

const COVER_TITLE = "Booklets Illustrated Images";
const COVER_SUBTITLE = "Consonant Blends | Blue Series";
const DRAWING_IMAGE_BASE =
  "/assets/language_arts/consonant_blend/consonant_blend_picture_cards_drawings";
const DRAWING_IMAGE_BASE_V2 =
  "/assets/language_arts/consonant_blend/consonant_blend_picture_cards_drawings-V2";
const BOOKLET_AUDIO_BASE =
  "/assets/language_arts/consonant_blend/consonant_blend_word_booklets_audio";

const BOOKLET_SPEED_OPTIONS = [
  { value: 0.9, label: "Normal" },
  { value: 0.8, label: "Slower" },
  { value: 0.7, label: "Slow" },
  { value: 0.6, label: "Turtle Speed" },
] as const;

const toDrawingImage = (file: string) => `${DRAWING_IMAGE_BASE}/${file}`;
const toDrawingImageV2Candidates = (blend: BlendKey, order: number, word: string) => [
  `${DRAWING_IMAGE_BASE_V2}/${blend}-${order}-${word}____consonant_blends_illustrations_book.png`,
  `${DRAWING_IMAGE_BASE_V2}/${blend}-${order}-${word}____consonant_blends_illustrations_boo.png`,
];

const toLegacyImage = (blend: BlendKey, word: string, order: number) =>
  `/assets/language_arts/consonant_blend/consonant_blend_picture_cards/${blend}-${word}-${order}-${word}____consonant_blends.png`;

const BLUE_BOOK_SENTENCES: Record<string, string> = {
  "bl-1-blab": "He did blab all day.",
  "bl-2-blob": "The blob sat on the mat.",
  "bl-3-blot": "A blot is on the paper.",
  "bl-4-bluff": "The bluff is high by the sea.",
  "bl-5-blink": "Blink and look at me.",
  "br-1-brag": "Do not brag in class.",
  "br-2-brim": "The brim is on the hat.",
  "br-3-brad": "The brad is in the box.",
  "br-4-bran": "We ate bran at home.",
  "br-5-brunt": "The car got the brunt of the bump.",
  "cl-1-clap": "Clap for the band, please.",
  "cl-2-clam": "The clam is in the sand.",
  "cl-3-clad": "She is clad in a red coat.",
  "cl-4-clip": "Clip the paper to the book.",
  "cl-5-clog": "Mud can clog the drain.",
  "cr-1-crab": "The crab ran to the rock.",
  "cr-2-cram": "He did cram at the end.",
  "cr-3-crib": "The baby is in the crib.",
  "cr-4-crop": "The crop grew on the farm.",
  "cr-5-crust": "The crust is on the bun.",
  "dr-1-drab": "The coat is drab and dull.",
  "dr-2-drag": "Drag the bag to the door.",
  "dr-3-drip": "The tap made a drip.",
  "dr-4-drop": "One drop fell in the cup.",
  "dr-5-drum": "The kids hit the drum.",
  "fl-1-flap": "The bird did flap its wings.",
  "fl-2-flag": "The flag is up on the pole.",
  "fl-3-flip": "Flip the cake in the pan.",
  "fl-4-flop": "The toy did flop on the rug.",
  "fl-5-fluff": "The fluff is on the cap.",
  "fr-1-fret": "Do not fret; I am here.",
  "fr-2-frog": "The frog sat on the log.",
  "fr-3-from": "This note is from Dad.",
  "fr-4-frill": "The frill is on the dress.",
  "fr-5-frost": "Frost is on the car.",
  "gl-1-glad": "We are glad you came.",
  "gl-2-glib": "He gave a glib grin.",
  "gl-3-glob": "A glob of glue is on it.",
  "gl-4-glen": "We ran in the green glen.",
  "gl-5-glum": "She felt glum today.",
  "gr-1-grab": "Grab the bag and go.",
  "gr-2-grin": "The boy had a big grin.",
  "gr-3-grit": "Grit got in the shoe.",
  "gr-4-grub": "The grub is in the mud.",
  "gr-5-gruff": "He is gruff, but he can help.",
  "pl-1-plan": "We made a plan to go.",
  "pl-2-plum": "The plum is ripe and red.",
  "pl-3-plot": "The plot is on the map.",
  "pl-4-plug": "Put the plug in the wall.",
  "pl-5-plop": "The rock went plop in the pond.",
  "pr-1-pram": "The baby sat in the pram.",
  "pr-2-prim": "She sat prim in the chair.",
  "pr-3-prod": "Do not prod the dog.",
  "pr-4-prop": "The hat is a prop for the play.",
  "pr-5-press": "Press the button and wait.",
  "sc-1-scan": "We scan the tag at the desk.",
  "sc-2-scat": "The cat did scat and run.",
  "sc-3-scalp": "The scalp is under the hair.",
  "sc-4-scuff": "The shoe has a scuff mark.",
  "sc-5-scum": "The scum is on the pond.",
  "sk-1-skid": "The bike did skid on mud.",
  "sk-2-skim": "Skim the foam off the top.",
  "sk-3-skin": "The skin got wet in the rain.",
  "sk-4-skip": "We skip to the park.",
  "sk-5-skit": "The class did a skit.",
  "sl-1-slab": "The slab is on the bench.",
  "sl-2-slam": "He did slam the door.",
  "sl-3-slip": "She did slip on the wet mat.",
  "sl-4-slot": "Put the coin in the slot.",
  "sl-5-slug": "The slug is on the leaf.",
  "sm-1-small": "The bug is small, not big.",
  "sm-2-smell": "The smell is not good.",
  "sm-3-smog": "The smog is over the city.",
  "sm-4-smug": "He felt smug at the end.",
  "sm-5-smirk": "The kid had a sly smirk.",
  "sn-1-snag": "The sock got a snag.",
  "sn-2-snap": "Snap the stick in two.",
  "sn-3-snip": "Snip the tag off the cap.",
  "sn-4-snub": "Do not snub your pal.",
  "sn-5-sniff": "The dog did sniff the bag.",
  "sp-1-span": "The span is big on the bridge.",
  "sp-2-spin": "Spin the top on the mat.",
  "sp-3-spit": "Do not spit on the rug.",
  "sp-4-spot": "A red spot is on the cup.",
  "sp-5-spud": "The spud is in the pan.",
  "st-1-step": "Take a step to the door.",
  "st-2-stem": "The stem is on the bud.",
  "st-3-stiff": "The board is stiff and flat.",
  "st-4-stop": "Stop at the line and wait.",
  "st-5-stump": "The stump is by the path.",
  "sw-1-swam": "We swam in the pool.",
  "sw-2-swap": "We swap hats at the party.",
  "sw-3-swell": "The swell rose in the sea.",
  "sw-4-swig": "He took a swig of water.",
  "sw-5-swim": "We swim when it is hot.",
  "tr-1-trap": "The trap is in the box.",
  "tr-2-trim": "Trim the bush by the gate.",
  "tr-3-trip": "He did trip on the rug.",
  "tr-4-trot": "The horse did trot to the barn.",
  "tr-5-trunk": "The elephant has a long trunk.",
  "tw-1-twin": "He has a twin at home.",
  "tw-2-twins": "The twins ran to the car.",
  "tw-3-twig": "The twig is on the path.",
  "tw-4-twill": "The coat is made of twill.",
  "tw-5-twist": "Twist the lid to open it.",
};

const sentenceForPage = (blend: BlendKey, word: string, order: number) => {
  return BLUE_BOOK_SENTENCES[`${blend}-${order}-${word}`] ?? `This is ${word}.`;
};

const buildFallbackPages = (): BookPage[] =>
  BLEND_ORDER.flatMap((blend) =>
    BLEND_WORDS[blend].map((word, index) => ({
      blend,
      word,
      order: index + 1,
      file: `${blend}-${word}-${index + 1}-${word}____consonant_blends_illustrations.png`,
      sentence: sentenceForPage(blend, word, index + 1),
    })),
  );

const parseDrawingFile = (file: string): BookPage | null => {
  const match = file.match(
    /^([a-z]{2})-([a-z]+)-(\d+)-([a-z]+)____consonant_blends(?:_illustratio(?:n(?:s)?)?)?\.png$/i,
  );
  if (!match) return null;
  const blend = match[1].toLowerCase() as BlendKey;
  if (!BLEND_ORDER.includes(blend)) return null;
  const word = match[2].toLowerCase();
  const order = Number(match[3]);
  const trailingWord = match[4].toLowerCase();
  if (!word || word !== trailingWord || !Number.isFinite(order) || order < 1) return null;
  return {
    blend,
    word,
    order,
    file,
    sentence: sentenceForPage(blend, word, order),
  };
};

function FallbackBookImage({
  sources,
  alt,
  className,
}: {
  sources: string[];
  alt: string;
  className: string;
}) {
  const [sourceIndex, setSourceIndex] = useState(0);

  useEffect(() => {
    setSourceIndex(0);
  }, [sources]);

  return (
    <img
      src={sources[sourceIndex] ?? sources[sources.length - 1]}
      alt={alt}
      className={className}
      onError={() => {
        setSourceIndex((current) => Math.min(current + 1, sources.length - 1));
      }}
    />
  );
}

function ReadingBookImage({
  page,
  alt,
  className,
}: {
  page: BookPage;
  alt: string;
  className: string;
}) {
  const sources = useMemo(
    () => [toDrawingImage(page.file), toLegacyImage(page.blend, page.word, page.order)],
    [page.blend, page.file, page.order, page.word],
  );
  return <FallbackBookImage sources={sources} alt={alt} className={className} />;
}

function ReadingBookImageV2({
  page,
  alt,
  className,
}: {
  page: BookPage;
  alt: string;
  className: string;
}) {
  const sources = useMemo(
    () => [
      ...toDrawingImageV2Candidates(page.blend, page.order, page.word),
      toDrawingImage(page.file),
      toLegacyImage(page.blend, page.word, page.order),
    ],
    [page.blend, page.file, page.order, page.word],
  );
  return <FallbackBookImage sources={sources} alt={alt} className={className} />;
}

function ReadingBookImageComparison({
  page,
  className,
  imageClassName,
}: {
  page: BookPage;
  className?: string;
  imageClassName: string;
}) {
  return (
    <div className={`w-full ${className ?? ""}`}>
      <p className="mb-2 inline-flex items-center rounded-full border border-amber-300 bg-amber-100 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-amber-900">
        Temporary Compare: Current + V2
      </p>
      <div className="grid w-full grid-cols-2 gap-2 sm:gap-3">
        <div className="rounded-2xl border border-sky-200 bg-white/95 p-2 shadow-sm">
          <p className="mb-1 text-[10px] uppercase tracking-[0.18em] text-sky-700">Current</p>
          <ReadingBookImage page={page} alt={`${page.word} current`} className={`${imageClassName} object-contain`} />
        </div>
        <div className="rounded-2xl border border-indigo-200 bg-white/95 p-2 shadow-sm">
          <p className="mb-1 text-[10px] uppercase tracking-[0.18em] text-indigo-700">V2 (Temporary)</p>
          <ReadingBookImageV2 page={page} alt={`${page.word} temporary v2`} className={`${imageClassName} object-contain`} />
        </div>
      </div>
    </div>
  );
}

const renderSentence = (sentence: string, word: string, blend: string) => {
  const index = sentence.toLowerCase().indexOf(word.toLowerCase());
  if (index === -1) return sentence;

  const before = sentence.slice(0, index);
  const target = sentence.slice(index, index + word.length);
  const after = sentence.slice(index + word.length);

  return (
    <>
      {before}
      <span className="font-semibold">
        {target.split("").map((char, i) => (
          <span
            key={`${char}-${i}`}
            className={i < blend.length ? "text-rose-600" : "text-black"}
          >
            {char}
          </span>
        ))}
      </span>
      {after}
    </>
  );
};

const buildQuizOptions = (groupWords: string[], correctWord: string, seed: number) => {
  const normalizedCorrect = correctWord.toLowerCase();
  const uniqueWords = Array.from(new Set(groupWords.map((word) => word.toLowerCase())));
  const distractors = uniqueWords.filter((word) => word !== normalizedCorrect);
  if (!distractors.length) return [correctWord];

  const rotateBy = seed % distractors.length;
  const rotated = [...distractors.slice(rotateBy), ...distractors.slice(0, rotateBy)];
  const maxOptions = Math.min(4, uniqueWords.length);
  const selectedDistractors = rotated.slice(0, Math.max(0, maxOptions - 1));
  const options = [...selectedDistractors];
  const insertAt = seed % (options.length + 1);
  options.splice(insertAt, 0, correctWord);
  return options;
};

const splitSentenceAtWord = (sentence: string, word: string) => {
  const index = sentence.toLowerCase().indexOf(word.toLowerCase());
  if (index === -1) {
    return { before: sentence, after: "", found: false };
  }
  const before = sentence.slice(0, index);
  const after = sentence.slice(index + word.length);
  return { before, after, found: true };
};

const renderBlendWord = (word: string, blend: string) => {
  return word.split("").map((char, index) => (
    <span
      key={`${word}-${char}-${index}`}
      className={index < blend.length ? "text-rose-600" : "text-black"}
    >
      {char}
    </span>
  ));
};

type QuizFeedback = "idle" | "correct" | "incorrect";

export default function ConsonantBlendReadingBook() {
  const router = useRouter();
  const { microphoneEnabled, setMicrophoneEnabled } = useMicrophoneEnabled();

  const [bookPages, setBookPages] = useState<BookPage[]>(() => buildFallbackPages());
  const [selectedBlend, setSelectedBlend] = useState<BlendKey | null>(null);
  const [requestedBlend, setRequestedBlend] = useState<BlendKey | null>(null);
  const [started, setStarted] = useState(false);
  const [pageIndex, setPageIndex] = useState(0);
  const [isFlipping, setIsFlipping] = useState(false);
  const [flipDirection, setFlipDirection] = useState<"next" | "prev">("next");

  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [success, setSuccess] = useState(false);

  const sentenceRef = useRef("");
  const [typedText, setTypedText] = useState("");
  const typingTimerRef = useRef<number | null>(null);
  const [isTyping, setIsTyping] = useState(false);

  const [playbackRate, setPlaybackRate] = useState<number>(0.9);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [showCompletion, setShowCompletion] = useState(false);
  const [quizMode, setQuizMode] = useState(false);
  const [quizIndex, setQuizIndex] = useState(0);
  const [quizFeedback, setQuizFeedback] = useState<QuizFeedback>("idle");
  const [quizIncorrectWord, setQuizIncorrectWord] = useState("");
  const [quizDraggedWord, setQuizDraggedWord] = useState("");
  const [touchDragWord, setTouchDragWord] = useState<string | null>(null);
  const [touchDragPoint, setTouchDragPoint] = useState<{ x: number; y: number } | null>(null);
  const [quizDropActive, setQuizDropActive] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const settingsRef = useRef<HTMLDivElement | null>(null);
  const quizTimerRef = useRef<number | null>(null);
  const dropZoneRef = useRef<HTMLSpanElement | null>(null);
  const pointerDragRef = useRef<(() => void) | null>(null);
  const dragStartPointRef = useRef<{ x: number; y: number } | null>(null);
  const dragMovedRef = useRef(false);

  const pageIndexRef = useRef(0);
  const totalPagesRef = useRef(0);
  const selectedBlendRef = useRef<BlendKey | null>(null);
  const currentWordRef = useRef("");
  const attemptCountsRef = useRef<Record<string, number>>({});
  const completedLessonsRef = useRef<Record<string, true>>({});

  useEffect(() => {
    if (typeof window === "undefined") return;
    const queryBlend = new URLSearchParams(window.location.search).get("blend")?.toLowerCase();
    if (!queryBlend) return;
    if (!BLEND_ORDER.includes(queryBlend as BlendKey)) return;
    setRequestedBlend(queryBlend as BlendKey);
  }, []);

  useEffect(() => {
    if (!requestedBlend) return;
    setSelectedBlend((current) => current ?? requestedBlend);
  }, [requestedBlend]);

  useEffect(() => {
    let active = true;
    const loadDrawingFiles = async () => {
      try {
        const response = await fetch("/api/language-arts/consonant-blends/cards-drawings", {
          cache: "no-store",
        });
        if (!response.ok) return;
        const payload = (await response.json()) as FileListResponse;
        const files = Array.isArray(payload.files)
          ? payload.files.filter((value): value is string => typeof value === "string")
          : [];

        const parsed = files
          .map(parseDrawingFile)
          .filter((item): item is BookPage => Boolean(item))
          .sort((a, b) => {
            if (a.blend !== b.blend) {
              return BLEND_ORDER.indexOf(a.blend) - BLEND_ORDER.indexOf(b.blend);
            }
            if (a.order !== b.order) return a.order - b.order;
            return a.file.localeCompare(b.file);
          });

        if (!active || !parsed.length) return;
        setBookPages(parsed);
      } catch {
        // Keep fallback data when API is unavailable.
      }
    };

    void loadDrawingFiles();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    setShowCompletion(false);
    setQuizMode(false);
    setQuizIndex(0);
    setQuizFeedback("idle");
    setQuizIncorrectWord("");
    setQuizDraggedWord("");
    setTouchDragWord(null);
    setTouchDragPoint(null);
    setQuizDropActive(false);
    const key = selectedBlend ? `blend-${selectedBlend}` : "blend-none";
    delete completedLessonsRef.current[key];
  }, [selectedBlend]);

  const pagesByBlend = useMemo(() => {
    const grouped = {} as Record<BlendKey, BookPage[]>;
    BLEND_ORDER.forEach((blend) => {
      grouped[blend] = [];
    });

    bookPages.forEach((item) => {
      if (!grouped[item.blend]) return;
      grouped[item.blend].push(item);
    });

    BLEND_ORDER.forEach((blend) => {
      grouped[blend] = grouped[blend].sort((a, b) =>
        a.order === b.order ? a.file.localeCompare(b.file) : a.order - b.order,
      );
    });

    return grouped;
  }, [bookPages]);

  const pagesForBlend = useMemo(() => {
    if (!selectedBlend) return [];
    return pagesByBlend[selectedBlend] ?? [];
  }, [pagesByBlend, selectedBlend]);

  const quizCards = useMemo(() => {
    const groupWords = pagesForBlend.map((item) => item.word);
    return pagesForBlend.map((item, index) => ({
      ...item,
      options: buildQuizOptions(groupWords, item.word, index),
    }));
  }, [pagesForBlend]);

  const page = pagesForBlend[pageIndex];
  const coverPage = pagesForBlend[0];
  const totalPages = pagesForBlend.length;
  const activeQuizCard = quizCards[quizIndex];
  const showQuiz = started && quizMode && Boolean(activeQuizCard);
  const activeQuizSentenceParts = useMemo(() => {
    if (!activeQuizCard) return null;
    return splitSentenceAtWord(activeQuizCard.sentence, activeQuizCard.word);
  }, [activeQuizCard]);
  const selectedBlendIndex = selectedBlend ? BLEND_ORDER.indexOf(selectedBlend) : -1;
  const nextBlendInSeries =
    selectedBlendIndex >= 0 ? (BLEND_ORDER[selectedBlendIndex + 1] ?? null) : null;

  useEffect(() => {
    pageIndexRef.current = pageIndex;
  }, [pageIndex]);

  useEffect(() => {
    totalPagesRef.current = totalPages;
  }, [totalPages]);

  useEffect(() => {
    selectedBlendRef.current = selectedBlend;
  }, [selectedBlend]);

  useEffect(() => {
    currentWordRef.current = page?.word ?? "";
  }, [page]);

  useEffect(() => {
    trackLessonEvent({
      lesson: "language-arts:consonant-blends-reading-book",
      event: "lesson_opened",
    });
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const saved = Number(window.localStorage.getItem("consonant-blends-booklet-playback-rate"));
    if (!Number.isFinite(saved)) return;
    const allowed = BOOKLET_SPEED_OPTIONS.some((option) => option.value === saved);
    if (allowed) {
      setPlaybackRate(saved);
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem("consonant-blends-booklet-playback-rate", String(playbackRate));
  }, [playbackRate]);

  useEffect(() => {
    if (!settingsOpen) return;
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node | null;
      if (!settingsRef.current || !target) return;
      if (!settingsRef.current.contains(target)) {
        setSettingsOpen(false);
      }
    };
    window.addEventListener("pointerdown", onPointerDown);
    return () => {
      window.removeEventListener("pointerdown", onPointerDown);
    };
  }, [settingsOpen]);

  const stopBookletAudio = useCallback(() => {
    if (!audioRef.current) return;
    audioRef.current.pause();
    audioRef.current.currentTime = 0;
    audioRef.current = null;
  }, []);

  const clearQuizTimer = useCallback(() => {
    if (quizTimerRef.current === null) return;
    window.clearTimeout(quizTimerRef.current);
    quizTimerRef.current = null;
  }, []);

  const stopPointerDrag = useCallback(() => {
    const cleanupDrag = pointerDragRef.current;
    if (cleanupDrag) {
      cleanupDrag();
      pointerDragRef.current = null;
    }
    dragStartPointRef.current = null;
    dragMovedRef.current = false;
    setQuizDropActive(false);
    setTouchDragWord(null);
    setTouchDragPoint(null);
    setQuizDraggedWord("");
  }, []);

  const isPointInDropZone = useCallback((x: number, y: number) => {
    const dropZone = dropZoneRef.current?.getBoundingClientRect();
    if (!dropZone) return false;
    return x >= dropZone.left && x <= dropZone.right && y >= dropZone.top && y <= dropZone.bottom;
  }, []);

  const playBookletAudio = useCallback(
    (activePage: BookPage, fallbackText: string) => {
      if (typeof window === "undefined") return;
      if (!getVoiceEnabled()) return;

      const masterVoiceVolume = getVoiceVolume();
      if (masterVoiceVolume <= 0) return;

      trackLessonEvent({
        lesson: "language-arts:consonant-blends-reading-book",
        activity: selectedBlendRef.current ? `blend-${selectedBlendRef.current}` : undefined,
        event: "audio_played",
        value: activePage.word,
        page: pageIndexRef.current + 1,
        totalPages: totalPagesRef.current,
      });

      stopBookletAudio();
      window.speechSynthesis?.cancel();

      const canonicalAudioStem = `${activePage.blend}-${activePage.order}-${activePage.word}____consonant_blends_illustrations`;
      const audioBaseNames = [
        canonicalAudioStem,
        activePage.file.replace(/\.png$/i, ""),
        `${activePage.blend}-${activePage.word}`,
        activePage.word,
      ];
      const uniqueBaseNames = [...new Set(audioBaseNames)];

      const sources = uniqueBaseNames.flatMap((base) => [
        `${BOOKLET_AUDIO_BASE}/${base}.m4a`,
        `${BOOKLET_AUDIO_BASE}/${base}.mp3`,
        `/audio/consonant_blends_booklets/${base}.m4a`,
        `/audio/consonant_blends_booklets/${base}.mp3`,
      ]);

      let sourceIndex = 0;
      const tryPlay = () => {
        const source = sources[sourceIndex];
        if (!source) {
          speakWithPreferredVoice(fallbackText, {
            rate: playbackRate,
            pitch: 0.95,
            volume: 0.9,
            lang: "en-US",
          });
          return;
        }

        const audio = new Audio(source);
        audioRef.current = audio;
        audio.preload = "auto";
        audio.playbackRate = playbackRate;
        audio.volume = Math.max(0, Math.min(1, masterVoiceVolume));
        audio.onended = () => {
          if (audioRef.current === audio) {
            audioRef.current = null;
          }
        };
        audio.onerror = () => {
          if (audioRef.current === audio) {
            audioRef.current = null;
          }
          sourceIndex += 1;
          tryPlay();
        };
        audio.play().catch(() => {
          sourceIndex += 1;
          tryPlay();
        });
      };

      tryPlay();
    },
    [playbackRate, stopBookletAudio],
  );

  const markLessonComplete = useCallback(() => {
    const activeBlend = selectedBlendRef.current;
    const lessonKey = activeBlend ? `blend-${activeBlend}` : "blend-none";
    if (!completedLessonsRef.current[lessonKey]) {
      completedLessonsRef.current[lessonKey] = true;
      trackLessonEvent({
        lesson: "language-arts:consonant-blends-reading-book",
        activity: activeBlend ? `blend-${activeBlend}` : undefined,
        event: "lesson_completed",
        success: true,
        page: totalPagesRef.current,
        totalPages: totalPagesRef.current,
      });
    }
    setShowCompletion(true);
  }, []);

  const startQuiz = useCallback(() => {
    clearQuizTimer();
    stopPointerDrag();
    stopBookletAudio();
    if (typeof window !== "undefined") {
      window.speechSynthesis?.cancel();
    }
    try {
      recognitionRef.current?.stop();
    } catch {
      // Ignore browser recognition stop errors.
    }
    setListening(false);
    setTranscript("");
    setSuccess(false);
    setQuizMode(true);
    setQuizIndex(0);
    setQuizFeedback("idle");
    setQuizIncorrectWord("");
    setQuizDraggedWord("");
    setTouchDragWord(null);
    setTouchDragPoint(null);
    setQuizDropActive(false);
    trackLessonEvent({
      lesson: "language-arts:consonant-blends-reading-book",
      activity: selectedBlendRef.current ? `blend-${selectedBlendRef.current}` : undefined,
      event: "quiz_started",
      page: totalPagesRef.current,
      totalPages: totalPagesRef.current,
    });
  }, [clearQuizTimer, stopPointerDrag, stopBookletAudio]);

  const handleQuizAnswer = useCallback(
    (candidateWord: string) => {
      if (!quizMode) return;
      const activeCard = quizCards[quizIndex];
      if (!activeCard) return;
      const normalizedCandidate = candidateWord.toLowerCase();
      const normalizedExpected = activeCard.word.toLowerCase();

      clearQuizTimer();
      stopPointerDrag();
      setQuizDropActive(false);

      if (normalizedCandidate === normalizedExpected) {
        setQuizFeedback("correct");
        setQuizIncorrectWord("");
        trackLessonEvent({
          lesson: "language-arts:consonant-blends-reading-book",
          activity: selectedBlend ? `blend-${selectedBlend}` : undefined,
          event: "quiz_correct",
          value: activeCard.word,
          page: quizIndex + 1,
          totalPages: quizCards.length,
        });

        quizTimerRef.current = window.setTimeout(() => {
          quizTimerRef.current = null;
          setQuizFeedback("idle");
          if (quizIndex >= quizCards.length - 1) {
            setQuizMode(false);
            markLessonComplete();
            return;
          }
          setQuizIndex((prev) => prev + 1);
        }, 900);
        return;
      }

      setQuizFeedback("incorrect");
      setQuizIncorrectWord(normalizedCandidate);
      trackLessonEvent({
        lesson: "language-arts:consonant-blends-reading-book",
        activity: selectedBlend ? `blend-${selectedBlend}` : undefined,
        event: "quiz_incorrect",
        value: candidateWord,
        page: quizIndex + 1,
        totalPages: quizCards.length,
        details: {
          expected: activeCard.word,
        },
      });
      quizTimerRef.current = window.setTimeout(() => {
        quizTimerRef.current = null;
        setQuizFeedback("idle");
        setQuizIncorrectWord("");
      }, 650);
    },
    [clearQuizTimer, markLessonComplete, quizCards, quizIndex, quizMode, selectedBlend, stopPointerDrag],
  );

  const handleQuizDragStart = useCallback((event: DragEvent<HTMLButtonElement>, option: string) => {
    event.dataTransfer.setData("text/plain", option);
    event.dataTransfer.effectAllowed = "move";
    setQuizDraggedWord(option.toLowerCase());
  }, []);

  const handleQuizDrop = useCallback(
    (event: DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      const droppedWord = event.dataTransfer.getData("text/plain");
      setQuizDraggedWord("");
      setQuizDropActive(false);
      handleQuizAnswer(droppedWord);
    },
    [handleQuizAnswer],
  );

  const handleQuizPointerStart = useCallback(
    (event: ReactPointerEvent<HTMLButtonElement>, option: string) => {
      if (quizFeedback === "correct") return;
      if (event.pointerType === "mouse" && event.button !== 0) return;
      event.preventDefault();
      event.stopPropagation();
      stopPointerDrag();
      const startX = event.clientX;
      const startY = event.clientY;
      dragStartPointRef.current = { x: startX, y: startY };
      dragMovedRef.current = false;
      setTouchDragWord(option);
      setTouchDragPoint({ x: startX, y: startY });
      setQuizDraggedWord(option.toLowerCase());
      setQuizDropActive(isPointInDropZone(startX, startY));

      const move = (moveEvent: PointerEvent) => {
        const nextX = moveEvent.clientX;
        const nextY = moveEvent.clientY;
        const startPoint = dragStartPointRef.current;
        if (startPoint) {
          const delta = Math.hypot(nextX - startPoint.x, nextY - startPoint.y);
          if (delta > 8) {
            dragMovedRef.current = true;
          }
        }
        setTouchDragPoint({ x: nextX, y: nextY });
        setQuizDropActive(isPointInDropZone(nextX, nextY));
      };

      const up = (upEvent: PointerEvent) => {
        const droppedOnTarget = isPointInDropZone(upEvent.clientX, upEvent.clientY);
        const shouldCommit = droppedOnTarget || !dragMovedRef.current;
        stopPointerDrag();
        if (shouldCommit) {
          handleQuizAnswer(option);
        }
      };

      window.addEventListener("pointermove", move);
      window.addEventListener("pointerup", up);
      window.addEventListener("pointercancel", up);
      pointerDragRef.current = () => {
        window.removeEventListener("pointermove", move);
        window.removeEventListener("pointerup", up);
        window.removeEventListener("pointercancel", up);
      };
    },
    [handleQuizAnswer, isPointInDropZone, quizFeedback, stopPointerDrag],
  );

  const handleQuizTouchStart = useCallback(
    (event: ReactTouchEvent<HTMLButtonElement>, option: string) => {
      if (quizFeedback === "correct") return;
      if (typeof window !== "undefined" && typeof window.PointerEvent !== "undefined") return;
      const touch = event.touches[0];
      if (!touch) return;
      event.preventDefault();
      stopPointerDrag();
      const startX = touch.clientX;
      const startY = touch.clientY;
      dragStartPointRef.current = { x: startX, y: startY };
      dragMovedRef.current = false;
      setTouchDragWord(option);
      setTouchDragPoint({ x: startX, y: startY });
      setQuizDraggedWord(option.toLowerCase());
      setQuizDropActive(isPointInDropZone(startX, startY));

      const move = (moveEvent: TouchEvent) => {
        const activeTouch = moveEvent.touches[0];
        if (!activeTouch) return;
        const nextX = activeTouch.clientX;
        const nextY = activeTouch.clientY;
        const startPoint = dragStartPointRef.current;
        if (startPoint) {
          const delta = Math.hypot(nextX - startPoint.x, nextY - startPoint.y);
          if (delta > 8) {
            dragMovedRef.current = true;
          }
        }
        setTouchDragPoint({ x: nextX, y: nextY });
        setQuizDropActive(isPointInDropZone(nextX, nextY));
        if (moveEvent.cancelable) {
          moveEvent.preventDefault();
        }
      };

      const end = (endEvent: TouchEvent) => {
        const endTouch = endEvent.changedTouches[0];
        const endX = endTouch?.clientX ?? startX;
        const endY = endTouch?.clientY ?? startY;
        const droppedOnTarget = isPointInDropZone(endX, endY);
        const shouldCommit = droppedOnTarget || !dragMovedRef.current;
        stopPointerDrag();
        if (shouldCommit) {
          handleQuizAnswer(option);
        }
      };

      window.addEventListener("touchmove", move, { passive: false });
      window.addEventListener("touchend", end);
      window.addEventListener("touchcancel", end);
      pointerDragRef.current = () => {
        window.removeEventListener("touchmove", move);
        window.removeEventListener("touchend", end);
        window.removeEventListener("touchcancel", end);
      };
    },
    [handleQuizAnswer, isPointInDropZone, quizFeedback, stopPointerDrag],
  );

  const normalizeText = useCallback((value: string) => {
    return value
      .toLowerCase()
      .replace(/[^a-z\s]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }, []);

  const isTranscriptCorrect = useCallback(
    (spoken: string, expectedSentence: string, expectedWord: string) => {
      const normalizedSpoken = normalizeText(spoken);
      const normalizedSentence = normalizeText(expectedSentence);
      const normalizedWord = normalizeText(expectedWord);
      if (!normalizedSpoken) return false;

      if (normalizedWord && normalizedSpoken.includes(normalizedWord)) return true;
      if (normalizedSentence && normalizedSpoken.includes(normalizedSentence)) return true;

      const spokenWordsArray = normalizedSpoken.split(" ").filter(Boolean);
      const expectedWords = normalizedSentence.split(" ").filter(Boolean);
      if (!expectedWords.length) return false;

      const spokenWords = new Set(spokenWordsArray);
      const matched = expectedWords.filter((word) => spokenWords.has(word)).length;
      const overlap = matched / expectedWords.length;
      if (overlap >= 0.7) return true;
      if (expectedWords.length >= 6 && overlap >= 0.6) return true;

      return false;
    },
    [normalizeText],
  );

  const setupRecognition = useCallback(() => {
    if (!microphoneEnabled) return null;
    if (typeof window === "undefined") return null;

    const SpeechRecognitionImpl =
      (window as unknown as { SpeechRecognition?: typeof SpeechRecognition }).SpeechRecognition ||
      (window as unknown as { webkitSpeechRecognition?: typeof SpeechRecognition })
        .webkitSpeechRecognition;
    if (!SpeechRecognitionImpl) return null;

    const recognition = new SpeechRecognitionImpl();
    recognition.lang = "en-US";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event) => {
      const result = event.results[0];
      if (result && result[0]) {
        const spoken = result[0].transcript;
        const activeWord = currentWordRef.current;
        const attemptKey = `${selectedBlendRef.current ?? "none"}:${activeWord}`;
        const attempt = attemptCountsRef.current[attemptKey] ?? 0;
        const matched = isTranscriptCorrect(spoken, sentenceRef.current, activeWord);

        setTranscript(spoken);
        trackLessonEvent({
          lesson: "language-arts:consonant-blends-reading-book",
          activity: selectedBlendRef.current ? `blend-${selectedBlendRef.current}` : undefined,
          event: "attempt_result",
          value: activeWord,
          attempt,
          success: matched,
          page: pageIndexRef.current + 1,
          totalPages: totalPagesRef.current,
          details: {
            spoken,
          },
        });

        if (matched) {
          setSuccess(true);
          trackLessonEvent({
            lesson: "language-arts:consonant-blends-reading-book",
            activity: selectedBlendRef.current ? `blend-${selectedBlendRef.current}` : undefined,
            event: "page_completed",
            value: activeWord,
            success: true,
            attempt,
            page: pageIndexRef.current + 1,
            totalPages: totalPagesRef.current,
          });

          if (pageIndexRef.current < totalPagesRef.current - 1) {
            window.setTimeout(() => {
              setSuccess(false);
              setPageIndex((prev) => Math.min(prev + 1, totalPagesRef.current - 1));
            }, 900);
          } else {
            startQuiz();
          }
        }
      }
    };

    recognition.onend = () => setListening(false);
    recognition.onerror = () => setListening(false);
    return recognition;
  }, [isTranscriptCorrect, microphoneEnabled, startQuiz]);

  const handleMic = useCallback(() => {
    if (!microphoneEnabled) return;
    if (listening) {
      recognitionRef.current?.stop();
      return;
    }
    if (!page) return;

    if (!recognitionRef.current) {
      recognitionRef.current = setupRecognition();
    }
    if (!recognitionRef.current) return;

    const attemptKey = `${selectedBlend ?? "none"}:${page.word}`;
    const nextAttempt = (attemptCountsRef.current[attemptKey] ?? 0) + 1;
    attemptCountsRef.current[attemptKey] = nextAttempt;

    trackLessonEvent({
      lesson: "language-arts:consonant-blends-reading-book",
      activity: selectedBlend ? `blend-${selectedBlend}` : undefined,
      event: "attempt_started",
      value: page.word,
      attempt: nextAttempt,
      page: pageIndex + 1,
      totalPages,
    });

    setSuccess(false);
    setTranscript("");
    setListening(true);
    recognitionRef.current.start();
  }, [listening, microphoneEnabled, page, pageIndex, selectedBlend, setupRecognition, totalPages]);

  useEffect(() => {
    if (microphoneEnabled) return;
    try {
      recognitionRef.current?.stop();
    } catch {
      // Ignore browser recognition stop errors.
    }
    setListening(false);
    setTranscript("");
  }, [microphoneEnabled]);

  useEffect(() => {
    sentenceRef.current = page?.sentence ?? "";
  }, [page]);

  useEffect(() => {
    if (!started || !selectedBlend || !page) return;
    trackLessonEvent({
      lesson: "language-arts:consonant-blends-reading-book",
      activity: `blend-${selectedBlend}`,
      event: "page_viewed",
      page: pageIndex + 1,
      totalPages,
      value: page.word,
    });
  }, [page, pageIndex, selectedBlend, started, totalPages]);

  useEffect(() => {
    return () => {
      stopPointerDrag();
      clearQuizTimer();
      stopBookletAudio();
      if (typeof window !== "undefined") {
        window.speechSynthesis?.cancel();
      }
    };
  }, [clearQuizTimer, stopBookletAudio, stopPointerDrag]);

  useEffect(() => {
    if (!page || !started) {
      setTypedText("");
      return;
    }
    if (typingTimerRef.current !== null) {
      window.clearTimeout(typingTimerRef.current);
      typingTimerRef.current = null;
    }

    let index = 0;
    const full = page.sentence;
    const tick = () => {
      index += 1;
      setTypedText(full.slice(0, index));
      if (index < full.length) {
        typingTimerRef.current = window.setTimeout(tick, 90);
      } else {
        setIsTyping(false);
      }
    };

    setTypedText("");
    setIsTyping(true);
    typingTimerRef.current = window.setTimeout(tick, 400);

    return () => {
      if (typingTimerRef.current !== null) {
        window.clearTimeout(typingTimerRef.current);
        typingTimerRef.current = null;
      }
      setIsTyping(false);
    };
  }, [page, started]);

  const goToPage = useCallback(
    (direction: "next" | "prev") => {
      if (isFlipping) return;
      if (direction === "next" && pageIndex >= totalPages - 1) {
        startQuiz();
        return;
      }
      if (direction === "prev" && pageIndex <= 0) return;

      setFlipDirection(direction);
      setIsFlipping(true);
      setSuccess(false);
      window.setTimeout(() => {
        setPageIndex((prev) => (direction === "next" ? prev + 1 : prev - 1));
        setIsFlipping(false);
      }, 600);
    },
    [isFlipping, pageIndex, startQuiz, totalPages],
  );

  const rightPageTransform = useMemo(() => {
    if (!isFlipping) return "rotateY(0deg)";
    return flipDirection === "next" ? "rotateY(-180deg)" : "rotateY(180deg)";
  }, [isFlipping, flipDirection]);

  const handleBookHome = useCallback(() => {
    const hasActiveBookState = Boolean(
      selectedBlend || started || pageIndex > 0 || transcript || listening || success || quizMode,
    );

    if (!hasActiveBookState) {
      router.replace("/lessons/language-arts/consonant-blends");
      return;
    }

    trackLessonEvent({
      lesson: "language-arts:consonant-blends-reading-book",
      activity: selectedBlend ? `blend-${selectedBlend}` : undefined,
      event: "lesson_reset",
      page: pageIndex + 1,
      totalPages,
    });

    try {
      recognitionRef.current?.stop();
    } catch {
      // Ignore browser recognition stop errors.
    }

    stopPointerDrag();
    clearQuizTimer();
    stopBookletAudio();
    if (typeof window !== "undefined") {
      window.speechSynthesis?.cancel();
    }

    setListening(false);
    setTranscript("");
    setSuccess(false);
    setShowCompletion(false);
    setQuizMode(false);
    setQuizIndex(0);
    setQuizFeedback("idle");
    setQuizIncorrectWord("");
    setQuizDraggedWord("");
    setTouchDragWord(null);
    setTouchDragPoint(null);
    setQuizDropActive(false);
    setStarted(false);
    setPageIndex(0);
    setSelectedBlend(null);
  }, [
    clearQuizTimer,
    listening,
    pageIndex,
    quizMode,
    router,
    selectedBlend,
    started,
    stopBookletAudio,
    stopPointerDrag,
    success,
    totalPages,
    transcript,
  ]);

  return (
    <div className="relative min-h-screen bg-[radial-gradient(circle_at_top,#eef6ff,#f9fcff_55%,#f3f8ff)]">
      <HomeLink onClick={handleBookHome} />
      <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-10 px-6 py-10">
        <header className="space-y-3 text-center md:space-y-3">
          <p className="hidden text-xs uppercase tracking-[0.35em] text-stone-400 md:block">
            Language Arts · Consonant Blends | Blue Series
          </p>
          <h1 className="hidden font-display text-4xl font-semibold text-stone-900 md:block">
            Consonant Blend Illustrated Books
          </h1>
          <p className="hidden text-sm text-stone-600 md:block">Choose a blend book and read along.</p>
        </header>

        <MicrophoneLessonBanner microphoneEnabled={microphoneEnabled} />

        {!selectedBlend ? (
          <div className="mx-auto grid w-full max-w-5xl gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {BLEND_ORDER.map((blend) => {
              const blendPages = pagesByBlend[blend] ?? [];
              const preview = blendPages[0];
              return (
                <button
                  key={blend}
                  type="button"
                  onClick={() => {
                    trackLessonEvent({
                      lesson: "language-arts:consonant-blends-reading-book",
                      activity: `blend-${blend}`,
                      event: "blend_selected",
                      value: blend,
                    });
                    setSelectedBlend(blend);
                    setStarted(false);
                    setPageIndex(0);
                    setTranscript("");
                    setQuizMode(false);
                    setQuizIndex(0);
                    setQuizFeedback("idle");
                    setQuizIncorrectWord("");
                    setQuizDraggedWord("");
                    setTouchDragWord(null);
                    setTouchDragPoint(null);
                    setQuizDropActive(false);
                  }}
                  className="group relative flex h-56 flex-col items-center justify-center gap-4 rounded-3xl border border-sky-200 bg-gradient-to-br from-sky-100 via-white to-blue-50 p-6 shadow-[0_25px_60px_-40px_rgba(15,23,42,0.7)] transition hover:-translate-y-1 hover:shadow-[0_35px_80px_-45px_rgba(15,23,42,0.7)]"
                >
                  <div className="absolute top-5 right-5 text-xs uppercase tracking-[0.35em] text-sky-500">
                    Book
                  </div>
                  <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-2xl border border-sky-200 bg-white/95 shadow-inner">
                    {preview ? (
                      <ReadingBookImage
                        page={preview}
                        alt={preview.word}
                        className="h-full w-full object-contain"
                      />
                    ) : (
                      <span className="text-3xl font-bold lowercase text-rose-600">{blend}</span>
                    )}
                  </div>
                  <div className="text-3xl font-bold lowercase text-rose-600">{blend}</div>
                  <div className="text-xs uppercase tracking-[0.35em] text-sky-600">Open</div>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="relative mx-auto w-full max-w-[980px]">
            {!started ? (
              <div className="relative aspect-[4/3] w-full rounded-[32px] bg-[#e6eef8] shadow-[0_40px_90px_-50px_rgba(15,23,42,0.7)] sm:aspect-[3/2]">
                <div className="absolute inset-3 rounded-[24px] border border-sky-200 bg-white/60 sm:inset-4 sm:rounded-[28px]" />
                <div className="absolute inset-5 sm:inset-8">
                  <div className="flex h-full w-full flex-col items-center justify-center gap-6 rounded-3xl bg-gradient-to-br from-sky-100 via-white to-blue-50 px-6 text-center shadow-inner">
                    {coverPage ? (
                      <>
                        <ReadingBookImageComparison
                          page={coverPage}
                          className="max-w-[700px]"
                          imageClassName="h-28 w-full sm:h-44"
                        />
                        <p className="text-2xl font-semibold text-stone-800">
                          {renderSentence(coverPage.sentence, coverPage.word, selectedBlend)}
                        </p>
                      </>
                    ) : (
                      <>
                        <div className="text-3xl font-semibold text-stone-800">{COVER_TITLE}</div>
                        <div className="mt-2 text-lg uppercase tracking-[0.3em] text-stone-500">
                          {COVER_SUBTITLE}
                        </div>
                      </>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        trackLessonEvent({
                          lesson: "language-arts:consonant-blends-reading-book",
                          activity: `blend-${selectedBlend}`,
                          event: "lesson_started",
                          value: selectedBlend,
                        });
                        setQuizMode(false);
                        setQuizIndex(0);
                        setQuizFeedback("idle");
                        setQuizIncorrectWord("");
                        setQuizDraggedWord("");
                        setTouchDragWord(null);
                        setTouchDragPoint(null);
                        setQuizDropActive(false);
                        setStarted(true);
                      }}
                      className="inline-flex items-center justify-center rounded-full border border-emerald-200 bg-emerald-50 px-10 py-4 text-sm uppercase tracking-[0.35em] text-emerald-700 shadow-sm transition hover:bg-emerald-100"
                    >
                      Start
                    </button>
                  </div>
                </div>
              </div>
            ) : showQuiz && activeQuizCard ? (
              <div className="rounded-[32px] bg-[#e6eef8] p-4 shadow-[0_40px_90px_-50px_rgba(15,23,42,0.7)] sm:p-8">
                <div
                  className={`mx-auto flex max-w-4xl flex-col gap-6 rounded-3xl border p-5 shadow-inner transition sm:p-8 ${
                    quizFeedback === "correct"
                      ? "border-emerald-300 bg-emerald-50/80"
                      : quizFeedback === "incorrect"
                        ? "border-rose-300 bg-rose-50/80"
                        : "border-sky-200 bg-white/90"
                  }`}
                >
                  <div className="text-center">
                    <p className="text-xs uppercase tracking-[0.35em] text-stone-500">Book Quiz</p>
                    <p className="mt-2 text-lg font-semibold text-stone-800">Drag the missing word to the sentence.</p>
                    <p className="mt-1 text-xs uppercase tracking-[0.28em] text-stone-400">
                      Card {quizIndex + 1} of {quizCards.length}
                    </p>
                  </div>

                  <div className="grid gap-6 md:grid-cols-[auto,1fr] md:items-center">
                    <ReadingBookImage
                      page={activeQuizCard}
                      alt={activeQuizCard.word}
                      className="h-48 w-48 justify-self-center object-contain sm:h-56 sm:w-56"
                    />
                    <div className="space-y-4">
                      <p className="text-2xl font-semibold leading-tight text-stone-800 sm:text-3xl">
                        {activeQuizSentenceParts?.found ? (
                          <>
                            {activeQuizSentenceParts.before}
                            <span
                              ref={dropZoneRef}
                              onDragOver={(event) => {
                                event.preventDefault();
                                setQuizDropActive(true);
                              }}
                              onDragLeave={() => setQuizDropActive(false)}
                              onDrop={handleQuizDrop}
                              className={`mx-1 inline-flex min-h-[1.8em] min-w-[6ch] items-center justify-center rounded-lg border border-dashed px-2 py-1 align-middle transition ${
                                quizFeedback === "correct"
                                  ? "border-emerald-300 bg-emerald-100 text-emerald-800"
                                  : quizFeedback === "incorrect"
                                    ? "border-rose-300 bg-rose-100 text-rose-700"
                                    : quizDropActive || Boolean(touchDragWord)
                                      ? "border-sky-300 bg-sky-100 text-sky-700"
                                      : "border-sky-300 bg-sky-50 text-sky-700"
                              }`}
                            >
                              {quizFeedback === "correct" ? (
                                <span className="inline-flex gap-[0.02em] lowercase">
                                  {renderBlendWord(activeQuizCard.word, activeQuizCard.blend)}
                                </span>
                              ) : (
                                "_".repeat(Math.max(3, activeQuizCard.word.length))
                              )}
                            </span>
                            {activeQuizSentenceParts.after}
                          </>
                        ) : (
                          activeQuizCard.sentence
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap justify-center gap-3">
                    {activeQuizCard.options.map((option) => {
                      const normalizedOption = option.toLowerCase();
                      const isIncorrectOption =
                        quizFeedback === "incorrect" && quizIncorrectWord === normalizedOption;
                      const isDragging = quizDraggedWord === normalizedOption;
                      return (
                        <button
                          key={option}
                          type="button"
                          draggable={quizFeedback !== "correct"}
                          onDragStart={(event) => handleQuizDragStart(event, option)}
                          onDragEnd={() => setQuizDraggedWord("")}
                          onPointerDown={(event) => handleQuizPointerStart(event, option)}
                          onTouchStart={(event) => handleQuizTouchStart(event, option)}
                          disabled={quizFeedback === "correct"}
                          className={`rounded-full border px-6 py-2.5 text-base font-semibold uppercase tracking-[0.2em] transition ${
                            isIncorrectOption
                              ? "animate-bounce border-rose-300 bg-rose-100 text-rose-700"
                              : isDragging
                                ? "border-sky-300 bg-sky-100 text-sky-700"
                                : "border-stone-300 bg-white text-stone-700 hover:bg-sky-50"
                          }`}
                        >
                          <span className="inline-flex gap-[0.02em] lowercase">
                            {renderBlendWord(option, activeQuizCard.blend)}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                  {touchDragWord && touchDragPoint ? (
                    <div
                      className="pointer-events-none fixed z-[120] -translate-x-1/2 -translate-y-1/2 rounded-full border border-sky-300 bg-white/95 px-5 py-2.5 text-base font-semibold shadow-lg"
                      style={{ left: touchDragPoint.x, top: touchDragPoint.y }}
                    >
                      <span className="inline-flex gap-[0.02em] lowercase">
                        {renderBlendWord(touchDragWord, activeQuizCard.blend)}
                      </span>
                    </div>
                  ) : null}
                </div>
              </div>
            ) : (
              <>
                <div className="md:hidden">
                  <div className="rounded-[28px] bg-[#e6eef8] p-3 shadow-[0_30px_70px_-45px_rgba(15,23,42,0.7)]">
                    <div className="rounded-[24px] border border-sky-200 bg-white/80 p-4">
                      <div className="flex flex-col items-center gap-4 rounded-2xl bg-white/90 p-4 shadow-inner">
                        {page ? (
                          <>
                            <ReadingBookImageComparison
                              page={page}
                              className="w-full"
                              imageClassName="h-28 w-full"
                            />
                            <p className="w-full max-w-full whitespace-normal break-words px-1 text-center text-4xl font-semibold leading-tight text-stone-800">
                              {renderSentence(isTyping ? typedText : page.sentence, page.word, selectedBlend)}
                            </p>
                          </>
                        ) : null}
                        <div className="mt-4 grid w-full grid-cols-1 gap-3">
                          <button
                            type="button"
                            onClick={() => page && playBookletAudio(page, page.sentence)}
                            className="inline-flex items-center justify-center rounded-full border border-emerald-200 bg-emerald-50 px-5 py-3 text-xs uppercase tracking-[0.35em] text-emerald-700 shadow-sm"
                          >
                            🔊 Read To Me
                          </button>
                          {microphoneEnabled ? (
                            <button
                              type="button"
                              onClick={handleMic}
                              className={`inline-flex items-center justify-center rounded-full border px-5 py-3 text-xs uppercase tracking-[0.35em] shadow-sm ${
                                listening
                                  ? "border-rose-300 bg-rose-100 text-rose-700"
                                  : "border-sky-200 bg-sky-50 text-sky-700"
                              }`}
                            >
                              🎤 {listening ? "Listening" : "Let Me Speak!"}
                            </button>
                          ) : (
                            <div className="inline-flex items-center justify-center rounded-full border border-stone-300 bg-stone-100 px-5 py-3 text-xs uppercase tracking-[0.35em] text-stone-600 shadow-sm">
                              Mic Off
                            </div>
                          )}
                        </div>
                        {microphoneEnabled && transcript ? (
                          <div className="rounded-2xl border border-stone-200 bg-stone-50 p-3 text-sm text-stone-600">
                            You said: <span className="font-semibold text-stone-800">{transcript}</span>
                          </div>
                        ) : null}
                        <div className="text-[10px] uppercase tracking-[0.35em] text-stone-400">
                          Page {pageIndex + 1} of {totalPages}
                        </div>
                        {success ? (
                          <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-emerald-500/25">
                            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/90 text-3xl text-emerald-600 shadow-lg">
                              ✓
                            </div>
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="hidden md:block">
                  <div className="relative mx-auto w-full" style={{ perspective: "1800px" }}>
                    <div className="relative aspect-[3/2] w-full rounded-[32px] bg-[#e6eef8] shadow-[0_40px_90px_-50px_rgba(15,23,42,0.7)]">
                      <div className="absolute inset-y-0 left-1/2 w-[2px] -translate-x-1/2 bg-sky-200/70" />
                      <div className="absolute inset-y-4 left-4 right-4 rounded-[28px] border border-sky-200 bg-white/60" />

                      <div className="absolute inset-y-0 left-0 w-1/2 p-8">
                        <div className="flex h-full flex-col items-center justify-center gap-4">
                          {page ? (
                            <div className="flex h-full w-full flex-col items-center justify-center gap-4 rounded-3xl bg-white/90 p-6 shadow-inner">
                              <ReadingBookImageComparison
                                page={page}
                                className="w-full"
                                imageClassName="h-44 w-full"
                              />
                            </div>
                          ) : null}
                        </div>
                      </div>

                      <div
                        className="absolute inset-y-0 right-0 w-1/2 origin-left transition-transform duration-700"
                        style={{ transformStyle: "preserve-3d", transform: rightPageTransform }}
                      >
                        <div className="absolute inset-0 p-8" style={{ backfaceVisibility: "hidden" }}>
                          <div className="relative flex h-full w-full flex-col rounded-3xl bg-white/95 p-6 shadow-inner">
                            <div className="flex flex-1 items-center justify-center text-center">
                              <p className="w-full max-w-full whitespace-normal break-words px-2 text-center text-4xl font-semibold leading-tight text-stone-800">
                                {page
                                  ? renderSentence(
                                      isTyping ? typedText : page.sentence,
                                      page.word,
                                      selectedBlend,
                                    )
                                  : null}
                              </p>
                            </div>
                            <div className="flex items-center justify-center gap-3 pb-8">
                              <button
                                type="button"
                                onClick={() => page && playBookletAudio(page, page.sentence)}
                                className="inline-flex items-center justify-center rounded-full border border-emerald-200 bg-emerald-50 px-5 py-2 text-xs uppercase tracking-[0.35em] text-emerald-700 shadow-sm transition hover:bg-emerald-100"
                              >
                                🔊 Read To Me
                              </button>
                              {microphoneEnabled ? (
                                <button
                                  type="button"
                                  onClick={handleMic}
                                  className={`inline-flex items-center justify-center rounded-full border px-5 py-2 text-xs uppercase tracking-[0.35em] shadow-sm transition ${
                                    listening
                                      ? "border-rose-300 bg-rose-100 text-rose-700"
                                      : "border-sky-200 bg-sky-50 text-sky-700 hover:bg-sky-100"
                                  }`}
                                >
                                  🎤 {listening ? "Listening" : "Let Me Speak!"}
                                </button>
                              ) : (
                                <div className="inline-flex items-center justify-center rounded-full border border-stone-300 bg-stone-100 px-5 py-2 text-xs uppercase tracking-[0.35em] text-stone-600 shadow-sm">
                                  Mic Off
                                </div>
                              )}
                            </div>
                            {microphoneEnabled && transcript ? (
                              <div className="rounded-2xl border border-stone-200 bg-stone-50 p-3 text-sm text-stone-600">
                                You said: <span className="font-semibold text-stone-800">{transcript}</span>
                              </div>
                            ) : null}
                            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 text-[10px] uppercase tracking-[0.35em] text-stone-400">
                              Page {pageIndex + 1} of {totalPages}
                            </div>
                            {success ? (
                              <div className="absolute inset-0 flex items-center justify-center rounded-3xl bg-emerald-500/25">
                                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white/90 text-4xl text-emerald-600 shadow-lg">
                                  ✓
                                </div>
                              </div>
                            ) : null}
                          </div>
                        </div>
                        <div
                          className="absolute inset-0 rounded-3xl bg-white/95"
                          style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}

            <div ref={settingsRef} className="absolute right-3 bottom-3 z-40">
              <button
                type="button"
                onClick={() => setSettingsOpen((open) => !open)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-stone-300 bg-white/95 text-stone-700 shadow-lg backdrop-blur-sm transition hover:bg-white"
                aria-label="Reading speed settings"
              >
                <svg
                  viewBox="0 0 24 24"
                  className="h-5 w-5 fill-none stroke-current"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="3" />
                  <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33h.01A1.65 1.65 0 0 0 10.58 3V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51h.01a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82v.01a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z" />
                </svg>
              </button>

              {settingsOpen ? (
                <div className="absolute right-0 bottom-12 w-60 rounded-2xl border border-stone-200 bg-white/95 p-2 shadow-xl backdrop-blur-sm">
                  <p className="px-2 py-1 text-[10px] uppercase tracking-[0.25em] text-stone-500">
                    Reading Speed
                  </p>
                  <div className="mt-1 space-y-1">
                    {BOOKLET_SPEED_OPTIONS.map((option) => {
                      const active = playbackRate === option.value;
                      return (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => {
                            trackLessonEvent({
                              lesson: "language-arts:consonant-blends-reading-book",
                              activity: selectedBlend ? `blend-${selectedBlend}` : undefined,
                              event: "speed_changed",
                              value: option.label,
                              details: {
                                speed: option.value,
                              },
                            });
                            setPlaybackRate(option.value);
                            setSettingsOpen(false);
                          }}
                          className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-sm transition ${
                            active ? "bg-sky-100 text-sky-800" : "text-stone-700 hover:bg-stone-100"
                          }`}
                        >
                          <span>{option.label}</span>
                          <span className="font-semibold">{option.value.toFixed(1)}x</span>
                        </button>
                      );
                    })}
                  </div>
                  <div className="mt-2 border-t border-stone-200 pt-2">
                    <p className="px-2 py-1 text-[10px] uppercase tracking-[0.25em] text-stone-500">
                      Microphone
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        const nextEnabled = !microphoneEnabled;
                        if (!confirmMicrophonePreferenceChange(nextEnabled)) {
                          return;
                        }
                        setMicrophoneEnabled(nextEnabled);
                      }}
                      className={`mt-1 flex w-full items-center justify-between rounded-xl px-3 py-2 text-sm transition ${
                        microphoneEnabled
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-stone-100 text-stone-700"
                      }`}
                    >
                      <span>{microphoneEnabled ? "Enabled" : "Disabled"}</span>
                      <span className="font-semibold">{microphoneEnabled ? "On" : "Off"}</span>
                    </button>
                    <p className="mt-1 px-2 text-[11px] text-stone-500">
                      {microphoneEnabled
                        ? "On: uses spoken-answer checks."
                        : "Off: no microphone prompts."}
                    </p>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        )}

        {selectedBlend && !quizMode ? (
          <div className="flex flex-wrap items-center justify-center gap-4">
            <button
              type="button"
              onClick={() => goToPage("prev")}
              className="inline-flex items-center justify-center gap-2 rounded-full border border-rose-200 bg-rose-50 px-8 py-4 text-sm uppercase tracking-[0.4em] text-rose-700 shadow-sm transition hover:bg-rose-100 disabled:opacity-40"
              disabled={!started || isTyping || pageIndex === 0}
            >
              ← Previous
            </button>
            <button
              type="button"
              onClick={() => goToPage("next")}
              className="inline-flex items-center justify-center gap-2 rounded-full border border-sky-200 bg-sky-50 px-8 py-4 text-sm uppercase tracking-[0.4em] text-sky-700 shadow-sm transition hover:bg-sky-100 disabled:opacity-40"
              disabled={!started || isTyping || totalPages === 0}
            >
              {pageIndex >= totalPages - 1 ? "Start Quiz →" : "Next →"}
            </button>
          </div>
        ) : null}
        <MaterialTeachersGuide guide={BLUE_BOOKLETS_TEACHERS_GUIDE} />
      </main>

      <CompletionOverlay
        open={showCompletion}
        title={nextBlendInSeries ? "Lesson Complete" : "Series Complete"}
        message={
          nextBlendInSeries
            ? `Great work on blend ${selectedBlend?.toUpperCase() ?? ""}.`
            : `You completed ${selectedBlend?.toUpperCase() ?? ""} in this material.`
        }
        primaryAction={
          nextBlendInSeries
            ? {
                label: `Next Lesson: Blend ${nextBlendInSeries.toUpperCase()}`,
                onClick: () => {
                  try {
                    recognitionRef.current?.stop();
                  } catch {
                    // Ignore browser recognition stop errors.
                  }
                  clearQuizTimer();
                  stopPointerDrag();
                  stopBookletAudio();
                  if (typeof window !== "undefined") {
                    window.speechSynthesis?.cancel();
                  }
                  setListening(false);
                  setTranscript("");
                  setSuccess(false);
                  setShowCompletion(false);
                  setQuizMode(false);
                  setQuizIndex(0);
                  setQuizFeedback("idle");
                  setQuizIncorrectWord("");
                  setQuizDraggedWord("");
                  setTouchDragWord(null);
                  setTouchDragPoint(null);
                  setQuizDropActive(false);
                  setStarted(false);
                  setPageIndex(0);
                  setSelectedBlend(nextBlendInSeries);
                },
              }
            : { href: "/lessons/language-arts/consonant-blends", label: "Back to Blue Series" }
        }
        secondaryAction={{ href: "/lessons/language-arts/consonant-blends", label: "Back to Blue Series" }}
      />
    </div>
  );
}
