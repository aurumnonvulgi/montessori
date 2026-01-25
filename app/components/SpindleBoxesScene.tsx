"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";

type SpindleBoxesSceneProps = {
  playing: boolean;
  voiceEnabled: boolean;
  className?: string;
  onLessonComplete?: () => void;
};

type SpindleStage = {
  start: number;
  end: number;
  target: THREE.Vector3;
};

type VoiceCue = {
  time: number;
  text: string;
};

const numerals = ["0", "1", "2", "3", "4"];
const numeralWords = ["zero", "one", "two", "three", "four"];
const boxSize = { width: 1.65, depth: 0.36, height: 0.08 };
const compartmentCount = 5;
const compartmentWidth = boxSize.width / compartmentCount;
const dividerThickness = 0.012;
const baseY = boxSize.height / 2;
const labelY = boxSize.height + 0.002;
const labelZ = boxSize.depth / 2 - 0.05;
const labelSize = { width: compartmentWidth * 0.55, height: 0.14 };
const labelCanvasSize = 256;
const spindleSize = { radius: 0.018, length: 0.24 };
const basketSize = { width: 0.4, depth: 0.22, height: 0.08 };
const basketPosition = new THREE.Vector3(-0.95, basketSize.height / 2, 0.5);
const spindleLift = 0.02;
const tableSize = { width: 2.8, depth: 1.8 };

const smoothstep = (t: number) => t * t * (3 - 2 * t);
const clamp01 = (t: number) => Math.min(1, Math.max(0, t));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const capitalize = (value: string) =>
  value.length ? value[0].toUpperCase() + value.slice(1) : value;

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
  context.fillStyle = "#1f1c16";
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.font = `700 ${Math.floor(labelCanvasSize * 0.72)}px "Helvetica", "Arial", sans-serif`;
  context.fillText(value, labelCanvasSize / 2, labelCanvasSize / 2);

  const texture = new THREE.CanvasTexture(canvas);
  texture.anisotropy = 4;
  texture.needsUpdate = true;
  return texture;
};

const buildTimeline = (targets: THREE.Vector3[]) => {
  const stages: SpindleStage[] = [];
  const voiceCues: VoiceCue[] = [];
  const introGap = 1.1;
  let cursor = 0.6;

  numerals.forEach((_, index) => {
    const text =
      index === 0 ? "This is zero." : `${capitalize(numeralWords[index])}.`;
    voiceCues.push({ time: cursor, text });
    cursor += introGap;
  });

  cursor += 0.6;
  const moveDuration = 1.1;
  const spindleGap = 0.35;
  const groupPause = 0.5;
  let spindleIndex = 0;

  for (let numeral = 1; numeral <= 4; numeral += 1) {
    voiceCues.push({
      time: cursor,
      text: `${capitalize(numeralWords[numeral])}.`,
    });
    const groupStart = cursor + 0.4;
    for (let count = 1; count <= numeral; count += 1) {
      const start = groupStart + (count - 1) * (moveDuration + spindleGap);
      const end = start + moveDuration;
      const target = targets[spindleIndex];
      stages[spindleIndex] = { start, end, target };
      voiceCues.push({ time: end + 0.05, text: `${capitalize(numeralWords[count])}.` });
      spindleIndex += 1;
    }
    cursor = groupStart + numeral * (moveDuration + spindleGap) + groupPause;
  }

  voiceCues.push({ time: cursor, text: "Zero." });
  cursor += 0.7;
  voiceCues.push({ time: cursor, text: "The basket is empty." });
  cursor += 0.9;
  voiceCues.push({ time: cursor, text: "Zero stands for the empty set." });
  cursor += 1.0;

  return { stages, voiceCues, duration: cursor };
};

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

function SpindleBoxesContent({
  playing,
  voiceEnabled,
  onLessonComplete,
}: Omit<SpindleBoxesSceneProps, "className">) {
  const spindleRefs = useRef<THREE.Mesh[]>([]);
  const startTimeRef = useRef<number | null>(null);
  const completedRef = useRef(false);
  const voiceTimeoutsRef = useRef<number[]>([]);

  const numeralTextures = useMemo(
    () => numerals.map((value) => createNumeralTexture(value)),
    [],
  );

  const compartmentCenters = useMemo(() => {
    return numerals.map((_, index) => {
      const x = -boxSize.width / 2 + compartmentWidth * (index + 0.5);
      return new THREE.Vector3(x, 0, 0);
    });
  }, []);

  const basketOffsets = useMemo(() => {
    return Array.from({ length: 10 }, (_, index) => {
      const row = Math.floor(index / 5);
      const col = index % 5;
      return new THREE.Vector3(
        (col - 2) * 0.055,
        0.02 + row * 0.01,
        (row - 0.5) * 0.06,
      );
    });
  }, []);

  const spindleStarts = useMemo(
    () => basketOffsets.map((offset) => basketPosition.clone().add(offset)),
    [basketOffsets],
  );

  const spindleTargets = useMemo(() => {
    const targets: THREE.Vector3[] = [];
    let spindleIndex = 0;
    for (let numeral = 1; numeral <= 4; numeral += 1) {
      const center = compartmentCenters[numeral];
      for (let i = 0; i < numeral; i += 1) {
        const zOffset = (i - (numeral - 1) / 2) * 0.05;
        targets[spindleIndex] = new THREE.Vector3(center.x, 0.02, center.z + zOffset);
        spindleIndex += 1;
      }
    }
    return targets;
  }, [compartmentCenters]);

  const { stages, voiceCues, duration } = useMemo(
    () => buildTimeline(spindleTargets),
    [spindleTargets],
  );

  useEffect(() => {
    voiceTimeoutsRef.current.forEach((timeoutId) => {
      window.clearTimeout(timeoutId);
    });
    voiceTimeoutsRef.current = [];

    if (!playing || !voiceEnabled) {
      return () => {};
    }

    voiceCues.forEach((cue) => {
      const timeoutId = window.setTimeout(() => {
        speakText(cue.text);
      }, cue.time * 1000);
      voiceTimeoutsRef.current.push(timeoutId);
    });

    return () => {
      voiceTimeoutsRef.current.forEach((timeoutId) => {
        window.clearTimeout(timeoutId);
      });
      voiceTimeoutsRef.current = [];
    };
  }, [playing, voiceEnabled, voiceCues]);

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
      spindleRefs.current.forEach((mesh, index) => {
        const start = spindleStarts[index];
        if (!mesh || !start) {
          return;
        }
        mesh.position.copy(start);
        mesh.rotation.set(0, 0, Math.PI / 2);
      });
      return;
    }

    if (startTimeRef.current === null) {
      startTimeRef.current = now;
      completedRef.current = false;
    }

    const t = now - (startTimeRef.current ?? 0);
    if (!completedRef.current && t >= duration) {
      completedRef.current = true;
      onLessonComplete?.();
    }

    spindleRefs.current.forEach((mesh, index) => {
      if (!mesh) {
        return;
      }
      const start = spindleStarts[index];
      const stage = stages[index];
      if (!start || !stage) {
        mesh.position.copy(start ?? new THREE.Vector3());
        mesh.rotation.set(0, 0, Math.PI / 2);
        return;
      }

      if (t < stage.start) {
        mesh.position.copy(start);
      } else if (t < stage.end) {
        const progress = clamp01((t - stage.start) / (stage.end - stage.start));
        const eased = smoothstep(progress);
        const lifted = Math.sin(progress * Math.PI) * spindleLift;
        mesh.position.set(
          lerp(start.x, stage.target.x, eased),
          lerp(start.y, stage.target.y, eased) + lifted,
          lerp(start.z, stage.target.z, eased),
        );
      } else {
        mesh.position.copy(stage.target);
      }
      mesh.rotation.set(0, 0, Math.PI / 2);
    });
  });

  return (
    <group>
      <ambientLight intensity={0.6} />
      <directionalLight
        position={[2.2, 2.4, 1.6]}
        intensity={0.9}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-bias={-0.0002}
        shadow-normalBias={0.01}
        shadow-radius={6}
      />
      <directionalLight position={[-2.2, 2, -1.2]} intensity={0.2} />

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[tableSize.width, tableSize.depth]} />
        <meshStandardMaterial color="#f3e9d8" roughness={0.95} metalness={0.02} />
      </mesh>

      <group position={[0, baseY, 0]}>
        <mesh castShadow receiveShadow>
          <boxGeometry args={[boxSize.width, boxSize.height, boxSize.depth]} />
          <meshStandardMaterial color="#d7b58d" roughness={0.6} metalness={0.05} />
        </mesh>
        <mesh position={[0, -baseY + 0.004, 0]}>
          <boxGeometry args={[boxSize.width - 0.05, 0.008, boxSize.depth - 0.04]} />
          <meshStandardMaterial color="#efe2cf" roughness={0.9} metalness={0.02} />
        </mesh>
        {Array.from({ length: compartmentCount - 1 }).map((_, index) => {
          const x = -boxSize.width / 2 + compartmentWidth * (index + 1);
          return (
            <mesh key={index} position={[x, 0, 0]} castShadow receiveShadow>
              <boxGeometry
                args={[dividerThickness, boxSize.height, boxSize.depth - 0.02]}
              />
              <meshStandardMaterial
                color="#c9a77e"
                roughness={0.6}
                metalness={0.04}
              />
            </mesh>
          );
        })}
      </group>

      {numerals.map((value, index) => (
        <mesh
          key={value}
          position={[
            compartmentCenters[index].x,
            labelY,
            labelZ,
          ]}
          rotation={[-Math.PI / 2, 0, 0]}
        >
          <planeGeometry args={[labelSize.width, labelSize.height]} />
          <meshStandardMaterial
            color="#1f1c16"
            transparent
            alphaTest={0.1}
            map={numeralTextures[index] ?? null}
          />
        </mesh>
      ))}

      <mesh position={[basketPosition.x, basketPosition.y, basketPosition.z]} castShadow>
        <boxGeometry args={[basketSize.width, basketSize.height, basketSize.depth]} />
        <meshStandardMaterial color="#c48a58" roughness={0.7} metalness={0.05} />
      </mesh>
      <mesh
        position={[basketPosition.x, basketPosition.y + basketSize.height * 0.3, basketPosition.z]}
      >
        <boxGeometry
          args={[basketSize.width - 0.06, basketSize.height * 0.4, basketSize.depth - 0.06]}
        />
        <meshStandardMaterial color="#b9814e" roughness={0.8} metalness={0.02} />
      </mesh>

      {Array.from({ length: 10 }).map((_, index) => (
        <mesh
          key={index}
          ref={(el) => {
            if (el) {
              spindleRefs.current[index] = el;
            }
          }}
          castShadow
          receiveShadow
        >
          <cylinderGeometry
            args={[spindleSize.radius, spindleSize.radius, spindleSize.length, 18]}
          />
          <meshStandardMaterial color="#e6c59a" roughness={0.55} metalness={0.04} />
        </mesh>
      ))}
    </group>
  );
}

export default function SpindleBoxesScene({
  playing,
  voiceEnabled,
  className,
  onLessonComplete,
}: SpindleBoxesSceneProps) {
  const cameraPosition = useMemo(
    () => [0, 1.45, 1.9] as [number, number, number],
    [],
  );

  return (
    <div
      className={`w-full overflow-hidden rounded-[28px] bg-[#f7efe4] ${className ?? "h-[420px]"}`}
    >
      <Canvas shadows camera={{ position: cameraPosition, fov: 28 }}>
        <color attach="background" args={["#f7efe4"]} />
        <SpindleBoxesContent
          playing={playing}
          voiceEnabled={voiceEnabled}
          onLessonComplete={onLessonComplete}
        />
        <OrbitControls
          enablePan={false}
          enableZoom
          maxPolarAngle={Math.PI / 2.1}
          target={[0, 0, 0.25]}
          minAzimuthAngle={-(Math.PI * 65) / 180}
          maxAzimuthAngle={(Math.PI * 65) / 180}
          minDistance={2.2}
          maxDistance={3.8}
        />
      </Canvas>
    </div>
  );
}
