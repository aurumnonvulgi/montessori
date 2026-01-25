"use client";

import { motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import DraggableRod from "./DraggableRod";
import MontessoriScene from "./MontessoriScene";
import RodQuote from "./RodQuote";
import { fetchMaterials, Material, MaterialSource } from "../lib/materials";
import { playChime } from "../lib/sounds";
import { useProgressStore } from "../store/useProgressStore";

const fadeUp = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: {
    duration: 0.6,
    ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
  },
};

export default function MontessoriHome() {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [source, setSource] = useState<MaterialSource>("local");
  const [supabaseConfigured, setSupabaseConfigured] = useState(false);
  const {
    completedIds,
    markComplete,
    activeMaterialId,
    setActiveMaterial,
  } = useProgressStore();

  useEffect(() => {
    let isMounted = true;

    fetchMaterials().then((result) => {
      if (!isMounted) {
        return;
      }

      setMaterials(result.materials);
      setSource(result.source);
      setSupabaseConfigured(result.supabaseConfigured);

      if (result.materials.length && !activeMaterialId) {
        setActiveMaterial(result.materials[0].id);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [activeMaterialId, setActiveMaterial]);

  const activeMaterial = materials.find(
    (material) => material.id === activeMaterialId,
  );
  const upcomingMaterials = useMemo(
    () =>
      materials.filter((material) => material.id !== activeMaterialId).slice(0, 3),
    [materials, activeMaterialId],
  );
  const completedCount = completedIds.length;
  const totalCount = materials.length;
  const isActiveComplete = activeMaterial
    ? completedIds.includes(activeMaterial.id)
    : false;

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,#f5efe6_0%,#fdfbf8_45%,#f7efe4_100%)]">
      <main className="mx-auto flex w-full max-w-6xl flex-col gap-16 px-6 pb-24 pt-16 sm:px-10">
        <section className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div className="flex flex-col gap-6">
            <motion.p
              {...fadeUp}
              className="w-fit rounded-full border border-amber-200 bg-amber-50 px-4 py-1 text-xs uppercase tracking-[0.2em] text-amber-800"
            >
              Montessori Studio
            </motion.p>
            <motion.h1
              {...fadeUp}
              className="font-display text-4xl font-semibold leading-tight text-stone-900 sm:text-5xl"
            >
              Build one Montessori lesson at a time, then pack it into your library.
            </motion.h1>
            <motion.p
              {...fadeUp}
              className="max-w-xl text-base leading-relaxed text-stone-600 sm:text-lg"
            >
              Focus on a single material, test it with a calm routine, then move it into a
              category before starting the next lesson.
            </motion.p>
            <motion.div {...fadeUp} className="flex flex-wrap gap-3">
              <a
                className="rounded-full bg-stone-900 px-6 py-3 text-sm font-semibold text-stone-50 transition hover:bg-stone-800"
                href="#focus"
              >
                Current focus
              </a>
              <a
                className="rounded-full border border-stone-300 bg-white px-6 py-3 text-sm font-semibold text-stone-800 transition hover:border-stone-400 hover:bg-stone-50"
                href="#pipeline"
              >
                Library pipeline
              </a>
            </motion.div>
            <motion.div
              {...fadeUp}
              className="flex flex-wrap gap-6 text-sm text-stone-500"
            >
              <div className="flex flex-col">
                <span className="font-display text-xl text-stone-900">
                  4 core areas
                </span>
                <span>Practical Life · Sensorial · Math · Language</span>
              </div>
              <div className="flex flex-col">
                <span className="font-display text-xl text-stone-900">
                  3D ready
                </span>
                <span>three.js + React Three Fiber</span>
              </div>
            </motion.div>
          </div>
          <motion.div
            {...fadeUp}
            className="rounded-[32px] border border-stone-200 bg-white/80 p-4 shadow-[0_20px_60px_-35px_rgba(61,37,20,0.55)]"
          >
            <div className="rounded-[28px] bg-[#f7efe4] p-4">
              <div className="rounded-[24px] bg-white p-4">
                <MontessoriScene accentColor={activeMaterial?.color} />
              </div>
            </div>
            <p className="mt-4 text-center text-xs uppercase tracking-[0.2em] text-stone-400">
              Interactive 3D preview
            </p>
          </motion.div>
        </section>

        <RodQuote />

        <section id="focus" className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-[32px] border border-stone-200 bg-white/80 p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-stone-400">
                  Current focus
                </p>
                <h2 className="font-display text-3xl text-stone-900">
                  {activeMaterial?.name ?? "Loading focus"}
                </h2>
              </div>
              <span className="rounded-full border border-stone-200 bg-white px-4 py-2 text-xs uppercase tracking-[0.2em] text-stone-500">
                {source === "supabase"
                  ? "Supabase live"
                  : supabaseConfigured
                    ? "Supabase ready"
                    : "Supabase not set"}
              </span>
            </div>
            <p className="mt-3 text-sm text-stone-600">
              {activeMaterial?.description ??
                "Add your first Montessori material to start the workflow."}
            </p>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl bg-white/80 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-stone-400">
                  Status
                </p>
                <p className="mt-2 text-sm text-stone-600">
                  {isActiveComplete
                    ? "Ready to pack into your library category."
                    : "In testing. Keep one focused routine for the child."}
                </p>
                <button
                  className="mt-4 rounded-full bg-stone-900 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white disabled:cursor-not-allowed disabled:bg-stone-300"
                  onClick={() => {
                    if (activeMaterial) {
                      markComplete(activeMaterial.id);
                    }
                  }}
                  type="button"
                  disabled={!activeMaterial}
                >
                  {isActiveComplete ? "Marked complete" : "Mark tested"}
                </button>
              </div>
              <div className="rounded-2xl bg-white/80 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-stone-400">
                  Audio cue
                </p>
                <p className="mt-2 text-sm text-stone-600">
                  A soft chime before each lesson begins.
                </p>
                <button
                  className="mt-4 rounded-full border border-stone-300 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-stone-700 transition hover:border-stone-400 hover:bg-stone-50"
                  onClick={playChime}
                  type="button"
                >
                  Play chime
                </button>
              </div>
            </div>

            <div className="mt-6 rounded-2xl bg-white/80 p-4">
              <div className="flex items-center justify-between text-xs uppercase tracking-[0.2em] text-stone-400">
                <span>Testing tray</span>
                <span>
                  {completedCount}/{totalCount} packed
                </span>
              </div>
              <div className="mt-3">
                <DraggableRod />
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-6">
            <div className="rounded-[28px] border border-stone-200 bg-white/80 p-5">
              <p className="text-xs uppercase tracking-[0.2em] text-stone-400">
                Next up
              </p>
              <div className="mt-4 grid gap-3">
                {upcomingMaterials.length ? (
                  upcomingMaterials.map((material) => (
                    <button
                      key={material.id}
                      onClick={() => setActiveMaterial(material.id)}
                      className="flex items-center justify-between rounded-2xl border border-stone-200 bg-white px-4 py-3 text-left text-sm text-stone-700 transition hover:border-stone-300 hover:bg-stone-50"
                      type="button"
                    >
                      <span className="font-display text-base text-stone-900">
                        {material.name}
                      </span>
                      <span className="text-xs uppercase tracking-[0.2em] text-stone-400">
                        Focus
                      </span>
                    </button>
                  ))
                ) : (
                  <p className="text-sm text-stone-500">
                    You are clear to build your next material.
                  </p>
                )}
              </div>
            </div>

            <div
              id="pipeline"
              className="rounded-[28px] border border-stone-200 bg-white/80 p-5"
            >
              <p className="text-xs uppercase tracking-[0.2em] text-stone-400">
                Library pipeline
              </p>
              <div className="mt-4 grid gap-3 text-sm text-stone-600">
                {[
                  {
                    title: "Build the lesson",
                    detail: "Design the 3D routine + script.",
                    status: "Now",
                  },
                  {
                    title: "Test with a child",
                    detail: "Observe focus + refine pacing.",
                    status: isActiveComplete ? "Done" : "Next",
                  },
                  {
                    title: "Pack into library",
                    detail: "Add category + publish.",
                    status: isActiveComplete ? "Ready" : "Later",
                  },
                ].map((step) => (
                  <div
                    key={step.title}
                    className="rounded-2xl border border-stone-200 bg-[#fdf9f2] p-4"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-display text-base text-stone-900">
                        {step.title}
                      </span>
                      <span className="text-[10px] uppercase tracking-[0.2em] text-stone-400">
                        {step.status}
                      </span>
                    </div>
                    <p className="mt-2 text-xs text-stone-500">
                      {step.detail}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
