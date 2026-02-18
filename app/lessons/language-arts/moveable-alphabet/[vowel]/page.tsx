"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "next/navigation";
import HomeLink from "../../../../components/HomeLink";
import CompletionOverlay from "../../../../components/CompletionOverlay";
import Link from "next/link";
import { getPhonicsCompletionSteps } from "../../../../lib/phonicsProgression";
import { trackLessonEvent } from "../../../../lib/lessonTelemetry";
import { primeSpeechVoices, speakWithPreferredVoice } from "../../../../lib/speech";

const BOARD_IMAGE = "/assets/language_arts/moveable_alphabet/moveable_alphabet_board.svg";
const BOARD_WIDTH = 1366;
const BOARD_HEIGHT = 768;
const DROP_THRESHOLD = 70;
const CELL_WIDTH = 75.16;
const CELL_HEIGHT = 133.4;
const VOWELS = new Set(["a", "e", "i", "o", "u"]);

const LETTER_POSITIONS = [
  { letter: "a", x: 0.0737, y: 0.2295 },
  { letter: "b", x: 0.1303 + 5 / 1366, y: 0.2045 },
  { letter: "c", x: 0.1923, y: 0.2175 },
  { letter: "d", x: 0.252 + 5 / 1366, y: 0.2059 },
  { letter: "e", x: 0.31 + 5 / 1366, y: 0.223 },
  { letter: "f", x: 0.3728, y: 0.2436 },
  { letter: "g", x: 0.4319, y: 0.2507 },
  { letter: "h", x: 0.0753, y: 0.3782 },
  { letter: "i", x: 0.1303, y: 0.3782 },
  { letter: "j", x: 0.1853 + 5 / 1366, y: 0.3782 },
  { letter: "k", x: 0.2504, y: 0.3782 },
  { letter: "l", x: 0.3052, y: 0.3793 },
  { letter: "m", x: 0.3948, y: 0.4196 },
  { letter: "n", x: 0.0739, y: 0.5609 },
  { letter: "o", x: 0.1346, y: 0.5649 },
  { letter: "p", x: 0.1928, y: 0.5689 - 20 / 768 },
  { letter: "q", x: 0.2503, y: 0.5647 - 20 / 768 },
  { letter: "r", x: 0.3153, y: 0.5686 },
  { letter: "s", x: 0.3682 + 5 / 1366, y: 0.5666 },
  { letter: "t", x: 0.4257, y: 0.5631 },
  { letter: "u", x: 0.075, y: 0.7383 },
  { letter: "v", x: 0.1355, y: 0.7485 },
  { letter: "w", x: 0.2182, y: 0.7459 },
  { letter: "x", x: 0.3069, y: 0.7399 },
  { letter: "y", x: 0.3705, y: 0.7404 },
  { letter: "z", x: 0.4229 + 5 / 1366, y: 0.7426 },
];

type DropZoneType = "vowel" | "consonant";
type DropZoneDefinition = {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
};

type DropZone = DropZoneDefinition & {
  centerX: number;
  centerY: number;
  type: DropZoneType;
  label: string;
};

type PictureLayout = {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  row: number;
};

type PictureItem = {
  letter: string;
  word: string;
  file: string;
};

type PictureSlot = PictureLayout & PictureItem;

type PictureStage = {
  letter: string;
  items: PictureItem[];
};

type RowStatus = {
  row: number;
  word: string;
  letters: string[];
  matched: boolean;
};

const DROP_ZONE_DEFINITIONS: DropZoneDefinition[] = [
  { id: "line-1-letter1", x: 892.99, y: 71.96, width: 109.68, height: 163.8 },
  { id: "line-1-letter2", x: 1034.99, y: 71.96, width: 109.68, height: 163.8 },
  { id: "line-1-letter3", x: 1178, y: 71.96, width: 109.68, height: 163.8 },
  { id: "line-2-letter1", x: 892.99, y: 277.57, width: 109.68, height: 163.8 },
  { id: "line-2-letter2", x: 1034.99, y: 277.57, width: 109.68, height: 163.8 },
  { id: "line-2-letter3", x: 1178, y: 277.57, width: 109.68, height: 163.8 },
  { id: "line-3-letter1", x: 892.99, y: 483.31, width: 109.68, height: 163.8 },
  { id: "line-3-letter2", x: 1034.99, y: 483.31, width: 109.68, height: 163.8 },
  { id: "line-3-letter3", x: 1178, y: 483.31, width: 109.68, height: 163.8 },
];

const DROP_ZONES: DropZone[] = DROP_ZONE_DEFINITIONS.map((def) => ({
  ...def,
  centerX: def.x + def.width / 2,
  centerY: def.y + def.height / 2,
  type: def.id.includes("letter2") ? "vowel" : "consonant",
  label: def.id.replace(/-/g, " "),
}));

const PICTURE_LAYOUT: PictureLayout[] = [
  { id: "pic1-holder", x: 704.62, y: 71.96, width: 169.3, height: 169.3, row: 1 },
  { id: "pic2-holder", x: 704.62, y: 276.79, width: 169.3, height: 169.3, row: 2 },
  { id: "pic3-holder", x: 704.62, y: 477.68, width: 169.3, height: 169.3, row: 3 },
];

const PICTURE_FILES_FALLBACK = [
  "a---bat___moveable_phonics.png",
  "a---can___moveable_phonics.png",
  "a---cap___moveable_phonics.png",
  "a---cat___moveable_phonics.png",
  "a---fan___moveable_phonics.png",
  "a---hat___moveable_phonics.png",
  "a---map___moveable_phonics.png",
  "a---mat___moveable_phonics.png",
  "a---nap___moveable_phonics.png",
  "a---pan___moveable_phonics.png",
  "a---rat___moveable_phonics.png",
  "a---tan___moveable_phonics.png",
  "e---bed___moveable_phonics.png",
  "e---hen___moveable_phonics.png",
  "e---jet___moveable_phonics.png",
  "e---leg___moveable_phonics.png",
  "e---net___moveable_phonics.png",
  "e---peg___moveable_phonics.png",
  "e---pen___moveable_phonics.png",
  "e---red___moveable_phonics.png",
  "e---ten___moveable_phonics.png",
  "e---web___moveable_phonics.png",
  "e---wed___moveable_phonics.png",
  "e---wet___moveable_phonics.png",
  "i---bib___moveable_phonics.png",
  "i---dig___moveable_phonics.png",
  "i---fig___moveable_phonics.png",
  "i---fin___moveable_phonics.png",
  "i---hip___moveable_phonics.png",
  "i---kid___moveable_phonics.png",
  "i---lid___moveable_phonics.png",
  "i---lip___moveable_phonics.png",
  "i---pig___moveable_phonics.png",
  "i---pin___moveable_phonics.png",
  "i---rib___moveable_phonics.png",
  "i---tin___moveable_phonics.png",
  "o---cob___moveable_phonics.png",
  "o---cog___moveable_phonics.png",
  "o---dog___moveable_phonics.png",
  "o---job___moveable_phonics.png",
  "o---log___moveable_phonics.png",
  "o---rob___moveable_phonics.png",
  "o---rod___moveable_phonics.png",
  "o---sob___moveable_phonics.png",
];

const parsePictureFile = (file: string): PictureItem | null => {
  const match = file.match(/^([a-z]+)---([^_]+)___/i);
  if (!match) return null;
  return { letter: match[1].toLowerCase(), word: match[2].toLowerCase(), file };
};

const buildStagesForLetter = (items: PictureItem[], letter: string): PictureStage[] => {
  const letterItems = items.filter((item) => item.letter === letter).sort((a, b) =>
    a.file.localeCompare(b.file)
  );
  const stages: PictureStage[] = [];
  for (let index = 0; index + 2 < letterItems.length; index += 3) {
    stages.push({ letter, items: letterItems.slice(index, index + 3) });
  }
  return stages;
};

const parseZoneId = (id: string) => {
  const match = id.match(/line-(\d)-letter(\d)/);
  if (!match) return null;
  return { row: Number(match[1]), index: Number(match[2]) - 1 };
};

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
type LetterState = {
  id: string;
  letter: string;
  x: number;
  y: number;
  homeX: number;
  homeY: number;
};

const buildInitialLetters = (): LetterState[] =>
  LETTER_POSITIONS.map(({ letter, x, y }) => {
    const baseX = x * BOARD_WIDTH;
    const baseY = y * BOARD_HEIGHT + (LETTER_Y_OFFSETS[letter] ?? 0);
    return {
      id: `letter-${letter}`,
      letter,
      x: baseX,
      y: baseY,
      homeX: baseX,
      homeY: baseY,
    };
  });

export default function MoveableAlphabet() {
  const boardRef = useRef<HTMLDivElement | null>(null);
  const [letters, setLetters] = useState<LetterState[]>(() => buildInitialLetters());
  const [assignments, setAssignments] = useState<Record<string, string>>({});
  const [dragging, setDragging] = useState<{
    id: string;
    offsetX: number;
    offsetY: number;
  } | null>(null);
  const [statusMessage, setStatusMessage] = useState<string>("");
  const [stageIndex, setStageIndex] = useState(0);
  const [pictureFiles, setPictureFiles] = useState<string[]>(() => PICTURE_FILES_FALLBACK);
  const [showCompletion, setShowCompletion] = useState(false);
  const matchedRowsRef = useRef<Record<number, string>>({});
  const attemptCountRef = useRef(0);
  const completedRowsRef = useRef<Record<string, true>>({});
  const completedStagesRef = useRef<Record<string, true>>({});
  const completedSetsRef = useRef<Record<string, true>>({});

  const params = useParams<{ vowel?: string }>();
  const rawVowel = typeof params?.vowel === "string" ? params.vowel.toLowerCase() : "a";
  const activeVowel = VOWELS.has(rawVowel) ? rawVowel : "a";
  const completionSteps = useMemo(
    () => getPhonicsCompletionSteps("moveable-alphabet", activeVowel),
    [activeVowel]
  );
  const pictureItems = useMemo(
    () => pictureFiles.map(parsePictureFile).filter((item): item is PictureItem => Boolean(item)),
    [pictureFiles]
  );
  const vowelStages = useMemo(() => buildStagesForLetter(pictureItems, activeVowel), [pictureItems, activeVowel]);

  const pictureSlots = useMemo<PictureSlot[]>(() => {
    const currentStage = vowelStages[stageIndex] ?? vowelStages[0];
    if (!currentStage?.items.length) return [];
    return PICTURE_LAYOUT.map((layout, index) => {
      const item = currentStage.items[index];
      if (!item) return null;
      return { ...layout, ...item };
    }).filter((slot): slot is PictureSlot => Boolean(slot));
  }, [stageIndex, vowelStages]);

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

  useEffect(() => {
    let active = true;
    const loadManifest = async () => {
      try {
        const response = await fetch("/assets/language_arts/moveable_alphabet/images/manifest.json");
        if (!response.ok) return;
        const data = await response.json();
        const files = Array.isArray(data?.files) ? data.files : Array.isArray(data) ? data : null;
        if (!files || !files.length) return;
        if (!active) return;
        setPictureFiles(files.filter((file: unknown): file is string => typeof file === "string"));
      } catch {
        // ignore manifest load failures; fallback list will be used
      }
    };
    loadManifest();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    setStageIndex(0);
    setShowCompletion(false);
  }, [activeVowel, pictureFiles]);

  useEffect(() => {
    primeSpeechVoices();
  }, []);

  useEffect(() => {
    trackLessonEvent({
      lesson: "language-arts:moveable-alphabet",
      activity: `vowel-${activeVowel}`,
      event: "lesson_opened",
      details: {
        stageCount: vowelStages.length,
      },
    });
  }, [activeVowel, vowelStages.length]);

  useEffect(() => {
    setAssignments({});
    setLetters(buildInitialLetters());
    setDragging(null);
    setStatusMessage("");
  }, [stageIndex]);

  useEffect(() => {
    trackLessonEvent({
      lesson: "language-arts:moveable-alphabet",
      activity: `vowel-${activeVowel}`,
      event: "stage_viewed",
      page: stageIndex + 1,
      totalPages: vowelStages.length,
    });
  }, [activeVowel, stageIndex, vowelStages.length]);

  const [layoutCapture, setLayoutCapture] = useState<{ letter: string; x: number; y: number }[]>([]);
  const [layoutExport, setLayoutExport] = useState<string>("");
  const captureLayout = useCallback(() => {
    const data = letters.map((letter) => ({
      letter: letter.letter,
      x: Number((letter.x / BOARD_WIDTH).toFixed(4)),
      y: Number((letter.y / BOARD_HEIGHT).toFixed(4)),
    }));
    setLayoutCapture(data);
    setLayoutExport(JSON.stringify(data, null, 2));
    console.log("Captured layout positions:", data);
  }, [letters]);
  const applyCapturedLayout = useCallback(() => {
    if (!layoutCapture.length) return;
    setLetters((current) =>
      current.map((letter) => {
        const match = layoutCapture.find((entry) => entry.letter === letter.letter);
        if (!match) return letter;
        const x = match.x * BOARD_WIDTH;
        const y = match.y * BOARD_HEIGHT;
        return { ...letter, x, y, homeX: x, homeY: y };
      })
    );
  }, [layoutCapture]);

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
    [getPointerClient]
  );

  const removeAssignment = useCallback((letterId: string) => {
    setAssignments((prev) => {
      const updated = { ...prev };
      Object.keys(updated).forEach((zoneId) => {
        if (updated[zoneId] === letterId) {
          delete updated[zoneId];
        }
      });
      return updated;
    });
  }, []);

  const getLastSlotForRow = useCallback(
    (row: number) => DROP_ZONE_DEFINITIONS.find((def) => def.id === `line-${row}-letter3`),
    []
  );

  const getRowOverlayMetrics = useCallback(
    (row: number, slots: PictureSlot[]) => {
      const slot = slots.find((entry) => entry.row === row);
      const lastSlot = getLastSlotForRow(row);
      if (!slot || !lastSlot) return null;
      const leftPercent = (slot.x / BOARD_WIDTH) * 100;
      const topPercent = (slot.y / BOARD_HEIGHT) * 100;
      const heightPercent = (slot.height / BOARD_HEIGHT) * 100;
      const endX = lastSlot.x + lastSlot.width;
      const widthPercent = ((endX - slot.x) / BOARD_WIDTH) * 100;
      return { leftPercent, topPercent, widthPercent, heightPercent };
    },
    [getLastSlotForRow]
  );

  const handleSpeak = useCallback((word: string, interrupt = true) => {
    speakWithPreferredVoice(word, {
      lang: "en-US",
      rate: 0.9,
      pitch: 0.95,
      volume: 0.9,
      interrupt,
    });
  }, []);

  const rowStatuses = useMemo<RowStatus[]>(() => {
    const statusMap: Record<number, RowStatus> = {};
    pictureSlots.forEach((slot) => {
      statusMap[slot.row] = { row: slot.row, word: slot.word, letters: ["", "", ""], matched: false };
    });
    Object.entries(assignments).forEach(([zoneId, letterId]) => {
      const parsed = parseZoneId(zoneId);
      if (!parsed) return;
      const entry = statusMap[parsed.row];
      if (!entry) return;
      const letterState = letters.find((l) => l.id === letterId);
      if (!letterState) return;
      entry.letters[parsed.index] = letterState.letter;
    });
    Object.values(statusMap).forEach((entry) => {
      entry.matched = entry.letters.join("") === entry.word;
    });
    return PICTURE_LAYOUT.map((slot) => statusMap[slot.row]).filter((entry): entry is RowStatus => Boolean(entry));
  }, [assignments, letters, pictureSlots]);

  useEffect(() => {
    const currentMatched: Record<number, string> = {};

    rowStatuses.forEach((status) => {
      if (!status.matched) return;
      currentMatched[status.row] = status.word;
      const previousWord = matchedRowsRef.current[status.row];
      if (previousWord !== status.word) {
        const completedRowKey = `${activeVowel}-${stageIndex}-${status.row}-${status.word}`;
        if (!completedRowsRef.current[completedRowKey]) {
          completedRowsRef.current[completedRowKey] = true;
          trackLessonEvent({
            lesson: "language-arts:moveable-alphabet",
            activity: `vowel-${activeVowel}`,
            event: "word_completed",
            success: true,
            value: status.word,
            page: stageIndex + 1,
            totalPages: vowelStages.length,
            details: {
              row: status.row,
            },
          });
        }
        handleSpeak(status.word, false);
      }
    });

    matchedRowsRef.current = currentMatched;
  }, [activeVowel, handleSpeak, rowStatuses, stageIndex, vowelStages.length]);

  const advanceTimeoutRef = useRef<number | null>(null);
  useEffect(() => {
    if (!rowStatuses.length) return;
    const allMatched = rowStatuses.every((status) => status.matched);
    if (!allMatched) return;

    const stageKey = `${activeVowel}-${stageIndex}`;
    if (!completedStagesRef.current[stageKey]) {
      completedStagesRef.current[stageKey] = true;
      trackLessonEvent({
        lesson: "language-arts:moveable-alphabet",
        activity: `vowel-${activeVowel}`,
        event: "stage_completed",
        success: true,
        page: stageIndex + 1,
        totalPages: vowelStages.length,
      });
    }

    if (stageIndex >= vowelStages.length - 1) {
      const setKey = `vowel-${activeVowel}`;
      if (!completedSetsRef.current[setKey]) {
        completedSetsRef.current[setKey] = true;
        trackLessonEvent({
          lesson: "language-arts:moveable-alphabet",
          activity: `vowel-${activeVowel}`,
          event: "lesson_completed",
          success: true,
          page: vowelStages.length,
          totalPages: vowelStages.length,
        });
      }
      setShowCompletion(true);
    }

    if (stageIndex >= vowelStages.length - 1) return;
    if (advanceTimeoutRef.current !== null) return;
    advanceTimeoutRef.current = window.setTimeout(() => {
      advanceTimeoutRef.current = null;
      setStageIndex((prev) => Math.min(prev + 1, vowelStages.length - 1));
    }, 900);
    return () => {
      if (advanceTimeoutRef.current !== null) {
        window.clearTimeout(advanceTimeoutRef.current);
        advanceTimeoutRef.current = null;
      }
    };
  }, [activeVowel, rowStatuses, stageIndex, vowelStages.length]);
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
            : letter
        )
      );
    };
    const handleUp = (event: PointerEvent) => {
      event.preventDefault();
      if (!dragging) return;
      const letter = letters.find((l) => l.id === dragging.id);
      if (!letter) {
        setDragging(null);
        return;
      }
      removeAssignment(letter.id);
      const allowedType: DropZoneType = VOWELS.has(letter.letter) ? "vowel" : "consonant";
      const zone = DROP_ZONES.map((target) => ({
        ...target,
        dist: Math.hypot(letter.x - target.centerX, letter.y - target.centerY),
      }))
        .filter((target) => target.dist <= DROP_THRESHOLD)
        .sort((a, b) => a.dist - b.dist)[0];
      const attempt = attemptCountRef.current + 1;
      attemptCountRef.current = attempt;
      if (zone && zone.type === allowedType) {
        trackLessonEvent({
          lesson: "language-arts:moveable-alphabet",
          activity: `vowel-${activeVowel}`,
          event: "attempt_result",
          success: true,
          attempt,
          value: letter.letter,
          page: stageIndex + 1,
          totalPages: vowelStages.length,
          details: {
            zone: zone.id,
            zoneType: zone.type,
          },
        });
        setStatusMessage("");
        const yOffset = LETTER_Y_OFFSETS[letter.letter] ?? 0;
        setAssignments((prev) => {
          const updated = { ...prev };
          if (updated[zone.id]) {
            delete updated[zone.id];
          }
          updated[zone.id] = letter.id;
          return updated;
        });
        setLetters((current) => {
          const updated = current.map((l) =>
            l.id === letter.id
              ? {
                  ...l,
                  x: zone.centerX,
                  y: zone.centerY + yOffset,
                }
              : l
          );
          const now = Date.now();
          const clone: LetterState = {
            id: `${letter.id}-clone-${now}`,
            letter: letter.letter,
            x: letter.homeX,
            y: letter.homeY,
            homeX: letter.homeX,
            homeY: letter.homeY,
          };
          return [...updated, clone];
        });
      } else {
        trackLessonEvent({
          lesson: "language-arts:moveable-alphabet",
          activity: `vowel-${activeVowel}`,
          event: "attempt_result",
          success: false,
          attempt,
          value: letter.letter,
          page: stageIndex + 1,
          totalPages: vowelStages.length,
          details: {
            zone: zone?.id ?? "",
            zoneType: zone?.type ?? "",
          },
        });
        setStatusMessage("Not the correct place, try again");
        setLetters((current) =>
          current.map((l) =>
            l.id === letter.id
              ? {
                  ...l,
                  x: l.homeX,
                  y: l.homeY,
                }
              : l
          )
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
  }, [activeVowel, convertPointerToBoard, dragging, letters, removeAssignment, stageIndex, vowelStages.length]);

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
    setLetters((current) =>
      current.map((l) =>
        l.id === letter.id
          ? {
              ...l,
              x: l.homeX,
              y: l.homeY,
            }
          : l
      )
    );
    setStatusMessage("");
    setDragging({ id: letter.id, offsetX: point.x - letter.homeX, offsetY: point.y - letter.homeY });
  };

  const boardZones = useMemo(
    () =>
      DROP_ZONES.map((target) => {
        const left = ((target.centerX - target.width / 2) / BOARD_WIDTH) * 100;
        const top = ((target.centerY - target.height / 2) / BOARD_HEIGHT) * 100;
        const widthPercent = (target.width / BOARD_WIDTH) * 100;
        const heightPercent = (target.height / BOARD_HEIGHT) * 100;
        return {
          ...target,
          left: `${left}%`,
          top: `${top}%`,
          widthPercent: `${widthPercent}%`,
          heightPercent: `${heightPercent}%`,
        };
      }),
    []
  );

  const letterScale = 0.75;
  const letterWidthPercentBase = ((CELL_WIDTH * 1.25) / BOARD_WIDTH) * 100 * letterScale;
  const letterHeightPercentBase = ((CELL_HEIGHT * 1.1) / BOARD_HEIGHT) * 100 * letterScale;

  return (
    <div className="relative min-h-screen bg-[radial-gradient(circle_at_top,#f5efe6,#fdfbf8_55%,#f7efe4)]">
      <HomeLink />
      <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-8 px-6 py-10">
        <header className="space-y-3 text-center">
          <p className="text-xs uppercase tracking-[0.35em] text-stone-400">
            Language Arts · Moveable Alphabet · Vowel {activeVowel.toUpperCase()}
          </p>
          <h1 className="font-display text-4xl font-semibold text-stone-900">
            Moveable Alphabet Board — {activeVowel.toUpperCase()}
          </h1>
          <p className="text-sm text-stone-600">Drag the letters onto the picture holders to build words.</p>
        </header>
        <div className="relative mx-auto w-full max-w-[1200px]">
          <div
            ref={boardRef}
            className="relative w-full overflow-visible rounded-3xl border border-stone-200 shadow-[0_25px_60px_-40px_rgba(15,23,42,0.8)]"
            style={{ paddingTop: `${(BOARD_HEIGHT / BOARD_WIDTH) * 100}%` }}
          >
            <img src={BOARD_IMAGE} alt="Moveable alphabet board" className="absolute inset-0 h-full w-full object-cover" />

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
                    src={`/assets/language_arts/moveable_alphabet/images/${slot.file}`}
                    alt={`${slot.word}`}
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
                const metrics = getRowOverlayMetrics(status.row, pictureSlots);
                if (!metrics) return null;
                return (
                  <div
                    key={`overlay-${status.row}`}
                    className="pointer-events-none absolute bg-emerald-500/40"
                    style={{
                      left: `${metrics.leftPercent}%`,
                      top: `${metrics.topPercent}%`,
                      width: `${metrics.widthPercent}%`,
                      height: `${metrics.heightPercent}%`,
                    }}
                  />
                );
              })}
            {boardZones.map((zone) => (
              <div
                key={zone.id}
                className="pointer-events-none absolute"
                style={{
                  left: zone.left,
                  top: zone.top,
                  width: zone.widthPercent,
                  height: zone.heightPercent,
                }}
              />
            ))}
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
                    src={`/assets/language_arts/moveable_alphabet/letters/${letter.letter}.png`}
                    alt={`Letter ${letter.letter}`}
                    className="h-full w-full object-contain"
                    style={{ imageRendering: "pixelated" }}
                  />
                </button>
              );
            })}
          </div>
          {statusMessage && (
            <p className="mt-4 text-center text-sm font-semibold uppercase tracking-[0.4em] text-stone-500">
              {statusMessage}
            </p>
          )}
          {rowStatuses.length > 0 && (
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              {rowStatuses.map((status) => (
                <div
                  key={status.row}
                  className="rounded-2xl border border-stone-200 bg-white/70 p-3 text-center shadow-[0_10px_30px_-25px_rgba(15,23,42,0.8)]"
                >
                  <p className="text-[10px] uppercase tracking-[0.35em] text-stone-400">
                    Picture {status.row}
                  </p>
                  <p className="text-xl font-semibold text-stone-900">{status.word.toUpperCase()}</p>
                  <p className="text-xs text-stone-500">
                    {status.letters.map((letter) => (letter ? letter.toUpperCase() : "•")).join(" ")}
                  </p>
                  <p
                    className={`mt-2 text-xs font-semibold uppercase tracking-[0.4em] ${
                      status.matched ? "text-emerald-600" : "text-stone-500"
                    }`}
                  >
                    {status.matched ? "Correct" : "Complete the word"}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="mt-8 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={captureLayout}
            className="inline-flex items-center justify-center rounded-full border border-stone-300 px-6 py-3 text-xs font-semibold uppercase tracking-[0.4em] text-stone-600 transition hover:border-stone-400 hover:text-stone-900"
          >
            Capture current layout
          </button>
          {layoutCapture.length > 0 && (
            <>
              <button
                type="button"
                onClick={applyCapturedLayout}
                className="inline-flex items-center justify-center rounded-full border border-emerald-500 bg-emerald-500/10 px-6 py-3 text-xs font-semibold uppercase tracking-[0.4em] text-emerald-600 transition hover:bg-emerald-500/20"
              >
                Lock layout as baseline
              </button>
              <button
                type="button"
                onClick={() => layoutExport && navigator.clipboard?.writeText(layoutExport)}
                className="inline-flex items-center justify-center rounded-full border border-stone-300 px-6 py-3 text-xs font-semibold uppercase tracking-[0.4em] text-stone-600 transition hover:border-stone-400 hover:text-stone-900"
              >
                Copy JSON
              </button>
            </>
          )}
        </div>
        {layoutExport && (
          <div className="mt-4 rounded-2xl bg-white/90 p-4 text-xs font-mono text-stone-700 shadow-inner">
            <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-stone-400">Captured positions</p>
            <pre className="mt-2 max-h-48 overflow-auto text-[11px] leading-snug">{layoutExport}</pre>
          </div>
        )}
        <div className="flex flex-wrap gap-4">
          <Link
            href="/lessons/language-arts/moveable-alphabet"
            className="inline-flex items-center justify-center rounded-full border border-stone-300 px-5 py-2 text-xs uppercase tracking-[0.4em] text-stone-500"
          >
            Back to Vowels
          </Link>
        </div>
      </main>
      <CompletionOverlay
        open={showCompletion}
        title={completionSteps.isEndOfSeries ? "Series Complete" : "Lesson Complete"}
        message={
          completionSteps.isEndOfSeries
            ? `You completed vowel ${activeVowel.toUpperCase()} in this material.`
            : `Great work on vowel ${activeVowel.toUpperCase()}.`
        }
        primaryAction={completionSteps.nextInSeries ?? completionSteps.nextMaterial}
        secondaryAction={{ href: "/lessons/language-arts/phonics", label: "Back to Phonics" }}
      />
    </div>
  );
}
