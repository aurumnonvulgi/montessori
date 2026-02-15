"use client";

import Link from "next/link";
import HomeLink from "../../../components/HomeLink";

const VOWEL_CARDS = [
  { letter: "a", color: "text-rose-600", bg: "bg-rose-50", border: "border-rose-200" },
  { letter: "e", color: "text-amber-600", bg: "bg-amber-50", border: "border-amber-200" },
  { letter: "i", color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-200" },
  { letter: "o", color: "text-sky-600", bg: "bg-sky-50", border: "border-sky-200" },
  { letter: "u", color: "text-purple-600", bg: "bg-purple-50", border: "border-purple-200" },
];

export default function MoveableAlphabetHub() {
  return (
    <div className="relative min-h-screen bg-[radial-gradient(circle_at_top,#f5efe6,#fdfbf8_55%,#f7efe4)]">
      <HomeLink />
      <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-8 px-6 py-10">
        <header className="space-y-3 text-center">
          <p className="text-xs uppercase tracking-[0.35em] text-stone-400">Language Arts · Moveable Alphabet</p>
          <h1 className="font-display text-4xl font-semibold text-stone-900">Moveable Alphabet Board</h1>
          <p className="text-sm text-stone-600">Choose a vowel group to practice CVC words.</p>
        </header>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {VOWEL_CARDS.map((card) => (
            <Link
              key={card.letter}
              href={`/lessons/language-arts/moveable-alphabet/${card.letter}`}
              className={`group flex h-44 flex-col justify-between rounded-3xl border ${card.border} ${card.bg} p-6 shadow-[0_30px_60px_-40px_rgba(15,23,42,0.8)] transition hover:-translate-y-0.5 hover:shadow-[0_40px_90px_-50px_rgba(15,23,42,0.7)]`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase tracking-[0.35em] text-stone-500">Vowel</span>
                <span className={`text-4xl font-semibold ${card.color}`}>{card.letter}</span>
              </div>
              <div>
                <p className="text-lg font-semibold text-stone-900">Letter {card.letter}</p>
                <p className="text-xs uppercase tracking-[0.35em] text-stone-500">12 words per letter</p>
              </div>
            </Link>
          ))}
        </div>
        <div className="flex flex-wrap gap-4">
          <Link
            href="/lessons/language-arts"
            className="inline-flex items-center justify-center rounded-full border border-stone-300 px-5 py-2 text-xs uppercase tracking-[0.4em] text-stone-500"
          >
            Back to Language Arts
          </Link>
        </div>
      </main>
    </div>
  );
}
