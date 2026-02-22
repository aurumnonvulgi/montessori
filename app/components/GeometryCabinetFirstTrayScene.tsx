"use client";

import { Canvas, type ThreeEvent } from "@react-three/fiber";
import { useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { speakWithPreferredVoice } from "../lib/speech";

type PieceKind = "circle" | "square" | "triangle";
type PieceId = "circle" | "square" | "triangle";

type PieceDefinition = {
  id: PieceId;
  kind: PieceKind;
  label: string;
  color: string;
  radius?: number;
  side?: number;
  width?: number;
  height?: number;
};

type PiecePosition = {
  x: number;
  y: number;
};

type DragState = {
  id: PieceId;
  offsetX: number;
  offsetY: number;
} | null;

type GeometryCabinetFirstTraySceneProps = {
  preview?: boolean;
  className?: string;
};

const SVG_WIDTH = 1366;
const SVG_HEIGHT = 768;

const BOARD_WIDTH = 12.5;
const BOARD_SCALE = BOARD_WIDTH / SVG_WIDTH;
const BOARD_HEIGHT = SVG_HEIGHT * BOARD_SCALE;
const BOARD_THICKNESS = 0.18;
const DRAG_PLANE_Z = BOARD_THICKNESS / 2 + 0.08;
const PIECE_THICKNESS = 0.1;
const PIECE_Z = DRAG_PLANE_Z;
const KNOB_STEM_RADIUS = BOARD_SCALE * 5.5;
const KNOB_STEM_HEIGHT = BOARD_SCALE * 10;
const KNOB_CAP_RADIUS = BOARD_SCALE * 8;
const KNOB_CAP_Y_SCALE = 0.78;
const KNOB_BASE_Z = PIECE_THICKNESS / 2 + 0.004;
const KNOB_STEM_CENTER_Z = KNOB_BASE_Z + KNOB_STEM_HEIGHT / 2;
const KNOB_CAP_CENTER_Z = KNOB_BASE_Z + KNOB_STEM_HEIGHT + KNOB_CAP_RADIUS * KNOB_CAP_Y_SCALE;
const SLOT_RIM_WIDTH = BOARD_SCALE * 10;
const SLOT_FRAME_HEIGHT = 0.05;
const SLOT_SURFACE_Z = 0.003;
const SLOT_FRAME_CENTER_Z = SLOT_SURFACE_Z + SLOT_FRAME_HEIGHT / 2;

const WOOD_PANEL_RECT = {
  x: 317.05,
  y: 257.89,
  width: 731.9,
  height: 491.16,
};

const SLOT_RECTS = [
  { x: 338.32, y: 277.23, width: 213.67, height: 213.67 },
  { x: 576.35, y: 277.23, width: 213.67, height: 213.67 },
  { x: 814.37, y: 277.23, width: 213.67, height: 213.67 },
  { x: 338.32, y: 513.19, width: 213.67, height: 213.67 },
  { x: 576.35, y: 513.19, width: 213.67, height: 213.67 },
  { x: 814.37, y: 513.19, width: 213.67, height: 213.67 },
];

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

const toWorld = (x: number, y: number) => ({
  x: (x - SVG_WIDTH / 2) * BOARD_SCALE,
  y: (SVG_HEIGHT / 2 - y) * BOARD_SCALE,
});

const toWorldRect = (x: number, y: number, width: number, height: number) => {
  const center = toWorld(x + width / 2, y + height / 2);
  return {
    x: center.x,
    y: center.y,
    width: width * BOARD_SCALE,
    height: height * BOARD_SCALE,
  };
};

const WOOD_PANEL = toWorldRect(
  WOOD_PANEL_RECT.x,
  WOOD_PANEL_RECT.y,
  WOOD_PANEL_RECT.width,
  WOOD_PANEL_RECT.height
);

const BOARD_SLOTS = SLOT_RECTS.map((slot) =>
  toWorldRect(slot.x, slot.y, slot.width, slot.height)
);

const pieceDefinitions: PieceDefinition[] = [
  {
    id: "circle",
    kind: "circle",
    label: "Circle",
    color: "#2e78c7",
    radius: 77.42 * BOARD_SCALE,
  },
  {
    id: "square",
    kind: "square",
    label: "Square",
    color: "#2e78c7",
    side: 154.88 * BOARD_SCALE,
  },
  {
    id: "triangle",
    kind: "triangle",
    label: "Triangle",
    color: "#2e78c7",
    width: 170.94 * BOARD_SCALE,
    height: 148.04 * BOARD_SCALE,
  },
];

const initialPiecePositions: Record<PieceId, PiecePosition> = {
  circle: toWorld(445.16, 384.06),
  square: toWorld(921.21, 384.06),
  triangle: toWorld(683, (546.01 + 694.05 + 694.05) / 3),
};

const getPieceHalfBounds = (piece: PieceDefinition) => {
  if (piece.kind === "circle") {
    const radius = piece.radius ?? 0.8;
    return { halfWidth: radius, halfHeight: radius };
  }
  if (piece.kind === "square") {
    const half = (piece.side ?? 1.6) / 2;
    return { halfWidth: half, halfHeight: half };
  }
  return {
    halfWidth: (piece.width ?? 1.8) / 2,
    halfHeight: (piece.height ?? 1.6) / 2,
  };
};

const clampPiecePosition = (piece: PieceDefinition, position: PiecePosition): PiecePosition => {
  const { halfWidth, halfHeight } = getPieceHalfBounds(piece);
  const xMin = -BOARD_WIDTH / 2 + halfWidth;
  const xMax = BOARD_WIDTH / 2 - halfWidth;
  const yMin = -BOARD_HEIGHT / 2 + halfHeight;
  const yMax = BOARD_HEIGHT / 2 - halfHeight;
  return {
    x: clamp(position.x, xMin, xMax),
    y: clamp(position.y, yMin, yMax),
  };
};

function DraggablePiece({
  piece,
  position,
  onPointerDown,
}: {
  piece: PieceDefinition;
  position: PiecePosition;
  onPointerDown: (id: PieceId, event: ThreeEvent<PointerEvent>) => void;
}) {
  const triangleGeometry = useMemo(() => {
    if (piece.kind !== "triangle") return null;
    const width = piece.width ?? 1.8;
    const height = piece.height ?? 1.6;
    const shape = new THREE.Shape();
    shape.moveTo(-width / 2, -height / 2);
    shape.lineTo(width / 2, -height / 2);
    shape.lineTo(0, height / 2);
    shape.closePath();
    const geometry = new THREE.ExtrudeGeometry(shape, {
      depth: PIECE_THICKNESS,
      bevelEnabled: false,
    });
    geometry.center();
    return geometry;
  }, [piece.height, piece.kind, piece.width]);

  return (
    <group position={[position.x, position.y, PIECE_Z]}>
      {piece.kind === "circle" ? (
        <mesh castShadow receiveShadow rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[piece.radius ?? 0.8, piece.radius ?? 0.8, PIECE_THICKNESS, 48]} />
          <meshStandardMaterial color={piece.color} roughness={0.45} metalness={0.08} />
        </mesh>
      ) : null}

      {piece.kind === "square" ? (
        <mesh castShadow receiveShadow>
          <boxGeometry args={[piece.side ?? 1.6, piece.side ?? 1.6, PIECE_THICKNESS]} />
          <meshStandardMaterial color={piece.color} roughness={0.45} metalness={0.08} />
        </mesh>
      ) : null}

      {piece.kind === "triangle" && triangleGeometry ? (
        <mesh geometry={triangleGeometry} castShadow receiveShadow>
          <meshStandardMaterial color={piece.color} roughness={0.45} metalness={0.08} />
        </mesh>
      ) : null}

      <mesh position={[0, 0, KNOB_STEM_CENTER_Z]} onPointerDown={(event) => onPointerDown(piece.id, event)} castShadow receiveShadow>
        <cylinderGeometry args={[KNOB_STEM_RADIUS, KNOB_STEM_RADIUS, KNOB_STEM_HEIGHT, 18]} />
        <meshStandardMaterial color="#d9b58c" roughness={0.52} metalness={0.04} />
      </mesh>
      <mesh
        position={[0, 0, KNOB_CAP_CENTER_Z]}
        scale={[1, KNOB_CAP_Y_SCALE, 1]}
        onPointerDown={(event) => onPointerDown(piece.id, event)}
        castShadow
        receiveShadow
      >
        <sphereGeometry args={[KNOB_CAP_RADIUS, 20, 16]} />
        <meshStandardMaterial color="#e2c39d" roughness={0.5} metalness={0.05} />
      </mesh>

      {piece.kind === "circle" ? (
        <mesh onPointerDown={(event) => onPointerDown(piece.id, event)} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[(piece.radius ?? 0.8) * 1.12, (piece.radius ?? 0.8) * 1.12, PIECE_THICKNESS * 1.8, 32]} />
          <meshBasicMaterial transparent opacity={0} depthWrite={false} />
        </mesh>
      ) : null}

      {piece.kind === "square" ? (
        <mesh onPointerDown={(event) => onPointerDown(piece.id, event)}>
          <boxGeometry args={[(piece.side ?? 1.6) * 1.12, (piece.side ?? 1.6) * 1.12, PIECE_THICKNESS * 1.8]} />
          <meshBasicMaterial transparent opacity={0} depthWrite={false} />
        </mesh>
      ) : null}

      {piece.kind === "triangle" && triangleGeometry ? (
        <mesh geometry={triangleGeometry} scale={[1.12, 1.12, 1.2]} onPointerDown={(event) => onPointerDown(piece.id, event)}>
          <meshBasicMaterial transparent opacity={0} depthWrite={false} />
        </mesh>
      ) : null}
    </group>
  );
}

function GeometryBoard({
  positions,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  dragging,
}: {
  positions: Record<PieceId, PiecePosition>;
  onPointerDown: (id: PieceId, event: ThreeEvent<PointerEvent>) => void;
  onPointerMove: (event: ThreeEvent<PointerEvent>) => void;
  onPointerUp: (event: ThreeEvent<PointerEvent>) => void;
  dragging: boolean;
}) {
  return (
    <group>
      <ambientLight intensity={0.84} />
      <directionalLight
        position={[4, 5, 8]}
        intensity={0.62}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-radius={7}
        shadow-bias={-0.00015}
        shadow-normalBias={0.02}
      />
      <directionalLight position={[-3, 2, -2]} intensity={0.32} />

      <mesh position={[0, 0, -BOARD_THICKNESS / 2]} receiveShadow castShadow>
        <boxGeometry args={[BOARD_WIDTH, BOARD_HEIGHT, BOARD_THICKNESS]} />
        <meshStandardMaterial color="#9f7a51" roughness={0.88} metalness={0.02} />
      </mesh>

      <mesh position={[0, 0, 0.001]} receiveShadow>
        <planeGeometry args={[BOARD_WIDTH, BOARD_HEIGHT]} />
        <meshStandardMaterial color="#b8e0f4" roughness={0.94} metalness={0} />
      </mesh>

      <mesh position={[WOOD_PANEL.x, WOOD_PANEL.y, 0.002]} receiveShadow>
        <planeGeometry args={[WOOD_PANEL.width, WOOD_PANEL.height]} />
        <meshStandardMaterial color="#b18c62" roughness={0.9} metalness={0.01} />
      </mesh>

      {BOARD_SLOTS.map((slot, index) => {
        const innerWidth = Math.max(0.08, slot.width - SLOT_RIM_WIDTH * 2);
        const innerHeight = Math.max(0.08, slot.height - SLOT_RIM_WIDTH * 2);
        const horizontalRimY = slot.height / 2 - SLOT_RIM_WIDTH / 2;
        const verticalRimX = slot.width / 2 - SLOT_RIM_WIDTH / 2;

        return (
          <group key={`slot-${index}`} position={[slot.x, slot.y, 0]}>
            <mesh position={[0, 0, SLOT_SURFACE_Z]} receiveShadow>
              <planeGeometry args={[innerWidth, innerHeight]} />
              <meshStandardMaterial color="#dac802" roughness={0.82} metalness={0} />
            </mesh>

            <mesh position={[0, horizontalRimY, SLOT_FRAME_CENTER_Z]} castShadow receiveShadow>
              <boxGeometry args={[slot.width, SLOT_RIM_WIDTH, SLOT_FRAME_HEIGHT]} />
              <meshStandardMaterial color="#6f4a2a" roughness={0.86} metalness={0.01} />
            </mesh>
            <mesh position={[0, -horizontalRimY, SLOT_FRAME_CENTER_Z]} castShadow receiveShadow>
              <boxGeometry args={[slot.width, SLOT_RIM_WIDTH, SLOT_FRAME_HEIGHT]} />
              <meshStandardMaterial color="#6f4a2a" roughness={0.86} metalness={0.01} />
            </mesh>
            <mesh position={[verticalRimX, 0, SLOT_FRAME_CENTER_Z]} castShadow receiveShadow>
              <boxGeometry args={[SLOT_RIM_WIDTH, slot.height, SLOT_FRAME_HEIGHT]} />
              <meshStandardMaterial color="#6f4a2a" roughness={0.86} metalness={0.01} />
            </mesh>
            <mesh position={[-verticalRimX, 0, SLOT_FRAME_CENTER_Z]} castShadow receiveShadow>
              <boxGeometry args={[SLOT_RIM_WIDTH, slot.height, SLOT_FRAME_HEIGHT]} />
              <meshStandardMaterial color="#6f4a2a" roughness={0.86} metalness={0.01} />
            </mesh>
          </group>
        );
      })}

      {pieceDefinitions.map((piece) => (
        <DraggablePiece
          key={piece.id}
          piece={piece}
          position={positions[piece.id]}
          onPointerDown={onPointerDown}
        />
      ))}

      {dragging ? (
        <mesh position={[0, 0, DRAG_PLANE_Z]} onPointerMove={onPointerMove} onPointerUp={onPointerUp} onPointerLeave={onPointerUp}>
          <planeGeometry args={[BOARD_WIDTH * 3, BOARD_HEIGHT * 3]} />
          <meshBasicMaterial transparent opacity={0} depthWrite={false} />
        </mesh>
      ) : null}
    </group>
  );
}

export default function GeometryCabinetFirstTrayScene({
  preview = false,
  className,
}: GeometryCabinetFirstTraySceneProps) {
  const dragPlaneRef = useRef(new THREE.Plane(new THREE.Vector3(0, 0, 1), -DRAG_PLANE_Z));
  const dragPointRef = useRef(new THREE.Vector3());
  const [positions, setPositions] = useState<Record<PieceId, PiecePosition>>(initialPiecePositions);
  const [dragState, setDragState] = useState<DragState>(null);
  const [presentationStarted, setPresentationStarted] = useState(false);

  const updatePiecePosition = (id: PieceId, nextPosition: PiecePosition) => {
    const piece = pieceDefinitions.find((item) => item.id === id);
    if (!piece) return;
    const clamped = clampPiecePosition(piece, nextPosition);
    setPositions((current) => ({ ...current, [id]: clamped }));
  };

  const getDragPoint = (event: ThreeEvent<PointerEvent>) => {
    const hit = event.ray.intersectPlane(dragPlaneRef.current, dragPointRef.current);
    if (hit) return hit;
    return event.point;
  };

  const handlePiecePointerDown = (id: PieceId, event: ThreeEvent<PointerEvent>) => {
    if (preview) return;
    event.stopPropagation();
    event.nativeEvent.preventDefault();
    const piece = pieceDefinitions.find((item) => item.id === id);
    if (piece) {
      speakWithPreferredVoice(piece.label, { rate: 0.88, pitch: 0.95, volume: 0.9, lang: "en-US" });
    }
    const pointerTarget = event.nativeEvent.target as
      | (EventTarget & {
          setPointerCapture?: (pointerId: number) => void;
        })
      | null;
    pointerTarget?.setPointerCapture?.(event.pointerId);
    const hit = getDragPoint(event);
    const activePosition = positions[id];
    setDragState({
      id,
      offsetX: activePosition.x - hit.x,
      offsetY: activePosition.y - hit.y,
    });
  };

  const handlePointerMove = (event: ThreeEvent<PointerEvent>) => {
    if (!dragState) return;
    event.stopPropagation();
    event.nativeEvent.preventDefault();
    const hit = getDragPoint(event);
    updatePiecePosition(dragState.id, {
      x: hit.x + dragState.offsetX,
      y: hit.y + dragState.offsetY,
    });
  };

  const handlePointerUp = (event: ThreeEvent<PointerEvent>) => {
    if (!dragState) return;
    event.stopPropagation();
    event.nativeEvent.preventDefault();
    const pointerTarget = event.nativeEvent.target as
      | (EventTarget & {
          releasePointerCapture?: (pointerId: number) => void;
        })
      | null;
    pointerTarget?.releasePointerCapture?.(event.pointerId);
    setDragState(null);
  };

  return (
    <div className={`${preview ? "h-full w-full" : "w-full"} ${className ?? ""}`}>
      <div
        className={
          preview
            ? "pointer-events-none select-none relative h-full w-full overflow-hidden rounded-[24px] border border-cyan-200 bg-white/80 shadow-inner"
            : "relative w-full overflow-hidden rounded-3xl border border-cyan-200 bg-white/80 shadow-[0_30px_80px_-50px_rgba(15,23,42,0.7)]"
        }
      >
        {!preview && !presentationStarted ? (
          <div className="pointer-events-none absolute inset-x-0 top-4 z-20 flex justify-center px-4">
            <button
              type="button"
              onClick={() => setPresentationStarted(true)}
              className="pointer-events-auto inline-flex items-center justify-center rounded-full border border-cyan-300 bg-white/95 px-6 py-2 text-xs font-semibold uppercase tracking-[0.28em] text-cyan-700 shadow-[0_10px_24px_-14px_rgba(15,23,42,0.75)]"
            >
              Start Presentation
            </button>
          </div>
        ) : null}
        <div className={preview ? "h-full w-full touch-none" : "aspect-[16/9] w-full touch-none"}>
          <Canvas
            frameloop={preview ? "demand" : "always"}
            camera={
              preview
                ? { position: [0, 0.3, 13.2], fov: 36 }
                : { position: [0, 0.35, 14.2], fov: 38 }
            }
            shadows={{ type: THREE.PCFSoftShadowMap }}
            dpr={preview ? [1, 1.6] : [1.5, 2.5]}
          >
            <GeometryBoard
              positions={positions}
              onPointerDown={handlePiecePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              dragging={Boolean(dragState)}
            />
          </Canvas>
        </div>
      </div>

      {!preview ? (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-cyan-200 bg-cyan-50/70 px-4 py-3">
          <p className="text-xs uppercase tracking-[0.25em] text-cyan-700">
            Drag the circle, square, and triangle on the board.
          </p>
          <button
            type="button"
            onClick={() => setPositions(initialPiecePositions)}
            className="inline-flex items-center justify-center rounded-full border border-cyan-300 bg-white px-4 py-1.5 text-xs uppercase tracking-[0.25em] text-cyan-700"
          >
            Reset Pieces
          </button>
        </div>
      ) : null}
    </div>
  );
}
