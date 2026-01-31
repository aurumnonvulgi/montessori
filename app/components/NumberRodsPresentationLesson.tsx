"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import NumberRodsPresentationCanvas from "./NumberRodsPresentationCanvas";
import HomeLink from "./HomeLink";

const CompletionCheck = () => (
  <div className="flex h-full items-center justify-center">
    <div className="flex h-32 w-32 items-center justify-center rounded-full bg-white/85 shadow-lg">
      <svg viewBox="0 0 120 120" className="h-20 w-20">
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
);

export default function NumberRodsPresentationLesson() {
  const router = useRouter();
  const [lessonStarted, setLessonStarted] = useState(false);
  const [resetKey, setResetKey] = useState(0);
  const [confettiVisible, setConfettiVisible] = useState(false);
  const [fadeOut, setFadeOut] = useState(false);
  const fadeTimerRef = useRef<number | null>(null);
  const advanceTimerRef = useRef<number | null>(null);

  const clearConfettiTimers = useCallback(() => {
    if (fadeTimerRef.current) {
      window.clearTimeout(fadeTimerRef.current);
      fadeTimerRef.current = null;
    }
    if (advanceTimerRef.current) {
      window.clearTimeout(advanceTimerRef.current);
      advanceTimerRef.current = null;
    }
  }, []);

  const startLesson = useCallback(() => {
    clearConfettiTimers();
    setLessonStarted(true);
    setResetKey((value) => value + 1);
    setConfettiVisible(false);
    setFadeOut(false);
  }, [clearConfettiTimers]);

  const goHome = useCallback(() => {
    router.push("/");
  }, [router]);

  const handleLessonComplete = useCallback(() => {
    clearConfettiTimers();
    setConfettiVisible(true);
    setFadeOut(false);

    fadeTimerRef.current = window.setTimeout(() => {
      setFadeOut(true);
    }, 2600);

    advanceTimerRef.current = window.setTimeout(() => {
      setConfettiVisible(false);
      setFadeOut(false);
      if (typeof window !== "undefined") {
        window.localStorage.setItem("number-rods-presentation-complete", "true");
      }
      router.push("/");
    }, 3400);
  }, [clearConfettiTimers, router]);

  useEffect(() => {
    return () => {
      clearConfettiTimers();
    };
  }, [clearConfettiTimers]);

  return (
    <div className="relative min-h-screen bg-[radial-gradient(circle_at_top,#f5efe6_0%,#fdfbf8_45%,#f7efe4_100%)]">
      <HomeLink />
      <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-6 px-6 py-12 sm:px-10">
        <div className="flex items-center justify-end gap-3 text-[10px] uppercase tracking-[0.3em] text-stone-400">
          <span>Three-Period Lesson</span>
          <span>Number Rods Presentation</span>
        </div>

        <NumberRodsPresentationCanvas
          key={resetKey}
          playing={lessonStarted}
          voiceEnabled={lessonStarted}
          onComplete={handleLessonComplete}
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
        ) : (
          <button
            type="button"
            onClick={goHome}
            className="mt-auto w-full rounded-3xl bg-[#2f67c1] py-4 text-sm font-semibold uppercase tracking-[0.25em] text-white shadow-lg transition hover:bg-[#295aad]"
          >
            Home
          </button>
        )}
      </main>
      {confettiVisible ? (
        <div className={`lesson-complete-overlay${fadeOut ? " fade-out" : ""}`}>
          <CompletionCheck />
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
