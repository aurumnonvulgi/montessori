"use client";

import { motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import DraggableRod from "./DraggableRod";
import MontessoriScene from "./MontessoriScene";
import { fetchMaterials, Material, MaterialSource } from "../lib/materials";
import { playChime } from "../lib/sounds";
import { useProgressStore } from "../store/useProgressStore";

const fadeUp = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] },
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

  const progressPercent = useMemo(() => {
    if (!materials.length) {
      return 0;
    }

    return Math.min(
      100,
      Math.round((completedIds.length / materials.length) * 100),
    );
  }, [completedIds.length, materials.length]);

  const activeMaterial = materials.find(
    (material) => material.id === activeMaterialId,
  );

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
              Hands-on Montessori materials brought to life in 3D.
            </motion.h1>
            <motion.p
              {...fadeUp}
              className="max-w-xl text-base leading-relaxed text-stone-600 sm:text-lg"
            >
              Build calm, focused lessons with interactive 3D materials, gentle
              narration cues, and progress tracking for every child.
            </motion.p>
            <motion.div {...fadeUp} className="flex flex-wrap gap-3">
              <a
                className="rounded-full bg-stone-900 px-6 py-3 text-sm font-semibold text-stone-50 transition hover:bg-stone-800"
                href="#materials"
              >
                Explore materials
              </a>
              <a
                className="rounded-full border border-stone-300 bg-white px-6 py-3 text-sm font-semibold text-stone-800 transition hover:border-stone-400 hover:bg-stone-50"
                href="#setup"
              >
                Setup checklist
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

        <section id="materials" className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <h2 className="font-display text-3xl text-stone-900">
                  Montessori materials, curated and calm
                </h2>
                <p className="mt-2 text-sm text-stone-600">
                  Start with classic materials and build sensory-rich lessons.
                </p>
              </div>
              <span className="rounded-full border border-stone-200 bg-white px-4 py-2 text-xs uppercase tracking-[0.2em] text-stone-500">
                {source === "supabase"
                  ? "Supabase live"
                  : supabaseConfigured
                    ? "Supabase ready"
                    : "Supabase not set"}
              </span>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {materials.map((material) => {
                const isActive = material.id === activeMaterialId;
                const isComplete = completedIds.includes(material.id);
                return (
                  <div
                    key={material.id}
                    onClick={() => setActiveMaterial(material.id)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        setActiveMaterial(material.id);
                      }
                    }}
                    role="button"
                    tabIndex={0}
                    className={`flex flex-col gap-3 rounded-3xl border p-5 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-400 ${
                      isActive
                        ? "border-stone-900 bg-stone-900 text-white"
                        : "border-stone-200 bg-white/80 text-stone-700 hover:border-stone-400"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <h3 className="font-display text-xl">
                        {material.name}
                      </h3>
                      {isComplete ? (
                        <span className="rounded-full bg-white/20 px-3 py-1 text-[10px] uppercase tracking-[0.2em]">
                          Complete
                        </span>
                      ) : null}
                    </div>
                    <p className={`text-sm ${isActive ? "text-white/80" : "text-stone-600"}`}>
                      {material.description}
                    </p>
                    <div className="flex flex-wrap items-center gap-3">
                      {material.ageRange ? (
                        <span className={`rounded-full border px-3 py-1 text-[10px] uppercase tracking-[0.2em] ${
                          isActive
                            ? "border-white/30 text-white"
                            : "border-stone-200 text-stone-500"
                        }`}>
                          {material.ageRange} yrs
                        </span>
                      ) : null}
                      <button
                        className={`rounded-full px-3 py-1 text-[10px] uppercase tracking-[0.2em] ${
                          isActive
                            ? "bg-white/20 text-white"
                            : "bg-stone-900 text-white"
                        }`}
                        onClick={(event) => {
                          event.stopPropagation();
                          markComplete(material.id);
                        }}
                        type="button"
                      >
                        Mark complete
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="rounded-[32px] border border-stone-200 bg-white/80 p-6">
            <div className="rounded-[24px] bg-[#f7efe4] p-5">
              <p className="text-xs uppercase tracking-[0.2em] text-stone-400">
                Progress + audio
              </p>
              <div className="mt-4 rounded-2xl bg-white/80 p-4">
                <div className="flex items-center justify-between text-sm text-stone-600">
                  <span>Progress</span>
                  <span>{progressPercent}%</span>
                </div>
                <div className="mt-3 h-2 rounded-full bg-stone-100">
                  <div
                    className="h-2 rounded-full bg-amber-400 transition"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
                <p className="mt-3 text-xs uppercase tracking-[0.2em] text-stone-400">
                  {completedIds.length} of {materials.length} activities done
                </p>
              </div>
              <div className="mt-4 rounded-2xl bg-white/80 p-4">
                <p className="text-sm text-stone-600">
                  Tap the chime to start a gentle narration cue.
                </p>
                <button
                  className="mt-3 rounded-full bg-stone-900 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white"
                  onClick={playChime}
                  type="button"
                >
                  Play chime
                </button>
              </div>
              <div className="mt-4 rounded-2xl bg-white/80 p-4">
                <p className="text-sm text-stone-600">Drag practice</p>
                <div className="mt-3">
                  <DraggableRod />
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="setup" className="rounded-[36px] border border-stone-200 bg-white/90 p-8">
          <h2 className="font-display text-3xl text-stone-900">
            Setup checklist
          </h2>
          <div className="mt-6 grid gap-6 md:grid-cols-3">
            {[
              {
                title: "Supabase project",
                detail: "Create a database and store materials + progress.",
              },
              {
                title: "Vercel deploy",
                detail: "Connect GitHub repo and add env variables.",
              },
              {
                title: "3D assets",
                detail: "Drop GLB models into Supabase storage.",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="rounded-3xl border border-stone-200 bg-[#fdf9f2] p-5"
              >
                <h3 className="font-display text-xl text-stone-900">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm text-stone-600">{item.detail}</p>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
