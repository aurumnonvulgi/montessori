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
import { getPreferredVoice, primeSpeechVoices } from "../lib/speech";
import { getVoiceEnabled, getVoiceVolume } from "../lib/voicePreferences";

type NumberRodsPresentationCanvasProps = {
  playing: boolean;
  voiceEnabled: boolean;
  micEnabled?: boolean;
  className?: string;
  onComplete?: () => void;
};

type RodId = 1 | 2 | 3;

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

const INTRO_SENTENCE = "I will introduce to you the number rods.";
const rodOrder: { id: RodId; word: string }[] = [
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

const isIntroMatch = (transcript: string) => {
  const normalized = normalizeText(transcript);
  const expected = normalizeText(INTRO_SENTENCE);
  if (!normalized) {
    return false;
  }
  if (normalized === expected) {
    return true;
  }
  const expectedWords = expected.split(" ");
  const spokenWords = new Set(normalized.split(" "));
  const matchCount = expectedWords.filter((word) => spokenWords.has(word)).length;
  if (matchCount / expectedWords.length >= 0.5) {
    return true;
  }
  const keywordMatch = ["introduce", "number", "rods"].every((word) =>
    spokenWords.has(word),
  );
  return keywordMatch;
};

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

const MicOverlay = ({ state }: { state: "listening" | "success" }) => {
  const isSuccess = state === "success";
  return (
    <div className="absolute inset-0 z-20">
      <div
        className={`absolute inset-0 ${
          isSuccess ? "bg-emerald-400/25" : "bg-red-400/25"
        }`}
      />
      <div className="absolute inset-0 flex items-center justify-center">
        <div
          className={`flex h-28 w-28 items-center justify-center rounded-full ${
            isSuccess ? "bg-white/85" : "bg-red-500 text-white"
          } shadow-xl`}
        >
          {isSuccess ? (
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
          ) : (
            <span className="flex h-12 w-12 animate-pulse items-center justify-center rounded-full bg-white/15">
              <svg viewBox="0 0 24 24" className="h-6 w-6" aria-hidden="true">
                <path
                  d="M12 14a3 3 0 0 0 3-3V6a3 3 0 1 0-6 0v5a3 3 0 0 0 3 3zm5-3a5 5 0 0 1-10 0H5a7 7 0 0 0 14 0h-2zm-6.5 8h3v-2h-3v2z"
                  fill="currentColor"
                />
              </svg>
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default function NumberRodsPresentationCanvas({
  playing,
  voiceEnabled,
  micEnabled = true,
  className,
  onComplete,
}: NumberRodsPresentationCanvasProps) {
  const matRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const demoTimerRef = useRef<number | null>(null);
  const successTimerRef = useRef<number | null>(null);
  const introSuccessTimerRef = useRef<number | null>(null);
  const introSequenceRef = useRef(false);
  const retryRecognitionRef = useRef(false);
  const fadeTimerRef = useRef<number | null>(null);
  const retryTimerRef = useRef<number | null>(null);
  const startRecognitionRef = useRef<() => void>(() => {});
  const initialPositionsRef = useRef<Record<RodId, Position>>(
    {} as Record<RodId, Position>,
  );
  const [layout, setLayout] = useState({ width: 0, height: 0 });
  const [phase, setPhase] = useState<Phase>("intro");
  const [rodPositions, setRodPositions] = useState<Record<RodId, Position>>(
    {} as Record<RodId, Position>,
  );
  const [placed, setPlaced] = useState<Record<RodId, boolean>>({
    1: false,
    2: false,
    3: false,
  });
  const [micError, setMicError] = useState("");
  const [micOverlayState, setMicOverlayState] = useState<"idle" | "listening" | "success">(
    "idle",
  );
  const [successVisible, setSuccessVisible] = useState(false);
  const [successFade, setSuccessFade] = useState(false);
  const rodNodeRefs = useMemo(() => {
    const refs = {} as Record<RodId, RefObject<HTMLDivElement>>;
    rodOrder.forEach((rod) => {
      refs[rod.id] = createRef<HTMLDivElement>() as RefObject<HTMLDivElement>;
    });
    return refs;
  }, []);

  const metrics = useMemo(() => {
    const minSide = Math.min(layout.width || 600, layout.height || 420);
    const segmentLength = Math.max(38, Math.min(minSide * 0.18, 74));
    const rodHeight = Math.max(14, Math.min(minSide * 0.06, 22));
    const rodLengths: Record<RodId, number> = {
      1: segmentLength,
      2: segmentLength * 2,
      3: segmentLength * 3,
    };
    return { segmentLength, rodHeight, rodLengths };
  }, [layout]);

  const slotPositions = useMemo(() => {
    if (!layout.width || !layout.height) {
      return {} as Record<RodId, Position>;
    }
    const slotX = Math.max(
      24,
      (layout.width - (metrics.rodLengths[3] + 8)) / 2,
    );
    const slotY = layout.height * 0.33;
    const slotGap = metrics.rodHeight * 1.25;
    return {
      1: { x: slotX, y: slotY },
      2: { x: slotX, y: slotY + slotGap },
      3: { x: slotX, y: slotY + slotGap * 2 },
    } as Record<RodId, Position>;
  }, [layout, metrics.rodHeight, metrics.rodLengths]);

  const startPositions = useMemo(() => {
    if (!layout.width || !layout.height) {
      return {} as Record<RodId, Position>;
    }
    const clampY = (value: number) =>
      Math.min(layout.height - metrics.rodHeight - 8, Math.max(8, value));
    const bottomY = clampY(layout.height - metrics.rodHeight * 2.2);
    const safeX = (ratio: number, rodLength: number) => {
      const raw = layout.width * ratio;
      return Math.min(
        layout.width - rodLength - 16,
        Math.max(16, raw),
      );
    };
    return {
      1: { x: safeX(0.6, metrics.rodLengths[1]), y: bottomY },
      2: {
        x: safeX(0.2, metrics.rodLengths[2]),
        y: clampY(bottomY + metrics.rodHeight * 1.1),
      },
      3: {
        x: safeX(0.42, metrics.rodLengths[3]),
        y: clampY(bottomY - metrics.rodHeight * 1.0),
      },
    } as Record<RodId, Position>;
  }, [layout, metrics.rodHeight, metrics.rodLengths]);

  const activeRodId: RodId | null =
    phase === "rod1-place" ? 1 : phase === "rod2-place" ? 2 : phase === "rod3-place" ? 3 : null;
  const demoRodId: RodId | null =
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

  const [typedSentence, setTypedSentence] = useState(INTRO_SENTENCE);
  const typingTimerRef = useRef<number | null>(null);

  const clearTimers = useCallback(() => {
    if (demoTimerRef.current) {
      window.clearTimeout(demoTimerRef.current);
      demoTimerRef.current = null;
    }
    if (successTimerRef.current) {
      window.clearTimeout(successTimerRef.current);
      successTimerRef.current = null;
    }
    if (introSuccessTimerRef.current) {
      window.clearTimeout(introSuccessTimerRef.current);
      introSuccessTimerRef.current = null;
    }
    if (fadeTimerRef.current) {
      window.clearTimeout(fadeTimerRef.current);
      fadeTimerRef.current = null;
    }
    if (retryTimerRef.current) {
      window.clearTimeout(retryTimerRef.current);
      retryTimerRef.current = null;
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
    const element = matRef.current;
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
    if (typingTimerRef.current) {
      window.clearInterval(typingTimerRef.current);
      typingTimerRef.current = null;
    }

    if (!playing) {
      setTypedSentence(INTRO_SENTENCE);
      return;
    }

    if (phase !== "intro") {
      setTypedSentence(bannerText);
      return;
    }

    setTypedSentence("");
    let index = 0;
    typingTimerRef.current = window.setInterval(() => {
      index += 1;
      setTypedSentence(INTRO_SENTENCE.slice(0, index));
      if (index >= INTRO_SENTENCE.length) {
        if (typingTimerRef.current) {
          window.clearInterval(typingTimerRef.current);
          typingTimerRef.current = null;
        }
      }
    }, 28);

    return () => {
      if (typingTimerRef.current) {
        window.clearInterval(typingTimerRef.current);
        typingTimerRef.current = null;
      }
    };
  }, [bannerText, phase, playing]);

  useEffect(() => {
    if (!layout.width || !layout.height) {
      return;
    }
    initialPositionsRef.current = startPositions;
    setRodPositions(startPositions);
    setPlaced({ 1: false, 2: false, 3: false });
    setPhase("intro");
    setMicError("");
    setMicOverlayState("idle");
    introSequenceRef.current = false;
  }, [layout.width, layout.height, startPositions]);

  useEffect(() => {
    clearTimers();
    if (!playing) {
      setPhase("intro");
      setRodPositions(startPositions);
      setPlaced({ 1: false, 2: false, 3: false });
      setMicError("");
      setMicOverlayState("idle");
      introSequenceRef.current = false;
      retryRecognitionRef.current = false;
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {
          // ignore
        }
        recognitionRef.current = null;
      }
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

  useEffect(() => {
    if (micEnabled) {
      return;
    }
    retryRecognitionRef.current = false;
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // ignore
      }
      recognitionRef.current = null;
    }
    setMicError("");
    setMicOverlayState("idle");
  }, [micEnabled]);

  const playBeep = useCallback(() => {
    if (typeof window === "undefined") {
      return;
    }
    const audioWindow = window as Window & {
      webkitAudioContext?: typeof AudioContext;
    };
    const AudioContextConstructor = audioWindow.AudioContext ?? audioWindow.webkitAudioContext;
    if (!AudioContextConstructor) {
      return;
    }
    const context = new AudioContextConstructor();
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = "sine";
    oscillator.frequency.value = 880;
    gain.gain.value = 0.12;
    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start();
    oscillator.stop(context.currentTime + 0.22);
    oscillator.onended = () => {
      context.close().catch(() => undefined);
    };
  }, []);

  const startRecognition = useCallback(() => {
    if (!micEnabled) {
      setMicError("");
      setMicOverlayState("idle");
      return;
    }
    if (!playing || phase !== "intro") {
      return;
    }
    if (typeof window === "undefined") {
      return;
    }
    const speechWindow = window as Window & {
      SpeechRecognition?: typeof SpeechRecognition;
      webkitSpeechRecognition?: typeof SpeechRecognition;
    };
    const SpeechRecognitionConstructor =
      speechWindow.SpeechRecognition ?? speechWindow.webkitSpeechRecognition;

    if (!SpeechRecognitionConstructor) {
      setMicError("Speech recognition is not supported in this browser.");
      setMicOverlayState("idle");
      return;
    }

    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // ignore
      }
    }

    const recognition = new SpeechRecognitionConstructor();
    recognition.lang = "en-US";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    retryRecognitionRef.current = true;

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const transcript = event.results?.[0]?.[0]?.transcript ?? "";
      if (isIntroMatch(transcript)) {
        setMicError("");
        retryRecognitionRef.current = false;
        setMicOverlayState("success");
        if (introSuccessTimerRef.current) {
          window.clearTimeout(introSuccessTimerRef.current);
        }
        introSuccessTimerRef.current = window.setTimeout(() => {
          setMicOverlayState("idle");
          setPhase("rod1-demo");
        }, 850);
      } else {
        setMicError("Try reading the sentence again.");
        setMicOverlayState("listening");
        retryRecognitionRef.current = true;
      }
    };

    recognition.onerror = () => {
      setMicError("Microphone error. Please try again.");
      setMicOverlayState("idle");
      retryRecognitionRef.current = false;
    };

    recognition.onend = () => {
      recognitionRef.current = null;
      if (retryRecognitionRef.current && playing && phase === "intro") {
        if (retryTimerRef.current) {
          window.clearTimeout(retryTimerRef.current);
        }
        retryTimerRef.current = window.setTimeout(() => {
          startRecognitionRef.current?.();
        }, 350);
      }
    };

    recognitionRef.current = recognition;
    setMicOverlayState("listening");
    recognition.start();
  }, [micEnabled, phase, playing]);

  useEffect(() => {
    startRecognitionRef.current = startRecognition;
  }, [startRecognition]);

  const startIntroSequence = useCallback(() => {
    if (!playing || phase !== "intro" || introSequenceRef.current) {
      return;
    }
    introSequenceRef.current = true;
    setMicError("");
    const speakLine = (text: string, rate = 0.9) =>
      new Promise<void>((resolve) => {
        if (!voiceEnabled || typeof window === "undefined" || !("speechSynthesis" in window)) {
          resolve();
          return;
        }
        if (!getVoiceEnabled()) {
          resolve();
          return;
        }
        const masterVoiceVolume = getVoiceVolume();
        if (masterVoiceVolume <= 0) {
          resolve();
          return;
        }
        const utterance = new SpeechSynthesisUtterance(text);
        const preferredVoice = getPreferredVoice("en-US");
        if (preferredVoice) {
          utterance.voice = preferredVoice;
        }
        utterance.rate = rate;
        utterance.pitch = 0.95;
        utterance.volume = Math.max(0, Math.min(1, 0.9 * masterVoiceVolume));
        utterance.onend = () => resolve();
        utterance.onerror = () => resolve();
        window.speechSynthesis.cancel();
        window.speechSynthesis.speak(utterance);
      });
    const pause = (ms: number) =>
      new Promise<void>((resolve) => {
        if (typeof window === "undefined") {
          resolve();
          return;
        }
        window.setTimeout(resolve, ms);
      });

    const run = async () => {
      if (micEnabled) {
        await speakLine("Please repeat after me.");
        await pause(900);
      }
      await speakLine(INTRO_SENTENCE, 0.75);
      if (micEnabled) {
        playBeep();
        window.setTimeout(() => {
          startRecognition();
        }, 250);
        return;
      }
      window.setTimeout(() => {
        setPhase("rod1-demo");
      }, 450);
    };

    run().catch(() => undefined);
  }, [micEnabled, phase, playBeep, playing, startRecognition, voiceEnabled]);

  const handleRodDrag = useCallback(
    (rodId: RodId, data: { x: number; y: number }) => {
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
    (rodId: RodId, data: { x: number; y: number }) => {
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

  const showCaret = phase === "intro" && playing && typedSentence.length < INTRO_SENTENCE.length;

  useEffect(() => {
    primeSpeechVoices();
  }, []);

  useEffect(() => {
    if (phase === "intro" && playing) {
      startIntroSequence();
    }
  }, [phase, playing, startIntroSequence]);

  return (
    <div
      className={`relative w-full overflow-hidden rounded-[28px] bg-[#f5efe6] ${className ?? "h-[420px]"}`}
    >
      <div className="absolute left-6 right-6 top-4 rounded-2xl bg-white/90 px-6 py-4 text-center text-xl font-semibold text-stone-800 shadow-sm md:text-2xl">
        <span>{phase === "intro" ? typedSentence : bannerText}</span>
        {showCaret ? (
          <span className="ml-1 inline-block h-4 w-[2px] animate-pulse bg-stone-500 align-middle md:h-5" />
        ) : null}
      </div>

      {phase === "intro" && micEnabled && micError ? (
        <div className="absolute left-1/2 top-24 w-[86%] max-w-[520px] -translate-x-1/2 text-center text-xs font-medium text-red-600">
          {micError}
        </div>
      ) : null}

      {instructionText ? (
        <div className="absolute left-1/2 top-[104px] -translate-x-1/2 rounded-full bg-red-600 px-6 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white shadow-md">
          {instructionText}
        </div>
      ) : null}

      <div className="absolute left-8 right-8 top-36 h-[3px] rounded-full bg-white/80" />

      <div ref={matRef} className="absolute inset-x-0 bottom-4 top-36">
        <div className="absolute inset-0 rounded-[26px] bg-[radial-gradient(circle_at_top,#f2e6d7_0%,#efe0cd_55%,#e6d5bf_100%)]" />
        <div className="absolute left-8 right-8 top-6 h-[1px] bg-white/70" />

        <div className="absolute left-0 top-0">
          {rodOrder.map((rod) => {
            const length = metrics.rodLengths[rod.id];
            const height = metrics.rodHeight;
            const target = slotPositions[rod.id];
            return (
              <div
                key={rod.id}
                className="rounded-md border border-dashed border-amber-300/70 bg-white/60"
                style={{
                  width: length + 8,
                  height: height + 8,
                  padding: 2,
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
                <div className="flex h-full shadow-md">
                  {Array.from({ length: rod.id }).map((_, index) => (
                    <div
                      key={index}
                      className="h-full"
                      style={{
                        width: metrics.segmentLength,
                        backgroundColor: index % 2 === 0 ? "#d14b3a" : "#2f67c1",
                      }}
                    />
                  ))}
                </div>
              </div>
            </Draggable>
          );
        })}
      </div>

      {micEnabled && micOverlayState !== "idle" ? (
        <MicOverlay state={micOverlayState === "success" ? "success" : "listening"} />
      ) : null}

      {successVisible ? <SuccessOverlay fadeOut={successFade} /> : null}
    </div>
  );
}
