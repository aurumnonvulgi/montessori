"use client";

import { useCallback, useState } from "react";
import NumberRodsScene from "./NumberRodsScene";

export default function NumberRodsLesson() {
  const [lessonStarted, setLessonStarted] = useState(false);
  const [resetKey, setResetKey] = useState(0);

  const startLesson = useCallback(() => {
    setLessonStarted(true);
    setResetKey((value) => value + 1);

    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      const utterance = new SpeechSynthesisUtterance(" ");
      utterance.volume = 0;
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(utterance);
    }
  }, []);

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,#f5efe6_0%,#fdfbf8_45%,#f7efe4_100%)]">
      <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-6 px-6 py-12 sm:px-10">
        <div className="flex items-center justify-end gap-3 text-[10px] uppercase tracking-[0.3em] text-stone-400">
          <span>Three-Period Lesson</span>
          <span>Number Rods</span>
        </div>

        <NumberRodsScene
          key={resetKey}
          playing={lessonStarted}
          voiceEnabled={lessonStarted}
          className="h-[70vh] min-h-[520px]"
        />

        <button
          type="button"
          onClick={startLesson}
          className="mt-auto w-full rounded-3xl bg-stone-900 py-4 text-sm font-semibold uppercase tracking-[0.25em] text-white shadow-lg transition hover:bg-stone-800"
        >
          Start
        </button>
      </main>
    </div>
  );
}
