"use client";

import { Canvas, ThreeEvent } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { useCallback, useEffect, useRef, useState } from "react";
import { playChime } from "../lib/sounds";

export type ShortBeadStairPhase = "idle" | "placement" | "count" | "rebuild";

type Point3 = {
  x: number;
  y: number;
  z: number;
};

type ShortBeadStairSceneProps = {
  phase: ShortBeadStairPhase;
  hintVisible: boolean;
  className?: string;
  onPhaseComplete: (phase: ShortBeadStairPhase) => void;
  onCountingTargetChange?: (target: number) => void;
};

const BEAD_CONFIG = [
  { number: 1, beadCount: 1, color: "#ef4444" },
  { number: 2, beadCount: 2, color: "#16a34a" },
  { number: 3, beadCount: 3, color: "#ec4899" },
  { number: 4, beadCount: 4, color: "#facc15" },
  { number: 5, beadCount: 5, color: "#38bdf8" },
  { number: 6, beadCount: 6, color: "#a855f7" },
  { number: 7, beadCount: 7, color: "#f8fafc" },
  { number: 8, beadCount: 8, color: "#7c2d12" },
  { number: 9, beadCount: 9, color: "#1e3a8a" },
];

const TARGET_BASE_X = -0.65;
const TARGET_START_Z = 0.45;
const TARGET_STEP_Z = 0.14;
const PILE_X = 0.8;
const PILE_Z = 0.35;
const PILE_GAP = 0.12;
const BEAD_RADIUS = 0.05;
const BEAD_SPACING = 0.085;
const SNAP_THRESHOLD = 0.28;

const TARGET_POSITIONS: Point3[] = BEAD_CONFIG.map((_, index) => ({
  x: TARGET_BASE_X,
  y: 0.03,
  z: TARGET_START_Z - index * TARGET_STEP_Z,
}));

const createPileLayout = () =>
  BEAD_CONFIG.map((bar, index) => ({
    ...bar,
    position: { x: PILE_X, y: 0.03, z: PILE_Z - index * PILE_GAP },
    rotationY: -0.45,
    onMat: false,
  }));

const createMixedLayout = () =>
  BEAD_CONFIG.map((bar) => ({
    ...bar,
    position: {
      x: 0.35 + Math.random() * 0.5,
      y: 0.03,
      z: -0.4 + Math.random() * 0.9,
    },
    rotationY: -0.35 + Math.random() * 0.5,
    onMat: false,
  }));

const randomRestPosition = () => ({
  x: 0.45 + Math.random() * 0.25,
  y: 0.03,
  z: -0.1 + Math.random() * 0.6,
});

type BarState = {
  number: number;
  beadCount: number;
  color: string;
  position: Point3;
  rotationY: number;
  onMat: boolean;
};

type DragState = {
  barNumber: number;
  pointerOffset: Point3;
};

const wireDepth = 0.02;
const wireColor = "#a8a29e";

export default function ShortBeadStairScene({
  phase,
  hintVisible,
  className,
  onPhaseComplete,
  onCountingTargetChange,
}: ShortBeadStairSceneProps) {
  const [bars, setBars] = useState<BarState[]>(() => createPileLayout());
  const [placedCount, setPlacedCount] = useState(0);
  const [dragState, setDragState] = useState<DragState | null>(null);
  const [hintMessage, setHintMessage] = useState<string | null>(null);
  const [countTarget, setCountTarget] = useState(1);
  const [countProgress, setCountProgress] = useState<Record<number, number>>({});
  const phaseCompleteRef = useRef(false);
  const hintTimeoutRef = useRef<number | null>(null);

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    setBars(phase === "rebuild" ? createMixedLayout() : createPileLayout());
    setPlacedCount(0);
    setDragState(null);
    phaseCompleteRef.current = false;
    setHintMessage(null);
    setCountProgress({});
    setCountTarget(1);
  }, [phase]);
  /* eslint-enable react-hooks/set-state-in-effect */

  useEffect(() => {
    if (phase === "count") {
      onCountingTargetChange?.(countTarget);
    }
  }, [countTarget, onCountingTargetChange, phase]);

  useEffect(() => {
    return () => {
      if (hintTimeoutRef.current) {
        window.clearTimeout(hintTimeoutRef.current);
      }
    };
  }, []);

  const showHint = useCallback((message: string) => {
    setHintMessage(message);
    if (hintTimeoutRef.current) {
      window.clearTimeout(hintTimeoutRef.current);
    }
    hintTimeoutRef.current = window.setTimeout(() => {
      setHintMessage(null);
    }, 1800);
  }, []);

  const handleDragMove = useCallback((event: ThreeEvent<PointerEvent>) => {
    if (!dragState) {
      return;
    }
    event.stopPropagation();
    const point = event.point;
    setBars((prev) =>
      prev.map((bar) =>
        bar.number === dragState.barNumber
          ? {
              ...bar,
              position: {
                x: point.x - dragState.pointerOffset.x,
                y: Math.max(0.02, point.y - dragState.pointerOffset.y),
                z: point.z - dragState.pointerOffset.z,
              },
            }
          : bar,
      ),
    );
  }, [dragState]);

  const handleDrop = useCallback(
    (barNumber: number, dropPosition: Point3) => {
      if (phase !== "placement" && phase !== "rebuild") {
        return;
      }
      const expectedNumber = placedCount + 1;
      const isCorrect = barNumber === expectedNumber;
      const targetIndex = placedCount;
      const targetPoint = TARGET_POSITIONS[targetIndex];
      const delta = Math.hypot(dropPosition.x - targetPoint.x, dropPosition.z - targetPoint.z);

      setBars((prev) =>
        prev.map((bar) => {
          if (bar.number !== barNumber) {
            return bar;
          }
          if (isCorrect && delta < SNAP_THRESHOLD) {
            return {
              ...bar,
              position: { ...targetPoint },
              rotationY: 0,
              onMat: true,
            };
          }
          return {
            ...bar,
            position: randomRestPosition(),
            rotationY: -0.35 + Math.random() * 0.5,
          };
        }),
      );

      if (!isCorrect || delta >= SNAP_THRESHOLD) {
        showHint("Try the next quantity.");
        return;
      }

      playChime();
      setPlacedCount((prev) => {
        const next = prev + 1;
        if (next >= BEAD_CONFIG.length && !phaseCompleteRef.current) {
          phaseCompleteRef.current = true;
          window.setTimeout(() => onPhaseComplete(phase), 600);
        }
        return next;
      });
    },
    [phase, onPhaseComplete, placedCount, showHint],
  );

  const handlePointerDown = useCallback(
    (event: ThreeEvent<PointerEvent>, bar: BarState) => {
      if (phase !== "placement" && phase !== "rebuild") {
        return;
      }
      event.stopPropagation();
      const point = event.point;
      const offset = {
        x: point.x - bar.position.x,
        y: point.y - bar.position.y,
        z: point.z - bar.position.z,
      };
      const pointerTarget = event.target as Element & {
        setPointerCapture?: (pointerId: number) => void;
      };
      pointerTarget.setPointerCapture?.(event.pointerId);
      setDragState({ barNumber: bar.number, pointerOffset: offset });
    },
    [phase],
  );

  const handlePointerUp = useCallback(
    (event: ThreeEvent<PointerEvent>, bar: BarState) => {
      if (dragState?.barNumber !== bar.number) {
        const pointerTarget = event.target as Element & {
          releasePointerCapture?: (pointerId: number) => void;
        };
        pointerTarget.releasePointerCapture?.(event.pointerId);
        return;
      }
      event.stopPropagation();
      const pointerTarget = event.target as Element & {
        releasePointerCapture?: (pointerId: number) => void;
      };
      pointerTarget.releasePointerCapture?.(event.pointerId);
      handleDrop(bar.number, event.point);
      setDragState(null);
    },
    [dragState, handleDrop],
  );

  const handleBeadCount = useCallback(
    (barNumber: number) => {
      if (phase !== "count" || barNumber !== countTarget) {
        return;
      }
      setCountProgress((prev) => {
        const current = prev[barNumber] ?? 0;
        if (current >= barNumber) {
          return prev;
        }
        const updated = { ...prev, [barNumber]: current + 1 };
        if (current + 1 === barNumber) {
          const nextTarget = barNumber + 1;
          if (nextTarget > BEAD_CONFIG.length) {
            if (!phaseCompleteRef.current) {
              phaseCompleteRef.current = true;
              window.setTimeout(() => onPhaseComplete("count"), 500);
            }
          } else {
            setCountTarget(nextTarget);
          }
        }
        return updated;
      });
    },
    [phase, countTarget, onPhaseComplete],
  );

  return (
    <div className={`relative h-full w-full ${className ?? ""}`}>
      {hintMessage ? (
        <div className="pointer-events-none absolute left-1/2 top-4 -translate-x-1/2 rounded-full bg-stone-900/80 px-5 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-white">
          {hintMessage}
        </div>
      ) : null}
      <Canvas shadows camera={{ position: [0, 1.2, 1.4], fov: 36 }} onPointerMove={handleDragMove}>
        <color attach="background" args={["#f7efe4"]} />
        <ambientLight intensity={0.6} />
        <directionalLight position={[2, 2.5, 1]} intensity={0.85} castShadow />
        <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <planeGeometry args={[2.6, 1.8]} />
          <meshStandardMaterial metalness={0} roughness={1} color="#f2e8d7" />
        </mesh>
        {phase !== "count" && hintVisible && placedCount < TARGET_POSITIONS.length ? (
          <mesh position={[TARGET_POSITIONS[placedCount].x, 0.01, TARGET_POSITIONS[placedCount].z]}>
            <boxGeometry args={[0.42, 0.01, 0.12]} />
            <meshStandardMaterial color="#fde68a" transparent opacity={0.5} />
          </mesh>
        ) : null}
        <group>
          {bars.map((bar) => (
            <group
              key={bar.number}
              position={[bar.position.x, bar.position.y, bar.position.z]}
              rotation={[0, bar.rotationY, 0]}
              onPointerDown={(event) => handlePointerDown(event, bar)}
              onPointerUp={(event) => handlePointerUp(event, bar)}
              castShadow
            >
              <mesh castShadow>
                <boxGeometry args={[0.9, 0.01, 0.12]} />
                <meshStandardMaterial color="transparent" />
              </mesh>
              <group position={[0, 0, 0]}>
                <mesh>
                  <cylinderGeometry args={[wireDepth, wireDepth, 0.12, 12]} />
                  <meshStandardMaterial color={wireColor} metalness={0.2} roughness={0.8} />
                </mesh>
                <group position={[-0.35, 0, 0]}>
                  {Array.from({ length: bar.beadCount }).map((_, beadIndex) => {
                    const beadIsActive = phase === "count" && bar.number === countTarget && (countProgress[bar.number] ?? 0) > beadIndex;
                    return (
                      <mesh
                        key={`${bar.number}-${beadIndex}`}
                        position={[beadIndex * BEAD_SPACING, 0, 0]}
                        onPointerDown={() => handleBeadCount(bar.number)}
                      >
                        <sphereGeometry args={[BEAD_RADIUS, 32, 32]} />
                        <meshStandardMaterial
                          color={bar.color}
                          emissive={beadIsActive ? "#fef08a" : "#000"}
                          emissiveIntensity={beadIsActive ? 0.4 : 0}
                          roughness={0.4}
                          metalness={0.1}
                        />
                      </mesh>
                    );
                  })}
                </group>
              </group>
            </group>
          ))}
        </group>
        <OrbitControls
          enablePan={false}
          minDistance={1.5}
          maxDistance={2.6}
          maxPolarAngle={Math.PI / 2.2}
        />
      </Canvas>
    </div>
  );
}
