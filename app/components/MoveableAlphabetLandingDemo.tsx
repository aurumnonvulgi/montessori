"use client";

import { type PointerEvent as ReactPointerEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { speakWithPreferredVoice } from "../lib/speech";

// Landing-only sample copy of the Pink Series moveable alphabet lesson (vowel E).
const BOARD_IMAGE = "/assets/language_arts/moveable_alphabet/moveable_alphabet_board.svg";
const BOARD_WIDTH = 1366;
const BOARD_HEIGHT = 768;
const DROP_THRESHOLD = 70;
const CELL_WIDTH = 75.16;
const CELL_HEIGHT = 133.4;
const ACTIVE_VOWEL = "e";

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

type RowStatus = {
  row: number;
  word: string;
  letters: string[];
  matched: boolean;
};

type LetterState = {
  id: string;
  letter: string;
  x: number;
  y: number;
  homeX: number;
  homeY: number;
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
}));

const PICTURE_LAYOUT: PictureLayout[] = [
  { id: "pic1-holder", x: 704.62, y: 71.96, width: 169.3, height: 169.3, row: 1 },
  { id: "pic2-holder", x: 704.62, y: 276.79, width: 169.3, height: 169.3, row: 2 },
  { id: "pic3-holder", x: 704.62, y: 477.68, width: 169.3, height: 169.3, row: 3 },
];

const PICTURE_FILES_FALLBACK = [
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
];

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

const DEMO_START_DELAY_MS = 500;
const DEMO_MOVE_DURATION_MS = 1900;
const DEMO_MOVE_PAUSE_MS = 320;
const DEMO_MATCH_FLASH_MS = 1200;
const DEMO_RETURN_PAUSE_MS = 260;
const VOWELS = new Set(["a", "e", "i", "o", "u"]);
const CONSONANT_COLOR = "#c31632";
const VOWEL_COLOR = "#1978bf";

const parsePictureFile = (file: string): PictureItem | null => {
  const match = file.match(/^([a-z]+)---([^_]+)___/i);
  if (!match) return null;
  return { letter: match[1].toLowerCase(), word: match[2].toLowerCase(), file };
};

const parseZoneId = (id: string) => {
  const match = id.match(/line-(\d)-letter(\d)/);
  if (!match) return null;
  return { row: Number(match[1]), index: Number(match[2]) - 1 };
};

const getPhonicLetterColor = (letter: string) => {
  const lower = letter.toLowerCase();
  return VOWELS.has(lower) ? VOWEL_COLOR : CONSONANT_COLOR;
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

export default function MoveableAlphabetLandingDemo() {
  const sampleRef = useRef<HTMLDivElement | null>(null);
  const boardRef = useRef<HTMLDivElement | null>(null);
  const boardRectRef = useRef<DOMRect | null>(null);
  const matchedRowsRef = useRef<Record<number, string>>({});
  const lettersRef = useRef<LetterState[]>([]);
  const autoDemoPlayedRef = useRef(false);
  const autoDemoTimeoutsRef = useRef<number[]>([]);
  const autoDemoRafRef = useRef<number[]>([]);
  const bHintPlayedRef = useRef(false);
  const bHintRafRef = useRef<number | null>(null);
  const bHintTimerRef = useRef<number | null>(null);

  const [letters, setLetters] = useState<LetterState[]>(() => buildInitialLetters());
  const [assignments, setAssignments] = useState<Record<string, string>>({});
  const [dragging, setDragging] = useState<{ id: string; offsetX: number; offsetY: number } | null>(null);
  const [statusMessage, setStatusMessage] = useState("");
  const [pictureFiles, setPictureFiles] = useState<string[]>(() => PICTURE_FILES_FALLBACK);
  const [isAutoDemoRunning, setIsAutoDemoRunning] = useState(false);
  const [demoFlashRow, setDemoFlashRow] = useState<number | null>(null);
  const [showBGrabHint, setShowBGrabHint] = useState(false);
  const [bHintOffset, setBHintOffset] = useState(0);

  useEffect(() => {
    lettersRef.current = letters;
  }, [letters]);

  const clearAutoDemoTimers = useCallback(() => {
    autoDemoTimeoutsRef.current.forEach((id) => window.clearTimeout(id));
    autoDemoTimeoutsRef.current = [];
    autoDemoRafRef.current.forEach((id) => window.cancelAnimationFrame(id));
    autoDemoRafRef.current = [];
  }, []);

  const stopBGrabHint = useCallback(() => {
    if (bHintTimerRef.current !== null) {
      window.clearTimeout(bHintTimerRef.current);
      bHintTimerRef.current = null;
    }
    if (bHintRafRef.current !== null) {
      window.cancelAnimationFrame(bHintRafRef.current);
      bHintRafRef.current = null;
    }
    setShowBGrabHint(false);
    setBHintOffset(0);
  }, []);

  const startBGrabHint = useCallback(() => {
    if (bHintPlayedRef.current) return;
    bHintPlayedRef.current = true;
    stopBGrabHint();

    const AMPLITUDE = 34;
    const CYCLE_MS = 1180;
    const DURATION_MS = 4300;

    setShowBGrabHint(true);
    const startAt = performance.now();

    const animate = (now: number) => {
      const elapsed = now - startAt;
      const phase = (elapsed % CYCLE_MS) / CYCLE_MS;
      const pull = phase < 0.5 ? phase / 0.5 : (1 - phase) / 0.5;
      const clamped = Math.max(0, Math.min(1, pull));
      setBHintOffset(AMPLITUDE * clamped);

      if (elapsed < DURATION_MS) {
        bHintRafRef.current = window.requestAnimationFrame(animate);
        return;
      }

      bHintRafRef.current = null;
      setBHintOffset(0);
      setShowBGrabHint(false);
    };

    bHintTimerRef.current = window.setTimeout(() => {
      bHintTimerRef.current = null;
      bHintRafRef.current = window.requestAnimationFrame(animate);
    }, 260);
  }, [stopBGrabHint]);

  const waitFor = useCallback((ms: number) => {
    return new Promise<void>((resolve) => {
      const id = window.setTimeout(resolve, ms);
      autoDemoTimeoutsRef.current.push(id);
    });
  }, []);

  const easeInOut = useCallback((value: number) => {
    if (value < 0.5) {
      return 2 * value * value;
    }
    return 1 - Math.pow(-2 * value + 2, 2) / 2;
  }, []);

  const animateLetterTo = useCallback(
    (letterId: string, toX: number, toY: number, durationMs = 1300) => {
      return new Promise<void>((resolve) => {
        const source = lettersRef.current.find((letter) => letter.id === letterId);
        if (!source) {
          resolve();
          return;
        }
        const fromX = source.x;
        const fromY = source.y;
        const startAt = performance.now();

        const step = (now: number) => {
          const progress = Math.min(1, (now - startAt) / durationMs);
          const eased = easeInOut(progress);
          const nextX = fromX + (toX - fromX) * eased;
          const nextY = fromY + (toY - fromY) * eased;
          setLetters((current) => {
            const updated = current.map((letter) =>
              letter.id === letterId
                ? {
                    ...letter,
                    x: nextX,
                    y: nextY,
                  }
                : letter,
            );
            lettersRef.current = updated;
            return updated;
          });

          if (progress < 1) {
            const rafId = window.requestAnimationFrame(step);
            autoDemoRafRef.current.push(rafId);
            return;
          }
          resolve();
        };

        const rafId = window.requestAnimationFrame(step);
        autoDemoRafRef.current.push(rafId);
      });
    },
    [easeInOut],
  );

  useEffect(() => {
    let active = true;
    const loadManifest = async () => {
      try {
        const response = await fetch("/assets/language_arts/moveable_alphabet/images/manifest.json", {
          cache: "no-store",
        });
        if (!response.ok) return;
        const data = await response.json();
        const files = Array.isArray(data?.files) ? data.files : Array.isArray(data) ? data : null;
        if (!files?.length || !active) return;
        setPictureFiles(files.filter((file: unknown): file is string => typeof file === "string"));
      } catch {
        // Keep fallback list when manifest is unavailable.
      }
    };
    void loadManifest();
    return () => {
      active = false;
    };
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

  const pictureItems = useMemo(
    () =>
      pictureFiles
        .map(parsePictureFile)
        .filter((item): item is PictureItem => Boolean(item))
        .filter((item) => item.letter === ACTIVE_VOWEL)
        .sort((a, b) => a.file.localeCompare(b.file)),
    [pictureFiles],
  );

  const pictureSlots = useMemo<PictureSlot[]>(() => {
    return PICTURE_LAYOUT.map((layout, index) => {
      const item = pictureItems[index];
      if (!item) return null;
      return { ...layout, ...item };
    }).filter((slot): slot is PictureSlot => Boolean(slot));
  }, [pictureItems]);

  const runAutoDemo = useCallback(async () => {
    if (autoDemoPlayedRef.current || isAutoDemoRunning) return;
    const bedSlot = pictureSlots.find((slot) => slot.word === "bed");
    if (!bedSlot) return;

    autoDemoPlayedRef.current = true;
    setIsAutoDemoRunning(true);
    setStatusMessage("");
    setDemoFlashRow(null);
    setAssignments({});

    const row = bedSlot.row;
    const lettersToPlace = ["b", "e", "d"] as const;
    const placement: Record<string, string> = {};
    const placedIds: string[] = [];

    try {
      await waitFor(DEMO_START_DELAY_MS);
      for (let index = 0; index < lettersToPlace.length; index += 1) {
        const letterName = lettersToPlace[index];
        const targetZone = DROP_ZONES.find((zone) => zone.id === `line-${row}-letter${index + 1}`);
        if (!targetZone) continue;

        const letterState = lettersRef.current.find(
          (letter) => letter.letter === letterName && letter.id.startsWith(`letter-${letterName}`),
        );
        if (!letterState) continue;

        placement[targetZone.id] = letterState.id;
        placedIds.push(letterState.id);
        await animateLetterTo(
          letterState.id,
          targetZone.centerX,
          targetZone.centerY + (LETTER_Y_OFFSETS[letterName] ?? 0),
          DEMO_MOVE_DURATION_MS,
        );
        await waitFor(DEMO_MOVE_PAUSE_MS);
      }

      setAssignments(placement);
      setDemoFlashRow(row);
      await waitFor(DEMO_MATCH_FLASH_MS);

      setAssignments({});
      await waitFor(120);

      for (const letterId of [...placedIds].reverse()) {
        const current = lettersRef.current.find((letter) => letter.id === letterId);
        if (!current) continue;
        await animateLetterTo(letterId, current.homeX, current.homeY, DEMO_MOVE_DURATION_MS);
        await waitFor(DEMO_RETURN_PAUSE_MS);
      }

      setStatusMessage("Your turn.");
      startBGrabHint();
    } finally {
      setDemoFlashRow(null);
      setIsAutoDemoRunning(false);
    }
  }, [animateLetterTo, isAutoDemoRunning, pictureSlots, startBGrabHint, waitFor]);

  useEffect(() => {
    const node = sampleRef.current;
    if (!node || !pictureSlots.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (!entry?.isIntersecting) return;
        void runAutoDemo();
        observer.disconnect();
      },
      { threshold: 0.55 },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [pictureSlots.length, runAutoDemo]);

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
      const letterState = letters.find((letter) => letter.id === letterId);
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
        handleSpeak(status.word, false);
      }
    });

    matchedRowsRef.current = currentMatched;
  }, [handleSpeak, rowStatuses]);

  useEffect(() => {
    if (!dragging) return;

    const handleMove = (event: PointerEvent) => {
      event.preventDefault();
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
      const letter = letters.find((item) => item.id === dragging.id);
      if (!letter) {
        setDragging(null);
        return;
      }

      removeAssignment(letter.id);

      const allowedType: DropZoneType = letter.letter === ACTIVE_VOWEL ? "vowel" : "consonant";
      const zone = DROP_ZONES.map((target) => ({
        ...target,
        dist: Math.hypot(letter.x - target.centerX, letter.y - target.centerY),
      }))
        .filter((target) => target.dist <= DROP_THRESHOLD)
        .sort((a, b) => a.dist - b.dist)[0];

      if (zone && zone.type === allowedType) {
        const occupiedBy = assignments[zone.id];
        if (occupiedBy && occupiedBy !== letter.id) {
          setStatusMessage("That box already has a letter.");
          setLetters((current) =>
            current.map((item) =>
              item.id === letter.id
                ? {
                    ...item,
                    x: item.homeX,
                    y: item.homeY,
                  }
                : item,
            ),
          );
          setDragging(null);
          return;
        }

        setStatusMessage("");
        const yOffset = LETTER_Y_OFFSETS[letter.letter] ?? 0;
        setAssignments((prev) => ({ ...prev, [zone.id]: letter.id }));
        setLetters((current) => {
          const updated = current.map((item) =>
            item.id === letter.id
              ? {
                  ...item,
                  x: zone.centerX,
                  y: zone.centerY + yOffset,
                }
              : item,
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
        setStatusMessage("Not the correct place, try again.");
        setLetters((current) =>
          current.map((item) =>
            item.id === letter.id
              ? {
                  ...item,
                  x: item.homeX,
                  y: item.homeY,
                }
              : item,
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
  }, [assignments, convertPointerToBoard, dragging, letters, removeAssignment]);

  useEffect(() => {
    return () => {
      clearAutoDemoTimers();
      stopBGrabHint();
    };
  }, [clearAutoDemoTimers, stopBGrabHint]);

  const handlePointerDown = (event: ReactPointerEvent<HTMLButtonElement>, letter: LetterState) => {
    if (isAutoDemoRunning) return;
    stopBGrabHint();
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
      current.map((item) =>
        item.id === letter.id
          ? {
              ...item,
              x: item.homeX,
              y: item.homeY,
            }
          : item,
      ),
    );
    setStatusMessage("");
    setDragging({ id: letter.id, offsetX: point.x - letter.homeX, offsetY: point.y - letter.homeY });
  };

  const resetSample = useCallback(() => {
    clearAutoDemoTimers();
    stopBGrabHint();
    setAssignments({});
    setLetters(buildInitialLetters());
    setDragging(null);
    setDemoFlashRow(null);
    setIsAutoDemoRunning(false);
    setStatusMessage("");
    matchedRowsRef.current = {};
  }, [clearAutoDemoTimers, stopBGrabHint]);

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
    [],
  );

  const getLastSlotForRow = useCallback((row: number) => {
    return DROP_ZONE_DEFINITIONS.find((definition) => definition.id === `line-${row}-letter3`);
  }, []);

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
    [getLastSlotForRow],
  );

  const letterScale = 0.75;
  const letterWidthPercentBase = ((CELL_WIDTH * 1.25) / BOARD_WIDTH) * 100 * letterScale;
  const letterHeightPercentBase = ((CELL_HEIGHT * 1.1) / BOARD_HEIGHT) * 100 * letterScale;

  return (
    <div
      ref={sampleRef}
      className="rounded-[32px] border border-stone-200 bg-white/90 p-3 shadow-[0_30px_90px_-60px_rgba(15,23,42,0.7)] sm:p-5"
    >
      <div className="relative mx-auto w-full max-w-[1200px]">
        <div
          ref={boardRef}
          className="relative w-full overflow-visible rounded-3xl border border-stone-200 shadow-[0_25px_60px_-40px_rgba(15,23,42,0.8)]"
          style={{ paddingTop: `${(BOARD_HEIGHT / BOARD_WIDTH) * 100}%` }}
        >
          <img src={BOARD_IMAGE} alt="Moveable alphabet board sample" className="absolute inset-0 h-full w-full object-cover" />

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
                  alt={slot.word}
                  className="h-full w-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => handleSpeak(slot.word)}
                  aria-label={`Say ${slot.word}`}
                  className="absolute bottom-1.5 right-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-white/80 text-xs text-stone-600 shadow shadow-stone-400 transition hover:bg-white sm:bottom-2 sm:right-2 sm:h-8 sm:w-8 sm:text-base"
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

          {demoFlashRow !== null ? (
            (() => {
              const metrics = getRowOverlayMetrics(demoFlashRow, pictureSlots);
              if (!metrics) return null;
              return (
                <div
                  className="pointer-events-none absolute animate-pulse bg-emerald-400/55"
                  style={{
                    left: `${metrics.leftPercent}%`,
                    top: `${metrics.topPercent}%`,
                    width: `${metrics.widthPercent}%`,
                    height: `${metrics.heightPercent}%`,
                  }}
                />
              );
            })()
          ) : null}

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
            const displayX = showBGrabHint && letter.id === "letter-b" ? letter.x + bHintOffset : letter.x;
            return (
              <button
                key={letter.id}
                onPointerDown={(event) => handlePointerDown(event, letter)}
                className={`absolute -translate-x-1/2 -translate-y-1/2 rounded-none border-none bg-transparent shadow-none ${
                  isAutoDemoRunning ? "pointer-events-none" : "pointer-events-auto"
                }`}
                style={{
                  left: `${(displayX / BOARD_WIDTH) * 100}%`,
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

          {showBGrabHint ? (
            (() => {
              const bLetter = letters.find((letter) => letter.id === "letter-b");
              if (!bLetter) return null;
              const handX = bLetter.x + bHintOffset + 42;
              const handY = bLetter.y - 58;
              return (
                <div
                  className="pointer-events-none absolute z-20 -translate-x-1/2 -translate-y-1/2"
                  style={{
                    left: `${(handX / BOARD_WIDTH) * 100}%`,
                    top: `${(handY / BOARD_HEIGHT) * 100}%`,
                  }}
                >
                  <div className="rounded-full border border-sky-100 bg-white/90 px-2 py-1 text-xl shadow-md shadow-sky-200/60">
                    👉
                  </div>
                </div>
              );
            })()
          ) : null}
        </div>
      </div>

      {statusMessage ? (
        <p className="mt-4 text-center text-sm font-semibold uppercase tracking-[0.35em] text-stone-500">
          {statusMessage}
        </p>
      ) : null}

      {rowStatuses.length > 0 ? (
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          {rowStatuses.map((status) => (
            <div
              key={status.row}
              className="rounded-2xl border border-stone-200 bg-white/70 p-3 text-center shadow-[0_10px_30px_-25px_rgba(15,23,42,0.8)]"
            >
              <p className="text-[10px] uppercase tracking-[0.35em] text-stone-400">Picture {status.row}</p>
              <p className="text-xl font-semibold leading-none">
                {status.word.split("").map((letter, index) => (
                  <span key={`${status.row}-word-${index}`} style={{ color: getPhonicLetterColor(letter) }}>
                    {letter}
                  </span>
                ))}
              </p>
              <p className="mt-1 text-xs font-semibold tracking-[0.25em] text-stone-500">
                {status.letters.map((letter, index) => {
                  const display = letter || "•";
                  const expected = status.word[index] ?? "";
                  const colorSource = letter || expected;
                  return (
                    <span key={`${status.row}-letters-${index}`} style={{ color: getPhonicLetterColor(colorSource) }}>
                      {display}
                    </span>
                  );
                })}
              </p>
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
      ) : null}

      <div className="mt-4 flex justify-center">
        <button
          type="button"
          onClick={resetSample}
          disabled={isAutoDemoRunning}
          className="inline-flex items-center justify-center rounded-full border border-[#71c0ee] bg-white px-6 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-[#0e6798] transition hover:bg-[#e8f5fc]"
        >
          Reset Sample
        </button>
      </div>
    </div>
  );
}
