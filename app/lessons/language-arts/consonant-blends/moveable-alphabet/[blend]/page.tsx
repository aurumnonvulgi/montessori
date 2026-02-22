"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import HomeLink from "../../../../../components/HomeLink";
import { trackLessonEvent } from "../../../../../lib/lessonTelemetry";
import { primeSpeechVoices, speakWithPreferredVoice } from "../../../../../lib/speech";

const BOARD_IMAGE = "/assets/Boards/moveable_alphabet_board_5_letters_consonant_blend.svg";
const LETTER_IMAGE_BASE = "/assets/language_arts/moveable_alphabet/letters";
const PICTURE_IMAGE_BASE = "/assets/language_arts/consonant_blend/consonant_blend_picture_cards";
const BOARD_WIDTH = 1366;
const BOARD_HEIGHT = 768;
const DROP_THRESHOLD = 74;
const CELL_WIDTH = 68.9;
const CELL_HEIGHT = 122.3;
const MAX_LETTERS = 5;

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

const DROP_ZONE_DEFINITIONS = [
  { id: "pic1-answer-letter-1", x: 790, y: 108.4, width: 85.8, height: 128.4 },
  { id: "pic1-answer-letter-2", x: 899.3, y: 108.4, width: 85.8, height: 128.4 },
  { id: "pic1-answer-letter-3", x: 1008.7, y: 108.4, width: 85.8, height: 128.4 },
  { id: "pic1-answer-letter-4", x: 1118.1, y: 108.4, width: 85.8, height: 128.4 },
  { id: "pic1-answer-letter-5", x: 1227.4, y: 108.4, width: 86, height: 128 },
  { id: "pic2-answer-letter-1", x: 790, y: 300.7, width: 85.8, height: 128.4 },
  { id: "pic2-answer-letter-2", x: 899.3, y: 300.7, width: 85.8, height: 128.4 },
  { id: "pic2-answer-letter-3", x: 1008.7, y: 300.7, width: 85.8, height: 128.4 },
  { id: "pic2-answer-letter-4", x: 1118.1, y: 300.7, width: 85.8, height: 128.4 },
  { id: "pic2-answer-letter-5", x: 1227.4, y: 300.7, width: 86, height: 128 },
  { id: "pic3-answer-letter-1", x: 789.9, y: 489.3, width: 85.8, height: 128.4 },
  { id: "pic3-answer-letter-2", x: 899.3, y: 489.3, width: 85.8, height: 128.4 },
  { id: "pic3-answer-letter-3", x: 1008.7, y: 489.3, width: 85.8, height: 128.4 },
  { id: "pic3-answer-letter-4", x: 1118, y: 489.3, width: 85.8, height: 128.4 },
  { id: "pic3-answer-letter-5", x: 1227.3, y: 489.4, width: 86, height: 128 },
] as const;

const DROP_ZONES = DROP_ZONE_DEFINITIONS.map((zone) => ({
  ...zone,
  centerX: zone.x + zone.width / 2,
  centerY: zone.y + zone.height / 2,
}));

const PICTURE_LAYOUT = [
  { id: "pic1-holder", x: 621.9, y: 85, width: 155.2, height: 155.2, row: 1 },
  { id: "pic2-holder", x: 621.9, y: 275.2, width: 155.2, height: 155.2, row: 2 },
  { id: "pic3-holder", x: 621.9, y: 462.5, width: 155.2, height: 155.2, row: 3 },
] as const;

const LETTER_POSITIONS = [
  { letter: "a", x: 0.065, y: 0.2103 },
  { letter: "b", x: 0.1195, y: 0.2103 },
  { letter: "c", x: 0.174, y: 0.2103 },
  { letter: "d", x: 0.2286, y: 0.2103 },
  { letter: "e", x: 0.2831, y: 0.2103 },
  { letter: "f", x: 0.3377, y: 0.244 },
  { letter: "g", x: 0.3922, y: 0.2432 },
  { letter: "h", x: 0.065, y: 0.3747 },
  { letter: "i", x: 0.1193, y: 0.3747 },
  { letter: "j", x: 0.174, y: 0.3747 },
  { letter: "k", x: 0.2279, y: 0.3747 },
  { letter: "l", x: 0.2831, y: 0.3747 },
  { letter: "m", x: 0.3649, y: 0.408 },
  { letter: "n", x: 0.065, y: 0.539 },
  { letter: "o", x: 0.1193, y: 0.539 },
  { letter: "p", x: 0.1737, y: 0.539 },
  { letter: "q", x: 0.2279, y: 0.539 },
  { letter: "r", x: 0.2831, y: 0.539 },
  { letter: "s", x: 0.3359, y: 0.539 },
  { letter: "t", x: 0.3899, y: 0.539 },
  { letter: "u", x: 0.065, y: 0.7048 },
  { letter: "v", x: 0.1193, y: 0.7048 },
  { letter: "w", x: 0.2011, y: 0.7048 },
  { letter: "x", x: 0.2831, y: 0.7048 },
  { letter: "y", x: 0.3359, y: 0.7048 },
  { letter: "z", x: 0.3899, y: 0.7048 },
] as const;

const LETTER_SCALE_OVERRIDES: Record<string, number> = {
  r: 0.85,
  s: 0.9,
  c: 0.9,
  u: 0.9,
  n: 0.9,
  w: 1.56,
  m: 1.15,
};

const DESCENDER_OFFSET = 18;
const LETTER_Y_OFFSETS: Record<string, number> = {
  e: 8,
  g: DESCENDER_OFFSET,
  p: DESCENDER_OFFSET,
  q: DESCENDER_OFFSET,
  y: DESCENDER_OFFSET,
};

const buildFallbackFiles = () =>
  BLEND_ORDER.flatMap((blend) =>
    BLEND_WORDS[blend].map(
      (word, index) => `${blend}-${word}-${index + 1}-${word}____consonant_blends.png`,
    ),
  );

type PictureItem = {
  blend: string;
  word: string;
  order: number;
  file: string;
};

type FileListResponse = {
  files?: unknown;
};

type PictureStage = {
  blend: string;
  items: PictureItem[];
};

type PictureSlot = (typeof PICTURE_LAYOUT)[number] & PictureItem;

type LetterState = {
  id: string;
  letter: string;
  x: number;
  y: number;
  homeX: number;
  homeY: number;
};

type RowStatus = {
  row: number;
  word: string;
  letters: string[];
  matched: boolean;
};

const parsePictureFile = (file: string): PictureItem | null => {
  const match = file.match(/^([a-z]{2})-([a-z]+)-(\d+)-([a-z]+)____consonant_blends\.png$/i);
  if (!match) return null;
  return {
    blend: match[1].toLowerCase(),
    word: match[2].toLowerCase(),
    order: Number(match[3]),
    file,
  };
};

const buildStagesForBlend = (items: PictureItem[], blend: string): PictureStage[] => {
  const filtered = items
    .filter((item) => item.blend === blend)
    .sort((a, b) => (a.order === b.order ? a.file.localeCompare(b.file) : a.order - b.order));
  const stages: PictureStage[] = [];
  for (let index = 0; index < filtered.length; index += 3) {
    stages.push({ blend, items: filtered.slice(index, index + 3) });
  }
  return stages;
};

const parseZoneId = (id: string) => {
  const match = id.match(/^pic(\d)-answer-letter-(\d)$/);
  if (!match) return null;
  return { row: Number(match[1]), index: Number(match[2]) - 1 };
};

const doesWordMatch = (letters: string[], word: string) => {
  for (let index = 0; index < MAX_LETTERS; index += 1) {
    const expected = word[index] ?? "";
    if (letters[index] !== expected) {
      return false;
    }
  }
  return true;
};

const buildInitialLetters = (): LetterState[] =>
  LETTER_POSITIONS.map((entry) => {
    const x = entry.x * BOARD_WIDTH;
    const y = entry.y * BOARD_HEIGHT + (LETTER_Y_OFFSETS[entry.letter] ?? 0);
    return {
      id: `letter-${entry.letter}`,
      letter: entry.letter,
      x,
      y,
      homeX: x,
      homeY: y,
    };
  });

export default function ConsonantBlendMoveableAlphabetLesson() {
  const params = useParams<{ blend?: string }>();
  const rawBlend = typeof params?.blend === "string" ? params.blend.toLowerCase() : "bl";
  const activeBlend = BLEND_ORDER.includes(rawBlend as (typeof BLEND_ORDER)[number]) ? rawBlend : "bl";

  const boardRef = useRef<HTMLDivElement | null>(null);
  const boardRectRef = useRef<DOMRect | null>(null);

  const [letters, setLetters] = useState<LetterState[]>(() => buildInitialLetters());
  const [assignments, setAssignments] = useState<Record<string, string>>({});
  const [pictureFiles, setPictureFiles] = useState<string[]>(() => buildFallbackFiles());
  const [stageIndex, setStageIndex] = useState(0);
  const [statusMessage, setStatusMessage] = useState("");
  const [dragging, setDragging] = useState<{ id: string; offsetX: number; offsetY: number } | null>(null);
  const [isBlendComplete, setIsBlendComplete] = useState(false);

  const matchedRowsRef = useRef<Record<number, string>>({});
  const completedStagesRef = useRef<Record<string, true>>({});
  const attemptCountRef = useRef(0);
  const advanceTimeoutRef = useRef<number | null>(null);

  const pictureItems = useMemo(
    () => pictureFiles.map(parsePictureFile).filter((item): item is PictureItem => Boolean(item)),
    [pictureFiles],
  );
  const blendStages = useMemo(() => buildStagesForBlend(pictureItems, activeBlend), [activeBlend, pictureItems]);
  const stageCount = blendStages.length;

  const pictureSlots = useMemo<PictureSlot[]>(() => {
    const stage = blendStages[stageIndex] ?? blendStages[0];
    if (!stage?.items.length) return [];
    return PICTURE_LAYOUT.map((layout, index) => {
      const item = stage.items[index];
      if (!item) return null;
      return { ...layout, ...item };
    }).filter((slot): slot is PictureSlot => Boolean(slot));
  }, [blendStages, stageIndex]);

  const rowStatuses = useMemo<RowStatus[]>(() => {
    const statusByRow: Record<number, RowStatus> = {};
    pictureSlots.forEach((slot) => {
      statusByRow[slot.row] = {
        row: slot.row,
        word: slot.word,
        letters: Array.from({ length: MAX_LETTERS }, () => ""),
        matched: false,
      };
    });

    Object.entries(assignments).forEach(([zoneId, letterId]) => {
      const parsed = parseZoneId(zoneId);
      if (!parsed) return;
      const status = statusByRow[parsed.row];
      if (!status) return;
      const letter = letters.find((entry) => entry.id === letterId);
      if (!letter) return;
      status.letters[parsed.index] = letter.letter;
    });

    Object.values(statusByRow).forEach((status) => {
      status.matched = doesWordMatch(status.letters, status.word);
    });

    return PICTURE_LAYOUT.map((slot) => statusByRow[slot.row]).filter((status): status is RowStatus => Boolean(status));
  }, [assignments, letters, pictureSlots]);

  const handleSpeak = useCallback((text: string, interrupt = true) => {
    speakWithPreferredVoice(text, {
      lang: "en-US",
      rate: 0.9,
      pitch: 0.95,
      volume: 0.9,
      interrupt,
    });
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
    setAssignments((previous) => {
      const updated = { ...previous };
      Object.keys(updated).forEach((zoneId) => {
        if (updated[zoneId] === letterId) {
          delete updated[zoneId];
        }
      });
      return updated;
    });
  }, []);

  const getRowOverlayMetrics = useCallback((row: number, wordLength: number) => {
    const slot = pictureSlots.find((entry) => entry.row === row);
    const cappedLength = Math.min(MAX_LETTERS, Math.max(1, wordLength));
    const lastZone = DROP_ZONE_DEFINITIONS.find((zone) => zone.id === `pic${row}-answer-letter-${cappedLength}`);
    if (!slot || !lastZone) return null;
    const leftPercent = (slot.x / BOARD_WIDTH) * 100;
    const topPercent = (slot.y / BOARD_HEIGHT) * 100;
    const heightPercent = (slot.height / BOARD_HEIGHT) * 100;
    const endX = lastZone.x + lastZone.width;
    const widthPercent = ((endX - slot.x) / BOARD_WIDTH) * 100;
    return { leftPercent, topPercent, widthPercent, heightPercent };
  }, [pictureSlots]);

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
        const response = await fetch("/api/language-arts/consonant-blends/cards", { cache: "no-store" });
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
          "/assets/language_arts/consonant_blend/consonant_blend_picture_cards/manifest.json",
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
    loadPictureFiles();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    primeSpeechVoices();
  }, []);

  useEffect(() => {
    setStageIndex(0);
    setAssignments({});
    setLetters(buildInitialLetters());
    setStatusMessage("");
    setDragging(null);
    setIsBlendComplete(false);
  }, [activeBlend, pictureFiles]);

  useEffect(() => {
    trackLessonEvent({
      lesson: "language-arts:consonant-blends:moveable-alphabet",
      activity: `blend-${activeBlend}`,
      event: "lesson_opened",
      details: {
        stageCount,
      },
    });
  }, [activeBlend, stageCount]);

  useEffect(() => {
    trackLessonEvent({
      lesson: "language-arts:consonant-blends:moveable-alphabet",
      activity: `blend-${activeBlend}`,
      event: "stage_viewed",
      page: stageIndex + 1,
      totalPages: stageCount,
    });
  }, [activeBlend, stageCount, stageIndex]);

  useEffect(() => {
    const currentMatched: Record<number, string> = {};
    rowStatuses.forEach((status) => {
      if (!status.matched) return;
      currentMatched[status.row] = status.word;
      const previousWord = matchedRowsRef.current[status.row];
      if (previousWord !== status.word) {
        trackLessonEvent({
          lesson: "language-arts:consonant-blends:moveable-alphabet",
          activity: `blend-${activeBlend}`,
          event: "word_completed",
          success: true,
          value: status.word,
          page: stageIndex + 1,
          totalPages: stageCount,
          details: { row: status.row },
        });
        handleSpeak(status.word, false);
      }
    });
    matchedRowsRef.current = currentMatched;
  }, [activeBlend, handleSpeak, rowStatuses, stageCount, stageIndex]);

  useEffect(() => {
    if (!rowStatuses.length) return;
    const allMatched = rowStatuses.every((status) => status.matched);
    if (!allMatched) return;

    const stageKey = `${activeBlend}-${stageIndex}`;
    if (!completedStagesRef.current[stageKey]) {
      completedStagesRef.current[stageKey] = true;
      trackLessonEvent({
        lesson: "language-arts:consonant-blends:moveable-alphabet",
        activity: `blend-${activeBlend}`,
        event: "stage_completed",
        success: true,
        page: stageIndex + 1,
        totalPages: stageCount,
      });
    }

    if (stageIndex >= stageCount - 1) {
      setIsBlendComplete(true);
      trackLessonEvent({
        lesson: "language-arts:consonant-blends:moveable-alphabet",
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
    }, 900);

    return () => {
      if (advanceTimeoutRef.current !== null) {
        window.clearTimeout(advanceTimeoutRef.current);
        advanceTimeoutRef.current = null;
      }
    };
  }, [activeBlend, rowStatuses, stageCount, stageIndex]);

  useEffect(() => {
    if (!dragging) return;
    const handleMove = (event: PointerEvent) => {
      event.preventDefault();
      if (!dragging) return;
      const point = convertPointerToBoard(event);
      if (!point) return;
      setLetters((current) =>
        current.map((letter) =>
          letter.id === dragging.id
            ? {
                ...letter,
                x: point.x - dragging.offsetX,
                y: point.y - dragging.offsetY,
              }
            : letter,
        ),
      );
    };

    const handleUp = (event: PointerEvent) => {
      event.preventDefault();
      if (!dragging) return;
      const letter = letters.find((entry) => entry.id === dragging.id);
      if (!letter) {
        setDragging(null);
        return;
      }

      removeAssignment(letter.id);
      const zone = DROP_ZONES.map((target) => ({
        ...target,
        distance: Math.hypot(letter.x - target.centerX, letter.y - target.centerY),
      }))
        .filter((target) => target.distance <= DROP_THRESHOLD)
        .sort((a, b) => a.distance - b.distance)[0];

      const attempt = attemptCountRef.current + 1;
      attemptCountRef.current = attempt;

      if (zone) {
        const occupiedBy = assignments[zone.id];
        if (occupiedBy && occupiedBy !== letter.id) {
          trackLessonEvent({
            lesson: "language-arts:consonant-blends:moveable-alphabet",
            activity: `blend-${activeBlend}`,
            event: "attempt_result",
            success: false,
            attempt,
            value: letter.letter,
            page: stageIndex + 1,
            totalPages: stageCount,
            details: {
              zone: zone.id,
              reason: "occupied-slot",
            },
          });
          setStatusMessage("That box already has a letter.");
          setLetters((current) =>
            current.map((entry) =>
              entry.id === letter.id
                ? {
                    ...entry,
                    x: entry.homeX,
                    y: entry.homeY,
                  }
                : entry,
            ),
          );
          setDragging(null);
          return;
        }

        trackLessonEvent({
          lesson: "language-arts:consonant-blends:moveable-alphabet",
          activity: `blend-${activeBlend}`,
          event: "attempt_result",
          success: true,
          attempt,
          value: letter.letter,
          page: stageIndex + 1,
          totalPages: stageCount,
          details: {
            zone: zone.id,
          },
        });
        const yOffset = LETTER_Y_OFFSETS[letter.letter] ?? 0;
        setStatusMessage("");
        setAssignments((previous) => {
          const updated = { ...previous };
          updated[zone.id] = letter.id;
          return updated;
        });
        setLetters((current) => {
          const updated = current.map((entry) =>
            entry.id === letter.id
              ? {
                  ...entry,
                  x: zone.centerX,
                  y: zone.centerY + yOffset,
                }
              : entry,
          );
          const cloneId = `${letter.id}-clone-${Date.now()}`;
          return [
            ...updated,
            {
              id: cloneId,
              letter: letter.letter,
              x: letter.homeX,
              y: letter.homeY,
              homeX: letter.homeX,
              homeY: letter.homeY,
            },
          ];
        });
      } else {
        trackLessonEvent({
          lesson: "language-arts:consonant-blends:moveable-alphabet",
          activity: `blend-${activeBlend}`,
          event: "attempt_result",
          success: false,
          attempt,
          value: letter.letter,
          page: stageIndex + 1,
          totalPages: stageCount,
          details: {
            zone: "",
          },
        });
        setStatusMessage("Drop the letter into one of the answer boxes.");
        setLetters((current) =>
          current.map((entry) =>
            entry.id === letter.id
              ? {
                  ...entry,
                  x: entry.homeX,
                  y: entry.homeY,
                }
              : entry,
          ),
        );
      }

      setDragging(null);
    };

    window.addEventListener("pointermove", handleMove);
    window.addEventListener("pointerup", handleUp);
    window.addEventListener("pointercancel", handleUp);
    return () => {
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerup", handleUp);
      window.removeEventListener("pointercancel", handleUp);
    };
  }, [activeBlend, assignments, convertPointerToBoard, dragging, letters, removeAssignment, stageCount, stageIndex]);

  const handlePointerDown = (event: React.PointerEvent<HTMLButtonElement>, letter: LetterState) => {
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
      offsetX: point.x - letter.homeX,
      offsetY: point.y - letter.homeY,
    });
    setLetters((current) =>
      current.map((entry) =>
        entry.id === letter.id
          ? {
              ...entry,
              x: entry.homeX,
              y: entry.homeY,
            }
          : entry,
      ),
    );
  };

  const letterScale = 0.82;
  const letterWidthPercentBase = ((CELL_WIDTH * 1.25) / BOARD_WIDTH) * 100 * letterScale;
  const letterHeightPercentBase = ((CELL_HEIGHT * 1.12) / BOARD_HEIGHT) * 100 * letterScale;

  if (!blendStages.length) {
    return (
      <div className="relative min-h-screen bg-[radial-gradient(circle_at_top,#eef6ff,#f9fcff_55%,#f3f8ff)]">
        <HomeLink />
        <main className="mx-auto flex min-h-screen w-full max-w-4xl flex-col items-center justify-center gap-4 px-6 py-10 text-center">
          <h1 className="font-display text-3xl font-semibold text-stone-900">No Cards Yet for {activeBlend.toUpperCase()}</h1>
          <p className="text-stone-600">
            Add image files into <code>/public/assets/language_arts/consonant_blend/consonant_blend_picture_cards</code>.
          </p>
          <Link
            href="/lessons/language-arts/consonant-blends/moveable-alphabet"
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
            Language Arts · Consonant Blends · Blend {activeBlend.toUpperCase()}
          </p>
          <h1 className="font-display text-4xl font-semibold text-stone-900">
            Moveable Alphabet Board - {activeBlend.toUpperCase()}
          </h1>
          <p className="text-sm text-stone-600">Drag letters onto the five slots to build each blend word.</p>
        </header>

        <div className="relative mx-auto w-full max-w-[1200px]">
          <div
            ref={boardRef}
            className="relative w-full overflow-visible rounded-3xl border border-stone-200 shadow-[0_25px_60px_-40px_rgba(15,23,42,0.8)]"
            style={{ paddingTop: `${(BOARD_HEIGHT / BOARD_WIDTH) * 100}%` }}
          >
            <img src={BOARD_IMAGE} alt="Consonant blend moveable alphabet board" className="absolute inset-0 h-full w-full object-cover" />

            {pictureSlots.map((slot) => {
              const left = (slot.x / BOARD_WIDTH) * 100;
              const top = (slot.y / BOARD_HEIGHT) * 100;
              const widthPercent = (slot.width / BOARD_WIDTH) * 100;
              const heightPercent = (slot.height / BOARD_HEIGHT) * 100;
              return (
                <div
                  key={slot.id}
                  className="absolute"
                  style={{
                    left: `${left}%`,
                    top: `${top}%`,
                    width: `${widthPercent}%`,
                    height: `${heightPercent}%`,
                  }}
                >
                  <img
                    src={`${PICTURE_IMAGE_BASE}/${slot.file}`}
                    alt={slot.word}
                    className="h-full w-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => handleSpeak(slot.word)}
                    aria-label={`Say ${slot.word}`}
                    className="absolute right-1.5 bottom-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-white/80 text-xs text-stone-600 shadow shadow-stone-400 transition hover:bg-white sm:right-2 sm:bottom-2 sm:h-8 sm:w-8 sm:text-base"
                  >
                    🔊
                  </button>
                </div>
              );
            })}

            {rowStatuses
              .filter((status) => status.matched)
              .map((status) => {
                const metrics = getRowOverlayMetrics(status.row, status.word.length);
                if (!metrics) return null;
                return (
                  <div
                    key={`overlay-${status.row}`}
                    className="pointer-events-none absolute bg-emerald-500/35"
                    style={{
                      left: `${metrics.leftPercent}%`,
                      top: `${metrics.topPercent}%`,
                      width: `${metrics.widthPercent}%`,
                      height: `${metrics.heightPercent}%`,
                    }}
                  />
                );
              })}

            {letters.map((letter) => {
              const scaleModifier = LETTER_SCALE_OVERRIDES[letter.letter] ?? 1;
              const widthPercent = letterWidthPercentBase * scaleModifier;
              const heightPercent = letterHeightPercentBase * scaleModifier;
              return (
                <button
                  key={letter.id}
                  onPointerDown={(event) => handlePointerDown(event, letter)}
                  className="pointer-events-auto absolute -translate-x-1/2 -translate-y-1/2 rounded-none border-none bg-transparent shadow-none"
                  style={{
                    left: `${(letter.x / BOARD_WIDTH) * 100}%`,
                    top: `${(letter.y / BOARD_HEIGHT) * 100}%`,
                    width: `${widthPercent}%`,
                    height: `${heightPercent}%`,
                    touchAction: "none",
                  }}
                >
                  <img
                    src={`${LETTER_IMAGE_BASE}/${letter.letter}.png`}
                    alt={`Letter ${letter.letter}`}
                    className="h-full w-full object-contain"
                    style={{ imageRendering: "pixelated" }}
                  />
                </button>
              );
            })}
          </div>

          {statusMessage ? (
            <p className="mt-4 text-center text-sm font-semibold uppercase tracking-[0.35em] text-stone-500">
              {statusMessage}
            </p>
          ) : null}

          {isBlendComplete ? (
            <p className="mt-4 text-center text-sm font-semibold uppercase tracking-[0.35em] text-emerald-700">
              Blend {activeBlend.toUpperCase()} complete
            </p>
          ) : null}

          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            {rowStatuses.map((status) => (
              <div
                key={status.row}
                className="rounded-2xl border border-stone-200 bg-white/75 p-3 text-center shadow-[0_10px_30px_-25px_rgba(15,23,42,0.8)]"
              >
                <p className="text-[10px] uppercase tracking-[0.35em] text-stone-400">Picture {status.row}</p>
                <p className="text-lg font-semibold text-stone-900">{status.word.toUpperCase()}</p>
                <p className="text-xs text-stone-500">{status.letters.map((letter) => (letter ? letter.toUpperCase() : "•")).join(" ")}</p>
                <p
                  className={`mt-2 text-xs font-semibold uppercase tracking-[0.35em] ${
                    status.matched ? "text-emerald-600" : "text-stone-500"
                  }`}
                >
                  {status.matched ? "Correct" : "Complete the word"}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs uppercase tracking-[0.35em] text-stone-500">
            Stage {Math.min(stageIndex + 1, Math.max(stageCount, 1))} of {Math.max(stageCount, 1)}
          </p>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => {
                setAssignments({});
                setLetters(buildInitialLetters());
                setStatusMessage("");
              }}
              className="inline-flex items-center justify-center rounded-full border border-stone-300 px-5 py-2 text-xs uppercase tracking-[0.35em] text-stone-600"
            >
              Reset letters
            </button>
            <Link
              href="/lessons/language-arts/consonant-blends/moveable-alphabet"
              className="inline-flex items-center justify-center rounded-full border border-stone-300 px-5 py-2 text-xs uppercase tracking-[0.35em] text-stone-600"
            >
              Back to Blends
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
