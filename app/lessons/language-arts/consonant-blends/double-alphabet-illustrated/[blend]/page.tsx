"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import HomeLink from "../../../../../components/HomeLink";
import CompletionOverlay from "../../../../../components/CompletionOverlay";
import { trackLessonEvent } from "../../../../../lib/lessonTelemetry";
import { primeSpeechVoices, speakWithPreferredVoice } from "../../../../../lib/speech";

const BOARD_IMAGE = "/assets/Boards/2_moveable_alphabets_board_5_letters_1_picture.svg";
const PICTURE_IMAGE_BASE = "/assets/language_arts/consonant_blend/consonant_blend_picture_cards_drawings";
const RED_LETTER_BASE = "/assets/language_arts/consonant_blend/consonant_blend_moveable_alphabet/moveable_alphabet_letter_png_red";
const BLACK_LETTER_BASE =
  "/assets/language_arts/consonant_blend/consonant_blend_moveable_alphabet/moveable_alphabet_letter_png_black";

const BOARD_WIDTH = 1366;
const BOARD_HEIGHT = 768;
const MAX_LETTERS = 5;
const DROP_THRESHOLD = 76;

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

type LetterColor = "red" | "black";

type FileListResponse = {
  files?: unknown;
};

type PictureItem = {
  blend: BlendKey;
  word: string;
  order: number;
  file: string;
};

type LetterState = {
  id: string;
  color: LetterColor;
  letter: string;
  x: number;
  y: number;
  homeX: number;
  homeY: number;
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

const PICTURE_SLOT = {
  id: "pic1-holder",
  x: 368.9,
  y: 42.2,
  width: 141,
  height: 141,
};

const DROP_ZONE_DEFINITIONS = [
  { id: "pic1-answer-letter-1", x: 521.5, y: 63.4, width: 78, height: 116.6, index: 0 },
  { id: "pic1-answer-letter-2", x: 620.9, y: 63.4, width: 78, height: 116.6, index: 1 },
  { id: "pic1-answer-letter-3", x: 720.3, y: 63.4, width: 78, height: 116.6, index: 2 },
  { id: "pic1-answer-letter-4", x: 819.7, y: 63.4, width: 78, height: 116.6, index: 3 },
  { id: "pic1-answer-letter-5", x: 919, y: 63.4, width: 78.1, height: 116.3, index: 4 },
] as const;

const DROP_ZONES = DROP_ZONE_DEFINITIONS.map((zone) => ({
  ...zone,
  centerX: zone.x + zone.width / 2,
  centerY: zone.y + zone.height / 2,
}));

const RED_BOARD_BOUNDS = { x: 156.1, y: 221.5, width: 499.6, height: 484.9 };
const BLACK_BOARD_BOUNDS = { x: 704.6, y: 221.5, width: 499.6, height: 484.9 };

const LETTER_SCALE_OVERRIDES: Record<string, number> = {
  r: 0.85,
  s: 0.9,
  c: 0.9,
  u: 0.9,
  n: 0.9,
  w: 1.56,
  m: 1.15,
};

const RED_DOUBLE_ALPHABET_POSITIONS = [
  { letter: "a", x: 201.5, y: 304.9 },
  { letter: "b", x: 274.3, y: 306.4 },
  { letter: "c", x: 338.1, y: 303.8 },
  { letter: "d", x: 405.9, y: 308.9 },
  { letter: "e", x: 473.1, y: 307.4 },
  { letter: "f", x: 540.0, y: 319.5 },
  { letter: "g", x: 608.8, y: 313.8 },
  { letter: "h", x: 202.6, y: 411.7 },
  { letter: "i", x: 271.0, y: 413.0 },
  { letter: "j", x: 335.0, y: 416.6 },
  { letter: "k", x: 404.9, y: 417.2 },
  { letter: "l", x: 469.0, y: 418.1 },
  { letter: "m", x: 575.6, y: 424.0 },
  { letter: "n", x: 200.3, y: 521.7 },
  { letter: "o", x: 269.3, y: 522.3 },
  { letter: "p", x: 409.2, y: 518.2 },
  { letter: "q", x: 337.6, y: 520.9 },
  { letter: "r", x: 481.0, y: 524.8 },
  { letter: "s", x: 542.5, y: 526.5 },
  { letter: "t", x: 603.1, y: 529.2 },
  { letter: "u", x: 203.5, y: 632.9 },
  { letter: "v", x: 271.8, y: 637.3 },
  { letter: "w", x: 375.2, y: 635.1 },
  { letter: "x", x: 474.1, y: 632.4 },
  { letter: "y", x: 538.7, y: 631.5 },
  { letter: "z", x: 602.8, y: 636.4 },
] as const;

const BLACK_DOUBLE_ALPHABET_POSITIONS = [
  { letter: "a", x: 751.4, y: 299.8 },
  { letter: "b", x: 822.3, y: 298.2 },
  { letter: "c", x: 887.8, y: 297.3 },
  { letter: "d", x: 956.1, y: 300.7 },
  { letter: "e", x: 1026.2, y: 297.7 },
  { letter: "f", x: 1091.3, y: 309.4 },
  { letter: "g", x: 1158.7, y: 300.4 },
  { letter: "h", x: 753.0, y: 411.9 },
  { letter: "i", x: 816.4, y: 410.4 },
  { letter: "j", x: 888.5, y: 418.8 },
  { letter: "k", x: 954.7, y: 420.4 },
  { letter: "l", x: 1021.2, y: 421.1 },
  { letter: "m", x: 1122.5, y: 419.8 },
  { letter: "n", x: 751.4, y: 516.5 },
  { letter: "o", x: 815.7, y: 514.4 },
  { letter: "p", x: 885.8, y: 510.4 },
  { letter: "q", x: 952.6, y: 513.6 },
  { letter: "r", x: 1021.7, y: 516.2 },
  { letter: "s", x: 1090.5, y: 516.8 },
  { letter: "t", x: 1156.9, y: 528.5 },
  { letter: "u", x: 750.7, y: 638.6 },
  { letter: "v", x: 821.2, y: 638.6 },
  { letter: "w", x: 924.6, y: 636.8 },
  { letter: "x", x: 1025.4, y: 637.0 },
  { letter: "y", x: 1094.1, y: 631.0 },
  { letter: "z", x: 1153.0, y: 634.1 },
] as const;

const buildFallbackFiles = () =>
  BLEND_ORDER.flatMap((blend) =>
    BLEND_WORDS[blend].map(
      (word, index) => `${blend}-${word}-${index + 1}-${word}____consonant_blends_illustrations.png`,
    ),
  );

const parsePictureFile = (file: string): PictureItem | null => {
  const match = file.match(
    /^([a-z]{2})-([a-z]+)-(\d+)-([a-z]+)____consonant_blends(?:_illustratio(?:n(?:s)?)?)?\.png$/i,
  );
  if (!match) return null;
  const blend = match[1].toLowerCase() as BlendKey;
  if (!BLEND_ORDER.includes(blend)) return null;
  return {
    blend,
    word: match[2].toLowerCase(),
    order: Number(match[3]),
    file,
  };
};

const buildInitialLetters = (): LetterState[] => {
  const red = RED_DOUBLE_ALPHABET_POSITIONS.map((position) => {
    return {
      id: `red-${position.letter}`,
      color: "red" as const,
      letter: position.letter,
      x: position.x,
      y: position.y,
      homeX: position.x,
      homeY: position.y,
    };
  });

  const black = BLACK_DOUBLE_ALPHABET_POSITIONS.map((position) => {
    return {
      id: `black-${position.letter}`,
      color: "black" as const,
      letter: position.letter,
      x: position.x,
      y: position.y,
      homeX: position.x,
      homeY: position.y,
    };
  });

  return [...red, ...black];
};

const expectedColorForIndex = (index: number): LetterColor => (index < 2 ? "red" : "black");

export default function ConsonantBlendDoubleAlphabetLesson() {
  const params = useParams<{ blend?: string }>();
  const rawBlend = typeof params?.blend === "string" ? params.blend.toLowerCase() : "bl";
  const activeBlend = BLEND_ORDER.includes(rawBlend as BlendKey) ? (rawBlend as BlendKey) : "bl";

  const boardRef = useRef<HTMLDivElement | null>(null);
  const boardRectRef = useRef<DOMRect | null>(null);
  const advanceTimeoutRef = useRef<number | null>(null);
  const successFlashTimeoutRef = useRef<number | null>(null);
  const firstSlotCueTimeoutRef = useRef<number | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  const completedStagesRef = useRef<Record<string, true>>({});
  const announcedStageSpeechRef = useRef<string | null>(null);
  const attemptCountRef = useRef(0);
  const cloneCounterRef = useRef(0);
  const demoAbortRef = useRef(false);

  const [pictureFiles, setPictureFiles] = useState<string[]>(() => buildFallbackFiles());
  const [stageIndex, setStageIndex] = useState(0);
  const [letters, setLetters] = useState<LetterState[]>(() => buildInitialLetters());
  const [assignments, setAssignments] = useState<Record<string, string>>({});
  const [dragging, setDragging] = useState<{ id: string; offsetX: number; offsetY: number } | null>(null);
  const [statusMessage, setStatusMessage] = useState("");
  const [showSuccessFlash, setShowSuccessFlash] = useState(false);
  const [showFirstSlotCue, setShowFirstSlotCue] = useState(false);
  const [isBlendComplete, setIsBlendComplete] = useState(false);
  const [demoRunning, setDemoRunning] = useState(false);
  const [demoPlayed, setDemoPlayed] = useState(false);
  const [activeDemoBoard, setActiveDemoBoard] = useState<LetterColor | null>(null);

  const lettersRef = useRef<LetterState[]>(letters);
  const assignmentsRef = useRef<Record<string, string>>(assignments);

  useEffect(() => {
    lettersRef.current = letters;
  }, [letters]);

  useEffect(() => {
    assignmentsRef.current = assignments;
  }, [assignments]);

  const pictureItems = useMemo(
    () => pictureFiles.map(parsePictureFile).filter((item): item is PictureItem => Boolean(item)),
    [pictureFiles],
  );

  const blendStages = useMemo(
    () =>
      pictureItems
        .filter((item) => item.blend === activeBlend)
        .sort((a, b) => (a.order === b.order ? a.file.localeCompare(b.file) : a.order - b.order)),
    [activeBlend, pictureItems],
  );

  const stageCount = blendStages.length;
  const activeStage = blendStages[stageIndex] ?? blendStages[0] ?? null;
  const activeWord = activeStage?.word ?? "";
  const activeWordLength = Math.min(MAX_LETTERS, activeWord.length);

  const requiresDemo = stageIndex === 0 && !demoPlayed;

  const lettersById = useMemo(() => {
    const map = new Map<string, LetterState>();
    letters.forEach((letter) => {
      map.set(letter.id, letter);
    });
    return map;
  }, [letters]);

  const wordMatched = useMemo(() => {
    if (!activeWordLength) return false;
    for (let index = 0; index < activeWordLength; index += 1) {
      const zone = DROP_ZONES[index];
      const expectedLetter = activeWord[index];
      const expectedColor = expectedColorForIndex(index);
      const assignedId = assignments[zone.id];
      if (!assignedId) return false;
      const letter = lettersById.get(assignedId);
      if (!letter) return false;
      if (letter.letter !== expectedLetter || letter.color !== expectedColor) {
        return false;
      }
    }
    return true;
  }, [activeWord, activeWordLength, assignments, lettersById]);

  const handleSpeak = useCallback((text: string, interrupt = true) => {
    speakWithPreferredVoice(text, {
      lang: "en-US",
      rate: 0.9,
      pitch: 0.95,
      volume: 0.9,
      interrupt,
    });
  }, []);

  const resetStageBoard = useCallback(() => {
    const initialLetters = buildInitialLetters();
    lettersRef.current = initialLetters;
    assignmentsRef.current = {};
    setLetters(initialLetters);
    setAssignments({});
    setDragging(null);
    setStatusMessage("");
    setShowSuccessFlash(false);
    setShowFirstSlotCue(false);
    setActiveDemoBoard(null);
    if (successFlashTimeoutRef.current !== null) {
      window.clearTimeout(successFlashTimeoutRef.current);
      successFlashTimeoutRef.current = null;
    }
    if (firstSlotCueTimeoutRef.current !== null) {
      window.clearTimeout(firstSlotCueTimeoutRef.current);
      firstSlotCueTimeoutRef.current = null;
    }
  }, []);

  const getPointerClient = useCallback((event: PointerEvent) => {
    const viewport = typeof window !== "undefined" ? window.visualViewport : null;
    const offsetLeft = viewport?.offsetLeft ?? 0;
    const offsetTop = viewport?.offsetTop ?? 0;
    return { x: event.clientX + offsetLeft, y: event.clientY + offsetTop };
  }, []);

  const convertPointerToBoard = useCallback(
    (event: PointerEvent) => {
      const rect = boardRectRef.current;
      if (!rect) return null;
      const point = getPointerClient(event);
      const x = ((point.x - rect.left) / rect.width) * BOARD_WIDTH;
      const y = ((point.y - rect.top) / rect.height) * BOARD_HEIGHT;
      return { x, y };
    },
    [getPointerClient],
  );

  const removeAssignment = useCallback((letterId: string) => {
    const current = assignmentsRef.current;
    let changed = false;
    const next = { ...current };
    Object.keys(next).forEach((zoneId) => {
      if (next[zoneId] === letterId) {
        delete next[zoneId];
        changed = true;
      }
    });
    if (!changed) return;
    assignmentsRef.current = next;
    setAssignments(next);
  }, []);

  const placeLetterInZone = useCallback((letter: LetterState, zone: (typeof DROP_ZONES)[number], createClone: boolean) => {
    const previousAssignments = assignmentsRef.current;
    const nextAssignments = { ...previousAssignments };

    Object.keys(nextAssignments).forEach((zoneId) => {
      if (nextAssignments[zoneId] === letter.id) {
        delete nextAssignments[zoneId];
      }
    });

    const occupiedBy = nextAssignments[zone.id];
    if (occupiedBy && occupiedBy !== letter.id) {
      return false;
    }

    nextAssignments[zone.id] = letter.id;

    const movedLetters = lettersRef.current.map((entry) => {
      if (entry.id === letter.id) {
        return {
          ...entry,
          x: zone.centerX,
          y: zone.centerY,
        };
      }
      return entry;
    });

    const nextLetters = createClone
      ? [
          ...movedLetters,
          {
            id: `${letter.color}-${letter.letter}-clone-${cloneCounterRef.current++}`,
            color: letter.color,
            letter: letter.letter,
            x: letter.homeX,
            y: letter.homeY,
            homeX: letter.homeX,
            homeY: letter.homeY,
          },
        ]
      : movedLetters;

    assignmentsRef.current = nextAssignments;
    lettersRef.current = nextLetters;
    setAssignments(nextAssignments);
    setLetters(nextLetters);
    return true;
  }, []);

  const animateLetterTo = useCallback((letterId: string, targetX: number, targetY: number, duration = 900) => {
    return new Promise<void>((resolve) => {
      const source = lettersRef.current.find((entry) => entry.id === letterId);
      if (!source) {
        resolve();
        return;
      }

      const fromX = source.x;
      const fromY = source.y;
      const startTime = performance.now();

      const tick = (now: number) => {
        if (demoAbortRef.current) {
          resolve();
          return;
        }
        const progress = Math.min(1, (now - startTime) / duration);
        const eased = 1 - (1 - progress) * (1 - progress) * (1 - progress);
        const x = fromX + (targetX - fromX) * eased;
        const y = fromY + (targetY - fromY) * eased;

        setLetters((current) => {
          const next = current.map((entry) => (entry.id === letterId ? { ...entry, x, y } : entry));
          lettersRef.current = next;
          return next;
        });

        if (progress < 1) {
          animationFrameRef.current = window.requestAnimationFrame(tick);
          return;
        }

        resolve();
      };

      animationFrameRef.current = window.requestAnimationFrame(tick);
    });
  }, []);

  useEffect(() => {
    const board = boardRef.current;
    if (!board) return;
    const updateRect = () => {
      boardRectRef.current = board.getBoundingClientRect();
    };
    updateRect();
    window.addEventListener("resize", updateRect);
    window.addEventListener("scroll", updateRect, { passive: true });
    const viewport = window.visualViewport;
    viewport?.addEventListener("resize", updateRect);
    viewport?.addEventListener("scroll", updateRect);
    const observer = new ResizeObserver(() => updateRect());
    observer.observe(board);
    return () => {
      window.removeEventListener("resize", updateRect);
      window.removeEventListener("scroll", updateRect);
      viewport?.removeEventListener("resize", updateRect);
      viewport?.removeEventListener("scroll", updateRect);
      observer.disconnect();
    };
  }, []);

  useEffect(() => {
    let active = true;
    const loadPictureFiles = async () => {
      try {
        const response = await fetch("/api/language-arts/consonant-blends/cards-drawings", { cache: "no-store" });
        if (response.ok) {
          const payload = (await response.json()) as FileListResponse;
          const files = Array.isArray(payload.files)
            ? payload.files.filter((value): value is string => typeof value === "string")
            : [];
          if (files.length && active) {
            setPictureFiles(files);
            return;
          }
        }

        const manifestResponse = await fetch(
          "/assets/language_arts/consonant_blend/consonant_blend_picture_cards_drawings/manifest.json",
          { cache: "no-store" },
        );
        if (!manifestResponse.ok) return;
        const manifest = (await manifestResponse.json()) as FileListResponse;
        const files = Array.isArray(manifest.files)
          ? manifest.files.filter((value): value is string => typeof value === "string")
          : [];
        if (!files.length || !active) return;
        setPictureFiles(files);
      } catch {
        // Keep fallback list when sources are unavailable.
      }
    };

    void loadPictureFiles();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    primeSpeechVoices();
  }, []);

  useEffect(() => {
    setStageIndex(0);
    setIsBlendComplete(false);
    setDemoPlayed(false);
    setDemoRunning(false);
    setActiveDemoBoard(null);
    completedStagesRef.current = {};
    announcedStageSpeechRef.current = null;
    attemptCountRef.current = 0;
    cloneCounterRef.current = 0;
    resetStageBoard();
  }, [activeBlend, pictureFiles, resetStageBoard]);

  useEffect(() => {
    resetStageBoard();
  }, [resetStageBoard, stageIndex]);

  useEffect(() => {
    trackLessonEvent({
      lesson: "language-arts:consonant-blends:double-alphabet-illustrated",
      activity: `blend-${activeBlend}`,
      event: "lesson_opened",
      details: {
        stageCount,
      },
    });
  }, [activeBlend, stageCount]);

  useEffect(() => {
    trackLessonEvent({
      lesson: "language-arts:consonant-blends:double-alphabet-illustrated",
      activity: `blend-${activeBlend}`,
      event: "stage_viewed",
      page: stageIndex + 1,
      totalPages: stageCount,
      details: {
        word: activeWord,
      },
    });
  }, [activeBlend, activeWord, stageCount, stageIndex]);

  useEffect(() => {
    if (!activeStage || !wordMatched) return;
    if (demoRunning || requiresDemo) return;

    const stageKey = `${activeBlend}-${stageIndex}`;
    if (completedStagesRef.current[stageKey]) return;

    completedStagesRef.current[stageKey] = true;
    setStatusMessage("Great work.");
    setShowSuccessFlash(true);
    if (successFlashTimeoutRef.current !== null) {
      window.clearTimeout(successFlashTimeoutRef.current);
    }
    successFlashTimeoutRef.current = window.setTimeout(() => {
      setShowSuccessFlash(false);
      successFlashTimeoutRef.current = null;
    }, 1400);

    handleSpeak(activeStage.word, false);

    trackLessonEvent({
      lesson: "language-arts:consonant-blends:double-alphabet-illustrated",
      activity: `blend-${activeBlend}`,
      event: "stage_completed",
      success: true,
      page: stageIndex + 1,
      totalPages: stageCount,
      value: activeStage.word,
    });

    if (stageIndex >= stageCount - 1) {
      setIsBlendComplete(true);
      setDemoRunning(false);
      setActiveDemoBoard(null);
      trackLessonEvent({
        lesson: "language-arts:consonant-blends:double-alphabet-illustrated",
        activity: `blend-${activeBlend}`,
        event: "lesson_completed",
        success: true,
        page: stageCount,
        totalPages: stageCount,
      });
      return;
    }

    if (advanceTimeoutRef.current !== null) return;
    advanceTimeoutRef.current = window.setTimeout(() => {
      advanceTimeoutRef.current = null;
      setStageIndex((previous) => Math.min(previous + 1, stageCount - 1));
      setDemoRunning(false);
      setActiveDemoBoard(null);
    }, 2300);
  }, [activeBlend, activeStage, demoRunning, handleSpeak, requiresDemo, stageCount, stageIndex, wordMatched]);

  useEffect(() => {
    if (!activeStage?.word) return;
    const speechKey = `${activeBlend}-${stageIndex}`;
    if (announcedStageSpeechRef.current === speechKey) {
      return;
    }
    if (requiresDemo) {
      announcedStageSpeechRef.current = speechKey;
      return;
    }
    announcedStageSpeechRef.current = speechKey;
    const speakTimer = window.setTimeout(() => {
      handleSpeak(activeStage.word);
    }, 260);
    return () => {
      window.clearTimeout(speakTimer);
    };
  }, [activeBlend, activeStage, handleSpeak, requiresDemo, stageIndex]);

  useEffect(() => {
    if (!dragging) return;

    const handleMove = (event: PointerEvent) => {
      event.preventDefault();
      const point = convertPointerToBoard(event);
      if (!point) return;
      setLetters((current) => {
        const next = current.map((letter) =>
          letter.id === dragging.id
            ? {
                ...letter,
                x: point.x - dragging.offsetX,
                y: point.y - dragging.offsetY,
              }
            : letter,
        );
        lettersRef.current = next;
        return next;
      });
    };

    const handleUp = (event: PointerEvent) => {
      event.preventDefault();
      const dragged = lettersRef.current.find((entry) => entry.id === dragging.id);
      if (!dragged) {
        setDragging(null);
        return;
      }

      removeAssignment(dragged.id);

      const zone = DROP_ZONES.map((target) => ({
        ...target,
        distance: Math.hypot(dragged.x - target.centerX, dragged.y - target.centerY),
      }))
        .filter((target) => target.distance <= DROP_THRESHOLD)
        .sort((a, b) => a.distance - b.distance)[0];

      const attempt = attemptCountRef.current + 1;
      attemptCountRef.current = attempt;

      if (!zone) {
        setStatusMessage("Drop the letter inside one of the five answer boxes.");
        trackLessonEvent({
          lesson: "language-arts:consonant-blends:double-alphabet-illustrated",
          activity: `blend-${activeBlend}`,
          event: "attempt_result",
          success: false,
          attempt,
          value: dragged.letter,
          page: stageIndex + 1,
          totalPages: stageCount,
          details: { reason: "outside-zones" },
        });
        const nextLetters = lettersRef.current.map((entry) =>
          entry.id === dragged.id ? { ...entry, x: entry.homeX, y: entry.homeY } : entry,
        );
        lettersRef.current = nextLetters;
        setLetters(nextLetters);
        setDragging(null);
        return;
      }

      if (zone.index >= activeWordLength) {
        setStatusMessage(`This word has ${activeWordLength} letters.`);
        trackLessonEvent({
          lesson: "language-arts:consonant-blends:double-alphabet-illustrated",
          activity: `blend-${activeBlend}`,
          event: "attempt_result",
          success: false,
          attempt,
          value: dragged.letter,
          page: stageIndex + 1,
          totalPages: stageCount,
          details: { reason: "beyond-word-length", zone: zone.id },
        });
        const nextLetters = lettersRef.current.map((entry) =>
          entry.id === dragged.id ? { ...entry, x: entry.homeX, y: entry.homeY } : entry,
        );
        lettersRef.current = nextLetters;
        setLetters(nextLetters);
        setDragging(null);
        return;
      }

      const occupiedBy = assignmentsRef.current[zone.id];
      if (occupiedBy && occupiedBy !== dragged.id) {
        setStatusMessage("That box already has a letter.");
        trackLessonEvent({
          lesson: "language-arts:consonant-blends:double-alphabet-illustrated",
          activity: `blend-${activeBlend}`,
          event: "attempt_result",
          success: false,
          attempt,
          value: dragged.letter,
          page: stageIndex + 1,
          totalPages: stageCount,
          details: { reason: "occupied-slot", zone: zone.id },
        });
        const nextLetters = lettersRef.current.map((entry) =>
          entry.id === dragged.id ? { ...entry, x: entry.homeX, y: entry.homeY } : entry,
        );
        lettersRef.current = nextLetters;
        setLetters(nextLetters);
        setDragging(null);
        return;
      }

      const expectedLetter = activeWord[zone.index];
      const expectedColor = expectedColorForIndex(zone.index);

      if (dragged.color !== expectedColor) {
        setStatusMessage(
          zone.index < 2 ? "Use red letters for the blend sounds." : "Use black letters after the blend.",
        );
        trackLessonEvent({
          lesson: "language-arts:consonant-blends:double-alphabet-illustrated",
          activity: `blend-${activeBlend}`,
          event: "attempt_result",
          success: false,
          attempt,
          value: dragged.letter,
          page: stageIndex + 1,
          totalPages: stageCount,
          details: { reason: "wrong-color", zone: zone.id },
        });
        const nextLetters = lettersRef.current.map((entry) =>
          entry.id === dragged.id ? { ...entry, x: entry.homeX, y: entry.homeY } : entry,
        );
        lettersRef.current = nextLetters;
        setLetters(nextLetters);
        setDragging(null);
        return;
      }

      if (dragged.letter !== expectedLetter) {
        setStatusMessage(`Try ${expectedLetter.toUpperCase()} in this box.`);
        trackLessonEvent({
          lesson: "language-arts:consonant-blends:double-alphabet-illustrated",
          activity: `blend-${activeBlend}`,
          event: "attempt_result",
          success: false,
          attempt,
          value: dragged.letter,
          page: stageIndex + 1,
          totalPages: stageCount,
          details: { reason: "wrong-letter", zone: zone.id, expected: expectedLetter },
        });
        const nextLetters = lettersRef.current.map((entry) =>
          entry.id === dragged.id ? { ...entry, x: entry.homeX, y: entry.homeY } : entry,
        );
        lettersRef.current = nextLetters;
        setLetters(nextLetters);
        setDragging(null);
        return;
      }

      setStatusMessage("");
      trackLessonEvent({
        lesson: "language-arts:consonant-blends:double-alphabet-illustrated",
        activity: `blend-${activeBlend}`,
        event: "attempt_result",
        success: true,
        attempt,
        value: dragged.letter,
        page: stageIndex + 1,
        totalPages: stageCount,
        details: { zone: zone.id },
      });

      placeLetterInZone(dragged, zone, true);
      setDragging(null);
    };

    window.addEventListener("pointermove", handleMove, { passive: false });
    window.addEventListener("pointerup", handleUp, { passive: false });
    window.addEventListener("pointercancel", handleUp, { passive: false });
    return () => {
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerup", handleUp);
      window.removeEventListener("pointercancel", handleUp);
    };
  }, [activeBlend, activeWord, activeWordLength, convertPointerToBoard, dragging, placeLetterInZone, removeAssignment, stageCount, stageIndex]);

  const handlePointerDown = (event: React.PointerEvent<HTMLButtonElement>, letter: LetterState) => {
    if (demoRunning || requiresDemo) {
      return;
    }
    event.preventDefault();
    const board = boardRef.current;
    if (board) {
      boardRectRef.current = board.getBoundingClientRect();
    }
    event.currentTarget.setPointerCapture?.(event.pointerId);
    const point = convertPointerToBoard(event.nativeEvent);
    if (!point) return;

    removeAssignment(letter.id);
    setStatusMessage("");
    setDragging({
      id: letter.id,
      offsetX: point.x - letter.x,
      offsetY: point.y - letter.y,
    });
  };

  const startDemo = useCallback(async () => {
    if (!activeStage || demoRunning || !requiresDemo) return;

    const wait = (duration: number) =>
      new Promise<void>((resolve) => {
        window.setTimeout(resolve, duration);
      });

    demoAbortRef.current = false;
    setDemoRunning(true);
    setStatusMessage("Watch the first word, then continue with the next cards.");
    handleSpeak(activeStage.word);
    await wait(900);
    if (demoAbortRef.current) {
      return;
    }

    trackLessonEvent({
      lesson: "language-arts:consonant-blends:double-alphabet-illustrated",
      activity: `blend-${activeBlend}`,
      event: "demo_started",
      page: 1,
      totalPages: stageCount,
      value: activeStage.word,
    });

    const targetWord = activeStage.word.slice(0, MAX_LETTERS);

    for (let index = 0; index < targetWord.length; index += 1) {
      if (demoAbortRef.current) {
        return;
      }

      const letterValue = targetWord[index];
      const expectedColor = expectedColorForIndex(index);
      const zone = DROP_ZONES[index];
      const takenLetters = new Set(Object.values(assignmentsRef.current));

      const sourceLetter =
        lettersRef.current.find(
          (entry) =>
            entry.letter === letterValue &&
            entry.color === expectedColor &&
            !takenLetters.has(entry.id) &&
            Math.abs(entry.x - entry.homeX) < 0.5 &&
            Math.abs(entry.y - entry.homeY) < 0.5,
        ) ??
        lettersRef.current.find(
          (entry) => entry.letter === letterValue && entry.color === expectedColor && !takenLetters.has(entry.id),
        ) ??
        lettersRef.current.find((entry) => entry.letter === letterValue && entry.color === expectedColor);

      if (!sourceLetter) continue;

      setActiveDemoBoard(expectedColor);
      await animateLetterTo(sourceLetter.id, zone.centerX, zone.centerY, 1200);

      if (demoAbortRef.current) {
        return;
      }

      const placed = placeLetterInZone(sourceLetter, zone, true);
      if (!placed) {
        continue;
      }
      await wait(500);
    }

    setActiveDemoBoard(null);
    handleSpeak(activeStage.word, false);
    await wait(2500);
    if (demoAbortRef.current) {
      return;
    }
    resetStageBoard();
    setDemoPlayed(true);
    setDemoRunning(false);
    setShowFirstSlotCue(true);
    if (firstSlotCueTimeoutRef.current !== null) {
      window.clearTimeout(firstSlotCueTimeoutRef.current);
    }
    firstSlotCueTimeoutRef.current = window.setTimeout(() => {
      setShowFirstSlotCue(false);
      firstSlotCueTimeoutRef.current = null;
    }, 1500);
    setStatusMessage(`Your turn: build ${activeStage.word}.`);

    trackLessonEvent({
      lesson: "language-arts:consonant-blends:double-alphabet-illustrated",
      activity: `blend-${activeBlend}`,
      event: "demo_finished",
      page: 1,
      totalPages: stageCount,
      value: activeStage.word,
      success: true,
    });
  }, [activeBlend, activeStage, animateLetterTo, demoRunning, handleSpeak, placeLetterInZone, requiresDemo, resetStageBoard, stageCount]);

  useEffect(() => {
    return () => {
      demoAbortRef.current = true;
      if (advanceTimeoutRef.current !== null) {
        window.clearTimeout(advanceTimeoutRef.current);
      }
      if (successFlashTimeoutRef.current !== null) {
        window.clearTimeout(successFlashTimeoutRef.current);
      }
      if (firstSlotCueTimeoutRef.current !== null) {
        window.clearTimeout(firstSlotCueTimeoutRef.current);
      }
      if (animationFrameRef.current !== null) {
        window.cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  const letterWidthPercentBase = 6.375;
  const letterHeightPercent = 20.0;

  if (!blendStages.length) {
    return (
      <div className="relative min-h-screen bg-[radial-gradient(circle_at_top,#eef6ff,#f9fcff_55%,#f3f8ff)]">
        <HomeLink />
        <main className="mx-auto flex min-h-screen w-full max-w-4xl flex-col items-center justify-center gap-4 px-6 py-10 text-center">
          <h1 className="font-display text-3xl font-semibold text-stone-900">No Cards Yet for {activeBlend.toUpperCase()}</h1>
          <p className="text-stone-600">
            Add image files into <code>/public/assets/language_arts/consonant_blend/consonant_blend_picture_cards_drawings</code>.
          </p>
          <Link
            href="/lessons/language-arts/consonant-blends/double-alphabet-illustrated"
            className="inline-flex items-center justify-center rounded-full border border-stone-300 px-5 py-2 text-xs uppercase tracking-[0.4em] text-stone-500"
          >
            Back to Blends
          </Link>
        </main>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-[radial-gradient(circle_at_top,#eef6ff,#f9fcff_55%,#f3f8ff)]">
      <HomeLink />
      <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-8 px-6 py-10">
        <header className="space-y-3 text-center">
          <p className="text-xs uppercase tracking-[0.35em] text-stone-400">
            Language Arts · Consonant Blends · Double Alphabet · {activeBlend.toUpperCase()}
          </p>
          <h1 className="font-display text-4xl font-semibold text-stone-900">Double Alphabet Board - {activeBlend.toUpperCase()}</h1>
          <p className="text-sm text-stone-600">
            Place red letters for the blend first, then black letters for the rest of the word.
          </p>
        </header>

        <div className="relative mx-auto w-full max-w-[1200px]">
          <div
            ref={boardRef}
            className="relative w-full overflow-visible rounded-3xl border border-stone-200 shadow-[0_25px_60px_-40px_rgba(15,23,42,0.8)]"
            style={{ paddingTop: `${(BOARD_HEIGHT / BOARD_WIDTH) * 100}%` }}
          >
            <img src={BOARD_IMAGE} alt="Double alphabet board" className="absolute inset-0 h-full w-full object-cover" />

            <div
              className="absolute"
              style={{
                left: `${(PICTURE_SLOT.x / BOARD_WIDTH) * 100}%`,
                top: `${(PICTURE_SLOT.y / BOARD_HEIGHT) * 100}%`,
                width: `${(PICTURE_SLOT.width / BOARD_WIDTH) * 100}%`,
                height: `${(PICTURE_SLOT.height / BOARD_HEIGHT) * 100}%`,
              }}
            >
              <img
                src={`${PICTURE_IMAGE_BASE}/${activeStage?.file ?? ""}`}
                alt={activeStage?.word ?? "Blend word"}
                className="h-full w-full object-cover"
              />
              <button
                type="button"
                onClick={() => activeStage && handleSpeak(activeStage.word)}
                aria-label={activeStage ? `Say ${activeStage.word}` : "Speak word"}
                className="absolute right-0 bottom-0 z-20 flex h-4 w-4 translate-x-1/2 translate-y-1/2 items-center justify-center rounded-full border border-stone-200 bg-white/95 text-[9px] leading-none text-stone-600 shadow shadow-stone-300 transition hover:bg-white"
              >
                🔊
              </button>
            </div>

            {DROP_ZONES.slice(0, activeWordLength).map((zone) => {
              const expectedLetter = activeWord[zone.index];
              const expectedColor = expectedColorForIndex(zone.index);
              const assignedId = assignments[zone.id];
              const assigned = assignedId ? lettersById.get(assignedId) : null;
              const isFilled = Boolean(assigned);
              const isCorrect = Boolean(
                assigned && expectedLetter && assigned.letter === expectedLetter && assigned.color === expectedColor,
              );

              return (
                <div
                  key={zone.id}
                  className={`pointer-events-none absolute rounded-md border-2 ${
                    isCorrect
                      ? "border-emerald-500/80 bg-emerald-300/25"
                      : isFilled
                          ? "border-amber-500/70 bg-amber-300/20"
                        : expectedColor === "red"
                          ? "border-rose-500/70 bg-rose-400/18"
                          : "border-slate-800/65 bg-slate-700/16"
                  }`}
                  style={{
                    left: `${(zone.x / BOARD_WIDTH) * 100}%`,
                    top: `${(zone.y / BOARD_HEIGHT) * 100}%`,
                    width: `${(zone.width / BOARD_WIDTH) * 100}%`,
                    height: `${(zone.height / BOARD_HEIGHT) * 100}%`,
                  }}
                />
              );
            })}

            {showFirstSlotCue && activeWord ? (
              <div
                className="pointer-events-none absolute z-20 -translate-x-1/2 -translate-y-1/2 rounded-md border-2 border-rose-600 bg-rose-500/25 animate-[pulse_0.45s_ease-in-out_infinite]"
                style={{
                  left: `${(((RED_DOUBLE_ALPHABET_POSITIONS.find((entry) => entry.letter === activeWord[0])?.x ?? 0) || 0) / BOARD_WIDTH) * 100}%`,
                  top: `${(((RED_DOUBLE_ALPHABET_POSITIONS.find((entry) => entry.letter === activeWord[0])?.y ?? 0) || 0) / BOARD_HEIGHT) * 100}%`,
                  width: `${(letterWidthPercentBase * ((LETTER_SCALE_OVERRIDES[activeWord[0]] ?? 1) + 0.12))}%`,
                  height: `${letterHeightPercent * 1.06}%`,
                }}
              />
            ) : null}

            {activeDemoBoard === "red" ? (
              <div
                className="pointer-events-none absolute rounded-xl border-4 border-rose-400 bg-rose-300/15"
                style={{
                  left: `${(RED_BOARD_BOUNDS.x / BOARD_WIDTH) * 100}%`,
                  top: `${(RED_BOARD_BOUNDS.y / BOARD_HEIGHT) * 100}%`,
                  width: `${(RED_BOARD_BOUNDS.width / BOARD_WIDTH) * 100}%`,
                  height: `${(RED_BOARD_BOUNDS.height / BOARD_HEIGHT) * 100}%`,
                }}
              />
            ) : null}

            {activeDemoBoard === "black" ? (
              <div
                className="pointer-events-none absolute rounded-xl border-4 border-sky-500 bg-sky-300/10"
                style={{
                  left: `${(BLACK_BOARD_BOUNDS.x / BOARD_WIDTH) * 100}%`,
                  top: `${(BLACK_BOARD_BOUNDS.y / BOARD_HEIGHT) * 100}%`,
                  width: `${(BLACK_BOARD_BOUNDS.width / BOARD_WIDTH) * 100}%`,
                  height: `${(BLACK_BOARD_BOUNDS.height / BOARD_HEIGHT) * 100}%`,
                }}
              />
            ) : null}

            {showSuccessFlash ? <div className="pointer-events-none absolute inset-0 bg-emerald-500/25" /> : null}

            {requiresDemo && !demoRunning ? (
              <div className="pointer-events-none absolute inset-0 z-40 flex items-end justify-center pb-[9%]">
                <div className="pointer-events-auto rounded-2xl border border-sky-300 bg-white/95 px-7 py-5 text-center shadow-[0_16px_48px_-16px_rgba(15,23,42,0.8)]">
                  <p className="text-xs font-semibold uppercase tracking-[0.25em] text-sky-700">First Word Demo</p>
                  <button
                    type="button"
                    onClick={() => {
                      void startDemo();
                    }}
                    className="mt-3 inline-flex items-center justify-center rounded-full bg-sky-600 px-10 py-4 text-sm font-semibold uppercase tracking-[0.28em] text-white shadow-lg"
                  >
                    Start
                  </button>
                </div>
              </div>
            ) : null}

            {letters.map((letter) => {
              const scale = LETTER_SCALE_OVERRIDES[letter.letter] ?? 1;
              return (
                <button
                  key={letter.id}
                  type="button"
                  onPointerDown={(event) => handlePointerDown(event, letter)}
                  className="absolute z-10 -translate-x-1/2 -translate-y-1/2 border-none bg-transparent p-0"
                  style={{
                    left: `${(letter.x / BOARD_WIDTH) * 100}%`,
                    top: `${(letter.y / BOARD_HEIGHT) * 100}%`,
                    width: `${letterWidthPercentBase * scale}%`,
                    height: `${letterHeightPercent}%`,
                    touchAction: "none",
                    cursor: demoRunning || requiresDemo ? "default" : "grab",
                    opacity: demoRunning || requiresDemo ? 0.92 : 1,
                  }}
                  aria-label={`${letter.color} letter ${letter.letter}`}
                  disabled={demoRunning || requiresDemo}
                >
                  <img
                    src={`${letter.color === "red" ? RED_LETTER_BASE : BLACK_LETTER_BASE}/${letter.letter}_moveable_alphabet_${letter.color}.png`}
                    alt={`${letter.color} ${letter.letter}`}
                    className="h-full w-full object-contain"
                    draggable={false}
                  />
                </button>
              );
            })}
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-rose-200 bg-rose-50/75 p-3">
              <p className="text-[10px] uppercase tracking-[0.28em] text-rose-700">Blend</p>
              <p className="mt-1 text-lg font-semibold uppercase text-rose-800">{activeWord.slice(0, 2)}</p>
              <p className="text-xs text-rose-700/80">Always red letters.</p>
            </div>
            <div className="rounded-2xl border border-stone-200 bg-white/80 p-3">
              <p className="text-[10px] uppercase tracking-[0.28em] text-stone-500">Word</p>
              <p className="mt-1 text-lg font-semibold text-stone-900">{activeWord}</p>
              <p className="text-xs text-stone-600">Build the full word from left to right.</p>
            </div>
            <div className="rounded-2xl border border-sky-200 bg-sky-50/75 p-3">
              <p className="text-[10px] uppercase tracking-[0.28em] text-sky-700">Ending</p>
              <p className="mt-1 text-lg font-semibold text-sky-800">{activeWord.slice(2)}</p>
              <p className="text-xs text-sky-700/80">Always black letters.</p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-stone-500">
              Card {Math.min(stageIndex + 1, Math.max(stageCount, 1))} of {Math.max(stageCount, 1)}
            </p>
            {statusMessage ? (
              <p className="mt-2 text-xs font-semibold uppercase tracking-[0.22em] text-stone-600">{statusMessage}</p>
            ) : null}
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={resetStageBoard}
              className="inline-flex items-center justify-center rounded-full border border-stone-300 px-5 py-2 text-xs uppercase tracking-[0.35em] text-stone-600"
            >
              Reset letters
            </button>
            <Link
              href="/lessons/language-arts/consonant-blends/double-alphabet-illustrated"
              className="inline-flex items-center justify-center rounded-full border border-stone-300 px-5 py-2 text-xs uppercase tracking-[0.35em] text-stone-600"
            >
              Back to Blends
            </Link>
          </div>
        </div>
      </main>

      <CompletionOverlay
        open={isBlendComplete}
        title="Blend Complete"
        message={`Great work on ${activeBlend.toUpperCase()}.`}
        primaryAction={{ href: "/lessons/language-arts/consonant-blends/double-alphabet-illustrated", label: "All Blends" }}
        secondaryAction={{ href: "/lessons/language-arts/consonant-blends", label: "Blue Series" }}
      />
    </div>
  );
}
