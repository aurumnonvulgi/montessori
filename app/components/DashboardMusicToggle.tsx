"use client";

import { useMemo } from "react";
import { useBackgroundMusicSettings } from "../lib/backgroundMusicPreferences";
import { useVoiceSettings } from "../lib/voicePreferences";

const clampPercent = (value: number) => Math.max(0, Math.min(100, Math.round(value)));

export default function DashboardMusicToggle() {
  const {
    backgroundMusicEnabled,
    setBackgroundMusicEnabled,
    backgroundMusicVolume,
    setBackgroundMusicVolume,
  } = useBackgroundMusicSettings();
  const { voiceEnabled, setVoiceEnabled, voiceVolume, setVoiceVolume } = useVoiceSettings();

  const voicePercent = clampPercent(voiceVolume * 100);
  const musicPercent = clampPercent(backgroundMusicVolume * 100);
  const musicCapPercent = clampPercent(voiceVolume * 25);
  const effectiveMusicPercent = clampPercent(Math.min(backgroundMusicVolume, voiceVolume * 0.25) * 100);

  const musicStateText = useMemo(() => {
    if (!backgroundMusicEnabled) return "Off";
    return `${effectiveMusicPercent}% output`;
  }, [backgroundMusicEnabled, effectiveMusicPercent]);

  return (
    <section className="rounded-2xl border border-stone-200 bg-white/90 p-3 shadow-sm">
      <div className="space-y-4">
        <div>
          <p className="text-sm font-semibold text-stone-900">Audio Preferences</p>
          <p className="text-xs text-stone-600">Global controls for voice and music across all lessons.</p>
        </div>

        <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-3">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-emerald-800">Voice</p>
              <p className="text-[11px] text-emerald-700">{voiceEnabled ? `${voicePercent}%` : "Off"}</p>
            </div>
            <button
              type="button"
              onClick={() => setVoiceEnabled(!voiceEnabled)}
              aria-pressed={voiceEnabled}
              className={`inline-flex h-10 w-10 items-center justify-center rounded-full border text-sm transition ${
                voiceEnabled
                  ? "border-emerald-300 bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                  : "border-stone-300 bg-stone-100 text-stone-600 hover:bg-stone-200"
              }`}
              title={voiceEnabled ? "Turn voices off" : "Turn voices on"}
            >
              🔊
            </button>
          </div>
          <div className="mt-2">
            <input
              type="range"
              min={0}
              max={100}
              step={1}
              value={voicePercent}
              onChange={(event) => setVoiceVolume(Number(event.target.value) / 100)}
              className="w-full accent-emerald-600"
              aria-label="Voice volume"
            />
          </div>
        </div>

        <div className="rounded-xl border border-cyan-200 bg-cyan-50/60 p-3">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-cyan-800">Music</p>
              <p className="text-[11px] text-cyan-700">{musicStateText}</p>
            </div>
            <button
              type="button"
              onClick={() => setBackgroundMusicEnabled(!backgroundMusicEnabled)}
              aria-pressed={backgroundMusicEnabled}
              className={`inline-flex h-10 w-10 items-center justify-center rounded-full border text-sm transition ${
                backgroundMusicEnabled
                  ? "border-cyan-300 bg-cyan-100 text-cyan-700 hover:bg-cyan-200"
                  : "border-stone-300 bg-stone-100 text-stone-600 hover:bg-stone-200"
              }`}
              title={backgroundMusicEnabled ? "Turn music off" : "Turn music on"}
            >
              ♫
            </button>
          </div>
          <div className="mt-2">
            <input
              type="range"
              min={0}
              max={100}
              step={1}
              value={musicPercent}
              onChange={(event) => setBackgroundMusicVolume(Number(event.target.value) / 100)}
              className="w-full accent-cyan-600"
              aria-label="Music volume"
            />
          </div>
          <p className="mt-2 text-[11px] text-cyan-700">
            Music request: {musicPercent}% · cap: {musicCapPercent}% of voice · effective: {effectiveMusicPercent}%.
          </p>
        </div>
      </div>
    </section>
  );
}
