"use client";

import {
  createRef,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type RefObject,
} from "react";
import Draggable from "react-draggable";

type NumberRodsPresentationCanvasProps = {
  playing: boolean;
  voiceEnabled: boolean;
  className?: string;
  onComplete?: () => void;
};

type Phase =
  | "intro"
  | "rod1-demo"
  | "rod1-place"
  | "rod2-demo"
  | "rod2-place"
  | "rod3-demo"
  | "rod3-place"
  | "complete";

type Position = { x: number; y: number };

const INTRO_SENTENCE = "I will now present the number rods";
const rodOrder = [
  { id: 1, word: "one" },
  { id: 2, word: "two" },
  { id: 3, word: "three" },
];

const normalizeText = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();

const SuccessOverlay = ({ fadeOut }: { fadeOut: boolean }) => (
  <div className={`lesson-complete-overlay${fadeOut ? " fade-out" : ""}`}>
    <div className="flex h-full items-center justify-center">
      <div className="flex h-28 w-28 items-center justify-center rounded-full bg-white/85 shadow-lg">
        <svg viewBox="0 0 120 120" className="h-16 w-16">
          <path
            d="M18 64l28 28 56-62"
            fill="none"
            stroke="#f2c94c"
            strokeWidth="14"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    </div>
  </div>
);

export default function NumberRodsPresentationCanvas({
  playing,
  voiceEnabled,
  className,
  onComplete,
}: NumberRodsPresentationCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const demoTimerRef = useRef<number | null>(null);
  const successTimerRef = useRef<number | null>(null);
  const fadeTimerRef = useRef<number | null>(null);
  const initialPositionsRef = useRef<Record<number, Position>>({});
  const [layout, setLayout] = useState({ width: 0, height: 0 });
  const [phase, setPhase] = useState<Phase>("intro");
  const [rodPositions, setRodPositions] = useState<Record<number, Position>>({});
  const [placed, setPlaced] = useState<Record<number, boolean>>({
    1: false,
    2: false,
    3: false,
  });
  const [listening, setListening] = useState(false);
  const [micError, setMicError] = useState("");
  const [successVisible, setSuccessVisible] = useState(false);
  const [successFade, setSuccessFade] = useState(false);
  const rodNodeRefs = useMemo(() => {
    const refs: Record<number, RefObject<HTMLDivElement>> = {};
    rodOrder.forEach((rod) => {
      refs[rod.id] = createRef<HTMLDivElement>() as RefObject<HTMLDivElement>;
    });
    return refs;
  }, []);

  const metrics = useMemo(() => {
    const minSide = Math.min(layout.width || 600, layout.height || 420);
    const segmentLength = Math.max(38, Math.min(minSide * 0.18, 74));
    const rodHeight = Math.max(14, Math.min(minSide * 0.06, 22));
    const rodLengths = {
      1: segmentLength,
      2: segmentLength * 2,
      3: segmentLength * 3,
    };
    return { segmentLength, rodHeight, rodLengths };
  }, [layout]);

  const slotPositions = useMemo(() => {
    if (!layout.width || !layout.height) {
      return {} as Record<number, Position>;
    }
    const slotX = Math.max(32, layout.width * 0.2);
    const slotY = layout.height * 0.34;
    const slotGap = metrics.rodHeight * 1.9;
    return {
      1: { x: slotX, y: slotY },
      2: { x: slotX, y: slotY + slotGap },
      3: { x: slotX, y: slotY + slotGap * 2 },
    };
  }, [layout, metrics.rodHeight]);

  const startPositions = useMemo(() => {
    if (!layout.width || !layout.height) {
      return {} as Record<number, Position>;
    }
    const bottomY = layout.height * 0.72;
    const safeX = (ratio: number, rodLength: number) => {
      const raw = layout.width * ratio;
      return Math.min(
        layout.width - rodLength - 16,
        Math.max(16, raw),
      );
    };
    return {
      1: { x: safeX(0.65, metrics.rodLengths[1]), y: bottomY },
      2: {
        x: safeX(0.2, metrics.rodLengths[2]),
        y: bottomY + metrics.rodHeight * 1.4,
      },
      3: {
        x: safeX(0.42, metrics.rodLengths[3]),
        y: bottomY - metrics.rodHeight * 1.1,
      },
    };
  }, [layout, metrics.rodHeight, metrics.rodLengths]);

  const activeRodId =
    phase === "rod1-place" ? 1 : phase === "rod2-place" ? 2 : phase === "rod3-place" ? 3 : null;
  const demoRodId =
    phase === "rod1-demo" ? 1 : phase === "rod2-demo" ? 2 : phase === "rod3-demo" ? 3 : null;

  const bannerText = useMemo(() => {
    if (phase === "intro") {
      return INTRO_SENTENCE;
    }
    if (phase.startsWith("rod1")) {
      return "This is one.";
    }
    if (phase.startsWith("rod2")) {
      return "This is two.";
    }
    if (phase.startsWith("rod3")) {
      return "This is three.";
    }
    return "Well done.";
  }, [phase]);

  const instructionText = phase.endsWith("place")
    ? "Place the rod on the correct spot."
    : null;

  const clearTimers = useCallback(() => {
    if (demoTimerRef.current) {
      window.clearTimeout(demoTimerRef.current);
      demoTimerRef.current = null;
    }
    if (successTimerRef.current) {
      window.clearTimeout(successTimerRef.current);
      successTimerRef.current = null;
    }
    if (fadeTimerRef.current) {
      window.clearTimeout(fadeTimerRef.current);
      fadeTimerRef.current = null;
    }
  }, []);

  const showSuccessOverlay = useCallback(
    (onDone?: () => void) => {
      setSuccessVisible(true);
      setSuccessFade(false);
      if (fadeTimerRef.current) {
        window.clearTimeout(fadeTimerRef.current);
      }
      fadeTimerRef.current = window.setTimeout(() => {
        setSuccessFade(true);
      }, 650);
      if (successTimerRef.current) {
        window.clearTimeout(successTimerRef.current);
      }
      successTimerRef.current = window.setTimeout(() => {
        setSuccessVisible(false);
        setSuccessFade(false);
        onDone?.();
      }, 950);
    },
    [],
  );

  useEffect(() => {
    const element = containerRef.current;
    if (!element) {
      return;
    }
    const update = () => {
      const rect = element.getBoundingClientRect();
      setLayout({ width: rect.width, height: rect.height });
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!layout.width || !layout.height) {
      return;
    }
    initialPositionsRef.current = startPositions;
    setRodPositions(startPositions);
    setPlaced({ 1: false, 2: false, 3: false });
    setPhase("intro");
    setMicError("");
    setListening(false);
  }, [layout.width, layout.height, startPositions]);

  useEffect(() => {
    clearTimers();
    if (!playing) {
      setPhase("intro");
      setRodPositions(startPositions);
      setPlaced({ 1: false, 2: false, 3: false });
      setMicError("");
      setListening(false);
      return;
    }
    if (phase === "intro") {
      return;
    }
  }, [playing, phase, startPositions, clearTimers]);

  useEffect(() => {
    if (!demoRodId || !slotPositions[demoRodId]) {
      return;
    }
    const startPosition = initialPositionsRef.current[demoRodId];
    if (!startPosition) {
      return;
    }

    setRodPositions((prev) => ({
      ...prev,
      [demoRodId]: slotPositions[demoRodId],
    }));

    demoTimerRef.current = window.setTimeout(() => {
      setRodPositions((prev) => ({
        ...prev,
        [demoRodId]: startPosition,
      }));
      demoTimerRef.current = window.setTimeout(() => {
        setPhase(`rod${demoRodId}-place` as Phase);
      }, 450);
    }, 900);

    return () => {
      if (demoTimerRef.current) {
        window.clearTimeout(demoTimerRef.current);
        demoTimerRef.current = null;
      }
    };
  }, [demoRodId, slotPositions]);

  useEffect(() => {
    return () => {
      clearTimers();
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {
          // ignore
        }
        recognitionRef.current = null;
      }
    };
  }, [clearTimers]);

  const beginMicCapture = useCallback(() => {
    if (!playing || phase !== "intro") {
      return;
    }
    if (typeof window === "undefined") {
      return;
    }
    const speechWindow = window as unknown as {
      SpeechRecognition?: any;
      webkitSpeechRecognition?: any;
    };
    const SpeechRecognition =
      speechWindow.SpeechRecognition || speechWindow.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setMicError("Speech recognition is not supported in this browser.");
      return;
    }

    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // ignore
      }
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event: any) => {
      const transcript = event.results?.[0]?.[0]?.transcript ?? "";
      const normalized = normalizeText(transcript);
      const expected = normalizeText(INTRO_SENTENCE);
      if (normalized === expected) {
        setMicError("");
        showSuccessOverlay(() => {
          setPhase("rod1-demo");
        });
      } else {
        setMicError("Please read the sentence exactly as shown.");
      }
    };

    recognition.onerror = () => {
      setMicError("Microphone error. Please try again.");
      setListening(false);
    };

    recognition.onend = () => {
      setListening(false);
    };

    recognitionRef.current = recognition;
    setListening(true);
    recognition.start();
  }, [phase, playing, showSuccessOverlay]);

  const handleRodDrag = useCallback(
    (rodId: number, data: { x: number; y: number }) => {
      if (activeRodId !== rodId) {
        return;
      }
      setRodPositions((prev) => ({
        ...prev,
        [rodId]: { x: data.x, y: data.y },
      }));
    },
    [activeRodId],
  );

  const handleRodStop = useCallback(
    (rodId: number, data: { x: number; y: number }) => {
      if (activeRodId !== rodId || placed[rodId]) {
        return;
      }
      const target = slotPositions[rodId];
      if (!target) {
        return;
      }
      const dx = data.x - target.x;
      const dy = data.y - target.y;
      const threshold = metrics.segmentLength * 0.5;
      if (Math.hypot(dx, dy) <= threshold) {
        setRodPositions((prev) => ({
          ...prev,
          [rodId]: target,
        }));
        setPlaced((prev) => ({ ...prev, [rodId]: true }));
        showSuccessOverlay(() => {
          if (rodId === 1) {
            setPhase("rod2-demo");
            return;
          }
          if (rodId === 2) {
            setPhase("rod3-demo");
            return;
          }
          setPhase("complete");
          onComplete?.();
        });
      }
    },
    [activeRodId, metrics.segmentLength, onComplete, placed, showSuccessOverlay, slotPositions],
  );

  return (
    <div
      ref={containerRef}
      className={`relative w-full overflow-hidden rounded-[28px] bg-[#f5efe6] ${className ?? "h-[420px]"}`}
    >
      <div className="absolute left-6 right-6 top-4 rounded-2xl bg-white/90 px-5 py-3 text-center text-sm font-semibold text-stone-800 shadow-sm">
        {bannerText}
      </div>

      {phase === "intro" ? (
        <div className="absolute left-1/2 top-20 w-[86%] max-w-[520px] -translate-x-1/2">
          <button
            type="button"
            onClick={beginMicCapture}
            className="flex w-full items-center justify-center gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700 shadow-sm transition hover:bg-red-100"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-red-500 text-white">
              <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
                <path
                  d="M12 14a3 3 0 0 0 3-3V6a3 3 0 1 0-6 0v5a3 3 0 0 0 3 3zm5-3a5 5 0 0 1-10 0H5a7 7 0 0 0 14 0h-2zm-6.5 8h3v-2h-3v2z"
                  fill="currentColor"
                />
              </svg>
            </span>
            <span>{listening ? "Listening..." : "Please read the above sentence"}</span>
          </button>
          {micError ? (
            <p className="mt-2 text-center text-xs font-medium text-red-600">
              {micError}
            </p>
          ) : null}
        </div>
      ) : null}

      {instructionText ? (
        <div className="absolute left-1/2 top-[104px] -translate-x-1/2 rounded-full bg-red-600 px-6 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white shadow-md">
          {instructionText}
        </div>
      ) : null}

      <div className="absolute left-8 right-8 top-36 h-[3px] rounded-full bg-white/80" />

      <div className="absolute inset-x-0 bottom-4 top-36">
        <div className="absolute inset-0 rounded-[26px] bg-[radial-gradient(circle_at_top,#f2e6d7_0%,#efe0cd_55%,#e6d5bf_100%)]" />
        <div className="absolute left-8 right-8 top-6 h-[1px] bg-white/70" />

        <div className="absolute left-8 top-8 flex flex-col gap-6">
          {rodOrder.map((rod) => {
            const length = metrics.rodLengths[rod.id];
            const height = metrics.rodHeight;
            const target = slotPositions[rod.id];
            return (
              <div
                key={rod.id}
                className="rounded-full border border-dashed border-amber-300/70 bg-white/60"
                style={{
                  width: length + 8,
                  height: height + 8,
                  padding: 4,
                  opacity: placed[rod.id] ? 0.3 : 1,
                  transform: `translate(${target?.x ?? 0}px, ${target?.y ?? 0}px)`,
                }}
              />
            );
          })}
        </div>

        {rodOrder.map((rod) => {
          const length = metrics.rodLengths[rod.id];
          const height = metrics.rodHeight;
          const position = rodPositions[rod.id] ?? { x: 0, y: 0 };
          const canDrag = playing && activeRodId === rod.id && !placed[rod.id];
          const animate = demoRodId === rod.id;
          return (
            <Draggable
              key={rod.id}
              nodeRef={rodNodeRefs[rod.id]}
              position={position}
              bounds="parent"
              disabled={!canDrag}
              onDrag={(_, data) => handleRodDrag(rod.id, data)}
              onStop={(_, data) => handleRodStop(rod.id, data)}
            >
              <div
                ref={rodNodeRefs[rod.id]}
                className={`absolute cursor-${canDrag ? "grab" : "default"} active:cursor-grabbing`}
                style={{
                  width: length,
                  height,
                  transition: animate ? "transform 0.7s ease" : "none",
                }}
              >
                <div className="flex h-full rounded-full shadow-md">
                  {Array.from({ length: rod.id }).map((_, index) => (
                    <div
                      key={index}
                      className="h-full"
                      style={{
                        width: metrics.segmentLength,
                        backgroundColor: index % 2 === 0 ? "#d14b3a" : "#2f67c1",
                        borderRadius:
                          index === 0
                            ? "999px 0 0 999px"
                            : index === rod.id - 1
                              ? "0 999px 999px 0"
                              : "0",
                      }}
                    />
                  ))}
                </div>
              </div>
            </Draggable>
          );
        })}
      </div>

      {successVisible ? <SuccessOverlay fadeOut={successFade} /> : null}
    </div>
  );
}
