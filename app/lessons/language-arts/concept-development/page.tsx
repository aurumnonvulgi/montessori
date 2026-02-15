"use client";

import Link from "next/link";
import HomeLink from "../../../components/HomeLink";

const cards = [
  {
    title: "Opposites",
    description: "Drag pairs to their matching opposites.",
    href: "/lessons/language-arts/concept-development/opposites",
  },
];

export default function ConceptDevelopment() {
  return (
    <div className="relative min-h-screen bg-[radial-gradient(circle_at_top,#f5efe6,#fdfbf8_55%,#f7efe4)]">
      <HomeLink />
      <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-8 px-6 py-10">
        <header className="space-y-3 text-center">
          <p className="text-xs uppercase tracking-[0.35em] text-stone-400">Language Arts · Concept Development</p>
          <h1 className="font-display text-4xl font-semibold text-stone-900">Concept Development</h1>
          <p className="text-sm text-stone-600">Choose a pocket game to explore language concepts.</p>
        </header>
        <div className="grid gap-6 md:grid-cols-2">
          {cards.map((card) => (
            <Link
              key={card.title}
              href={card.href}
              className="group flex h-48 flex-col justify-between rounded-3xl border border-stone-200 bg-white/90 p-6 shadow-[0_30px_60px_-40px_rgba(15,23,42,0.8)] transition hover:-translate-y-0.5 hover:shadow-[0_40px_90px_-50px_rgba(15,23,42,0.7)]"
            >
              <h2 className="font-display text-2xl font-semibold text-stone-900">{card.title}</h2>
              <p className="text-sm font-medium text-stone-600">{card.description}</p>
              <p className="text-xs uppercase tracking-[0.35em] text-stone-500">Drag & drop concept game</p>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
