"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import HomeLink from "../../../../components/HomeLink";
import { trackLessonEvent } from "../../../../lib/lessonTelemetry";

const BOARD_IMAGE = "/assets/language_arts/concept_development/opposites/matching_board6x6.svg";
const BOARD_WIDTH = 1366;
const BOARD_HEIGHT = 768;
const SLOT_SIZE = 169.3;
const DROP_THRESHOLD = 90;
const STAGE_SIZE = 6;

const SUBJECTS = [
  "butterfly",
  "cheetah",
  "elephant",
  "fawn",
  "giraffe",
  "leopard",
  "rhinoceros",
  "tiger",
  "zebra",
];

const PARTS_TO_WHOLE_PAIRS = SUBJECTS.map((subject) => ({
  subject,
  wholeToPart: `/assets/language_arts/concept_development/parts-to-whole/${subject}-whole-to-part____parts-to-whole.png`,
  partToWhole: `/assets/language_arts/concept_development/parts-to-whole/${subject}-part-to-whole____parts-to-whole.png`,
}));

const LEFT_SLOTS = [
  { id: "pw-1-1", x: 470.41, y: 100.04 },
  { id: "pw-2-1", x: 470.41, y: 291.49 },
  { id: "pw-3-1", x: 470.41, y: 482.94 },
  { id: "pw-4-1", x: 911.77, y: 100.04 },
  { id: "pw-5-1", x: 911.77, y: 291.49 },
  { id: "pw-6-1", x: 911.77, y: 482.94 },
];

const RIGHT_SLOTS = [
  { id: "pw-1-2", x: 657.47, y: 100.04 },
  { id: "pw-2-2", x: 657.47, y: 291.49 },
  { id: "pw-3-2", x: 657.47, y: 482.94 },
  { id: "pw-4-2", x: 1098.84, y: 100.04 },
  { id: "pw-5-2", x: 1098.84, y: 291.49 },
  { id: "pw-6-2", x: 1098.84, y: 482.94 },
];

const STACK_SLOTS = [
  { id: "stack-1", x: 205.76, y: 206.84 },
  { id: "stack-2", x: 174.34, y: 175.42 },
  { id: "stack-3", x: 142.92, y: 144.0 },
  { id: "stack-4", x: 110.15, y: 111.23 },
  { id: "stack-5", x: 81.65, y: 82.73 },
  { id: "stack-6", x: 58.27, y: 59.35 },
];

type PartsToWholePair = (typeof PARTS_TO_WHOLE_PAIRS)[number];

type CardState = {
  id: string;
  subject: string;
  imageSrc: string;
  x: number;
  y: number;
  homeX: number;
  homeY: number;
};

type RowStatus = {
  row: number;
  target: string;
  placed: string | null;
  matched: boolean;
};

export default function PartsToWholeGame() {
  const boardRef = useRef<HTMLDivElement | null>(null);
  const [stageIndex, setStageIndex] = useState(0);
  const [cards, setCards] = useState<CardState[]>([]);
  const [assignments, setAssignments] = useState<Record<string, string>>({});
  const [dragging, setDragging] = useState<{ id: string; offsetX: number; offsetY: number } | null>(null);
  const completedStagesRef = useRef<Record<number, true>>({});
  const lessonCompletedRef = useRef(false);

  const stagePairs = useMemo<PartsToWholePair[]>(() => {
    const start = stageIndex * STAGE_SIZE;
    return PARTS_TO_WHOLE_PAIRS.slice(start, start + STAGE_SIZE);
  }, [stageIndex]);

  const stageCount = Math.ceil(PARTS_TO_WHOLE_PAIRS.length / STAGE_SIZE);

  useEffect(() => {
    trackLessonEvent({
      lesson: "language-arts:concept-development-parts-to-whole",
      activity: `set-${stageIndex + 1}`,
      event: "stage_viewed",
      page: stageIndex + 1,
      totalPages: stageCount,
    });
  }, [stageCount, stageIndex]);

  useEffect(() => {
    const nextCards = stagePairs.map((pair, index) => {
      const slot = STACK_SLOTS[index] ?? STACK_SLOTS[STACK_SLOTS.length - 1];
      const x = slot.x + SLOT_SIZE / 2;
      const y = slot.y + SLOT_SIZE / 2;
      return {
        id: `card-${stageIndex}-${pair.subject}`,
        subject: pair.subject,
        imageSrc: pair.partToWhole,
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

  useEffect(() => {
    if (!dragging) return;
    const handleMove = (event: PointerEvent) => {
      event.preventDefault();
      if (!dragging) return;
      const point = convertPointerToBoard(event);
      if (!point) return;
      setCards((current) =>
        current.map((card) =>
          card.id === dragging.id
            ? { ...card, x: point.x - dragging.offsetX, y: point.y - dragging.offsetY }
            : card
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
      const target = RIGHT_SLOTS.map((slot) => ({
        ...slot,
        centerX: slot.x + SLOT_SIZE / 2,
        centerY: slot.y + SLOT_SIZE / 2,
        dist: Math.hypot(card.x - (slot.x + SLOT_SIZE / 2), card.y - (slot.y + SLOT_SIZE / 2)),
      }))
        .filter((slot) => slot.dist <= DROP_THRESHOLD)
        .sort((a, b) => a.dist - b.dist)[0];

      if (target) {
        const targetIndex = RIGHT_SLOTS.findIndex((slot) => slot.id === target.id);
        const pair = targetIndex >= 0 ? stagePairs[targetIndex] : undefined;
        const isCorrectMatch = Boolean(pair && pair.subject === card.subject);

        setAssignments((prev) => {
          const next = { ...prev };
          const existingCardId = next[target.id];
          if (existingCardId && existingCardId !== card.id) {
            setCards((current) =>
              current.map((item) =>
                item.id === existingCardId ? { ...item, x: item.homeX, y: item.homeY } : item
              )
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

        trackLessonEvent({
          lesson: "language-arts:concept-development-parts-to-whole",
          activity: `set-${stageIndex + 1}`,
          event: "attempt_result",
          success: isCorrectMatch,
          value: card.subject,
          page: stageIndex + 1,
          totalPages: stageCount,
          details: { slot: target.id },
        });
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
  }, [cards, convertPointerToBoard, dragging, removeAssignment, stageCount, stageIndex, stagePairs]);

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

  const leftSlots = useMemo(
    () =>
      LEFT_SLOTS.map((slot) => ({
        ...slot,
        left: `${(slot.x / BOARD_WIDTH) * 100}%`,
        top: `${(slot.y / BOARD_HEIGHT) * 100}%`,
        width: `${(SLOT_SIZE / BOARD_WIDTH) * 100}%`,
        height: `${(SLOT_SIZE / BOARD_HEIGHT) * 100}%`,
      })),
    []
  );

  const rightSlots = useMemo(
    () =>
      RIGHT_SLOTS.map((slot) => ({
        ...slot,
        left: `${(slot.x / BOARD_WIDTH) * 100}%`,
        top: `${(slot.y / BOARD_HEIGHT) * 100}%`,
        width: `${(SLOT_SIZE / BOARD_WIDTH) * 100}%`,
        height: `${(SLOT_SIZE / BOARD_HEIGHT) * 100}%`,
      })),
    []
  );

  const rowStatuses = useMemo<RowStatus[]>(() => {
    return stagePairs.map((pair, index) => {
      const rightSlot = RIGHT_SLOTS[index];
      if (!rightSlot) {
        return { row: index + 1, target: pair.subject, placed: null, matched: false };
      }
      const cardId = assignments[rightSlot.id];
      const card = cards.find((item) => item.id === cardId);
      const placed = card?.subject ?? null;
      const matched = placed === pair.subject;
      return { row: index + 1, target: pair.subject, placed, matched };
    });
  }, [assignments, cards, stagePairs]);

  const rowOverlays = useMemo(() => {
    return rowStatuses
      .filter((status) => status.matched)
      .map((status) => {
        const index = status.row - 1;
        const leftSlot = LEFT_SLOTS[index];
        const rightSlot = RIGHT_SLOTS[index];
        if (!leftSlot || !rightSlot) return null;
        const left = (leftSlot.x / BOARD_WIDTH) * 100;
        const top = (leftSlot.y / BOARD_HEIGHT) * 100;
        const height = (SLOT_SIZE / BOARD_HEIGHT) * 100;
        const endX = rightSlot.x + SLOT_SIZE;
        const width = ((endX - leftSlot.x) / BOARD_WIDTH) * 100;
        return { row: status.row, left, top, width, height };
      })
      .filter(Boolean) as { row: number; left: number; top: number; width: number; height: number }[];
  }, [rowStatuses]);

  useEffect(() => {
    if (!rowStatuses.length) return;
    if (!rowStatuses.every((status) => status.matched)) return;
    const stageNumber = stageIndex + 1;

    if (!completedStagesRef.current[stageNumber]) {
      completedStagesRef.current[stageNumber] = true;
      trackLessonEvent({
        lesson: "language-arts:concept-development-parts-to-whole",
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
        lesson: "language-arts:concept-development-parts-to-whole",
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
          <p className="text-xs uppercase tracking-[0.35em] text-stone-400">Parts to Whole · Drag & Drop</p>
          <h1 className="font-display text-4xl font-semibold text-stone-900">Parts to Whole</h1>
          <p className="text-sm text-stone-600">Match each part image to the matching whole.</p>
        </header>
        <div className="relative mx-auto w-full max-w-[1200px]">
          <div
            ref={boardRef}
            className="relative w-full overflow-visible rounded-3xl border border-stone-200 shadow-[0_25px_60px_-40px_rgba(15,23,42,0.8)]"
            style={{ paddingTop: `${(BOARD_HEIGHT / BOARD_WIDTH) * 100}%` }}
          >
            <img src={BOARD_IMAGE} alt="Parts to whole board" className="absolute inset-0 h-full w-full object-cover" />

            {stagePairs.map((pair, index) => {
              const slot = leftSlots[index];
              if (!slot) return null;
              return (
                <div
                  key={`${pair.subject}-${slot.id}`}
                  className="absolute"
                  style={{ left: slot.left, top: slot.top, width: slot.width, height: slot.height }}
                >
                  <img
                    src={pair.wholeToPart}
                    alt={`${pair.subject} whole to part`}
                    className="h-full w-full object-contain"
                  />
                </div>
              );
            })}

            {rightSlots.map((slot) => (
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
                <img
                  src={card.imageSrc}
                  alt={`${card.subject} part to whole`}
                  className="h-full w-full object-contain"
                />
              </div>
            ))}

            {rowOverlays.map((overlay) => (
              <div
                key={`overlay-${overlay.row}`}
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
