"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { playChime } from "../lib/sounds";
import { primeSpeechVoices, speakWithPreferredVoice } from "../lib/speech";

type SandpaperNumeralsSceneProps = {
  playing: boolean;
  voiceEnabled: boolean;
  className?: string;
  onLessonComplete?: () => void;
  isMobile?: boolean;
};

type QuizPhase = "click" | "name" | null;

const numerals = ["1", "2", "3"];
const numeralWords = ["one", "two", "three"];
const cardSize = { width: 0.36, height: 0.46, thickness: 0.03 };
const baseY = cardSize.thickness / 2;
const flipDuration = 0.8; // Duration for card to flip
const travelDuration = 1.6; // Duration for card to travel to position
const slideDelay = 2.2; // Delay after card lands and name is spoken before next card
const introHighlightDuration = 1.2; // Duration of the yellow highlight after landing
const introLiftHeight = 0.03; // How much the numeral lifts during intro (doubled)
const arcHeight = 0.25; // How high cards lift during travel
const quizLiftDuration = 2.6;
const liftHeight = 0.05;
const stackBase = new THREE.Vector3(-0.55, baseY, -0.35);
// Stack order: 3 on bottom, 2 middle, 1 on top (reversed from index)
const stackOffsets = [
  new THREE.Vector3(0, cardSize.thickness * 2, 0),    // Card 1 on top
  new THREE.Vector3(0, cardSize.thickness, 0),        // Card 2 in middle
  new THREE.Vector3(0, 0, 0),                         // Card 3 on bottom
];
const rowZ = 0.42;
const rowX = [-0.48, 0, 0.48];
const rowZOffsets = [0.02, 0, -0.02];
const textSurfaceY = cardSize.thickness / 2 + 0.002;
const labelSize = {
  width: cardSize.width * 0.54,
  height: cardSize.height * 0.7,
};
const labelCanvasSize = 256;

const createNumeralTexture = (value: string) => {
  if (typeof document === "undefined") {
    return null;
  }
  const canvas = document.createElement("canvas");
  canvas.width = labelCanvasSize;
  canvas.height = labelCanvasSize;
  const context = canvas.getContext("2d");
  if (!context) {
    return null;
  }

  context.clearRect(0, 0, labelCanvasSize, labelCanvasSize);
  context.fillStyle = "#ffffff";
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.font = `700 ${Math.floor(labelCanvasSize * 0.88)}px "Helvetica", "Arial", sans-serif`;
  context.fillText(value, labelCanvasSize / 2, labelCanvasSize / 2);

  const texture = new THREE.CanvasTexture(canvas);
  texture.anisotropy = 4;
  texture.needsUpdate = true;
  return texture;
};

const smoothstep = (t: number) => t * t * (3 - 2 * t);
const clamp01 = (t: number) => Math.min(1, Math.max(0, t));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

const buildTimeline = () => {
  let cursor = 0;
  const stages = numerals.map(() => {
    const flipStart = cursor;
    const flipEnd = flipStart + flipDuration;
    const travelStart = flipEnd;
    const travelEnd = travelStart + travelDuration;
    cursor = travelEnd + slideDelay;
    return { flipStart, flipEnd, travelStart, travelEnd };
  });
  const sequenceDuration = stages[stages.length - 1]?.travelEnd ?? 0;
  return { stages, sequenceDuration };
};

const timeline = buildTimeline();

const speakText = (text: string) => {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) {
    return;
  }
  speakWithPreferredVoice(text, { rate: 0.85, pitch: 0.95, volume: 0.8 });
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
  const introTimeoutsRef = useRef<number[]>([]);
  const numeralTextures = useMemo(
    () => numerals.map((value) => createNumeralTexture(value)),
    [],
  );

  useEffect(() => {
    quizLiftRef.current = quizLiftIndex;
    if (quizLiftIndex !== null) {
      quizLiftStartRef.current = performance.now() / 1000;
    }
  }, [quizLiftIndex]);

  useEffect(() => {
    introTimeoutsRef.current.forEach((timeoutId) => {
      window.clearTimeout(timeoutId);
    });
    introTimeoutsRef.current = [];

    if (!playing || !voiceEnabled) {
      return () => {};
    }

    timeline.stages.forEach((stage, index) => {
      const delayMs = (stage.travelEnd ?? 0) * 1000 + 150;
      const timeoutId = window.setTimeout(() => {
        speakText(numeralWords[index]);
      }, delayMs);
      introTimeoutsRef.current.push(timeoutId);
    });

    return () => {
      introTimeoutsRef.current.forEach((timeoutId) => {
        window.clearTimeout(timeoutId);
      });
      introTimeoutsRef.current = [];
    };
  }, [playing, voiceEnabled]);

  useEffect(() => {
    return () => {
      numeralTextures.forEach((texture) => texture?.dispose());
    };
  }, [numeralTextures]);

  useFrame((state) => {
    const now = state.clock.getElapsedTime();

    if (!playing) {
      startTimeRef.current = null;
      completedRef.current = false;
      numerals.forEach((_, index) => {
        const card = cardRefs.current[index];
        if (!card) {
          return;
        }
        const offset = stackOffsets[index] ?? stackOffsets[0];
        const position = stackBase.clone().add(offset);
        card.position.copy(position);
        // Cards start face-down (flipped on X axis)
        card.rotation.set(Math.PI, 0, 0);
        card.scale.set(1, 1, 1);
        const text = textRefs.current[index];
        if (text) {
          text.visible = true; // Always visible - 3D rotation handles visibility
          text.position.set(0, textSurfaceY, 0);
          const material = text.material as THREE.MeshStandardMaterial;
          if (material?.color) {
            material.color.set("#ffffff");
            material.emissive.set("#ffffff");
            material.emissiveIntensity = 0.2;
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
      const flipStart = stage?.flipStart ?? 0;
      const flipEnd = stage?.flipEnd ?? 0;
      const travelStart = stage?.travelStart ?? 0;
      const travelEnd = stage?.travelEnd ?? 0;
      const offset = stackOffsets[index] ?? stackOffsets[0];
      const stackPosition = stackBase.clone().add(offset);
      const targetPosition = new THREE.Vector3(
        rowX[index],
        baseY,
        rowZ + (rowZOffsets[index] ?? 0),
      );

      let posX = stackPosition.x;
      let posY = stackPosition.y;
      let posZ = stackPosition.z;
      let rotX = Math.PI; // Face-down

      // Phase 1: Flip (rotate from face-down to face-up while staying in place)
      if (t >= flipStart && t < flipEnd) {
        const flipProgress = smoothstep(clamp01((t - flipStart) / flipDuration));
        rotX = lerp(Math.PI, 0, flipProgress);
        // Slight lift during flip
        posY = stackPosition.y + Math.sin(flipProgress * Math.PI) * 0.1;
      }
      // Phase 2: Travel with arc motion
      else if (t >= travelStart && t < travelEnd) {
        rotX = 0; // Fully face-up
        const travelProgress = smoothstep(clamp01((t - travelStart) / travelDuration));
        posX = lerp(stackPosition.x, targetPosition.x, travelProgress);
        posZ = lerp(stackPosition.z, targetPosition.z, travelProgress);
        // Arc motion: lift up in the middle, land at the end
        const arc = 4 * travelProgress * (1 - travelProgress);
        posY = lerp(stackPosition.y, targetPosition.y, travelProgress) + arc * arcHeight;
      }
      // Phase 3: At final position
      else if (t >= travelEnd) {
        rotX = 0;
        posX = targetPosition.x;
        posY = targetPosition.y;
        posZ = targetPosition.z;
      }

      // Apply quiz lift if active
      if (quizLiftIndexValue === index) {
        posY += quizLiftValue;
      }
      posY = Math.max(baseY, posY);

      card.position.set(posX, posY, posZ);
      card.rotation.set(rotX, 0, 0);
      const scale = quizLiftIndexValue === index ? 1.02 : 1;
      card.scale.set(scale, scale, scale);

      const text = textRefs.current[index];
      if (text) {
        // Text always visible - 3D rotation handles showing/hiding as card flips
        text.visible = true;

        // Intro highlight animation: after card lands, pop numeral up and color yellow
        const introStart = travelEnd;
        const introEnd = travelEnd + introHighlightDuration;
        const inIntro = t >= introStart && t < introEnd;
        const introProgress = inIntro ? clamp01((t - introStart) / introHighlightDuration) : 0;

        // Smooth arc for lift: up then down
        const introLift = inIntro ? Math.sin(introProgress * Math.PI) * introLiftHeight : 0;
        text.position.y = textSurfaceY + introLift;

        const material = text.material as THREE.MeshStandardMaterial;
        if (material?.color) {
          if (inIntro) {
            // Bright yellow #F0CE02 during intro
            // F0CE02 in normalized RGB: (240/255, 206/255, 2/255) = (0.94, 0.81, 0.008)
            const yellowIntensity = Math.sin(introProgress * Math.PI); // 0 -> 1 -> 0
            const r = lerp(1, 0.94, yellowIntensity);
            const g = lerp(1, 0.81, yellowIntensity);
            const b = lerp(1, 0.008, yellowIntensity);
            material.color.setRGB(r, g, b);
            material.emissive.setRGB(r, g, b);
            material.emissiveIntensity = 0.3 + yellowIntensity * 0.6;
          } else {
            material.color.set("#ffffff");
            material.emissive.set("#ffffff");
            material.emissiveIntensity = 0.2;
          }
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
      <ambientLight intensity={0.7} />
      <directionalLight
        position={[2, 2.4, 1.4]}
        intensity={0.7}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-bias={-0.0001}
        shadow-normalBias={0.02}
        shadow-radius={12}
      />
      <directionalLight position={[-2.4, 2, -1.2]} intensity={0.3} />

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[2.6, 1.9]} />
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
          <mesh
            ref={(el) => {
              if (el) {
                textRefs.current[index] = el;
              }
            }}
            position={[0, textSurfaceY, 0]}
            rotation={[-Math.PI / 2, 0, 0]}
          >
            <planeGeometry args={[labelSize.width, labelSize.height]} />
            <meshStandardMaterial
              color="#ffffff"
              emissive="#ffffff"
              emissiveIntensity={0.2}
              transparent
              alphaTest={0.1}
              map={numeralTextures[index] ?? null}
            />
          </mesh>
        </group>
      ))}
    </group>
  );
}

export default function SandpaperNumeralsScene({
  playing,
  voiceEnabled,
  className,
  onLessonComplete,
  isMobile = false,
}: SandpaperNumeralsSceneProps) {
  useEffect(() => {
    primeSpeechVoices();
  }, []);

  const [quizIndex, setQuizIndex] = useState<number | null>(null);
  const [quizPhase, setQuizPhase] = useState<QuizPhase>(null);
  const [quizLiftIndex, setQuizLiftIndex] = useState<number | null>(null);
  const quizDoneRef = useRef(false);
  const lessonCompleteRef = useRef(false);
  const promptRef = useRef<Record<string, boolean>>({});
  const timeoutRef = useRef<number | null>(null);
  const quizStartTimerRef = useRef<number | null>(null);
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
      if (quizStartTimerRef.current) {
        window.clearTimeout(quizStartTimerRef.current);
      }
      quizStartTimerRef.current = window.setTimeout(() => {
        setQuizPhase("click");
        setQuizIndex(0);
      }, 600);
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
      lessonCompleteRef.current = false;
      promptRef.current = {};
      awaitingAnswerRef.current = false;
      setQuizIndex(null);
      setQuizPhase(null);
      setQuizLiftIndex(null);
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      if (quizStartTimerRef.current) {
        window.clearTimeout(quizStartTimerRef.current);
        quizStartTimerRef.current = null;
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
      // Stop recognition when quiz phase ends
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {
          // ignore
        }
        recognitionRef.current = null;
      }
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
            if (!lessonCompleteRef.current) {
              lessonCompleteRef.current = true;
              onLessonComplete?.();
            }
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
  }, [
    currentTarget,
    quizPhase,
    startRecognition,
    voiceEnabled,
    nameOrder.length,
    onLessonComplete,
  ]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
      }
      if (quizStartTimerRef.current) {
        window.clearTimeout(quizStartTimerRef.current);
        quizStartTimerRef.current = null;
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

  // Mobile: zoom out more, lower camera angle to show full cards
  const cameraPosition = useMemo(
    () => (isMobile
      ? [0, 0.9, 1.6] as [number, number, number]  // Mobile: lower Y, pull back
      : [0, 1.35, 1.75] as [number, number, number]  // Desktop
    ),
    [isMobile],
  );

  const cameraFov = isMobile ? 45 : 28; // Wider FOV on mobile
  const orbitTarget: [number, number, number] = isMobile ? [0, 0, 0.15] : [0, 0, 0.3];

  return (
    <div
      className={`w-full overflow-hidden ${isMobile ? "" : "rounded-[28px]"} bg-[#f7efe4] ${className ?? "h-[420px]"}`}
    >
      <Canvas shadows camera={{ position: cameraPosition, fov: cameraFov }}>
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
          target={orbitTarget}
          minAzimuthAngle={-Math.PI / 4}
          maxAzimuthAngle={Math.PI / 4}
          minDistance={2.2}
          maxDistance={3.6}
        />
      </Canvas>
    </div>
  );
}
