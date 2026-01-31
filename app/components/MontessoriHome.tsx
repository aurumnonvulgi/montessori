"use client";

import { useEffect, useState } from "react";
import NumberRodsScene from "./NumberRodsScene";
import SandpaperNumeralsPreview from "./SandpaperNumeralsPreview";
import NumeralsAndCountersPreview from "./NumeralsAndCountersPreview";
import SpindleBoxesPreview from "./SpindleBoxesPreview";

export default function MontessoriHome() {
  const [isCompleted, setIsCompleted] = useState(false);
  const [numeralsAndCountersCompleted, setNumeralsAndCountersCompleted] = useState(false);
  const [spindleBoxesCompleted, setSpindleBoxesCompleted] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    setIsCompleted(window.localStorage.getItem("number-rods-complete") === "true");
    setNumeralsAndCountersCompleted(
      window.localStorage.getItem("numerals-and-counters-complete") === "true",
    );
    setSpindleBoxesCompleted(
      window.localStorage.getItem("spindle-boxes-complete") === "true",
    );
  }, []);

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,#f5efe6_0%,#fdfbf8_45%,#f7efe4_100%)]">
      <main className="mx-auto flex w-full max-w-6xl items-center justify-center px-4 py-6 sm:min-h-screen sm:px-10 sm:py-12">
        <div className="grid w-full gap-4 sm:gap-8 md:grid-cols-2">
          <a
            href="/lessons/number-rods"
            className="group mx-auto w-full max-w-[560px]"
            aria-label="Open Number Rods lesson"
          >
            <div className="relative w-full rounded-[24px] border border-stone-200 bg-white/90 p-4 shadow-[0_30px_80px_-50px_rgba(60,40,20,0.6)] transition hover:-translate-y-1 hover:shadow-[0_40px_90px_-50px_rgba(60,40,20,0.7)] sm:rounded-[40px] sm:p-6">
              <div className="pointer-events-none aspect-[4/3] w-full rounded-[18px] bg-white/70 sm:aspect-square sm:rounded-[28px]">
                <NumberRodsScene
                  playing={false}
                  voiceEnabled={false}
                  className="h-full"
                />
              </div>
              <div className="mt-3 text-center sm:mt-6">
                <span className="font-display text-lg font-semibold text-stone-900 sm:text-2xl">
                  Number Rods
                </span>
                {isCompleted ? (
                  <div className="mt-1 flex justify-center sm:mt-2">
                    <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[9px] uppercase tracking-[0.2em] text-emerald-700 sm:px-3 sm:py-1 sm:text-[10px]">
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
            <div className="relative w-full rounded-[24px] border border-stone-200 bg-white/90 p-4 shadow-[0_30px_80px_-50px_rgba(60,40,20,0.6)] transition hover:-translate-y-1 hover:shadow-[0_40px_90px_-50px_rgba(60,40,20,0.7)] sm:rounded-[40px] sm:p-6">
              <div className="pointer-events-none aspect-[4/3] w-full rounded-[18px] bg-white/70 sm:aspect-square sm:rounded-[28px]">
                <SandpaperNumeralsPreview className="h-full" />
              </div>
              <div className="mt-3 text-center sm:mt-6">
                <span className="font-display text-lg font-semibold text-stone-900 sm:text-2xl">
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
            <div className="relative w-full rounded-[24px] border border-stone-200 bg-white/90 p-4 shadow-[0_30px_80px_-50px_rgba(60,40,20,0.6)] transition hover:-translate-y-1 hover:shadow-[0_40px_90px_-50px_rgba(60,40,20,0.7)] sm:rounded-[40px] sm:p-6">
              <div className="pointer-events-none aspect-[4/3] w-full rounded-[18px] bg-white/70 sm:aspect-square sm:rounded-[28px]">
                <NumeralsAndCountersPreview className="h-full" />
              </div>
              <div className="mt-3 text-center sm:mt-6">
                <span className="font-display text-lg font-semibold text-stone-900 sm:text-2xl">
                  Numerals and Counters
                </span>
                {numeralsAndCountersCompleted ? (
                  <div className="mt-1 flex justify-center sm:mt-2">
                    <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[9px] uppercase tracking-[0.2em] text-emerald-700 sm:px-3 sm:py-1 sm:text-[10px]">
                      Completed
                    </span>
                  </div>
                ) : null}
              </div>
            </div>
          </a>

          <a
            href="/lessons/spindle-boxes"
            className="group mx-auto w-full max-w-[560px]"
            aria-label="Open Spindle Boxes lesson"
          >
            <div className="relative w-full rounded-[24px] border border-stone-200 bg-white/90 p-4 shadow-[0_30px_80px_-50px_rgba(60,40,20,0.6)] transition hover:-translate-y-1 hover:shadow-[0_40px_90px_-50px_rgba(60,40,20,0.7)] sm:rounded-[40px] sm:p-6">
              <div className="pointer-events-none aspect-[4/3] w-full rounded-[18px] bg-white/70 sm:aspect-square sm:rounded-[28px]">
                <SpindleBoxesPreview className="h-full" />
              </div>
              <div className="mt-3 text-center sm:mt-6">
                <span className="font-display text-lg font-semibold text-stone-900 sm:text-2xl">
                  Spindle Boxes
                </span>
                {spindleBoxesCompleted ? (
                  <div className="mt-1 flex justify-center sm:mt-2">
                    <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[9px] uppercase tracking-[0.2em] text-emerald-700 sm:px-3 sm:py-1 sm:text-[10px]">
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
