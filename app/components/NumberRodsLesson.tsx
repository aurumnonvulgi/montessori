"use client";

import { useState } from "react";
import NumberRodsScene from "./NumberRodsScene";

export default function NumberRodsLesson() {
  const [playing, setPlaying] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [resetKey, setResetKey] = useState(0);

  const handleStart = () => {
    setResetKey((value) => value + 1);
    setPlaying(true);
  };

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-12 px-6 pb-20 pt-16 sm:px-10">
      <header className="flex flex-col gap-4">
        <p className="text-xs uppercase tracking-[0.2em] text-stone-400">
          Sensorial · Number Rods
        </p>
        <h1 className="font-display text-4xl text-stone-900 sm:text-5xl">
          Number Rods lesson in calm 3D
        </h1>
        <p className="max-w-2xl text-base text-stone-600 sm:text-lg">
          Follow Maria Montessori&apos;s presentation: place rods in graded order,
          lift and glow each rod, then trace each segment with a gentle counting
          cue.
        </p>
      </header>

      <section className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-start">
        <div className="rounded-[32px] border border-stone-200 bg-white/90 p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-stone-400">
                Presentation flow
              </p>
              <h2 className="font-display text-2xl text-stone-900">
                One rod at a time, then count.
              </h2>
            </div>
            <div className="flex items-center gap-3 text-xs uppercase tracking-[0.2em] text-stone-500">
              <label className="flex items-center gap-2 rounded-full border border-stone-200 bg-white px-3 py-2">
                <input
                  type="checkbox"
                  checked={voiceEnabled}
                  onChange={(event) => setVoiceEnabled(event.target.checked)}
                  className="accent-stone-900"
                />
                Voice on
              </label>
            </div>
          </div>

          <div className="mt-6 grid gap-4 text-sm text-stone-600">
            {[
              "Place the rods left-aligned on a soft mat.",
              "Introduce the first rod and trace the full length: this is one.",
              "Count each segment with calm rhythm: one, two, three.",
              "Let the child repeat the full trace and counting sequence.",
            ].map((step) => (
              <div
                key={step}
                className="rounded-2xl border border-stone-200 bg-[#fdf9f2] px-4 py-3"
              >
                {step}
              </div>
            ))}
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={handleStart}
              className="rounded-full bg-stone-900 px-5 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-white"
            >
              {playing ? "Restart lesson" : "Start lesson"}
            </button>
            <button
              type="button"
              onClick={() => setPlaying(false)}
              className="rounded-full border border-stone-300 bg-white px-5 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-stone-700"
            >
              Pause
            </button>
          </div>
        </div>

        <div className="rounded-[32px] border border-stone-200 bg-white/90 p-4">
          <NumberRodsScene
            key={resetKey}
            playing={playing}
            voiceEnabled={voiceEnabled}
            onComplete={() => setPlaying(false)}
          />
          <div className="mt-4 flex items-center justify-between text-xs uppercase tracking-[0.2em] text-stone-400">
            <span>Calm animation</span>
            <span>3 rods preview</span>
          </div>
        </div>
      </section>
    </main>
  );
}
