"use client";

import Link from "next/link";

type MicrophoneLessonBannerProps = {
  microphoneEnabled: boolean;
  className?: string;
};

export default function MicrophoneLessonBanner({
  microphoneEnabled,
  className,
}: MicrophoneLessonBannerProps) {
  if (microphoneEnabled) return null;

  return (
    <div
      className={`rounded-2xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900 ${className ?? ""}`}
      role="status"
      aria-live="polite"
    >
      <p className="font-medium">
        This lesson contains activities that allow you to speak, but the microphone is turned off.
        {" "}
        Please visit Settings to turn it on.
      </p>
      <div className="mt-2">
        <Link
          href="/dashboard"
          className="inline-flex items-center rounded-full border border-amber-300 bg-white px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-amber-800"
        >
          Open Settings
        </Link>
      </div>
    </div>
  );
}
