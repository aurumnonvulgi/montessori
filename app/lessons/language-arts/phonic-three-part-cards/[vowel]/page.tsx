"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "next/navigation";
import HomeLink from "../../../../components/HomeLink";

const BOARD_IMAGE = "/assets/language_arts/moveable_alphabet/tcp-pic-pic.svg";
const BOARD_WIDTH = 1366;
const BOARD_HEIGHT = 768;
const DROP_THRESHOLD = 90;

const VALID_VOWELS = new Set(["a", "e", "i", "o", "u"]);

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

type ThreePartPair = {
  id: string;
  letter: string;
  wordSlug: string;
  wordLabel: string;
  cardFile: string;
  pictureFile: string;
};

type CardState = {
  id: string;
  pairId: string;
  x: number;
  y: number;
  homeX: number;
  homeY: number;
};

const toCardImage = (file: string) =>
  `/assets/language_arts/moveable_alphabet/Phonic_picture_cards/${file}`;

const toPictureImage = (file: string) =>
  `/assets/language_arts/moveable_alphabet/phonic_pictures/${file}`;

const parseCardFile = (file: string) => {
  if (!file.endsWith(".png")) return null;
  const base = file.replace(/\.png$/i, "");
  const [letter, marker, ...rest] = base.split("-");
  if (!letter || marker !== "tcp" || rest.length === 0) return null;
  const wordSlug = rest.join("-");
  const wordLabel = rest.join(" ");
  return { letter, wordSlug, wordLabel };
};

const buildPictureFile = (letter: string, wordSlug: string) =>
  `${letter}-picture-${wordSlug}.png`;

const STAGE_SIZE = 3;

export default function PhonicThreePartCardsLesson() {
  const params = useParams();
  const vowelParam = Array.isArray(params?.vowel) ? params?.vowel[0] : params?.vowel;
  const vowel =
    typeof vowelParam === "string" && VALID_VOWELS.has(vowelParam.toLowerCase())
      ? vowelParam.toLowerCase()
      : "a";

  const boardRef = useRef<HTMLDivElement | null>(null);
  const [pairs, setPairs] = useState<ThreePartPair[]>([]);
  const [stageIndex, setStageIndex] = useState(0);
  const [cards, setCards] = useState<CardState[]>([]);
  const [assignments, setAssignments] = useState<Record<string, string>>({});
  const [dragging, setDragging] = useState<{ id: string; offsetX: number; offsetY: number } | null>(null);
  const [cardFiles, setCardFiles] = useState<string[]>([]);
  const [pictureFiles, setPictureFiles] = useState<string[]>([]);

  useEffect(() => {
    let active = true;
    const loadManifests = async () => {
      try {
        const [cardsResponse, picturesResponse] = await Promise.all([
          fetch("/assets/language_arts/moveable_alphabet/Phonic_picture_cards/manifest.json"),
          fetch("/assets/language_arts/moveable_alphabet/phonic_pictures/manifest.json"),
        ]);
        if (cardsResponse.ok) {
          const data = await cardsResponse.json();
          const files = Array.isArray(data?.files) ? data.files : Array.isArray(data) ? data : null;
          if (active && files?.length) {
            setCardFiles(files.filter((file: unknown): file is string => typeof file === "string"));
          }
        }
        if (picturesResponse.ok) {
          const data = await picturesResponse.json();
          const files = Array.isArray(data?.files) ? data.files : Array.isArray(data) ? data : null;
          if (active && files?.length) {
            setPictureFiles(files.filter((file: unknown): file is string => typeof file === "string"));
          }
        }
      } catch {
        // ignore manifest load failures
      }
    };
    loadManifests();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!cardFiles.length || !pictureFiles.length) {
      setPairs([]);
      return;
    }
    const pictureSet = new Set(pictureFiles);
    const nextPairs = cardFiles
      .map((file) => {
        const parsed = parseCardFile(file);
        if (!parsed) return null;
        if (parsed.letter.toLowerCase() !== vowel) return null;
        const pictureFile = buildPictureFile(parsed.letter, parsed.wordSlug);
        if (!pictureSet.has(pictureFile)) return null;
        return {
          id: `${parsed.letter}-${parsed.wordSlug}`,
          letter: parsed.letter,
          wordSlug: parsed.wordSlug,
          wordLabel: parsed.wordLabel,
          cardFile: file,
          pictureFile,
        };
      })
      .filter(Boolean) as ThreePartPair[];
    setPairs(nextPairs);
    setStageIndex(0);
  }, [cardFiles, pictureFiles, vowel]);

  const stagePairs = useMemo(() => {
    const start = stageIndex * STAGE_SIZE;
    return pairs.slice(start, start + STAGE_SIZE);
  }, [pairs, stageIndex]);

  const stageCount = Math.max(1, Math.ceil(pairs.length / STAGE_SIZE));

  useEffect(() => {
    const shuffled = [...stagePairs].sort(() => Math.random() - 0.5);
    const nextCards = shuffled.map((pair, index) => {
      const slot = STACK_SLOTS[index] ?? STACK_SLOTS[STACK_SLOTS.length - 1];
      const x = slot.x + slot.width / 2;
      const y = slot.y + slot.height / 2;
      return {
        id: `pic-${stageIndex}-${pair.id}`,
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
    if (typeof window === "undefined") return;
    const utterance = new SpeechSynthesisUtterance(label);
    window.speechSynthesis?.cancel();
    window.speechSynthesis?.speak(utterance);
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

      const candidates = ANSWER_SLOTS.map((slot) => ({
        slot,
        centerX: slot.x + slot.width / 2,
        centerY: slot.y + slot.height / 2,
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
  }, [cards, convertPointerToBoard, dragging, assignments]);

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

  const assignedMatches = useMemo(() => {
    return ANSWER_SLOTS.map((slot, index) => {
      const assignedCardId = assignments[slot.id];
      const pair = stagePairs[index];
      const card = cards.find((item) => item.id === assignedCardId);
      const matched = Boolean(pair && card && card.pairId === pair.id);
      return { slot, matched, pair };
    });
  }, [assignments, cards, stagePairs]);

  const allMatched = useMemo(
    () => assignedMatches.length && assignedMatches.every((item) => item.matched),
    [assignedMatches]
  );

  const spokenMatchesRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    spokenMatchesRef.current = new Set();
  }, [stageIndex, vowel]);

  useEffect(() => {
    assignedMatches.forEach((item) => {
      if (!item.matched || !item.pair) return;
      const key = item.pair.id;
      if (spokenMatchesRef.current.has(key)) return;
      spokenMatchesRef.current.add(key);
      handleSpeak(item.pair.wordLabel);
    });
  }, [assignedMatches, handleSpeak]);

  const advanceRef = useRef<number | null>(null);
  useEffect(() => {
    if (!allMatched) return;
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
  }, [allMatched, stageIndex, stageCount]);

  return (
    <div className="relative min-h-screen bg-[radial-gradient(circle_at_top,#f5efe6,#fdfbf8_55%,#f7efe4)]">
      <HomeLink />
      <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-8 px-6 py-10">
        <header className="space-y-3 text-center">
          <p className="text-xs uppercase tracking-[0.35em] text-stone-400">
            Phonic Three-Part Cards · Vowel {vowel}
          </p>
          <h1 className="font-display text-4xl font-semibold text-stone-900">Match Picture to Three-Part Card</h1>
          <p className="text-sm text-stone-600">Drag the picture onto the matching three-part card.</p>
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
                  <img src={toCardImage(pair.cardFile)} alt={pair.wordLabel} className="h-full w-full object-contain" />
                  <button
                    type="button"
                    onClick={() => handleSpeak(pair.wordLabel)}
                    aria-label={`Say ${pair.wordLabel}`}
                    className="absolute right-1 bottom-1 flex h-5 w-5 items-center justify-center rounded-full bg-white/90 text-[10px] text-stone-600 shadow shadow-stone-400 transition hover:bg-white sm:right-1.5 sm:bottom-1.5 sm:h-6 sm:w-6 sm:text-xs"
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

            {cards.map((card) => (
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
                <div className="relative h-full w-full rounded-md bg-white/90 p-1 shadow-[0_8px_18px_-14px_rgba(0,0,0,0.8)] sm:p-1.5">
                  {(() => {
                    const pair = stagePairs.find((item) => item.id === card.pairId);
                    if (!pair) return null;
                    return (
                      <>
                        <img
                          src={toPictureImage(pair.pictureFile)}
                          alt={pair.wordLabel}
                          className="h-full w-full object-contain"
                        />
                        <button
                          type="button"
                          onPointerDown={(event) => event.stopPropagation()}
                          onClick={(event) => {
                            event.stopPropagation();
                            handleSpeak(pair.wordLabel);
                          }}
                          aria-label={`Say ${pair.wordLabel}`}
                          className="absolute right-1 bottom-1 flex h-5 w-5 items-center justify-center rounded-full bg-white/90 text-[10px] text-stone-600 shadow shadow-stone-400 transition hover:bg-white sm:right-1.5 sm:bottom-1.5 sm:h-6 sm:w-6 sm:text-xs"
                        >
                          🔊
                        </button>
                      </>
                    );
                  })()}
                </div>
              </div>
            ))}

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
