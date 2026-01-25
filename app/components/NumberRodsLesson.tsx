"use client";

import { useEffect, useState } from "react";
import NumberRodsScene from "./NumberRodsScene";

export default function NumberRodsLesson() {
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [resetKey, setResetKey] = useState(0);

  useEffect(() => {
    const handle = () => {
      setVoiceEnabled(true);
      setResetKey((value) => value + 1);
    };

    window.addEventListener("pointerdown", handle, { once: true });
    return () => window.removeEventListener("pointerdown", handle);
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
          <span className="text-[10px] uppercase tracking-[0.3em] text-stone-400">
            Number Rods
          </span>
        </div>

        <NumberRodsScene
          key={resetKey}
          playing={true}
          voiceEnabled={voiceEnabled}
          className="h-[70vh] min-h-[520px]"
        />
      </main>
    </div>
  );
}
