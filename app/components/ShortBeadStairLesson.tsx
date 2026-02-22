"use client";

import { useCallback, useMemo, useState } from "react";
import * as THREE from "three";
import ShortBeadStairScene from "./ShortBeadStairScene";
import HomeLink from "./HomeLink";
import MaterialTeachersGuide from "./MaterialTeachersGuide";
import { SHORT_BEAD_STAIR_TEACHERS_GUIDE } from "../data/materialTeachersGuides";

type HomePositions = Record<number, THREE.Vector3[]>;

export default function ShortBeadStairLesson() {
  const [phase, setPhase] = useState<"idle" | "started">("idle");
  const [homePositions, setHomePositions] = useState<HomePositions | null>(null);

  const handleStart = useCallback(() => {
    setPhase("started");
  }, []);

  const instruction = useMemo(() => {
    if (phase === "idle") {
      return "This is the short bead stair material. Start the lesson when you are ready.";
    }
    return "We recorded each bar: use the beads to practice counting and the three-period lesson.";
  }, [phase]);

  return (
    <div className="relative min-h-screen bg-[radial-gradient(circle_at_top,#f5efe6_0%,#fdfbf8_45%,#f7efe4_100%)]">
      <HomeLink />
      <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-8 px-6 py-10 sm:px-10">
        <div className="space-y-3 text-center">
          <p className="text-xs uppercase tracking-[0.3em] text-stone-400">Short Bead Stair</p>
          <h1 className="font-display text-4xl font-semibold text-stone-900">Short Bead Stair</h1>
          <p className="text-sm text-stone-600">{instruction}</p>
        </div>

        <section className="rounded-[36px] border border-stone-100 bg-white/90 p-6 shadow-[0_40px_70px_-50px_rgba(15,23,42,0.8)]">
          <div className="h-[520px]">
            <ShortBeadStairScene onHomePositions={setHomePositions} />
          </div>
        </section>

        <section className="grid gap-4">
          {phase === "idle" ? (
            <button
              type="button"
              onClick={handleStart}
              className="w-full rounded-3xl bg-[#cf5f5f] py-4 text-sm font-semibold uppercase tracking-[0.25em] text-white shadow-lg transition hover:bg-[#c15454]"
            >
              Start Short Bead Stair
            </button>
          ) : (
            <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
              Home positions recorded. Bars: {homePositions ? Object.keys(homePositions).length : "?"}
            </div>
          )}
        </section>

        <MaterialTeachersGuide guide={SHORT_BEAD_STAIR_TEACHERS_GUIDE} className="mt-2" />
      </main>
    </div>
  );
}
