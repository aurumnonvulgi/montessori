"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import SandpaperNumeralsScene from "./SandpaperNumeralsScene";

function PlayIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6">
      <path d="M8 5v14l11-7z" />
    </svg>
  );
}

function HomeIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  );
}

function BackIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
      <path d="M19 12H5M12 19l-7-7 7-7" />
    </svg>
  );
}

function RestartIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
      <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
      <path d="M3 3v5h5" />
    </svg>
  );
}

export default function SandpaperNumeralsLesson() {
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

    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      const utterance = new SpeechSynthesisUtterance(" ");
      utterance.volume = 0;
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(utterance);
    }
  }, [clearConfettiTimers]);

  const restartLesson = useCallback(() => {
    setLessonStarted(false);
    setResetKey((value) => value + 1);
    setConfettiVisible(false);
    setFadeOut(false);
    clearConfettiTimers();
  }, [clearConfettiTimers]);

  const goBack = useCallback(() => {
    router.back();
  }, [router]);

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
        window.localStorage.setItem("sandpaper-numerals-complete", "true");
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
    <div className="fixed inset-0 overflow-hidden bg-[radial-gradient(circle_at_top,#f5efe6_0%,#fdfbf8_45%,#f7efe4_100%)]">
      {/* Mobile: Right sidebar */}
      <div className="fixed right-0 top-0 z-10 flex h-full w-12 flex-col items-center justify-center gap-4 bg-white/80 shadow-lg backdrop-blur-sm sm:hidden">
        {!lessonStarted ? (
          <button
            type="button"
            onClick={startLesson}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-[#cf5f5f] text-white shadow-md transition hover:bg-[#c15454]"
            aria-label="Start"
          >
            <PlayIcon />
          </button>
        ) : (
          <button
            type="button"
            onClick={restartLesson}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-stone-200 text-stone-600 shadow-md transition hover:bg-stone-300"
            aria-label="Restart"
          >
            <RestartIcon />
          </button>
        )}
        <button
          type="button"
          onClick={goBack}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-stone-200 text-stone-600 shadow-md transition hover:bg-stone-300"
          aria-label="Back"
        >
          <BackIcon />
        </button>
        <button
          type="button"
          onClick={goHome}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-stone-200 text-stone-600 shadow-md transition hover:bg-stone-300"
          aria-label="Home"
        >
          <HomeIcon />
        </button>
      </div>

      {/* Main content */}
      <main className="flex h-full flex-col pr-12 sm:pr-0">
        {/* Desktop header */}
        <div className="hidden items-center justify-end gap-3 px-6 py-4 text-[10px] uppercase tracking-[0.3em] text-stone-400 sm:flex sm:px-10">
          <span>Three-Period Lesson</span>
          <span>Sandpaper Numerals</span>
        </div>

        {/* Scene container - fills available space */}
        <div className="flex-1 px-2 pb-2 sm:px-6 sm:pb-4">
          <SandpaperNumeralsScene
            key={resetKey}
            playing={lessonStarted}
            voiceEnabled={lessonStarted}
            onLessonComplete={handleLessonComplete}
            className="h-full w-full"
          />
        </div>

        {/* Desktop bottom button */}
        <div className="hidden px-6 pb-6 sm:block sm:px-10">
          {!lessonStarted ? (
            <button
              type="button"
              onClick={startLesson}
              className="w-full rounded-3xl bg-[#cf5f5f] py-4 text-sm font-semibold uppercase tracking-[0.25em] text-white shadow-lg transition hover:bg-[#c15454]"
            >
              Start
            </button>
          ) : (
            <button
              type="button"
              onClick={goHome}
              className="w-full rounded-3xl bg-[#2f67c1] py-4 text-sm font-semibold uppercase tracking-[0.25em] text-white shadow-lg transition hover:bg-[#295aad]"
            >
              Home
            </button>
          )}
        </div>
      </main>

      {confettiVisible ? (
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
