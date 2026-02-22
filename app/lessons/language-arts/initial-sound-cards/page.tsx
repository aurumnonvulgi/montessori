"use client";

import Link from "next/link";
import HomeLink from "../../../components/HomeLink";
import InitialSoundDevBanner from "../../../components/InitialSoundDevBanner";
import MaterialTeachersGuide from "../../../components/MaterialTeachersGuide";
import { INITIAL_SOUND_CARDS_TEACHERS_GUIDE } from "../../../data/languageArtsTeachersGuides";
import { initialSoundGroups } from "./data";

export default function InitialSoundCardsPage() {
  return (
    <div className="relative min-h-screen bg-[radial-gradient(circle_at_top,#f5efe6,#fdfbf8_55%,#f7efe4)]">
      <HomeLink />
      <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col items-stretch gap-6 px-6 py-10">
        <div className="space-y-3 text-center">
          <p className="text-xs uppercase tracking-[0.3em] text-stone-400">Language Arts</p>
          <h1 className="font-display text-4xl font-semibold text-stone-900">Initial Sound Cards</h1>
          <p className="text-sm text-stone-600">Choose a letter group to continue tracing sounds.</p>
        </div>
        <InitialSoundDevBanner />
        <div className="grid gap-6 grid-cols-1 sm:grid-cols-2">
          {initialSoundGroups.map((group) => (
            <Link
              key={group.slug}
              href={`/lessons/language-arts/initial-sound-cards/group/${group.slug}`}
              className="group flex h-40 flex-row rounded-3xl border border-stone-200 p-6 transition hover:shadow-[0_20px_40px_-30px_rgba(15,23,42,0.8)] bg-white"
            >
              <div className="flex h-full w-1/3 items-center justify-center">
                <img
                  src={group.slides[0]?.image}
                  alt={group.slides[0]?.word ?? group.slug}
                  className="max-h-full max-w-full object-contain"
                />
              </div>
              <div className="flex flex-1 items-center pl-4">
                <p className="text-3xl font-semibold uppercase tracking-[0.2em]" style={{ color: group.color }}>
                  {group.letters.join(" · ")}
                </p>
              </div>
            </Link>
          ))}
        </div>
        <MaterialTeachersGuide guide={INITIAL_SOUND_CARDS_TEACHERS_GUIDE} />
      </div>
    </div>
  );
}
