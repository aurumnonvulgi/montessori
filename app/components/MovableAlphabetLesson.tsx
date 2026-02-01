"use client";

import { DragEvent, useMemo, useState } from "react";
import HomeLink from "./HomeLink";

const WORDS = [
  { id: 1, word: "map", label: "Map", icon: "🗺️" },
  { id: 2, word: "net", label: "Net", icon: "🕸️" },
  { id: 3, word: "wet", label: "Wet", icon: "💧" },
];

const LETTER_ROWS = [
  ["a", "b", "c", "d", "e", "f", "g"],
  ["h", "i", "j", "k", "l", "m"],
  ["n", "o", "p", "q", "r", "s", "t"],
  ["u", "v", "w", "x", "y", "z"],
];

const VOWELS = new Set(["a", "e", "i", "o", "u"]);

export default function MovableAlphabetLesson() {
  const [selectedWordId, setSelectedWordId] = useState<number | null>(null);
  const [placedLetters, setPlacedLetters] = useState<string[]>([]);
  const [usedLetters, setUsedLetters] = useState<string[]>([]);
  const [status, setStatus] = useState("Select a picture card from the stack to begin.");
  const [hoverSlot, setHoverSlot] = useState<number | null>(null);

  const selectedWord = useMemo(() => WORDS.find((entry) => entry.id === selectedWordId) ?? null, [selectedWordId]);
  const nextSlotIndex = selectedWord ? placedLetters.findIndex((letter) => !letter) : -1;

  const handleWordSelect = (wordId: number) => {
    const word = WORDS.find((entry) => entry.id === wordId);
    if (!word) return;
    setSelectedWordId(wordId);
    setPlacedLetters(Array(word.word.length).fill(""));
    setUsedLetters([]);
    setStatus("Drag the letters onto the black lines to spell the word.");
    setHoverSlot(null);
  };

  const fillSlot = (letter: string, slotIndex: number) => {
    if (!selectedWord) {
      setStatus("Choose a picture card first.");
      return;
    }

    const normalized = letter.trim().toLowerCase();
    if (!normalized) {
      return;
    }

    if (slotIndex !== nextSlotIndex) {
      setStatus("Place the next letter on the topmost line.");
      return;
    }

    if (usedLetters.includes(normalized)) {
      setStatus("That letter is already resting on the lines.");
      return;
    }

    const expected = selectedWord.word[slotIndex];
    if (normalized !== expected) {
      setStatus("Try the next letter.");
      return;
    }

    setPlacedLetters((prev) => {
      const copy = [...prev];
      copy[slotIndex] = normalized;
      return copy;
    });
    setUsedLetters((prev) => [...prev, normalized]);

    if (slotIndex === selectedWord.word.length - 1) {
      setStatus(`${selectedWord.label} is complete. Choose another picture to continue.`);
    } else {
      setStatus("Nice. Place the next letter on the lines.");
    }
  };

  const handleLetterClick = (letter: string) => {
    if (nextSlotIndex === -1) {
      setStatus("Pick a picture card to begin.");
      return;
    }
    fillSlot(letter, nextSlotIndex);
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>, slotIndex: number) => {
    event.preventDefault();
    const letter = event.dataTransfer.getData("text/plain");
    fillSlot(letter, slotIndex);
    setHoverSlot(null);
  };

  const handleDragOver = (event: DragEvent<HTMLDivElement>, slotIndex: number) => {
    event.preventDefault();
    if (slotIndex === nextSlotIndex) {
      event.dataTransfer.dropEffect = "copy";
    } else {
      event.dataTransfer.dropEffect = "none";
    }
    setHoverSlot(slotIndex);
  };

  const handleDragEnd = () => {
    setHoverSlot(null);
  };

  const handleLetterDragStart = (event: DragEvent<HTMLButtonElement>, letter: string) => {
    event.dataTransfer.setData("text/plain", letter);
    event.dataTransfer.effectAllowed = "copy";
  };

  const letterBoard = (
    <div className="w-full max-w-[19rem] rounded-[24px] border border-stone-200 bg-[linear-gradient(180deg,#f2d8c6_0%,#e3c4a4_40%,#d5b18c_100%)] p-5 shadow-[0_40px_70px_-45px_rgba(0,0,0,0.6)]">
      <div className="grid gap-1 text-center text-2xl font-semibold">
        {LETTER_ROWS.map((row, rowIndex) => (
          <div key={`row-${rowIndex}`} className="flex gap-1">
            {row.map((letter) => {
              const isUsed = usedLetters.includes(letter);
              return (
                <button
                  key={letter}
                  type="button"
                  draggable
                  onClick={() => handleLetterClick(letter)}
                  onDragStart={(event) => handleLetterDragStart(event, letter)}
                  onDragEnd={handleDragEnd}
                  disabled={isUsed || !selectedWord}
                  className={`flex h-14 w-12 items-center justify-center rounded-[12px] border border-stone-300 bg-white/90 text-xl font-semibold uppercase tracking-tight shadow-inner transition ${
                    isUsed
                      ? "cursor-not-allowed border-stone-200 bg-stone-200 text-stone-400"
                      : "border-stone-300 text-stone-800 hover:-translate-y-0.5"
                  } ${VOWELS.has(letter) ? "text-sky-600" : "text-rose-600"}`}
                >
                  {letter}
                </button>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );

  const pictureStack = (
    <div className="relative h-48 w-32">
      {WORDS.map((word, index) => (
        <button
          key={word.id}
          type="button"
          onClick={() => handleWordSelect(word.id)}
          className={`absolute left-0 right-0 rounded-2xl border border-stone-200 bg-white shadow-[0_20px_40px_-30px_rgba(15,23,42,0.9)] transition ${
            selectedWordId === word.id ? "shadow-[0_20px_60px_-20px_rgba(14,116,144,0.45)]" : "opacity-95"
          }`}
          style={{ top: index * 8, zIndex: 100 + index }}
        >
          <div className="flex h-20 items-center justify-center">
            <span className="text-5xl leading-none">{word.icon}</span>
          </div>
        </button>
      ))}
    </div>
  );

  const dropAreas = (
    <div className="space-y-4">
      {[0, 1, 2].map((slotIndex) => {
        const letter = placedLetters[slotIndex];
        const available = slotIndex === nextSlotIndex;
        return (
          <div key={`drop-${slotIndex}`} className="flex gap-3">
            <div className="flex h-16 w-16 items-center justify-center rounded-lg border border-stone-200 bg-white/90 shadow-inner"> </div>
            <div
              className={`flex flex-1 items-center rounded-2xl border px-4 py-3 transition ${
                letter
                  ? "border-emerald-300 bg-emerald-50"
                  : "border-stone-300 bg-stone-50"
              } ${selectedWord && available ? "shadow-[0_10px_30px_-16px_rgba(38,138,61,0.6)]" : ""} ${
                hoverSlot === slotIndex ? "border-emerald-400" : ""
              }`}
              onDragOver={(event) => handleDragOver(event, slotIndex)}
              onDragLeave={() => setHoverSlot(null)}
              onDrop={(event) => handleDrop(event, slotIndex)}
            >
              <span className="text-4xl font-semibold uppercase tracking-widest text-stone-900">
                {letter ? letter : ""}
              </span>
              <div className="mt-3 flex gap-2">
                {[...Array(3)].map((_, dashIndex) => (
                  <span key={`dash-${slotIndex}-${dashIndex}`} className="h-0.5 flex-1 rounded-full bg-stone-800" />
                ))}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );

  return (
    <div className="relative min-h-screen select-none bg-[radial-gradient(circle_at_top,#f5efe6_0%,#fdfbf8_45%,#f7efe4_100%)]">
      <HomeLink />
      <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-10 px-6 py-12 sm:px-10">
        <div className="flex flex-col gap-2 text-right uppercase tracking-[0.25em] text-stone-400">
          <span>Three-Period Lesson</span>
          <span>Phonic Picture Cards</span>
        </div>
        <div className="rounded-[32px] border border-stone-200 bg-white/90 p-6 text-stone-700 shadow-[0_40px_90px_-40px_rgba(60,40,20,0.8)]">
          <div className="flex flex-col gap-2">
            <h1 className="font-display text-3xl font-semibold text-stone-900">
              Language Arts — Phonic Picture Cards &amp; Moveable Alphabet
            </h1>
            <p className="text-sm text-stone-500">Choose a picture, then place each letter on the black lines to spell the CVC word.</p>
          </div>
          <div className="mt-6 flex flex-col gap-4">
            <div className="flex items-center justify-between text-xs uppercase tracking-[0.3em] text-stone-400">
              <span>Picture stack</span>
              <span className="text-[10px]">Drag letters only when the lines glow.</span>
            </div>
            <div className="flex items-start gap-8">{letterBoard}<div className="flex-1">{pictureStack}{selectedWord ? dropAreas : <p className="mt-4 text-sm text-stone-500">Select a picture card to reveal the lines.</p>}</div></div>
          </div>
          <div className="mt-8 rounded-2xl border border-stone-200 bg-stone-50/80 px-4 py-3 text-sm text-stone-600" aria-live="polite">
            {status}
          </div>
        </div>
      </main>
    </div>
  );
}
