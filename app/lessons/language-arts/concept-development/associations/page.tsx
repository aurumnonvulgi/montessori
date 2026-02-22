"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import HomeLink from "../../../../components/HomeLink";
import MaterialTeachersGuide from "../../../../components/MaterialTeachersGuide";
import { CONCEPT_ASSOCIATIONS_TEACHERS_GUIDE } from "../../../../data/languageArtsTeachersGuides";
import { trackLessonEvent } from "../../../../lib/lessonTelemetry";
import { primeSpeechVoices, speakWithPreferredVoice } from "../../../../lib/speech";

const BOARD_IMAGE = "/assets/language_arts/concept_development/association/Images/9matchingwith6deck.svg";
const BOARD_WIDTH = 1366;
const BOARD_HEIGHT = 768;
const SLOT_SIZE = 169.3;
const DROP_THRESHOLD = 90;

const ASSOCIATION_FALLBACK_GROUPS = [
  "art",
  "bath",
  "bed",
  "build",
  "clean",
  "dental",
  "door",
  "eating",
  "fridge",
  "kitchen",
  "library",
  "rain",
  "school",
  "shoes",
  "soccer",
  "tech",
  "tools",
  "water",
];
const ASSOCIATION_FALLBACK_FILES = ASSOCIATION_FALLBACK_GROUPS.flatMap((group) =>
  [1, 2, 3].map((index) => `${group}-${index}____association.png`)
);

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

const toImage = (file: string) =>
  `/assets/language_arts/concept_development/association/${file}`;

type AssociationItem = {
  id: string;
  group: string;
  index: number;
  file: string;
  speechLabel: string;
};

type AssociationSet = {
  id: string;
  group: string;
  items: [AssociationItem, AssociationItem, AssociationItem];
};

const parseAssociationFile = (file: string): AssociationItem | null => {
  const match = file.match(/^(.+)-([1-3])____association\.png$/i);
  if (!match) return null;
  const group = match[1].toLowerCase();
  const index = Number(match[2]);
  const speechLabel = `${group.replace(/-/g, " ")} ${index}`;
  return {
    id: `${group}-${index}`,
    group,
    index,
    file,
    speechLabel,
  };
};

const buildAssociationSets = (files: string[]): AssociationSet[] => {
  const grouped = new Map<string, AssociationItem[]>();
  files.forEach((file) => {
    const parsed = parseAssociationFile(file);
    if (!parsed) return;
    const bucket = grouped.get(parsed.group) ?? [];
    bucket.push(parsed);
    grouped.set(parsed.group, bucket);
  });

  return Array.from(grouped.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .flatMap(([group, items]) => {
      const sorted = [...items].sort((a, b) => a.index - b.index);
      if (sorted.length < 3) return [];
      if (sorted[0]?.index !== 1 || sorted[1]?.index !== 2 || sorted[2]?.index !== 3) return [];
      return [{ id: group, group, items: [sorted[0], sorted[1], sorted[2]] as [AssociationItem, AssociationItem, AssociationItem] }];
    });
};

type CardState = {
  id: string;
  item: AssociationItem;
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
  targetLabels: string[];
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
  const [availableFiles, setAvailableFiles] = useState<string[]>(ASSOCIATION_FALLBACK_FILES);
  const completedStagesRef = useRef<Record<number, true>>({});
  const lessonCompletedRef = useRef(false);
  const matchedRowsRef = useRef<Record<number, boolean>>({});

  useEffect(() => {
    primeSpeechVoices();
  }, []);

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
        setAvailableFiles(
          files.filter(
            (file: unknown): file is string =>
              typeof file === "string" && file.endsWith("____association.png")
          )
        );
      } catch {
        // ignore manifest load failures
      }
    };
    loadManifest();
    return () => {
      active = false;
    };
  }, []);

  const availableSets = useMemo(() => buildAssociationSets(availableFiles), [availableFiles]);

  const stageSets = useMemo(() => {
    const start = stageIndex * STAGE_SIZE;
    return availableSets.slice(start, start + STAGE_SIZE);
  }, [availableSets, stageIndex]);

  const stageCount = Math.max(1, Math.ceil(availableSets.length / STAGE_SIZE));

  useEffect(() => {
    trackLessonEvent({
      lesson: "language-arts:concept-development-associations",
      activity: `set-${stageIndex + 1}`,
      event: "stage_viewed",
      page: stageIndex + 1,
      totalPages: stageCount,
    });
  }, [stageCount, stageIndex]);

  useEffect(() => {
    const restItems = stageSets.flatMap((set) => set.items.slice(1));
    const shuffled = [...restItems].sort(() => Math.random() - 0.5);
    const nextCards = shuffled.map((item, index) => {
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
  }, [stageSets, stageIndex]);

  useEffect(() => {
    matchedRowsRef.current = {};
  }, [stageIndex]);

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
      const targets = set.items.slice(1).map((item) => item.id);
      const targetLabels = set.items.slice(1).map((item) => item.speechLabel);
      const slotIds = [`line${line}-box2`, `line${line}-box3`];
      const placed = slotIds
        .map((slotId) => {
          const cardId = assignments[slotId];
          const card = cards.find((item) => item.id === cardId);
          return card?.item.id;
        })
        .filter((word): word is string => Boolean(word));
      const matched =
        placed.length === 2 &&
        targets.every((target) => placed.includes(target)) &&
        placed.every((item) => targets.includes(item));
      return { line, targets, targetLabels, placed, matched };
    });
  }, [assignments, cards, stageSets]);

  useEffect(() => {
    const nextMatched: Record<number, boolean> = {};
    rowStatuses.forEach((status) => {
      nextMatched[status.line] = status.matched;
      if (!status.matched) return;
      if (matchedRowsRef.current[status.line]) return;
      const phrase = `Correct match. ${status.targetLabels.join(" and ")}.`;
      speakWithPreferredVoice(phrase, {
        rate: 0.9,
        pitch: 0.95,
        volume: 0.9,
        lang: "en-US",
        interrupt: false,
      });
    });
    matchedRowsRef.current = nextMatched;
  }, [rowStatuses]);

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

  useEffect(() => {
    if (!rowStatuses.length) return;
    if (!rowStatuses.every((status) => status.matched)) return;
    const stageNumber = stageIndex + 1;

    if (!completedStagesRef.current[stageNumber]) {
      completedStagesRef.current[stageNumber] = true;
      trackLessonEvent({
        lesson: "language-arts:concept-development-associations",
        activity: `set-${stageNumber}`,
        event: "stage_completed",
        success: true,
        page: stageNumber,
        totalPages: stageCount,
      });
    }

    if (stageNumber === stageCount && !lessonCompletedRef.current) {
      lessonCompletedRef.current = true;
      trackLessonEvent({
        lesson: "language-arts:concept-development-associations",
        event: "lesson_completed",
        success: true,
        page: stageNumber,
        totalPages: stageCount,
      });
    }
  }, [rowStatuses, stageCount, stageIndex]);

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
              const fixedItem = set.items[0];
              return (
                <div
                  key={`${fixedItem.id}-${slot.id}`}
                  className="absolute"
                  style={{ left: slot.left, top: slot.top, width: slot.width, height: slot.height }}
                >
                  <img src={toImage(fixedItem.file)} alt={fixedItem.speechLabel} className="h-full w-full object-contain" />
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
                <img src={toImage(card.item.file)} alt={card.item.speechLabel} className="h-full w-full object-contain" />
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
        <MaterialTeachersGuide guide={CONCEPT_ASSOCIATIONS_TEACHERS_GUIDE} />
      </main>
    </div>
  );
}
