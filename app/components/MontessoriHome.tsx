"use client";

import Image from "next/image";
import { useMemo } from "react";

export default function MontessoriHome() {
  const subjectHighlights = useMemo(() => ["Counting", "Geometry", "Sequencing"], []);

  return (
    <div className="min-h-screen select-none bg-[radial-gradient(circle_at_top,#f5efe6_0%,#fdfbf8_45%,#f7efe4_100%)]">
      <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col items-center justify-center px-6 py-12 sm:px-10">
        <div className="space-y-6 text-center">
          <p className="text-xs uppercase tracking-[0.4em] text-stone-400">Montessori Studio</p>
          <h1 className="font-display text-4xl font-semibold text-stone-900 md:text-5xl">A gentle lab for Montessori math</h1>
        </div>

        <a
          href="/lessons/mathematics"
          className="group mt-10 w-full max-w-[760px] select-none rounded-[36px] border border-stone-200 bg-white/90 p-6 shadow-[0_30px_80px_-50px_rgba(60,40,20,0.6)] transition hover:-translate-y-1 hover:shadow-[0_40px_90px_-50px_rgba(60,40,20,0.7)]"
          aria-label="Open Mathematics hub"
        >
          <div className="flex flex-col gap-5 sm:gap-8">
            <h2 className="font-display text-3xl font-semibold text-stone-900">Mathematics</h2>
            <div className="relative h-48 w-full overflow-hidden rounded-[24px] border border-stone-200 bg-stone-100 shadow-inner">
              <Image
                src="/mathematics-card.png"
                alt="Montessori number rods"
                fill
                sizes="(max-width: 768px) 100vw, 760px"
                priority
                className="object-cover"
              />
            </div>
            <div className="flex flex-wrap gap-2 text-[11px] uppercase tracking-[0.25em] text-stone-500">
              {subjectHighlights.map((highlight) => (
                <span key={highlight} className="inline-flex items-center gap-1 rounded-full border border-stone-200 px-3 py-1">
                  <span className="h-1 w-1 rounded-full bg-stone-400" />
                  {highlight}
                </span>
              ))}
            </div>
          </div>
        </a>
      </main>
    </div>
  );
}
