"use client";

import { confirmMicrophonePreferenceChange, useMicrophoneEnabled } from "../lib/microphonePreferences";

type MicrophonePrivacyToggleProps = {
  compact?: boolean;
};

export default function MicrophonePrivacyToggle({ compact = false }: MicrophonePrivacyToggleProps) {
  const { microphoneEnabled, setMicrophoneEnabled } = useMicrophoneEnabled();
  const handleToggle = () => {
    const nextEnabled = !microphoneEnabled;
    if (!confirmMicrophonePreferenceChange(nextEnabled)) {
      return;
    }
    setMicrophoneEnabled(nextEnabled);
  };

  return (
    <section className={`rounded-2xl border border-stone-200 bg-white/90 shadow-sm ${compact ? "p-3" : "p-4"}`}>
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className={`font-semibold text-stone-900 ${compact ? "text-sm" : "text-base"}`}>Microphone Privacy</p>
          <p className={`text-stone-600 ${compact ? "text-xs" : "text-sm"}`}>
            {microphoneEnabled
              ? "Microphone activities are enabled."
              : "Microphone requests are disabled across lessons."}
          </p>
          <p className={`text-stone-500 ${compact ? "text-[11px]" : "text-xs"}`}>
            {microphoneEnabled
              ? "On: lessons can listen for spoken answers and use speech-based checks."
              : "Off: lessons will not request microphone access site-wide."}
          </p>
        </div>
        <button
          type="button"
          onClick={handleToggle}
          aria-pressed={!microphoneEnabled}
          className={`rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] transition ${
            microphoneEnabled
              ? "border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
              : "border-stone-300 bg-stone-100 text-stone-700 hover:bg-stone-200"
          }`}
        >
          {microphoneEnabled ? "Mic On" : "Mic Off"}
        </button>
      </div>
    </section>
  );
}
