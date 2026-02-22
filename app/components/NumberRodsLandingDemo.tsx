"use client";

import { useCallback, useEffect, useState } from "react";
import NumberRodsScene from "./NumberRodsScene";
import { primeSounds } from "../lib/sounds";
import { speakWithPreferredVoice } from "../lib/speech";

const normalizeSpeechKey = (text: string) =>
  text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();

const DESKTOP_DEMO_CAMERA = {
  position: [0.2, 0.28, 0.74] as [number, number, number],
  target: [0.02, 0.03, 0] as [number, number, number],
  fov: 27,
};

const PORTRAIT_MOBILE_DEMO_CAMERA = {
  // Portrait phones start slightly more zoomed in so rods remain readable.
  position: [0.2, 0.28, 0.74] as [number, number, number],
  target: [0.02, 0.03, 0] as [number, number, number],
  fov: 21,
};

export default function NumberRodsLandingDemo() {
  const [sceneKey, setSceneKey] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [isPortraitMobile, setIsPortraitMobile] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const mediaQuery = window.matchMedia("(max-width: 768px) and (orientation: portrait)");
    const updateCameraMode = () => {
      setIsPortraitMobile(mediaQuery.matches);
    };

    updateCameraMode();
    mediaQuery.addEventListener("change", updateCameraMode);
    window.addEventListener("resize", updateCameraMode);

    return () => {
      mediaQuery.removeEventListener("change", updateCameraMode);
      window.removeEventListener("resize", updateCameraMode);
    };
  }, []);

  const playDemoVoice = useCallback((text: string) => {
    const normalizedIncoming = normalizeSpeechKey(text);
    const spokenText =
      normalizedIncoming === "oh no try again"
        ? "That was not the correct answer, try again."
        : text;
    speakWithPreferredVoice(spokenText, { rate: 0.85, pitch: 0.95, volume: 0.8, lang: "en-US" });
  }, []);

  const stopLesson = useCallback(() => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    setPlaying(false);
    setSceneKey((value) => value + 1);
  }, []);

  const handlePlay = useCallback(() => {
    primeSounds();
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    setSceneKey((value) => value + 1);
    setPlaying(true);
  }, []);

  const demoCamera = isPortraitMobile ? PORTRAIT_MOBILE_DEMO_CAMERA : DESKTOP_DEMO_CAMERA;

  return (
    <div className="rounded-[32px] border border-stone-200 bg-white/90 p-3 shadow-[0_30px_90px_-60px_rgba(15,23,42,0.7)] sm:p-5">
      <div className="h-[58vh] min-h-[440px] max-h-[700px]">
        <NumberRodsScene
          key={sceneKey}
          playing={playing}
          voiceEnabled={playing}
          micEnabled={false}
          quizEnabled
          stageIndex={0}
          showZoomReset={false}
          className="h-full w-full"
          cameraPositionOverride={demoCamera.position}
          cameraTargetOverride={demoCamera.target}
          cameraFovOverride={demoCamera.fov}
          speakTextOverride={playDemoVoice}
        />
      </div>

      <button
        type="button"
        onClick={playing ? stopLesson : handlePlay}
        className="mt-3 w-full rounded-3xl bg-[#cf5f5f] py-4 text-sm font-semibold uppercase tracking-[0.25em] text-white shadow-lg transition hover:bg-[#c15454]"
      >
        {playing ? "Stop Lesson" : "Play"}
      </button>
    </div>
  );
}
