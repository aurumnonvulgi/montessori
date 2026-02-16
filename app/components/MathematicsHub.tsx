"use client";

import { useEffect, useState } from "react";
import HomeLink from "./HomeLink";
import NumberRodsScene from "./NumberRodsScene";
import NumeralsAndCountersPreview from "./NumeralsAndCountersPreview";
import ShortBeadWorkbench from "./ShortBeadWorkbench";
import TeenBoardPreview from "./TeenBoardPreview";
import SpindleBoxesPreview from "./SpindleBoxesPreview";

const LESSONS = [
  {
    key: "numberRods",
    label: "Number Rods",
    href: "/lessons/number-rods",
    preview: <NumberRodsScene playing={false} voiceEnabled={false} className="h-full" />,
    completionKey: "number-rods-complete",
  },
  {
    key: "sandpaperNumerals",
    label: "Sandpaper Numerals",
    href: "/lessons/sandpaper-numerals",
    preview: <SandpaperNumeralsCardPreview />,
    completionKey: "sandpaper-numerals-complete",
  },
  {
    key: "spindleBoxes",
    label: "Spindle Boxes",
    href: "/lessons/spindle-boxes",
    preview: <SpindleBoxesPreview className="h-full" />,
    completionKey: "spindle-boxes-complete",
  },
  {
    key: "numeralsAndCounters",
    label: "Numerals & Counters",
    href: "/lessons/numerals-and-counters",
    preview: <NumeralsAndCountersPreview className="h-full" />,
    completionKey: "numerals-and-counters-complete",
  },
  {
    key: "shortBeadStair",
    label: "Short Bead Stair",
    href: "/lessons/short-bead-stair",
    preview: <ShortBeadWorkbench className="h-full" />,
    completionKey: "short-bead-stair-complete",
  },
  {
    key: "teenBoardQuantities",
    label: "Teen Board Quantities",
    href: "/lessons/teen-board",
    preview: <TeenBoardPreview className="h-full" scene="quantities" />,
    completionKey: "teen-board-quantities-complete",
  },
  {
    key: "teenBoardSymbols",
    label: "Teen Board Symbols",
    href: "/lessons/teen-board-symbols",
    preview: <TeenBoardPreview className="h-full" scene="symbols" />,
    completionKey: "teen-board-symbols-complete",
  },
];

type CompletionState = Record<string, boolean>;

export default function MathematicsHub() {
  const [completed, setCompleted] = useState<CompletionState>({});

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    const next: CompletionState = {};
    LESSONS.forEach((lesson) => {
      next[lesson.key] = window.localStorage.getItem(lesson.completionKey) === "true";
    });
    setCompleted(next);
  }, []);

  return (
    <div className="relative min-h-screen bg-[radial-gradient(circle_at_top,#f5efe6_0%,#fdfbf8_45%,#f7efe4_100%)]">
      <HomeLink />
      <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-6 overflow-x-hidden px-6 py-12 sm:px-10">
        <div className="space-y-3 text-center">
          <h1 className="font-display text-3xl font-semibold text-stone-900">Mathematics</h1>
        </div>

        <div className="grid min-w-0 gap-5 lg:grid-cols-2">
          {LESSONS.map((lesson) => (
          <a
            key={lesson.key}
            href={lesson.href}
            className="group flex w-full min-w-0 select-none flex-col overflow-hidden rounded-[32px] border border-stone-200 bg-white/90 p-4 shadow-[0_30px_80px_-50px_rgba(60,40,20,0.6)] transition hover:-translate-y-0.5 hover:shadow-[0_40px_90px_-50px_rgba(60,40,20,0.7)]"
          >
              <div className="flex flex-col gap-3">
                <div className="pointer-events-none min-w-0 overflow-hidden rounded-[24px] bg-white/70 p-2 shadow-inner">
                  {lesson.preview}
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-[0.3em] text-stone-400">Lesson</p>
                    <p className="font-display text-2xl font-semibold text-stone-900">{lesson.label}</p>
                  </div>
                  {completed[lesson.key] ? (
                    <span className="rounded-full bg-emerald-100 px-3 py-1 text-[10px] uppercase tracking-[0.25em] text-emerald-700">
                      Complete
                    </span>
                  ) : (
                    <span className="text-xs uppercase tracking-[0.3em] text-stone-500">Start</span>
                  )}
                </div>
              </div>
            </a>
          ))}
        </div>
      </main>
    </div>
  );
}

function SandpaperNumeralsCardPreview() {
  return (
    <div className="h-32 w-full overflow-hidden rounded-[24px] bg-[radial-gradient(circle_at_top,#f8f3ee_0%,#f1eadf_55%,#e9dfd2_100%)] p-3 shadow-inner sm:h-36">
      <div className="flex h-full items-center justify-between gap-3">
        <div className="flex h-full flex-col items-center justify-center gap-2">
          {["1", "2", "3"].map((value) => (
            <div
              key={`sandpaper-${value}`}
              className="flex h-10 w-8 items-center justify-center rounded-md border border-stone-200 bg-stone-50 text-lg font-semibold text-stone-900 shadow-[0_8px_18px_-14px_rgba(0,0,0,0.8)]"
            >
              {value}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-2">
          {["4", "5", "6", "7"].map((value) => (
            <div
              key={`tile-${value}`}
              className="flex h-11 w-11 items-center justify-center rounded-xl border border-emerald-900/20 bg-emerald-700/80 text-xl font-semibold text-white shadow-[0_10px_18px_-14px_rgba(0,0,0,0.6)]"
            >
              {value}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
