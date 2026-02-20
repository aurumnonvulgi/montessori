"use client";

import Link from "next/link";
import HomeLink from "./HomeLink";
import HistoryTimeClockPreview from "./HistoryTimeClockPreview";
import { type ClockMode, type TimeValue } from "../lib/timeMath";

type HistoryTimeTrackHubProps = {
  title: string;
  subtitle: string;
  activityLabel: string;
  activityHref: string;
  badge: string;
  mode: ClockMode;
  value: TimeValue;
};

export default function HistoryTimeTrackHub({
  title,
  subtitle,
  activityLabel,
  activityHref,
  badge,
  mode,
  value,
}: HistoryTimeTrackHubProps) {
  return (
    <div className="relative min-h-screen bg-[radial-gradient(circle_at_top,#f3efe8,#faf7f2_52%,#f1ebe2)]">
      <HomeLink />
      <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col gap-7 px-6 py-10 sm:px-10">
        <header className="space-y-2 text-center">
          <p className="text-xs uppercase tracking-[0.35em] text-stone-500">History &amp; Time</p>
          <h1 className="font-display text-4xl font-semibold text-stone-900">{title}</h1>
          <p className="text-sm text-stone-600">{subtitle}</p>
        </header>

        <section className="mx-auto w-full max-w-xl">
          <Link
            href={activityHref}
            className="group block rounded-3xl border border-stone-200 bg-white/90 p-6 shadow-[0_28px_65px_-45px_rgba(15,23,42,0.75)] transition hover:-translate-y-0.5 hover:shadow-[0_36px_75px_-45px_rgba(15,23,42,0.75)]"
          >
            <div className="flex items-center justify-between">
              <p className="font-display text-3xl font-semibold text-stone-900">{activityLabel}</p>
              <span className="rounded-full border border-stone-300 bg-stone-100 px-3 py-1 text-[10px] uppercase tracking-[0.24em] text-stone-700">
                {badge}
              </span>
            </div>
            <div className="mt-4 overflow-hidden rounded-2xl border border-stone-200 bg-stone-50">
              <HistoryTimeClockPreview mode={mode} value={value} />
            </div>
            <p className="mt-4 text-xs uppercase tracking-[0.24em] text-stone-500">
              Open activities
            </p>
          </Link>
        </section>
      </main>
    </div>
  );
}
