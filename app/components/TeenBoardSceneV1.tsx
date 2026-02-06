"use client";

import { Canvas, useThree, ThreeEvent } from "@react-three/fiber";
import { Text, OrbitControls as DreiOrbitControls } from "@react-three/drei";
import { useRef, useState, useEffect, useCallback } from "react";
import * as THREE from "three";
import type { OrbitControls as StdlibOrbitControls } from "three-stdlib/controls/OrbitControls";
import { OrbitControls as ThreeOrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

const BEAD_RADIUS = 0.01;
const BEAD_SPACING = BEAD_RADIUS * 1.05;
const TEN_BAR_COUNT = 5;
const UNIT_BAR_COUNT = 9;

const TEN_BOARD_POSITION = { x: -0.35, y: BEAD_RADIUS + 0.001, z: 0 };
const NUMBER_BOARD_POSITION = { x: 0.1, y: BEAD_RADIUS + 0.01, z: -0.25 };
const TEN_BAR_START = { x: TEN_BOARD_POSITION.x - 0.25, z: TEN_BOARD_POSITION.z + 0.08 };
const TEN_BOARD_LENGTH = 0.62;
const TEN_BOARD_WIDTH = 0.27;
const ROW_SPACING = TEN_BOARD_LENGTH / TEN_BAR_COUNT;
const TILE_SLAT_THICKNESS = 0.01;
const TILE_WIDTH = TEN_BOARD_WIDTH * 0.55;
const TILE_DEPTH = ROW_SPACING * 0.8;

const tileDefinitions = Array.from({ length: TEN_BAR_COUNT }).flatMap((_, index) => [
  {
    id: `tile-ten-${index + 1}-1`,
    label: "1",
    column: "left" as const,
    row: index,
  },
  {
    id: `tile-ten-${index + 1}-0`,
    label: "0",
    column: "right" as const,
    row: index,
  },
]);

const createInitialPositions = () => {
  const positions: Record<string, [number, number, number]> = {};
  const tenGap = 0.08;
  for (let i = 0; i < TEN_BAR_COUNT; i += 1) {
    positions[`ten-${i + 1}`] = [TEN_BAR_START.x, BEAD_RADIUS, TEN_BAR_START.z + i * tenGap];
  }

  for (let idx = 0; idx < UNIT_BAR_COUNT; idx += 1) {
    const row = Math.floor(idx / 5);
    const col = idx % 5;
    positions[`unit-${idx + 1}`] = [
      NUMBER_BOARD_POSITION.x + col * 0.08,
      BEAD_RADIUS,
      NUMBER_BOARD_POSITION.z - row * 0.05,
    ];
  }

  return positions;
};

const createTilePositions = () => {
  const positions: Record<string, [number, number, number]> = {};
  const rowSpacing = ROW_SPACING;
  const columnOffset = TEN_BOARD_WIDTH / 4;
  const startZ = TEN_BOARD_POSITION.z - TEN_BOARD_LENGTH / 2 + rowSpacing / 2;
  tileDefinitions.forEach((tile) => {
    const rowOffset = startZ + rowSpacing * tile.row;
    const xOffset = tile.column === "left" ? -columnOffset : columnOffset;
    positions[tile.id] = [
      TEN_BOARD_POSITION.x + xOffset,
      TEN_BOARD_POSITION.y + TILE_SLAT_THICKNESS + 0.0005,
      rowOffset,
    ];
  });
  return positions;
};

const unitBarColors = ["#ef4444", "#16a34a", "#fec8d8", "#fde68a", "#93c5fd", "#d8b4fe", "#f8fafc", "#7a4f31", "#1e3a8a"];

type TeenBoardSceneProps = {
  className?: string;
  interactive?: boolean;
  preview?: boolean;
};

const dragPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
const pointer = new THREE.Vector2();
const raycaster = new THREE.Raycaster();

function SceneContent({ interactive }: { interactive: boolean }) {
  const { camera, gl } = useThree();
  const orbitRef = useRef<StdlibOrbitControls | null>(null);
  const [barPositions, setBarPositions] = useState(() => createInitialPositions());
  const [tilePositions, setTilePositions] = useState(() => createTilePositions());
  const [dragTarget, setDragTarget] = useState<{
    id: string;
    offset: THREE.Vector3;
    type: "bar" | "tile";
  } | null>(null);

  const pointerMoveHandler = useCallback(
    (event: PointerEvent) => {
      if (!dragTarget) {
        return;
      }
      const rect = gl.domElement.getBoundingClientRect();
      pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointer, camera);
      const intersection = new THREE.Vector3();
      if (raycaster.ray.intersectPlane(dragPlane, intersection)) {
        const positionY =
          dragTarget.type === "tile"
            ? tilePositions[dragTarget.id]?.[1] ?? (TEN_BOARD_POSITION.y + TILE_SLAT_THICKNESS + 0.0005)
            : BEAD_RADIUS;
        const newPosition = intersection.clone().sub(dragTarget.offset);
        newPosition.y = positionY;
        const allowLeft = dragTarget.type === "tile" && dragTarget.id.includes("-1");
        const minX = allowLeft ? -0.65 : -0.45;
        newPosition.x = Math.max(Math.min(newPosition.x, 0.35), minX);
        newPosition.z = Math.min(Math.max(newPosition.z, -0.2), 0.25);
        const updatedPosition: [number, number, number] = [
          newPosition.x,
          newPosition.y,
          newPosition.z,
        ];
        if (dragTarget.type === "bar") {
          setBarPositions((previous) => ({ ...previous, [dragTarget.id]: updatedPosition }));
        } else {
          setTilePositions((previous) => ({ ...previous, [dragTarget.id]: updatedPosition }));
        }
      }
    },
    [camera, dragTarget, gl.domElement, tilePositions],
  );

  useEffect(() => {
    if (!interactive) {
      return undefined;
    }
    const canvas = gl.domElement;
    const handleUp = () => {
      setDragTarget(null);
      if (orbitRef.current) {
        orbitRef.current.enabled = true;
      }
    };
    canvas.addEventListener("pointermove", pointerMoveHandler);
    canvas.addEventListener("pointerup", handleUp);
    canvas.addEventListener("pointerleave", handleUp);
    return () => {
      canvas.removeEventListener("pointermove", pointerMoveHandler);
      canvas.removeEventListener("pointerup", handleUp);
      canvas.removeEventListener("pointerleave", handleUp);
    };
  }, [interactive, gl.domElement, pointerMoveHandler]);

  const handleBarPointerDown = useCallback(
    (id: string) => (event: ThreeEvent<PointerEvent>) => {
      event.stopPropagation();
      if (!interactive) {
        return;
      }
      const currentPosition = new THREE.Vector3(...(barPositions[id] ?? [0, 0, 0]));
      const offset = event.point.clone().sub(currentPosition);
      setDragTarget({ id, offset, type: "bar" });
      if (orbitRef.current) {
        orbitRef.current.enabled = false;
      }
    },
    [interactive, barPositions],
  );

  const handleTilePointerDown = useCallback(
    (id: string) => (event: ThreeEvent<PointerEvent>) => {
      event.stopPropagation();
      if (!interactive) {
        return;
      }
      const currentPosition = new THREE.Vector3(...(tilePositions[id] ?? [0, 0, 0]));
      const offset = event.point.clone().sub(currentPosition);
      setDragTarget({ id, offset, type: "tile" });
      if (orbitRef.current) {
        orbitRef.current.enabled = false;
      }
    },
    [interactive, tilePositions],
  );

  const renderBeadBar = (beadCount: number, color: string, id: string) => {
    const length = beadCount * BEAD_SPACING;
    const startX = -((beadCount - 1) * BEAD_SPACING) / 2;
    return (
      <group
        key={id}
        position={barPositions[id] ?? [0, BEAD_RADIUS, 0]}
        onPointerDown={handleBarPointerDown(id)}
      >
        <mesh rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.002, 0.002, length + 0.02, 12]} />
          <meshStandardMaterial color="#a37432" />
        </mesh>
        {Array.from({ length: beadCount }).map((_, index) => (
          <mesh
            key={`${id}-bead-${index}`}
            position={[startX + index * BEAD_SPACING, 0, 0]}
          >
            <sphereGeometry args={[BEAD_RADIUS, 32, 32]} />
            <meshStandardMaterial color={color} metalness={0.2} roughness={0.3} />
          </mesh>
        ))}
      </group>
    );
  };

  const tenBars = Array.from({ length: TEN_BAR_COUNT }).map((_, index) =>
    renderBeadBar(10, "#d4b896", `ten-${index + 1}`),
  );
  const unitBars = Array.from({ length: UNIT_BAR_COUNT }).map((_, index) =>
    renderBeadBar(index + 1, unitBarColors[index], `unit-${index + 1}`),
  );

  const boardSlats = Array.from({ length: TEN_BAR_COUNT + 1 }).map((_, idx) => {
    const z = -TEN_BOARD_LENGTH / 2 + idx * ROW_SPACING;
    return (
      <mesh key={`slat-${idx}`} position={[0, TILE_SLAT_THICKNESS / 2, z]}>
        <boxGeometry args={[TEN_BOARD_WIDTH, TILE_SLAT_THICKNESS, 0.025]} />
        <meshStandardMaterial color="#c79a5a" />
      </mesh>
    );
  });

  const tileElements = tileDefinitions.map((tile) => {
    const position = tilePositions[tile.id] ?? [TEN_BOARD_POSITION.x, TEN_BOARD_POSITION.y, TEN_BOARD_POSITION.z];
    return (
      <group key={tile.id} position={position} onPointerDown={handleTilePointerDown(tile.id)}>
        <mesh>
          <boxGeometry args={[TILE_WIDTH, TILE_SLAT_THICKNESS, TILE_DEPTH]} />
          <meshStandardMaterial color="#f7f3e8" />
        </mesh>
        <Text
          fontSize={0.045}
          color="#2c1b0a"
          rotation={[-Math.PI / 2, 0, 0]}
          position={[0, 0.02, 0]}
        >
          {tile.label}
        </Text>
      </group>
    );
  });

  return (
      <>
      <ambientLight intensity={0.75} />
      <directionalLight position={[0.7, 1.2, 0.5]} intensity={0.9} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
        <planeGeometry args={[1.8, 1.0]} />
        <meshStandardMaterial color="#9c7b58" />
      </mesh>
      <group>{tenBars}</group>
      <group>{unitBars}</group>
      <group position={[TEN_BOARD_POSITION.x, TEN_BOARD_POSITION.y, TEN_BOARD_POSITION.z]}>
        <mesh>
          <boxGeometry args={[TEN_BOARD_WIDTH, 0.01, TEN_BOARD_LENGTH]} />
          <meshStandardMaterial color="#855e3c" />
        </mesh>
        <group position={[0, TILE_SLAT_THICKNESS / 2, 0]}>{boardSlats}</group>
      </group>
      {tileElements}

      <DreiOrbitControls
        ref={orbitRef}
        makeDefault
        maxPolarAngle={Math.PI / 2}
        minPolarAngle={Math.PI / 4}
        maxDistance={1.8}
        minDistance={0.6}
        enablePan
        enableZoom
        enableRotate
      />
    </>
  );
}

export default function TeenBoardScene({ className, interactive = true }: TeenBoardSceneProps) {
  return (
    <div className={className ?? "h-full w-full"}>
      <Canvas camera={{ position: [0, 0.35, 0.8], fov: 45 }}>
        <SceneContent interactive={interactive} />
      </Canvas>
    </div>
  );
}
