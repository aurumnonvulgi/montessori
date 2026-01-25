"use client";

import { useCallback, useState } from "react";
import SandpaperNumeralsScene from "./SandpaperNumeralsScene";

export default function SandpaperNumeralsLesson() {
  const [lessonStarted, setLessonStarted] = useState(false);
  const [resetKey, setResetKey] = useState(0);

  const startLesson = useCallback(() => {
    setLessonStarted(true);
    setResetKey((value) => value + 1);
  }, []);

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,#f5efe6_0%,#fdfbf8_45%,#f7efe4_100%)]">
      <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-6 px-6 py-12 sm:px-10">
        <div className="flex items-center justify-end gap-3 text-[10px] uppercase tracking-[0.3em] text-stone-400">
          <span>Three-Period Lesson</span>
          <span>Sandpaper Numerals</span>
        </div>

        <SandpaperNumeralsScene
          key={resetKey}
          playing={lessonStarted}
          className="h-[68vh] min-h-[500px]"
        />

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
