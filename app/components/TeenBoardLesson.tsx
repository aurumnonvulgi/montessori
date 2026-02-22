"use client";

import { useState } from "react";
import HomeLink from "./HomeLink";
import TeenBoardScene from "./TeenBoardScene";
import MaterialTeachersGuide from "./MaterialTeachersGuide";
import { TEEN_BOARD_QUANTITIES_TEACHERS_GUIDE } from "../data/materialTeachersGuides";

export default function TeenBoardQuantitiesLesson() {
  const [positions, setPositions] = useState<Record<string, [number, number, number]>>({});
  const [snapshot, setSnapshot] = useState<string>("");
  const [startKey, setStartKey] = useState(0);
  const [animationRunning, setAnimationRunning] = useState(false);
  const [cameraSettings, setCameraSettings] = useState({ x: 0, y: 0.35, z: -0.8, fov: 45 });

  const captureLayout = () => {
    const payload = JSON.stringify({ positions, cameraSettings }, null, 2);
    setSnapshot(payload);
    navigator.clipboard?.writeText(payload).catch(() => {});
  };

  return (
    <div className="relative min-h-screen bg-[radial-gradient(circle_at_top,#f5efe6_0%,#fdfbf8_45%,#f7efe4_100%)]">
      <HomeLink />
      <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-8 px-6 py-10 sm:px-10">
        <div className="space-y-3 text-center">
          <p className="text-xs uppercase tracking-[0.3em] text-stone-400">Mathematics</p>
          <h1 className="font-display text-4xl font-semibold text-stone-900">Teen Board Quantities</h1>
          <p className="text-sm text-stone-600">
            Explore the ten stacks and number board to understand teen quantities through hands-on interaction.
          </p>
        </div>

        <section className="rounded-[36px] border border-stone-100 bg-white/90 p-6 shadow-[0_40px_70px_-50px_rgba(15,23,42,0.8)]">
          <div className="h-[520px]">
          <TeenBoardScene
            className="h-full"
            onPositionsChange={setPositions}
            startAnimationKey={startKey}
            onStartComplete={() => setAnimationRunning(false)}
            cameraSettings={cameraSettings}
            onCameraChange={(settings) => setCameraSettings(settings)}
          />
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
            {[
              { label: "X", key: "x", min: -1.5, max: 1.5, step: 0.01 },
              { label: "Y", key: "y", min: 0.05, max: 1.5, step: 0.01 },
              { label: "Z", key: "z", min: -2, max: 1, step: 0.01 },
              { label: "FOV", key: "fov", min: 25, max: 75, step: 1 },
            ].map(({ label, key, min, max, step }) => (
              <label key={key} className="flex flex-col gap-1">
                <span className="uppercase tracking-[0.3em] text-stone-400">{label}</span>
                <input
                  type="range"
                  min={min}
                  max={max}
                  step={step}
                  value={cameraSettings[key as keyof typeof cameraSettings]}
                  onChange={(event) =>
                    setCameraSettings((prev) => ({ ...prev, [key]: Number(event.target.value) }))
                  }
                  className="w-full cursor-pointer"
                />
              </label>
            ))}
          </div>
          <div className="mt-4 flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => {
                setAnimationRunning(true);
                setStartKey((prev) => prev + 1);
              }}
              className="rounded-full border border-slate-700 bg-slate-900 px-6 py-2 text-xs font-semibold uppercase tracking-[0.4em] text-white shadow-lg disabled:opacity-50"
              disabled={animationRunning}
            >
              {animationRunning ? "Moving…" : "Start"}
            </button>
          </div>
          <div className="mt-4 flex flex-col gap-2">
            <button
              type="button"
              onClick={captureLayout}
              className="rounded-full border border-stone-200 bg-black/90 px-5 py-2 text-xs font-semibold uppercase tracking-[0.4em] text-white shadow-sm"
            >
              Capture layout
            </button>
            {snapshot && (
              <div className="max-h-40 overflow-y-auto rounded-xl border border-stone-200 bg-stone-50 p-3 text-[10px] font-mono text-stone-700">
                <div className="flex items-center justify-between text-[9px] uppercase tracking-[0.3em] text-stone-500">
                  <span>Last capture</span>
                  <button
                    type="button"
                    onClick={() => navigator.clipboard?.writeText(snapshot).catch(() => {})}
                    className="text-stone-400 hover:text-stone-600"
                  >
                    Copy again
                  </button>
                </div>
                <pre className="whitespace-pre-wrap">{snapshot}</pre>
              </div>
            )}
          </div>
        </section>

        <MaterialTeachersGuide guide={TEEN_BOARD_QUANTITIES_TEACHERS_GUIDE} className="mt-2" />
      </main>
    </div>
  );
}
