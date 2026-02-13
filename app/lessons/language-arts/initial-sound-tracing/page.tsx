"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import HomeLink from "../../../components/HomeLink";
import Link from "next/link";

const tracingLetters = [
  {
    letter: "a",
    word: "apple",
    description: "Round the circle, then drop the stick to finish the lowercase a.",
    previewImage: "/assets/language_arts/initial_sound_tracing/a-image.png",
    strokePath: "/assets/language_arts/initial_sound_tracing/a-path.svg",
  },
];

export default function InitialSoundTracing() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isTracing, setIsTracing] = useState(false);
  const [feedback, setFeedback] = useState("");
  const timerRef = useRef<number>();
  const feedbackRef = useRef<number>();
  const currentLetter = tracingLetters[activeIndex];

  useEffect(() => {
    return () => {
      window.clearTimeout(timerRef.current);
      window.clearTimeout(feedbackRef.current);
    };
  }, []);

  const handleTrace = () => {
    setIsTracing(true);
    window.clearTimeout(timerRef.current);
    window.clearTimeout(feedbackRef.current);
    timerRef.current = window.setTimeout(() => {
      setIsTracing(false);
      setFeedback("Nice tracing!");
      feedbackRef.current = window.setTimeout(() => setFeedback(""), 1500);
    }, 2000);
  };

  const letterBlocks = useMemo(
    () =>
      tracingLetters.map((entry) => (
        <div
          key={entry.letter}
          className={
            "flex h-16 w-16 items-center justify-center rounded-2xl border border-stone-200 text-2xl font-bold uppercase tracking-[0.3em] " +
            (entry.letter === currentLetter?.letter ? "bg-stone-900 text-white" : "bg-stone-50 text-stone-500")
          }
        >
          {entry.letter}
        </div>
      )),
    [currentLetter]
  );

  return (
    <div className="relative min-h-screen bg-[radial-gradient(circle_at_top,#fdfbf8,#f5efe6_65%,#f0e9dd)]">
      <HomeLink />
      <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-6 px-6 py-10">
        <header className="space-y-3 text-center">
          <p className="text-xs uppercase tracking-[0.35em] text-stone-400">Language Arts · Preview</p>
          <h1 className="font-display text-4xl font-semibold text-stone-900">Initial Sound Tracing</h1>
          <p className="text-sm text-stone-600">Draw each letter while listening to its sound.</p>
        </header>
        <section className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="space-y-6 rounded-3xl border border-stone-200 bg-white/90 p-6 shadow-[0_30px_60px_-40px_rgba(15,23,42,0.8)]">
            <div className="flex items-center justify-between">
              <p className="text-xs uppercase tracking-[0.35em] text-stone-500">Tracing board</p>
              <p className="text-xs font-semibold text-stone-500">Letter {currentLetter.letter}</p>
            </div>
            <div className="flex flex-col gap-5">
              <div className="flex items-end justify-between text-sm">
                <span className="font-medium text-stone-600">{currentLetter.word}</span>
                <button
                  className="rounded-full border border-stone-300 px-4 py-1 text-xs uppercase tracking-[0.35em]"
                  onClick={handleTrace}
                >
                  Trace letter
                </button>
              </div>
              <div className="relative flex h-52 items-center justify-center overflow-hidden rounded-3xl border border-stone-200 bg-gradient-to-b from-stone-100 to-stone-200">
                <span
                  className={`absolute inset-0 flex items-center justify-center text-[16rem] font-black text-stone-900 transition duration-500 ${
                    isTracing ? "scale-105 text-red-500" : "text-stone-900"
                  }`}
                >
                  {currentLetter.letter}
                </span>
                <img
                  src={currentLetter.strokePath}
                  alt={`${currentLetter.letter} tracing path`}
                  className={`pointer-events-none h-full w-full object-contain transition duration-500 ${
                    isTracing ? "opacity-100" : "opacity-40"
                  }`}
                />
                <span
                  className={`absolute inset-0 rounded-3xl border-2 border-dashed border-stone-300 transition duration-500 ${
                    isTracing ? "opacity-0" : "opacity-100"
                  }`}
                />
              </div>
              <p className="text-sm text-stone-600">{currentLetter.description}</p>
            </div>
          </div>
          <div className="space-y-4 rounded-3xl border border-stone-200 bg-white/90 p-6 shadow-[0_30px_60px_-40px_rgba(15,23,42,0.8)]">
            <div className="flex items-center justify-between text-stone-500">
              <p className="text-xs uppercase tracking-[0.35em]">Illustration</p>
              <span className="text-xs font-semibold">Sound on hold</span>
            </div>
            <div className="flex items-center justify-center overflow-hidden rounded-3xl border border-stone-200 bg-stone-50 p-6">
              <img src={currentLetter.previewImage} alt={`${currentLetter.word} illustration`} className="h-56 w-auto object-contain" />
            </div>
            <div className="flex items-center justify-between text-sm text-stone-600">
              <span className="font-semibold text-stone-900">{currentLetter.word}</span>
              <span className="tracking-[0.35em]">/æ/</span>
            </div>
            <div className="flex flex-wrap gap-3">{letterBlocks}</div>
          </div>
        </section>
        <div className="flex flex-wrap items-center gap-4">
          <Link
            href="/lessons/language-arts/initial-sound-cards"
            className="inline-flex items-center justify-center rounded-full border border-stone-300 px-5 py-2 text-xs uppercase tracking-[0.4em] text-stone-500"
          >
            Back to Cards
          </Link>
          <Link
            href="/lessons/language-arts"
            className="inline-flex items-center justify-center rounded-full bg-stone-900 px-5 py-2 text-xs uppercase tracking-[0.4em] text-white/90"
          >
            Return to hub
          </Link>
        </div>
      </main>
    </div>
  );
}
