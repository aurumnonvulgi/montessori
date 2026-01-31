"use client";

import { useEffect, useMemo, useState } from "react";

type CompletionKey = Record<
  | "numberRods"
  | "numberRodsPresentation"
  | "spindleBoxes"
  | "sandpaperNumerals"
  | "numeralsAndCounters"
  | "shortBeadStair",
  boolean,
>;

const COMPLETION_KEYS: Record<keyof CompletionKey, string> = {
  numberRods: "number-rods-complete",
  numberRodsPresentation: "number-rods-presentation-complete",
  spindleBoxes: "spindle-boxes-complete",
  sandpaperNumerals: "sandpaper-numerals-complete",
  numeralsAndCounters: "numerals-and-counters-complete",
  shortBeadStair: "short-bead-stair-complete",
};

const MATH_ACTIVITIES: Array<{
  key: keyof CompletionKey;
  label: string;
  description: string;
  href: string;
}> = [
  {
    key: "numberRods",
    label: "Number Rods",
    description: "Move through the three-period lesson and celebrate each stage.",
    href: "/lessons/number-rods",
  },
  {
    key: "numberRodsPresentation",
    label: "Number Rods Presentation",
    description: "See the rods introduced gently before the lesson begins.",
    href: "/lessons/number-rods-presentation",
  },
  {
    key: "spindleBoxes",
    label: "Spindle Boxes",
    description: "Count spindle values and feel the beads at each number.",
    href: "/lessons/spindle-boxes",
  },
  {
    key: "sandpaperNumerals",
    label: "Sandpaper Numerals",
    description: "Trace the shapes of each numeral and hear the sound.",
    href: "/lessons/sandpaper-numerals",
  },
  {
    key: "numeralsAndCounters",
    label: "Numerals & Counters",
    description: "Match numerals to counters and hear them counted aloud.",
    href: "/lessons/numerals-and-counters",
  },
  {
    key: "shortBeadStair",
    label: "Short Bead Stair",
    description: "New tactile stair practice with bead chains 1–9.",
    href: "/lessons/short-bead-stair",
  },
];

const OTHER_SUBJECTS = [
  {
    title: "Sensorial",
    description: "Calm explorations that refine color, shape, and balance.",
    accent: "from-emerald-50 via-emerald-100 to-cyan-50",
  },
  {
    title: "Language Arts",
    description: "Soft stories, letter tracing, and decoding practice coming soon.",
    accent: "from-orange-50 via-amber-100 to-rose-50",
  },
  {
    title: "Botany",
    description: "Gardens, seeds, and gentle observation exercises arriving soon.",
    accent: "from-emerald-50 via-yellow-50 to-amber-50",
  },
];

function MathematicsPreview({ className }: { className?: string }) {
  const rods = ["#ef4444", "#f97316", "#facc15", "#4ade80", "#38bdf8"];
  const beadStack = ["#e11d48", "#a855f7", "#1e3a8a"];

  return (
    <div
      className={`relative h-full overflow-hidden rounded-[28px] bg-gradient-to-br from-[#fff4dd] via-[#f7efe4] to-[#efe9e0] p-5 ${className ?? ""}`}
    >
      <div className="flex h-full flex-col gap-3">
        <div className="flex flex-wrap gap-3">
          {rods.map((color, index) => (
            <span
              key={color + index}
              className="h-2.5 w-full rounded-full shadow-[0_8px_18px_-12px_rgba(0,0,0,0.8)]"
              style={{ background: color }}
            />
          ))}
        </div>
        <div className="flex items-center gap-2">
          <div className="h-10 w-10 rounded-3xl bg-[#1f7a3c] shadow-lg" />
          <div className="flex h-10 w-10 items-center justify-center rounded-3xl bg-[#fed7aa] text-xs font-semibold text-stone-600">
            1–9
          </div>
          <div className="h-10 w-10 rounded-3xl border border-stone-200 bg-white/70" />
        </div>
        <div className="grid flex-1 grid-cols-3 gap-1">
          {beadStack.map((color, index) => (
            <span
              key={`${color}-${index}`}
              className="h-2 w-full rounded-full"
              style={{ background: color }}
            />
          ))}
        </div>
        <div className="flex items-center justify-between text-xs uppercase tracking-[0.3em] text-stone-500">
          <span>Mathematics</span>
          <span className="text-[10px]">Playful + calm</span>
        </div>
      </div>
    </div>
  );
}

function SubjectCard({ title, description, accent }: typeof OTHER_SUBJECTS[number]) {
  return (
    <div className="flex h-full flex-col justify-between rounded-[28px] border border-stone-200 bg-white/90 p-6 shadow-[0_30px_80px_-50px_rgba(60,40,20,0.6)] transition hover:-translate-y-0.5 hover:shadow-lg">
      <div>
        <span className={`inline-flex h-1 w-16 rounded-full bg-gradient-to-r ${accent}`} />
        <div className="mt-4 space-y-2">
          <h3 className="font-display text-2xl font-semibold text-stone-900">{title}</h3>
          <p className="text-sm text-stone-500">{description}</p>
        </div>
      </div>
      <span className="mt-6 inline-flex items-center gap-1 text-xs text-stone-500">
        Coming soon
        <span aria-hidden>→</span>
      </span>
    </div>
  );
}

export default function MontessoriHome() {
  const [completionMap, setCompletionMap] = useState<CompletionKey>(() => {
    const initial: CompletionKey = {
      numberRods: false,
      numberRodsPresentation: false,
      spindleBoxes: false,
      sandpaperNumerals: false,
      numeralsAndCounters: false,
      shortBeadStair: false,
    };
    return initial;
  });

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    const next: CompletionKey = {
      numberRods: false,
      numberRodsPresentation: false,
      spindleBoxes: false,
      sandpaperNumerals: false,
      numeralsAndCounters: false,
      shortBeadStair: false,
    };
    (Object.keys(COMPLETION_KEYS) as (keyof CompletionKey)[]).forEach((key) => {
      next[key] = window.localStorage.getItem(COMPLETION_KEYS[key]) === "true";
    });
    setCompletionMap(next);
  }, []);

  const mathComplete = useMemo(
    () =>
      MATH_ACTIVITIES.every((activity) => completionMap[activity.key as keyof CompletionKey]),
    [completionMap],
  );

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,#f5efe6_0%,#fdfbf8_45%,#f7efe4_100%)]">
      <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-10 px-6 py-12 sm:px-10">
        <div className="space-y-3 text-center">
          <p className="text-xs uppercase tracking-[0.4em] text-stone-400">Montessori Studio</p>
          <h1 className="font-display text-4xl font-semibold text-stone-900 md:text-5xl">
            A gentle lab for exploring Montessori materials
          </h1>
          <p className="mx-auto max-w-2xl text-sm text-stone-500">
            Each activity keeps the focus on calm sequencing, light speech, and the control of error.
            Tap into the mathematics card below to find every lesson we have so far.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <div className="relative rounded-[36px] border border-stone-200 bg-white/90 p-6 shadow-[0_30px_80px_-50px_rgba(60,40,20,0.6)]">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.35em] text-stone-400">Subject</p>
                  <h2 className="font-display text-3xl font-semibold text-stone-900">Mathematics</h2>
                  <p className="mt-2 text-sm text-stone-500">
                    Number sense, counting, and materials science—every activity lives here.
                  </p>
                </div>
                {mathComplete ? (
                  <span className="rounded-full bg-emerald-100 px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-emerald-700">
                    Completed
                  </span>
                ) : null}
              </div>

              <MathematicsPreview className="mt-6 h-[260px]" />

              <div className="mt-6 space-y-3">
                {MATH_ACTIVITIES.map((activity) => (
                  <a
                    key={activity.key}
                    href={activity.href}
                    className="flex items-center justify-between rounded-2xl border border-stone-200 bg-white/90 px-4 py-4 shadow-[0_12px_40px_-35px_rgba(0,0,0,0.9)] transition hover:-translate-y-0.5 hover:shadow-lg"
                  >
                    <div>
                      <p className="text-sm font-semibold text-stone-900">{activity.label}</p>
                      <p className="text-xs text-stone-500">{activity.description}</p>
                    </div>
                    <div className="flex items-center gap-2 text-xs uppercase tracking-[0.3em] text-stone-500">
                      {completionMap[activity.key as keyof CompletionKey] ? (
                        <span className="text-emerald-700">Done</span>
                      ) : (
                        <span>Go</span>
                      )}
                      <span aria-hidden>→</span>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          </div>

          {OTHER_SUBJECTS.map((subject) => (
            <SubjectCard key={subject.title} {...subject} />
          ))}
        </div>
      </main>
    </div>
  );
}
