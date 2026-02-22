"use client";

import Link from "next/link";
import HomeLink from "./HomeLink";
import MaterialTeachersGuide from "./MaterialTeachersGuide";
import { LILAC_WORD_SETS } from "../lessons/language-arts/lilac-word-lists/data";
import { LILAC_SIGHT_WORDS_TEACHERS_GUIDE } from "../data/languageArtsTeachersGuides";

export default function LilacWordListsHub() {
  return (
    <div className="relative min-h-screen bg-[radial-gradient(circle_at_top,#f5efe6,#fdfbf8_55%,#f7efe4)]">
      <HomeLink />
      <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-8 px-6 py-10">
        <header className="space-y-3 text-center">
          <p className="text-xs uppercase tracking-[0.35em] text-stone-400">Language Arts · Lilac</p>
          <h1 className="font-display text-4xl font-semibold text-stone-900">Lilac Word Lists</h1>
          <p className="text-sm text-stone-600">Most frequently used words, grouped into sets of 30.</p>
        </header>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {LILAC_WORD_SETS.map((set) => (
            <Link
              key={set.slug}
              href={`/lessons/language-arts/lilac-word-lists/${set.slug}`}
              className="group relative flex h-48 flex-col justify-between rounded-3xl border border-fuchsia-200 bg-gradient-to-br from-fuchsia-100 via-violet-50 to-purple-100 p-6 shadow-[0_30px_60px_-40px_rgba(15,23,42,0.8)] transition hover:-translate-y-0.5 hover:shadow-[0_40px_90px_-50px_rgba(15,23,42,0.7)]"
            >
              <p className="text-xs uppercase tracking-[0.35em] text-fuchsia-700">Set</p>
              <h2 className="font-display text-4xl font-semibold text-stone-900">{set.label}</h2>
              <p className="text-xs uppercase tracking-[0.35em] text-fuchsia-700">30 words · 3 pages</p>
            </Link>
          ))}
        </div>
        <MaterialTeachersGuide guide={LILAC_SIGHT_WORDS_TEACHERS_GUIDE} />
      </main>
    </div>
  );
}
