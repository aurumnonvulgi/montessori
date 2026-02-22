"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import HomeLink from "./HomeLink";
import InitialSoundDevBanner from "./InitialSoundDevBanner";
import { trackLessonEvent } from "../lib/lessonTelemetry";
import { getVoiceEnabled, getVoiceVolume } from "../lib/voicePreferences";

export type InitialSoundSlide = {
  word: string;
  image: string;
  letter?: string;
};

export const DEFAULT_SLIDES: InitialSoundSlide[] = [
  { word: "alligator", image: "/assets/language_arts/initial_sound/Initial Sound - A/a---alligator___initial_sound-20260209_185322-1.png" },
  { word: "ambulance", image: "/assets/language_arts/initial_sound/Initial Sound - A/a---ambulance___initial_sound-20260209_185755-1.png" },
  { word: "anchor", image: "/assets/language_arts/initial_sound/Initial Sound - A/a---anchor___initial_sound-20260209_185538-1.png" },
  { word: "ant", image: "/assets/language_arts/initial_sound/Initial Sound - A/a---ant___initial_sound-20260209_185104-1.png" },
  { word: "apple", image: "/assets/language_arts/initial_sound/Initial Sound - A/a---apple___initial_sound-20260209_184849-1.png" },
  { word: "astronaut", image: "/assets/language_arts/initial_sound/Initial Sound - A/a---astronaut___initial_sound-20260209_190014-1.png" },
];

type InitialSoundLessonProps = {
  slides?: InitialSoundSlide[];
  groupLabel?: string;
  groupSlug?: string;
  telemetryPageOffset?: number;
  telemetryTotalPages?: number;
};

export default function InitialSoundLesson({
  slides: slidesProp,
  groupLabel,
  groupSlug,
  telemetryPageOffset,
  telemetryTotalPages,
}: InitialSoundLessonProps) {
  const slides = useMemo(() => (slidesProp && slidesProp.length ? slidesProp : DEFAULT_SLIDES), [slidesProp]);
  const activityKey = groupSlug ? `group-${groupSlug}` : "group-default";
  const trackedPageOffset = Math.max(0, Math.floor(telemetryPageOffset ?? 0));
  const trackedTotalPages = Math.max(
    slides.length,
    Math.floor(telemetryTotalPages ?? slides.length)
  );
  const toTrackedPage = (index: number) => {
    const page = trackedPageOffset + index + 1;
    return Math.min(trackedTotalPages, Math.max(1, page));
  };
  const [scaled, setScaled] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [voiceIndex, setVoiceIndex] = useState(0);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const storedVoice = useMemo(() => {
    if (typeof window === "undefined") return -1;
    const value = Number(localStorage.getItem("selected-initial-sound-voice"));
    return Number.isNaN(value) ? -1 : value;
  }, []);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const sequenceTimeouts = useRef<number[]>([]);
  const clearSequence = () => {
    sequenceTimeouts.current.forEach((timer) => window.clearTimeout(timer));
    sequenceTimeouts.current = [];
  };
  const speakText = (text: string, delay = 0) => {
    if (typeof window === "undefined") return;
    if (!getVoiceEnabled()) return;
    const masterVolume = getVoiceVolume();
    if (masterVolume <= 0) return;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-US";
    utterance.rate = 0.7;
    utterance.volume = Math.max(0, Math.min(1, 0.9 * masterVolume));
    if (voices[voiceIndex]) utterance.voice = voices[voiceIndex];
    sequenceTimeouts.current.push(
      window.setTimeout(() => {
        window.speechSynthesis?.speak(utterance);
      }, delay)
    );
  };
  const playSlide = (index: number) => {
    trackLessonEvent({
      lesson: "language-arts:initial-sound-cards",
      activity: activityKey,
      event: "slide_viewed",
      page: toTrackedPage(index),
      totalPages: trackedTotalPages,
      value: slides[index].word,
    });
    setScaled(true);
    const letterName = (slides[index].letter ?? slides[index].word.charAt(0)).toLowerCase();
    speakText(letterName);
    speakText(slides[index].word, 2000);
    sequenceTimeouts.current.push(
      window.setTimeout(() => {
        setScaled(false);
        if (index >= slides.length - 1) {
          trackLessonEvent({
            lesson: "language-arts:initial-sound-cards",
            activity: activityKey,
            event: "lesson_completed",
            success: true,
            page: toTrackedPage(index),
            totalPages: trackedTotalPages,
            value: slides[index].word,
          });
          setIsPlaying(false);
        } else {
          const nextIndex = index + 1;
          setActiveIndex(nextIndex);
          sequenceTimeouts.current.push(
            window.setTimeout(() => {
              playSlide(nextIndex);
            }, 1200)
          );
        }
      }, 4000)
    );
  };

  useEffect(() => {
    trackLessonEvent({
      lesson: "language-arts:initial-sound-cards",
      activity: activityKey,
      event: "lesson_opened",
      totalPages: trackedTotalPages,
      details: {
        groupLabel,
      },
    });
  }, [activityKey, groupLabel, trackedTotalPages]);

  useEffect(() => {
    if (typeof window === "undefined") return undefined;
    const updateVoices = () => {
      const available = window.speechSynthesis
        .getVoices()
        .filter((voice) => voice.lang?.toLowerCase().startsWith("en"));
      if (available.length) {
        setVoices(available);
        if (storedVoice >= 0 && available[storedVoice]) {
          setVoiceIndex(storedVoice);
        }
      }
    };
    updateVoices();
    window.speechSynthesis.addEventListener("voiceschanged", updateVoices);
    return () => {
      window.speechSynthesis.removeEventListener("voiceschanged", updateVoices);
    };
  }, [storedVoice]);

  useEffect(() => {
    return () => {
      clearSequence();
      window.speechSynthesis?.cancel();
    };
  }, []);

  const handleStart = () => {
    window.speechSynthesis?.cancel();
    clearSequence();
    if (!isPlaying) {
      trackLessonEvent({
        lesson: "language-arts:initial-sound-cards",
        activity: activityKey,
        event: "lesson_started",
        page: toTrackedPage(activeIndex),
        totalPages: trackedTotalPages,
      });
      setIsPlaying(true);
      playSlide(activeIndex);
    }
  };

  return (
    <div className="relative min-h-screen bg-[radial-gradient(circle_at_top,#f5efe6,#fdfbf8_55%,#f7efe4)]">
      <HomeLink />
      <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-8 px-6 py-10 sm:px-10">
        <div className="space-y-3 text-center">
          <p className="text-xs uppercase tracking-[0.3em] text-stone-400">Language Arts</p>
          <h1 className="font-display text-4xl font-semibold text-stone-900">
            Initial Sound Cards — {groupLabel ?? "letter a"}
          </h1>
          <p className="text-sm text-stone-600">Say “ah” while the letter paints itself bigger.</p>
        </div>
        <InitialSoundDevBanner />
        <section className="rounded-[36px] border border-stone-100 bg-white/90 p-6 shadow-[0_30px_70px_-45px_rgba(15,23,42,0.7)]">
          <div className="flex flex-col gap-4 lg:flex-row">
            <div className="flex flex-col justify-between rounded-[24px] border border-stone-200 bg-stone-50 p-4 text-center shadow-inner overflow-hidden">
              <div className="flex flex-1 items-center justify-center">
                <div
                  className={`text-[clamp(10rem,22vw,16rem)] font-bold transition duration-500 ${scaled ? "scale-120 text-red-600" : "scale-100 text-stone-900"}`}
                >
                  {slides[activeIndex].letter ?? slides[activeIndex].word.charAt(0)}
                </div>
              </div>
              <div className="mt-4 w-full">
                <button
                  type="button"
                  onClick={handleStart}
                  className="w-full rounded-full border border-emerald-700 bg-emerald-600 px-6 py-3 text-sm font-semibold uppercase tracking-[0.4em] text-white shadow-lg transition hover:bg-emerald-500"
                >
                  Start
                </button>
              </div>
            </div>
            <div className="flex flex-col items-center justify-center gap-4 rounded-[24px] border border-stone-200 bg-white p-4 shadow-inner">
              <div className="relative h-[40vh] w-full overflow-hidden rounded-[20px] border border-stone-200 bg-stone-200">
                <img
                  src={slides[activeIndex].image}
                  alt={slides[activeIndex].word}
                  className="h-full w-full object-cover"
                />
              </div>
              <p className="text-center text-2xl font-semibold text-stone-900">
                <span className="text-red-600">{slides[activeIndex].word.charAt(0)}</span>
                {slides[activeIndex].word.slice(1)}
              </p>
            </div>
          </div>
        </section>
        <button
          type="button"
          onClick={() => setShowSettings(true)}
          className="fixed bottom-8 right-8 rounded-full bg-white/90 p-2 shadow-lg"
        >
          <span className="sr-only">Settings</span>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="h-5 w-5 text-stone-700">
            <path
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="1.5"
              d="M12 8.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7zm-7 3.5H4m16 0h-1m-1.5-5.5-.707-.707m-12.086 12.086-.707-.707m12.086 0 .707-.707M6.207 6.207l-.707-.707"
            />
          </svg>
        </button>
        {showSettings && (
          <div className="fixed inset-0 flex items-center justify-center bg-black/40">
            <div className="rounded-3xl bg-white p-6 shadow-2xl">
              <h2 className="text-lg font-semibold text-stone-900">Voice</h2>
              <select
                value={voiceIndex}
                onChange={(event) => {
                  const value = Number(event.target.value);
                  setVoiceIndex(value);
                  localStorage.setItem("selected-initial-sound-voice", String(value));
                }}
                className="mt-4 w-full rounded-xl border border-stone-200 px-4 py-2"
              >
                {voices.map((voice, index) => (
                  <option key={`${voice.name}-${index}`} value={index}>
                    {voice.name} ({voice.lang})
                  </option>
                ))}
                {!voices.length && <option value={0}>No voices available</option>}
              </select>
              <div className="mt-4 flex justify-end">
                <button
                  type="button"
                  onClick={() => setShowSettings(false)}
                  className="rounded-full bg-stone-900 px-4 py-2 text-sm font-semibold uppercase tracking-[0.4em] text-white"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
