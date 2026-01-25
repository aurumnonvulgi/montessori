"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, SoftShadows } from "@react-three/drei";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
type NumberRodsSceneProps = {
  playing: boolean;
  onComplete?: () => void;
  className?: string;
};

type Step = {
  id: string;
  duration: number;
};

const timeScale = 1.2;
const scale = (value: number) => value * timeScale;

const steps: Step[] = [
  { id: "rod1Slide", duration: scale(2) },
  { id: "rod1Lift", duration: scale(1) },
  { id: "rod1Settle", duration: scale(0.6) },
  { id: "rod1Trace", duration: scale(2.2) },
  { id: "rod2Slide", duration: scale(2) },
  { id: "rod2Lift", duration: scale(1) },
  { id: "rod2Settle", duration: scale(0.5) },
  { id: "rod2Seg1", duration: scale(0.9) },
  { id: "rod2Seg2", duration: scale(0.9) },
  { id: "rod2Full", duration: scale(1.3) },
  { id: "rod3Slide", duration: scale(2) },
  { id: "rod3Lift", duration: scale(1) },
  { id: "rod3Settle", duration: scale(0.5) },
  { id: "rod3Seg1", duration: scale(0.9) },
  { id: "rod3Seg2", duration: scale(0.9) },
  { id: "rod3Seg3", duration: scale(0.9) },
  { id: "finalTap", duration: scale(1.1) },
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

function NumberRodsContent({
  playing,
  onComplete,
}: Omit<NumberRodsSceneProps, "className">) {
  const rodRefs = useRef<THREE.Group[]>([]);
  const segmentRefs = useRef<THREE.Mesh[][]>([[], [], []]);
  const startTimeRef = useRef<number | null>(null);
  const completedRef = useRef(false);

  useEffect(() => {
    if (!playing) {
      startTimeRef.current = null;
      completedRef.current = false;
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
      return;
    }

    if (startTimeRef.current === null) {
      startTimeRef.current = now;
      completedRef.current = false;
    }

    const t = now - (startTimeRef.current ?? 0);

    if (!completedRef.current && t >= timeline.total) {
      completedRef.current = true;
      if (onComplete) {
        onComplete();
      }
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
        material.emissive.copy(baseColor);
        material.emissiveIntensity = emissiveIntensity;
      });
    });

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
      <ambientLight intensity={0.6} />
      <directionalLight
        position={[2.2, 2.6, 1.8]}
        intensity={0.9}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-bias={-0.0002}
        shadow-normalBias={0.01}
      />
      <directionalLight position={[-2.6, 2.1, -1.2]} intensity={0.25} />

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[3, 2]} />
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

export default function NumberRodsScene({
  playing,
  onComplete,
  className,
}: NumberRodsSceneProps) {
  return (
    <div
      className={`w-full overflow-hidden rounded-[28px] bg-[#f7efe4] ${className ?? "h-[420px]"}`}
    >
      <Canvas shadows="soft" camera={{ position: [0.8, 0.6, 1.6], fov: 40 }}>
        <color attach="background" args={["#f7efe4"]} />
        <SoftShadows size={6} focus={0.35} samples={18} />
        <NumberRodsContent playing={playing} onComplete={onComplete} />
        <OrbitControls enablePan={false} enableZoom={false} maxPolarAngle={Math.PI / 2.1} />
      </Canvas>
    </div>
  );
}
