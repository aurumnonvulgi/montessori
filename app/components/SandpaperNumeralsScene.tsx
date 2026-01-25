"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Text } from "@react-three/drei";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { playChime } from "../lib/sounds";

type SandpaperNumeralsSceneProps = {
  playing: boolean;
  voiceEnabled: boolean;
  className?: string;
};

type QuizPhase = "click" | "name" | null;

const numerals = ["1", "2", "3"];
const numeralWords = ["one", "two", "three"];
const cardSize = { width: 0.36, height: 0.46, thickness: 0.03 };
const baseY = cardSize.thickness / 2;
const slideDuration = 1.6;
const slideDelay = 0.4;
const traceDelay = 0.2;
const traceDuration = 1.6;
const quizLiftDuration = 2.2;
const liftHeight = 0.05;
const stackBase = new THREE.Vector3(-0.72, baseY, -0.45);
const stackOffsets = [
  new THREE.Vector3(0, 0.001, 0),
  new THREE.Vector3(0.05, 0.002, 0.05),
  new THREE.Vector3(0.1, 0.003, 0.1),
];
const rowZ = 0.38;
const rowX = [-0.38, 0, 0.38];
const textSurfaceY = cardSize.thickness / 2 + 0.002;
const textRaise = 0.025;
const carveDepth = 0.004;

const smoothstep = (t: number) => t * t * (3 - 2 * t);
const clamp01 = (t: number) => Math.min(1, Math.max(0, t));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

const buildTimeline = () => {
  let cursor = 0;
  const stages = numerals.map(() => {
    const slideStart = cursor;
    const slideEnd = slideStart + slideDuration;
    const traceStart = slideEnd + traceDelay;
    const traceEnd = traceStart + traceDuration;
    cursor = traceEnd + slideDelay;
    return { slideStart, slideEnd, traceStart, traceEnd };
  });
  const sequenceDuration = stages[stages.length - 1]?.traceEnd ?? 0;
  return { stages, sequenceDuration };
};

const timeline = buildTimeline();

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

type SandpaperNumeralsContentProps = {
  playing: boolean;
  voiceEnabled: boolean;
  quizLiftIndex: number | null;
  onComplete: () => void;
  onSelect: (index: number) => void;
};

function SandpaperNumeralsContent({
  playing,
  voiceEnabled,
  quizLiftIndex,
  onComplete,
  onSelect,
}: SandpaperNumeralsContentProps) {
  const cardRefs = useRef<THREE.Group[]>([]);
  const cardMeshRefs = useRef<THREE.Mesh[]>([]);
  const textRefs = useRef<THREE.Mesh[]>([]);
  const startTimeRef = useRef<number | null>(null);
  const completedRef = useRef(false);
  const quizLiftRef = useRef<number | null>(null);
  const quizLiftStartRef = useRef<number | null>(null);
  const spokenRef = useRef<Record<number, boolean>>({});

  useEffect(() => {
    quizLiftRef.current = quizLiftIndex;
    if (quizLiftIndex !== null) {
      quizLiftStartRef.current = performance.now() / 1000;
    }
  }, [quizLiftIndex]);

  useFrame((state) => {
    const now = state.clock.getElapsedTime();

    if (!playing) {
      startTimeRef.current = null;
      completedRef.current = false;
      spokenRef.current = {};
      numerals.forEach((_, index) => {
        const card = cardRefs.current[index];
        if (!card) {
          return;
        }
        const offset = stackOffsets[index] ?? stackOffsets[0];
        const position = stackBase.clone().add(offset);
        card.position.copy(position);
        card.rotation.set(0, -0.22, 0);
        card.scale.set(1, 1, 1);
        const text = textRefs.current[index];
        if (text) {
          text.visible = false;
          text.position.set(0, textSurfaceY, 0);
          const material = text.material as THREE.MeshStandardMaterial;
          if (material?.color) {
            material.color.set("#e9e6df");
            material.emissive.set("#e9e6df");
            material.emissiveIntensity = 0;
          }
        }
        const mesh = cardMeshRefs.current[index];
        if (mesh) {
          const material = mesh.material as THREE.MeshStandardMaterial;
          material.emissive.set("#1f7a3c");
          material.emissiveIntensity = 0;
        }
      });
      return;
    }

    if (startTimeRef.current === null) {
      startTimeRef.current = now;
      completedRef.current = false;
    }

    const t = now - (startTimeRef.current ?? 0);
    if (!completedRef.current && t >= timeline.sequenceDuration) {
      completedRef.current = true;
      onComplete();
    }

    const quizLiftIndexValue = quizLiftRef.current;
    const quizLiftStart = quizLiftStartRef.current;
    const quizLiftElapsed =
      quizLiftIndexValue !== null && quizLiftStart !== null
        ? now - quizLiftStart
        : 0;
    const quizLiftValue =
      quizLiftIndexValue !== null && quizLiftElapsed < quizLiftDuration
        ? Math.sin((quizLiftElapsed / quizLiftDuration) * Math.PI) * liftHeight
        : 0;

    numerals.forEach((_, index) => {
      const card = cardRefs.current[index];
      if (!card) {
        return;
      }

      const stage = timeline.stages[index];
      const start = stage?.slideStart ?? 0;
      const end = stage?.slideEnd ?? 0;
      const traceStart = stage?.traceStart ?? 0;
      const traceEnd = stage?.traceEnd ?? 0;
      const offset = stackOffsets[index] ?? stackOffsets[0];
      const stackPosition = stackBase.clone().add(offset);
      const targetPosition = new THREE.Vector3(rowX[index], baseY, rowZ);
      let position = stackPosition;
      let yaw = -0.22;

      if (t >= end) {
        position = targetPosition;
        yaw = 0;
      } else if (t >= start) {
        const progress = clamp01((t - start) / slideDuration);
        const eased = smoothstep(progress);
        position = new THREE.Vector3(
          lerp(stackPosition.x, targetPosition.x, eased),
          baseY,
          lerp(stackPosition.z, targetPosition.z, eased),
        );
        yaw = lerp(-0.22, 0, eased);
      }

      let y = position.y;
      if (quizLiftIndexValue === index) {
        y += quizLiftValue;
      }
      y = Math.max(baseY, y);

      card.position.set(position.x, y, position.z);
      card.rotation.set(0, yaw, 0);
      const scale = quizLiftIndexValue === index ? 1.02 : 1;
      card.scale.set(scale, scale, scale);

      const text = textRefs.current[index];
      if (text) {
        text.visible = t >= end - 0.2;
        const traceActive = t >= traceStart && t <= traceEnd;
        const traceProgress = traceActive
          ? clamp01((t - traceStart) / (traceEnd - traceStart))
          : 0;
        const raiseProgress = clamp01(traceProgress / 0.35);
        const lowerProgress = clamp01((traceProgress - 0.35) / 0.65);
        let textY = textSurfaceY;
        let carved = false;

        if (traceActive) {
          if (traceProgress <= 0.35) {
            textY = lerp(
              textSurfaceY,
              textSurfaceY + textRaise,
              smoothstep(raiseProgress),
            );
          } else {
            textY = lerp(
              textSurfaceY + textRaise,
              textSurfaceY - carveDepth,
              smoothstep(lowerProgress),
            );
          }
          if (voiceEnabled && !spokenRef.current[index]) {
            spokenRef.current[index] = true;
            speakText(numeralWords[index]);
          }
        } else if (t > traceEnd) {
          textY = textSurfaceY - carveDepth;
          carved = true;
        }

        text.position.y = textY;
        const material = text.material as THREE.MeshStandardMaterial;
        if (material?.color) {
          material.color.set(carved ? "#d6d0c4" : "#e9e6df");
          material.emissive.set(material.color);
          material.emissiveIntensity = carved ? 0.15 : 0;
        }
      }

      const mesh = cardMeshRefs.current[index];
      if (mesh) {
        const material = mesh.material as THREE.MeshStandardMaterial;
        material.emissive.set("#1f7a3c");
        material.emissiveIntensity = quizLiftIndexValue === index ? 0.25 : 0;
      }
    });
  });

  return (
    <group>
      <ambientLight intensity={0.6} />
      <directionalLight
        position={[2, 2.4, 1.4]}
        intensity={0.9}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-bias={-0.0002}
        shadow-normalBias={0.01}
        shadow-radius={6}
      />
      <directionalLight position={[-2.4, 2, -1.2]} intensity={0.2} />

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[2.2, 1.7]} />
        <meshStandardMaterial color="#f3e9d8" roughness={0.95} metalness={0.02} />
      </mesh>

      {numerals.map((value, index) => (
        <group
          key={value}
          ref={(el) => {
            if (el) {
              cardRefs.current[index] = el;
            }
          }}
          onPointerDown={(event) => {
            event.stopPropagation();
            onSelect(index);
          }}
        >
          <mesh
            castShadow
            receiveShadow
            ref={(el) => {
              if (el) {
                cardMeshRefs.current[index] = el;
              }
            }}
          >
            <boxGeometry args={[cardSize.width, cardSize.thickness, cardSize.height]} />
            <meshStandardMaterial
              color="#1f7a3c"
              roughness={0.5}
              metalness={0.05}
            />
          </mesh>
          <Text
            ref={(el) => {
              if (el) {
                textRefs.current[index] = el;
              }
            }}
            position={[0, textSurfaceY, 0]}
            rotation={[-Math.PI / 2, 0, 0]}
            fontSize={0.22}
            color="#e9e6df"
            anchorX="center"
            anchorY="middle"
          >
            {value}
          </Text>
        </group>
      ))}
    </group>
  );
}

export default function SandpaperNumeralsScene({
  playing,
  voiceEnabled,
  className,
}: SandpaperNumeralsSceneProps) {
  const [quizIndex, setQuizIndex] = useState<number | null>(null);
  const [quizPhase, setQuizPhase] = useState<QuizPhase>(null);
  const [quizLiftIndex, setQuizLiftIndex] = useState<number | null>(null);
  const quizDoneRef = useRef(false);
  const promptRef = useRef<Record<string, boolean>>({});
  const timeoutRef = useRef<number | null>(null);
  const recognitionRef = useRef<any>(null);
  const awaitingAnswerRef = useRef(false);

  const clickOrder = useMemo(() => [2, 1, 0], []);
  const nameOrder = useMemo(() => [0, 1, 2], []);

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
  }, []);

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

  const handleCardSelect = useCallback(
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
      setQuizLiftIndex(index);
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = window.setTimeout(() => {
        setQuizLiftIndex(null);
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

  useEffect(() => {
    if (!playing) {
      quizDoneRef.current = false;
      promptRef.current = {};
      awaitingAnswerRef.current = false;
      setQuizIndex(null);
      setQuizPhase(null);
      setQuizLiftIndex(null);
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
      speakText(`Can you click on ${numeralWords[currentTarget]}?`);
      return;
    }

    if (quizPhase === "name") {
      awaitingAnswerRef.current = true;
      setQuizLiftIndex(currentTarget);
      speakText("What is this?");
      const advance = () => {
        awaitingAnswerRef.current = false;
        setQuizLiftIndex(null);
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

  const cameraPosition = useMemo(
    () => [0, 1.1, 1.15] as [number, number, number],
    [],
  );

  return (
    <div
      className={`w-full overflow-hidden rounded-[28px] bg-[#f7efe4] ${className ?? "h-[420px]"}`}
    >
      <Canvas shadows camera={{ position: cameraPosition, fov: 34 }}>
        <color attach="background" args={["#f7efe4"]} />
        <SandpaperNumeralsContent
          playing={playing}
          voiceEnabled={voiceEnabled}
          quizLiftIndex={quizLiftIndex}
          onComplete={handleSequenceComplete}
          onSelect={handleCardSelect}
        />
        <OrbitControls
          enablePan={false}
          enableZoom
          maxPolarAngle={Math.PI / 2.1}
          target={[0, 0, 0.2]}
          minAzimuthAngle={-(Math.PI * 65) / 180}
          maxAzimuthAngle={(Math.PI * 65) / 180}
          minDistance={1.6}
          maxDistance={2.6}
        />
      </Canvas>
    </div>
  );
}
