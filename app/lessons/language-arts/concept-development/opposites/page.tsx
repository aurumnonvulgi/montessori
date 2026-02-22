"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import HomeLink from "../../../../components/HomeLink";
import MaterialTeachersGuide from "../../../../components/MaterialTeachersGuide";
import { CONCEPT_OPPOSITES_TEACHERS_GUIDE } from "../../../../data/languageArtsTeachersGuides";
import { trackLessonEvent } from "../../../../lib/lessonTelemetry";
import { primeSpeechVoices, speakWithPreferredVoice } from "../../../../lib/speech";
import { getVoiceEnabled, getVoiceVolume } from "../../../../lib/voicePreferences";

const BOARD_IMAGE = "/assets/language_arts/concept_development/opposites/matching_board6x6.svg";
const BOARD_WIDTH = 1366;
const BOARD_HEIGHT = 768;
const SLOT_SIZE = 169.3;
const DROP_THRESHOLD = 90;

const OPPOSITE_PAIRS = [
  { left: "big", right: "small" },
  { left: "hot", right: "cold" },
  { left: "full", right: "empty" },
  { left: "clean", right: "dirty" },
  { left: "open", right: "closed" },
  { left: "fast", right: "slow" },
  { left: "heavy", right: "light" },
  { left: "tall", right: "short" },
  { left: "happy", right: "sad" },
  { left: "wet", right: "dry" },
  { left: "day", right: "night" },
  { left: "up", right: "down" },
  { left: "in", right: "out" },
  { left: "soft", right: "hard" },
  { left: "rough", right: "smooth" },
  { left: "left", right: "right" },
  { left: "new", right: "old" },
  { left: "same", right: "different" },
];

const STAGE_SIZE = 6;

const LEFT_SLOTS = [
  { id: "op-1-1", x: 470.41, y: 100.04 },
  { id: "op-2-1", x: 470.41, y: 291.49 },
  { id: "op-3-1", x: 470.41, y: 482.94 },
  { id: "op-4-1", x: 911.77, y: 100.04 },
  { id: "op-5-1", x: 911.77, y: 291.49 },
  { id: "op-6-1", x: 911.77, y: 482.94 },
];

const RIGHT_SLOTS = [
  { id: "op-1-2", x: 657.47, y: 100.04 },
  { id: "op-2-2", x: 657.47, y: 291.49 },
  { id: "op-3-2", x: 657.47, y: 482.94 },
  { id: "op-4-2", x: 1098.84, y: 100.04 },
  { id: "op-5-2", x: 1098.84, y: 291.49 },
  { id: "op-6-2", x: 1098.84, y: 482.94 },
];

const STACK_SLOTS = [
  { id: "stack-1", x: 205.76, y: 206.84 },
  { id: "stack-2", x: 174.34, y: 175.42 },
  { id: "stack-3", x: 142.92, y: 144.0 },
  { id: "stack-4", x: 110.15, y: 111.23 },
  { id: "stack-5", x: 81.65, y: 82.73 },
  { id: "stack-6", x: 58.27, y: 59.35 },
];

type OppositePair = {
  left: string;
  right: string;
};

type CardState = {
  id: string;
  word: string;
  opposite: string;
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

const toPairImage = (first: string, second: string) =>
  `/assets/language_arts/concept_development/opposites/opposites_images/${first}-${second}____phonic_books.png`;
const toConfirmationAudio = (first: string, second: string) =>
  `/assets/language_arts/concept_development/opposites/opposites_audios/${first}-${second}-confirmation____phonic_books.m4a`;

export default function OppositesGame() {
  const boardRef = useRef<HTMLDivElement | null>(null);
  const confirmationAudioRef = useRef<HTMLAudioElement | null>(null);
  const [stageIndex, setStageIndex] = useState(0);
  const [cards, setCards] = useState<CardState[]>([]);
  const [assignments, setAssignments] = useState<Record<string, string>>({});
  const [dragging, setDragging] = useState<{ id: string; offsetX: number; offsetY: number } | null>(null);
  const completedStagesRef = useRef<Record<number, true>>({});
  const lessonCompletedRef = useRef(false);

  const stagePairs = useMemo<OppositePair[]>(() => {
    const start = stageIndex * STAGE_SIZE;
    return OPPOSITE_PAIRS.slice(start, start + STAGE_SIZE);
  }, [stageIndex]);

  const stageCount = Math.ceil(OPPOSITE_PAIRS.length / STAGE_SIZE);

  useEffect(() => {
    trackLessonEvent({
      lesson: "language-arts:concept-development-opposites",
      activity: `set-${stageIndex + 1}`,
      event: "stage_viewed",
      page: stageIndex + 1,
      totalPages: stageCount,
    });
  }, [stageCount, stageIndex]);

  useEffect(() => {
    primeSpeechVoices();
  }, []);

  useEffect(() => {
    const nextCards = stagePairs.map((pair, index) => {
      const slot = STACK_SLOTS[index] ?? STACK_SLOTS[STACK_SLOTS.length - 1];
      const x = slot.x + SLOT_SIZE / 2;
      const y = slot.y + SLOT_SIZE / 2;
      return {
        id: `card-${stageIndex}-${pair.right}`,
        word: pair.right,
        opposite: pair.left,
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

  const stopCurrentAudio = useCallback(() => {
    if (!confirmationAudioRef.current) return;
    confirmationAudioRef.current.pause();
    confirmationAudioRef.current.currentTime = 0;
  }, []);

  const playAudio = useCallback((src: string, onFail?: () => void) => {
    if (typeof window === "undefined") return;
    if (!getVoiceEnabled()) return;
    const masterVoiceVolume = getVoiceVolume();
    if (masterVoiceVolume <= 0) return;
    stopCurrentAudio();
    const audio = new Audio(src);
    audio.preload = "auto";
    audio.volume = Math.max(0, Math.min(1, masterVoiceVolume));
    confirmationAudioRef.current = audio;
    void audio.play().catch(() => {
      onFail?.();
    });
  }, [stopCurrentAudio]);

  const playConfirmationAudio = useCallback((first: string, second: string) => {
    playAudio(
      toConfirmationAudio(first, second),
      () => {
        speakWithPreferredVoice(`Correct. ${first} is the opposite of ${second}.`, {
          rate: 0.9,
          pitch: 0.95,
          volume: 0.95,
          lang: "en-US",
        });
      }
    );
  }, [playAudio]);

  const handleSpeak = useCallback((text: string, opposite: string) => {
    if (typeof window === "undefined") return;
    stopCurrentAudio();
    const synth = window.speechSynthesis;
    speakWithPreferredVoice(text, { rate: 0.9, pitch: 0.95, volume: 0.95, lang: "en-US" });

    window.setTimeout(() => {
      if (!synth.speaking && !synth.pending) {
        playConfirmationAudio(text, opposite);
      }
    }, 220);
  }, [playConfirmationAudio, stopCurrentAudio]);

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
        const isCorrectMatch = Boolean(pair && pair.right === card.word);

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

        if (isCorrectMatch && pair) {
          playConfirmationAudio(pair.left, pair.right);
        }
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
  }, [cards, convertPointerToBoard, dragging, playConfirmationAudio, removeAssignment, stagePairs]);

  useEffect(() => {
    return () => {
      if (confirmationAudioRef.current) {
        confirmationAudioRef.current.pause();
        confirmationAudioRef.current = null;
      }
    };
  }, []);

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
        return { row: index + 1, target: pair.right, placed: null, matched: false };
      }
      const cardId = assignments[rightSlot.id];
      const card = cards.find((item) => item.id === cardId);
      const placed = card?.word ?? null;
      const matched = placed === pair.right;
      return { row: index + 1, target: pair.right, placed, matched };
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
        lesson: "language-arts:concept-development-opposites",
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
        lesson: "language-arts:concept-development-opposites",
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
          <p className="text-xs uppercase tracking-[0.35em] text-stone-400">Opposites · Drag & Drop</p>
          <h1 className="font-display text-4xl font-semibold text-stone-900">Opposites</h1>
          <p className="text-sm text-stone-600">Match each picture to its opposite.</p>
        </header>
        <div className="relative mx-auto w-full max-w-[1200px]">
          <div
            ref={boardRef}
            className="relative w-full overflow-visible rounded-3xl border border-stone-200 shadow-[0_25px_60px_-40px_rgba(15,23,42,0.8)]"
            style={{ paddingTop: `${(BOARD_HEIGHT / BOARD_WIDTH) * 100}%` }}
          >
            <img src={BOARD_IMAGE} alt="Opposites board" className="absolute inset-0 h-full w-full object-cover" />

            {stagePairs.map((pair, index) => {
              const slot = leftSlots[index];
              if (!slot) return null;
              return (
                <div
                  key={`${pair.left}-${slot.id}`}
                  className="absolute"
                  style={{ left: slot.left, top: slot.top, width: slot.width, height: slot.height }}
                >
                  <img
                    src={toPairImage(pair.left, pair.right)}
                    alt={`${pair.left} and ${pair.right}`}
                    className="h-full w-full object-contain"
                  />
                  <button
                    type="button"
                    onPointerDown={(event) => {
                      event.stopPropagation();
                    }}
                    onClick={(event) => {
                      event.stopPropagation();
                      handleSpeak(pair.left, pair.right);
                    }}
                    aria-label={`Say ${pair.left}`}
                    className="absolute right-1.5 bottom-1.5 flex h-7 w-7 items-center justify-center rounded-full bg-white/90 text-xs text-stone-600 shadow shadow-stone-400 transition hover:bg-white sm:right-2 sm:bottom-2 sm:h-8 sm:w-8 sm:text-base"
                  >
                    🔊
                  </button>
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
                  src={toPairImage(card.word, card.opposite)}
                  alt={`${card.word} and ${card.opposite}`}
                  className="h-full w-full object-contain"
                />
                <button
                  type="button"
                  onPointerDown={(event) => {
                    event.stopPropagation();
                  }}
                  onClick={(event) => {
                    event.stopPropagation();
                    handleSpeak(card.word, card.opposite);
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
        <MaterialTeachersGuide guide={CONCEPT_OPPOSITES_TEACHERS_GUIDE} />
      </main>
    </div>
  );
}
