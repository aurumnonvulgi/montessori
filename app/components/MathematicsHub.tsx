"use client";

import { useEffect, useState } from "react";
import HomeLink from "./HomeLink";
import NumberRodsScene from "./NumberRodsScene";
import NumberRodsPresentationPreview from "./NumberRodsPresentationPreview";
import SandpaperNumeralsPreview from "./SandpaperNumeralsPreview";
import NumeralsAndCountersPreview from "./NumeralsAndCountersPreview";
import SpindleBoxesPreview from "./SpindleBoxesPreview";

const LESSONS = [
  {
    key: "spindleBoxes",
    label: "Spindle Boxes",
    href: "/lessons/spindle-boxes",
    preview: <SpindleBoxesPreview className="h-full" />,
    completionKey: "spindle-boxes-complete",
  },
  {
    key: "numberRods",
    label: "Number Rods",
    href: "/lessons/number-rods",
    preview: <NumberRodsScene playing={false} voiceEnabled={false} className="h-full" />,
    completionKey: "number-rods-complete",
  },
  {
    key: "numberRodsPresentation",
    label: "Number Rods Presentation",
    href: "/lessons/number-rods-presentation",
    preview: <NumberRodsPresentationPreview className="h-full" />,
    completionKey: "number-rods-presentation-complete",
  },
  {
    key: "sandpaperNumerals",
    label: "Sandpaper Numerals",
    href: "/lessons/sandpaper-numerals",
    preview: <SandpaperNumeralsPreview className="h-full" />,
    completionKey: "sandpaper-numerals-complete",
  },
  {
    key: "numeralsAndCounters",
    label: "Numerals & Counters",
    href: "/lessons/numerals-and-counters",
    preview: <NumeralsAndCountersPreview className="h-full" />,
    completionKey: "numerals-and-counters-complete",
  },
];

type CompletionState = Record<string, boolean>;

export default function MathematicsHub() {
  const [completed, setCompleted] = useState<CompletionState>({});

  /* eslint-disable react-hooks/set-state-in-effect */
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
  /* eslint-enable react-hooks/set-state-in-effect */

  return (
    <div className="relative min-h-screen bg-[radial-gradient(circle_at_top,#f5efe6_0%,#fdfbf8_45%,#f7efe4_100%)]">
      <HomeLink />
      <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-6 px-6 py-12 sm:px-10">
        <div className="space-y-3 text-center">
          <h1 className="font-display text-3xl font-semibold text-stone-900">Mathematics</h1>
          <p className="text-sm text-stone-500">
            Tap into each material to experience the three-period lesson, counting, and gentle celebrations.
          </p>
        </div>

        <div className="grid gap-5 lg:grid-cols-2">
          {LESSONS.map((lesson) => (
            <a
              key={lesson.key}
              href={lesson.href}
              className="group flex flex-col rounded-[32px] border border-stone-200 bg-white/90 p-4 shadow-[0_30px_80px_-50px_rgba(60,40,20,0.6)] transition hover:-translate-y-0.5 hover:shadow-[0_40px_90px_-50px_rgba(60,40,20,0.7)]"
            >
              <div className="flex flex-col gap-3">
                <div className="pointer-events-none overflow-hidden rounded-[24px] bg-white/70 p-2 shadow-inner">
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
