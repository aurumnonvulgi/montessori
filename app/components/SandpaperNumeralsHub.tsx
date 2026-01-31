"use client";

import { useRouter } from "next/navigation";
import SandpaperNumeralsPreview from "./SandpaperNumeralsPreview";
import HomeLink from "./HomeLink";

const LEVELS = [
  {
    id: 1,
    name: "1, 2, 3",
    numbers: [1, 2, 3],
    color: "bg-rose-100",
    borderColor: "border-rose-200",
    textColor: "text-rose-700",
    description: "Trace the first three numerals with sandpaper guides.",
  },
  {
    id: 2,
    name: "4, 5, 6",
    numbers: [4, 5, 6],
    color: "bg-amber-100",
    borderColor: "border-amber-200",
    textColor: "text-amber-700",
    description: "Continue the sequence with the next trio.",
  },
  {
    id: 3,
    name: "7, 8, 9",
    numbers: [7, 8, 9],
    color: "bg-sky-100",
    borderColor: "border-sky-200",
    textColor: "text-sky-700",
    description: "Finish the set of nine numerals.",
  },
];

export default function SandpaperNumeralsHub() {
  const router = useRouter();

  return (
    <div className="relative min-h-screen bg-[radial-gradient(circle_at_top,#f5efe6_0%,#fdfbf8_45%,#f7efe4_100%)]">
      <HomeLink />
      <main className="mx-auto flex min-h-screen w-full max-w-4xl flex-col gap-6 px-6 py-12 sm:px-10">
        <button
          onClick={() => router.push("/")}
          className="text-sm text-stone-500 hover:text-stone-700"
        >
          ← Back to Home
        </button>

        <div className="mb-4 text-center">
          <h1 className="font-display text-3xl font-semibold text-stone-900">
            Sandpaper Numerals
          </h1>
          <p className="mt-2 text-stone-500">
            Choose a level to practice the touch and sound of each numeral.
          </p>
        </div>

        <div className="pointer-events-none mx-auto mb-6 h-48 w-full max-w-md overflow-hidden rounded-[28px]">
          <SandpaperNumeralsPreview className="h-full" />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {LEVELS.map((level) => (
            <button
              key={level.id}
              onClick={() => router.push(`/lessons/sandpaper-numerals/level-${level.id}`)}
              className={`relative flex h-full flex-col justify-between rounded-2xl border p-6 text-left transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stone-400 ${level.color} ${level.borderColor} shadow-md hover:-translate-y-0.5 hover:shadow-lg`}
            >
              <div>
                <div className={`text-xs uppercase tracking-[0.2em] ${level.textColor}`}>
                  Level {level.id}
                </div>
                <div className={`mt-1 font-display text-xl font-semibold ${level.textColor}`}>
                  {level.name}
                </div>
                <p className="mt-2 text-sm text-stone-700">{level.description}</p>
              </div>
              <div className="flex items-center justify-between text-sm text-stone-600">
                <span>Start</span>
                <span className="text-2xl">→</span>
              </div>
            </button>
          ))}
        </div>
      </main>
    </div>
  );
}
