"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { playChime } from "../lib/sounds";
type NumberRodsSceneProps = {
  playing: boolean;
  voiceEnabled: boolean;
  onComplete?: () => void;
  className?: string;
};

type Step = {
  id: string;
  duration: number;
};

const rodCount = 10;
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

const timeScale = 1;
const scale = (value: number) => value * timeScale;
const durations = {
  slide: 1.5,
  lift: 0.7,
  settle: 0.5,
  glowHold: 0.35,
  count: 0.55,
  finalLift: 0.6,
  finalSettle: 0.4,
  pause: 0.25,
};

const steps: Step[] = [];
for (let rod = 1; rod <= rodCount; rod += 1) {
  steps.push({ id: `rod${rod}Slide`, duration: scale(durations.slide) });
  steps.push({ id: `rod${rod}Lift`, duration: scale(durations.lift) });
  steps.push({ id: `rod${rod}Settle`, duration: scale(durations.settle) });
  steps.push({ id: `rod${rod}GlowHold`, duration: scale(durations.glowHold) });
  for (let segment = 1; segment <= rod; segment += 1) {
    steps.push({
      id: `rod${rod}Count${segment}`,
      duration: scale(durations.count),
    });
  }
  steps.push({ id: `rod${rod}FinalLift`, duration: scale(durations.finalLift) });
  steps.push({ id: `rod${rod}FinalSettle`, duration: scale(durations.finalSettle) });
  if (rod < rodCount) {
    steps.push({ id: `rod${rod}Pause`, duration: scale(durations.pause) });
  }
}

const segmentLength = 0.2;
const rodHeight = 0.04;
const rodDepth = 0.05;
const liftHeight = 0.02;
const maxSegments = rodCount;
const maxLength = segmentLength * maxSegments;
const leftEdge = -maxLength / 2;
const slideStartX = leftEdge - maxLength - 0.6;
const rodGap = rodDepth;
const rodSpacing = rodDepth + rodGap;
const rodZ = Array.from({ length: rodCount }, (_, index) => {
  const offset = (rodCount - 1) / 2 - index;
  return offset * rodSpacing;
});
const baseY = rodHeight / 2 + 0.02;

const smoothstep = (t: number) => t * t * (3 - 2 * t);
const clamp01 = (t: number) => Math.min(1, Math.max(0, t));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

const speakText = (text: string) => {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) {
    return;
  }

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 0.85;
  utterance.pitch = 0.95;
  utterance.volume = 0.8;
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utterance);
};

const buildTimeline = () => {
  let cursor = 0;
  const map: Record<string, { start: number; end: number }> = {};
  steps.forEach((step) => {
    map[step.id] = { start: cursor, end: cursor + step.duration };
    cursor += step.duration;
  });

  return { map, total: cursor };
};

const timeline = buildTimeline();

const voiceCues: { id: string; text: string }[] = [];
for (let rod = 1; rod <= rodCount; rod += 1) {
  voiceCues.push({
    id: `rod${rod}Lift`,
    text: `This is ${numberWords[rod - 1]}`,
  });
  for (let segment = 1; segment <= rod; segment += 1) {
    voiceCues.push({
      id: `rod${rod}Count${segment}`,
      text: numberWords[segment - 1],
    });
  }
}

type NumberRodsContentProps = Omit<NumberRodsSceneProps, "className"> & {
  quizLiftRod: number | null;
  onRodSelect: (index: number) => void;
};

function NumberRodsContent({
  playing,
  voiceEnabled,
  quizLiftRod,
  onComplete,
  onRodSelect,
}: NumberRodsContentProps) {
  const rodRefs = useRef<THREE.Group[]>([]);
  const segmentRefs = useRef<THREE.Mesh[][]>(
    Array.from({ length: rodCount }, () => []),
  );
  const startTimeRef = useRef<number | null>(null);
  const spokenRef = useRef<Record<string, boolean>>({});
  const quizLiftRef = useRef<number | null>(null);
  const quizLiftStartRef = useRef<number | null>(null);
  const completedRef = useRef(false);

  useEffect(() => {
    if (!playing) {
      startTimeRef.current = null;
      spokenRef.current = {};
      completedRef.current = false;
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    }
  }, [playing]);

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
        { length: rodCount },
        (_, index) => segmentLength * (index + 1),
      );
      rodLengths.forEach((length, index) => {
        const rod = rodRefs.current[index];
        if (!rod) {
          return;
        }
        const finalX = leftEdge + length / 2;
        rod.position.set(finalX, baseY, rodZ[index]);
        rod.visible = true;
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
        const cueTime = timeline.map[cue.id].start;
        if (t >= cueTime && !spokenRef.current[cue.id]) {
          spokenRef.current[cue.id] = true;
          speakText(cue.text);
        }
      });
    }

    const rodLengths = Array.from(
      { length: rodCount },
      (_, index) => segmentLength * (index + 1),
    );
    const quizLiftIndex = quizLiftRef.current;
    const quizLiftStart = quizLiftStartRef.current;
    const quizLiftElapsed =
      quizLiftIndex !== null && quizLiftStart !== null ? now - quizLiftStart : 0;
    const quizLiftValue =
      quizLiftIndex !== null && quizLiftElapsed < 1.2
        ? Math.sin((quizLiftElapsed / 1.2) * Math.PI) * 0.03
        : 0;
    rodLengths.forEach((length, index) => {
      const rod = rodRefs.current[index];
      if (!rod) {
        return;
      }

      const rodNumber = index + 1;
      const slideKey = `rod${rodNumber}Slide`;
      const liftKey = `rod${rodNumber}Lift`;
      const settleKey = `rod${rodNumber}Settle`;
      const glowHoldKey = `rod${rodNumber}GlowHold`;
      const finalLiftKey = `rod${rodNumber}FinalLift`;
      const finalSettleKey = `rod${rodNumber}FinalSettle`;
      const slideRange = timeline.map[slideKey];
      const liftRange = timeline.map[liftKey];
      const settleRange = timeline.map[settleKey];
      const glowHoldRange = timeline.map[glowHoldKey];
      const finalLiftRange = timeline.map[finalLiftKey];
      const finalSettleRange = timeline.map[finalSettleKey];
      const finalX = leftEdge + length / 2;

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

      const glowUp =
        t >= liftRange.start && t <= liftRange.end
          ? 0.65
          : t >= settleRange.start && t <= settleRange.end
            ? 0.65 * (1 - clamp01((t - settleRange.start) / (settleRange.end - settleRange.start)))
            : 0;
      const glowHold =
        t >= glowHoldRange.start && t <= glowHoldRange.end
          ? 0.5
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
        const baseColor = material.color;
        const countKey = `rod${rodNumber}Count${segmentIndex + 1}`;
        const countRange = timeline.map[countKey];
        const isCountActive = t >= countRange.start && t <= countRange.end;
        const countProgress = isCountActive
          ? clamp01((t - countRange.start) / (countRange.end - countRange.start))
          : 0;
        const segmentPulse = isCountActive
          ? 0.7 * Math.abs(Math.sin(countProgress * Math.PI * 2))
          : 0;
        const quizGlow = isQuizLift && quizLiftValue > 0 ? 0.6 : 0;
        const emissiveIntensity = Math.max(
          glowUp,
          glowHold,
          finalGlow,
          segmentPulse,
          quizGlow,
        );
        material.emissive.copy(baseColor);
        material.emissiveIntensity = emissiveIntensity;
      });
    });

  });

  const rods = useMemo(
    () =>
      Array.from({ length: rodCount }, (_, index) => ({
        segments: index + 1,
        label: numberWords[index],
      })),
    [],
  );

  const rodColors = ["#3d7dd9", "#d95a4e"]; // blue, red

  return (
    <group>
      <ambientLight intensity={0.6} />
      <directionalLight
        position={[2.2, 2.6, 1.8]}
        intensity={0.9}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-bias={-0.0002}
        shadow-normalBias={0.01}
        shadow-radius={6}
      />
      <directionalLight position={[-2.6, 2.1, -1.2]} intensity={0.25} />

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[3.4, 2.4]} />
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

const clickOrder = [2, 1, 0];
const nameOrder = [0, 1, 2];
const rodNames = numberWords;
type QuizPhase = "click" | "name" | null;

export default function NumberRodsScene({
  playing,
  voiceEnabled,
  onComplete,
  className,
}: NumberRodsSceneProps) {
  const [quizIndex, setQuizIndex] = useState<number | null>(null);
  const [quizPhase, setQuizPhase] = useState<QuizPhase>(null);
  const [quizLiftRod, setQuizLiftRod] = useState<number | null>(null);
  const quizDoneRef = useRef(false);
  const promptRef = useRef<Record<string, boolean>>({});
  const timeoutRef = useRef<number | null>(null);
  const recognitionRef = useRef<any>(null);
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

    const speechWindow = window as unknown as {
      SpeechRecognition?: any;
      webkitSpeechRecognition?: any;
    };
    const SpeechRecognition =
      speechWindow.SpeechRecognition || speechWindow.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      return false;
    }

    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // ignore
      }
    }

    const recognition = new SpeechRecognition();
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
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = window.setTimeout(() => {
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
      }, 450);
    },
    [currentTarget, quizPhase, voiceEnabled],
  );

  useEffect(() => {
    if (!playing) {
      quizDoneRef.current = false;
      promptRef.current = {};
      awaitingAnswerRef.current = false;
      setQuizIndex(null);
      setQuizPhase(null);
      setQuizLiftRod(null);
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {
          // ignore
        }
        recognitionRef.current = null;
      }
    }
  }, [playing]);

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

      const startedRecognition = startRecognition(advance);
      if (!startedRecognition) {
        timeoutRef.current = window.setTimeout(advance, 1100);
      }
    }
  }, [currentTarget, quizPhase, startRecognition, voiceEnabled]);

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
      <Canvas shadows camera={{ position: [0.85, 0.58, 1.55], fov: 40 }}>
        <color attach="background" args={["#f7efe4"]} />
        <NumberRodsContent
          playing={playing}
          voiceEnabled={voiceEnabled}
          quizLiftRod={quizLiftRod}
          onComplete={handleSequenceComplete}
          onRodSelect={handleRodSelect}
        />
        <OrbitControls enablePan={false} enableZoom={false} maxPolarAngle={Math.PI / 2.1} />
      </Canvas>
    </div>
  );
}
