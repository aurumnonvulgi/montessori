"use client";

import { useEffect, useState } from "react";
import NumberRodsScene from "./NumberRodsScene";
import SandpaperNumeralsPreview from "./SandpaperNumeralsPreview";
import NumeralsAndCountersPreview from "./NumeralsAndCountersPreview";

export default function MontessoriHome() {
  const [isCompleted, setIsCompleted] = useState(false);
  const [numeralsAndCountersCompleted, setNumeralsAndCountersCompleted] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    setIsCompleted(window.localStorage.getItem("number-rods-complete") === "true");
    setNumeralsAndCountersCompleted(
      window.localStorage.getItem("numerals-and-counters-complete") === "true",
    );
  }, []);

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,#f5efe6_0%,#fdfbf8_45%,#f7efe4_100%)]">
      <main className="mx-auto flex min-h-screen w-full max-w-6xl items-center justify-center px-6 py-12 sm:px-10">
        <div className="grid w-full gap-8 md:grid-cols-2">
          <a
            href="/lessons/number-rods"
            className="group mx-auto w-full max-w-[560px]"
            aria-label="Open Number Rods lesson"
          >
            <div className="relative w-full rounded-[40px] border border-stone-200 bg-white/90 p-6 shadow-[0_30px_80px_-50px_rgba(60,40,20,0.6)] transition hover:-translate-y-1 hover:shadow-[0_40px_90px_-50px_rgba(60,40,20,0.7)]">
              <div className="pointer-events-none aspect-square w-full rounded-[28px] bg-white/70">
                <NumberRodsScene
                  playing={false}
                  voiceEnabled={false}
                  className="h-full"
                />
              </div>
              <div className="mt-6 text-center">
                <span className="font-display text-2xl font-semibold text-stone-900">
                  Number Rods
                </span>
                {isCompleted ? (
                  <div className="mt-2 flex justify-center">
                    <span className="rounded-full bg-emerald-100 px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-emerald-700">
                      Completed
                    </span>
                  </div>
                ) : null}
              </div>
            </div>
          </a>

          <a
            href="/lessons/sandpaper-numerals"
            className="group mx-auto w-full max-w-[560px]"
            aria-label="Open Sandpaper Numerals lesson"
          >
            <div className="relative w-full rounded-[40px] border border-stone-200 bg-white/90 p-6 shadow-[0_30px_80px_-50px_rgba(60,40,20,0.6)] transition hover:-translate-y-1 hover:shadow-[0_40px_90px_-50px_rgba(60,40,20,0.7)]">
              <div className="pointer-events-none aspect-square w-full rounded-[28px] bg-white/70">
                <SandpaperNumeralsPreview className="h-full" />
              </div>
              <div className="mt-6 text-center">
                <span className="font-display text-2xl font-semibold text-stone-900">
                  Sandpaper Numerals
                </span>
              </div>
            </div>
          </a>

          <a
            href="/lessons/numerals-and-counters"
            className="group mx-auto w-full max-w-[560px]"
            aria-label="Open Numerals and Counters lesson"
          >
            <div className="relative w-full rounded-[40px] border border-stone-200 bg-white/90 p-6 shadow-[0_30px_80px_-50px_rgba(60,40,20,0.6)] transition hover:-translate-y-1 hover:shadow-[0_40px_90px_-50px_rgba(60,40,20,0.7)]">
              <div className="pointer-events-none aspect-square w-full rounded-[28px] bg-white/70">
                <NumeralsAndCountersPreview className="h-full" />
              </div>
              <div className="mt-6 text-center">
                <span className="font-display text-2xl font-semibold text-stone-900">
                  Numerals and Counters
                </span>
                {numeralsAndCountersCompleted ? (
                  <div className="mt-2 flex justify-center">
                    <span className="rounded-full bg-emerald-100 px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-emerald-700">
                      Completed
                    </span>
                  </div>
                ) : null}
              </div>
            </div>
          </a>
        </div>
      </main>
    </div>
  );
}
