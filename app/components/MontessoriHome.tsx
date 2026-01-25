"use client";

import NumberRodsScene from "./NumberRodsScene";

export default function MontessoriHome() {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,#f5efe6_0%,#fdfbf8_45%,#f7efe4_100%)]">
      <main className="mx-auto flex min-h-screen w-full max-w-5xl items-center justify-center px-6 py-12 sm:px-10">
        <a
          href="/lessons/number-rods"
          className="group w-full max-w-[560px]"
          aria-label="Open Number Rods lesson"
        >
          <div className="relative aspect-square w-full rounded-[40px] border border-stone-200 bg-white/90 p-6 shadow-[0_30px_80px_-50px_rgba(60,40,20,0.6)] transition hover:-translate-y-1 hover:shadow-[0_40px_90px_-50px_rgba(60,40,20,0.7)]">
            <div className="pointer-events-none absolute inset-6 rounded-[28px] bg-white/70">
              <NumberRodsScene
                playing={false}
                voiceEnabled={false}
                className="h-full"
              />
            </div>
            <div className="absolute bottom-6 left-6 right-6 flex items-center justify-between">
              <span className="font-display text-2xl text-stone-900">
                Number Rods
              </span>
              <span className="rounded-full bg-stone-900 px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-white">
                Open
              </span>
            </div>
          </div>
        </a>
      </main>
    </div>
  );
}
