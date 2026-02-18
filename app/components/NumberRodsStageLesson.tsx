"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import NumberRodsScene from "./NumberRodsScene";
import { primeSounds } from "../lib/sounds";
import HomeLink from "./HomeLink";
import { useMicrophoneEnabled } from "../lib/microphonePreferences";

type NumberRodsStageProps = {
  stageIndex: number;
};

const STAGE_NAMES = ["1, 2, 3", "4, 5, 6", "7, 8, 9", "10"];

function RotateDeviceIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="h-16 w-16 animate-pulse">
      <rect x="4" y="2" width="16" height="20" rx="2" />
      <path d="M12 18h.01" />
      <path d="M2 12l2-2m0 0l2 2m-2-2v4" />
      <path d="M22 12l-2 2m0 0l-2-2m2 2v-4" />
    </svg>
  );
}

function PlayIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6">
      <path d="M8 5v14l11-7z" />
    </svg>
  );
}

function HomeIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  );
}

function BackIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
      <path d="M19 12H5M12 19l-7-7 7-7" />
    </svg>
  );
}

function RestartIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
      <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
      <path d="M3 3v5h5" />
    </svg>
  );
}

export default function NumberRodsStageLesson({
  stageIndex,
}: NumberRodsStageProps) {
  const router = useRouter();
  const { microphoneEnabled } = useMicrophoneEnabled();
  const [lessonStarted, setLessonStarted] = useState(false);
  const [resetKey, setResetKey] = useState(0);
  const [isPortraitMobile, setIsPortraitMobile] = useState(false);
  const [isMobileLandscape, setIsMobileLandscape] = useState(false);

  // Detect orientation on mobile
  useEffect(() => {
    if (typeof window === "undefined") return;

    const checkOrientation = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      const isLandscape = width > height;
      // Mobile landscape: height is small (< 500px) and in landscape orientation
      const mobileLandscape = height < 500 && isLandscape;
      // Mobile portrait: small screen in portrait
      const mobilePortrait = (width < 640 || height < 500) && !isLandscape;

      setIsMobileLandscape(mobileLandscape);
      setIsPortraitMobile(mobilePortrait);
    };

    // Try to lock to landscape on mobile
    const lockLandscape = async () => {
      try {
        const orientation = screen.orientation as ScreenOrientation & {
          lock?: (orientation: OrientationLockType) => Promise<void>;
        };
        await orientation.lock?.("landscape");
      } catch {
        // Orientation lock not supported or denied - that's fine
      }
    };

    checkOrientation();
    lockLandscape();

    window.addEventListener("resize", checkOrientation);
    window.addEventListener("orientationchange", checkOrientation);

      return () => {
        window.removeEventListener("resize", checkOrientation);
        window.removeEventListener("orientationchange", checkOrientation);
        // Unlock orientation on unmount
        try {
          const orientation = screen.orientation as ScreenOrientation & {
            unlock?: () => void;
          };
          orientation.unlock?.();
        } catch {
          // ignore
        }
      };
  }, []);

  const requestFullscreen = useCallback(() => {
    if (typeof document === "undefined") return;
    // Only request fullscreen on mobile
    const isMobile = window.innerHeight < 500 || window.innerWidth < 640;
    if (!isMobile) return;

    const elem = document.documentElement as HTMLElement & {
      webkitRequestFullscreen?: () => Promise<void>;
    };
    try {
      if (elem.requestFullscreen) {
        elem.requestFullscreen().catch(() => {});
      } else if (elem.webkitRequestFullscreen) {
        elem.webkitRequestFullscreen();
      }
    } catch {
      // Fullscreen not supported - that's fine
    }
  }, []);

  const startLesson = useCallback(() => {
    setLessonStarted(true);
    setResetKey((value) => value + 1);

    // Request fullscreen on mobile
    requestFullscreen();

    // Prime audio for mobile browsers
    primeSounds();

    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      const utterance = new SpeechSynthesisUtterance(" ");
      utterance.volume = 0;
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(utterance);
    }
  }, [requestFullscreen]);

  const restartLesson = useCallback(() => {
    setLessonStarted(false);
    setResetKey((value) => value + 1);
  }, []);

  const goBack = useCallback(() => {
    router.back();
  }, [router]);

  const goHome = useCallback(() => {
    router.push("/");
  }, [router]);

  const handleStageComplete = useCallback(() => {
    const stageNumber = stageIndex + 1;
    if (typeof window !== "undefined") {
      window.localStorage.setItem(
        `number-rods-stage-${stageNumber}-complete`,
        "true"
      );
    }
    setTimeout(() => {
      router.push("/lessons/number-rods");
    }, 600);
  }, [router, stageIndex]);

  return (
    <div className="fixed inset-0 overflow-hidden bg-[radial-gradient(circle_at_top,#f5efe6_0%,#fdfbf8_45%,#f7efe4_100%)]">
      <HomeLink />
      {/* Mobile landscape: Right sidebar */}
      {isMobileLandscape && (
        <div className="fixed right-0 top-0 z-10 flex h-full w-12 flex-col items-center justify-center gap-4 bg-white/80 shadow-lg backdrop-blur-sm">
          {!lessonStarted ? (
            <button
              type="button"
              onClick={startLesson}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-[#cf5f5f] text-white shadow-md transition hover:bg-[#c15454]"
              aria-label="Start"
            >
              <PlayIcon />
            </button>
          ) : (
            <button
              type="button"
              onClick={restartLesson}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-stone-200 text-stone-600 shadow-md transition hover:bg-stone-300"
              aria-label="Restart"
            >
              <RestartIcon />
            </button>
          )}
          <button
            type="button"
            onClick={goBack}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-stone-200 text-stone-600 shadow-md transition hover:bg-stone-300"
            aria-label="Back"
          >
            <BackIcon />
          </button>
          <button
            type="button"
            onClick={goHome}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-stone-200 text-stone-600 shadow-md transition hover:bg-stone-300"
            aria-label="Home"
          >
            <HomeIcon />
          </button>
        </div>
      )}

      {/* Main content */}
      <main className={`flex h-full flex-col ${isMobileLandscape ? "pr-12" : ""}`}>
        {/* Desktop header - hidden on mobile landscape */}
        {!isMobileLandscape && (
          <div className="flex items-center justify-end px-6 py-4 sm:px-10">
            <div className="flex items-center gap-3 text-[10px] uppercase tracking-[0.3em] text-stone-400">
              <span>Lesson {stageIndex + 1}</span>
              <span>{STAGE_NAMES[stageIndex]}</span>
            </div>
          </div>
        )}

        {/* Scene container - fills available space */}
        <div className={`flex-1 ${isMobileLandscape ? "p-1" : "px-2 pb-2 sm:px-6 sm:pb-4"}`}>
          <NumberRodsScene
            key={resetKey}
            playing={lessonStarted}
            voiceEnabled={lessonStarted}
            micEnabled={microphoneEnabled}
            stageIndex={stageIndex}
            onStageComplete={handleStageComplete}
            className="h-full w-full"
          />
        </div>

        {/* Desktop bottom button - hidden on mobile landscape */}
        {!isMobileLandscape && (
          <div className="hidden px-6 pb-6 sm:block sm:px-10">
            {!lessonStarted ? (
              <button
                type="button"
                onClick={startLesson}
                className="w-full rounded-3xl bg-[#cf5f5f] py-4 text-sm font-semibold uppercase tracking-[0.25em] text-white shadow-lg transition hover:bg-[#c15454]"
              >
                Start
              </button>
            ) : (
              <button
                type="button"
                onClick={restartLesson}
                className="w-full rounded-3xl bg-stone-200 py-4 text-sm font-semibold uppercase tracking-[0.25em] text-stone-700 shadow-lg transition hover:bg-stone-300"
              >
                Restart
              </button>
            )}
          </div>
        )}
      </main>

      {/* Portrait orientation overlay for mobile */}
      {isPortraitMobile && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-6 bg-[#f5efe6]/95 backdrop-blur-sm">
          <RotateDeviceIcon />
          <p className="font-display text-xl text-stone-700">
            Please rotate your device
          </p>
          <p className="text-sm text-stone-500">
            This lesson works best in landscape mode
          </p>
          <button
            type="button"
            onClick={goBack}
            className="mt-4 rounded-full bg-stone-200 px-6 py-2 text-sm text-stone-600 shadow-md transition hover:bg-stone-300"
          >
            Go Back
          </button>
        </div>
      )}
    </div>
  );
}
