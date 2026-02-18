"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import HomeLink from "../../../../components/HomeLink";

const BOARD_IMAGE = "/assets/language_arts/concept_development/association/Images/9matchingwith6deck.svg";
const BOARD_WIDTH = 1366;
const BOARD_HEIGHT = 768;
const SLOT_SIZE = 169.3;
const DROP_THRESHOLD = 90;

const ASSOCIATION_SETS: [string, string, string][] = [
  ["glass of water", "pitcher", "cup"],
  ["toothpaste", "toothbrush", "dental floss"],
  ["pencil", "notebook", "eraser"],
  ["fork", "spoon", "plate"],
  ["soap", "towel", "shampoo"],
  ["shoes", "socks", "shoelaces"],
  ["phone", "charger", "headphones"],
  ["key", "lock", "door"],
  ["paintbrush", "paint", "canvas"],
  ["broom", "dustpan", "trash bin"],
  ["hammer", "nail", "wood"],
  ["screwdriver", "screw", "toolbox"],
  ["refrigerator", "milk", "eggs"],
  ["stove", "pot", "spatula"],
  ["bed", "pillow", "blanket"],
  ["umbrella", "raincoat", "boots"],
  ["book", "bookmark", "library card"],
  ["ball", "goal", "whistle"],
];

const STACK_SLOTS = [
  { id: "stack-1", x: 54.12, y: 100.04 },
  { id: "stack-2", x: 233.41, y: 100.04 },
  { id: "stack-3", x: 412.7, y: 100.04 },
  { id: "stack-4", x: 54.12, y: 275.67 },
  { id: "stack-5", x: 233.41, y: 275.67 },
  { id: "stack-6", x: 412.7, y: 275.67 },
];

const LINE_SLOTS = [
  { id: "line1-box1", x: 756.41, y: 100.04, line: 1, box: 1 },
  { id: "line1-box2", x: 943.47, y: 100.04, line: 1, box: 2 },
  { id: "line1-box3", x: 1130.53, y: 100.04, line: 1, box: 3 },
  { id: "line2-box1", x: 756.41, y: 291.49, line: 2, box: 1 },
  { id: "line2-box2", x: 943.47, y: 291.49, line: 2, box: 2 },
  { id: "line2-box3", x: 1130.53, y: 291.49, line: 2, box: 3 },
  { id: "line3-box1", x: 756.41, y: 482.94, line: 3, box: 1 },
  { id: "line3-box2", x: 943.47, y: 482.94, line: 3, box: 2 },
  { id: "line3-box3", x: 1130.53, y: 482.94, line: 3, box: 3 },
];

const slugify = (word: string) =>
  word
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const toImage = (word: string) =>
  `/assets/language_arts/concept_development/association/${slugify(word)}___association.png`;

type CardState = {
  id: string;
  word: string;
  x: number;
  y: number;
  homeX: number;
  homeY: number;
};

type Slot = {
  id: string;
  x: number;
  y: number;
  line: number;
  box: number;
};

type RowStatus = {
  line: number;
  targets: string[];
  placed: string[];
  matched: boolean;
};

const STAGE_SIZE = 3;

export default function AssociationsGame() {
  const boardRef = useRef<HTMLDivElement | null>(null);
  const [stageIndex, setStageIndex] = useState(0);
  const [cards, setCards] = useState<CardState[]>([]);
  const [assignments, setAssignments] = useState<Record<string, string>>({});
  const [dragging, setDragging] = useState<{ id: string; offsetX: number; offsetY: number } | null>(null);
  const [availableFiles, setAvailableFiles] = useState<string[]>([]);

  useEffect(() => {
    let active = true;
    const loadManifest = async () => {
      try {
        const response = await fetch("/assets/language_arts/concept_development/association/manifest.json");
        if (!response.ok) return;
        const data = await response.json();
        const files = Array.isArray(data?.files) ? data.files : Array.isArray(data) ? data : null;
        if (!files || !files.length) return;
        if (!active) return;
        setAvailableFiles(files.filter((file: unknown): file is string => typeof file === "string"));
      } catch {
        // ignore manifest load failures
      }
    };
    loadManifest();
    return () => {
      active = false;
    };
  }, []);

  const availableSets = useMemo(() => {
    if (!availableFiles.length) return ASSOCIATION_SETS;
    const fileSet = new Set(availableFiles);
    return ASSOCIATION_SETS.filter((set) =>
      set.every((word) => fileSet.has(`${slugify(word)}___association.png`))
    );
  }, [availableFiles]);

  const stageSets = useMemo(() => {
    const start = stageIndex * STAGE_SIZE;
    return availableSets.slice(start, start + STAGE_SIZE);
  }, [availableSets, stageIndex]);

  const stageCount = Math.max(1, Math.ceil(availableSets.length / STAGE_SIZE));

  useEffect(() => {
    const restWords = stageSets.flatMap((set) => set.slice(1));
    const shuffled = [...restWords].sort(() => Math.random() - 0.5);
    const nextCards = shuffled.map((word, index) => {
      const slot = STACK_SLOTS[index] ?? STACK_SLOTS[STACK_SLOTS.length - 1];
      const x = slot.x + SLOT_SIZE / 2;
      const y = slot.y + SLOT_SIZE / 2;
      return {
        id: `card-${stageIndex}-${word}`,
        word,
        x,
        y,
        homeX: x,
        homeY: y,
      };
    });
    setCards(nextCards);
    setAssignments({});
    setDragging(null);
  }, [stageSets, stageIndex]);

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
    [getPointerClient]
  );

  const handleSpeak = useCallback((word: string) => {
    if (typeof window === "undefined") return;
    const utterance = new SpeechSynthesisUtterance(word);
    window.speechSynthesis?.cancel();
    window.speechSynthesis?.speak(utterance);
  }, []);

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

  const dropSlots: Slot[] = useMemo(
    () => LINE_SLOTS.filter((slot) => slot.box !== 1),
    []
  );

  useEffect(() => {
    if (!dragging) return;
    const handleMove = (event: PointerEvent) => {
      event.preventDefault();
      if (!dragging) return;
      const point = convertPointerToBoard(event);
      if (!point) return;
      setCards((current) =>
        current.map((card) =>
          card.id === dragging.id ? { ...card, x: point.x - dragging.offsetX, y: point.y - dragging.offsetY } : card
        )
      );
    };

    const handleUp = (event: PointerEvent) => {
      event.preventDefault();
      if (!dragging) return;
      const card = cards.find((item) => item.id === dragging.id);
      if (!card) {
        setDragging(null);
        return;
      }
      removeAssignment(card.id);
      const target = dropSlots
        .map((slot) => ({
          ...slot,
          centerX: slot.x + SLOT_SIZE / 2,
          centerY: slot.y + SLOT_SIZE / 2,
          dist: Math.hypot(card.x - (slot.x + SLOT_SIZE / 2), card.y - (slot.y + SLOT_SIZE / 2)),
        }))
        .filter((slot) => slot.dist <= DROP_THRESHOLD)
        .sort((a, b) => a.dist - b.dist)[0];

      if (target) {
        setAssignments((prev) => {
          const next = { ...prev };
          const existingCardId = next[target.id];
          if (existingCardId && existingCardId !== card.id) {
            setCards((current) =>
              current.map((item) => (item.id === existingCardId ? { ...item, x: item.homeX, y: item.homeY } : item))
            );
          }
          next[target.id] = card.id;
          return next;
        });
        setCards((current) =>
          current.map((item) =>
            item.id === card.id ? { ...item, x: target.centerX, y: target.centerY } : item
          )
        );
      } else {
        setCards((current) =>
          current.map((item) => (item.id === card.id ? { ...item, x: item.homeX, y: item.homeY } : item))
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
  }, [cards, convertPointerToBoard, dragging, dropSlots, removeAssignment]);

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>, card: CardState) => {
    event.preventDefault();
    const board = boardRef.current;
    if (!board) return;
    boardRectRef.current = board.getBoundingClientRect();
    event.currentTarget.setPointerCapture?.(event.pointerId);
    const point = convertPointerToBoard(event.nativeEvent);
    if (!point) return;
    removeAssignment(card.id);
    setCards((current) =>
      current.map((item) => (item.id === card.id ? { ...item, x: item.homeX, y: item.homeY } : item))
    );
    setDragging({ id: card.id, offsetX: point.x - card.homeX, offsetY: point.y - card.homeY });
  };

  const renderSlots = useMemo(
    () =>
      LINE_SLOTS.map((slot) => ({
        ...slot,
        left: `${(slot.x / BOARD_WIDTH) * 100}%`,
        top: `${(slot.y / BOARD_HEIGHT) * 100}%`,
        width: `${(SLOT_SIZE / BOARD_WIDTH) * 100}%`,
        height: `${(SLOT_SIZE / BOARD_HEIGHT) * 100}%`,
      })),
    []
  );

  const rowStatuses = useMemo<RowStatus[]>(() => {
    return stageSets.map((set, index) => {
      const line = index + 1;
      const targets = set.slice(1);
      const slotIds = [`line${line}-box2`, `line${line}-box3`];
      const placed = slotIds
        .map((slotId) => {
          const cardId = assignments[slotId];
          const card = cards.find((item) => item.id === cardId);
          return card?.word;
        })
        .filter((word): word is string => Boolean(word));
      const matched =
        placed.length === 2 &&
        targets.every((target) => placed.includes(target)) &&
        placed.every((item) => targets.includes(item));
      return { line, targets, placed, matched };
    });
  }, [assignments, cards, stageSets]);

  const rowOverlays = useMemo(() => {
    return rowStatuses
      .filter((status) => status.matched)
      .map((status) => {
        const leftSlot = LINE_SLOTS.find((slot) => slot.line === status.line && slot.box === 1);
        const rightSlot = LINE_SLOTS.find((slot) => slot.line === status.line && slot.box === 3);
        if (!leftSlot || !rightSlot) return null;
        const left = (leftSlot.x / BOARD_WIDTH) * 100;
        const top = (leftSlot.y / BOARD_HEIGHT) * 100;
        const height = (SLOT_SIZE / BOARD_HEIGHT) * 100;
        const endX = rightSlot.x + SLOT_SIZE;
        const width = ((endX - leftSlot.x) / BOARD_WIDTH) * 100;
        return { line: status.line, left, top, width, height };
      })
      .filter(Boolean) as { line: number; left: number; top: number; width: number; height: number }[];
  }, [rowStatuses]);

  const advanceRef = useRef<number | null>(null);
  useEffect(() => {
    if (!rowStatuses.length) return;
    if (!rowStatuses.every((status) => status.matched)) return;
    if (stageIndex >= stageCount - 1) return;
    if (advanceRef.current !== null) return;
    advanceRef.current = window.setTimeout(() => {
      advanceRef.current = null;
      setStageIndex((prev) => Math.min(prev + 1, stageCount - 1));
    }, 900);
    return () => {
      if (advanceRef.current !== null) {
        window.clearTimeout(advanceRef.current);
        advanceRef.current = null;
      }
    };
  }, [rowStatuses, stageIndex, stageCount]);

  return (
    <div className="relative min-h-screen bg-[radial-gradient(circle_at_top,#f5efe6,#fdfbf8_55%,#f7efe4)]">
      <HomeLink />
      <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-8 px-6 py-10">
        <header className="space-y-3 text-center">
          <p className="text-xs uppercase tracking-[0.35em] text-stone-400">Associations · Matching</p>
          <h1 className="font-display text-4xl font-semibold text-stone-900">Associations</h1>
          <p className="text-sm text-stone-600">Match the related items for each row.</p>
        </header>
        <div className="relative mx-auto w-full max-w-[1200px]">
          <div
            ref={boardRef}
            className="relative w-full overflow-visible rounded-3xl border border-stone-200 shadow-[0_25px_60px_-40px_rgba(15,23,42,0.8)]"
            style={{ paddingTop: `${(BOARD_HEIGHT / BOARD_WIDTH) * 100}%` }}
          >
            <img src={BOARD_IMAGE} alt="Associations board" className="absolute inset-0 h-full w-full object-cover" />

            {stageSets.map((set, index) => {
              const slot = renderSlots.find((item) => item.line === index + 1 && item.box === 1);
              if (!slot) return null;
              const word = set[0];
              return (
                <div
                  key={`${word}-${slot.id}`}
                  className="absolute"
                  style={{ left: slot.left, top: slot.top, width: slot.width, height: slot.height }}
                >
                  <img src={toImage(word)} alt={word} className="h-full w-full object-contain" />
                  <button
                    type="button"
                    onClick={() => handleSpeak(word)}
                    aria-label={`Say ${word}`}
                    className="absolute right-1.5 bottom-1.5 flex h-7 w-7 items-center justify-center rounded-full bg-white/90 text-xs text-stone-600 shadow shadow-stone-400 transition hover:bg-white sm:right-2 sm:bottom-2 sm:h-8 sm:w-8 sm:text-base"
                  >
                    🔊
                  </button>
                </div>
              );
            })}

            {renderSlots.map((slot) => (
              <div
                key={slot.id}
                className="pointer-events-none absolute"
                style={{ left: slot.left, top: slot.top, width: slot.width, height: slot.height }}
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
                  width: `${(SLOT_SIZE / BOARD_WIDTH) * 100}%`,
                  height: `${(SLOT_SIZE / BOARD_HEIGHT) * 100}%`,
                  touchAction: "none",
                }}
              >
                <img src={toImage(card.word)} alt={card.word} className="h-full w-full object-contain" />
                <button
                  type="button"
                  onPointerDown={(event) => event.stopPropagation()}
                  onClick={(event) => {
                    event.stopPropagation();
                    handleSpeak(card.word);
                  }}
                  aria-label={`Say ${card.word}`}
                  className="absolute right-1.5 bottom-1.5 flex h-7 w-7 items-center justify-center rounded-full bg-white/90 text-xs text-stone-600 shadow shadow-stone-400 transition hover:bg-white sm:right-2 sm:bottom-2 sm:h-8 sm:w-8 sm:text-base"
                >
                  🔊
                </button>
              </div>
            ))}

            {rowOverlays.map((overlay) => (
              <div
                key={`overlay-${overlay.line}`}
                className="pointer-events-none absolute z-20 bg-emerald-500/40"
                style={{
                  left: `${overlay.left}%`,
                  top: `${overlay.top}%`,
                  width: `${overlay.width}%`,
                  height: `${overlay.height}%`,
                }}
              />
            ))}
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
    </div>
  );
}
