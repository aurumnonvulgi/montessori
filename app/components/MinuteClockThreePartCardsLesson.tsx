"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import HomeLink from "./HomeLink";
import { primeSpeechVoices, speakWithPreferredVoice } from "../lib/speech";
import {
  MINUTE_CHUNKS,
  getMinuteChunkBySlug,
  getMinutePairsForChunk,
  type MinuteClockPair,
} from "../lib/minuteClockCards";

const BOARD_IMAGE = "/assets/language_arts/moveable_alphabet/tcp-pic-pic.svg";
const BOARD_WIDTH = 1366;
const BOARD_HEIGHT = 768;
const DROP_THRESHOLD = 90;
const STAGE_SIZE = 3;

const CARD_SLOTS = [
  { id: "line1-box1", x: 544.51, y: 21.06, width: 181.34, height: 229.91 },
  { id: "line1-box2", x: 544.51, y: 268.11, width: 181.34, height: 229.91 },
  { id: "line1-box3", x: 544.51, y: 516.16, width: 181.34, height: 229.91 },
];

const ANSWER_SLOTS = [
  { id: "answer-1", x: 737.7, y: 21.06, width: 180, height: 180 },
  { id: "answer-2", x: 737.7, y: 274.67, width: 180, height: 180 },
  { id: "answer-3", x: 737.7, y: 515.16, width: 180, height: 180 },
];

const STACK_SLOTS = [
  { id: "stack-1", x: 177.44, y: 59.62, width: 181.34, height: 180 },
  { id: "stack-2", x: 189.88, y: 69.72, width: 181.34, height: 180 },
  { id: "stack-3", x: 201.48, y: 78.88, width: 181.34, height: 180 },
];

type CardState = {
  id: string;
  pairId: string;
  x: number;
  y: number;
  homeX: number;
  homeY: number;
};

const shuffleArray = <T,>(values: T[]) => {
  const next = [...values];
  for (let index = next.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [next[index], next[swapIndex]] = [next[swapIndex], next[index]];
  }
  return next;
};

type MinuteClockThreePartCardsLessonProps = {
  chunkSlug: string;
};

export default function MinuteClockThreePartCardsLesson({
  chunkSlug,
}: MinuteClockThreePartCardsLessonProps) {
  const boardRef = useRef<HTMLDivElement | null>(null);
  const [stageIndex, setStageIndex] = useState(0);
  const [stagePairs, setStagePairs] = useState<MinuteClockPair[]>([]);
  const [cards, setCards] = useState<CardState[]>([]);
  const [assignments, setAssignments] = useState<Record<string, string>>({});
  const [dragging, setDragging] = useState<{ id: string; offsetX: number; offsetY: number } | null>(null);
  const selectedChunk = useMemo(
    () => getMinuteChunkBySlug(chunkSlug) ?? MINUTE_CHUNKS[0],
    [chunkSlug]
  );
  const chunkPairs = useMemo(() => getMinutePairsForChunk(selectedChunk), [selectedChunk]);

  useEffect(() => {
    primeSpeechVoices();
  }, []);

  useEffect(() => {
    setStageIndex(0);
  }, [selectedChunk.slug]);

  const stageCount = Math.ceil(chunkPairs.length / STAGE_SIZE);
  const stageBasePairs = useMemo(() => {
    const start = stageIndex * STAGE_SIZE;
    return chunkPairs.slice(start, start + STAGE_SIZE);
  }, [chunkPairs, stageIndex]);

  useEffect(() => {
    setStagePairs(stageBasePairs);
  }, [stageBasePairs]);

  useEffect(() => {
    const shuffled = shuffleArray(stagePairs);
    const nextCards = shuffled.map((pair, index) => {
      const slot = STACK_SLOTS[index] ?? STACK_SLOTS[STACK_SLOTS.length - 1];
      const x = slot.x + slot.width / 2;
      const y = slot.y + slot.height / 2;
      return {
        id: `clock-${stageIndex}-${pair.id}`,
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
  }, [stageIndex, stagePairs]);

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

  const handleSpeak = useCallback((label: string) => {
    speakWithPreferredVoice(label, { rate: 0.9, pitch: 0.95, volume: 0.9, lang: "en-US" });
  }, []);

  useEffect(() => {
    if (!dragging) return;
    const handleMove = (event: PointerEvent) => {
      event.preventDefault();
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
      const card = cards.find((item) => item.id === dragging.id);
      const point = convertPointerToBoard(event);
      setDragging(null);
      if (!card || !point) return;

      const candidates = ANSWER_SLOTS.map((slot) => ({
        slot,
        dist: Math.hypot(
          point.x - (slot.x + slot.width / 2),
          point.y - (slot.y + slot.height / 2)
        ),
      }))
        .filter(({ slot }) => !assignments[slot.id])
        .sort((a, b) => a.dist - b.dist);

      if (candidates.length && candidates[0].dist <= DROP_THRESHOLD) {
        const target = candidates[0].slot;
        setCards((current) =>
          current.map((item) =>
            item.id === card.id
              ? { ...item, x: target.x + target.width / 2, y: target.y + target.height / 2 }
              : item
          )
        );
        setAssignments((prev) => ({ ...prev, [target.id]: card.id }));
        return;
      }

      setCards((current) =>
        current.map((item) => (item.id === card.id ? { ...item, x: item.homeX, y: item.homeY } : item))
      );
    };

    window.addEventListener("pointermove", handleMove, { passive: false });
    window.addEventListener("pointerup", handleUp, { passive: false });
    return () => {
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerup", handleUp);
    };
  }, [assignments, cards, convertPointerToBoard, dragging]);

  const handlePointerDown = useCallback(
    (event: React.PointerEvent<HTMLDivElement>, card: CardState) => {
      event.preventDefault();
      event.stopPropagation();
      const board = boardRef.current;
      if (!board) return;
      boardRectRef.current = board.getBoundingClientRect();
      event.currentTarget.setPointerCapture?.(event.pointerId);
      const rect = boardRectRef.current;
      if (!rect) return;
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

  const assignedMatches = useMemo(() => {
    return ANSWER_SLOTS.map((slot, index) => {
      const assignedCardId = assignments[slot.id];
      const pair = stagePairs[index];
      const card = cards.find((item) => item.id === assignedCardId);
      const matched = Boolean(pair && card && card.pairId === pair.id);
      return { slot, matched, pair };
    });
  }, [assignments, cards, stagePairs]);

  const spokenMatchesRef = useRef<Set<string>>(new Set());
  useEffect(() => {
    spokenMatchesRef.current = new Set();
  }, [stageIndex]);

  useEffect(() => {
    assignedMatches.forEach((item) => {
      if (!item.matched || !item.pair) return;
      if (spokenMatchesRef.current.has(item.pair.id)) return;
      spokenMatchesRef.current.add(item.pair.id);
      handleSpeak(item.pair.speechLabel);
    });
  }, [assignedMatches, handleSpeak]);

  const allMatched = useMemo(
    () => assignedMatches.length > 0 && assignedMatches.every((item) => item.matched),
    [assignedMatches]
  );

  const advanceRef = useRef<number | null>(null);
  useEffect(() => {
    if (!allMatched || stageIndex >= stageCount - 1) return;
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
  }, [allMatched, stageCount, stageIndex]);

  return (
    <div className="relative min-h-screen bg-[radial-gradient(circle_at_top,#f5efe6,#fdfbf8_55%,#f7efe4)]">
      <HomeLink />
      <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-8 px-6 py-10">
        <header className="space-y-3 text-center">
          <p className="text-xs uppercase tracking-[0.35em] text-stone-400">
            History &amp; Time · Minute Clock Three-Part Cards Pictures
          </p>
          <h1 className="font-display text-4xl font-semibold text-stone-900">
            Minute Clock Three-Part Cards Pictures
          </h1>
          <p className="text-sm text-stone-600">
            {selectedChunk.label} • Drag each clock picture to the matching minute card.
          </p>
        </header>

        <div className="relative mx-auto w-full max-w-[1200px]">
          <div
            ref={boardRef}
            className="relative w-full overflow-visible rounded-3xl border border-stone-200 shadow-[0_25px_60px_-40px_rgba(15,23,42,0.8)]"
            style={{ paddingTop: `${(BOARD_HEIGHT / BOARD_WIDTH) * 100}%` }}
          >
            <img src={BOARD_IMAGE} alt="Three-part cards board" className="absolute inset-0 h-full w-full object-cover" />

            {stagePairs.map((pair, index) => {
              const slot = CARD_SLOTS[index];
              if (!slot) return null;
              return (
                <div
                  key={`${pair.id}-${slot.id}`}
                  className="absolute"
                  style={{
                    left: `${(slot.x / BOARD_WIDTH) * 100}%`,
                    top: `${(slot.y / BOARD_HEIGHT) * 100}%`,
                    width: `${(slot.width / BOARD_WIDTH) * 100}%`,
                    height: `${(slot.height / BOARD_HEIGHT) * 100}%`,
                  }}
                >
                  <div className="flex h-full w-full flex-col overflow-hidden rounded-md border border-stone-300 bg-white/95">
                    <div className="h-[78%] px-1 py-1">
                      <img src={pair.pictureImage} alt={pair.label} className="h-full w-full object-contain" />
                    </div>
                    <div className="h-[22%] border-t border-stone-200 bg-white px-1 py-0.5">
                      <img src={pair.labelImage} alt={`${pair.label} label`} className="h-full w-full object-contain" />
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleSpeak(pair.speechLabel)}
                    aria-label={`Say ${pair.label}`}
                    className="absolute right-0 bottom-0 z-20 flex h-4 w-4 translate-x-1/2 translate-y-1/2 items-center justify-center rounded-full border border-stone-200 bg-white/95 text-[9px] leading-none text-stone-600 shadow shadow-stone-300 transition hover:bg-white"
                  >
                    🔊
                  </button>
                </div>
              );
            })}

            {ANSWER_SLOTS.map((slot) => (
              <div
                key={slot.id}
                className="pointer-events-none absolute"
                style={{
                  left: `${(slot.x / BOARD_WIDTH) * 100}%`,
                  top: `${(slot.y / BOARD_HEIGHT) * 100}%`,
                  width: `${(slot.width / BOARD_WIDTH) * 100}%`,
                  height: `${(slot.height / BOARD_HEIGHT) * 100}%`,
                }}
              />
            ))}

            {cards.map((card) => {
              const pair = stagePairs.find((item) => item.id === card.pairId);
              if (!pair) return null;
              return (
                <div
                  key={card.id}
                  onPointerDown={(event) => handlePointerDown(event, card)}
                  className="pointer-events-auto absolute z-10 -translate-x-1/2 -translate-y-1/2 rounded-none border-none bg-transparent shadow-none"
                  style={{
                    left: `${(card.x / BOARD_WIDTH) * 100}%`,
                    top: `${(card.y / BOARD_HEIGHT) * 100}%`,
                    width: `${((STACK_SLOTS[0]?.width ?? 180) / BOARD_WIDTH) * 100}%`,
                    height: `${((STACK_SLOTS[0]?.height ?? 180) / BOARD_HEIGHT) * 100}%`,
                    touchAction: "none",
                  }}
                >
                  <div className="h-full w-full rounded-md bg-white/90 p-1 shadow-[0_8px_18px_-14px_rgba(0,0,0,0.8)] sm:p-1.5">
                    <img src={pair.pictureImage} alt={pair.label} className="h-full w-full object-contain" />
                    <button
                      type="button"
                      onPointerDown={(event) => event.stopPropagation()}
                      onClick={(event) => {
                        event.stopPropagation();
                        handleSpeak(pair.speechLabel);
                      }}
                      aria-label={`Say ${pair.label}`}
                      className="absolute right-0 bottom-0 z-20 flex h-4 w-4 translate-x-1/2 translate-y-1/2 items-center justify-center rounded-full border border-stone-200 bg-white/95 text-[9px] leading-none text-stone-600 shadow shadow-stone-300 transition hover:bg-white"
                    >
                      🔊
                    </button>
                  </div>
                </div>
              );
            })}

            {assignedMatches.map((item, index) => {
              if (!item.matched) return null;
              const cardSlot = CARD_SLOTS[index];
              if (!cardSlot) return null;
              return (
                <div key={`match-${item.slot.id}`}>
                  <div
                    className="pointer-events-none absolute z-20 bg-emerald-500/35"
                    style={{
                      left: `${(cardSlot.x / BOARD_WIDTH) * 100}%`,
                      top: `${(cardSlot.y / BOARD_HEIGHT) * 100}%`,
                      width: `${(cardSlot.width / BOARD_WIDTH) * 100}%`,
                      height: `${(cardSlot.height / BOARD_HEIGHT) * 100}%`,
                    }}
                  />
                  <div
                    className="pointer-events-none absolute z-20 bg-emerald-500/35"
                    style={{
                      left: `${(item.slot.x / BOARD_WIDTH) * 100}%`,
                      top: `${(item.slot.y / BOARD_HEIGHT) * 100}%`,
                      width: `${(item.slot.width / BOARD_WIDTH) * 100}%`,
                      height: `${(item.slot.height / BOARD_HEIGHT) * 100}%`,
                    }}
                  />
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="text-xs uppercase tracking-[0.35em] text-stone-400">
            Page {stageIndex + 1} of {stageCount}
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
