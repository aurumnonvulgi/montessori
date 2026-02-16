"use client";

import Link from "next/link";
import HomeLink from "../../../components/HomeLink";

const VOWELS = [
  {
    letter: "a",
    label: "Short a",
    color: "text-rose-600",
    bg: "bg-rose-50",
    word: "bat",
  },
  {
    letter: "e",
    label: "Short e",
    color: "text-amber-600",
    bg: "bg-amber-50",
    word: "bed",
  },
  {
    letter: "i",
    label: "Short i",
    color: "text-sky-600",
    bg: "bg-sky-50",
    word: "bib",
  },
  {
    letter: "o",
    label: "Short o",
    color: "text-emerald-600",
    bg: "bg-emerald-50",
    word: "box",
  },
  {
    letter: "u",
    label: "Short u",
    color: "text-indigo-600",
    bg: "bg-indigo-50",
    word: "bud",
  },
];

const toCardImage = (letter: string, word: string) =>
  `/assets/language_arts/moveable_alphabet/Phonic_picture_cards/${letter}-tcp-${word}.png`;

const toPictureImage = (letter: string, word: string) =>
  `/assets/language_arts/moveable_alphabet/phonic_pictures/${letter}-picture-${word}.png`;

export default function PhonicThreePartCardsHub() {
  return (
    <div className="relative min-h-screen bg-[radial-gradient(circle_at_top,#f5efe6,#fdfbf8_55%,#f7efe4)]">
      <HomeLink />
      <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-8 px-6 py-10">
        <header className="space-y-3 text-center">
          <p className="text-xs uppercase tracking-[0.35em] text-stone-400">Language Arts · Phonic Three-Part Cards</p>
          <h1 className="font-display text-4xl font-semibold text-stone-900">Phonic Three-Part Cards</h1>
          <p className="text-sm text-stone-600">Choose a vowel group to match pictures to the three-part cards.</p>
        </header>
        <div className="grid gap-6 md:grid-cols-2">
          {VOWELS.map((vowel) => (
            <Link
              key={vowel.letter}
              href={`/lessons/language-arts/phonic-three-part-cards/${vowel.letter}`}
              className="group flex h-48 flex-col justify-between rounded-3xl border border-stone-200 bg-white/90 p-6 shadow-[0_30px_60px_-40px_rgba(15,23,42,0.8)] transition hover:-translate-y-0.5 hover:shadow-[0_40px_90px_-50px_rgba(15,23,42,0.7)]"
            >
              <div className="flex items-center justify-between">
                <h2 className="font-display text-2xl font-semibold text-stone-900">{vowel.letter}</h2>
                <span
                  className={`rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.35em] ${vowel.bg} ${vowel.color}`}
                >
                  Group
                </span>
              </div>
              <div className="flex h-24 items-center justify-center gap-3">
                <div className="flex h-20 w-20 items-center justify-center rounded-2xl border border-stone-200 bg-white/90 p-2 shadow-inner">
                  <img
                    src={toCardImage(vowel.letter, vowel.word)}
                    alt={`${vowel.word} card`}
                    className="h-full w-full object-contain"
                  />
                </div>
                <div className="flex h-20 w-20 items-center justify-center rounded-2xl border border-stone-200 bg-white/90 p-2 shadow-inner">
                  <img
                    src={toPictureImage(vowel.letter, vowel.word)}
                    alt={vowel.word}
                    className="h-full w-full object-contain"
                  />
                </div>
              </div>
              <p className="text-xs uppercase tracking-[0.35em] text-stone-500">{vowel.label}</p>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
