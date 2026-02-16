"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import HomeLink from "../../../../components/HomeLink";

const BOARD_IMAGE = "/assets/language_arts/concept_development/transportation/matching_board_9deck-9match.svg";
const BOARD_WIDTH = 1366;
const BOARD_HEIGHT = 768;
const SLOT_SIZE = 169.3;
const LABEL_HEIGHT = 84.65;
const DROP_THRESHOLD = 90;

const LABEL_SLOTS = [
  { id: "by-air-label", category: "air", x: 756.41, y: 58.08 },
  { id: "by-land-label", category: "land", x: 943.47, y: 58.08 },
  { id: "by-water-label", category: "water", x: 1130.53, y: 58.08 },
];

const ROWS = [
  { row: 1, y: 157.73 },
  { row: 2, y: 349.17 },
  { row: 3, y: 540.63 },
];

const COLUMNS = [
  { column: 1, category: "air", x: 756.41 },
  { column: 2, category: "land", x: 943.47 },
  { column: 3, category: "water", x: 1130.53 },
];

const STACK_SLOTS = [
  { id: "stack-1", x: 54.12, y: 100.04 },
  { id: "stack-2", x: 233.41, y: 100.04 },
  { id: "stack-3", x: 412.7, y: 100.04 },
  { id: "stack-4", x: 54.12, y: 275.67 },
  { id: "stack-5", x: 233.41, y: 275.67 },
  { id: "stack-6", x: 412.7, y: 275.67 },
  { id: "stack-7", x: 54.12, y: 451.3 },
  { id: "stack-8", x: 233.41, y: 451.3 },
  { id: "stack-9", x: 412.7, y: 451.3 },
];

const LABEL_IMAGES: Record<string, string> = {
  air: "/assets/language_arts/concept_development/transportation/by-air-label.png",
  land: "/assets/language_arts/concept_development/transportation/by-land-label.png",
  water: "/assets/language_arts/concept_development/transportation/by-water-label.png",
};

type Category = "air" | "land" | "water";

type TransportItem = {
  id: string;
  category: Category;
  label: string;
  file: string;
};

type CardState = {
  id: string;
  item: TransportItem;
  x: number;
  y: number;
  homeX: number;
  homeY: number;
};

type Slot = {
  id: string;
  x: number;
  y: number;
  row: number;
  category: Category;
  column: number;
};

type ColumnStatus = {
  category: Category;
  matched: boolean;
};

const slugify = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const parseFile = (file: string): TransportItem | null => {
  const base = file.replace(/___transportation\.png$/i, "");
  const [rawCategory, rawLabel] = base.split("---");
  if (!rawCategory || !rawLabel) return null;
  const category = rawCategory.toLowerCase() as Category;
  if (!["air", "land", "water"].includes(category)) return null;
  const label = rawLabel.replace(/-/g, " ").trim();
  return {
    id: `${category}-${slugify(label)}`,
    category,
    label,
    file,
  };
};

const toImage = (file: string) =>
  `/assets/language_arts/concept_development/transportation/${file}`;

const CHUNK_SIZE = 3;

export default function TransportationGame() {
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
        const response = await fetch(
          "/assets/language_arts/concept_development/transportation/manifest.json"
        );
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

  const transportItems = useMemo(() => {
    if (!availableFiles.length) return [] as TransportItem[];
    return availableFiles
      .filter((file) => file.endsWith("___transportation.png"))
      .map((file) => parseFile(file))
      .filter((item): item is TransportItem => item !== null);
  }, [availableFiles]);

  const rounds = useMemo(() => {
    const grouped: Record<Category, TransportItem[]> = { air: [], land: [], water: [] };
    transportItems.forEach((item) => grouped[item.category].push(item));
    const chunk = (items: TransportItem[]) => {
      const result: TransportItem[][] = [];
      for (let i = 0; i + CHUNK_SIZE <= items.length; i += CHUNK_SIZE) {
        result.push(items.slice(i, i + CHUNK_SIZE));
      }
      return result;
    };
    const airChunks = chunk(grouped.air);
    const landChunks = chunk(grouped.land);
    const waterChunks = chunk(grouped.water);
    const count = Math.min(airChunks.length, landChunks.length, waterChunks.length);
    return Array.from({ length: count }, (_, index) => ({
      air: airChunks[index],
      land: landChunks[index],
      water: waterChunks[index],
    }));
  }, [transportItems]);

  const stageCount = Math.max(1, rounds.length);
  const stage = rounds[stageIndex];

  const sampleItems = useMemo(() => {
    if (!stage) return [] as TransportItem[];
    return [stage.air[0], stage.land[0], stage.water[0]].filter(Boolean) as TransportItem[];
  }, [stage]);

  const draggableItems = useMemo(() => {
    if (!stage) return [] as TransportItem[];
    const items = [
      stage.air[1],
      stage.air[2],
      stage.land[1],
      stage.land[2],
      stage.water[1],
      stage.water[2],
    ].filter(Boolean) as TransportItem[];
    return [...items].sort(() => Math.random() - 0.5);
  }, [stage]);

  useEffect(() => {
    if (!stage) return;
    const nextCards = draggableItems.map((item, index) => {
      const slot = STACK_SLOTS[index] ?? STACK_SLOTS[STACK_SLOTS.length - 1];
      const x = slot.x + SLOT_SIZE / 2;
      const y = slot.y + SLOT_SIZE / 2;
      return {
        id: `card-${stageIndex}-${item.id}`,
        item,
        x,
        y,
        homeX: x,
        homeY: y,
      };
    });
    setCards(nextCards);
    setAssignments({});
    setDragging(null);
  }, [draggableItems, stageIndex, stage]);

  const boardRectRef = useRef<DOMRect | null>(null);
  useEffect(() => {
    const board = boardRef.current;
    if (!board) return;
    const updateRect = () => {
      boardRectRef.current = board.getBoundingClientRect();
    };
    updateRect();
    window.addEventListener("resize", updateRect);
    const observer = new ResizeObserver(() => updateRect());
    observer.observe(board);
    return () => {
      window.removeEventListener("resize", updateRect);
      observer.disconnect();
    };
  }, []);

  const convertPointerToBoard = useCallback((event: PointerEvent) => {
    const rect = boardRectRef.current;
    if (!rect) return null;
    const x = ((event.clientX - rect.left) / rect.width) * BOARD_WIDTH;
    const y = ((event.clientY - rect.top) / rect.height) * BOARD_HEIGHT;
    return { x, y };
  }, []);

  const handleSpeak = useCallback((label: string) => {
    if (typeof window === "undefined") return;
    const utterance = new SpeechSynthesisUtterance(label);
    window.speechSynthesis?.cancel();
    window.speechSynthesis?.speak(utterance);
  }, []);

  const dropSlots: Slot[] = useMemo(
    () =>
      ROWS.filter((row) => row.row !== 1).flatMap((row) =>
        COLUMNS.map((column) => ({
          id: `line${row.row}-box${column.column}`,
          x: column.x,
          y: row.y,
          row: row.row,
          category: column.category as Category,
          column: column.column,
        }))
      ),
    []
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
      const point = convertPointerToBoard(event);
      setDragging(null);
      if (!card || !point) return;

      const candidates = dropSlots
        .filter((slot) => slot.category === card.item.category)
        .map((slot) => ({
          slot,
          centerX: slot.x + SLOT_SIZE / 2,
          centerY: slot.y + SLOT_SIZE / 2,
          dist: Math.hypot(point.x - (slot.x + SLOT_SIZE / 2), point.y - (slot.y + SLOT_SIZE / 2)),
        }))
        .filter(({ slot }) => !assignments[slot.id])
        .sort((a, b) => a.dist - b.dist);

      if (candidates.length && candidates[0].dist <= DROP_THRESHOLD) {
        const target = candidates[0].slot;
        setCards((current) =>
          current.map((item) =>
            item.id === card.id ? { ...item, x: target.x + SLOT_SIZE / 2, y: target.y + SLOT_SIZE / 2 } : item
          )
        );
        setAssignments((prev) => ({ ...prev, [target.id]: card.id }));
        return;
      }

      setCards((current) =>
        current.map((item) =>
          item.id === card.id ? { ...item, x: item.homeX, y: item.homeY } : item
        )
      );
    };

    window.addEventListener("pointermove", handleMove, { passive: false });
    window.addEventListener("pointerup", handleUp, { passive: false });
    return () => {
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerup", handleUp);
    };
  }, [cards, convertPointerToBoard, dragging, dropSlots, assignments]);

  const handlePointerDown = useCallback(
    (event: React.PointerEvent<HTMLDivElement>, card: CardState) => {
      event.preventDefault();
      event.stopPropagation();
      const board = boardRef.current;
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
    [removeAssignment]
  );

  const renderDropSlots = useMemo(
    () =>
      dropSlots.map((slot) => ({
        ...slot,
        left: `${(slot.x / BOARD_WIDTH) * 100}%`,
        top: `${(slot.y / BOARD_HEIGHT) * 100}%`,
        width: `${(SLOT_SIZE / BOARD_WIDTH) * 100}%`,
        height: `${(SLOT_SIZE / BOARD_HEIGHT) * 100}%`,
      })),
    [dropSlots]
  );

  const columnStatuses = useMemo<ColumnStatus[]>(() => {
    return COLUMNS.map((column) => {
      const columnSlots = dropSlots.filter((slot) => slot.category === column.category);
      const matched = columnSlots.every((slot) => Boolean(assignments[slot.id]));
      return { category: column.category, matched };
    });
  }, [assignments, dropSlots]);

  const columnOverlays = useMemo(() => {
    const topRow = ROWS.find((row) => row.row === 1);
    const bottomRow = ROWS.find((row) => row.row === 3);
    if (!topRow || !bottomRow) return [];
    const top = (topRow.y / BOARD_HEIGHT) * 100;
    const height = ((bottomRow.y + SLOT_SIZE - topRow.y) / BOARD_HEIGHT) * 100;
    return columnStatuses
      .filter((status) => status.matched)
      .map((status) => {
        const column = COLUMNS.find((item) => item.category === status.category);
        if (!column) return null;
        const left = (column.x / BOARD_WIDTH) * 100;
        const width = (SLOT_SIZE / BOARD_WIDTH) * 100;
        return { category: status.category, left, top, width, height };
      })
      .filter(Boolean) as { category: Category; left: number; top: number; width: number; height: number }[];
  }, [columnStatuses]);

  const advanceRef = useRef<number | null>(null);
  useEffect(() => {
    if (!columnStatuses.length) return;
    if (!columnStatuses.every((status) => status.matched)) return;
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
  }, [columnStatuses, stageIndex, stageCount]);

  return (
    <div className="relative min-h-screen bg-[radial-gradient(circle_at_top,#f5efe6,#fdfbf8_55%,#f7efe4)]">
      <HomeLink />
      <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-8 px-6 py-10">
        <header className="space-y-3 text-center">
          <p className="text-xs uppercase tracking-[0.35em] text-stone-400">Transportation · Sort & Match</p>
          <h1 className="font-display text-4xl font-semibold text-stone-900">Transportation</h1>
          <p className="text-sm text-stone-600">Sort vehicles by land, air, and water.</p>
        </header>
        <div className="relative mx-auto w-full max-w-[1200px]">
          <div
            ref={boardRef}
            className="relative w-full overflow-visible rounded-3xl border border-stone-200 shadow-[0_25px_60px_-40px_rgba(15,23,42,0.8)]"
            style={{ paddingTop: `${(BOARD_HEIGHT / BOARD_WIDTH) * 100}%` }}
          >
            <img src={BOARD_IMAGE} alt="Transportation board" className="absolute inset-0 h-full w-full object-cover" />

            {LABEL_SLOTS.map((label) => (
              <div
                key={label.id}
                className="absolute"
                style={{
                  left: `${(label.x / BOARD_WIDTH) * 100}%`,
                  top: `${(label.y / BOARD_HEIGHT) * 100}%`,
                  width: `${(SLOT_SIZE / BOARD_WIDTH) * 100}%`,
                  height: `${(LABEL_HEIGHT / BOARD_HEIGHT) * 100}%`,
                }}
              >
                <img src={LABEL_IMAGES[label.category]} alt={label.category} className="h-full w-full object-contain" />
              </div>
            ))}

            {sampleItems.map((item) => {
              const column = COLUMNS.find((col) => col.category === item.category);
              const row = ROWS.find((value) => value.row === 1);
              if (!column || !row) return null;
              return (
                <div
                  key={`sample-${item.id}`}
                  className="absolute"
                  style={{
                    left: `${(column.x / BOARD_WIDTH) * 100}%`,
                    top: `${(row.y / BOARD_HEIGHT) * 100}%`,
                    width: `${(SLOT_SIZE / BOARD_WIDTH) * 100}%`,
                    height: `${(SLOT_SIZE / BOARD_HEIGHT) * 100}%`,
                  }}
                >
                  <img src={toImage(item.file)} alt={item.label} className="h-full w-full object-contain" />
                  <button
                    type="button"
                    onClick={() => handleSpeak(item.label)}
                    aria-label={`Say ${item.label}`}
                    className="absolute right-1.5 bottom-1.5 flex h-7 w-7 items-center justify-center rounded-full bg-white/90 text-xs text-stone-600 shadow shadow-stone-400 transition hover:bg-white sm:right-2 sm:bottom-2 sm:h-8 sm:w-8 sm:text-base"
                  >
                    🔊
                  </button>
                </div>
              );
            })}

            {renderDropSlots.map((slot) => (
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
                <img src={toImage(card.item.file)} alt={card.item.label} className="h-full w-full object-contain" />
                <button
                  type="button"
                  onPointerDown={(event) => event.stopPropagation()}
                  onClick={(event) => {
                    event.stopPropagation();
                    handleSpeak(card.item.label);
                  }}
                  aria-label={`Say ${card.item.label}`}
                  className="absolute right-1.5 bottom-1.5 flex h-7 w-7 items-center justify-center rounded-full bg-white/90 text-xs text-stone-600 shadow shadow-stone-400 transition hover:bg-white sm:right-2 sm:bottom-2 sm:h-8 sm:w-8 sm:text-base"
                >
                  🔊
                </button>
              </div>
            ))}

            {columnOverlays.map((overlay) => (
              <div
                key={`overlay-${overlay.category}`}
                className="pointer-events-none absolute z-20 bg-emerald-500/40"
                style={{
                  left: `${overlay.left}%`,
                  top: `${overlay.top}%`,
                  width: `calc(${overlay.width}% + 2px)`,
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
