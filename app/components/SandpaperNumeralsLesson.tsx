"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import SandpaperNumeralsScene from "./SandpaperNumeralsScene";
import HomeLink from "./HomeLink";
import { useMicrophoneEnabled } from "../lib/microphonePreferences";
import MicrophoneLessonBanner from "./MicrophoneLessonBanner";

const SANDPAPER_LEVEL_IDS = [1, 2, 3];

type SandpaperNumeralsLessonProps = {
  levelId: number;
  levelName: string;
  numbers: number[];
};

export default function SandpaperNumeralsLesson({
  levelId,
  levelName,
  numbers,
}: SandpaperNumeralsLessonProps) {
  const router = useRouter();
  const { microphoneEnabled } = useMicrophoneEnabled();
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

  const goHome = useCallback(() => {
    router.push("/");
  }, [router]);

  const handleLessonComplete = useCallback(() => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(
        `sandpaper-numerals-level-${levelId}-complete`,
        "true",
      );
      const allComplete = SANDPAPER_LEVEL_IDS.every(
        (id) =>
          window.localStorage.getItem(
            `sandpaper-numerals-level-${id}-complete`,
          ) === "true",
      );
      if (allComplete) {
        window.localStorage.setItem("sandpaper-numerals-complete", "true");
      }
    }
    setTimeout(() => {
      router.push("/");
    }, 600);
  }, [levelId, router]);

  return (
    <div className="relative min-h-screen bg-[radial-gradient(circle_at_top,#f5efe6_0%,#fdfbf8_45%,#f7efe4_100%)]">
      <HomeLink />
      <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-6 px-6 py-12 sm:px-10">
        <div className="flex w-full justify-end">
          <div className="flex flex-col items-end gap-1 text-[10px] uppercase tracking-[0.3em] text-stone-400 text-right">
            <span>Three-Period Lesson</span>
            <span className="text-[10px] tracking-[0.25em]">
              Sandpaper Numerals — {levelName}
            </span>
          </div>
        </div>

        <MicrophoneLessonBanner microphoneEnabled={microphoneEnabled} />

        <SandpaperNumeralsScene
          key={resetKey}
          playing={lessonStarted}
          voiceEnabled={lessonStarted}
          micEnabled={microphoneEnabled}
          numbers={numbers}
          onLessonComplete={handleLessonComplete}
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
    </div>
  );
}
