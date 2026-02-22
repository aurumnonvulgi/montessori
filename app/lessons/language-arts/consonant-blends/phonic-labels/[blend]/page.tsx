"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "next/navigation";
import HomeLink from "../../../../../components/HomeLink";
import CompletionOverlay from "../../../../../components/CompletionOverlay";
import { trackLessonEvent } from "../../../../../lib/lessonTelemetry";
import { primeSpeechVoices, speakWithPreferredVoice } from "../../../../../lib/speech";

const BOARD_IMAGE = "/assets/language_arts/moveable_alphabet/6pictures-6labels.svg";
const BOARD_WIDTH = 1366;
const BOARD_HEIGHT = 768;
const PICTURE_SIZE = 169.3;
const LABEL_HEIGHT = 87.07;
const DROP_THRESHOLD = 90;

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

const BLEND_WORDS: Record<(typeof BLEND_ORDER)[number], string[]> = {
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

const PICTURE_SLOTS = [
  { id: "line1-box1", x: 756.41, y: 61.55 },
  { id: "line1-box2", x: 943.47, y: 61.55 },
  { id: "line1-box3", x: 1130.53, y: 61.55 },
  { id: "line2-box1", x: 756.41, y: 351.79 },
  { id: "line2-box2", x: 943.47, y: 351.79 },
  { id: "line2-box3", x: 1130.53, y: 351.79 },
];

const ANSWER_SLOTS = [
  { id: "answer-label-1", x: 756.41, y: 236.83, height: 87.07 },
  { id: "answer-label-2", x: 943.47, y: 236.83, height: 87.07 },
  { id: "answer-label-3", x: 1130.53, y: 236.83, height: 87.07 },
  { id: "answer-label-4", x: 756.41, y: 526.39, height: 85.42 },
  { id: "answer-label-5", x: 943.47, y: 526.39, height: 85.42 },
  { id: "answer-label-6", x: 1130.53, y: 526.39, height: 85.42 },
];

const STACK_SLOTS = [
  { id: "stack-1", x: 73.49, y: 71.78, height: 85.86 },
  { id: "stack-2", x: 272.72, y: 71.78, height: 85.86 },
  { id: "stack-3", x: 73.49, y: 171.08, height: 86.31 },
  { id: "stack-4", x: 272.72, y: 171.08, height: 86.31 },
  { id: "stack-5", x: 73.49, y: 270.83, height: 87.07 },
  { id: "stack-6", x: 272.72, y: 270.83, height: 87.07 },
];

const STAGE_SIZE = 5;
type BlendKey = (typeof BLEND_ORDER)[number];

type LabelPair = {
  id: string;
  blend: BlendKey;
  word: string;
  labelFile: string;
  pictureFile: string;
};

type PictureFileItem = {
  blend: BlendKey;
  word: string;
  order: number;
  file: string;
};

type CardState = {
  id: string;
  pairId: string;
  x: number;
  y: number;
  homeX: number;
  homeY: number;
};

type FileListResponse = {
  files?: unknown;
};

const toLabelImage = (file: string) =>
  `/assets/language_arts/consonant_blend/consonant_blend_word_labels/${file}`;

const toPictureImage = (file: string) =>
  `/assets/language_arts/consonant_blend/consonant_blend_picture_cards/${file}`;

const parseLabelFile = (file: string) => {
  const match = file.match(/^([a-z]{2})-([a-z]+)_consonant_blend_word_labels\.png$/i);
  if (!match) return null;
  const blend = match[1].toLowerCase() as BlendKey;
  if (!BLEND_ORDER.includes(blend)) return null;
  return {
    blend,
    word: match[2].toLowerCase(),
    file,
  };
};

const parsePictureFile = (file: string): PictureFileItem | null => {
  const match = file.match(/^([a-z]{2})-([a-z]+)-(\d+)-([a-z]+)____consonant_blends\.png$/i);
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

const shuffleArray = <T,>(values: T[]) => {
  const next = [...values];
  for (let index = next.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [next[index], next[swapIndex]] = [next[swapIndex], next[index]];
  }
  return next;
};

export default function ConsonantBlendPhonicLabelsLesson() {
  const params = useParams<{ blend?: string }>();
  const rawBlend = typeof params?.blend === "string" ? params.blend.toLowerCase() : "bl";
  const activeBlend: BlendKey = BLEND_ORDER.includes(rawBlend as BlendKey) ? (rawBlend as BlendKey) : "bl";

  const activeBlendIndex = BLEND_ORDER.indexOf(activeBlend);
  const nextBlend = BLEND_ORDER[activeBlendIndex + 1];

  const boardRef = useRef<HTMLDivElement | null>(null);
  const [pairs, setPairs] = useState<LabelPair[]>([]);
  const [stageIndex, setStageIndex] = useState(0);
  const [stagePairs, setStagePairs] = useState<LabelPair[]>([]);
  const [cards, setCards] = useState<CardState[]>([]);
  const [assignments, setAssignments] = useState<Record<string, string>>({});
  const [dragging, setDragging] = useState<{ id: string; offsetX: number; offsetY: number } | null>(null);
  const [labelFiles, setLabelFiles] = useState<string[]>([]);
  const [pictureFiles, setPictureFiles] = useState<string[]>([]);
  const [isLoadingFiles, setIsLoadingFiles] = useState(true);
  const [pairsReady, setPairsReady] = useState(false);
  const [showCompletion, setShowCompletion] = useState(false);
  const attemptCountRef = useRef(0);
  const completedStagesRef = useRef<Record<string, true>>({});
  const completedLessonsRef = useRef<Record<string, true>>({});

  useEffect(() => {
    setShowCompletion(false);
  }, [activeBlend]);

  useEffect(() => {
    primeSpeechVoices();
  }, []);

  useEffect(() => {
    let active = true;
    const loadFiles = async () => {
      if (active) setIsLoadingFiles(true);
      try {
        const [labelsResponse, picturesResponse] = await Promise.all([
          fetch("/api/language-arts/consonant-blends/labels", { cache: "no-store" }),
          fetch("/api/language-arts/consonant-blends/cards", { cache: "no-store" }),
        ]);
        if (labelsResponse.ok) {
          const payload = (await labelsResponse.json()) as FileListResponse;
          const files = Array.isArray(payload.files)
            ? payload.files.filter((value): value is string => typeof value === "string")
            : [];
          if (active) {
            setLabelFiles(files);
          }
        }
        if (picturesResponse.ok) {
          const payload = (await picturesResponse.json()) as FileListResponse;
          const files = Array.isArray(payload.files)
            ? payload.files.filter((value): value is string => typeof value === "string")
            : [];
          if (active) {
            setPictureFiles(files);
          }
        }
      } catch {
        if (active) {
          setLabelFiles([]);
          setPictureFiles([]);
        }
      } finally {
        if (active) {
          setIsLoadingFiles(false);
        }
      }
    };
    void loadFiles();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    setPairsReady(false);
    if (!labelFiles.length || !pictureFiles.length) {
      setPairs([]);
      setPairsReady(true);
      return;
    }

    const labelByWord = new Map<string, string>();
    labelFiles.forEach((file) => {
      const parsed = parseLabelFile(file);
      if (!parsed || parsed.blend !== activeBlend) return;
      labelByWord.set(parsed.word, parsed.file);
    });

    const pictureByWord = new Map<string, string>();
    pictureFiles.forEach((file) => {
      const parsed = parsePictureFile(file);
      if (!parsed || parsed.blend !== activeBlend) return;
      const existing = pictureByWord.get(parsed.word);
      if (!existing) {
        pictureByWord.set(parsed.word, parsed.file);
        return;
      }
      const existingParsed = parsePictureFile(existing);
      if (!existingParsed || parsed.order < existingParsed.order) {
        pictureByWord.set(parsed.word, parsed.file);
      }
    });

    const nextPairs = BLEND_WORDS[activeBlend]
      .map((word) => {
        const labelFile = labelByWord.get(word);
        const pictureFile = pictureByWord.get(word);
        if (!labelFile || !pictureFile) return null;
        return {
          id: `${activeBlend}-${word}`,
          blend: activeBlend,
          word,
          labelFile,
          pictureFile,
        };
      })
      .filter(Boolean) as LabelPair[];

    setPairs(nextPairs);
    setStageIndex(0);
    setPairsReady(true);
  }, [activeBlend, labelFiles, pictureFiles]);

  const stageBasePairs = useMemo(() => {
    const start = stageIndex * STAGE_SIZE;
    return pairs.slice(start, start + STAGE_SIZE);
  }, [pairs, stageIndex]);

  const stageCount = Math.max(1, Math.ceil(pairs.length / STAGE_SIZE));

  useEffect(() => {
    setStagePairs(shuffleArray(stageBasePairs));
  }, [stageBasePairs]);

  useEffect(() => {
    trackLessonEvent({
      lesson: "language-arts:consonant-blends:phonic-labels",
      activity: `blend-${activeBlend}`,
      event: "lesson_opened",
      details: {
        stageCount,
      },
    });
  }, [activeBlend, stageCount]);

  useEffect(() => {
    const shuffled = shuffleArray(stagePairs);
    const nextCards = shuffled.map((pair, index) => {
      const slot = STACK_SLOTS[index] ?? STACK_SLOTS[STACK_SLOTS.length - 1];
      const slotHeight = slot.height ?? LABEL_HEIGHT;
      const x = slot.x + PICTURE_SIZE / 2;
      const y = slot.y + slotHeight / 2;
      return {
        id: `label-${stageIndex}-${pair.id}`,
        pairId: pair.id,
        x,
        y,
        homeX: x,
        homeY: y,
      };
    });
    setCards(nextCards);
    setAssignments({});
    setDragging(null);
  }, [stagePairs, stageIndex]);

  useEffect(() => {
    trackLessonEvent({
      lesson: "language-arts:consonant-blends:phonic-labels",
      activity: `blend-${activeBlend}`,
      event: "stage_viewed",
      page: stageIndex + 1,
      totalPages: stageCount,
    });
  }, [activeBlend, stageCount, stageIndex]);

  const boardRectRef = useRef<DOMRect | null>(null);
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

  const removeAssignment = useCallback((cardId: string) => {
    setAssignments((prev) => {
      const next = { ...prev };
      Object.keys(next).forEach((slotId) => {
        if (next[slotId] === cardId) {
          delete next[slotId];
        }
      });
      return next;
    });
  }, []);

  const handleSpeak = useCallback((word: string) => {
    speakWithPreferredVoice(word, { rate: 0.9, pitch: 0.95, volume: 0.9, lang: "en-US" });
  }, []);

  useEffect(() => {
    if (!dragging) return;
    const handleMove = (event: PointerEvent) => {
      event.preventDefault();
      if (!dragging) return;
      const point = convertPointerToBoard(event);
      if (!point) return;
      setCards((current) =>
        current.map((card) =>
          card.id === dragging.id ? { ...card, x: point.x - dragging.offsetX, y: point.y - dragging.offsetY } : card,
        ),
      );
    };

    const handleUp = (event: PointerEvent) => {
      event.preventDefault();
      if (!dragging) return;
      const card = cards.find((item) => item.id === dragging.id);
      const point = convertPointerToBoard(event);
      setDragging(null);
      if (!card || !point) return;

      const stageAnswerSlots = ANSWER_SLOTS.slice(0, stagePairs.length);
      const candidates = stageAnswerSlots
        .map((slot) => ({
          slot,
          centerX: slot.x + PICTURE_SIZE / 2,
          centerY: slot.y + (slot.height ?? LABEL_HEIGHT) / 2,
          dist: Math.hypot(point.x - (slot.x + PICTURE_SIZE / 2), point.y - (slot.y + (slot.height ?? LABEL_HEIGHT) / 2)),
        }))
        .filter(({ slot }) => !assignments[slot.id])
        .sort((a, b) => a.dist - b.dist);

      if (candidates.length && candidates[0].dist <= DROP_THRESHOLD) {
        const target = candidates[0].slot;
        const targetIndex = ANSWER_SLOTS.findIndex((slot) => slot.id === target.id);
        const expectedPair = targetIndex >= 0 ? stagePairs[targetIndex] : undefined;
        const attempt = attemptCountRef.current + 1;
        attemptCountRef.current = attempt;
        trackLessonEvent({
          lesson: "language-arts:consonant-blends:phonic-labels",
          activity: `blend-${activeBlend}`,
          event: "attempt_result",
          success: Boolean(expectedPair && expectedPair.id === card.pairId),
          attempt,
          value: expectedPair?.word ?? card.pairId,
          page: stageIndex + 1,
          totalPages: stageCount,
          details: {
            slot: target.id,
          },
        });
        const targetHeight = target.height ?? LABEL_HEIGHT;
        setCards((current) =>
          current.map((item) =>
            item.id === card.id
              ? { ...item, x: target.x + PICTURE_SIZE / 2, y: target.y + targetHeight / 2 }
              : item,
          ),
        );
        setAssignments((prev) => ({ ...prev, [target.id]: card.id }));
        return;
      }

      const attempt = attemptCountRef.current + 1;
      attemptCountRef.current = attempt;
      trackLessonEvent({
        lesson: "language-arts:consonant-blends:phonic-labels",
        activity: `blend-${activeBlend}`,
        event: "attempt_result",
        success: false,
        attempt,
        value: card.pairId,
        page: stageIndex + 1,
        totalPages: stageCount,
      });
      setCards((current) => current.map((item) => (item.id === card.id ? { ...item, x: item.homeX, y: item.homeY } : item)));
    };

    window.addEventListener("pointermove", handleMove, { passive: false });
    window.addEventListener("pointerup", handleUp, { passive: false });
    return () => {
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerup", handleUp);
    };
  }, [activeBlend, assignments, cards, convertPointerToBoard, dragging, stageCount, stageIndex, stagePairs]);

  const handlePointerDown = useCallback(
    (event: React.PointerEvent<HTMLDivElement>, card: CardState) => {
      event.preventDefault();
      event.stopPropagation();
      const board = boardRef.current;
      if (board) {
        boardRectRef.current = board.getBoundingClientRect();
      }
      event.currentTarget.setPointerCapture?.(event.pointerId);
      if (!board) return;
      const rect = board.getBoundingClientRect();
      const x = ((event.clientX - rect.left) / rect.width) * BOARD_WIDTH;
      const y = ((event.clientY - rect.top) / rect.height) * BOARD_HEIGHT;
      removeAssignment(card.id);
      setDragging({ id: card.id, offsetX: x - card.x, offsetY: y - card.y });
      setCards((current) => {
        const next = current.filter((item) => item.id !== card.id);
        return [...next, card];
      });
    },
    [removeAssignment],
  );

  const assignedMatches = useMemo(() => {
    const stageAnswerSlots = ANSWER_SLOTS.slice(0, stagePairs.length);
    return stageAnswerSlots.map((slot, index) => {
      const assignedCardId = assignments[slot.id];
      const pair = stagePairs[index];
      const card = cards.find((item) => item.id === assignedCardId);
      const matched = Boolean(pair && card && card.pairId === pair.id);
      return { slot, matched, pair };
    });
  }, [assignments, cards, stagePairs]);

  const allMatched = useMemo(
    () => assignedMatches.length > 0 && assignedMatches.every((item) => item.matched),
    [assignedMatches],
  );

  const spokenMatchesRef = useRef<Set<string>>(new Set());
  useEffect(() => {
    spokenMatchesRef.current = new Set();
  }, [activeBlend, stageIndex]);

  useEffect(() => {
    assignedMatches.forEach((item) => {
      if (!item.matched || !item.pair) return;
      const key = item.pair.id;
      if (spokenMatchesRef.current.has(key)) return;
      spokenMatchesRef.current.add(key);
      trackLessonEvent({
        lesson: "language-arts:consonant-blends:phonic-labels",
        activity: `blend-${activeBlend}`,
        event: "word_completed",
        success: true,
        value: item.pair.word,
        page: stageIndex + 1,
        totalPages: stageCount,
      });
      handleSpeak(item.pair.word);
    });
  }, [activeBlend, assignedMatches, handleSpeak, stageCount, stageIndex]);

  const advanceRef = useRef<number | null>(null);
  useEffect(() => {
    if (!allMatched) return;
    const stageKey = `${activeBlend}-${stageIndex}`;
    if (!completedStagesRef.current[stageKey]) {
      completedStagesRef.current[stageKey] = true;
      trackLessonEvent({
        lesson: "language-arts:consonant-blends:phonic-labels",
        activity: `blend-${activeBlend}`,
        event: "stage_completed",
        success: true,
        page: stageIndex + 1,
        totalPages: stageCount,
      });
    }

    if (stageIndex >= stageCount - 1) {
      const lessonKey = `blend-${activeBlend}`;
      if (!completedLessonsRef.current[lessonKey]) {
        completedLessonsRef.current[lessonKey] = true;
        trackLessonEvent({
          lesson: "language-arts:consonant-blends:phonic-labels",
          activity: lessonKey,
          event: "lesson_completed",
          success: true,
          page: stageCount,
          totalPages: stageCount,
        });
      }
      setShowCompletion(true);
      return;
    }

    if (advanceRef.current !== null) return;
    advanceRef.current = window.setTimeout(() => {
      advanceRef.current = null;
      setStageIndex((previous) => Math.min(previous + 1, stageCount - 1));
    }, 900);

    return () => {
      if (advanceRef.current !== null) {
        window.clearTimeout(advanceRef.current);
        advanceRef.current = null;
      }
    };
  }, [activeBlend, allMatched, stageCount, stageIndex]);

  if (isLoadingFiles || !pairsReady) {
    return (
      <div className="relative min-h-screen bg-[radial-gradient(circle_at_top,#eef6ff,#f9fcff_55%,#f3f8ff)]">
        <HomeLink />
        <main className="mx-auto flex min-h-screen w-full max-w-4xl flex-col items-center justify-center gap-6 px-6 py-10 text-center">
          <p className="text-xs uppercase tracking-[0.35em] text-stone-500">
            Language Arts · Consonant Blends · Label to Picture
          </p>
          <h1 className="font-display text-3xl font-semibold text-stone-900">
            Loading Blend {activeBlend.toUpperCase()}…
          </h1>
        </main>
      </div>
    );
  }

  if (!pairs.length) {
    return (
      <div className="relative min-h-screen bg-[radial-gradient(circle_at_top,#eef6ff,#f9fcff_55%,#f3f8ff)]">
        <HomeLink />
        <main className="mx-auto flex min-h-screen w-full max-w-4xl flex-col items-center justify-center gap-6 px-6 py-10 text-center">
          <p className="text-xs uppercase tracking-[0.35em] text-stone-500">
            Language Arts · Consonant Blends · Label to Picture
          </p>
          <h1 className="font-display text-3xl font-semibold text-stone-900">
            No Labels Ready for {activeBlend.toUpperCase()}
          </h1>
          <p className="max-w-2xl text-sm text-stone-600">
            Add matching images in
            {" "}
            <code>/public/assets/language_arts/consonant_blend/consonant_blend_word_labels</code>
            {" "}
            and
            {" "}
            <code>/public/assets/language_arts/consonant_blend/consonant_blend_picture_cards</code>.
          </p>
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
            Consonant Blend Labels · Blend {activeBlend.toUpperCase()}
          </p>
          <h1 className="font-display text-4xl font-semibold text-stone-900">Match Label to Picture</h1>
          <p className="text-sm text-stone-600">Drag the correct label under each picture.</p>
        </header>
        <div className="relative mx-auto w-full max-w-[1200px]">
          <div
            ref={boardRef}
            className="relative w-full overflow-visible rounded-3xl border border-stone-200 shadow-[0_25px_60px_-40px_rgba(15,23,42,0.8)]"
            style={{ paddingTop: `${(BOARD_HEIGHT / BOARD_WIDTH) * 100}%` }}
          >
            <img src={BOARD_IMAGE} alt="Consonant blend labels board" className="absolute inset-0 h-full w-full object-cover" />

            {stagePairs.map((pair, index) => {
              const slot = PICTURE_SLOTS[index];
              if (!slot) return null;
              return (
                <div
                  key={`${pair.id}-${slot.id}`}
                  className="absolute"
                  style={{
                    left: `${(slot.x / BOARD_WIDTH) * 100}%`,
                    top: `${(slot.y / BOARD_HEIGHT) * 100}%`,
                    width: `${(PICTURE_SIZE / BOARD_WIDTH) * 100}%`,
                    height: `${(PICTURE_SIZE / BOARD_HEIGHT) * 100}%`,
                  }}
                >
                  <img src={toPictureImage(pair.pictureFile)} alt={pair.word} className="h-full w-full object-contain" />
                  <button
                    type="button"
                    onPointerDown={(event) => {
                      event.stopPropagation();
                    }}
                    onClick={(event) => {
                      event.stopPropagation();
                      handleSpeak(pair.word);
                    }}
                    aria-label={`Say ${pair.word}`}
                    className="absolute right-1 bottom-1 flex h-5 w-5 items-center justify-center rounded-full bg-white/90 text-[10px] text-stone-600 shadow shadow-stone-400 transition hover:bg-white sm:right-1.5 sm:bottom-1.5 sm:h-6 sm:w-6 sm:text-xs"
                  >
                    🔊
                  </button>
                </div>
              );
            })}

            {ANSWER_SLOTS.slice(0, stagePairs.length).map((slot) => (
              <div
                key={slot.id}
                className="pointer-events-none absolute"
                style={{
                  left: `${(slot.x / BOARD_WIDTH) * 100}%`,
                  top: `${(slot.y / BOARD_HEIGHT) * 100}%`,
                  width: `${(PICTURE_SIZE / BOARD_WIDTH) * 100}%`,
                  height: `${((slot.height ?? LABEL_HEIGHT) / BOARD_HEIGHT) * 100}%`,
                }}
              />
            ))}

            {cards.map((card) => (
              <div
                key={card.id}
                onPointerDown={(event) => handlePointerDown(event, card)}
                className="pointer-events-auto absolute z-10 -translate-x-1/2 -translate-y-1/2 rounded-none border-none bg-transparent shadow-none"
                style={{
                  left: `${(card.x / BOARD_WIDTH) * 100}%`,
                  top: `${(card.y / BOARD_HEIGHT) * 100}%`,
                  width: `${(PICTURE_SIZE / BOARD_WIDTH) * 100}%`,
                  height: `${(LABEL_HEIGHT / BOARD_HEIGHT) * 100}%`,
                  touchAction: "none",
                }}
              >
                <div className="relative h-full w-full rounded-md bg-white/90 p-1 shadow-[0_8px_18px_-14px_rgba(0,0,0,0.8)] sm:p-1.5">
                  {(() => {
                    const pair = stagePairs.find((item) => item.id === card.pairId);
                    if (!pair) return null;
                    return (
                      <>
                        <img src={toLabelImage(pair.labelFile)} alt={`${pair.word} label`} className="h-full w-full object-contain" />
                        <button
                          type="button"
                          onPointerDown={(event) => {
                            event.stopPropagation();
                          }}
                          onClick={(event) => {
                            event.stopPropagation();
                            handleSpeak(pair.word);
                          }}
                          aria-label={`Say ${pair.word}`}
                          className="absolute right-1 bottom-1 flex h-5 w-5 items-center justify-center rounded-full bg-white/90 text-[10px] text-stone-600 shadow shadow-stone-400 transition hover:bg-white sm:right-1.5 sm:bottom-1.5 sm:h-6 sm:w-6 sm:text-xs"
                        >
                          🔊
                        </button>
                      </>
                    );
                  })()}
                </div>
              </div>
            ))}

            {assignedMatches.map((item, index) => {
              if (!item.matched) return null;
              const pictureSlot = PICTURE_SLOTS[index];
              const answerSlot = ANSWER_SLOTS[index];
              if (!pictureSlot || !answerSlot) return null;
              return (
                <div key={`match-${answerSlot.id}`}>
                  <div
                    className="pointer-events-none absolute z-20 bg-emerald-500/35"
                    style={{
                      left: `${(pictureSlot.x / BOARD_WIDTH) * 100}%`,
                      top: `${(pictureSlot.y / BOARD_HEIGHT) * 100}%`,
                      width: `${(PICTURE_SIZE / BOARD_WIDTH) * 100}%`,
                      height: `${(PICTURE_SIZE / BOARD_HEIGHT) * 100}%`,
                    }}
                  />
                  <div
                    className="pointer-events-none absolute z-20 bg-emerald-500/35"
                    style={{
                      left: `${(answerSlot.x / BOARD_WIDTH) * 100}%`,
                      top: `${(answerSlot.y / BOARD_HEIGHT) * 100}%`,
                      width: `${(PICTURE_SIZE / BOARD_WIDTH) * 100}%`,
                      height: `${((answerSlot.height ?? LABEL_HEIGHT) / BOARD_HEIGHT) * 100}%`,
                    }}
                  />
                </div>
              );
            })}
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="text-xs uppercase tracking-[0.35em] text-stone-400">
            Set {stageIndex + 1} of {stageCount}
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setStageIndex((prev) => Math.max(prev - 1, 0))}
              className="inline-flex items-center justify-center rounded-full border border-stone-300 px-5 py-2 text-xs uppercase tracking-[0.4em] text-stone-500 disabled:opacity-40"
              disabled={stageIndex === 0}
            >
              Previous
            </button>
            <button
              type="button"
              onClick={() => setStageIndex((prev) => Math.min(prev + 1, stageCount - 1))}
              className="inline-flex items-center justify-center rounded-full border border-stone-300 px-5 py-2 text-xs uppercase tracking-[0.4em] text-stone-500 disabled:opacity-40"
              disabled={stageIndex >= stageCount - 1}
            >
              Next
            </button>
          </div>
        </div>
      </main>
      <CompletionOverlay
        open={showCompletion}
        title={nextBlend ? "Blend Complete" : "Series Complete"}
        message={
          nextBlend
            ? `Great work on blend ${activeBlend.toUpperCase()}.`
            : "You completed all available blend label lessons."
        }
        primaryAction={
          nextBlend
            ? {
                href: `/lessons/language-arts/consonant-blends/phonic-labels/${nextBlend}`,
                label: `Next Blend: ${nextBlend.toUpperCase()}`,
              }
            : {
                href: "/lessons/language-arts/consonant-blends",
                label: "Back to Blue Series",
              }
        }
        secondaryAction={{ href: "/lessons/language-arts/consonant-blends/phonic-labels", label: "All Blends" }}
      />
    </div>
  );
}
