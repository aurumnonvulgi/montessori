"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import NumberRodsScene from "./NumberRodsScene";

export default function NumberRodsLesson() {
  const router = useRouter();
  const [lessonStarted, setLessonStarted] = useState(false);
  const [resetKey, setResetKey] = useState(0);
  const [lessonComplete, setLessonComplete] = useState(false);
  const [fadeOut, setFadeOut] = useState(false);

  const startLesson = useCallback(() => {
    setLessonStarted(true);
    setResetKey((value) => value + 1);
    setLessonComplete(false);
    setFadeOut(false);

    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      const utterance = new SpeechSynthesisUtterance(" ");
      utterance.volume = 0;
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(utterance);
    }
  }, []);

  useEffect(() => {
    if (!lessonComplete) {
      return;
    }

    setFadeOut(false);

    const fadeTimer = window.setTimeout(() => {
      setFadeOut(true);
    }, 2600);

    const navTimer = window.setTimeout(() => {
      router.push("/");
    }, 3400);

    return () => {
      window.clearTimeout(fadeTimer);
      window.clearTimeout(navTimer);
    };
  }, [lessonComplete, router]);

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
          onQuizComplete={() => setLessonComplete(true)}
          className="h-[70vh] min-h-[520px]"
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
      {lessonComplete ? (
        <div className={`lesson-complete-overlay${fadeOut ? " fade-out" : ""}`}>
          <div className="lesson-complete-confetti">
            {Array.from({ length: 16 }).map((_, index) => (
              <span key={index} className="confetti-piece" />
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
