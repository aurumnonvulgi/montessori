"use client";

import Image from "next/image";
import { useMemo } from "react";
import LanguageArtsPreview from "./LanguageArtsPreview";
import MicrophonePrivacyToggle from "./MicrophonePrivacyToggle";
import HistoryTimeClockPreview from "./HistoryTimeClockPreview";

const CARD_STYLE =
  "group select-none rounded-[36px] border border-stone-200 bg-white/90 p-6 shadow-[0_30px_80px_-50px_rgba(60,40,20,0.6)] transition hover:-translate-y-1 hover:shadow-[0_40px_90px_-50px_rgba(60,40,20,0.7)]";

export default function MontessoriHome() {
  const subjectHighlights = useMemo(() => ["Counting", "Geometry", "Sequencing"], []);
  const dashboardPreview = useMemo(
    () => [
      {
        label: "Language Arts",
        percent: 62,
        fill: "#ef4444",
        rest: "#fecaca",
        note: "Phonics + concept games",
      },
      {
        label: "Mathematics",
        percent: 38,
        fill: "#2563eb",
        rest: "#bfdbfe",
        note: "Rods, counters, boards",
      },
      {
        label: "Overall Progress",
        percent: 50,
        fill: "#10b981",
        rest: "#bbf7d0",
        note: "Across all materials",
      },
    ],
    []
  );

  return (
    <div className="min-h-screen select-none bg-[radial-gradient(circle_at_top,#f5efe6_0%,#fdfbf8_45%,#f7efe4_100%)]">
      <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col items-center justify-center px-6 py-12 sm:px-10">
        <div className="space-y-6 text-center">
          <p className="text-xs uppercase tracking-[0.4em] text-stone-400">Montessori Digital Studio</p>
          <h1 className="font-display text-4xl font-semibold text-stone-900 md:text-5xl">Montessori Digital Studio</h1>
          <a
            href="/dashboard"
            className="inline-flex min-w-[320px] items-center justify-center rounded-full border border-sky-200 bg-sky-50 px-8 py-3 text-sm uppercase tracking-[0.25em] text-sky-700 shadow-sm transition hover:bg-sky-100"
          >
            Activity Dashboard
          </a>
        </div>

        <div className="mt-10 grid w-full gap-6 md:grid-cols-2 xl:grid-cols-3">
          <a
            href="/lessons/mathematics"
            aria-label="Open Mathematics hub"
            className={`${CARD_STYLE} max-w-full`}
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
                  <span
                    key={highlight}
                    className="inline-flex items-center gap-1 rounded-full border border-stone-200 px-3 py-1"
                  >
                    <span className="h-1 w-1 rounded-full bg-stone-400" />
                    {highlight}
                  </span>
                ))}
              </div>
            </div>
          </a>

          <a
            href="/lessons/language-arts"
            aria-label="Open Language Arts hub"
            className={`${CARD_STYLE} max-w-full`}
          >
            <div className="flex flex-col gap-5 sm:gap-8">
              <h2 className="font-display text-3xl font-semibold text-stone-900">Language Arts</h2>
              <LanguageArtsPreview className="h-48" />
              <p className="text-sm text-stone-500">
                Initial Sound Cards — trace each letter as you hear its matching object.
              </p>
            </div>
          </a>

          <a
            href="/lessons/history-time"
            aria-label="Open History & Time hub"
            className={`${CARD_STYLE} max-w-full`}
          >
            <div className="flex flex-col gap-5 sm:gap-8">
              <h2 className="font-display text-3xl font-semibold text-stone-900">History &amp; Time</h2>
              <div className="grid h-48 grid-cols-3 gap-3 rounded-[24px] border border-stone-200 bg-gradient-to-br from-amber-50 via-stone-50 to-sky-50 p-3 shadow-inner">
                {["Hours", "Minutes", "Both"].map((label, index) => (
                  <div
                    key={label}
                    className="flex flex-col items-center justify-center rounded-2xl border border-stone-200 bg-white/90"
                  >
                    <HistoryTimeClockPreview
                      mode={index === 0 ? "hours" : index === 1 ? "minutes" : "both"}
                      value={index === 0 ? { h: 3, m: 0 } : index === 1 ? { h: 12, m: 25 } : { h: 4, m: 25 }}
                      className="w-full"
                      viewportClassName="h-20"
                    />
                    <p className="mt-2 text-[10px] uppercase tracking-[0.2em] text-stone-500">{label}</p>
                  </div>
                ))}
              </div>
              <p className="text-sm text-stone-500">Montessori analog clock material with three separate games.</p>
            </div>
          </a>

        </div>

        <div className="mt-6 w-full max-w-5xl">
          <section className="rounded-[32px] border border-cyan-200/70 bg-gradient-to-br from-cyan-100 via-sky-50 to-emerald-100 p-5 shadow-[0_24px_70px_-50px_rgba(14,116,144,0.6)] sm:p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.35em] text-cyan-700">Progress Preview</p>
                <h2 className="font-display text-2xl font-semibold text-stone-900">Activity Dashboard</h2>
                <p className="text-sm text-stone-600">Track progress, attempts, and completion by material.</p>
              </div>
              <a
                href="/dashboard"
                className="inline-flex min-w-[300px] items-center justify-center rounded-full border border-cyan-300 bg-cyan-500 px-8 py-3 text-sm font-semibold uppercase tracking-[0.23em] text-white shadow-md transition hover:bg-cyan-600"
              >
                Open Activity Dashboard
              </a>
            </div>

            <div className="mt-5 grid gap-3 md:grid-cols-3">
              {dashboardPreview.map((preview) => (
                <div
                  key={preview.label}
                  className="rounded-2xl border border-white/70 bg-white/85 p-3 shadow-sm"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="relative h-16 w-16 rounded-full border-4 border-white shadow-inner"
                      style={{
                        background: `conic-gradient(${preview.fill} ${preview.percent * 3.6}deg, ${preview.rest} 0deg)`,
                      }}
                    >
                      <div className="absolute inset-[8px] flex items-center justify-center rounded-full bg-white text-xs font-bold text-stone-700">
                        {preview.percent}%
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-stone-900">{preview.label}</p>
                      <p className="text-xs text-stone-500">{preview.note}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-5 rounded-2xl border border-white/70 bg-white/70 p-2">
              <MicrophonePrivacyToggle compact />
            </div>
          </section>
        </div>

        <div className="mt-6 w-full max-w-5xl">
          <a
            href="/lessons/development-tools"
            aria-label="Open Development Tools hub"
            className={`${CARD_STYLE} block max-w-full`}
          >
            <div className="flex flex-col gap-5 sm:gap-8">
              <h2 className="font-display text-3xl font-semibold text-stone-900">Development Tools</h2>
              <div className="grid h-48 grid-cols-2 gap-3 rounded-[24px] border border-stone-200 bg-gradient-to-br from-slate-100 via-white to-cyan-50 p-4 shadow-inner">
                <div className="rounded-2xl border border-cyan-200 bg-cyan-100/70 p-3">
                  <p className="text-[10px] uppercase tracking-[0.25em] text-cyan-800">3D</p>
                  <p className="mt-2 text-sm font-semibold text-cyan-900">Playground</p>
                </div>
                <div className="rounded-2xl border border-amber-200 bg-amber-100/70 p-3">
                  <p className="text-[10px] uppercase tracking-[0.25em] text-amber-800">Camera</p>
                  <p className="mt-2 text-sm font-semibold text-amber-900">Coordinates</p>
                </div>
                <div className="col-span-2 rounded-2xl border border-emerald-200 bg-emerald-100/70 p-3">
                  <p className="text-[10px] uppercase tracking-[0.25em] text-emerald-800">Copy + Share</p>
                  <p className="mt-2 text-sm font-semibold text-emerald-900">Send exact view values</p>
                </div>
              </div>
              <p className="text-sm text-stone-500">Utilities for dialing in 3D layout and camera settings.</p>
            </div>
          </a>
        </div>
      </main>
    </div>
  );
}
