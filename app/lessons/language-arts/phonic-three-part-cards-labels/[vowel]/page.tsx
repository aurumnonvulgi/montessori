"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "next/navigation";
import HomeLink from "../../../../components/HomeLink";
import CompletionOverlay from "../../../../components/CompletionOverlay";
import { getPhonicsCompletionSteps } from "../../../../lib/phonicsProgression";
import { trackLessonEvent } from "../../../../lib/lessonTelemetry";
import { primeSpeechVoices, speakWithPreferredVoice } from "../../../../lib/speech";

const BOARD_IMAGE = "/assets/language_arts/moveable_alphabet/tcp-pic-label.svg";
const BOARD_WIDTH = 1366;
const BOARD_HEIGHT = 768;
const DROP_THRESHOLD = 90;

const VALID_VOWELS = new Set(["a", "e", "i", "o", "u"]);

const CARD_SLOTS = [
  { id: "line1-box1", x: 513.31, y: 21.06, width: 165.92, height: 210.37 },
  { id: "line1-box2", x: 513.31, y: 260.5, width: 165.92, height: 210.37 },
  { id: "line1-box3", x: 513.31, y: 513.27, width: 165.92, height: 210.37 },
];

const ANSWER_SLOTS = [
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

type ThreePartPair = {
  id: string;
  letter: string;
  wordSlug: string;
  wordLabel: string;
  cardFile: string;
  pictureFile: string;
  labelFile: string;
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

const toCardImage = (file: string) =>
  `/assets/language_arts/moveable_alphabet/Phonic_picture_cards/${file}`;

const toPictureImage = (file: string) =>
  `/assets/language_arts/moveable_alphabet/phonic_pictures/${file}`;

const toLabelImage = (file: string) =>
  `/assets/language_arts/moveable_alphabet/phonic_labels/${file}`;

const parseCardFile = (file: string) => {
  if (!file.endsWith(".png")) return null;
  const base = file.replace(/\.png$/i, "");
  const [letter, marker, ...rest] = base.split("-");
  if (!letter || marker !== "tcp" || rest.length === 0) return null;
  const wordSlug = rest.join("-");
  const wordLabel = rest.join(" ");
  return { letter, wordSlug, wordLabel };
};

const parseLabelFile = (file: string) => {
  if (!file.endsWith("-label.png")) return null;
  const base = file.replace(/-label\.png$/i, "");
  const [letter, ...rest] = base.split("-");
  if (!letter || rest.length === 0) return null;
  const wordSlug = rest.join("-");
  const wordLabel = rest.join(" ");
  return { letter, wordSlug, wordLabel };
};

const buildPictureFile = (letter: string, wordSlug: string) =>
  `${letter}-picture-${wordSlug}.png`;

const buildCardFile = (letter: string, wordSlug: string) =>
  `${letter}-tcp-${wordSlug}.png`;

const buildLabelFile = (letter: string, wordSlug: string) =>
  `${letter}-${wordSlug}-label.png`;

const STAGE_SIZE = 3;

const shuffleArray = <T,>(values: T[]) => {
  const next = [...values];
  for (let index = next.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [next[index], next[swapIndex]] = [next[swapIndex], next[index]];
  }
  return next;
};

export default function PhonicThreePartCardsLabelsLesson() {
  const params = useParams();
  const vowelParam = Array.isArray(params?.vowel) ? params?.vowel[0] : params?.vowel;
  const vowel =
    typeof vowelParam === "string" && VALID_VOWELS.has(vowelParam.toLowerCase())
      ? vowelParam.toLowerCase()
      : "a";

  const boardRef = useRef<HTMLDivElement | null>(null);
  const [pairs, setPairs] = useState<ThreePartPair[]>([]);
  const [stageIndex, setStageIndex] = useState(0);
  const [stagePairs, setStagePairs] = useState<ThreePartPair[]>([]);
  const [cards, setCards] = useState<CardState[]>([]);
  const [pictureAssignments, setPictureAssignments] = useState<Record<string, string>>({});
  const [labelAssignments, setLabelAssignments] = useState<Record<string, string>>({});
  const [dragging, setDragging] = useState<{ id: string; offsetX: number; offsetY: number } | null>(null);
  const [cardFiles, setCardFiles] = useState<string[]>([]);
  const [pictureFiles, setPictureFiles] = useState<string[]>([]);
  const [labelFiles, setLabelFiles] = useState<string[]>([]);
  const [showCompletion, setShowCompletion] = useState(false);
  const attemptCountRef = useRef(0);
  const completedStagesRef = useRef<Record<string, true>>({});
  const completedLessonsRef = useRef<Record<string, true>>({});
  const completionSteps = useMemo(
    () => getPhonicsCompletionSteps("phonic-three-part-cards-labels", vowel),
    [vowel]
  );

  useEffect(() => {
    setShowCompletion(false);
  }, [vowel]);

  useEffect(() => {
    primeSpeechVoices();
  }, []);

  useEffect(() => {
    let active = true;
    const loadManifests = async () => {
      try {
        const [cardsResponse, picturesResponse, labelsResponse] = await Promise.all([
          fetch("/assets/language_arts/moveable_alphabet/Phonic_picture_cards/manifest.json"),
          fetch("/assets/language_arts/moveable_alphabet/phonic_pictures/manifest.json"),
          fetch("/assets/language_arts/moveable_alphabet/phonic_labels/manifest.json"),
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
        if (labelsResponse.ok) {
          const data = await labelsResponse.json();
          const files = Array.isArray(data?.files) ? data.files : Array.isArray(data) ? data : null;
          if (active && files?.length) {
            setLabelFiles(files.filter((file: unknown): file is string => typeof file === "string"));
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
    if (!cardFiles.length || !pictureFiles.length || !labelFiles.length) {
      setPairs([]);
      return;
    }
    const pictureSet = new Set(pictureFiles);
    const cardSet = new Set(cardFiles);
    const labelSet = new Set(labelFiles);
    const nextPairs = labelFiles
      .map((file) => {
        const parsed = parseLabelFile(file);
        if (!parsed) return null;
        if (parsed.letter.toLowerCase() !== vowel) return null;
        const pictureFile = buildPictureFile(parsed.letter, parsed.wordSlug);
        const cardFile = buildCardFile(parsed.letter, parsed.wordSlug);
        const labelFile = buildLabelFile(parsed.letter, parsed.wordSlug);
        if (!pictureSet.has(pictureFile)) return null;
        if (!cardSet.has(cardFile)) return null;
        if (!labelSet.has(labelFile)) return null;
        return {
          id: `${parsed.letter}-${parsed.wordSlug}`,
          letter: parsed.letter,
          wordSlug: parsed.wordSlug,
          wordLabel: parsed.wordLabel,
          cardFile,
          pictureFile,
          labelFile,
        };
      })
      .filter(Boolean) as ThreePartPair[];
    setPairs(nextPairs);
    setStageIndex(0);
  }, [cardFiles, pictureFiles, labelFiles, vowel]);

  const stageBasePairs = useMemo(() => {
    const start = stageIndex * STAGE_SIZE;
    return pairs.slice(start, start + STAGE_SIZE);
  }, [pairs, stageIndex]);

  const stageCount = Math.max(1, Math.ceil(pairs.length / STAGE_SIZE));

  useEffect(() => {
    setStagePairs(shuffleArray(stageBasePairs));
  }, [stageBasePairs]);

  useEffect(() => {
    trackLessonEvent({
      lesson: "language-arts:phonic-three-part-cards-labels",
      activity: `vowel-${vowel}`,
      event: "lesson_opened",
      details: {
        stageCount,
      },
    });
  }, [stageCount, vowel]);

  useEffect(() => {
    const shuffled = shuffleArray(stagePairs);
    const nextCards: CardState[] = [];
    shuffled.forEach((pair, index) => {
      const pictureSlot = PICTURE_STACK_SLOTS[index] ?? PICTURE_STACK_SLOTS[PICTURE_STACK_SLOTS.length - 1];
      const labelSlot = LABEL_STACK_SLOTS[index] ?? LABEL_STACK_SLOTS[LABEL_STACK_SLOTS.length - 1];
      nextCards.push({
        id: `pic-${stageIndex}-${pair.id}`,
        pairId: pair.id,
        type: "picture",
        x: pictureSlot.x + pictureSlot.width / 2,
        y: pictureSlot.y + pictureSlot.height / 2,
        homeX: pictureSlot.x + pictureSlot.width / 2,
        homeY: pictureSlot.y + pictureSlot.height / 2,
      });
      nextCards.push({
        id: `label-${stageIndex}-${pair.id}`,
        pairId: pair.id,
        type: "label",
        x: labelSlot.x + labelSlot.width / 2,
        y: labelSlot.y + labelSlot.height / 2,
        homeX: labelSlot.x + labelSlot.width / 2,
        homeY: labelSlot.y + labelSlot.height / 2,
      });
    });
    setCards(nextCards);
    setPictureAssignments({});
    setLabelAssignments({});
    setDragging(null);
  }, [stagePairs, stageIndex]);

  useEffect(() => {
    trackLessonEvent({
      lesson: "language-arts:phonic-three-part-cards-labels",
      activity: `vowel-${vowel}`,
      event: "stage_viewed",
      page: stageIndex + 1,
      totalPages: stageCount,
    });
  }, [stageCount, stageIndex, vowel]);

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
      if (!dragging) return;
      const card = cards.find((item) => item.id === dragging.id);
      const point = convertPointerToBoard(event);
      setDragging(null);
      if (!card || !point) return;

      const slots = card.type === "picture" ? ANSWER_SLOTS : LABEL_ANSWER_SLOTS;
      const assignments = card.type === "picture" ? pictureAssignments : labelAssignments;

      const candidates = slots
        .map((slot) => ({
          slot,
          centerX: slot.x + slot.width / 2,
          centerY: slot.y + slot.height / 2,
          dist: Math.hypot(point.x - (slot.x + slot.width / 2), point.y - (slot.y + slot.height / 2)),
        }))
        .filter(({ slot }) => !assignments[slot.id])
        .sort((a, b) => a.dist - b.dist);

      if (candidates.length && candidates[0].dist <= DROP_THRESHOLD) {
        const target = candidates[0].slot;
        const targetIndex = slots.findIndex((slot) => slot.id === target.id);
        const expectedPair = targetIndex >= 0 ? stagePairs[targetIndex] : undefined;
        const attempt = attemptCountRef.current + 1;
        attemptCountRef.current = attempt;
        trackLessonEvent({
          lesson: "language-arts:phonic-three-part-cards-labels",
          activity: `vowel-${vowel}`,
          event: "attempt_result",
          success: Boolean(expectedPair && expectedPair.id === card.pairId),
          attempt,
          value: expectedPair?.wordLabel ?? card.pairId,
          page: stageIndex + 1,
          totalPages: stageCount,
          details: {
            slot: target.id,
            cardType: card.type,
          },
        });
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

      const attempt = attemptCountRef.current + 1;
      attemptCountRef.current = attempt;
      trackLessonEvent({
        lesson: "language-arts:phonic-three-part-cards-labels",
        activity: `vowel-${vowel}`,
        event: "attempt_result",
        success: false,
        attempt,
        value: card.pairId,
        page: stageIndex + 1,
        totalPages: stageCount,
        details: {
          cardType: card.type,
        },
      });
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
  }, [cards, convertPointerToBoard, dragging, labelAssignments, pictureAssignments, stageCount, stageIndex, stagePairs, vowel]);

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

  const activePictureSlots = ANSWER_SLOTS.slice(0, stagePairs.length);
  const activeLabelSlots = LABEL_ANSWER_SLOTS.slice(0, stagePairs.length);

  const pictureMatches = useMemo(() => {
    return activePictureSlots.map((slot, index) => {
      const assignedCardId = pictureAssignments[slot.id];
      const pair = stagePairs[index];
      const card = cards.find((item) => item.id === assignedCardId);
      const matched = Boolean(pair && card && card.pairId === pair.id);
      return { slot, matched, pair };
    });
  }, [activePictureSlots, pictureAssignments, cards, stagePairs]);

  const labelMatches = useMemo(() => {
    return activeLabelSlots.map((slot, index) => {
      const assignedCardId = labelAssignments[slot.id];
      const pair = stagePairs[index];
      const card = cards.find((item) => item.id === assignedCardId);
      const matched = Boolean(pair && card && card.pairId === pair.id);
      return { slot, matched, pair };
    });
  }, [activeLabelSlots, labelAssignments, cards, stagePairs]);

  const allMatched = useMemo(() => {
    if (!pictureMatches.length || !labelMatches.length) return false;
    return pictureMatches.every((item) => item.matched) && labelMatches.every((item) => item.matched);
  }, [pictureMatches, labelMatches]);

  const spokenMatchesRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    spokenMatchesRef.current = new Set();
  }, [stageIndex, vowel]);

  const combinedMatches = useMemo(() => {
    return pictureMatches.map((pictureMatch, index) => {
      const labelMatch = labelMatches[index];
      return {
        pair: pictureMatch.pair ?? labelMatch?.pair,
        matched: Boolean(pictureMatch.matched && labelMatch?.matched),
      };
    });
  }, [pictureMatches, labelMatches]);

  useEffect(() => {
    combinedMatches.forEach((item) => {
      if (!item.matched || !item.pair) return;
      const key = item.pair.id;
      if (spokenMatchesRef.current.has(key)) return;
      spokenMatchesRef.current.add(key);
      trackLessonEvent({
        lesson: "language-arts:phonic-three-part-cards-labels",
        activity: `vowel-${vowel}`,
        event: "word_completed",
        success: true,
        value: item.pair.wordLabel,
        page: stageIndex + 1,
        totalPages: stageCount,
      });
      handleSpeak(item.pair.wordLabel);
    });
  }, [combinedMatches, handleSpeak, stageCount, stageIndex, vowel]);

  const advanceRef = useRef<number | null>(null);
  useEffect(() => {
    if (!allMatched) return;
    const stageKey = `${vowel}-${stageIndex}`;
    if (!completedStagesRef.current[stageKey]) {
      completedStagesRef.current[stageKey] = true;
      trackLessonEvent({
        lesson: "language-arts:phonic-three-part-cards-labels",
        activity: `vowel-${vowel}`,
        event: "stage_completed",
        success: true,
        page: stageIndex + 1,
        totalPages: stageCount,
      });
    }
    if (stageIndex >= stageCount - 1) {
      const lessonKey = `vowel-${vowel}`;
      if (!completedLessonsRef.current[lessonKey]) {
        completedLessonsRef.current[lessonKey] = true;
        trackLessonEvent({
          lesson: "language-arts:phonic-three-part-cards-labels",
          activity: lessonKey,
          event: "lesson_completed",
          success: true,
          page: stageCount,
          totalPages: stageCount,
        });
      }
      setShowCompletion(true);
    }
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
  }, [allMatched, stageCount, stageIndex, vowel]);

  return (
    <div className="relative min-h-screen bg-[radial-gradient(circle_at_top,#f5efe6,#fdfbf8_55%,#f7efe4)]">
      <HomeLink />
      <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-8 px-6 py-10">
        <header className="space-y-3 text-center">
          <p className="text-xs uppercase tracking-[0.35em] text-stone-400">
            Phonic Three-Part Cards Pictures & Labels · Vowel {vowel}
          </p>
          <h1 className="font-display text-4xl font-semibold text-stone-900">
            Match Pictures & Labels to Three-Part Cards
          </h1>
          <p className="text-sm text-stone-600">Drag the picture and label to the matching card.</p>
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
              const isPicture = card.type === "picture";
              const slotSize = isPicture ? ANSWER_SLOTS[0] : LABEL_ANSWER_SLOTS[0];
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
                  <div className="relative h-full w-full rounded-md bg-white/90 p-1 shadow-[0_8px_18px_-14px_rgba(0,0,0,0.8)] sm:p-1.5">
                    {(() => {
                      const pair = stagePairs.find((item) => item.id === card.pairId);
                      if (!pair) return null;
                      return (
                        <>
                          <img
                            src={isPicture ? toPictureImage(pair.pictureFile) : toLabelImage(pair.labelFile)}
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
      <CompletionOverlay
        open={showCompletion}
        title={completionSteps.isEndOfSeries ? "Series Complete" : "Lesson Complete"}
        message={
          completionSteps.isEndOfSeries
            ? `You completed vowel ${vowel.toUpperCase()} in this material.`
            : `Great work on vowel ${vowel.toUpperCase()}.`
        }
        primaryAction={completionSteps.nextInSeries ?? completionSteps.nextMaterial}
        secondaryAction={{ href: "/lessons/language-arts/phonics", label: "Back to Phonics" }}
      />
    </div>
  );
}
