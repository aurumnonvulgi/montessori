"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { consumeOurPlaceGate } from "../../lib/hiddenRouteGate";

const SECRET_AUDIO_SRC = "/assets/media/Wo_Men_De_Ai-426039-mobiles24.mp3";

export default function ThisIsOurPlacePage() {
  const router = useRouter();
  const [allowed, setAllowed] = useState(false);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    const canOpen = consumeOurPlaceGate();
    if (!canOpen) {
      router.replace("/about-us");
      return;
    }
    setAllowed(true);
    setChecked(true);
  }, [router]);

  useEffect(() => {
    if (!allowed || !checked) return;
    const audio = new Audio(SECRET_AUDIO_SRC);
    audio.preload = "auto";
    const playPromise = audio.play();
    if (playPromise && typeof playPromise.catch === "function") {
      playPromise.catch(() => {
        // Ignore autoplay blocks from the browser.
      });
    }
    return () => {
      audio.pause();
      audio.currentTime = 0;
    };
  }, [allowed, checked]);

  if (!checked || !allowed) {
    return <div className="min-h-screen bg-[#d6ecff]" />;
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top,#d7ecff_0%,#c9e5ff_45%,#beddff_100%)]">
      <button
        type="button"
        onClick={() => router.replace("/about-us")}
        className="absolute right-5 top-5 z-20 inline-flex h-11 w-11 items-center justify-center rounded-full border border-cyan-300 bg-white/90 text-2xl font-semibold text-cyan-900 shadow-md transition hover:bg-white"
        aria-label="Exit hidden page"
      >
        x
      </button>

      <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col items-center justify-center px-6 py-20 text-center">
        <h1 className="font-display text-5xl font-semibold tracking-[0.04em] text-cyan-950 sm:text-6xl">
          W&E
        </h1>
        <div className="mt-12 rounded-3xl border-4 border-sky-900 bg-white/90 px-10 py-8 shadow-[0_24px_70px_-40px_rgba(2,132,199,0.7)] sm:px-16 sm:py-10">
          <p className="font-mono text-4xl font-bold tracking-[0.28em] text-sky-950 sm:text-6xl">
            02/25/4E
          </p>
        </div>
      </main>
    </div>
  );
}
