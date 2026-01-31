"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import NumeralsAndCountersPreview from "./NumeralsAndCountersPreview";

const LESSONS = [
  { id: 1, name: "1, 2, 3", numerals: [1, 2, 3], color: "bg-rose-100", borderColor: "border-rose-200", textColor: "text-rose-700" },
  { id: 2, name: "4, 5, 6", numerals: [4, 5, 6], color: "bg-amber-100", borderColor: "border-amber-200", textColor: "text-amber-700" },
  { id: 3, name: "7, 8, 9", numerals: [7, 8, 9], color: "bg-sky-100", borderColor: "border-sky-200", textColor: "text-sky-700" },
  { id: 4, name: "10", numerals: [10], color: "bg-violet-100", borderColor: "border-violet-200", textColor: "text-violet-700" },
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

export default function NumeralsAndCountersHub() {
  const router = useRouter();
  const [completedLessons, setCompletedLessons] = useState<number[]>([]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const completed: number[] = [];
    LESSONS.forEach((lesson) => {
      const key = `numerals-and-counters-stage-${lesson.id}-complete`;
      if (window.localStorage.getItem(key) === "true") {
        completed.push(lesson.id);
      }
    });
    setCompletedLessons(completed);
  }, []);

  const isLessonUnlocked = (lessonId: number) => {
    if (lessonId === 1) return true;
    return completedLessons.includes(lessonId - 1);
  };

  const isLessonCompleted = (lessonId: number) => {
    return completedLessons.includes(lessonId);
  };

  const handleLessonClick = (lessonId: number) => {
    if (!isLessonUnlocked(lessonId)) return;
    router.push(`/lessons/numerals-and-counters/stage-${lessonId}`);
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
            Numerals and Counters
          </h1>
          <p className="mt-2 text-stone-500">
            Select a lesson to begin
          </p>
        </div>

        <div className="pointer-events-none mx-auto mb-10 h-48 w-full max-w-md overflow-hidden rounded-[28px] shadow-[0_8px_30px_-8px_rgba(0,0,0,0.2)]">
          <NumeralsAndCountersPreview className="h-full" />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {LESSONS.map((lesson) => {
            const unlocked = isLessonUnlocked(lesson.id);
            const completed = isLessonCompleted(lesson.id);

            return (
              <button
                key={lesson.id}
                onClick={() => handleLessonClick(lesson.id)}
                disabled={!unlocked}
                className={`relative flex items-center justify-between rounded-2xl border p-6 text-left transition ${
                  unlocked
                    ? `${lesson.color} ${lesson.borderColor} shadow-md hover:-translate-y-0.5 hover:shadow-lg`
                    : "cursor-not-allowed border-stone-200 bg-stone-100/50"
                }`}
              >
                <div>
                  <div
                    className={`text-xs uppercase tracking-[0.2em] ${
                      unlocked ? lesson.textColor : "text-stone-400"
                    }`}
                  >
                    Lesson {lesson.id}
                  </div>
                  <div
                    className={`mt-1 font-display text-xl font-semibold ${
                      unlocked ? "text-stone-900" : "text-stone-400"
                    }`}
                  >
                    {lesson.name}
                  </div>
                </div>

                <div className="flex items-center">
                  {!unlocked && (
                    <div className="text-stone-400">
                      <LockIcon />
                    </div>
                  )}
                  {completed && (
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/80 text-emerald-600">
                      <CheckIcon />
                    </div>
                  )}
                  {unlocked && !completed && (
                    <div className={`flex h-10 w-10 items-center justify-center rounded-full bg-white/60 ${lesson.textColor}`}>
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

        {completedLessons.length === LESSONS.length && (
          <div className="mt-8 rounded-2xl bg-emerald-50 p-6 text-center">
            <div className="text-2xl">🎉</div>
            <div className="mt-2 font-display text-lg font-semibold text-emerald-700">
              All lessons completed!
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
