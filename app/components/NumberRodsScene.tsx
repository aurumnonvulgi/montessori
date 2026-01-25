"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { playChime } from "../lib/sounds";

type NumberRodsSceneProps = {
  playing: boolean;
  voiceEnabled: boolean;
  onComplete?: () => void;
};

type Step = {
  id: string;
  duration: number;
};

const steps: Step[] = [
  { id: "rod1Slide", duration: 2 },
  { id: "rod1Lift", duration: 1 },
  { id: "rod1Settle", duration: 0.6 },
  { id: "rod1Trace", duration: 2.2 },
  { id: "rod2Slide", duration: 2 },
  { id: "rod2Lift", duration: 1 },
  { id: "rod2Settle", duration: 0.5 },
  { id: "rod2Seg1", duration: 0.9 },
  { id: "rod2Seg2", duration: 0.9 },
  { id: "rod2Full", duration: 1.3 },
  { id: "rod3Slide", duration: 2 },
  { id: "rod3Lift", duration: 1 },
  { id: "rod3Settle", duration: 0.5 },
  { id: "rod3Seg1", duration: 0.9 },
  { id: "rod3Seg2", duration: 0.9 },
  { id: "rod3Seg3", duration: 0.9 },
  { id: "finalTap", duration: 1.1 },
];

const segmentLength = 0.2;
const rodHeight = 0.04;
const rodDepth = 0.05;
const liftHeight = 0.02;
const maxSegments = 3;
const maxLength = segmentLength * maxSegments;
const leftEdge = -maxLength / 2;
const slideStartX = leftEdge - maxLength - 0.6;
const rodZ = [0.16, 0, -0.16];
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

const voiceCues = [
  { id: "rod1Trace", text: "this is one" },
  { id: "rod2Seg1", text: "one" },
  { id: "rod2Seg2", text: "two" },
  { id: "rod2Full", text: "this is two" },
  { id: "rod3Seg1", text: "one" },
  { id: "rod3Seg2", text: "two" },
  { id: "rod3Seg3", text: "three" },
];

function NumberRodsContent({ playing, voiceEnabled, onComplete }: NumberRodsSceneProps) {
  const rodRefs = useRef<THREE.Group[]>([]);
  const segmentRefs = useRef<THREE.Mesh[][]>([[], [], []]);
  const fingerRef = useRef<THREE.Group | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const spokenRef = useRef<Record<string, boolean>>({});
  const chimeRef = useRef(false);
  const completedRef = useRef(false);

  useEffect(() => {
    if (!playing) {
      startTimeRef.current = null;
      spokenRef.current = {};
      chimeRef.current = false;
      completedRef.current = false;
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    }
  }, [playing]);

  useFrame((state) => {
    const now = state.clock.getElapsedTime();

    if (!playing) {
      const rodLengths = [1, 2, 3].map((count) => segmentLength * count);
      rodLengths.forEach((length, index) => {
        const rod = rodRefs.current[index];
        if (!rod) {
          return;
        }
        const finalX = leftEdge + length / 2;
        rod.position.set(finalX, baseY, rodZ[index]);
        rod.visible = true;
      });
      if (fingerRef.current) {
        fingerRef.current.visible = false;
      }
      return;
    }

    if (startTimeRef.current === null) {
      startTimeRef.current = now;
      spokenRef.current = {};
      chimeRef.current = false;
      completedRef.current = false;
    }

    const t = now - (startTimeRef.current ?? 0);

    if (!completedRef.current && t >= timeline.total) {
      completedRef.current = true;
      if (onComplete) {
        onComplete();
      }
    }

    if (!chimeRef.current && t >= timeline.map.finalTap.start) {
      chimeRef.current = true;
      playChime();
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

    const rodLengths = [1, 2, 3].map((count) => segmentLength * count);
    const glowPulse =
      t >= timeline.map.finalTap.start && t <= timeline.map.finalTap.end
        ? 0.4 + 0.25 * Math.sin(now * 6)
        : 0;

    rodLengths.forEach((length, index) => {
      const rod = rodRefs.current[index];
      if (!rod) {
        return;
      }

      const slideKey = `rod${index + 1}Slide`;
      const liftKey = `rod${index + 1}Lift`;
      const settleKey = `rod${index + 1}Settle`;
      const slideRange = timeline.map[slideKey];
      const liftRange = timeline.map[liftKey];
      const settleRange = timeline.map[settleKey];
      const finalX = leftEdge + length / 2;

      let x = slideStartX;
      if (t >= slideRange.end) {
        x = finalX;
      } else if (t >= slideRange.start) {
        const progress = clamp01((t - slideRange.start) / (slideRange.end - slideRange.start));
        x = lerp(slideStartX, finalX, smoothstep(progress));
      }

      let y = baseY;
      if (t >= liftRange.start && t <= liftRange.end) {
        const progress = clamp01((t - liftRange.start) / (liftRange.end - liftRange.start));
        y = baseY + liftHeight * smoothstep(progress);
      } else if (t >= settleRange.start && t <= settleRange.end) {
        const progress = clamp01((t - settleRange.start) / (settleRange.end - settleRange.start));
        y = baseY + liftHeight * (1 - smoothstep(progress));
      }

      const glowUp =
        t >= liftRange.start && t <= liftRange.end
          ? 0.65
          : t >= settleRange.start && t <= settleRange.end
            ? 0.65 * (1 - clamp01((t - settleRange.start) / (settleRange.end - settleRange.start)))
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
        const segmentHighlight =
          (index === 1 &&
            ((t >= timeline.map.rod2Seg1.start && t <= timeline.map.rod2Seg1.end && segmentIndex === 0) ||
              (t >= timeline.map.rod2Seg2.start && t <= timeline.map.rod2Seg2.end && segmentIndex === 1))) ||
          (index === 2 &&
            ((t >= timeline.map.rod3Seg1.start && t <= timeline.map.rod3Seg1.end && segmentIndex === 0) ||
              (t >= timeline.map.rod3Seg2.start && t <= timeline.map.rod3Seg2.end && segmentIndex === 1) ||
              (t >= timeline.map.rod3Seg3.start && t <= timeline.map.rod3Seg3.end && segmentIndex === 2)));

        const segmentPulse = segmentHighlight ? 0.6 + 0.25 * Math.sin(now * 6) : 0;
        const emissiveIntensity = Math.max(glowUp, glowPulse, segmentPulse);
        if (segmentPulse > 0) {
          material.emissive.copy(baseColor);
        } else {
          material.emissive.set("#f7d27d");
        }
        material.emissiveIntensity = emissiveIntensity;
      });
    });

    if (fingerRef.current) {
      const finger = fingerRef.current;
      let visible = false;
      let fx = leftEdge;
      let fz = rodZ[0];
      let fy = baseY + rodHeight + 0.04;

      if (t >= timeline.map.rod1Trace.start && t <= timeline.map.rod1Trace.end) {
        const progress = clamp01((t - timeline.map.rod1Trace.start) / (timeline.map.rod1Trace.end - timeline.map.rod1Trace.start));
        fx = leftEdge + progress * rodLengths[0];
        fz = rodZ[0];
        visible = true;
      } else if (t >= timeline.map.rod2Seg1.start && t <= timeline.map.rod2Seg1.end) {
        fx = leftEdge + segmentLength * 0.5;
        fz = rodZ[1];
        visible = true;
      } else if (t >= timeline.map.rod2Seg2.start && t <= timeline.map.rod2Seg2.end) {
        fx = leftEdge + segmentLength * 1.5;
        fz = rodZ[1];
        visible = true;
      } else if (t >= timeline.map.rod2Full.start && t <= timeline.map.rod2Full.end) {
        const progress = clamp01((t - timeline.map.rod2Full.start) / (timeline.map.rod2Full.end - timeline.map.rod2Full.start));
        fx = leftEdge + progress * rodLengths[1];
        fz = rodZ[1];
        visible = true;
      } else if (t >= timeline.map.rod3Seg1.start && t <= timeline.map.rod3Seg1.end) {
        fx = leftEdge + segmentLength * 0.5;
        fz = rodZ[2];
        visible = true;
      } else if (t >= timeline.map.rod3Seg2.start && t <= timeline.map.rod3Seg2.end) {
        fx = leftEdge + segmentLength * 1.5;
        fz = rodZ[2];
        visible = true;
      } else if (t >= timeline.map.rod3Seg3.start && t <= timeline.map.rod3Seg3.end) {
        fx = leftEdge + segmentLength * 2.5;
        fz = rodZ[2];
        visible = true;
      } else if (t >= timeline.map.finalTap.start && t <= timeline.map.finalTap.end) {
        fx = leftEdge + segmentLength * 2.5;
        fz = rodZ[2];
        visible = true;
      }

      finger.visible = visible;
      finger.position.set(fx, fy, fz + 0.02);
    }
  });

  const rods = useMemo(
    () => [
      { segments: 1, label: "one" },
      { segments: 2, label: "two" },
      { segments: 3, label: "three" },
    ],
    [],
  );

  const rodColors = ["#3d7dd9", "#d95a4e"]; // blue, red

  return (
    <group>
      <ambientLight intensity={0.55} />
      <directionalLight position={[2.2, 2.6, 1.8]} intensity={1.1} castShadow />
      <directionalLight position={[-2.6, 2.1, -1.2]} intensity={0.35} />

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[3, 2]} />
        <meshStandardMaterial color="#f1e5d1" roughness={0.9} metalness={0.05} />
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
                    emissive="#f7d27d"
                    emissiveIntensity={0}
                  />
                </mesh>
              );
            })}
          </group>
        );
      })}

      <group ref={fingerRef}>
        <mesh position={[0, 0, 0]} castShadow>
          <sphereGeometry args={[0.03, 20, 20]} />
          <meshStandardMaterial color="#f2c9a0" roughness={0.4} />
        </mesh>
        <mesh position={[-0.05, 0, 0]}>
          <capsuleGeometry args={[0.015, 0.1, 6, 12]} />
          <meshStandardMaterial color="#f2c9a0" roughness={0.4} />
        </mesh>
      </group>
    </group>
  );
}

export default function NumberRodsScene({ playing, voiceEnabled, onComplete }: NumberRodsSceneProps) {
  return (
    <div className="h-[420px] w-full overflow-hidden rounded-[28px] bg-[#f7efe4]">
      <Canvas shadows camera={{ position: [0.8, 0.6, 1.6], fov: 40 }}>
        <color attach="background" args={["#f7efe4"]} />
        <NumberRodsContent playing={playing} voiceEnabled={voiceEnabled} onComplete={onComplete} />
        <OrbitControls enablePan={false} enableZoom={false} maxPolarAngle={Math.PI / 2.1} />
      </Canvas>
    </div>
  );
}
