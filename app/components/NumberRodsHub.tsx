"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import NumberRodsScene from "./NumberRodsScene";

const STAGES = [
  { id: 1, name: "1, 2, 3", rods: [1, 2, 3] },
  { id: 2, name: "4, 5, 6", rods: [4, 5, 6] },
  { id: 3, name: "7, 8, 9", rods: [7, 8, 9] },
  { id: 4, name: "10", rods: [10] },
];

function LockIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-8 w-8"
    >
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6">
      <path
        d="M5 12l5 5L20 7"
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function NumberRodsHub() {
  const router = useRouter();
  const [completedStages, setCompletedStages] = useState<number[]>([]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const completed: number[] = [];
    STAGES.forEach((stage) => {
      const key = `number-rods-stage-${stage.id}-complete`;
      if (window.localStorage.getItem(key) === "true") {
        completed.push(stage.id);
      }
    });
    setCompletedStages(completed);
  }, []);

  const isStageUnlocked = (stageId: number) => {
    if (stageId === 1) return true;
    return completedStages.includes(stageId - 1);
  };

  const isStageCompleted = (stageId: number) => {
    return completedStages.includes(stageId);
  };

  const handleStageClick = (stageId: number) => {
    if (!isStageUnlocked(stageId)) return;
    router.push(`/lessons/number-rods/stage-${stageId}`);
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,#f5efe6_0%,#fdfbf8_45%,#f7efe4_100%)]">
      <main className="mx-auto flex min-h-screen w-full max-w-4xl flex-col px-6 py-12 sm:px-10">
        <button
          onClick={() => router.push("/")}
          className="mb-8 self-start text-sm text-stone-500 hover:text-stone-700"
        >
          ← Back to Home
        </button>

        <div className="mb-8 text-center">
          <h1 className="font-display text-3xl font-semibold text-stone-900">
            Number Rods
          </h1>
          <p className="mt-2 text-stone-500">
            Select a lesson to begin
          </p>
        </div>

        <div className="pointer-events-none mx-auto mb-10 h-48 w-full max-w-md overflow-hidden rounded-[28px]">
          <NumberRodsScene
            playing={false}
            voiceEnabled={false}
            className="h-full"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {STAGES.map((stage) => {
            const unlocked = isStageUnlocked(stage.id);
            const completed = isStageCompleted(stage.id);

            return (
              <button
                key={stage.id}
                onClick={() => handleStageClick(stage.id)}
                disabled={!unlocked}
                className={`relative flex items-center justify-between rounded-2xl border p-6 text-left transition ${
                  unlocked
                    ? "border-stone-200 bg-white/90 shadow-md hover:-translate-y-0.5 hover:shadow-lg"
                    : "cursor-not-allowed border-stone-100 bg-stone-50/50"
                }`}
              >
                <div>
                  <div
                    className={`text-xs uppercase tracking-[0.2em] ${
                      unlocked ? "text-stone-400" : "text-stone-300"
                    }`}
                  >
                    Stage {stage.id}
                  </div>
                  <div
                    className={`mt-1 font-display text-xl font-semibold ${
                      unlocked ? "text-stone-900" : "text-stone-400"
                    }`}
                  >
                    {stage.name}
                  </div>
                </div>

                <div className="flex items-center">
                  {!unlocked && (
                    <div className="text-stone-300">
                      <LockIcon />
                    </div>
                  )}
                  {completed && (
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                      <CheckIcon />
                    </div>
                  )}
                  {unlocked && !completed && (
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-stone-100 text-stone-400">
                      <svg viewBox="0 0 24 24" className="h-5 w-5">
                        <path
                          d="M9 18l6-6-6-6"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {completedStages.length === STAGES.length && (
          <div className="mt-8 rounded-2xl bg-emerald-50 p-6 text-center">
            <div className="text-2xl">🎉</div>
            <div className="mt-2 font-display text-lg font-semibold text-emerald-700">
              All stages completed!
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
