"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { playChime } from "../lib/sounds";
import { primeSpeechVoices, speakWithPreferredVoice } from "../lib/speech";
type NumberRodsSceneProps = {
  playing: boolean;
  voiceEnabled: boolean;
  stageIndex?: number;
  onComplete?: () => void;
  onStageComplete?: () => void;
  className?: string;
};

type Step = {
  id: string;
  duration: number;
};

const numberWords = [
  "one",
  "two",
  "three",
  "four",
  "five",
  "six",
  "seven",
  "eight",
  "nine",
  "ten",
];
export const NUMBER_ROD_STAGES = [
  [1, 2, 3],
  [4, 5, 6],
  [7, 8, 9],
  [10],
];
const maxRodCount = numberWords.length;
const anchorSegments = NUMBER_ROD_STAGES[0].length;

const timeScale = 1.18;
const scale = (value: number) => value * timeScale;
const quizLiftDuration = 2.2;
const durations = {
  slide: 1.5,
  stop: 0.3,
  preGlow: 0.4,
  lift: 0.7,
  settle: 0.5,
  count: 0.75,
  finalLift: 0.6,
  finalSettle: 0.4,
  pause: 0.25,
};

const buildStepsForRods = (rods: number[]) => {
  const steps: Step[] = [];
  rods.forEach((rod, index) => {
    steps.push({ id: `rod${rod}Slide`, duration: scale(durations.slide) });
    steps.push({ id: `rod${rod}Stop`, duration: scale(durations.stop) });
    steps.push({ id: `rod${rod}PreGlow`, duration: scale(durations.preGlow) });
    steps.push({ id: `rod${rod}Lift`, duration: scale(durations.lift) });
    steps.push({ id: `rod${rod}Settle`, duration: scale(durations.settle) });
    for (let segment = 1; segment <= rod; segment += 1) {
      steps.push({
        id: `rod${rod}Count${segment}`,
        duration: scale(durations.count),
      });
    }
    steps.push({
      id: `rod${rod}FinalLift`,
      duration: scale(durations.finalLift),
    });
    steps.push({
      id: `rod${rod}FinalSettle`,
      duration: scale(durations.finalSettle),
    });
    if (index < rods.length - 1) {
      steps.push({ id: `rod${rod}Pause`, duration: scale(durations.pause) });
    }
  });
  return steps;
};

const segmentLength = 0.2;
const rodHeight = 0.04;
const rodDepth = 0.05;
const liftHeight = 0.02;
const anchorLength = segmentLength * anchorSegments;
const leftEdge = -anchorLength / 2;
const slideStartX = leftEdge - anchorLength - 0.6;
const getPlaneWidth = (maxSegmentsInStage: number) => {
  const stageLength = segmentLength * maxSegmentsInStage;
  const maxRightEdge = leftEdge + stageLength;
  const planeHalfWidth = Math.max(Math.abs(leftEdge), Math.abs(maxRightEdge)) + 0.2;
  return Math.max(3, planeHalfWidth * 2);
};
const rodGap = rodDepth;
const rodSpacing = rodDepth + rodGap;
const rodZ = (() => {
  const positions = Array.from({ length: maxRodCount }, () => 0);
  const anchorCount = Math.min(anchorSegments, maxRodCount);
  for (let index = 0; index < anchorCount; index += 1) {
    const offset = (anchorSegments - 1) / 2 - index;
    positions[index] = offset * rodSpacing;
  }
  for (let index = anchorCount; index < maxRodCount; index += 1) {
    positions[index] = positions[index - 1] - rodSpacing;
  }
  return positions;
})();
const baseY = rodHeight / 2 + 0.02;

const smoothstep = (t: number) => t * t * (3 - 2 * t);
const clamp01 = (t: number) => Math.min(1, Math.max(0, t));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

const speakText = (text: string) => {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) {
    return;
  }
  speakWithPreferredVoice(text, { rate: 0.85, pitch: 0.95, volume: 0.8 });
};

const buildTimeline = (steps: Step[]) => {
  let cursor = 0;
  const map: Record<string, { start: number; end: number }> = {};
  steps.forEach((step) => {
    map[step.id] = { start: cursor, end: cursor + step.duration };
    cursor += step.duration;
  });

  return { map, total: cursor };
};

const buildVoiceCues = (rods: number[]) => {
  const voiceCues: { id: string; text: string; offset?: number }[] = [];
  rods.forEach((rod) => {
    voiceCues.push({
      id: `rod${rod}Lift`,
      text: `This is ${numberWords[rod - 1]}`,
    });
    for (let segment = 1; segment <= rod; segment += 1) {
      voiceCues.push({
        id: `rod${rod}Count${segment}`,
        text: numberWords[segment - 1],
        offset: scale(0.12),
      });
    }
  });
  return voiceCues;
};

type Timeline = {
  map: Record<string, { start: number; end: number }>;
  total: number;
};

type VoiceCue = { id: string; text: string; offset?: number };

type NumberRodsContentProps = Omit<NumberRodsSceneProps, "className"> & {
  timeline: Timeline;
  voiceCues: VoiceCue[];
  stageRods: number[];
  revealedCount: number;
  stageKey: number;
  quizLiftRod: number | null;
  onRodSelect: (index: number) => void;
};

function NumberRodsContent({
  playing,
  voiceEnabled,
  timeline,
  voiceCues,
  stageRods,
  revealedCount,
  stageKey,
  quizLiftRod,
  onComplete,
  onRodSelect,
}: NumberRodsContentProps) {
  const rodRefs = useRef<THREE.Group[]>([]);
  const segmentRefs = useRef<THREE.Mesh[][]>(
    Array.from({ length: maxRodCount }, () => []),
  );
  const startTimeRef = useRef<number | null>(null);
  const spokenRef = useRef<Record<string, boolean>>({});
  const quizLiftRef = useRef<number | null>(null);
  const quizLiftStartRef = useRef<number | null>(null);
  const completedRef = useRef(false);
  const dimFactor = 0.45;

  const getBaseColor = (material: THREE.MeshStandardMaterial) => {
    const stored = material.userData.baseColor as THREE.Color | undefined;
    if (stored) {
      return stored;
    }
    const base = material.color.clone();
    material.userData.baseColor = base;
    return base;
  };

  useEffect(() => {
    if (!playing) {
      startTimeRef.current = null;
      spokenRef.current = {};
      completedRef.current = false;
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
      return;
    }

    startTimeRef.current = null;
    spokenRef.current = {};
    completedRef.current = false;
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
  }, [playing, stageKey]);

  useEffect(() => {
    quizLiftRef.current = quizLiftRod;
    if (quizLiftRod !== null) {
      quizLiftStartRef.current = performance.now() / 1000;
    }
  }, [quizLiftRod]);

  useFrame((state) => {
    const now = state.clock.getElapsedTime();

    if (!playing) {
      const rodLengths = Array.from(
        { length: maxRodCount },
        (_, index) => segmentLength * (index + 1),
      );
      rodLengths.forEach((length, index) => {
        const rod = rodRefs.current[index];
        if (!rod) {
          return;
        }
        if (index >= anchorSegments) {
          rod.visible = false;
          return;
        }
        const finalX = leftEdge + length / 2;
        rod.position.set(finalX, baseY, rodZ[index]);
        rod.visible = true;
        const rodSegments = segmentRefs.current[index] ?? [];
        rodSegments.forEach((segment) => {
          if (!segment) {
            return;
          }
          const material = segment.material as THREE.MeshStandardMaterial;
          const baseColor = getBaseColor(material);
          material.color.copy(baseColor);
          material.emissive.copy(baseColor);
          material.emissiveIntensity = 0;
          segment.scale.set(1, 1, 1);
        });
      });
      return;
    }

    if (startTimeRef.current === null) {
      startTimeRef.current = now;
      spokenRef.current = {};
      completedRef.current = false;
    }

    const t = now - (startTimeRef.current ?? 0);

    if (!completedRef.current && t >= timeline.total) {
      completedRef.current = true;
      if (onComplete) {
        onComplete();
      }
    }

    if (voiceEnabled) {
      voiceCues.forEach((cue) => {
        const cueTime = timeline.map[cue.id].start + (cue.offset ?? 0);
        if (t >= cueTime && !spokenRef.current[cue.id]) {
          spokenRef.current[cue.id] = true;
          speakText(cue.text);
        }
      });
    }

    const rodLengths = Array.from(
      { length: maxRodCount },
      (_, index) => segmentLength * (index + 1),
    );
    const quizLiftIndex = quizLiftRef.current;
    const quizLiftStart = quizLiftStartRef.current;
    const quizLiftElapsed =
      quizLiftIndex !== null && quizLiftStart !== null ? now - quizLiftStart : 0;
    const quizLiftValue =
      quizLiftIndex !== null && quizLiftElapsed < quizLiftDuration
        ? Math.sin((quizLiftElapsed / quizLiftDuration) * Math.PI) * 0.03
        : 0;
    rodLengths.forEach((length, index) => {
      const rod = rodRefs.current[index];
      if (!rod) {
        return;
      }

      const rodNumber = index + 1;
      const isStageRod = stageRods.includes(rodNumber);
      const slideKey = `rod${rodNumber}Slide`;
      const preGlowKey = `rod${rodNumber}PreGlow`;
      const liftKey = `rod${rodNumber}Lift`;
      const settleKey = `rod${rodNumber}Settle`;
      const finalLiftKey = `rod${rodNumber}FinalLift`;
      const finalSettleKey = `rod${rodNumber}FinalSettle`;
      const finalX = leftEdge + length / 2;

      if (!isStageRod) {
        if (rodNumber <= revealedCount) {
          rod.position.set(finalX, baseY, rodZ[index]);
          rod.visible = true;
        } else {
          rod.visible = false;
        }
        const rodSegments = segmentRefs.current[index] ?? [];
        rodSegments.forEach((segment) => {
          if (!segment) {
            return;
          }
          const material = segment.material as THREE.MeshStandardMaterial;
          const baseColor = getBaseColor(material);
          material.color.copy(baseColor).multiplyScalar(dimFactor);
          material.emissive.copy(baseColor);
          material.emissiveIntensity = 0;
          segment.scale.set(1, 1, 1);
        });
        return;
      }

      const slideRange = timeline.map[slideKey];
      const preGlowRange = timeline.map[preGlowKey];
      const liftRange = timeline.map[liftKey];
      const settleRange = timeline.map[settleKey];
      const finalLiftRange = timeline.map[finalLiftKey];
      const finalSettleRange = timeline.map[finalSettleKey];
      if (
        !slideRange ||
        !preGlowRange ||
        !liftRange ||
        !settleRange ||
        !finalLiftRange ||
        !finalSettleRange
      ) {
        rod.visible = false;
        return;
      }

      let x = slideStartX;
      if (t >= slideRange.end) {
        x = finalX;
      } else if (t >= slideRange.start) {
        const progress = clamp01((t - slideRange.start) / (slideRange.end - slideRange.start));
        x = lerp(slideStartX, finalX, smoothstep(progress));
      }

      let y = baseY;
      if (t >= finalLiftRange.start && t <= finalLiftRange.end) {
        const progress = clamp01(
          (t - finalLiftRange.start) / (finalLiftRange.end - finalLiftRange.start),
        );
        y = baseY + liftHeight * smoothstep(progress);
      } else if (t >= finalSettleRange.start && t <= finalSettleRange.end) {
        const progress = clamp01(
          (t - finalSettleRange.start) /
            (finalSettleRange.end - finalSettleRange.start),
        );
        y = baseY + liftHeight * (1 - smoothstep(progress));
      } else if (t >= liftRange.start && t <= liftRange.end) {
        const progress = clamp01((t - liftRange.start) / (liftRange.end - liftRange.start));
        y = baseY + liftHeight * smoothstep(progress);
      } else if (t >= settleRange.start && t <= settleRange.end) {
        const progress = clamp01((t - settleRange.start) / (settleRange.end - settleRange.start));
        y = baseY + liftHeight * (1 - smoothstep(progress));
      }
      const isQuizLift = quizLiftIndex === index;
      if (isQuizLift) {
        y += quizLiftValue;
      }
      y = Math.max(baseY, y);

      const preGlow =
        t >= preGlowRange.start && t <= settleRange.end
          ? 0.55
          : 0;
      const finalGlow =
        t >= finalLiftRange.start && t <= finalLiftRange.end
          ? 0.7
          : t >= finalSettleRange.start && t <= finalSettleRange.end
            ? 0.7 * (1 - clamp01((t - finalSettleRange.start) / (finalSettleRange.end - finalSettleRange.start)))
            : 0;

      rod.position.set(x, y, rodZ[index]);
      rod.visible = t >= slideRange.start - 0.1;

      const rodSegments = segmentRefs.current[index] ?? [];
      rodSegments.forEach((segment, segmentIndex) => {
        if (!segment) {
          return;
        }
        const material = segment.material as THREE.MeshStandardMaterial;
        const baseColor = getBaseColor(material);
        material.color.copy(baseColor);
        const countKey = `rod${rodNumber}Count${segmentIndex + 1}`;
        const countRange = timeline.map[countKey];
        if (!countRange) {
          material.emissive.copy(baseColor);
          material.emissiveIntensity = 0;
          segment.scale.set(1, 1, 1);
          return;
        }
        const isCountActive = t >= countRange.start && t <= countRange.end;
        const segmentPulse = isCountActive ? 0.28 : 0;
        const segmentScale = isCountActive ? 1.015 : 1;
        const quizGlow = isQuizLift && quizLiftValue > 0 ? 0.6 : 0;
        const emissiveIntensity = Math.max(
          preGlow,
          finalGlow,
          segmentPulse,
          quizGlow,
        );
        material.emissive.copy(baseColor);
        material.emissiveIntensity = emissiveIntensity;
        segment.scale.set(segmentScale, 1, segmentScale);
      });
    });

  });

  const rods = useMemo(
    () =>
      Array.from({ length: maxRodCount }, (_, index) => ({
        segments: index + 1,
        label: numberWords[index],
      })),
    [],
  );

  const rodColors = ["#3d7dd9", "#d95a4e"]; // blue, red
  const planeWidth = useMemo(() => {
    const stageMax = stageRods.reduce(
      (max, rod) => Math.max(max, rod),
      anchorSegments,
    );
    return getPlaneWidth(stageMax);
  }, [stageRods]);

  return (
    <group>
      <ambientLight intensity={0.7} />
      <directionalLight
        position={[2.2, 2.6, 1.8]}
        intensity={0.7}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-bias={-0.0001}
        shadow-normalBias={0.02}
        shadow-radius={12}
      />
      <directionalLight position={[-2.6, 2.1, -1.2]} intensity={0.3} />

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[planeWidth, 2]} />
        <meshStandardMaterial color="#f3e9d8" roughness={0.95} metalness={0.02} />
      </mesh>

      {rods.map((rod, index) => {
        const length = rod.segments * segmentLength;
        return (
          <group
            key={rod.label}
            ref={(el) => {
              if (el) {
                rodRefs.current[index] = el;
              }
            }}
            onPointerDown={(event) => {
              event.stopPropagation();
              onRodSelect(index);
            }}
          >
            {Array.from({ length: rod.segments }).map((_, segmentIndex) => {
              const xOffset = -length / 2 + segmentLength / 2 + segmentIndex * segmentLength;
              const color = rodColors[segmentIndex % 2];
              return (
                <mesh
                  key={`${rod.label}-${segmentIndex}`}
                  position={[xOffset, 0, 0]}
                  castShadow
                  receiveShadow
                  ref={(el) => {
                    if (el) {
                      if (!segmentRefs.current[index]) {
                        segmentRefs.current[index] = [];
                      }
                      segmentRefs.current[index][segmentIndex] = el;
                    }
                  }}
                >
                  <boxGeometry args={[segmentLength * 0.98, rodHeight, rodDepth]} />
                  <meshStandardMaterial
                    color={color}
                    roughness={0.35}
                    metalness={0.05}
                    emissive={color}
                    emissiveIntensity={0}
                  />
                </mesh>
              );
            })}
          </group>
        );
      })}

    </group>
  );
}

const rodNames = numberWords;
type QuizPhase = "click" | "name" | null;

export default function NumberRodsScene({
  playing,
  voiceEnabled,
  stageIndex = 0,
  onComplete,
  onStageComplete,
  className,
}: NumberRodsSceneProps) {
  useEffect(() => {
    primeSpeechVoices();
  }, []);

  const stageRods = useMemo(
    () => NUMBER_ROD_STAGES[stageIndex] ?? NUMBER_ROD_STAGES[0],
    [stageIndex],
  );
  const stageSteps = useMemo(() => buildStepsForRods(stageRods), [stageRods]);
  const timeline = useMemo(() => buildTimeline(stageSteps), [stageSteps]);
  const voiceCues = useMemo(() => buildVoiceCues(stageRods), [stageRods]);
  const clickOrder = useMemo(
    () => [...stageRods].reverse().map((rod) => rod - 1),
    [stageRods],
  );
  const nameOrder = useMemo(() => stageRods.map((rod) => rod - 1), [stageRods]);
  const revealedCount = stageRods.length > 0 ? stageRods[0] - 1 : 0;
  const stageMax = useMemo(
    () =>
      stageRods.reduce(
        (max, rod) => Math.max(max, rod),
        anchorSegments,
      ),
    [stageRods],
  );
  const targetX = leftEdge + (segmentLength * stageMax) / 2;
  const cameraPosition = useMemo(
    () => [targetX + 0.5, 0.46, 0.98] as [number, number, number],
    [targetX],
  );

  const [quizIndex, setQuizIndex] = useState<number | null>(null);
  const [quizPhase, setQuizPhase] = useState<QuizPhase>(null);
  const [quizLiftRod, setQuizLiftRod] = useState<number | null>(null);
  const quizDoneRef = useRef(false);
  const quizCompleteRef = useRef(false);
  const promptRef = useRef<Record<string, boolean>>({});
  const timeoutRef = useRef<number | null>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const awaitingAnswerRef = useRef(false);

  const currentTarget =
    quizIndex !== null && quizPhase === "click"
      ? clickOrder[quizIndex]
      : quizIndex !== null && quizPhase === "name"
        ? nameOrder[quizIndex]
        : null;

  const handleSequenceComplete = useCallback(() => {
    if (!quizDoneRef.current) {
      quizDoneRef.current = true;
      setQuizPhase("click");
      setQuizIndex(0);
    }
    if (onComplete) {
      onComplete();
    }
  }, [onComplete]);

  const startRecognition = useCallback((onFinished: () => void) => {
    if (typeof window === "undefined") {
      return false;
    }

    const speechWindow = window as Window & {
      SpeechRecognition?: typeof SpeechRecognition;
      webkitSpeechRecognition?: typeof SpeechRecognition;
    };
    const SpeechRecognitionConstructor =
      speechWindow.SpeechRecognition ?? speechWindow.webkitSpeechRecognition;

    if (!SpeechRecognitionConstructor) {
      return false;
    }

    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // ignore
      }
    }

    const recognition = new SpeechRecognitionConstructor();
    recognition.lang = "en-US";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    let done = false;
    const finish = () => {
      if (done) {
        return;
      }
      done = true;
      recognitionRef.current = null;
      onFinished();
    };

    recognition.onresult = finish;
    recognition.onerror = finish;
    recognition.onend = finish;

    recognitionRef.current = recognition;
    recognition.start();
    return true;
  }, []);

  const handleRodSelect = useCallback(
    (index: number) => {
      if (currentTarget === null || quizPhase !== "click") {
        return;
      }

      if (awaitingAnswerRef.current) {
        return;
      }

      if (index !== currentTarget) {
        if (voiceEnabled) {
          speakText("Oh no, try again.");
        }
        return;
      }

      playChime();
      setQuizLiftRod(index);
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = window.setTimeout(() => {
        setQuizLiftRod(null);
        setQuizIndex((prev) => {
          if (prev === null) {
            return null;
          }
          const next = prev + 1;
          if (next < clickOrder.length) {
            return next;
          }
          setQuizPhase("name");
          return 0;
        });
      }, quizLiftDuration * 1000);
    },
    [currentTarget, quizPhase, voiceEnabled, clickOrder.length],
  );

  const resetQuizState = useCallback(() => {
    quizDoneRef.current = false;
    quizCompleteRef.current = false;
    promptRef.current = {};
    awaitingAnswerRef.current = false;
    setQuizIndex(null);
    setQuizPhase(null);
    setQuizLiftRod(null);
    if (timeoutRef.current) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // ignore
      }
      recognitionRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!playing) {
      resetQuizState();
      return;
    }
    resetQuizState();
  }, [playing, stageIndex, resetQuizState]);

  useEffect(() => {
    if (currentTarget === null || !voiceEnabled || quizPhase === null) {
      return;
    }
    const promptKey = `${quizPhase}-${currentTarget}`;
    if (promptRef.current[promptKey]) {
      return;
    }
    promptRef.current[promptKey] = true;

    if (quizPhase === "click") {
      speakText(`Can you click on ${rodNames[currentTarget]}?`);
      return;
    }

    if (quizPhase === "name") {
      awaitingAnswerRef.current = true;
      setQuizLiftRod(currentTarget);
      speakText("What is this?");
      const advance = () => {
        awaitingAnswerRef.current = false;
        setQuizLiftRod(null);
        setQuizIndex((prev) => {
          if (prev === null) {
            return null;
          }
          const next = prev + 1;
          if (next < nameOrder.length) {
            return next;
          }
          setQuizPhase(null);
          return null;
        });
      };

      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
      }

      const minDelayMs = quizLiftDuration * 1000;
      const startedAt = performance.now();
      const finishAfterDelay = () => {
        const elapsed = performance.now() - startedAt;
        const wait = Math.max(0, minDelayMs - elapsed);
        timeoutRef.current = window.setTimeout(advance, wait);
      };

      const startedRecognition = startRecognition(finishAfterDelay);
      if (!startedRecognition) {
        finishAfterDelay();
      }
    }
  }, [currentTarget, quizPhase, startRecognition, voiceEnabled, nameOrder.length]);

  useEffect(() => {
    if (quizPhase !== null) {
      return;
    }
    if (!quizDoneRef.current || quizCompleteRef.current) {
      return;
    }
    quizCompleteRef.current = true;
    if (onStageComplete) {
      onStageComplete();
    }
  }, [onStageComplete, quizPhase]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
      }
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {
          // ignore
        }
        recognitionRef.current = null;
      }
    };
  }, []);

  return (
    <div
      className={`w-full overflow-hidden rounded-[28px] bg-[#f7efe4] ${className ?? "h-[420px]"}`}
    >
      <Canvas shadows camera={{ position: cameraPosition, fov: 33 }}>
        <color attach="background" args={["#f7efe4"]} />
        <NumberRodsContent
          playing={playing}
          voiceEnabled={voiceEnabled}
          timeline={timeline}
          voiceCues={voiceCues}
          stageRods={stageRods}
          revealedCount={revealedCount}
          stageKey={stageIndex}
          quizLiftRod={quizLiftRod}
          onComplete={handleSequenceComplete}
          onRodSelect={handleRodSelect}
        />
        <OrbitControls
          enablePan={false}
          enableZoom
          maxPolarAngle={Math.PI / 2.1}
          minAzimuthAngle={-Math.PI / 4}
          maxAzimuthAngle={Math.PI / 4}
          target={[targetX, 0.03, 0]}
          minDistance={1.1}
          maxDistance={2.2}
        />
      </Canvas>
    </div>
  );
}
