"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const numerals = ["1", "2", "3"];
const numeralWords = ["one", "two", "three"];

type CardState = {
  isActive: boolean;
  isCompleted: boolean;
  isStacked: boolean;
  isTracing: boolean;
};

const stackOffsets = [
  { x: 0, y: 0, rotate: -2 },
  { x: 14, y: -8, rotate: 1 },
  { x: 28, y: -16, rotate: -1 },
];

const leftSlots = [
  { left: "20%", top: "70%" },
  { left: "35%", top: "70%" },
  { left: "50%", top: "70%" },
];

const centerSlot = { left: "66%", top: "64%" };
const stackSlot = { left: "22%", top: "56%" };

export default function SandpaperNumeralsLesson() {
  const [lessonStarted, setLessonStarted] = useState(false);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [tracingIndex, setTracingIndex] = useState<number | null>(null);
  const [completedCount, setCompletedCount] = useState(0);
  const [caption, setCaption] = useState(
    "Tap start to introduce the first three numerals.",
  );
  const timeoutsRef = useRef<number[]>([]);

  const clearTimers = useCallback(() => {
    timeoutsRef.current.forEach((timeout) => window.clearTimeout(timeout));
    timeoutsRef.current = [];
  }, []);

  const schedule = useCallback(
    (delay: number, action: () => void) => {
      const timeout = window.setTimeout(action, delay);
      timeoutsRef.current.push(timeout);
    },
    [],
  );

  const startLesson = useCallback(() => {
    clearTimers();
    setLessonStarted(true);
    setActiveIndex(0);
    setTracingIndex(null);
    setCompletedCount(0);
    setCaption("This is one.");

    let cursor = 400;

    numerals.forEach((_, index) => {
      schedule(cursor, () => {
        setActiveIndex(index);
        setTracingIndex(null);
        setCaption(`This is ${numeralWords[index]}.`);
      });
      cursor += 450;

      schedule(cursor, () => {
        setTracingIndex(index);
      });
      cursor += 1500;

      schedule(cursor, () => {
        setTracingIndex(null);
        setCompletedCount(index + 1);
      });
      cursor += 500;
    });

    schedule(cursor, () => {
      setActiveIndex(null);
      setCaption("Ready for the next period of the lesson.");
    });
  }, [clearTimers, schedule]);

  useEffect(() => {
    return () => {
      clearTimers();
    };
  }, [clearTimers]);

  const getCardState = (index: number): CardState => {
    if (!lessonStarted) {
      return {
        isActive: false,
        isCompleted: false,
        isStacked: true,
        isTracing: false,
      };
    }

    const isActive = activeIndex === index;
    const isCompleted = completedCount > index;
    const isStacked = activeIndex === null ? !isCompleted : index > activeIndex;
    return {
      isActive,
      isCompleted,
      isStacked,
      isTracing: tracingIndex === index,
    };
  };

  const getCardStyle = (index: number, state: CardState) => {
    if (state.isActive) {
      return {
        left: centerSlot.left,
        top: centerSlot.top,
        transform: "translate(-50%, -50%) scale(1.04)",
      };
    }

    if (state.isCompleted) {
      return {
        left: leftSlots[index]?.left ?? "20%",
        top: leftSlots[index]?.top ?? "70%",
        transform: "translate(-50%, -50%) rotate(-2deg)",
      };
    }

    const offset = stackOffsets[index] ?? stackOffsets[0];
    return {
      left: stackSlot.left,
      top: stackSlot.top,
      transform: `translate(calc(-50% + ${offset.x}px), calc(-50% + ${offset.y}px)) rotate(${offset.rotate}deg)`,
    };
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,#f5efe6_0%,#fdfbf8_45%,#f7efe4_100%)]">
      <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-6 px-6 py-12 sm:px-10">
        <div className="flex items-center justify-end gap-3 text-[10px] uppercase tracking-[0.3em] text-stone-400">
          <span>Three-Period Lesson</span>
          <span>Sandpaper Numerals</span>
        </div>

        <div className="relative h-[62vh] min-h-[470px] w-full overflow-hidden rounded-[28px] bg-[#f7efe4] shadow-[0_35px_80px_-60px_rgba(70,45,20,0.8)]">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,#f5efe6_0%,#f2e7d6_55%,#ede0cc_100%)]" />

          <div className="absolute left-6 top-6 h-28 w-36 rounded-2xl bg-[#d4b08a] shadow-[0_22px_40px_-28px_rgba(74,48,22,0.9)]">
            <div className="absolute bottom-3 right-3 h-16 w-20 rounded-xl bg-[#1f7a3c] text-center text-4xl font-semibold text-stone-100 shadow-[0_14px_26px_-18px_rgba(0,0,0,0.8)]">
              3
            </div>
            <div className="absolute bottom-5 right-6 h-16 w-20 rounded-xl bg-[#1f6f36] text-center text-4xl font-semibold text-stone-100/80 shadow-[0_14px_26px_-18px_rgba(0,0,0,0.7)]">
              2
            </div>
            <div className="absolute bottom-7 right-9 h-16 w-20 rounded-xl bg-[#1b6431] text-center text-4xl font-semibold text-stone-100/70 shadow-[0_14px_26px_-18px_rgba(0,0,0,0.6)]">
              1
            </div>
          </div>

          {numerals.map((value, index) => {
            const state = getCardState(index);
            const isFaceUp = state.isActive || state.isTracing;
            return (
              <div
                key={value}
                className={`absolute h-40 w-32 rounded-2xl border border-emerald-900/30 bg-[#1f7a3c] shadow-[0_24px_50px_-30px_rgba(30,20,10,0.9)] transition-all duration-700 ${
                  state.isCompleted ? "bg-[#1a5f32]" : "bg-[#1f7a3c]"
                } ${state.isTracing ? "ring-2 ring-amber-200 shadow-[0_0_24px_rgba(245,204,123,0.5)]" : ""}`}
                style={getCardStyle(index, state)}
              >
                <div
                  className={`flex h-full w-full items-center justify-center font-display text-6xl font-semibold ${
                    isFaceUp ? "text-stone-100" : "text-stone-100/0"
                  }`}
                >
                  {value}
                </div>
              </div>
            );
          })}
        </div>

        <div className="text-center text-sm text-stone-500">{caption}</div>

        {!lessonStarted ? (
          <button
            type="button"
            onClick={startLesson}
            className="mt-auto w-full rounded-3xl bg-[#cf5f5f] py-4 text-sm font-semibold uppercase tracking-[0.25em] text-white shadow-lg transition hover:bg-[#c15454]"
          >
            Start
          </button>
        ) : null}
      </main>
    </div>
  );
}
