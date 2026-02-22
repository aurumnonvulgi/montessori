"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import ShortBeadStairScene, { BAR_IDS } from "./ShortBeadStairScene";
import HomeLink from "./HomeLink";
import * as THREE from "three";
import { speakWithPreferredVoice } from "../lib/speech";

type ShiftOffset = { x: number; y: number; z: number };

const POSITION_TWO_OFFSET: ShiftOffset = { x: -0.16, y: 0.03, z: 0.05 };
const HOME_OFFSET: ShiftOffset = { x: 0, y: 0, z: 0 };

const createPositionTwoShifts = (): Record<number, ShiftOffset> =>
  BAR_IDS.reduce<Record<number, ShiftOffset>>((acc, id) => {
    acc[id] = { ...POSITION_TWO_OFFSET };
    return acc;
  }, {} as Record<number, ShiftOffset>);

const easing = (t: number) => (t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t);

const getArcPosition = (from: ShiftOffset, to: ShiftOffset, t: number): ShiftOffset => {
  const x = from.x + (to.x - from.x) * t;
  const baseY = from.y + (to.y - from.y) * t;
  const y = baseY + Math.sin(Math.PI * t) * 0.02;
  const baseZ = from.z + (to.z - from.z) * t;
  const z = baseZ + Math.sin(Math.PI * t) * 0.02;
  return { x, y, z };
};

const capitalize = (value: string) => value.charAt(0).toUpperCase() + value.slice(1);
const LOG_LIMIT = 48;

export default function ShortBeadStairLessonV1() {
  const animationRef = useRef<number | null>(null);
  const timeoutIdsRef = useRef<number[]>([]);

  const [barShifts, setBarShifts] = useState<Record<number, ShiftOffset>>(() => createPositionTwoShifts());
  const [barColorOverrides, setBarColorOverrides] = useState<Record<number, string>>({});
  const [barBeadHighlights, setBarBeadHighlights] = useState<Record<number, number | null>>({});
  const [phase, setPhase] = useState<"idle" | "active">("idle");
  const [instruction, setInstruction] = useState("Short Bead Stair (V1, position 2) is ready.");
  const [eventLog, setEventLog] = useState<string[]>([]);
  const [cameraIntroKey, setCameraIntroKey] = useState(0);
  const [cameraReady, setCameraReady] = useState(false);
  const lessonFlowStartedRef = useRef(false);
  const [focusSide, setFocusSide] = useState(0.09);
  const [focusDepth, setFocusDepth] = useState(-0.49);
  const [clickIndex, setClickIndex] = useState(0);
  const [clickEnabled, setClickEnabled] = useState(false);
  const clickOrder = useMemo(() => [3, 2, 1], []);

  const cameraIntroConfig = useMemo(
    () => ({
      overviewPosition: new THREE.Vector3(0.25, 1.3, 0.6),
      overviewTarget: new THREE.Vector3(0, 0, 0),
      panPosition: new THREE.Vector3(-0.05, 0.9, 0.45),
      focusPosition: new THREE.Vector3(-0.07, 0.75, 0.14),
      focusTarget: new THREE.Vector3(-0.07, 0.02, 0),
      panDuration: 1800,
      focusDuration: 1400,
    }),
    [],
  );

  const lastLogRef = useRef<{ message: string; timestamp: number } | null>(null);

  const logEvent = useCallback((message: string) => {
    const now = Date.now();
    if (lastLogRef.current?.message === message && now - lastLogRef.current.timestamp < 1500) {
      return;
    }
    lastLogRef.current = { message, timestamp: now };
    setEventLog((previous) => [
      `${new Date().toLocaleTimeString([], { hour12: false })} – ${message}`,
      ...previous,
    ].slice(0, LOG_LIMIT));
  }, []);

  const speak = useCallback(
    (text: string) => {
      logEvent(`Speech: ${text}`);
      speakWithPreferredVoice(text, { rate: 0.95, pitch: 0.95, volume: 0.9, lang: "en-US" });
    },
    [logEvent],
  );

  const clearTimeouts = useCallback(() => {
    timeoutIdsRef.current.forEach((id) => window.clearTimeout(id));
    timeoutIdsRef.current = [];
  }, []);

  const prepareInitialShifts = useCallback(() => {
    setBarShifts(createPositionTwoShifts());
    setBarColorOverrides({});
    setBarBeadHighlights({});
  }, []);

  const animateBar = useCallback(
    (barId: number, from: ShiftOffset, to: ShiftOffset, duration: number, onComplete?: () => void) => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }

      logEvent(`Animation: moving bar ${barId}`);
      let start: number | null = null;
      const step = (timestamp: number) => {
        if (start === null) {
          start = timestamp;
        }
        const progress = Math.min((timestamp - start) / duration, 1);
        const eased = easing(progress);
        const { x, y, z } = getArcPosition(from, to, eased);

        setBarShifts((previous) => ({
          ...previous,
          [barId]: { x, y, z },
        }));

        if (progress < 1) {
          animationRef.current = requestAnimationFrame(step);
          return;
        }

        animationRef.current = null;
        onComplete?.();
      };

      animationRef.current = requestAnimationFrame(step);
    },
    [logEvent],
  );

  const highlightBar = useCallback(
    (barId: number, label: string, onComplete?: () => void) => {
      setInstruction(`This is ${label}.`);
      setBarColorOverrides({ [barId]: "#ff5c5c" });
      setBarBeadHighlights({});
      logEvent(`Highlight bar ${barId}: “This is ${label}”`);
      speak(`This is ${label}`);
      const id = window.setTimeout(() => {
        setInstruction(`${capitalize(label)}.`);
        speak(capitalize(label));
        setBarColorOverrides({});
        onComplete?.();
      }, 1200);
      timeoutIdsRef.current.push(id);
    },
    [speak, logEvent],
  );

  const highlightCountingSequence = useCallback(
    (barId: number, label: string, steps: string[], onComplete?: () => void) => {
      setInstruction(`This is ${label}.`);
      setBarColorOverrides({ [barId]: "#ff5c5c" });
      setBarBeadHighlights({});
      logEvent(`Highlight bar ${barId}: “This is ${label}”`);
      speak(`This is ${label}`);

      const resetColorId = window.setTimeout(() => {
        setBarColorOverrides({});
        logEvent(`Reset bar ${barId} color before counting`);
      }, 800);
      timeoutIdsRef.current.push(resetColorId);

      const delayBase = 1200;
      steps.forEach((stepLabel, index) => {
        const stepDelay = delayBase + index * delayBase;
        const stepId = window.setTimeout(() => {
          setInstruction(capitalize(stepLabel));
          setBarColorOverrides({});
          setBarBeadHighlights({ [barId]: index });
          logEvent(`Highlight bead ${index + 1} of bar ${barId}`);
          speak(stepLabel);
        }, stepDelay);
        timeoutIdsRef.current.push(stepId);
      });

      const finishId = window.setTimeout(() => {
        setBarBeadHighlights({});
        onComplete?.();
      }, delayBase + steps.length * delayBase);
      timeoutIdsRef.current.push(finishId);
    },
    [logEvent, speak],
  );

  const beadCounts = useMemo<Record<number, number>>(() => ({ 1: 1, 2: 2, 3: 3 }), []);

  const highlightBarBeadsSequential = useCallback(
    (barId: number, beadCount: number, onComplete?: () => void) => {
      setBarColorOverrides({});
      setBarBeadHighlights({});
      for (let i = 0; i < beadCount; i += 1) {
        const timer = window.setTimeout(() => {
          setBarBeadHighlights({ [barId]: i });
          logEvent(`Click highlight bead ${i + 1} of bar ${barId}`);
        }, 600 * (i + 1));
        timeoutIdsRef.current.push(timer);
      }

      const finishTimer = window.setTimeout(() => {
        setBarBeadHighlights({});
        onComplete?.();
      }, 600 * (beadCount + 1));
      timeoutIdsRef.current.push(finishTimer);
    },
    [logEvent],
  );

  const startClickPrompts = useCallback(() => {
    const next = clickOrder[0];
    setClickIndex(0);
    setInstruction(`Can you click on ${next}?`);
    logEvent(`Prompt: click ${next}`);
    speak(`Can you click on ${next}?`);
    setClickEnabled(true);
  }, [clickOrder, logEvent, setClickEnabled, speak]);

  const handleBarClick = useCallback(
    (barId: number) => {
      if (!clickEnabled) {
        return;
      }
      const expected = clickOrder[clickIndex];
      if (barId !== expected) {
        setInstruction(`Try clicking on ${expected} next.`);
        logEvent(`Clicked ${barId} instead of ${expected}`);
        return;
      }
      setClickEnabled(false);
      highlightBarBeadsSequential(barId, beadCounts[barId], () => {
        const nextIndex = clickIndex + 1;
        if (nextIndex >= clickOrder.length) {
          setInstruction("You clicked all the bars! Wonderful.");
          setPhase("idle");
        } else {
          setClickIndex(nextIndex);
          setInstruction(`Can you click on ${clickOrder[nextIndex]}?`);
          setClickEnabled(true);
        }
      });
    },
    [
      clickEnabled,
      clickIndex,
      clickOrder,
      highlightBarBeadsSequential,
      logEvent,
      beadCounts,
      setClickEnabled,
      setClickIndex,
      setInstruction,
      setPhase,
    ],
  );

  const runLessonFlow = useCallback(() => {
    setInstruction("Short Bead Stair (position 2) is ready.");
    logEvent("Lesson routine triggered");

    const startDelay = window.setTimeout(() => {
      animateBar(1, POSITION_TWO_OFFSET, HOME_OFFSET, 1200, () => {
        highlightBar(1, "one", () => {
          const pauseId = window.setTimeout(() => {
            animateBar(2, POSITION_TWO_OFFSET, HOME_OFFSET, 1200, () =>
              highlightCountingSequence(2, "two", ["one", "two"], () => {
                const pauseAfterTwo = window.setTimeout(() => {
                  animateBar(3, POSITION_TWO_OFFSET, HOME_OFFSET, 1200, () =>
                    highlightCountingSequence(
                      3,
                      "three",
                      ["one", "two", "three"],
                      () => {
                        setInstruction("Now it's your turn.");
                        startClickPrompts();
                      },
                    ),
                  );
                }, 2000);
                timeoutIdsRef.current.push(pauseAfterTwo);
              }),
            );
          }, 2000);
          timeoutIdsRef.current.push(pauseId);
        });
      });
    }, 400);
    timeoutIdsRef.current.push(startDelay);
  }, [animateBar, highlightBar, highlightCountingSequence, logEvent, setInstruction, startClickPrompts]);

  const startSequence = useCallback(() => {
    setPhase("active");
    setInstruction("Preparing the Short Bead Stair view...");
    logEvent("Sequence started");
    clearTimeouts();
    prepareInitialShifts();
    lessonFlowStartedRef.current = false;
    setCameraReady(false);
    setFocusSide(0.09);
    setFocusDepth(-0.49);
    setCameraIntroKey((prev) => prev + 1);
    setClickEnabled(false);
  }, [clearTimeouts, logEvent, prepareInitialShifts, setClickEnabled]);

  const handleCameraIntroComplete = useCallback(() => {
    logEvent("Camera intro complete");
    setInstruction("Short Bead Stair (V1) view is ready.");
    setCameraReady(true);
  }, [logEvent]);

  useEffect(() => {
    if (phase !== "active" || !cameraReady || lessonFlowStartedRef.current) {
      return;
    }
    lessonFlowStartedRef.current = true;
    runLessonFlow();
  }, [cameraReady, phase, runLessonFlow]);

  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      clearTimeouts();
    };
  }, [clearTimeouts]);

  const startButtonLabel = phase === "idle" ? "Start Short Bead Stair V1" : "Lesson in progress";

  return (
    <div className="relative min-h-screen bg-[radial-gradient(circle_at_top,#f5efe6_0%,#fffaf3_65%,#f7efe4_100%)]">
      <HomeLink />
      <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-8 px-6 py-10 sm:px-10">
        <div className="space-y-3 text-center">
          <p className="text-xs uppercase tracking-[0.3em] text-stone-400">Short Bead Stair V1</p>
          <h1 className="font-display text-4xl font-semibold text-stone-900">Short Bead Stair (V1)</h1>
          <p className="sr-only" aria-live="polite">
            {instruction}
          </p>
        </div>
        <div className="space-y-4 rounded-2xl border border-stone-200 bg-white/60 p-4 shadow-inner">
          <div>
            <div className="flex items-center justify-between gap-4 text-sm font-medium text-stone-600">
              <span>Zoom depth</span>
              <span className="text-xs uppercase tracking-[0.3em] text-stone-400">{focusDepth.toFixed(2)}</span>
            </div>
            <input
              type="range"
              min={-1}
              max={0.25}
              step={0.01}
              value={focusDepth}
              onChange={(event) => setFocusDepth(parseFloat(event.currentTarget.value))}
              className="mt-2 h-2 w-full accent-stone-900"
            />
          </div>
          <div>
            <div className="flex items-center justify-between gap-4 text-sm font-medium text-stone-600">
              <span>Lateral offset</span>
              <span className="text-xs uppercase tracking-[0.3em] text-stone-400">{focusSide.toFixed(2)}</span>
            </div>
            <input
              type="range"
              min={-0.25}
              max={0.25}
              step={0.01}
              value={focusSide}
              onChange={(event) => setFocusSide(parseFloat(event.currentTarget.value))}
              className="mt-2 h-2 w-full accent-stone-900"
            />
          </div>
        </div>

        <section className="rounded-[36px] border border-stone-100 bg-white/90 p-6 shadow-[0_40px_70px_-50px_rgba(15,23,42,0.8)]">
          <div className="h-[520px]">
            <ShortBeadStairScene
              barShifts={barShifts}
              barColorOverrides={barColorOverrides}
              barBeadHighlights={barBeadHighlights}
              touchingBeads
              cameraIntroConfig={cameraIntroConfig}
              cameraIntroKey={cameraIntroKey}
              onCameraIntroComplete={handleCameraIntroComplete}
              focusSideOffset={focusSide}
              focusDepthOffset={focusDepth}
              cameraReady={cameraReady}
              onBarClick={handleBarClick}
            />
          </div>
        </section>

        <section className="grid gap-4">
          <button
            type="button"
            onClick={startSequence}
            disabled={phase !== "idle"}
            className="w-full rounded-3xl bg-[#cf5f5f] py-4 text-sm font-semibold uppercase tracking-[0.25em] text-white shadow-lg transition hover:bg-[#c15454] disabled:cursor-not-allowed disabled:bg-stone-300"
          >
            {startButtonLabel}
          </button>
        </section>

        <section className="rounded-3xl border border-stone-200 bg-stone-50/80 p-4 text-[11px] text-stone-500">
          <div className="text-xs uppercase tracking-[0.35em] text-stone-400">Activity log</div>
          <div className="mt-2 max-h-[360px] min-h-[220px] overflow-y-auto rounded-2xl bg-white/80 p-3 text-[12px] leading-tight text-stone-600 shadow-inner">
            {eventLog.length === 0 ? (
              <span className="text-stone-400">Waiting for the next cue…</span>
            ) : (
              eventLog.map((log, index) => (
                <p key={`${log}-${index}`} className="break-words py-1">
                  {log}
                </p>
              ))
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
