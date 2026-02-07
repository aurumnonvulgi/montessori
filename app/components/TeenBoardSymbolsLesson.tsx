"use client";

import HomeLink from "./HomeLink";
import TeenBoardSceneSymbols from "./TeenBoardSceneSymbols";

export default function TeenBoardSymbolsLesson() {
  return (
    <div className="relative min-h-screen bg-[radial-gradient(circle_at_top,#f5efe6_0%,#fdfbf8_45%,#f7efe4_100%)]">
      <HomeLink />
      <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-8 px-6 py-10 sm:px-10">
        <div className="space-y-3 text-center">
          <p className="text-xs uppercase tracking-[0.3em] text-stone-400">Mathematics</p>
          <h1 className="font-display text-4xl font-semibold text-stone-900">Teen Board Symbols</h1>
          <p className="text-sm text-stone-600">
            Match symbols to tens and ones to build confidence with teen numerals in a playful arrangement.
          </p>
        </div>

        <section className="rounded-[36px] border border-stone-100 bg-white/90 p-6 shadow-[0_40px_70px_-50px_rgba(15,23,42,0.8)]">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-semibold uppercase tracking-[0.35em] text-stone-400">Dev overlay</span>
            <div className="flex gap-2">
              <button
                type="button"
                className="rounded-full border border-stone-200 bg-white/80 px-4 py-1 text-[10px] font-semibold uppercase tracking-[0.4em] text-stone-600 shadow-sm"
              >
                Show grid
              </button>
            </div>
          </div>
          <div className="h-[520px]">
            <TeenBoardSceneSymbols className="h-full" interactive />
          </div>
        </section>
      </main>
    </div>
  );
}
