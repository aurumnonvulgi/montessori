"use client";

import { Canvas, type ThreeEvent, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, Text } from "@react-three/drei";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import HomeLink from "./HomeLink";
import CompletionOverlay from "./CompletionOverlay";
import { trackLessonEvent } from "../lib/lessonTelemetry";
import ZoomResetButton from "./ZoomResetButton";
import MaterialTeachersGuide from "./MaterialTeachersGuide";
import { HUNDRED_BOARD_TEACHERS_GUIDE } from "../data/materialTeachersGuides";

const GRID_SIZE = 10;
const SLOT_SIZE = 0.42;
const SLOT_GAP = 0.06;
const SLOT_PITCH = SLOT_SIZE + SLOT_GAP;
const BOARD_SPAN = GRID_SIZE * SLOT_SIZE + (GRID_SIZE - 1) * SLOT_GAP;
const BOARD_HALF = BOARD_SPAN / 2;
const BOARD_PADDING = 0.36;
const BASE_THICKNESS = 0.34;
const BOARD_TOP_Y = 0.03;
const FRAME_WIDTH = 0.22;
const FRAME_HEIGHT = 0.06;
const TILE_SIZE = SLOT_SIZE * 0.82;
const TILE_HEIGHT = 0.045;
const PLACED_TILE_Y = BOARD_TOP_Y + TILE_HEIGHT / 2 + 0.002;
const ACTIVE_TILE_Y = BOARD_TOP_Y + 0.13;
const GRID_LINE_Y = BOARD_TOP_Y + 0.006;

const BOARD_CENTER_X = 1.0;
const BOARD_CENTER_Z = 0.05;
const BOARD_ORIGIN_X = BOARD_CENTER_X - BOARD_HALF + SLOT_SIZE / 2;
const BOARD_ORIGIN_Z = BOARD_CENTER_Z - BOARD_HALF + SLOT_SIZE / 2;

const PLAYMAT_WIDTH = BOARD_SPAN + BOARD_PADDING * 2 + 6.1;
const PLAYMAT_DEPTH = BOARD_SPAN + BOARD_PADDING * 2 + 3.6;
const PLAYMAT_CENTER_X = BOARD_CENTER_X - 0.45;
const PLAYMAT_CENTER_Z = BOARD_CENTER_Z;

const RACK_ROW_COUNTS = [3, 3, 3, 1] as const;
const RACK_COL_SPACING = TILE_SIZE + 0.01;
const RACK_ROW_SPACING = TILE_SIZE + 0.02;
// Shift the rack one board-slot closer to the board.
const RACK_CENTER_X = BOARD_CENTER_X - BOARD_HALF - 0.24;
const RACK_CENTER_Z = BOARD_CENTER_Z - 0.56;
const RACK_COLUMN_SHIFT = 0.15;
const SCATTER_CLUSTER_X = BOARD_CENTER_X - BOARD_HALF - 1.34;
const SCATTER_CLUSTER_Z = BOARD_CENTER_Z - BOARD_HALF - 1.02;
const SCATTER_OFFSETS: Array<[number, number]> = [
  [0.0, 0.0],
  [0.22, 0.08],
  [-0.2, 0.06],
  [0.36, 0.18],
  [-0.34, 0.14],
  [0.12, 0.27],
  [-0.08, 0.24],
  [0.42, 0.3],
  [-0.28, 0.33],
  [0.04, 0.4],
];

const COMPLETION_KEY = "hundred-board-complete";

type PointerPoint = {
  x: number;
  z: number;
};

type SlotInfo = {
  row: number;
  col: number;
  slotNumber: number;
  centerX: number;
  centerZ: number;
};

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

const slotNumberFromRowCol = (row: number, col: number) => row * GRID_SIZE + col + 1;

const slotInfoFromRowCol = (row: number, col: number): SlotInfo => ({
  row,
  col,
  slotNumber: slotNumberFromRowCol(row, col),
  centerX: BOARD_ORIGIN_X + col * SLOT_PITCH,
  centerZ: BOARD_ORIGIN_Z + row * SLOT_PITCH,
});

const slotInfoFromNumber = (slotNumber: number) => {
  const normalized = clamp(slotNumber, 1, 100) - 1;
  const row = Math.floor(normalized / GRID_SIZE);
  const col = normalized % GRID_SIZE;
  return slotInfoFromRowCol(row, col);
};

const pointInBoardBounds = (x: number, z: number) => {
  const minX = BOARD_ORIGIN_X - SLOT_SIZE / 2;
  const minZ = BOARD_ORIGIN_Z - SLOT_SIZE / 2;
  const maxX = BOARD_ORIGIN_X + (GRID_SIZE - 1) * SLOT_PITCH + SLOT_SIZE / 2;
  const maxZ = BOARD_ORIGIN_Z + (GRID_SIZE - 1) * SLOT_PITCH + SLOT_SIZE / 2;
  return x >= minX && x <= maxX && z >= minZ && z <= maxZ;
};

const nearestSlotFromPoint = (x: number, z: number): SlotInfo => {
  const minX = BOARD_ORIGIN_X - SLOT_SIZE / 2;
  const minZ = BOARD_ORIGIN_Z - SLOT_SIZE / 2;
  const maxX = BOARD_ORIGIN_X + (GRID_SIZE - 1) * SLOT_PITCH + SLOT_SIZE / 2;
  const maxZ = BOARD_ORIGIN_Z + (GRID_SIZE - 1) * SLOT_PITCH + SLOT_SIZE / 2;
  const clampedX = clamp(x, minX, maxX);
  const clampedZ = clamp(z, minZ, maxZ);
  const col = clamp(Math.round((clampedX - BOARD_ORIGIN_X) / SLOT_PITCH), 0, GRID_SIZE - 1);
  const row = clamp(Math.round((clampedZ - BOARD_ORIGIN_Z) / SLOT_PITCH), 0, GRID_SIZE - 1);
  return slotInfoFromRowCol(row, col);
};

const rackPositionForIndex = (index: number): [number, number, number] => {
  let cursor = 0;
  let row = 0;
  let localIndex = 0;

  for (let rowIndex = 0; rowIndex < RACK_ROW_COUNTS.length; rowIndex += 1) {
    const rowCount = RACK_ROW_COUNTS[rowIndex];
    if (index < cursor + rowCount) {
      row = rowIndex;
      localIndex = index - cursor;
      break;
    }
    cursor += rowCount;
  }

  const rowCount = RACK_ROW_COUNTS[row] ?? 1;
  const rowCenterOffset = (rowCount - 1) / 2;
  const totalRows = RACK_ROW_COUNTS.length;
  // Fine-tune rack offset so tiles stay close to the board without overlapping it.
  const shiftedIndex = localIndex + RACK_COLUMN_SHIFT;
  const x = RACK_CENTER_X + (shiftedIndex - rowCenterOffset) * RACK_COL_SPACING;
  const z = RACK_CENTER_Z + (row - (totalRows - 1) / 2) * RACK_ROW_SPACING;
  return [x, TILE_HEIGHT / 2 + 0.006, z];
};

const scatterPositionForIndex = (index: number): [number, number, number] => {
  const [offsetX, offsetZ] = SCATTER_OFFSETS[index % SCATTER_OFFSETS.length] ?? [0, 0];
  const yJitter = (index % 3) * 0.002;
  return [SCATTER_CLUSTER_X + offsetX, TILE_HEIGHT / 2 + 0.006 + yJitter, SCATTER_CLUSTER_Z + offsetZ];
};

const shuffledNumbers = (values: number[]) => {
  const next = [...values];
  for (let index = next.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [next[index], next[randomIndex]] = [next[randomIndex], next[index]];
  }
  return next;
};

const delay = (ms: number) =>
  new Promise<void>((resolve) => {
    window.setTimeout(resolve, ms);
  });

type NumberTileProps = {
  number: number;
  position: [number, number, number];
  ghost?: boolean;
  tone?: "default" | "placed" | "rack";
  onPointerDown?: (point: PointerPoint) => void;
};

function NumberTile({ number, position, ghost = false, tone = "default", onPointerDown }: NumberTileProps) {
  const color = ghost ? "#ffffff" : "#ffffff";
  const textColor = tone === "rack" ? "#111111" : ghost ? "#111111" : "#111111";

  return (
    <group
      position={position}
      onPointerDown={(event: ThreeEvent<PointerEvent>) => {
        if (!onPointerDown) return;
        event.stopPropagation();
        onPointerDown({ x: event.point.x, z: event.point.z });
      }}
    >
      <mesh castShadow receiveShadow>
        <boxGeometry args={[TILE_SIZE, TILE_HEIGHT, TILE_SIZE]} />
        <meshStandardMaterial
          color={color}
          roughness={0.2}
          metalness={0.02}
          emissive="#ffffff"
          emissiveIntensity={ghost ? 0.08 : 0.04}
          transparent={ghost}
          opacity={ghost ? 0.8 : 1}
        />
      </mesh>
      <Text
        position={[0, TILE_HEIGHT / 2 + 0.004, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        fontSize={0.15}
        maxWidth={0.3}
        anchorX="center"
        anchorY="middle"
        color={textColor}
      >
        {String(number)}
      </Text>
    </group>
  );
}

type RackTileProps = {
  number: number;
  position: [number, number, number];
  shaking: boolean;
  onGrab: (number: number, point: PointerPoint) => void;
};

function RackTile({ number, position, shaking, onGrab }: RackTileProps) {
  const ref = useRef<THREE.Group | null>(null);

  useFrame(({ clock }) => {
    const group = ref.current;
    if (!group) return;
    const shakeOffset = shaking ? Math.sin(clock.elapsedTime * 45) * 0.045 : 0;
    group.position.set(position[0] + shakeOffset, position[1], position[2]);
  });

  return (
    <group ref={ref}>
      <NumberTile
        number={number}
        position={position}
        tone="rack"
        onPointerDown={(point) => onGrab(number, point)}
      />
    </group>
  );
}

type HundredBoardSceneProps = {
  slotAssignments: Record<number, number>;
  rackNumbers: number[];
  activeTile: number | null;
  availableTiles: number[];
  hiddenRackNumbers?: number[];
  hoveredSlot: number | null;
  pointerPoint: PointerPoint | null;
  shakingTile: number | null;
  correctFlashSlot: number | null;
  wrongFlashSlot: number | null;
  rackMode?: "stacked" | "scatter";
  onTileGrab: (number: number, point: PointerPoint) => void;
  onHoverChange: (slot: number | null, point: PointerPoint | null) => void;
  onDropAtSlot: (slot: number | null) => void;
};

function HundredBoardScene({
  slotAssignments,
  rackNumbers,
  activeTile,
  availableTiles,
  hiddenRackNumbers = [],
  hoveredSlot,
  pointerPoint,
  shakingTile,
  correctFlashSlot,
  wrongFlashSlot,
  rackMode = "stacked",
  onTileGrab,
  onHoverChange,
  onDropAtSlot,
}: HundredBoardSceneProps) {
  const { camera, gl } = useThree();
  const raycasterRef = useRef(new THREE.Raycaster());
  const ndcRef = useRef(new THREE.Vector2());
  const planeRef = useRef(new THREE.Plane(new THREE.Vector3(0, 1, 0), 0));
  const intersectionRef = useRef(new THREE.Vector3());

  const getPointerData = useCallback(
    (clientX: number, clientY: number) => {
      const rect = gl.domElement.getBoundingClientRect();
      const x = ((clientX - rect.left) / rect.width) * 2 - 1;
      const y = -((clientY - rect.top) / rect.height) * 2 + 1;
      ndcRef.current.set(x, y);
      raycasterRef.current.setFromCamera(ndcRef.current, camera);
      const hit = raycasterRef.current.ray.intersectPlane(planeRef.current, intersectionRef.current);
      if (!hit) return null;

      const point = {
        x: intersectionRef.current.x,
        z: intersectionRef.current.z,
      };

      if (!pointInBoardBounds(point.x, point.z)) {
        return { point, slotNumber: null };
      }

      const slot = nearestSlotFromPoint(point.x, point.z);
      return {
        point,
        slotNumber: slot.slotNumber,
      };
    },
    [camera, gl]
  );

  useEffect(() => {
    const dom = gl.domElement;

    const handlePointerMove = (event: PointerEvent) => {
      if (activeTile === null) {
        onHoverChange(null, null);
        return;
      }
      const hit = getPointerData(event.clientX, event.clientY);
      if (!hit) {
        onHoverChange(null, null);
        return;
      }
      onHoverChange(hit.slotNumber, hit.point);
    };

    const handlePointerUp = (event: PointerEvent) => {
      if (activeTile === null) return;
      const hit = getPointerData(event.clientX, event.clientY);
      if (!hit) {
        onDropAtSlot(null);
        return;
      }
      onDropAtSlot(hit.slotNumber);
    };

    const handlePointerLeave = () => {
      onHoverChange(null, null);
    };

    dom.addEventListener("pointermove", handlePointerMove);
    dom.addEventListener("pointerup", handlePointerUp);
    dom.addEventListener("pointerleave", handlePointerLeave);
    return () => {
      dom.removeEventListener("pointermove", handlePointerMove);
      dom.removeEventListener("pointerup", handlePointerUp);
      dom.removeEventListener("pointerleave", handlePointerLeave);
    };
  }, [activeTile, getPointerData, gl, onDropAtSlot, onHoverChange]);

  return (
    <>
      <ambientLight intensity={0.72} />
      <directionalLight
        position={[2.8, 4.9, 2.6]}
        intensity={0.8}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-bias={-0.00055}
        shadow-normalBias={0.025}
      />
      <directionalLight position={[-2.6, 4.1, -2.2]} intensity={0.28} />

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[PLAYMAT_CENTER_X, -0.02, PLAYMAT_CENTER_Z]} receiveShadow>
        <planeGeometry args={[PLAYMAT_WIDTH, PLAYMAT_DEPTH]} />
        <meshStandardMaterial color="#e2d6bf" roughness={0.9} metalness={0} />
      </mesh>

      <mesh position={[BOARD_CENTER_X, BOARD_TOP_Y - BASE_THICKNESS / 2, BOARD_CENTER_Z]} castShadow>
        <boxGeometry args={[BOARD_SPAN + BOARD_PADDING * 2, BASE_THICKNESS, BOARD_SPAN + BOARD_PADDING * 2]} />
        <meshStandardMaterial color="#c59a60" roughness={0.82} metalness={0.05} />
      </mesh>

      <mesh position={[BOARD_CENTER_X, BOARD_TOP_Y + 0.003, BOARD_CENTER_Z]}>
        <boxGeometry args={[BOARD_SPAN + 0.02, 0.004, BOARD_SPAN + 0.02]} />
        <meshStandardMaterial color="#d8bd8f" roughness={0.86} metalness={0} />
      </mesh>

      <mesh position={[BOARD_CENTER_X, BOARD_TOP_Y + FRAME_HEIGHT / 2, BOARD_CENTER_Z - (BOARD_SPAN + FRAME_WIDTH) / 2]}>
        <boxGeometry args={[BOARD_SPAN + FRAME_WIDTH * 2, FRAME_HEIGHT, FRAME_WIDTH]} />
        <meshStandardMaterial color="#b6894a" roughness={0.8} metalness={0.04} />
      </mesh>
      <mesh position={[BOARD_CENTER_X, BOARD_TOP_Y + FRAME_HEIGHT / 2, BOARD_CENTER_Z + (BOARD_SPAN + FRAME_WIDTH) / 2]}>
        <boxGeometry args={[BOARD_SPAN + FRAME_WIDTH * 2, FRAME_HEIGHT, FRAME_WIDTH]} />
        <meshStandardMaterial color="#b6894a" roughness={0.8} metalness={0.04} />
      </mesh>
      <mesh position={[BOARD_CENTER_X - (BOARD_SPAN + FRAME_WIDTH) / 2, BOARD_TOP_Y + FRAME_HEIGHT / 2, BOARD_CENTER_Z]}>
        <boxGeometry args={[FRAME_WIDTH, FRAME_HEIGHT, BOARD_SPAN]} />
        <meshStandardMaterial color="#b6894a" roughness={0.8} metalness={0.04} />
      </mesh>
      <mesh position={[BOARD_CENTER_X + (BOARD_SPAN + FRAME_WIDTH) / 2, BOARD_TOP_Y + FRAME_HEIGHT / 2, BOARD_CENTER_Z]}>
        <boxGeometry args={[FRAME_WIDTH, FRAME_HEIGHT, BOARD_SPAN]} />
        <meshStandardMaterial color="#b6894a" roughness={0.8} metalness={0.04} />
      </mesh>

      {Array.from({ length: GRID_SIZE + 1 }, (_, index) => {
        const minX = BOARD_ORIGIN_X - SLOT_SIZE / 2;
        const minZ = BOARD_ORIGIN_Z - SLOT_SIZE / 2;
        const lineX = minX + index * SLOT_PITCH;
        const lineZ = minZ + index * SLOT_PITCH;
        return (
          <group key={`grid-line-${index}`}>
            <mesh position={[lineX, GRID_LINE_Y, BOARD_CENTER_Z]}>
              <boxGeometry args={[0.012, 0.002, BOARD_SPAN]} />
              <meshStandardMaterial color="#6b5643" roughness={0.85} metalness={0} />
            </mesh>
            <mesh position={[BOARD_CENTER_X, GRID_LINE_Y, lineZ]}>
              <boxGeometry args={[BOARD_SPAN, 0.002, 0.012]} />
              <meshStandardMaterial color="#6b5643" roughness={0.85} metalness={0} />
            </mesh>
          </group>
        );
      })}

      {Array.from({ length: 100 }, (_, index) => {
        const slotNumber = index + 1;
        const slot = slotInfoFromNumber(slotNumber);
        const assigned = slotAssignments[slotNumber];
        const isHovered = activeTile !== null && hoveredSlot === slotNumber;
        const isCorrectFlash = correctFlashSlot === slotNumber;
        const isWrongFlash = wrongFlashSlot === slotNumber;

        return (
          <group key={`slot-${slotNumber}`}>
            {(isHovered || isCorrectFlash || isWrongFlash) && (
              <mesh position={[slot.centerX, GRID_LINE_Y + 0.0012, slot.centerZ]} rotation={[-Math.PI / 2, 0, 0]}>
                <planeGeometry args={[SLOT_SIZE * 0.98, SLOT_SIZE * 0.98]} />
                <meshBasicMaterial
                  transparent
                  opacity={isCorrectFlash || isWrongFlash ? 0.58 : 0.36}
                  color={isCorrectFlash ? "#22c55e" : isWrongFlash ? "#ef4444" : "#facc15"}
                />
              </mesh>
            )}
            {assigned ? <NumberTile number={assigned} position={[slot.centerX, PLACED_TILE_Y, slot.centerZ]} tone="placed" /> : null}
          </group>
        );
      })}

      {rackNumbers.map((number, index) => {
        const isAvailable = availableTiles.includes(number);
        const isHidden = hiddenRackNumbers.includes(number);
        if (!isAvailable || isHidden || activeTile === number) return null;
        return (
          <RackTile
            key={`rack-${number}`}
            number={number}
            position={rackMode === "scatter" ? scatterPositionForIndex(index) : rackPositionForIndex(index)}
            shaking={shakingTile === number}
            onGrab={onTileGrab}
          />
        );
      })}

      {activeTile !== null && pointerPoint ? (
        <NumberTile number={activeTile} position={[pointerPoint.x, ACTIVE_TILE_Y, pointerPoint.z]} ghost />
      ) : null}
    </>
  );
}

export default function HundredBoardLesson() {
  const [slotAssignments, setSlotAssignments] = useState<Record<number, number>>({});
  const [currentBatchStart, setCurrentBatchStart] = useState(1);
  const [activeTile, setActiveTile] = useState<number | null>(null);
  const [hoveredSlot, setHoveredSlot] = useState<number | null>(null);
  const [pointerPoint, setPointerPoint] = useState<PointerPoint | null>(null);
  const [correctFlashSlot, setCorrectFlashSlot] = useState<number | null>(null);
  const [wrongFlashSlot, setWrongFlashSlot] = useState<number | null>(null);
  const [shakingTile, setShakingTile] = useState<number | null>(null);
  const [showBatchCompletion, setShowBatchCompletion] = useState(false);
  const [completedBatchStart, setCompletedBatchStart] = useState<number | null>(null);
  const [introState, setIntroState] = useState<"pending" | "running" | "done">("pending");
  const [introTilePositions, setIntroTilePositions] = useState<Record<number, [number, number, number]>>({});

  const flashTimerRef = useRef<number | null>(null);
  const shakeTimerRef = useRef<number | null>(null);
  const introAnimationFrameRef = useRef<number | null>(null);
  const introRunIdRef = useRef(0);
  const completedBatchesRef = useRef<Record<number, true>>({});
  const completionLoggedRef = useRef(false);
  type OrbitControlsHandle = React.ElementRef<typeof OrbitControls>;
  const controlsRef = useRef<OrbitControlsHandle | null>(null);

  const batchNumbers = useMemo(
    () => Array.from({ length: 10 }, (_, index) => currentBatchStart + index),
    [currentBatchStart]
  );
  const [rackNumbers, setRackNumbers] = useState<number[]>(() =>
    [...shuffledNumbers(Array.from({ length: 9 }, (_, index) => index + 2)), 1]
  );
  const batchIndex = useMemo(() => Math.floor((currentBatchStart - 1) / 10) + 1, [currentBatchStart]);
  const availableTiles = useMemo(
    () => batchNumbers.filter((number) => !slotAssignments[number]),
    [batchNumbers, slotAssignments]
  );
  const placedCount = useMemo(() => Object.keys(slotAssignments).length, [slotAssignments]);
  const isBatchComplete = availableTiles.length === 0;

  useEffect(() => {
    const guideNumber = currentBatchStart;
    const shuffledWithoutGuide = shuffledNumbers(batchNumbers.filter((number) => number !== guideNumber));
    setRackNumbers([...shuffledWithoutGuide, guideNumber]);
  }, [batchNumbers, currentBatchStart]);

  useEffect(() => {
    const guideNumber = currentBatchStart;
    if (currentBatchStart === 1 && introState !== "done") return;
    setSlotAssignments((previous) => {
      if (previous[guideNumber]) return previous;
      return {
        ...previous,
        [guideNumber]: guideNumber,
      };
    });
  }, [currentBatchStart, introState]);

  const clearFlashTimer = useCallback(() => {
    if (flashTimerRef.current !== null) {
      window.clearTimeout(flashTimerRef.current);
      flashTimerRef.current = null;
    }
  }, []);

  const clearShakeTimer = useCallback(() => {
    if (shakeTimerRef.current !== null) {
      window.clearTimeout(shakeTimerRef.current);
      shakeTimerRef.current = null;
    }
  }, []);

  const clearIntroAnimationFrame = useCallback(() => {
    if (introAnimationFrameRef.current !== null) {
      window.cancelAnimationFrame(introAnimationFrameRef.current);
      introAnimationFrameRef.current = null;
    }
  }, []);

  const showCorrectFlash = useCallback(
    (slot: number) => {
      clearFlashTimer();
      setWrongFlashSlot(null);
      setCorrectFlashSlot(slot);
      flashTimerRef.current = window.setTimeout(() => {
        setCorrectFlashSlot(null);
      }, 260);
    },
    [clearFlashTimer]
  );

  const showWrongFlash = useCallback(
    (slot: number) => {
      clearFlashTimer();
      setCorrectFlashSlot(null);
      setWrongFlashSlot(slot);
      flashTimerRef.current = window.setTimeout(() => {
        setWrongFlashSlot(null);
      }, 300);
    },
    [clearFlashTimer]
  );

  const handleHoverChange = useCallback((slot: number | null, point: PointerPoint | null) => {
    setHoveredSlot(slot);
    setPointerPoint(point);
  }, []);

  const handleDropAtSlot = useCallback(
    (slot: number | null) => {
      if (currentBatchStart === 1 && introState !== "done") return;
      if (activeTile === null) return;

      if (slot === null) {
        setActiveTile(null);
        setHoveredSlot(null);
        setPointerPoint(null);
        return;
      }

      const droppedTile = activeTile;
      const success = droppedTile === slot && !slotAssignments[slot];
      trackLessonEvent({
        lesson: "mathematics:hundred-board",
        activity: `batch-${batchIndex}`,
        event: "attempt_result",
        success,
        value: String(droppedTile),
        page: batchIndex,
        totalPages: 10,
        details: {
          slot,
        },
      });

      if (success) {
        setSlotAssignments((previous) => {
          if (previous[slot]) return previous;
          return {
            ...previous,
            [slot]: droppedTile,
          };
        });
        showCorrectFlash(slot);
        trackLessonEvent({
          lesson: "mathematics:hundred-board",
          activity: `batch-${batchIndex}`,
          event: "number_placed",
          success: true,
          value: String(droppedTile),
          page: batchIndex,
          totalPages: 10,
        });
      } else {
        showWrongFlash(slot);
        setShakingTile(droppedTile);
        clearShakeTimer();
        shakeTimerRef.current = window.setTimeout(() => {
          setShakingTile(null);
        }, 360);
      }

      setActiveTile(null);
      setHoveredSlot(null);
      setPointerPoint(null);
    },
    [activeTile, batchIndex, clearShakeTimer, currentBatchStart, introState, showCorrectFlash, showWrongFlash, slotAssignments]
  );

  useEffect(() => {
    trackLessonEvent({
      lesson: "mathematics:hundred-board",
      event: "lesson_opened",
      totalPages: 10,
    });
  }, []);

  useEffect(() => {
    trackLessonEvent({
      lesson: "mathematics:hundred-board",
      activity: `batch-${batchIndex}`,
      event: "batch_viewed",
      page: batchIndex,
      totalPages: 10,
      details: {
        range: `${currentBatchStart}-${currentBatchStart + 9}`,
      },
    });
  }, [batchIndex, currentBatchStart]);

  useEffect(() => {
    if (!isBatchComplete) return;
    if (completedBatchesRef.current[currentBatchStart]) return;
    completedBatchesRef.current[currentBatchStart] = true;
    setCompletedBatchStart(currentBatchStart);
    setShowBatchCompletion(true);

    trackLessonEvent({
      lesson: "mathematics:hundred-board",
      activity: `batch-${batchIndex}`,
      event: "batch_completed",
      success: true,
      page: batchIndex,
      totalPages: 10,
    });

  }, [batchIndex, currentBatchStart, isBatchComplete]);

  useEffect(() => {
    if (placedCount < 100) return;
    if (completionLoggedRef.current) return;
    completionLoggedRef.current = true;
    if (typeof window !== "undefined") {
      window.localStorage.setItem(COMPLETION_KEY, "true");
    }
    trackLessonEvent({
      lesson: "mathematics:hundred-board",
      event: "lesson_completed",
      success: true,
      page: 10,
      totalPages: 10,
    });
  }, [placedCount]);

  useEffect(() => {
    return () => {
      clearFlashTimer();
      clearShakeTimer();
      clearIntroAnimationFrame();
      introRunIdRef.current += 1;
    };
  }, [clearFlashTimer, clearIntroAnimationFrame, clearShakeTimer]);

  const getRackPositionForNumber = useCallback(
    (number: number): [number, number, number] | null => {
      const rackIndex = rackNumbers.indexOf(number);
      if (rackIndex < 0) return null;
      return rackPositionForIndex(rackIndex);
    },
    [rackNumbers]
  );

  const getScatterPositionForNumber = useCallback(
    (number: number): [number, number, number] | null => {
      const rackIndex = rackNumbers.indexOf(number);
      if (rackIndex < 0) return null;
      return scatterPositionForIndex(rackIndex);
    },
    [rackNumbers]
  );

  const animateIntroTile = useCallback(
    (
      number: number,
      from: [number, number, number],
      to: [number, number, number],
      runId: number,
      duration = 720,
      arcHeight = 0.34
    ) =>
      new Promise<void>((resolve) => {
        const start = performance.now();
        const step = (now: number) => {
          if (introRunIdRef.current !== runId) {
            resolve();
            return;
          }

          const elapsed = now - start;
          const rawProgress = Math.min(elapsed / duration, 1);
          const easedProgress = 1 - (1 - rawProgress) ** 3;
          const arc = Math.sin(Math.PI * rawProgress) * arcHeight;
          const x = from[0] + (to[0] - from[0]) * easedProgress;
          const y = from[1] + (to[1] - from[1]) * easedProgress + arc;
          const z = from[2] + (to[2] - from[2]) * easedProgress;
          setIntroTilePositions((previous) => ({
            ...previous,
            [number]: [x, y, z],
          }));

          if (rawProgress >= 1) {
            introAnimationFrameRef.current = null;
            resolve();
            return;
          }

          introAnimationFrameRef.current = window.requestAnimationFrame(step);
        };

        clearIntroAnimationFrame();
        introAnimationFrameRef.current = window.requestAnimationFrame(step);
      }),
    [clearIntroAnimationFrame]
  );

  const runIntroDemo = useCallback(async () => {
    if (introState !== "pending") return;
    const runId = introRunIdRef.current + 1;
    introRunIdRef.current = runId;
    setIntroState("running");
    setShowBatchCompletion(false);
    setCompletedBatchStart(null);
    setActiveTile(null);
    setHoveredSlot(null);
    setPointerPoint(null);
    setShakingTile(null);
    setCorrectFlashSlot(null);
    setWrongFlashSlot(null);

    const scatterOne = getScatterPositionForNumber(1);
    const scatterTwo = getScatterPositionForNumber(2);
    const scatterThree = getScatterPositionForNumber(3);
    const rackOne = getRackPositionForNumber(1);
    const rackTwo = getRackPositionForNumber(2);
    const rackThree = getRackPositionForNumber(3);
    if (!scatterOne || !scatterTwo || !scatterThree || !rackOne || !rackTwo || !rackThree) {
      setIntroState("done");
      setSlotAssignments((previous) => ({ ...previous, 1: 1 }));
      setIntroTilePositions({});
      return;
    }

    const slotOne = slotInfoFromNumber(1);
    const slotTwo = slotInfoFromNumber(2);
    const slotThree = slotInfoFromNumber(3);
    const boardOne: [number, number, number] = [slotOne.centerX, PLACED_TILE_Y, slotOne.centerZ];
    const boardTwo: [number, number, number] = [slotTwo.centerX, PLACED_TILE_Y, slotTwo.centerZ];
    const boardThree: [number, number, number] = [slotThree.centerX, PLACED_TILE_Y, slotThree.centerZ];

    setIntroTilePositions({
      1: scatterOne,
      2: scatterTwo,
      3: scatterThree,
    });

    await animateIntroTile(1, scatterOne, boardOne, runId, 860, 0.4);
    if (introRunIdRef.current !== runId) return;
    setSlotAssignments((previous) => ({ ...previous, 1: 1 }));
    setIntroTilePositions((previous) => {
      const next = { ...previous };
      delete next[1];
      return next;
    });
    showCorrectFlash(1);
    await delay(200);
    if (introRunIdRef.current !== runId) return;

    await animateIntroTile(2, scatterTwo, boardTwo, runId, 760, 0.33);
    if (introRunIdRef.current !== runId) return;
    setSlotAssignments((previous) => ({ ...previous, 2: 2 }));
    setIntroTilePositions((previous) => {
      const next = { ...previous };
      delete next[2];
      return next;
    });
    showCorrectFlash(2);
    await delay(180);
    if (introRunIdRef.current !== runId) return;

    await animateIntroTile(3, scatterThree, boardThree, runId, 760, 0.33);
    if (introRunIdRef.current !== runId) return;
    setSlotAssignments((previous) => ({ ...previous, 3: 3 }));
    setIntroTilePositions((previous) => {
      const next = { ...previous };
      delete next[3];
      return next;
    });
    showCorrectFlash(3);

    await delay(2000);
    if (introRunIdRef.current !== runId) return;

    setSlotAssignments((previous) => {
      const next = { ...previous };
      delete next[3];
      return next;
    });
    setIntroTilePositions((previous) => ({
      ...previous,
      3: boardThree,
    }));
    await animateIntroTile(3, boardThree, rackThree, runId, 700, 0.28);
    if (introRunIdRef.current !== runId) return;
    setIntroTilePositions((previous) => {
      const next = { ...previous };
      delete next[3];
      return next;
    });

    setSlotAssignments((previous) => {
      const next = { ...previous };
      delete next[2];
      return next;
    });
    setIntroTilePositions((previous) => ({
      ...previous,
      2: boardTwo,
    }));
    await animateIntroTile(2, boardTwo, rackTwo, runId, 700, 0.28);
    if (introRunIdRef.current !== runId) return;
    setIntroTilePositions((previous) => {
      const next = { ...previous };
      delete next[2];
      return next;
    });

    setIntroState("done");
    trackLessonEvent({
      lesson: "mathematics:hundred-board",
      activity: "batch-1",
      event: "intro_completed",
      success: true,
      page: 1,
      totalPages: 10,
    });
  }, [animateIntroTile, getRackPositionForNumber, getScatterPositionForNumber, introState, showCorrectFlash]);

  const handleTileGrab = (number: number, point: PointerPoint) => {
    if (currentBatchStart === 1 && introState !== "done") return;
    if (slotAssignments[number]) return;
    setActiveTile(number);
    setPointerPoint(point);
    setShakingTile(null);
    trackLessonEvent({
      lesson: "mathematics:hundred-board",
      activity: `batch-${batchIndex}`,
      event: "tile_selected",
      value: String(number),
      page: batchIndex,
      totalPages: 10,
    });
  };

  const changeBatch = (nextStart: number) => {
    introRunIdRef.current += 1;
    clearIntroAnimationFrame();
    setIntroTilePositions({});
    if (nextStart !== 1) {
      setIntroState("done");
    } else {
      setIntroState(slotAssignments[1] ? "done" : "pending");
    }
    setShowBatchCompletion(false);
    setCompletedBatchStart(null);
    setCurrentBatchStart(nextStart);
    setActiveTile(null);
    setHoveredSlot(null);
    setPointerPoint(null);
    setShakingTile(null);
  };

  const handleResetBoard = () => {
    introRunIdRef.current += 1;
    clearIntroAnimationFrame();
    clearFlashTimer();
    clearShakeTimer();
    setSlotAssignments({});
    setCurrentBatchStart(1);
    setActiveTile(null);
    setHoveredSlot(null);
    setPointerPoint(null);
    setCorrectFlashSlot(null);
    setWrongFlashSlot(null);
    setShakingTile(null);
    setIntroTilePositions({});
    setIntroState("pending");
    setShowBatchCompletion(false);
    setCompletedBatchStart(null);
    completedBatchesRef.current = {};
    completionLoggedRef.current = false;
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(COMPLETION_KEY);
    }
    trackLessonEvent({
      lesson: "mathematics:hundred-board",
      event: "lesson_reset",
      page: 1,
      totalPages: 10,
    });
  };

  const handleZoomReset = useCallback(() => {
    const controls = controlsRef.current;
    if (!controls) return;
    const camera = controls.object as THREE.PerspectiveCamera;
    camera.position.set(0.95, 5.731, 5.85);
    camera.fov = 47;
    camera.updateProjectionMatrix();
    controls.target.set(0.75, 0.02, 0.3);
    controls.update();
  }, []);

  const handleAdvanceBatch = useCallback(() => {
    if (completedBatchStart === null || completedBatchStart >= 91) {
      setShowBatchCompletion(false);
      return;
    }
    const nextStart = Math.min(completedBatchStart + 10, 91);
    introRunIdRef.current += 1;
    clearIntroAnimationFrame();
    setIntroTilePositions({});
    if (nextStart !== 1) {
      setIntroState("done");
    }
    setShowBatchCompletion(false);
    setCompletedBatchStart(null);
    setCurrentBatchStart(nextStart);
    setActiveTile(null);
    setHoveredSlot(null);
    setPointerPoint(null);
    setShakingTile(null);
  }, [clearIntroAnimationFrame, completedBatchStart]);

  const completedBatchIndex =
    completedBatchStart === null ? null : Math.floor((completedBatchStart - 1) / 10) + 1;
  const isFinalCompletedBatch = completedBatchStart !== null && completedBatchStart >= 91;
  const introLocked = currentBatchStart === 1 && introState !== "done";

  return (
    <div className="relative min-h-screen bg-[radial-gradient(circle_at_top,#f5efe6_0%,#fdfbf8_45%,#f7efe4_100%)]">
      <HomeLink />
      <main className="mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-5 px-6 py-10 sm:px-10">
        <header className="space-y-2 text-center">
          <p className="text-xs uppercase tracking-[0.3em] text-stone-400">Mathematics</p>
          <h1 className="font-display text-4xl font-semibold text-stone-900">Hundred Board</h1>
          <p className="text-sm text-stone-600">All tiles are on the workmat. Pick one on the left and place it on the board.</p>
        </header>

        <section className="rounded-[36px] border border-stone-200 bg-white/90 p-3 shadow-[0_45px_90px_-55px_rgba(15,23,42,0.7)] sm:p-5">
          <div className="relative h-[720px] overflow-hidden rounded-[30px] border border-stone-200 bg-[#efe6d8]">
            <Canvas
              shadows
              camera={{ position: [0.95, 5.731, 5.85], fov: 47 }}
              onCreated={({ camera }) => {
                camera.lookAt(0.75, 0.02, 0.3);
              }}
            >
              <HundredBoardScene
                slotAssignments={slotAssignments}
                rackNumbers={rackNumbers}
                activeTile={activeTile}
                availableTiles={availableTiles}
                hiddenRackNumbers={Object.keys(introTilePositions).map((value) => Number(value))}
                hoveredSlot={hoveredSlot}
                pointerPoint={pointerPoint}
                shakingTile={shakingTile}
                correctFlashSlot={correctFlashSlot}
                wrongFlashSlot={wrongFlashSlot}
                rackMode={currentBatchStart === 1 && introState === "pending" ? "scatter" : "stacked"}
                onTileGrab={handleTileGrab}
                onHoverChange={handleHoverChange}
                onDropAtSlot={handleDropAtSlot}
              />
              {Object.entries(introTilePositions).map(([number, position]) => (
                <NumberTile key={`intro-${number}`} number={Number(number)} position={position} tone="rack" />
              ))}
              <OrbitControls
                ref={controlsRef}
                enablePan
                enableZoom
                enableRotate={activeTile === null && introState !== "running"}
                minPolarAngle={Math.PI / 4.2}
                maxPolarAngle={Math.PI / 2.05}
                minAzimuthAngle={-Math.PI / 2.4}
                maxAzimuthAngle={Math.PI / 2.2}
                minDistance={4.7}
                maxDistance={8.8}
                target={[0.75, 0.02, 0.3]}
                mouseButtons={{
                  LEFT: THREE.MOUSE.ROTATE,
                  MIDDLE: THREE.MOUSE.DOLLY,
                  RIGHT: THREE.MOUSE.PAN,
                }}
                touches={{
                  ONE: THREE.TOUCH.ROTATE,
                  TWO: THREE.TOUCH.DOLLY_PAN,
                }}
              />
            </Canvas>
            <ZoomResetButton onClick={handleZoomReset} />
            {currentBatchStart === 1 && introState === "pending" ? (
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                <div className="pointer-events-auto rounded-2xl border border-emerald-200 bg-white/95 px-6 py-5 text-center shadow-xl">
                  <p className="text-lg font-bold uppercase tracking-[0.18em] text-emerald-700">Hundred Board Lesson</p>
                  <button
                    type="button"
                    onClick={runIntroDemo}
                    className="mt-4 rounded-full bg-emerald-600 px-5 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-white transition hover:bg-emerald-700"
                  >
                    Start Lesson
                  </button>
                </div>
              </div>
            ) : null}
            {currentBatchStart === 1 && introState === "running" ? (
              <div className="pointer-events-none absolute left-1/2 top-4 -translate-x-1/2 rounded-full border border-emerald-200 bg-white/95 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-emerald-700 shadow">
                Lesson Demo Running
              </div>
            ) : null}
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-stone-200 bg-white/90 px-4 py-3">
            <div>
              <p className="text-[11px] uppercase tracking-[0.3em] text-stone-500">Hundred Board</p>
              <p className="text-sm font-semibold text-stone-900">
                Batch {batchIndex} · {currentBatchStart}-{currentBatchStart + 9}
              </p>
              <p className="text-sm text-stone-600">Placed {placedCount} / 100</p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => changeBatch(Math.max(1, currentBatchStart - 10))}
                disabled={currentBatchStart <= 1 || introLocked}
                className="rounded-full border border-stone-300 bg-stone-50 px-4 py-2 text-xs uppercase tracking-[0.24em] text-stone-700 disabled:opacity-35"
              >
                Prev 10
              </button>
              <button
                type="button"
                onClick={() => changeBatch(Math.min(91, currentBatchStart + 10))}
                disabled={currentBatchStart >= 91 || introLocked}
                className="rounded-full border border-stone-300 bg-stone-50 px-4 py-2 text-xs uppercase tracking-[0.24em] text-stone-700 disabled:opacity-35"
              >
                Next 10
              </button>
              <button
                type="button"
                onClick={handleResetBoard}
                disabled={introState === "running"}
                className="rounded-full border border-rose-200 bg-rose-50 px-4 py-2 text-xs uppercase tracking-[0.24em] text-rose-700 disabled:opacity-35"
              >
                Reset Board
              </button>
            </div>
          </div>
        </section>

        <MaterialTeachersGuide guide={HUNDRED_BOARD_TEACHERS_GUIDE} className="mb-2" />
      </main>
      <CompletionOverlay
        open={showBatchCompletion}
        title={isFinalCompletedBatch ? "Lesson Complete" : "Stage Complete"}
        message={
          isFinalCompletedBatch
            ? "Fantastic work. You completed all 100 tiles."
            : `Batch ${completedBatchIndex ?? batchIndex} complete. Ready for the next 10 numbers.`
        }
        primaryAction={
          isFinalCompletedBatch
            ? { href: "/lessons/mathematics", label: "Back to Mathematics" }
            : { onClick: handleAdvanceBatch, label: "Next 10" }
        }
        secondaryAction={{ onClick: () => setShowBatchCompletion(false), label: "Stay Here" }}
      />
    </div>
  );
}
