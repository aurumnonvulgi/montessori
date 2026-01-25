"use client";

import { useCallback, useState } from "react";
import NumberRodsScene from "./NumberRodsScene";

export default function NumberRodsLesson() {
  const [lessonStarted, setLessonStarted] = useState(false);
  const [resetKey, setResetKey] = useState(0);

  const startLesson = useCallback(() => {
    setLessonStarted(true);
    setResetKey((value) => value + 1);
  }, []);

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,#f5efe6_0%,#fdfbf8_45%,#f7efe4_100%)]">
      <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-6 px-6 py-12 sm:px-10">
        <div className="flex items-center justify-between">
          <a
            href="/"
            className="rounded-full border border-stone-200 bg-white px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-stone-500"
          >
            Home
          </a>
          <div className="flex items-center gap-3">
            {!lessonStarted ? (
              <button
                type="button"
                onClick={startLesson}
                className="rounded-full bg-stone-900 px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-white"
              >
                Start lesson
              </button>
            ) : null}
            <span className="rounded-full border border-stone-200 bg-white px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-stone-500">
              {lessonStarted ? "Audio on" : "Audio ready"}
            </span>
            <span className="rounded-full border border-stone-200 bg-white px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-stone-500">
              Three-Period Lesson
            </span>
            <span className="text-[10px] uppercase tracking-[0.3em] text-stone-400">
              Number Rods
            </span>
          </div>
        </div>

        <NumberRodsScene
          key={resetKey}
          playing={lessonStarted}
          voiceEnabled={lessonStarted}
          className="h-[70vh] min-h-[520px]"
        />
      </main>
    </div>
  );
}
