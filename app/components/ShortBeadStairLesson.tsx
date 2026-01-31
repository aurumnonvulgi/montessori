"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import ShortBeadStairScene, { ShortBeadStairPhase } from "./ShortBeadStairScene";
import HomeLink from "./HomeLink";
import { recordLessonActivity } from "../lib/activityTracker";

export default function ShortBeadStairLesson() {
  const [step, setStep] = useState(0);
  const [phase, setPhase] = useState<ShortBeadStairPhase>("idle");
  const [hintVisible, setHintVisible] = useState(false);
  const [countTarget, setCountTarget] = useState(1);
  const completionLoggedRef = useRef(false);

  const startLesson = useCallback(() => {
    setStep(1);
    setPhase("placement");
    setHintVisible(false);
    setCountTarget(1);
    completionLoggedRef.current = false;
  }, []);

  const handlePhaseComplete = useCallback((completedPhase: ShortBeadStairPhase) => {
    if (completedPhase === "placement") {
      setStep(2);
      setPhase("count");
      setCountTarget(1);
      return;
    }
    if (completedPhase === "count") {
      setStep(3);
      setPhase("rebuild");
      return;
    }
    if (completedPhase === "rebuild") {
      setStep(4);
      setPhase("idle");
      return;
    }
  }, []);

  const handleCountingTargetChange = useCallback((target: number) => {
    setCountTarget(target);
  }, []);

  const toggleHint = useCallback(() => {
    setHintVisible((prev) => !prev);
  }, []);

  const tryAgain = useCallback(() => {
    setStep(1);
    setPhase("placement");
    setHintVisible(false);
    setCountTarget(1);
    completionLoggedRef.current = false;
  }, []);

  const resetIntro = useCallback(() => {
    setStep(0);
    setPhase("idle");
    setHintVisible(false);
    setCountTarget(1);
    completionLoggedRef.current = false;
  }, []);

  useEffect(() => {
    if (step === 4) {
      if (typeof window !== "undefined") {
        window.localStorage.setItem("short-bead-stair-complete", "true");
      }
      if (!completionLoggedRef.current) {
        completionLoggedRef.current = true;
        void recordLessonActivity({
          lesson: "Short Bead Stair",
          action: "complete",
        });
      }
    }
  }, [step]);

  const instructionText = useMemo(() => {
    switch (step) {
      case 0:
        return "Today we’ll build the bead stair.";
      case 1:
        return "Find the 1 bar and place it at the top-left of the mat. Add each bar directly below the previous to form a stair.";
      case 2:
        return `Let’s count the ${countTarget} bar together. Tap each bead slowly as you say the numbers.`;
      case 3:
        return "Can you build the bead stair again? Use the hint to see where the next bar belongs.";
      case 4:
        return "You built the bead stair.";
      default:
        return "";
    }
  }, [step, countTarget]);

  return (
    <div className="relative min-h-screen bg-[radial-gradient(circle_at_top,#f5efe6_0%,#fdfbf8_45%,#f7efe4_100%)]">
      <HomeLink />
      <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-6 px-6 py-12 sm:px-10">
        <div className="flex items-center justify-between gap-3">
          <div className="space-y-1 text-[10px] uppercase tracking-[0.3em] text-stone-400">
            <span>Short Bead Stair</span>
            <span>Three-Period Lesson</span>
          </div>
          <div className="flex items-center gap-3 text-[10px] uppercase tracking-[0.3em] text-stone-400">
            <span>Step {Math.max(1, step === 0 ? 1 : step)} of 4</span>
          </div>
        </div>

        <ShortBeadStairScene
          className="h-[68vh] min-h-[520px]"
          phase={phase}
          hintVisible={hintVisible && step === 3}
          onPhaseComplete={handlePhaseComplete}
          onCountingTargetChange={handleCountingTargetChange}
        />

        <div className="space-y-4 text-center text-sm text-stone-600">
          <p className="text-base font-semibold text-stone-900">{instructionText}</p>
          {step === 3 ? (
            <button
              type="button"
              onClick={toggleHint}
              className="mx-auto rounded-full border border-stone-200 bg-white px-6 py-3 text-xs font-semibold uppercase tracking-[0.3em] text-stone-700 transition hover:-translate-y-0.5"
            >
              {hintVisible ? "Hide hint" : "Show hint"}
            </button>
          ) : null}
        </div>

        <div className="mt-auto grid gap-3">
          {step === 0 ? (
            <button
              type="button"
              onClick={startLesson}
              className="w-full rounded-3xl bg-[#cf5f5f] py-4 text-sm font-semibold uppercase tracking-[0.25em] text-white shadow-lg transition hover:bg-[#c15454]"
            >
              Start
            </button>
          ) : step === 4 ? (
            <>
              <button
                type="button"
                onClick={tryAgain}
                className="w-full rounded-3xl bg-[#2f67c1] py-4 text-sm font-semibold uppercase tracking-[0.25em] text-white shadow-lg transition hover:bg-[#295aad]"
              >
                Try again
              </button>
              <button
                type="button"
                onClick={resetIntro}
                className="w-full rounded-3xl border border-stone-200 bg-white py-4 text-sm font-semibold uppercase tracking-[0.25em] text-stone-700 shadow-lg transition hover:-translate-y-0.5"
              >
                Back to Short Bead Stair
              </button>
            </>
          ) : null}
        </div>
      </main>
    </div>
  );
}
