"use client";

import Link from "next/link";
import HomeLink from "../../components/HomeLink";
import LanguageArtsPreview from "../../components/LanguageArtsPreview";

export default function LanguageArtsHub() {
  return (
    <div className="relative min-h-screen bg-[radial-gradient(circle_at_top,#f5efe6,#fdfbf8_55%,#f7efe4)]">
      <HomeLink />
      <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-8 px-6 py-10">
        <div className="space-y-3 text-center">
          <p className="text-xs uppercase tracking-[0.35em] text-stone-400">Language Arts</p>
          <h1 className="font-display text-4xl font-semibold text-stone-900">Language Arts Materials</h1>
          <p className="text-sm text-stone-600">Choose a material to explore letter and phonics experiences.</p>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          <Link
            href="/lessons/language-arts/initial-sound-cards"
            className="group flex h-48 flex-col justify-between rounded-3xl border border-stone-200 bg-white/90 p-6 shadow-[0_30px_60px_-40px_rgba(15,23,42,0.8)] transition hover:-translate-y-0.5 hover:shadow-[0_40px_90px_-50px_rgba(15,23,42,0.7)]"
          >
            <h2 className="font-display text-2xl font-semibold text-stone-900">Initial Sound Cards</h2>
            <LanguageArtsPreview className="h-32" />
            <p className="text-xs uppercase tracking-[0.35em] text-stone-500">Trace letters & match images</p>
          </Link>
          <Link
            href="/lessons/language-arts/initial-sound-tracing"
            className="group flex h-48 flex-col justify-between rounded-3xl border border-stone-200 bg-white/90 p-6 shadow-[0_30px_60px_-40px_rgba(15,23,42,0.8)] transition hover:-translate-y-0.5 hover:shadow-[0_40px_90px_-50px_rgba(15,23,42,0.7)]"
          >
            <h2 className="font-display text-2xl font-semibold text-stone-900">Initial Sound Tracing</h2>
            <div className="flex h-32 flex-col items-center justify-center text-center">
              <p className="text-lg font-semibold text-stone-600">Prepare to draw letters by following animated paths.</p>
            </div>
            <p className="text-xs uppercase tracking-[0.35em] text-stone-500">Sneak peek – SVG assets coming soon</p>
          </Link>
          <Link
            href="/lessons/language-arts/concept-development"
            className="group relative flex h-48 flex-col justify-between rounded-3xl border border-stone-200 bg-gradient-to-b from-amber-100 to-yellow-50 p-6 shadow-[0_30px_60px_-40px_rgba(15,23,42,0.8)] transition hover:-translate-y-0.5 hover:shadow-[0_40px_90px_-50px_rgba(15,23,42,0.7)]"
          >
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-2xl border border-amber-400 bg-amber-50 text-xl font-semibold text-amber-600">📁</span>
              <h2 className="font-display text-2xl font-semibold text-stone-900">Concept Development</h2>
            </div>
            <p className="text-xs uppercase tracking-[0.35em] text-stone-600">Organize playful explorations</p>
            <div className="absolute -bottom-3 right-4 rounded-full border border-amber-400 bg-amber-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.35em] text-amber-700">
              Folder
            </div>
          </Link>
          <Link
            href="/lessons/language-arts/moveable-alphabet"
            className="group flex h-48 flex-col justify-between rounded-3xl border border-stone-200 bg-gradient-to-b from-emerald-100 to-sky-50 p-6 shadow-[0_30px_60px_-40px_rgba(15,23,42,0.8)] transition hover:-translate-y-0.5 hover:shadow-[0_40px_90px_-50px_rgba(15,23,42,0.7)]"
          >
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-2xl border border-sky-400 bg-sky-50 text-xl font-semibold text-sky-600">✦</span>
              <h2 className="font-display text-2xl font-semibold text-stone-900">Moveable Alphabet Board</h2>
            </div>
            <p className="text-xs uppercase tracking-[0.35em] text-stone-500">Choose a vowel group and build words.</p>
            <p className="text-xs uppercase tracking-[0.35em] text-sky-600">Vowel groups · drag & drop</p>
          </Link>
        </div>
      </main>
    </div>
  );
}
