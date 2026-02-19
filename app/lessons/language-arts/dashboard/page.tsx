"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import HomeLink from "../../../components/HomeLink";
import MicrophonePrivacyToggle from "../../../components/MicrophonePrivacyToggle";
import { initialSoundGroups } from "../initial-sound-cards/data";
import { LILAC_WORD_SETS } from "../lilac-word-lists/data";
import {
  LESSON_EVENTS_STORAGE_KEY,
  clearLessonEvents,
  getLessonEvents,
  type LessonEvent,
} from "../../../lib/lessonTelemetry";

const VOWELS = ["a", "e", "i", "o", "u"] as const;
const WORDS_PER_LILAC_PAGE = 10;

type MathLesson = {
  key: string;
  label: string;
  href: string;
  telemetry?: {
    lesson: string;
    completionEvent: string;
    completionSignalEvent: string;
    totalUnits?: number;
  };
};

const MATH_LESSONS: MathLesson[] = [
  {
    key: "hundred-board-complete",
    label: "Hundred Board",
    href: "/lessons/hundred-board",
    telemetry: {
      lesson: "mathematics:hundred-board",
      completionEvent: "batch_completed",
      completionSignalEvent: "lesson_completed",
      totalUnits: 10,
    },
  },
  { key: "number-rods-complete", label: "Number Rods", href: "/lessons/number-rods" },
  { key: "sandpaper-numerals-complete", label: "Sandpaper Numerals", href: "/lessons/sandpaper-numerals" },
  { key: "spindle-boxes-complete", label: "Spindle Boxes", href: "/lessons/spindle-boxes" },
  { key: "numerals-and-counters-complete", label: "Numerals & Counters", href: "/lessons/numerals-and-counters" },
  { key: "short-bead-stair-complete", label: "Short Bead Stair", href: "/lessons/short-bead-stair" },
  { key: "teen-board-quantities-complete", label: "Teen Board Quantities", href: "/lessons/teen-board" },
  { key: "teen-board-symbols-complete", label: "Teen Board Symbols", href: "/lessons/teen-board-symbols" },
];

type ProgressItem = {
  key: string;
  label: string;
  percent: number;
  status: string;
  detail: string;
  href?: string;
};

type ActivityProgress = ProgressItem & {
  vowelItems: ProgressItem[];
};

const clampPercent = (value: number) => Math.max(0, Math.min(100, Math.round(value)));
const isComplete = (percent: number) => percent >= 100;

const toStatus = (percent: number) => {
  if (percent >= 100) return "100% done";
  if (percent <= 0) return "Not Started";
  return `${percent}% in progress`;
};

const averagePercent = (items: ProgressItem[]) => {
  if (!items.length) return 0;
  const total = items.reduce((sum, item) => sum + item.percent, 0);
  return clampPercent(total / items.length);
};

const getMaxTotalPages = (events: LessonEvent[]) =>
  events.reduce((max, event) => {
    const totalPages = typeof event.totalPages === "number" ? event.totalPages : 0;
    return totalPages > max ? totalPages : max;
  }, 0);

const getCompletedUnits = (events: LessonEvent[], completionEvent: string) => {
  const pages = new Set<number>();
  events.forEach((event) => {
    if (event.event !== completionEvent) return;
    if (typeof event.page === "number" && event.page > 0) {
      pages.add(event.page);
    }
  });
  return pages.size;
};

const buildProgressItem = ({
  key,
  label,
  events,
  completionEvent,
  completionSignalEvent,
  totalUnits,
  href,
}: {
  key: string;
  label: string;
  events: LessonEvent[];
  completionEvent: string;
  completionSignalEvent: string;
  totalUnits?: number;
  href?: string;
}): ProgressItem => {
  const completedUnits = getCompletedUnits(events, completionEvent);
  const inferredUnits = getMaxTotalPages(events);
  const resolvedUnits = totalUnits ?? inferredUnits;
  const completedBySignal = events.some((event) => event.event === completionSignalEvent && event.success !== false);
  const ratioPercent = resolvedUnits > 0 ? (Math.min(completedUnits, resolvedUnits) / resolvedUnits) * 100 : 0;
  const percent = completedBySignal ? 100 : clampPercent(ratioPercent);
  const status = toStatus(percent);
  const detail = resolvedUnits > 0 ? `${Math.min(completedUnits, resolvedUnits)}/${resolvedUnits} completed` : "No activity yet";
  return { key, label, percent, status, detail, href };
};

const buildVowelProgress = ({
  events,
  lesson,
  completionEvent,
  completionSignalEvent,
  hrefForVowel,
}: {
  events: LessonEvent[];
  lesson: string;
  completionEvent: string;
  completionSignalEvent: string;
  hrefForVowel: (vowel: string) => string;
}) =>
  VOWELS.map((vowel) => {
    const activity = `vowel-${vowel}`;
    const vowelEvents = events.filter((event) => event.lesson === lesson && event.activity === activity);
    return buildProgressItem({
      key: `${lesson}-${activity}`,
      label: vowel.toUpperCase(),
      events: vowelEvents,
      completionEvent,
      completionSignalEvent,
      href: hrefForVowel(vowel),
    });
  });

const buildActivityProgress = ({
  key,
  label,
  href,
  vowelItems,
}: {
  key: string;
  label: string;
  href: string;
  vowelItems: ProgressItem[];
}): ActivityProgress => {
  const percent = averagePercent(vowelItems);
  const doneCount = vowelItems.filter((item) => item.percent >= 100).length;
  return {
    key,
    label,
    href,
    percent,
    status: toStatus(percent),
    detail: `${doneCount}/${vowelItems.length} vowels complete`,
    vowelItems,
  };
};

function Pie({ percent, color }: { percent: number; color: string }) {
  const complete = isComplete(percent);
  const fillColor = complete ? "#16a34a" : color;
  return (
    <div
      className="relative h-16 w-16 rounded-full"
      style={{ background: `conic-gradient(${fillColor} ${percent}%, #e5e7eb ${percent}% 100%)` }}
    >
      <div className={`absolute inset-2 flex items-center justify-center rounded-full bg-white text-xs font-semibold ${complete ? "text-emerald-700" : "text-stone-800"}`}>
        {percent}%
      </div>
      {complete ? (
        <span className="absolute -right-1 -top-1 inline-flex h-4 w-4 items-center justify-center rounded-full bg-emerald-600 text-[10px] font-bold text-white">
          ✓
        </span>
      ) : null}
    </div>
  );
}

function ProgressBar({ percent, color }: { percent: number; color: string }) {
  const complete = isComplete(percent);
  return (
    <div className="w-full">
      <div className="h-3 w-full overflow-hidden rounded-full bg-stone-200">
        <div
          className="h-full rounded-full transition-all"
          style={{
            width: `${percent}%`,
            backgroundColor: complete ? "#16a34a" : color,
          }}
        />
      </div>
      <p className={`mt-1 text-right text-xs font-semibold ${complete ? "text-emerald-700" : "text-stone-700"}`}>
        {percent}% {complete ? "✓" : ""}
      </p>
    </div>
  );
}

function OpenCard({
  title,
  subtitle,
  percent,
  color,
  open,
  onToggle,
  topLayer,
  children,
}: {
  title: string;
  subtitle: string;
  percent: number;
  color: string;
  open: boolean;
  onToggle: () => void;
  topLayer?: boolean;
  children: React.ReactNode;
}) {
  const complete = isComplete(percent);
  return (
    <section className={`rounded-3xl border bg-white/90 p-4 shadow-sm ${complete ? "border-emerald-300" : "border-stone-200"}`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <button type="button" onClick={onToggle} className="min-w-[260px] flex-1 text-left">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              {topLayer ? null : <Pie percent={percent} color={color} />}
              <div>
                <p className={`text-lg font-semibold ${complete ? "text-emerald-800" : "text-stone-900"}`}>
                  {title} {complete ? "✓" : ""}
                </p>
                <p className="text-xs uppercase tracking-[0.25em] text-stone-500">{subtitle}</p>
              </div>
            </div>
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-stone-500">
              {open ? "Hide" : "Show"}
            </span>
          </div>
          {topLayer ? (
            <div className="mt-3">
              <ProgressBar percent={percent} color={color} />
            </div>
          ) : null}
        </button>
      </div>
      {open ? <div className="mt-4">{children}</div> : null}
    </section>
  );
}

function ActivityCard({ item, color }: { item: ActivityProgress; color: string }) {
  const complete = isComplete(item.percent);
  return (
    <div className={`rounded-2xl border bg-white p-4 shadow-sm ${complete ? "border-emerald-300 bg-emerald-50/40" : "border-stone-200"}`}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Pie percent={item.percent} color={color} />
          <div>
            <p className={`font-semibold ${complete ? "text-emerald-800" : "text-stone-900"}`}>
              {item.label} {complete ? "✓" : ""}
            </p>
            <p className={`text-sm ${complete ? "text-emerald-700" : "text-stone-600"}`}>{item.status}</p>
            <p className="text-xs text-stone-500">{item.detail}</p>
          </div>
        </div>
        {item.href ? (
          <Link
            href={item.href}
            className="rounded-full border border-sky-200 bg-sky-50 px-3 py-2 text-[11px] uppercase tracking-[0.2em] text-sky-700"
          >
            Work on This Activity
          </Link>
        ) : null}
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {item.vowelItems.map((vowelItem) => (
          vowelItem.href ? (
            <Link
              key={vowelItem.key}
              href={vowelItem.href}
              className={`rounded-full border px-3 py-1 text-[11px] font-semibold transition ${
                vowelItem.percent >= 100
                  ? "border-emerald-300 bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
                  : "border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100"
              }`}
            >
              {vowelItem.label} {vowelItem.status} {vowelItem.percent >= 100 ? "✓" : ""}
            </Link>
          ) : (
            <span
              key={vowelItem.key}
              className={`rounded-full border px-3 py-1 text-[11px] font-semibold ${
                vowelItem.percent >= 100
                  ? "border-emerald-300 bg-emerald-100 text-emerald-800"
                  : "border-stone-300 bg-stone-50 text-stone-600"
              }`}
            >
              {vowelItem.label} {vowelItem.status} {vowelItem.percent >= 100 ? "✓" : ""}
            </span>
          )
        ))}
      </div>
    </div>
  );
}

export default function LanguageArtsDashboardPage() {
  const router = useRouter();
  const [events, setEvents] = useState<LessonEvent[]>([]);
  const [openCategory, setOpenCategory] = useState({
    language: true,
    math: false,
    cultural: false,
    sensorial: false,
    phonics: true,
  });

  const refreshEvents = () => {
    setEvents(getLessonEvents());
  };

  const handleClearRecords = () => {
    if (!window.confirm("Clear all tracking records?")) return;
    if (!window.confirm("Are you sure? This will permanently remove all records.")) return;
    clearLessonEvents();
    refreshEvents();
  };

  useEffect(() => {
    refreshEvents();
    const onStorage = (event: StorageEvent) => {
      if (event.key && event.key !== LESSON_EVENTS_STORAGE_KEY) return;
      refreshEvents();
    };
    const interval = window.setInterval(refreshEvents, 1500);
    window.addEventListener("storage", onStorage);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  const attemptResults = useMemo(() => events.filter((event) => event.event === "attempt_result"), [events]);
  const totalAttempts = attemptResults.length || events.filter((event) => event.event === "attempt_started").length;
  const totalSuccesses = attemptResults.filter((event) => event.success).length;
  const successRate = totalAttempts ? clampPercent((totalSuccesses / totalAttempts) * 100) : 0;

  const completionFlagSet = useMemo(
    () =>
      new Set(
        events
          .filter((event) => event.lesson === "app:completion-flags" && event.event === "completion_flag_set")
          .map((event) => event.value)
          .filter((value): value is string => Boolean(value))
      ),
    [events]
  );

  const moveableAlphabet = useMemo(
    () =>
      buildActivityProgress({
        key: "moveable-alphabet",
        label: "Phonics Moveable Alphabet",
        href: "/lessons/language-arts/moveable-alphabet",
        vowelItems: buildVowelProgress({
          events,
          lesson: "language-arts:moveable-alphabet",
          completionEvent: "stage_completed",
          completionSignalEvent: "lesson_completed",
          hrefForVowel: (vowel) => `/lessons/language-arts/moveable-alphabet/${vowel}`,
        }),
      }),
    [events]
  );

  const phonicLabels = useMemo(
    () =>
      buildActivityProgress({
        key: "phonic-labels",
        label: "Phonic Picture Cards with Word Labels",
        href: "/lessons/language-arts/phonic-labels",
        vowelItems: buildVowelProgress({
          events,
          lesson: "language-arts:phonic-labels",
          completionEvent: "stage_completed",
          completionSignalEvent: "lesson_completed",
          hrefForVowel: (vowel) => `/lessons/language-arts/phonic-labels/${vowel}`,
        }),
      }),
    [events]
  );

  const threePartCards = useMemo(
    () =>
      buildActivityProgress({
        key: "three-part-cards",
        label: "Phonics Three-Part Cards",
        href: "/lessons/language-arts/phonic-three-part-cards",
        vowelItems: buildVowelProgress({
          events,
          lesson: "language-arts:phonic-three-part-cards",
          completionEvent: "stage_completed",
          completionSignalEvent: "lesson_completed",
          hrefForVowel: (vowel) => `/lessons/language-arts/phonic-three-part-cards/${vowel}`,
        }),
      }),
    [events]
  );

  const threePartCardsLabels = useMemo(
    () =>
      buildActivityProgress({
        key: "three-part-cards-labels",
        label: "Phonics Three-Part + Labels",
        href: "/lessons/language-arts/phonic-three-part-cards-labels",
        vowelItems: buildVowelProgress({
          events,
          lesson: "language-arts:phonic-three-part-cards-labels",
          completionEvent: "stage_completed",
          completionSignalEvent: "lesson_completed",
          hrefForVowel: (vowel) => `/lessons/language-arts/phonic-three-part-cards-labels/${vowel}`,
        }),
      }),
    [events]
  );

  const readingBooks = useMemo(
    () =>
      buildActivityProgress({
        key: "reading-books",
        label: "Phonics Reading Booklets",
        href: "/lessons/language-arts/phonics/reading-book",
        vowelItems: buildVowelProgress({
          events,
          lesson: "language-arts:phonics-reading-book",
          completionEvent: "page_completed",
          completionSignalEvent: "lesson_completed",
          hrefForVowel: (vowel) => `/lessons/language-arts/phonics/reading-book?vowel=${vowel}`,
        }),
      }),
    [events]
  );

  const phonicsActivities = [moveableAlphabet, phonicLabels, threePartCards, threePartCardsLabels, readingBooks];
  const phonicsPercent = averagePercent(phonicsActivities);

  const lilacSetItems = useMemo(() => {
    return LILAC_WORD_SETS.map((set) => {
      const activity = `set-${set.label}`;
      const setEvents = events.filter(
        (event) =>
          event.lesson === "language-arts:lilac-word-lists" &&
          event.activity === activity
      );
      return buildProgressItem({
        key: `lilac-${set.slug}`,
        label: `Lilac ${set.label}`,
        events: setEvents,
        completionEvent: "page_completed",
        completionSignalEvent: "set_completed",
        totalUnits: Math.ceil(set.words.length / WORDS_PER_LILAC_PAGE),
        href: `/lessons/language-arts/lilac-word-lists/${set.slug}`,
      });
    });
  }, [events]);

  const lilacPercent = averagePercent(lilacSetItems);

  const initialSoundGroupItems = useMemo(() => {
    return initialSoundGroups.map((group) => {
      const activity = `group-${group.slug}`;
      const groupEvents = events.filter(
        (event) =>
          event.lesson === "language-arts:initial-sound-cards" &&
          event.activity === activity
      );
      return buildProgressItem({
        key: `initial-sound-${group.slug}`,
        label: `${group.label} (${group.letters.join(" · ").toUpperCase()})`,
        events: groupEvents,
        completionEvent: "slide_viewed",
        completionSignalEvent: "lesson_completed",
        totalUnits: group.slides.length,
        href: `/lessons/language-arts/initial-sound-cards/group/${group.slug}`,
      });
    });
  }, [events]);

  const conceptDevelopmentItems = useMemo(() => {
    const activities = [
      {
        key: "concept-opposites",
        label: "Opposites",
        href: "/lessons/language-arts/concept-development/opposites",
        lesson: "language-arts:concept-development-opposites",
      },
      {
        key: "concept-associations",
        label: "Associations",
        href: "/lessons/language-arts/concept-development/associations",
        lesson: "language-arts:concept-development-associations",
      },
      {
        key: "concept-transportation",
        label: "Transportation",
        href: "/lessons/language-arts/concept-development/transportation",
        lesson: "language-arts:concept-development-transportation",
      },
      {
        key: "concept-parts-to-whole",
        label: "Parts to Whole",
        href: "/lessons/language-arts/concept-development/parts-to-whole",
        lesson: "language-arts:concept-development-parts-to-whole",
      },
    ] as const;

    return activities.map((activity) => {
      const conceptEvents = events.filter((event) => event.lesson === activity.lesson);
      return buildProgressItem({
        key: activity.key,
        label: activity.label,
        events: conceptEvents,
        completionEvent: "stage_completed",
        completionSignalEvent: "lesson_completed",
        href: activity.href,
      });
    });
  }, [events]);

  const initialSoundPercent = averagePercent(initialSoundGroupItems);
  const conceptDevelopmentPercent = averagePercent(conceptDevelopmentItems);
  const languagePercent = averagePercent([
    { key: "lang-phonics", label: "Phonics", percent: phonicsPercent, status: "", detail: "" },
    { key: "lang-lilac", label: "Lilac", percent: lilacPercent, status: "", detail: "" },
    { key: "lang-initial", label: "Initial Sound", percent: initialSoundPercent, status: "", detail: "" },
    { key: "lang-concept", label: "Concept Development", percent: conceptDevelopmentPercent, status: "", detail: "" },
  ]);

  const mathItems = useMemo(
    () =>
      MATH_LESSONS.map((lesson) => {
        const completedByFlag = completionFlagSet.has(lesson.key);
        const telemetry = lesson.telemetry;

        if (!telemetry) {
          const percent = completedByFlag ? 100 : 0;
          return {
            key: lesson.key,
            label: lesson.label,
            percent,
            status: toStatus(percent),
            detail: percent >= 100 ? "Complete" : "Not Started",
            href: lesson.href,
          };
        }

        const lessonEvents = events.filter((event) => event.lesson === telemetry.lesson);
        const trackedItem = buildProgressItem({
          key: lesson.key,
          label: lesson.label,
          events: lessonEvents,
          completionEvent: telemetry.completionEvent,
          completionSignalEvent: telemetry.completionSignalEvent,
          totalUnits: telemetry.totalUnits,
          href: lesson.href,
        });

        if (!completedByFlag) {
          return trackedItem;
        }

        return {
          ...trackedItem,
          percent: 100,
          status: toStatus(100),
          detail: "Complete",
        };
      }),
    [completionFlagSet, events]
  );
  const mathPercent = averagePercent(mathItems);

  const culturalPercent = 0;
  const sensorialPercent = 0;

  return (
    <div className="relative min-h-screen bg-[radial-gradient(circle_at_top,#f5efe6,#fdfbf8_55%,#f7efe4)]">
      <HomeLink onClick={() => router.push("/")} />
      <main className="mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-6 px-6 py-10">
        <header className="space-y-2 text-center">
          <p className="text-xs uppercase tracking-[0.35em] text-stone-400">Dashboard</p>
          <h1 className="font-display text-4xl font-semibold text-stone-900">Material Progress</h1>
          <p className="text-sm text-stone-600">Open each category card to drill down into groups and activities.</p>
        </header>

        <section className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-stone-200 bg-white/90 p-4 shadow-sm">
            <p className="text-[11px] uppercase tracking-[0.25em] text-stone-500">Tracked Events</p>
            <p className="mt-2 text-3xl font-semibold text-stone-900">{events.length}</p>
          </div>
          <div className="rounded-2xl border border-stone-200 bg-white/90 p-4 shadow-sm">
            <p className="text-[11px] uppercase tracking-[0.25em] text-stone-500">Attempts</p>
            <p className="mt-2 text-3xl font-semibold text-stone-900">{totalAttempts}</p>
          </div>
          <div className="rounded-2xl border border-stone-200 bg-white/90 p-4 shadow-sm">
            <p className="text-[11px] uppercase tracking-[0.25em] text-stone-500">Success Rate</p>
            <p className="mt-2 text-3xl font-semibold text-emerald-700">{successRate}%</p>
          </div>
        </section>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={refreshEvents}
            className="rounded-full border border-stone-300 px-4 py-2 text-xs uppercase tracking-[0.22em] text-stone-700"
          >
            Refresh
          </button>
          <button
            type="button"
            onClick={handleClearRecords}
            className="rounded-full border border-rose-200 bg-rose-50 px-4 py-2 text-xs uppercase tracking-[0.22em] text-rose-700"
          >
            Clear Records
          </button>
        </div>

        <MicrophonePrivacyToggle />

        <OpenCard
          title="Language"
          subtitle={toStatus(languagePercent)}
          percent={languagePercent}
          color="#7c3aed"
          topLayer
          open={openCategory.language}
          onToggle={() => setOpenCategory((prev) => ({ ...prev, language: !prev.language }))}
        >
          <OpenCard
            title="Phonics"
            subtitle={toStatus(phonicsPercent)}
            percent={phonicsPercent}
            color="#0369a1"
            open={openCategory.phonics}
            onToggle={() => setOpenCategory((prev) => ({ ...prev, phonics: !prev.phonics }))}
          >
            <div className="rounded-2xl border border-sky-200 bg-gradient-to-br from-sky-50 via-indigo-50 to-blue-50 p-4">
              <p className="mb-3 text-xs uppercase tracking-[0.28em] text-sky-700">All Phonics Metrics</p>
              <div className="grid gap-3 lg:grid-cols-2">
                {phonicsActivities.map((activity) => (
                  <ActivityCard key={activity.key} item={activity} color="#0284c7" />
                ))}
              </div>
            </div>
          </OpenCard>

          <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            <section className="rounded-2xl border border-fuchsia-200 bg-gradient-to-br from-fuchsia-50 to-rose-50 p-4">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <Pie percent={initialSoundPercent} color="#d946ef" />
                  <div>
                    <p className="font-semibold text-stone-900">Initial Sound</p>
                    <p className="text-sm text-stone-600">{toStatus(initialSoundPercent)}</p>
                  </div>
                </div>
                <Link
                  href="/lessons/language-arts/initial-sound"
                  className="rounded-full border border-sky-200 bg-sky-50 px-3 py-2 text-[11px] uppercase tracking-[0.2em] text-sky-700"
                >
                  Work on This Activity
                </Link>
              </div>
              <div className="space-y-2">
                {initialSoundGroupItems.map((item) => (
                  <div
                    key={item.key}
                    className={`flex items-center justify-between rounded-xl border bg-white/80 px-3 py-2 text-sm ${
                      item.percent >= 100 ? "border-emerald-300" : "border-fuchsia-200"
                    }`}
                  >
                    <span className={`font-semibold ${item.percent >= 100 ? "text-emerald-800" : "text-stone-700"}`}>
                      {item.label}
                    </span>
                    <span className={item.percent >= 100 ? "text-emerald-700" : "text-stone-600"}>
                      {item.status} {item.percent >= 100 ? "✓" : ""}
                    </span>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-2xl border border-violet-200 bg-gradient-to-br from-violet-50 to-purple-50 p-4">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <Pie percent={lilacPercent} color="#9333ea" />
                  <div>
                    <p className="font-semibold text-stone-900">Lilac Word Lists</p>
                    <p className="text-sm text-stone-600">{toStatus(lilacPercent)}</p>
                  </div>
                </div>
                <Link
                  href="/lessons/language-arts/lilac-word-lists"
                  className="rounded-full border border-sky-200 bg-sky-50 px-3 py-2 text-[11px] uppercase tracking-[0.2em] text-sky-700"
                >
                  Work on This Activity
                </Link>
              </div>
              <div className="space-y-2">
                {lilacSetItems.map((item) => (
                  <div
                    key={item.key}
                    className={`flex items-center justify-between rounded-xl border bg-white/80 px-3 py-2 text-sm ${
                      item.percent >= 100 ? "border-emerald-300" : "border-violet-200"
                    }`}
                  >
                    <span className={`font-semibold ${item.percent >= 100 ? "text-emerald-800" : "text-stone-700"}`}>
                      {item.label}
                    </span>
                    <span className={item.percent >= 100 ? "text-emerald-700" : "text-stone-600"}>
                      {item.status} {item.percent >= 100 ? "✓" : ""}
                    </span>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50 p-4">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <Pie percent={conceptDevelopmentPercent} color="#d97706" />
                  <div>
                    <p className="font-semibold text-stone-900">Concept Development</p>
                    <p className="text-sm text-stone-600">{toStatus(conceptDevelopmentPercent)}</p>
                  </div>
                </div>
                <Link
                  href="/lessons/language-arts/concept-development"
                  className="rounded-full border border-sky-200 bg-sky-50 px-3 py-2 text-[11px] uppercase tracking-[0.2em] text-sky-700"
                >
                  Work on This Activity
                </Link>
              </div>
              <div className="space-y-2">
                {conceptDevelopmentItems.map((item) => (
                  <div
                    key={item.key}
                    className={`flex items-center justify-between gap-2 rounded-xl border bg-white/80 px-3 py-2 text-sm ${
                      item.percent >= 100 ? "border-emerald-300" : "border-amber-200"
                    }`}
                  >
                    <span className={`font-semibold ${item.percent >= 100 ? "text-emerald-800" : "text-stone-700"}`}>
                      {item.label}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className={item.percent >= 100 ? "text-emerald-700" : "text-stone-600"}>
                        {item.status} {item.percent >= 100 ? "✓" : ""}
                      </span>
                      {item.href ? (
                        <Link
                          href={item.href}
                          className="rounded-full border border-amber-300 bg-amber-100 px-2 py-1 text-[10px] uppercase tracking-[0.18em] text-amber-800"
                        >
                          Open
                        </Link>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </OpenCard>

        <OpenCard
          title="Math"
          subtitle={toStatus(mathPercent)}
          percent={mathPercent}
          color="#16a34a"
          topLayer
          open={openCategory.math}
          onToggle={() => setOpenCategory((prev) => ({ ...prev, math: !prev.math }))}
        >
          <div className="grid gap-2 md:grid-cols-2">
            {mathItems.map((item) => (
              <div
                key={item.key}
                className={`flex items-center justify-between rounded-xl border px-3 py-2 ${
                  item.percent >= 100 ? "border-emerald-300 bg-emerald-100/70" : "border-emerald-200 bg-emerald-50/50"
                }`}
              >
                <div>
                  <p className={`font-semibold ${item.percent >= 100 ? "text-emerald-800" : "text-stone-800"}`}>
                    {item.label} {item.percent >= 100 ? "✓" : ""}
                  </p>
                  <p className={`text-xs ${item.percent >= 100 ? "text-emerald-700" : "text-stone-500"}`}>
                    {item.status}
                  </p>
                  <p className="text-[11px] text-stone-500">{item.detail}</p>
                </div>
                {item.href ? (
                  <Link
                    href={item.href}
                    className="rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-[10px] uppercase tracking-[0.18em] text-sky-700"
                  >
                    Work on This Activity
                  </Link>
                ) : null}
              </div>
            ))}
          </div>
        </OpenCard>

        <OpenCard
          title="Cultural"
          subtitle={toStatus(culturalPercent)}
          percent={culturalPercent}
          color="#f59e0b"
          topLayer
          open={openCategory.cultural}
          onToggle={() => setOpenCategory((prev) => ({ ...prev, cultural: !prev.cultural }))}
        >
          <p className="rounded-2xl border border-dashed border-amber-300 bg-amber-50 p-4 text-sm text-amber-800">
            Tracking UI is ready. Activities can be connected as soon as Cultural lessons are added.
          </p>
        </OpenCard>

        <OpenCard
          title="Sensorial"
          subtitle={toStatus(sensorialPercent)}
          percent={sensorialPercent}
          color="#db2777"
          topLayer
          open={openCategory.sensorial}
          onToggle={() => setOpenCategory((prev) => ({ ...prev, sensorial: !prev.sensorial }))}
        >
          <p className="rounded-2xl border border-dashed border-pink-300 bg-pink-50 p-4 text-sm text-pink-800">
            Tracking UI is ready. Activities can be connected as soon as Sensorial lessons are added.
          </p>
        </OpenCard>
      </main>
    </div>
  );
}
