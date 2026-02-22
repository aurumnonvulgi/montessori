"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import HomeLink from "../../../../components/HomeLink";
import { LESSON_EVENTS_STORAGE_KEY, getLessonEvents, type LessonEvent } from "../../../../lib/lessonTelemetry";
import { MATERIAL_ACTIVITY_STYLES } from "../../../../lib/materialActivityKinds";

const BLEND_ORDER = [
  "bl",
  "br",
  "cl",
  "cr",
  "dr",
  "fl",
  "fr",
  "gl",
  "gr",
  "pl",
  "pr",
  "sc",
  "sk",
  "sl",
  "sm",
  "sn",
  "sp",
  "st",
  "sw",
  "tr",
  "tw",
] as const;

type BlendKey = (typeof BLEND_ORDER)[number];

const BLEND_WORDS: Record<BlendKey, string[]> = {
  bl: ["blab", "blob", "blot", "bluff", "blink"],
  br: ["brag", "brim", "brad", "bran", "brunt"],
  cl: ["clap", "clam", "clad", "clip", "clog"],
  cr: ["crab", "cram", "crib", "crop", "crust"],
  dr: ["drab", "drag", "drip", "drop", "drum"],
  fl: ["flap", "flag", "flip", "flop", "fluff"],
  fr: ["fret", "frog", "from", "frill", "frost"],
  gl: ["glad", "glib", "glob", "glen", "glum"],
  gr: ["grab", "grin", "grit", "grub", "gruff"],
  pl: ["plan", "plum", "plot", "plug", "plop"],
  pr: ["pram", "prim", "prod", "prop", "press"],
  sc: ["scan", "scat", "scalp", "scuff", "scum"],
  sk: ["skid", "skim", "skin", "skip", "skit"],
  sl: ["slab", "slam", "slip", "slot", "slug"],
  sm: ["small", "smell", "smog", "smug", "smirk"],
  sn: ["snag", "snap", "snip", "snub", "sniff"],
  sp: ["span", "spin", "spit", "spot", "spud"],
  st: ["step", "stem", "stiff", "stop", "stump"],
  sw: ["swam", "swap", "swell", "swig", "swim"],
  tr: ["trap", "trim", "trip", "trot", "trunk"],
  tw: ["twin", "twins", "twig", "twill", "twist"],
};

type FileListResponse = {
  files?: unknown;
};

const clampPercent = (value: number) => Math.max(0, Math.min(100, Math.round(value)));

const parseBlendFromPictureFile = (file: string): BlendKey | null => {
  const match = file.match(
    /^([a-z]{2})-[a-z]+-\d+-[a-z]+____consonant_blends(?:_illustratio(?:n(?:s)?)?)?\.png$/i,
  );
  if (!match) return null;
  const candidate = match[1].toLowerCase();
  return BLEND_ORDER.includes(candidate as BlendKey) ? (candidate as BlendKey) : null;
};

export default function ConsonantBlendDoubleAlphabetHub() {
  const [pictureFiles, setPictureFiles] = useState<string[]>([]);
  const [events, setEvents] = useState<LessonEvent[]>([]);
  const activityTag = MATERIAL_ACTIVITY_STYLES["moveable-alphabet"];

  useEffect(() => {
    let active = true;
    const loadPictureFiles = async () => {
      try {
        const response = await fetch("/api/language-arts/consonant-blends/cards-drawings", { cache: "no-store" });
        if (response.ok) {
          const payload = (await response.json()) as FileListResponse;
          const files = Array.isArray(payload.files)
            ? payload.files.filter((value): value is string => typeof value === "string")
            : [];
          if (active) {
            setPictureFiles(files);
          }
        }
      } catch {
        if (active) {
          setPictureFiles([]);
        }
      }
    };
    void loadPictureFiles();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const refreshEvents = () => {
      setEvents(getLessonEvents());
    };
    refreshEvents();
    const onStorage = (event: StorageEvent) => {
      if (event.key && event.key !== LESSON_EVENTS_STORAGE_KEY) return;
      refreshEvents();
    };
    window.addEventListener("storage", onStorage);
    window.addEventListener("focus", refreshEvents);
    window.addEventListener("pageshow", refreshEvents);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("focus", refreshEvents);
      window.removeEventListener("pageshow", refreshEvents);
    };
  }, []);

  const pictureCountByBlend = useMemo(() => {
    const counts = {} as Record<BlendKey, number>;
    BLEND_ORDER.forEach((blend) => {
      counts[blend] = 0;
    });
    pictureFiles.forEach((file) => {
      const blend = parseBlendFromPictureFile(file);
      if (!blend) return;
      counts[blend] += 1;
    });
    return counts;
  }, [pictureFiles]);

  const blendProgress = useMemo(() => {
    const progress = {} as Record<BlendKey, number>;

    BLEND_ORDER.forEach((blend) => {
      const blendEvents = events.filter(
        (event) =>
          event.lesson === "language-arts:consonant-blends:double-alphabet-illustrated" && event.activity === `blend-${blend}`,
      );
      const completedBySignal = blendEvents.some(
        (event) => event.event === "lesson_completed" && event.success !== false,
      );
      const completedStages = new Set<number>();
      let inferredTotalPages = 0;

      blendEvents.forEach((event) => {
        if (event.event === "stage_completed" && event.success !== false && typeof event.page === "number" && event.page > 0) {
          completedStages.add(event.page);
        }
        if (typeof event.totalPages === "number" && event.totalPages > inferredTotalPages) {
          inferredTotalPages = event.totalPages;
        }
      });

      const fallbackTotalPages = pictureCountByBlend[blend] ?? 0;
      const totalPages = inferredTotalPages || fallbackTotalPages;
      const ratioPercent = totalPages > 0 ? (Math.min(completedStages.size, totalPages) / totalPages) * 100 : 0;

      progress[blend] = completedBySignal ? 100 : clampPercent(ratioPercent);
    });

    return progress;
  }, [events, pictureCountByBlend]);

  return (
    <div className="relative min-h-screen bg-[radial-gradient(circle_at_top,#eef6ff,#f9fcff_55%,#f3f8ff)]">
      <HomeLink />
      <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-8 px-6 py-10">
        <header className="space-y-3 text-center">
          <p className="text-xs uppercase tracking-[0.35em] text-stone-400">
            Language Arts · Consonant Blends · Moveable Alphabet
          </p>
          <h1 className="font-display text-4xl font-semibold text-stone-900">Consonant Blend Illustrated Cards</h1>
          <p className="text-sm text-stone-600">Choose a blend group and build each word with red blend letters then black endings.</p>
        </header>

        <section className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {BLEND_ORDER.map((blend) => {
            const pictureCount = pictureCountByBlend[blend] ?? 0;
            const ready = pictureCount > 0;
            const progressPercent = blendProgress[blend] ?? 0;

            return (
              <Link
                key={blend}
                href={ready ? `/lessons/language-arts/consonant-blends/double-alphabet-illustrated/${blend}` : "#"}
                aria-disabled={!ready}
                className={`group flex h-52 items-center rounded-3xl border p-5 shadow-[0_30px_60px_-40px_rgba(15,23,42,0.8)] transition ${
                  ready
                    ? "border-sky-200 bg-gradient-to-br from-sky-100 via-white to-blue-50 hover:-translate-y-0.5 hover:shadow-[0_40px_90px_-50px_rgba(15,23,42,0.7)]"
                    : "cursor-not-allowed border-stone-200 bg-stone-100/60"
                }`}
              >
                <div className="flex h-full w-full items-center gap-4">
                  <div
                    className={`flex h-24 w-24 shrink-0 items-center justify-center rounded-2xl border ${
                      ready ? "border-sky-300 bg-white/80" : "border-stone-300 bg-stone-200/70"
                    }`}
                  >
                    <div
                      className={`flex h-16 w-16 items-center justify-center rounded-full border text-3xl font-semibold uppercase ${
                        ready ? "border-sky-300 bg-sky-100 text-sky-700" : "border-stone-300 bg-stone-100 text-stone-400"
                      }`}
                    >
                      {blend}
                    </div>
                  </div>
                  <div className="flex min-w-0 flex-1 flex-col gap-2">
                    <span
                      className={`inline-flex w-fit rounded-xl border px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] ${activityTag.className}`}
                    >
                      {activityTag.label}
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {BLEND_WORDS[blend].map((word) => (
                        <span
                          key={`${blend}-${word}`}
                          className={`rounded-full border px-2.5 py-1 text-xs font-semibold lowercase ${
                            ready
                              ? "border-sky-200 bg-white/80 text-sky-800"
                              : "border-stone-300 bg-stone-200/70 text-stone-500"
                          }`}
                        >
                          {word}
                        </span>
                      ))}
                    </div>
                    <div className="mt-1">
                      <div className="flex items-center justify-between text-[11px] uppercase tracking-[0.22em] text-stone-500">
                        <span>Progress</span>
                        <span>{progressPercent}%</span>
                      </div>
                      <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-stone-200/80">
                        <div
                          className={`h-full rounded-full ${progressPercent >= 100 ? "bg-emerald-500" : "bg-sky-500"}`}
                          style={{ width: `${progressPercent}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </section>

        <div className="flex flex-wrap gap-4">
          <Link
            href="/lessons/language-arts/consonant-blends"
            className="inline-flex items-center justify-center rounded-full border border-stone-300 px-5 py-2 text-xs uppercase tracking-[0.4em] text-stone-500"
          >
            Back to Blue Series
          </Link>
        </div>
      </main>
    </div>
  );
}
