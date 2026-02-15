"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { PointerEvent } from "react";
import HomeLink from "../../../components/HomeLink";
import Link from "next/link";

const VIEWBOX_SIZE = 1000;
const TRACE_TOLERANCE = 20;

const tracingLetters = [
  {
    letter: "a",
    word: "apple",
    description: "Trace along the gray route, pause when the red outline glows, and keep going until the checkmark appears.",
    previewImage: "/assets/language_arts/initial_sound/Initial Sound - A/a---apple___initial_sound-20260209_184849-1.png",
    strokePath: "/assets/language_arts/initial_sound_tracing/a-tracing_path.svg",
  },
];

export default function InitialSoundTracing() {
  const [feedback, setFeedback] = useState("");
  const [completed, setCompleted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [tracking, setTracking] = useState(false);
  const svgRef = useRef<SVGSVGElement | null>(null);
  const pathRef = useRef<SVGPathElement | null>(null);
  const overlayRef = useRef<HTMLDivElement | null>(null);
  const highestLengthRef = useRef(0);
  const pathLengthRef = useRef(0);
  const [pathLength, setPathLength] = useState(0);
  const pathBBoxRef = useRef<DOMRect | null>(null);
  const feedbackTimeoutRef = useRef<number | null>(null);
  const [pathData, setPathData] = useState("");
  const currentLetter = tracingLetters[0];

  const playChime = useCallback(() => {
    if (typeof window === "undefined") return;
    const AudioCtxClass = window.AudioContext || ((window as Window & { webkitAudioContext?: typeof window.AudioContext }).webkitAudioContext);
    if (!AudioCtxClass) return;
    const ctx = new AudioCtxClass();
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();
    oscillator.type = "sine";
    oscillator.frequency.value = 880;
    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.4);
    oscillator.connect(gain);
    gain.connect(ctx.destination);
    oscillator.start();
    oscillator.stop(ctx.currentTime + 0.4);
  }, []);

  useEffect(() => {
    if (!currentLetter.strokePath) return;
    let canceled = false;
    fetch(currentLetter.strokePath)
      .then((res) => res.text())
      .then((text) => {
        if (canceled) return;
        const parser = new DOMParser();
        const doc = parser.parseFromString(text, "image/svg+xml");
        const d = doc.querySelector("path")?.getAttribute("d") ?? "";
        setPathData(d);
      })
      .catch(() => {
        if (!canceled) setPathData("");
      });
    return () => {
      canceled = true;
    };
  }, [currentLetter.strokePath]);

  useEffect(() => {
    const path = pathRef.current;
    if (!path || !pathData) return;
    const length = path.getTotalLength();
    pathLengthRef.current = length;
    setPathLength(length);
    pathBBoxRef.current = path.getBBox();
    setProgress(0);
    setCompleted(false);
    setFeedback("");
    highestLengthRef.current = 0;
  }, [currentLetter.strokePath, pathData]);

  const findClosestLength = useCallback(
    (path: SVGPathElement, targetX: number, targetY: number) => {
      const total = pathLengthRef.current;
      if (!total) {
        return { length: 0, distance: Infinity };
      }
      let low = 0;
      let high = total;
      let bestLength = 0;
      let bestDistSq = Infinity;
      const step = Math.max(total / 20, 1);
      for (let i = 0; i < 32; i++) {
        const mid = (low + high) / 2;
        const point = path.getPointAtLength(mid);
        const dx = point.x - targetX;
        const dy = point.y - targetY;
        const distSq = dx * dx + dy * dy;
        if (distSq < bestDistSq) {
          bestDistSq = distSq;
          bestLength = mid;
        }
        const prev = path.getPointAtLength(Math.max(0, mid - step));
        const next = path.getPointAtLength(Math.min(total, mid + step));
        const prevDistSq = (prev.x - targetX) ** 2 + (prev.y - targetY) ** 2;
        const nextDistSq = (next.x - targetX) ** 2 + (next.y - targetY) ** 2;
        if (prevDistSq < nextDistSq) {
          high = mid;
        } else {
          low = mid;
        }
      }
      return { length: bestLength, distance: Math.sqrt(bestDistSq) };
    },
    []
  );

  const clearFeedback = useCallback(() => {
    if (feedbackTimeoutRef.current !== null) {
      window.clearTimeout(feedbackTimeoutRef.current);
    }
  }, []);

  const resetTracing = useCallback(() => {
    touchedRef.current.fill(false);
    setProgress(0);
    setCompleted(false);
    setFeedback("");
    clearFeedback();
  }, [clearFeedback]);

  const handleCompletion = useCallback(() => {
    setCompleted(true);
    setFeedback("Great tracing! ✅");
    clearFeedback();
    feedbackTimeoutRef.current = window.setTimeout(() => setFeedback(""), 1500);
    playChime();
  }, [clearFeedback, playChime]);

  const handlePointerTrace = useCallback(
    (event: PointerEvent<HTMLDivElement>) => {
      event.preventDefault();
      const svgEl = svgRef.current;
      if (!svgEl) return;
      const rect = svgEl.getBoundingClientRect();
      const x = ((event.clientX - rect.left) / rect.width) * VIEWBOX_SIZE;
      const y = ((event.clientY - rect.top) / rect.height) * VIEWBOX_SIZE;
      const path = pathRef.current;
      if (!path) return;
      const { length: closestLength, distance } = findClosestLength(path, x, y);
      if (distance > TRACE_TOLERANCE) return;
      if (closestLength >= highestLengthRef.current - 4) {
        highestLengthRef.current = Math.max(highestLengthRef.current, closestLength);
        const newProgress = highestLengthRef.current / Math.max(pathLengthRef.current, 1);
        setProgress(newProgress);
        if (!completed && newProgress >= 0.98) {
          handleCompletion();
        }
      }
    },
    [completed, findClosestLength, handleCompletion]
  );

  const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    setTracking(true);
    document.body.style.overflow = "hidden";
    overlayRef.current?.setPointerCapture?.(event.pointerId);
    handlePointerTrace(event);
  };

  const handlePointerCancel = () => {
    setTracking(false);
    document.body.style.overflow = "";
  };

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (!tracking) return;
    handlePointerTrace(event);
  };

  const handlePointerUp = (event: PointerEvent<HTMLDivElement>) => {
    setTracking(false);
    document.body.style.overflow = "";
    overlayRef.current?.releasePointerCapture?.(event.pointerId);
  };

  const letterBlocks = useMemo(
    () =>
      tracingLetters.map((entry) => (
        <div
          key={entry.letter}
          className={
            "flex h-16 w-16 items-center justify-center rounded-2xl border border-stone-200 text-2xl font-bold uppercase tracking-[0.3em] " +
            (entry.letter === currentLetter.letter ? "bg-stone-900 text-white" : "bg-stone-50 text-stone-500")
          }
        >
          {entry.letter}
        </div>
      )),
    [currentLetter.letter]
  );

  return (
    <div className="relative min-h-screen bg-[radial-gradient(circle_at_top,#fdfbf8,#f5efe6_65%,#f0e9dd)]">
      <HomeLink />
      <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-6 px-6 py-10">
        <header className="space-y-3 text-center">
          <p className="text-xs uppercase tracking-[0.35em] text-stone-400">Language Arts · Preview</p>
          <h1 className="font-display text-4xl font-semibold text-stone-900">Initial Sound Tracing (dev)</h1>
          <p className="text-sm text-stone-600">Prepare to draw letters by following animated paths.</p>
          <p className="text-xs uppercase tracking-[0.35em] text-stone-500 text-center">Sneak peek – SVG assets coming soon</p>
        </header>
        <section className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="space-y-4 rounded-3xl border border-stone-200 bg-white/90 p-6 shadow-[0_30px_60px_-40px_rgba(15,23,42,0.8)]">
            <div className="flex items-center justify-between">
              <p className="text-xs uppercase tracking-[0.35em] text-stone-500">Tracing board</p>
              <p className="text-xs font-semibold text-stone-500">Letter {currentLetter.letter}</p>
            </div>
            <div className="relative flex flex-col gap-4">
              <div className="relative flex h-56 items-center justify-center overflow-hidden rounded-3xl border border-stone-200 bg-stone-100">
                <svg
                  ref={svgRef}
                  viewBox="0 0 1000 1000"
                  className="h-full w-full"
                  role="presentation"
                >
                  {pathData && (
                    <>
                      <path
                        d={pathData}
                        fill="none"
                        stroke="#9ca3af"
                        strokeWidth={42}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        opacity={0.65}
                      />
                      <path
                        ref={pathRef}
                        d={pathData}
                        fill="none"
                        stroke="#ef4444"
                        strokeWidth={42}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeDasharray={pathLength}
                        strokeDashoffset={Math.max(pathLength - pathLength * progress, 0)}
                        className="transition-[stroke-dashoffset] duration-150"
                      />
                    </>
                  )}
                </svg>
                <div
                  ref={overlayRef}
                  className="absolute inset-0 z-10 cursor-crosshair"
                  style={{ touchAction: "none", pointerEvents: "all", backgroundColor: "transparent" }}
                  onPointerDown={(event) => {
                    event.preventDefault();
                    handlePointerDown(event);
                  }}
                  onPointerMove={(event) => {
                    event.preventDefault();
                    handlePointerMove(event);
                  }}
                  onPointerUp={(event) => {
                    event.preventDefault();
                    handlePointerUp(event);
                  }}
                  onPointerLeave={(event) => {
                    event.preventDefault();
                    handlePointerCancel();
                  }}
                  onPointerCancel={(event) => {
                    event.preventDefault();
                    handlePointerCancel();
                  }}
                />
                <div
                  className={`absolute inset-3 rounded-3xl border-[3px] transition duration-500 ${
                    tracking ? "border-red-500" : completed ? "border-emerald-500" : "border-transparent"
                  }`}
                />
                {completed && (
                  <div className="absolute bottom-3 right-3 flex items-center gap-1 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold uppercase tracking-[0.35em] text-emerald-700 shadow">
                    ✓ traced
                  </div>
                )}
              </div>
              <div className="flex items-center justify-between gap-4 text-sm text-stone-600">
                <p className="truncate">{currentLetter.description}</p>
                <p>{Math.round(progress * 100)}%</p>
              </div>
              <div className="h-2 rounded-full bg-stone-200">
                <div className="h-full rounded-full bg-emerald-500 transition-[width]" style={{ width: `${Math.min(progress * 100, 100)}%` }} />
              </div>
            </div>
            {feedback && <p className="text-sm font-semibold text-emerald-600">{feedback}</p>}
            <button
              type="button"
              onClick={resetTracing}
              className="rounded-full border border-stone-300 bg-white px-6 py-2 text-xs uppercase tracking-[0.4em] text-stone-600 transition hover:border-stone-500"
            >
              Reset tracing
            </button>
          </div>
          <div className="space-y-4 rounded-3xl border border-stone-200 bg-white/90 p-6 shadow-[0_30px_60px_-40px_rgba(15,23,42,0.8)]">
            <div className="flex items-center justify-between text-stone-500">
              <p className="text-xs uppercase tracking-[0.35em]">Illustration</p>
              <span className="text-xs font-semibold">Sound on hold</span>
            </div>
            <div className="flex items-center justify-center overflow-hidden rounded-3xl border border-stone-200 bg-stone-50 p-6">
              <img src={currentLetter.previewImage} alt={`${currentLetter.word} illustration`} className="h-56 w-auto object-contain" />
            </div>
            <div className="flex items-center justify-between text-sm text-stone-600">
              <span className="font-semibold text-stone-900">{currentLetter.word}</span>
              <span className="tracking-[0.35em]">/æ/</span>
            </div>
            <div className="flex flex-wrap gap-3">{letterBlocks}</div>
          </div>
        </section>
        <div className="flex flex-wrap items-center gap-4">
          <Link
            href="/lessons/language-arts/initial-sound-cards"
            className="inline-flex items-center justify-center rounded-full border border-stone-300 px-5 py-2 text-xs uppercase tracking-[0.4em] text-stone-500"
          >
            Back to Cards
          </Link>
          <Link
            href="/lessons/language-arts"
            className="inline-flex items-center justify-center rounded-full bg-stone-900 px-5 py-2 text-xs uppercase tracking-[0.4em] text-white/90"
          >
            Return to hub
          </Link>
        </div>
      </main>
    </div>
  );
}
