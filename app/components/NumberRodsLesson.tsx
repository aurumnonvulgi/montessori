"use client";

import { useCallback, useState } from "react";
import NumberRodsScene from "./NumberRodsScene";

export default function NumberRodsLesson() {
  const [audioEnabled, setAudioEnabled] = useState(false);
  const [resetKey, setResetKey] = useState(0);

  const enableAudio = useCallback(() => {
    setAudioEnabled(true);
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
            <span className="rounded-full border border-stone-200 bg-white px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-stone-500">
              {audioEnabled ? "Audio on" : "Audio off"}
            </span>
            <span className="rounded-full border border-stone-200 bg-white px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-stone-500">
              Three-Period Lesson
            </span>
            <span className="text-[10px] uppercase tracking-[0.3em] text-stone-400">
              Number Rods
            </span>
          </div>
        </div>

        <div className="relative">
          <NumberRodsScene
            key={resetKey}
            playing={true}
            voiceEnabled={audioEnabled}
            className="h-[70vh] min-h-[520px]"
          />
          {!audioEnabled ? (
            <div className="absolute inset-0 flex items-center justify-center rounded-[28px] bg-[#f7efe4]/85 backdrop-blur-sm">
              <button
                type="button"
                onClick={enableAudio}
                className="rounded-full bg-stone-900 px-6 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-white shadow-lg"
              >
                Tap to enable audio
              </button>
            </div>
          ) : null}
        </div>
      </main>
    </div>
  );
}
