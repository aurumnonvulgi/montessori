"use client";

import Link from "next/link";
import HomeLink from "./HomeLink";
import HistoryTimeClockPreview from "./HistoryTimeClockPreview";
import { type ClockMode, type TimeValue } from "../lib/timeMath";
import { MATERIAL_ACTIVITY_STYLES, type MaterialActivityKind } from "../lib/materialActivityKinds";

type HistoryTimeTrackHubProps = {
  title: string;
  subtitle: string;
  activityLabel: string;
  activityHref: string;
  badge: string;
  activityKind?: MaterialActivityKind;
  activityCardPosition?: "first" | "last";
  mode: ClockMode;
  value: TimeValue;
  materials?: Array<{
    label: string;
    href: string;
    badge: string;
    mode: ClockMode;
    value: TimeValue;
    ctaLabel?: string;
    note?: string;
    activityKind?: MaterialActivityKind;
  }>;
};

type HubCard = {
  label: string;
  href: string;
  badge: string;
  mode: ClockMode;
  value: TimeValue;
  ctaLabel: string;
  note: string;
  activityKind?: MaterialActivityKind;
};

export default function HistoryTimeTrackHub({
  title,
  subtitle,
  activityLabel,
  activityHref,
  badge,
  activityKind,
  activityCardPosition = "first",
  mode,
  value,
  materials = [],
}: HistoryTimeTrackHubProps) {
  const activityCard: HubCard = {
    label: activityLabel,
    href: activityHref,
    badge,
    mode,
    value,
    ctaLabel: "Open activities",
    note: "",
    activityKind,
  };
  const materialCards: HubCard[] = materials.map((item) => ({
    label: item.label,
    href: item.href,
    badge: item.badge,
    mode: item.mode,
    value: item.value,
    ctaLabel: item.ctaLabel ?? "Open material",
    note: item.note ?? "",
    activityKind: item.activityKind,
  }));
  const cards: HubCard[] =
    activityCardPosition === "last" ? [...materialCards, activityCard] : [activityCard, ...materialCards];

  return (
    <div className="relative min-h-screen bg-[radial-gradient(circle_at_top,#f3efe8,#faf7f2_52%,#f1ebe2)]">
      <HomeLink />
      <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col gap-7 px-6 py-10 sm:px-10">
        <header className="space-y-2 text-center">
          <p className="text-xs uppercase tracking-[0.35em] text-stone-500">History &amp; Time</p>
          <h1 className="font-display text-4xl font-semibold text-stone-900">{title}</h1>
          <p className="text-sm text-stone-600">{subtitle}</p>
        </header>

        <section className={`mx-auto grid w-full gap-5 ${cards.length > 1 ? "max-w-5xl md:grid-cols-2" : "max-w-xl"}`}>
          {cards.map((card) => {
            const materialTag = card.activityKind ? MATERIAL_ACTIVITY_STYLES[card.activityKind] : null;
            return (
              <Link
                key={card.href}
                href={card.href}
                className="group block rounded-3xl border border-stone-200 bg-white/90 p-6 shadow-[0_28px_65px_-45px_rgba(15,23,42,0.75)] transition hover:-translate-y-0.5 hover:shadow-[0_36px_75px_-45px_rgba(15,23,42,0.75)]"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="font-display text-3xl font-semibold text-stone-900">{card.label}</p>
                    {materialTag ? (
                      <span
                        className={`mt-2 inline-flex rounded-xl border px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] ${materialTag.className}`}
                      >
                        {materialTag.label}
                      </span>
                    ) : null}
                  </div>
                  {!materialTag ? (
                    <span className="rounded-full border border-stone-300 bg-stone-100 px-3 py-1 text-[10px] uppercase tracking-[0.24em] text-stone-700">
                      {card.badge}
                    </span>
                  ) : null}
                </div>
                <div className="mt-4 overflow-hidden rounded-2xl border border-stone-200 bg-stone-50">
                  <HistoryTimeClockPreview mode={card.mode} value={card.value} />
                </div>
                {card.note ? <p className="mt-3 text-sm text-stone-600">{card.note}</p> : null}
                <p className="mt-4 text-xs uppercase tracking-[0.24em] text-stone-500">{card.ctaLabel}</p>
              </Link>
            );
          })}
        </section>
      </main>
    </div>
  );
}
