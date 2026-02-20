"use client";

import Link from "next/link";
import HomeLink from "./HomeLink";
import HistoryTimeClockPreview from "./HistoryTimeClockPreview";
import { type ClockMode, type TimeValue } from "../lib/timeMath";

const MODE_CARDS = [
  {
    href: "/lessons/history-time/hour-clock",
    title: "Hour Clock",
    subtitle: "Enter the isolated hour material",
    badge: "Hour",
    mode: "hours" as ClockMode,
    value: { h: 3, m: 0 } as TimeValue,
  },
  {
    href: "/lessons/history-time/minute-clock",
    title: "Minute Clock",
    subtitle: "Enter minute-track focused material",
    badge: "Minute",
    mode: "minutes" as ClockMode,
    value: { h: 12, m: 25 } as TimeValue,
  },
  {
    href: "/lessons/history-time/clock",
    title: "Clock",
    subtitle: "Enter full clock work (hours + minutes)",
    badge: "Full",
    mode: "both" as ClockMode,
    value: { h: 4, m: 25 } as TimeValue,
  },
];

export default function HistoryTimeHub() {
  return (
    <div className="relative min-h-screen bg-[radial-gradient(circle_at_top,#f3efe8,#faf7f2_52%,#f1ebe2)]">
      <HomeLink />
      <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-7 px-6 py-10 sm:px-10">
        <header className="space-y-2 text-center">
          <p className="text-xs uppercase tracking-[0.35em] text-stone-500">History &amp; Time</p>
          <h1 className="font-display text-4xl font-semibold text-stone-900">Analog Clock Work</h1>
          <p className="text-sm text-stone-600">
            Choose a material card, then open its activities.
          </p>
        </header>

        <section className="grid gap-6 md:grid-cols-3">
          {MODE_CARDS.map((card) => (
            <Link
              key={card.href}
              href={card.href}
              className="group rounded-3xl border border-stone-200 bg-white/90 p-5 shadow-[0_28px_65px_-45px_rgba(15,23,42,0.75)] transition hover:-translate-y-0.5 hover:shadow-[0_36px_75px_-45px_rgba(15,23,42,0.75)]"
            >
              <div className="flex items-center justify-between">
                <p className="font-display text-2xl font-semibold text-stone-900">{card.title}</p>
                <span className="rounded-full border border-stone-300 bg-stone-100 px-3 py-1 text-[10px] uppercase tracking-[0.24em] text-stone-700">
                  {card.badge}
                </span>
              </div>
              <div className="mt-4 overflow-hidden rounded-2xl border border-stone-200 bg-stone-50">
                <HistoryTimeClockPreview mode={card.mode} value={card.value} />
              </div>
              <p className="mt-4 text-sm text-stone-600">{card.subtitle}</p>
              <p className="mt-3 text-xs uppercase tracking-[0.24em] text-stone-500">Open Material</p>
            </Link>
          ))}
        </section>
      </main>
    </div>
  );
}
