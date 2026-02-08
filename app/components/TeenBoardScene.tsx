"use client";

import { Canvas, ThreeEvent, useThree } from "@react-three/fiber";
import { OrbitControls as DreiOrbitControls } from "@react-three/drei";
import { useRef, useState, useEffect, useCallback } from "react";
import * as THREE from "three";

const BEAD_RADIUS = 0.01;
const BEAD_SPACING = BEAD_RADIUS * 1.05;
const TEN_BAR_COUNT = 5;
const UNIT_BAR_COUNT = 9;
const X_MIN = -1.5;
const X_MAX = 0.6;
const Z_MIN = -0.2;
const Z_MAX = 0.5;

const TEN_BAR_POSITIONS: [number, number, number][] = [
  [0.2544291310525646, BEAD_RADIUS, 0.3830499503033003],
  [0.2964945229880483, BEAD_RADIUS, 0.38143310142231546],
  [0.3324896828143259, BEAD_RADIUS, 0.38317598280595333],
  [0.3670180914921699, BEAD_RADIUS, 0.3842294037152537],
  [0.4, BEAD_RADIUS, 0.3843294241470268],
];

const UNIT_BAR_POSITIONS: [number, number, number][] = [
  [0.20537113299389023, BEAD_RADIUS, 0.338328648968787],
  [0.17635774889097386, BEAD_RADIUS, 0.3463879177084178],
  [0.14273459141629924, BEAD_RADIUS, 0.35462013982961765],
  [0.10725065582754717, BEAD_RADIUS, 0.3558826808307598],
  [0.072061890131814, BEAD_RADIUS, 0.3566419065781292],
  [0.042415639180468735, BEAD_RADIUS, 0.36087392866364587],
  [0.011742108415274802, BEAD_RADIUS, 0.364216913327867],
  [-0.020349038228586837, BEAD_RADIUS, 0.36535836788649084],
  [-0.04957198048503151, BEAD_RADIUS, 0.36646124952720893],
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
