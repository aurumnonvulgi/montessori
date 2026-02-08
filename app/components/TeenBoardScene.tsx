"use client";

import { Canvas, ThreeEvent, useThree } from "@react-three/fiber";
import { OrbitControls as DreiOrbitControls } from "@react-three/drei";
import { useRef, useState, useEffect, useCallback } from "react";
import * as THREE from "three";

const BEAD_RADIUS = 0.01;
const BEAD_SPACING = BEAD_RADIUS * 1.05;
const TEN_BAR_COUNT = 5;
const UNIT_BAR_COUNT = 9;
const X_MIN = -2.0;
const X_MAX = 0.6;
const Z_MIN = -0.2;
const Z_MAX = 0.5;

const TEN_BAR_POSITIONS: [number, number, number][] = [
  [0.4911014820408171, BEAD_RADIUS, 0.46500688674467],
  [0.5196454924742053, BEAD_RADIUS, 0.4670596006015892],
  [0.5466432370525829, BEAD_RADIUS, 0.4674363872553235],
  [0.5734324089395717, BEAD_RADIUS, 0.46815815735814703],
  [0.6, BEAD_RADIUS, 0.46700580175231876],
];

const UNIT_BAR_POSITIONS: [number, number, number][] = [
  [0.45340489606460965, BEAD_RADIUS, 0.4200131494607512],
  [0.4225387584790904, BEAD_RADIUS, 0.4237749333959237],
  [0.39126125137505924, BEAD_RADIUS, 0.4304548078971964],
  [0.36379604829520756, BEAD_RADIUS, 0.43206012279457773],
  [0.3343386629991855, BEAD_RADIUS, 0.43770614702624744],
  [0.30523563987086133, BEAD_RADIUS, 0.4425168290444615],
  [0.27771856809891676, BEAD_RADIUS, 0.4492954272146724],
  [0.2450577052688329, BEAD_RADIUS, 0.45410510448037505],
  [0.21555458278762676, BEAD_RADIUS, 0.4572468676877839],
];

const createInitialPositions = () => {
  const positions: Record<string, [number, number, number]> = {};
  TEN_BAR_POSITIONS.forEach((pos, index) => {
    positions[`ten-${index + 1}`] = pos;
  });
  UNIT_BAR_POSITIONS.forEach((pos, index) => {
    positions[`unit-${index + 1}`] = pos;
  });
  return positions;
};

type TeenBoardSceneProps = {
  className?: string;
  interactive?: boolean;
  onPositionsChange?: (positions: Record<string, [number, number, number]>) => void;
};

const dragPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
const pointer = new THREE.Vector2();
const raycaster = new THREE.Raycaster();

function SceneContent({
  interactive,
  onPositionsChange,
}: {
  interactive: boolean;
  onPositionsChange?: (positions: Record<string, [number, number, number]>) => void;
}) {
  const { camera, gl } = useThree();
  const orbitRef = useRef<any>(null);
  const [barPositions, setBarPositions] = useState(() => createInitialPositions());
  const [dragTarget, setDragTarget] = useState<{ id: string; offset: THREE.Vector3 } | null>(null);

  const pointerMove = useCallback(
    (event: PointerEvent) => {
      if (!dragTarget) return;
      const rect = gl.domElement.getBoundingClientRect();
      pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointer, camera);
      const hit = new THREE.Vector3();
      if (raycaster.ray.intersectPlane(dragPlane, hit)) {
        const candidate: [number, number, number] = [
          Math.max(Math.min(hit.x - dragTarget.offset.x, X_MAX), X_MIN),
          BEAD_RADIUS,
          Math.min(Math.max(hit.z - dragTarget.offset.z, Z_MIN), Z_MAX),
        ];
        setBarPositions((prev) => ({ ...prev, [dragTarget.id]: candidate }));
      }
    },
    [camera, dragTarget, gl.domElement],
  );

  useEffect(() => {
    const canvas = gl.domElement;
    const release = () => {
      setDragTarget(null);
      if (orbitRef.current) orbitRef.current.enabled = true;
    };
    canvas.addEventListener("pointermove", pointerMove);
    canvas.addEventListener("pointerup", release);
    canvas.addEventListener("pointerleave", release);
    return () => {
      canvas.removeEventListener("pointermove", pointerMove);
      canvas.removeEventListener("pointerup", release);
      canvas.removeEventListener("pointerleave", release);
    };
  }, [gl.domElement, pointerMove]);

  const handleDown = useCallback(
    (id: string) => (event: ThreeEvent<PointerEvent>) => {
      event.stopPropagation();
      if (!interactive) return;
      const current = new THREE.Vector3(...(barPositions[id] ?? [0, 0, 0]));
      setDragTarget({ id, offset: event.point.clone().sub(current) });
      if (orbitRef.current) orbitRef.current.enabled = false;
    },
    [barPositions, interactive],
  );

  useEffect(() => {
    onPositionsChange?.(barPositions);
  }, [barPositions, onPositionsChange]);

  const renderBar = (id: string, beadCount: number, color: string) => {
    const length = beadCount * BEAD_SPACING;
    const startX = -((beadCount - 1) * BEAD_SPACING) / 2;
    return (
      <group key={id} position={barPositions[id] ?? [0, BEAD_RADIUS, 0]} onPointerDown={handleDown(id)}>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.002, 0.002, length + 0.02, 12]} />
          <meshStandardMaterial color="#a37432" />
        </mesh>
        {Array.from({ length: beadCount }).map((_, index) => (
          <mesh key={`${id}-bead-${index}`} position={[0, 0, startX + index * BEAD_SPACING]}>
            <sphereGeometry args={[BEAD_RADIUS, 32, 32]} />
            <meshStandardMaterial color={color} metalness={0.2} roughness={0.3} />
          </mesh>
        ))}
      </group>
    );
  };

  return (
    <>
      <ambientLight intensity={0.7} />
      <directionalLight position={[0.5, 1, 0.3]} intensity={0.8} />
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[2, 1.2]} />
        <meshStandardMaterial color="#a27d53" />
      </mesh>
      {Array.from({ length: TEN_BAR_COUNT }).map((_, index) => renderBar(`ten-${index + 1}`, 10, "#d4b896"))}
      {Array.from({ length: UNIT_BAR_COUNT }).map((_, index) =>
        renderBar(`unit-${index + 1}`, index + 1, [
          "#ef4444",
          "#16a34a",
          "#fec8d8",
          "#fde68a",
          "#93c5fd",
          "#d8b4fe",
          "#f8fafc",
          "#7a4f31",
          "#1e3a8a",
        ][index]),
      )}
      <DreiOrbitControls ref={orbitRef} maxPolarAngle={Math.PI / 2} minDistance={0.2} maxDistance={3} enablePan enableZoom />
    </>
  );
}

export default function TeenBoardScene({ className, interactive = true, onPositionsChange }: TeenBoardSceneProps) {
  return (
    <div className={className ?? "h-full w-full"}>
      <Canvas camera={{ position: [0, 0.35, -0.8], fov: 45 }}>
        <SceneContent interactive={interactive} onPositionsChange={onPositionsChange} />
      </Canvas>
    </div>
  );
}
