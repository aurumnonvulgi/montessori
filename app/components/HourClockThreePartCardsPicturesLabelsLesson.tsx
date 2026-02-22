"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import HomeLink from "./HomeLink";
import { primeSpeechVoices, speakWithPreferredVoice } from "../lib/speech";

const BOARD_IMAGE = "/assets/language_arts/moveable_alphabet/tcp-pic-label.svg";
const BOARD_WIDTH = 1366;
const BOARD_HEIGHT = 768;
const DROP_THRESHOLD = 90;
const STAGE_SIZE = 3;

const CARD_SLOTS = [
  { id: "line1-box1", x: 513.31, y: 21.06, width: 165.92, height: 210.37 },
  { id: "line1-box2", x: 513.31, y: 260.5, width: 165.92, height: 210.37 },
  { id: "line1-box3", x: 513.31, y: 513.27, width: 165.92, height: 210.37 },
];

const PICTURE_ANSWER_SLOTS = [
  { id: "answer-1", x: 690.08, y: 21.06, width: 164.7, height: 164.7 },
  { id: "answer-2", x: 690.08, y: 266.5, width: 164.7, height: 164.7 },
  { id: "answer-3", x: 690.08, y: 512.36, width: 164.7, height: 164.7 },
];

const LABEL_ANSWER_SLOTS = [
  { id: "label-answer-1", x: 690.08, y: 192.45, width: 164.7, height: 64.05 },
  { id: "label-answer-2", x: 690.08, y: 439.76, width: 164.7, height: 64.05 },
  { id: "label-answer-3", x: 690.08, y: 685.61, width: 164.7, height: 64.05 },
];

const PICTURE_STACK_SLOTS = [
  { id: "stack-1", x: 94.87, y: 56.35, width: 165.92, height: 164.7 },
  { id: "stack-2", x: 106.25, y: 65.58, width: 165.92, height: 164.7 },
  { id: "stack-3", x: 116.86, y: 73.96, width: 165.92, height: 164.7 },
];

const LABEL_STACK_SLOTS = [
  { id: "label-stack-1", x: 83.49, y: 277.51, width: 164.7, height: 64.05 },
  { id: "label-stack-2", x: 95.48, y: 290.41, width: 164.7, height: 64.05 },
  { id: "label-stack-3", x: 107.47, y: 301.63, width: 164.7, height: 64.05 },
];

type HourClockPair = {
  id: string;
  hour: number;
  label: string;
  fullImage: string;
  pictureImage: string;
  labelImage: string;
};

type CardType = "picture" | "label";

type CardState = {
  id: string;
  pairId: string;
  type: CardType;
  x: number;
  y: number;
  homeX: number;
  homeY: number;
};

const HOUR_WORDS = [
  "one",
  "two",
  "three",
  "four",
  "five",
  "six",
  "seven",
  "eight",
  "nine",
  "ten",
  "eleven",
  "twelve",
];

const ALL_HOUR_PAIRS: HourClockPair[] = Array.from({ length: 12 }, (_, index) => {
  const hour = index + 1;
  return {
    id: `hour-${hour}`,
    hour,
    label: `${HOUR_WORDS[index]} o'clock`,
    fullImage: `/assets/time/hour_clock/hour_clock_tcp_full/${hour}-hour_clock_tcp_full.png`,
    pictureImage: `/assets/time/hour_clock/hour_clock_tcp_picture/${hour}-hour_clock.png`,
    labelImage: `/assets/time/hour_clock/hour_clock_tcp_labels/${hour}-hour_clock_tcp_labels.png`,
  };
});

const shuffleArray = <T,>(values: T[]) => {
  const next = [...values];
  for (let index = next.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [next[index], next[swapIndex]] = [next[swapIndex], next[index]];
  }
  return next;
};

export default function HourClockThreePartCardsPicturesLabelsLesson() {
  const boardRef = useRef<HTMLDivElement | null>(null);
  const [stageIndex, setStageIndex] = useState(0);
  const [stagePairs, setStagePairs] = useState<HourClockPair[]>([]);
  const [cards, setCards] = useState<CardState[]>([]);
  const [pictureAssignments, setPictureAssignments] = useState<Record<string, string>>({});
  const [labelAssignments, setLabelAssignments] = useState<Record<string, string>>({});
  const [dragging, setDragging] = useState<{ id: string; offsetX: number; offsetY: number } | null>(null);

  useEffect(() => {
    primeSpeechVoices();
  }, []);

  const stageCount = Math.ceil(ALL_HOUR_PAIRS.length / STAGE_SIZE);
  const stageBasePairs = useMemo(() => {
    const start = stageIndex * STAGE_SIZE;
    return ALL_HOUR_PAIRS.slice(start, start + STAGE_SIZE);
  }, [stageIndex]);

  useEffect(() => {
    setStagePairs(stageBasePairs);
  }, [stageBasePairs]);

  useEffect(() => {
    const shuffledPictures = shuffleArray(stagePairs);
    const shuffledLabels = shuffleArray(stagePairs);
    const nextCards: CardState[] = [];

    shuffledPictures.forEach((pair, index) => {
      const slot = PICTURE_STACK_SLOTS[index] ?? PICTURE_STACK_SLOTS[PICTURE_STACK_SLOTS.length - 1];
      const x = slot.x + slot.width / 2;
      const y = slot.y + slot.height / 2;
      nextCards.push({
        id: `picture-${stageIndex}-${pair.id}`,
        pairId: pair.id,
        type: "picture",
        x,
        y,
        homeX: x,
        homeY: y,
      });
    });

    shuffledLabels.forEach((pair, index) => {
      const slot = LABEL_STACK_SLOTS[index] ?? LABEL_STACK_SLOTS[LABEL_STACK_SLOTS.length - 1];
      const x = slot.x + slot.width / 2;
      const y = slot.y + slot.height / 2;
      nextCards.push({
        id: `label-${stageIndex}-${pair.id}`,
        pairId: pair.id,
        type: "label",
        x,
        y,
        homeX: x,
        homeY: y,
      });
    });

    setCards(nextCards);
    setPictureAssignments({});
    setLabelAssignments({});
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
    setPictureAssignments((prev) => {
      const next = { ...prev };
      Object.keys(next).forEach((slotId) => {
        if (next[slotId] === cardId) delete next[slotId];
      });
      return next;
    });
    setLabelAssignments((prev) => {
      const next = { ...prev };
      Object.keys(next).forEach((slotId) => {
        if (next[slotId] === cardId) delete next[slotId];
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

      const slots = card.type === "picture" ? PICTURE_ANSWER_SLOTS : LABEL_ANSWER_SLOTS;
      const assignments = card.type === "picture" ? pictureAssignments : labelAssignments;

      const candidates = slots
        .map((slot) => ({
          slot,
          dist: Math.hypot(point.x - (slot.x + slot.width / 2), point.y - (slot.y + slot.height / 2)),
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
        if (card.type === "picture") {
          setPictureAssignments((prev) => ({ ...prev, [target.id]: card.id }));
        } else {
          setLabelAssignments((prev) => ({ ...prev, [target.id]: card.id }));
        }
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
  }, [cards, convertPointerToBoard, dragging, labelAssignments, pictureAssignments]);

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

  const activePictureSlots = PICTURE_ANSWER_SLOTS.slice(0, stagePairs.length);
  const activeLabelSlots = LABEL_ANSWER_SLOTS.slice(0, stagePairs.length);

  const pictureMatches = useMemo(() => {
    return activePictureSlots.map((slot, index) => {
      const assignedCardId = pictureAssignments[slot.id];
      const pair = stagePairs[index];
      const card = cards.find((item) => item.id === assignedCardId);
      const matched = Boolean(pair && card && card.pairId === pair.id);
      return { slot, matched, pair };
    });
  }, [activePictureSlots, cards, pictureAssignments, stagePairs]);

  const labelMatches = useMemo(() => {
    return activeLabelSlots.map((slot, index) => {
      const assignedCardId = labelAssignments[slot.id];
      const pair = stagePairs[index];
      const card = cards.find((item) => item.id === assignedCardId);
      const matched = Boolean(pair && card && card.pairId === pair.id);
      return { slot, matched, pair };
    });
  }, [activeLabelSlots, cards, labelAssignments, stagePairs]);

  const pairedMatches = useMemo(() => {
    return pictureMatches.map((pictureMatch, index) => {
      const labelMatch = labelMatches[index];
      return {
        pair: pictureMatch.pair ?? labelMatch?.pair,
        matched: Boolean(pictureMatch.matched && labelMatch?.matched),
      };
    });
  }, [labelMatches, pictureMatches]);

  const spokenMatchesRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    spokenMatchesRef.current = new Set();
  }, [stageIndex]);

  useEffect(() => {
    pairedMatches.forEach((item) => {
      if (!item.matched || !item.pair) return;
      if (spokenMatchesRef.current.has(item.pair.id)) return;
      spokenMatchesRef.current.add(item.pair.id);
      handleSpeak(item.pair.label);
    });
  }, [handleSpeak, pairedMatches]);

  const allMatched = useMemo(() => {
    if (!pictureMatches.length || !labelMatches.length) return false;
    return pictureMatches.every((item) => item.matched) && labelMatches.every((item) => item.matched);
  }, [labelMatches, pictureMatches]);

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
            History &amp; Time · Hour Clock Three-Part Cards Pictures &amp; Labels
          </p>
          <h1 className="font-display text-4xl font-semibold text-stone-900">
            Hour Clock Three-Part Cards Pictures &amp; Labels
          </h1>
          <p className="text-sm text-stone-600">Drag each picture and label to the matching full hour card.</p>
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
                  <img src={pair.fullImage} alt={pair.label} className="h-full w-full object-contain" />
                  <button
                    type="button"
                    onClick={() => handleSpeak(pair.label)}
                    aria-label={`Say ${pair.label}`}
                    className="absolute right-0 bottom-0 z-20 flex h-4 w-4 translate-x-1/2 translate-y-1/2 items-center justify-center rounded-full border border-stone-200 bg-white/95 text-[9px] leading-none text-stone-600 shadow shadow-stone-300 transition hover:bg-white"
                  >
                    🔊
                  </button>
                </div>
              );
            })}

            {activePictureSlots.map((slot) => (
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

            {activeLabelSlots.map((slot) => (
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
              const isPicture = card.type === "picture";
              const slotSize = isPicture ? PICTURE_ANSWER_SLOTS[0] : LABEL_ANSWER_SLOTS[0];
              const cardPaddingClass = isPicture ? "p-1 sm:p-1.5" : "p-0.5 sm:p-1";
              const imageClass = isPicture
                ? "h-full w-full object-contain"
                : "h-full w-full origin-center scale-[1.2] object-contain";
              return (
                <div
                  key={card.id}
                  onPointerDown={(event) => handlePointerDown(event, card)}
                  className="pointer-events-auto absolute z-10 -translate-x-1/2 -translate-y-1/2 rounded-none border-none bg-transparent shadow-none"
                  style={{
                    left: `${(card.x / BOARD_WIDTH) * 100}%`,
                    top: `${(card.y / BOARD_HEIGHT) * 100}%`,
                    width: `${(slotSize.width / BOARD_WIDTH) * 100}%`,
                    height: `${(slotSize.height / BOARD_HEIGHT) * 100}%`,
                    touchAction: "none",
                  }}
                >
                  <div
                    className={`relative h-full w-full rounded-md bg-white/90 ${cardPaddingClass} shadow-[0_8px_18px_-14px_rgba(0,0,0,0.8)]`}
                  >
                    <img src={isPicture ? pair.pictureImage : pair.labelImage} alt={pair.label} className={imageClass} />
                    <button
                      type="button"
                      onPointerDown={(event) => event.stopPropagation()}
                      onClick={(event) => {
                        event.stopPropagation();
                        handleSpeak(pair.label);
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

            {pairedMatches.map((item, index) => {
              if (!item.matched) return null;
              const cardSlot = CARD_SLOTS[index];
              if (!cardSlot) return null;
              return (
                <div
                  key={`match-card-${cardSlot.id}`}
                  className="pointer-events-none absolute z-20 bg-emerald-500/35"
                  style={{
                    left: `${(cardSlot.x / BOARD_WIDTH) * 100}%`,
                    top: `${(cardSlot.y / BOARD_HEIGHT) * 100}%`,
                    width: `${(cardSlot.width / BOARD_WIDTH) * 100}%`,
                    height: `${(cardSlot.height / BOARD_HEIGHT) * 100}%`,
                  }}
                />
              );
            })}

            {pictureMatches.map((item) => {
              if (!item.matched) return null;
              return (
                <div
                  key={`match-picture-${item.slot.id}`}
                  className="pointer-events-none absolute z-20 bg-emerald-500/35"
                  style={{
                    left: `${(item.slot.x / BOARD_WIDTH) * 100}%`,
                    top: `${(item.slot.y / BOARD_HEIGHT) * 100}%`,
                    width: `${(item.slot.width / BOARD_WIDTH) * 100}%`,
                    height: `${(item.slot.height / BOARD_HEIGHT) * 100}%`,
                  }}
                />
              );
            })}

            {labelMatches.map((item) => {
              if (!item.matched) return null;
              return (
                <div
                  key={`match-label-${item.slot.id}`}
                  className="pointer-events-none absolute z-20 bg-emerald-500/35"
                  style={{
                    left: `${(item.slot.x / BOARD_WIDTH) * 100}%`,
                    top: `${(item.slot.y / BOARD_HEIGHT) * 100}%`,
                    width: `${(item.slot.width / BOARD_WIDTH) * 100}%`,
                    height: `${(item.slot.height / BOARD_HEIGHT) * 100}%`,
                  }}
                />
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
