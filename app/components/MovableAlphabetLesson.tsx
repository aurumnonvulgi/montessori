"use client";

import { useMemo, useState } from "react";
import HomeLink from "./HomeLink";

const WORDS = [
  { id: 1, label: "Cat", word: "cat", description: "A playful friend" },
  { id: 2, label: "Sun", word: "sun", description: "Warm and bright" },
  { id: 3, label: "Dog", word: "dog", description: "Wags its tail" },
];

const EXTRA_LETTERS = ["s", "n", "d", "l", "r", "m"];

const shuffle = <T,>(array: T[]) => {
  const copy = [...array];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
};

const buildLetterPool = (word: string) => {
  const letters = word.split("");
  const pool = [...letters, ...EXTRA_LETTERS];
  return shuffle(pool).slice(0, letters.length + 4);
};

export default function MovableAlphabetLesson() {
  const [activeWordId, setActiveWordId] = useState<number | null>(null);
  const [placedLetters, setPlacedLetters] = useState<string[]>([]);
  const [usedIndexes, setUsedIndexes] = useState<number[]>([]);
  const [completedWordIds, setCompletedWordIds] = useState<number[]>([]);

  const activeWord = WORDS.find((word) => word.id === activeWordId) ?? null;
  const letterPool = useMemo(() => (activeWord ? buildLetterPool(activeWord.word) : []), [activeWord]);
  const nextLetter = activeWord ? activeWord.word[placedLetters.length] : null;

  const handleWordSelect = (wordId: number) => {
    if (completedWordIds.includes(wordId)) {
      setActiveWordId(wordId);
      setPlacedLetters([]);
      setUsedIndexes([]);
      return;
    }
    setActiveWordId(wordId);
    setPlacedLetters([]);
    setUsedIndexes([]);
  };

  const handleLetterSelect = (letter: string, index: number) => {
    if (!activeWord || placedLetters.length >= activeWord.word.length) {
      return;
    }
    if (usedIndexes.includes(index)) {
      return;
    }
    if (letter !== nextLetter) {
      return;
    }
    setPlacedLetters((prev) => [...prev, letter]);
    setUsedIndexes((prev) => [...prev, index]);
    if (placedLetters.length + 1 === activeWord.word.length) {
      setCompletedWordIds((prev) => [...prev, activeWord.id]);
      setTimeout(() => {
        setActiveWordId(null);
        setPlacedLetters([]);
        setUsedIndexes([]);
      }, 950);
    }
  };

  return (
    <div className="relative min-h-screen select-none bg-[radial-gradient(circle_at_top,#f5efe6_0%,#fdfbf8_45%,#f7efe4_100%)]">
      <HomeLink />
      <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col gap-8 px-6 py-12 sm:px-10">
        <div className="flex items-center justify-end gap-3 text-[10px] uppercase tracking-[0.3em] text-stone-400">
          <span>Three-Period Lesson</span>
          <span>Movable Alphabet</span>
        </div>

        <div className="flex flex-col gap-4 rounded-[28px] border border-stone-200 bg-white/90 p-6 shadow-[0_20px_50px_-30px_rgba(0,0,0,0.6)]">
          <h1 className="font-display text-3xl font-semibold text-stone-900">Language Arts — Movable Alphabet</h1>
          <p className="text-sm text-stone-500">
            Grab a picture card, then capture each letter in order. Each placed letter glows softly green when correct.
          </p>

          <div className="flex flex-wrap items-stretch gap-4">
            <div className="flex-1">
              <p className="text-xs uppercase tracking-[0.3em] text-stone-400">picture cards</p>
              <div className="relative mt-3 flex h-44 w-full items-center justify-center">
                {WORDS.map((word, index) => {
                  const isTop = index === WORDS.length - 1;
                  const isSelected = word.id === activeWordId;
                  return (
                <button
                  key={word.id}
                  type="button"
                  onClick={() => handleWordSelect(word.id)}
                  className={`flex h-32 w-40 flex-col items-center justify-center rounded-3xl border bg-gradient-to-b from-stone-50 to-stone-200 px-4 py-3 text-center text-sm font-semibold text-stone-700 shadow-lg transition hover:-translate-y-1 ${
                    activeWordId === word.id ? "border-emerald-300" : "border-stone-200"
                  }`}
                  style={{
                    top: index * 6,
                    left: index * 10,
                    opacity: isTop || isSelected ? 1 : 0.6,
                    position: "absolute",
                    zIndex: 100 + index,
                  }}
                >
                      <span className="text-xs uppercase tracking-[0.3em] text-stone-400">Picture</span>
                      <span className="mt-2 text-3xl">{word.label}</span>
                      <span className="text-[10px] uppercase tracking-[0.3em] text-stone-500">
                        {word.description}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="flex-1">
              <p className="text-xs uppercase tracking-[0.3em] text-stone-400">word to build</p>
              <div className="mt-4 flex gap-3">
                {(activeWord?.word.split("") ?? []).map((letter, slotIndex) => {
                  const filled = placedLetters[slotIndex];
                  const isFilled = Boolean(filled);
                  return (
                    <div
                      key={`${letter}-${slotIndex}`}
                      className={`flex h-14 w-14 items-center justify-center rounded-2xl border text-2xl font-semibold uppercase tracking-widest transition ${
                        isFilled ? "border-emerald-400 bg-emerald-100/60 text-emerald-700" : "border-stone-200 bg-white text-stone-700"
                      }`}
                    >
                      {isFilled ? filled : letter}
                    </div>
                  );
                })}
              </div>
              <div className="mt-5 rounded-2xl border border-stone-200 bg-stone-50/60 p-4 text-sm text-stone-500">
                {activeWord
                  ? "Pick the letters in order. The screen glows green when each letter is placed correctly."
                  : "Select a picture card to begin."}
              </div>
            </div>
          </div>

          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-stone-400">letter tiles</p>
            <div className="mt-3 grid grid-cols-6 gap-3">
              {letterPool.map((letter, index) => {
                const disabled = usedIndexes.includes(index);
                const isNext = letter === nextLetter && !disabled;
                return (
                  <button
                    key={`${letter}-${index}`}
                    type="button"
                    onClick={() => handleLetterSelect(letter, index)}
                    disabled={disabled || !activeWord}
                    className={`rounded-2xl border px-3 py-4 text-xl font-semibold uppercase tracking-widest transition ${
                      disabled
                        ? "cursor-not-allowed border-stone-200 bg-stone-100 text-stone-400"
                        : isNext
                          ? "border-emerald-400 bg-emerald-100 text-emerald-900"
                          : "border-stone-200 bg-white text-stone-700 hover:-translate-y-0.5 hover:shadow"}
                  `}
                  >
                    {letter}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
