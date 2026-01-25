"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Text } from "@react-three/drei";
import { useMemo, useRef } from "react";
import * as THREE from "three";

type SandpaperNumeralsSceneProps = {
  playing: boolean;
  className?: string;
};

const numerals = ["1", "2", "3"];
const cardSize = { width: 0.36, height: 0.46, depth: 0.03 };
const baseY = cardSize.depth / 2;
const slideDuration = 1.6;
const slideDelay = 0.6;
const stackBase = new THREE.Vector3(-0.72, baseY, -0.45);
const stackOffsets = [
  new THREE.Vector3(0, 0.001, 0),
  new THREE.Vector3(0.05, 0.002, 0.05),
  new THREE.Vector3(0.1, 0.003, 0.1),
];
const rowZ = 0.38;
const rowX = [-0.38, 0, 0.38];

const smoothstep = (t: number) => t * t * (3 - 2 * t);
const clamp01 = (t: number) => Math.min(1, Math.max(0, t));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

function SandpaperNumeralsContent({ playing }: { playing: boolean }) {
  const cardRefs = useRef<THREE.Group[]>([]);
  const textRefs = useRef<THREE.Mesh[]>([]);
  const startTimeRef = useRef<number | null>(null);

  useFrame((state) => {
    const now = state.clock.getElapsedTime();

    if (!playing) {
      startTimeRef.current = null;
      numerals.forEach((_, index) => {
        const card = cardRefs.current[index];
        if (!card) {
          return;
        }
        const offset = stackOffsets[index] ?? stackOffsets[0];
        const position = stackBase.clone().add(offset);
        card.position.copy(position);
        card.rotation.set(-Math.PI / 2, 0, -0.08);
        const text = textRefs.current[index];
        if (text) {
          text.visible = false;
        }
      });
      return;
    }

    if (startTimeRef.current === null) {
      startTimeRef.current = now;
    }

    const t = now - (startTimeRef.current ?? 0);

    numerals.forEach((_, index) => {
      const card = cardRefs.current[index];
      if (!card) {
        return;
      }

      const start = index * (slideDuration + slideDelay);
      const end = start + slideDuration;
      const offset = stackOffsets[index] ?? stackOffsets[0];
      const stackPosition = stackBase.clone().add(offset);
      const targetPosition = new THREE.Vector3(rowX[index], baseY, rowZ);
      let position = stackPosition;
      let tilt = -0.08;

      if (t >= end) {
        position = targetPosition;
        tilt = 0;
      } else if (t >= start) {
        const progress = clamp01((t - start) / slideDuration);
        const eased = smoothstep(progress);
        position = new THREE.Vector3(
          lerp(stackPosition.x, targetPosition.x, eased),
          baseY,
          lerp(stackPosition.z, targetPosition.z, eased),
        );
        tilt = lerp(-0.08, 0, eased);
      }

      card.position.copy(position);
      card.rotation.set(-Math.PI / 2, 0, tilt);

      const text = textRefs.current[index];
      if (text) {
        text.visible = t >= end - 0.2;
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
        >
          <mesh castShadow receiveShadow>
            <boxGeometry args={[cardSize.width, cardSize.depth, cardSize.height]} />
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
            position={[0, cardSize.depth / 2 + 0.002, 0]}
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
  className,
}: SandpaperNumeralsSceneProps) {
  const cameraPosition = useMemo(
    () => [0.2, 0.7, 1.25] as [number, number, number],
    [],
  );

  return (
    <div
      className={`w-full overflow-hidden rounded-[28px] bg-[#f7efe4] ${className ?? "h-[420px]"}`}
    >
      <Canvas shadows camera={{ position: cameraPosition, fov: 36 }}>
        <color attach="background" args={["#f7efe4"]} />
        <SandpaperNumeralsContent playing={playing} />
        <OrbitControls enablePan={false} enableZoom={false} maxPolarAngle={Math.PI / 2.1} />
      </Canvas>
    </div>
  );
}
