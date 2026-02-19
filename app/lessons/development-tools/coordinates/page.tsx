"use client";

import { Canvas, type ThreeEvent } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import * as THREE from "three";
import HomeLink from "../../../components/HomeLink";

type CoordinateRecord = {
  id: number;
  x: number;
  y: number;
  z: number;
};

type DraggableSquareProps = {
  position: [number, number, number];
  onMove: (position: [number, number, number]) => void;
  onDrop: (position: [number, number, number]) => void;
  onDragStateChange: (dragging: boolean) => void;
};

const MAT_WIDTH = 9.8;
const MAT_DEPTH = 6.6;
const MAT_TOP_Y = 0.02;
const SQUARE_SIZE = 0.72;
const SQUARE_HEIGHT = 0.16;
const SQUARE_Y = MAT_TOP_Y + SQUARE_HEIGHT / 2;
const STORAGE_KEY = "dev-tools-coordinates-records";

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));
const round = (value: number) => Number(value.toFixed(3));

function DraggableSquare({ position, onMove, onDrop, onDragStateChange }: DraggableSquareProps) {
  const [dragging, setDragging] = useState(false);
  const plane = useMemo(() => new THREE.Plane(new THREE.Vector3(0, 1, 0), -MAT_TOP_Y), []);
  const intersection = useMemo(() => new THREE.Vector3(), []);

  const toClampedPosition = useCallback(
    (event: ThreeEvent<PointerEvent>): [number, number, number] => {
      const hit = event.ray.intersectPlane(plane, intersection);
      const xLimit = MAT_WIDTH / 2 - SQUARE_SIZE / 2;
      const zLimit = MAT_DEPTH / 2 - SQUARE_SIZE / 2;
      const nextX = clamp(hit?.x ?? position[0], -xLimit, xLimit);
      const nextZ = clamp(hit?.z ?? position[2], -zLimit, zLimit);
      return [round(nextX), SQUARE_Y, round(nextZ)];
    },
    [intersection, plane, position]
  );

  const startDragging = (event: ThreeEvent<PointerEvent>) => {
    event.stopPropagation();
    const target = event.target as Element | null;
    if (target && "setPointerCapture" in target) {
      (target as Element & { setPointerCapture: (pointerId: number) => void }).setPointerCapture(event.pointerId);
    }
    const nextPosition = toClampedPosition(event);
    setDragging(true);
    onDragStateChange(true);
    onMove(nextPosition);
  };

  const moveDragging = (event: ThreeEvent<PointerEvent>) => {
    if (!dragging) return;
    event.stopPropagation();
    const nextPosition = toClampedPosition(event);
    onMove(nextPosition);
  };

  const endDragging = (event: ThreeEvent<PointerEvent>) => {
    if (!dragging) return;
    event.stopPropagation();
    const target = event.target as Element | null;
    if (target && "releasePointerCapture" in target) {
      (target as Element & { releasePointerCapture: (pointerId: number) => void }).releasePointerCapture(
        event.pointerId
      );
    }
    const nextPosition = toClampedPosition(event);
    setDragging(false);
    onDragStateChange(false);
    onMove(nextPosition);
    onDrop(nextPosition);
  };

  return (
    <mesh
      position={position}
      castShadow
      receiveShadow
      onPointerDown={startDragging}
      onPointerMove={moveDragging}
      onPointerUp={endDragging}
      onPointerCancel={endDragging}
    >
      <boxGeometry args={[SQUARE_SIZE, SQUARE_HEIGHT, SQUARE_SIZE]} />
      <meshStandardMaterial color={dragging ? "#10b981" : "#f8fafc"} roughness={0.28} metalness={0.05} />
    </mesh>
  );
}

function CoordinatesScene({
  squarePosition,
  onSquareMove,
  onSquareDrop,
  onDragStateChange,
}: {
  squarePosition: [number, number, number];
  onSquareMove: (position: [number, number, number]) => void;
  onSquareDrop: (position: [number, number, number]) => void;
  onDragStateChange: (dragging: boolean) => void;
}) {
  return (
    <>
      <ambientLight intensity={0.75} />
      <directionalLight
        position={[2.4, 4.9, 2.5]}
        intensity={0.82}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
      />
      <directionalLight position={[-2.7, 3.8, -2.4]} intensity={0.25} />

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]} receiveShadow>
        <planeGeometry args={[12, 8.5]} />
        <meshStandardMaterial color="#d7d2c5" roughness={0.9} metalness={0} />
      </mesh>

      <mesh position={[0, MAT_TOP_Y - 0.02, 0]} castShadow receiveShadow>
        <boxGeometry args={[MAT_WIDTH + 0.65, 0.04, MAT_DEPTH + 0.65]} />
        <meshStandardMaterial color="#b7b2a6" roughness={0.86} metalness={0.03} />
      </mesh>

      <mesh position={[0, MAT_TOP_Y, 0]} receiveShadow>
        <boxGeometry args={[MAT_WIDTH, 0.01, MAT_DEPTH]} />
        <meshStandardMaterial color="#ece7d8" roughness={0.9} metalness={0} />
      </mesh>

      {Array.from({ length: 13 }, (_, index) => {
        const x = -MAT_WIDTH / 2 + (MAT_WIDTH / 12) * index;
        return (
          <mesh key={`v-${index}`} position={[x, MAT_TOP_Y + 0.001, 0]}>
            <boxGeometry args={[0.003, 0.002, MAT_DEPTH]} />
            <meshStandardMaterial color="#a79f8f" roughness={0.9} metalness={0} />
          </mesh>
        );
      })}
      {Array.from({ length: 9 }, (_, index) => {
        const z = -MAT_DEPTH / 2 + (MAT_DEPTH / 8) * index;
        return (
          <mesh key={`h-${index}`} position={[0, MAT_TOP_Y + 0.001, z]}>
            <boxGeometry args={[MAT_WIDTH, 0.002, 0.003]} />
            <meshStandardMaterial color="#a79f8f" roughness={0.9} metalness={0} />
          </mesh>
        );
      })}

      <DraggableSquare
        position={squarePosition}
        onMove={onSquareMove}
        onDrop={onSquareDrop}
        onDragStateChange={onDragStateChange}
      />
    </>
  );
}

export default function CoordinatesToolPage() {
  const router = useRouter();
  const [squarePosition, setSquarePosition] = useState<[number, number, number]>([0, SQUARE_Y, 0]);
  const [dragging, setDragging] = useState(false);
  const [records, setRecords] = useState<CoordinateRecord[]>([]);
  const [copyLabel, setCopyLabel] = useState("Copy Records");
  const controlsRef = useRef<React.ElementRef<typeof OrbitControls> | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (!saved) return;
    try {
      const parsed = JSON.parse(saved) as CoordinateRecord[];
      if (Array.isArray(parsed)) {
        setRecords(parsed);
      }
    } catch {
      // Ignore malformed saved data.
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
  }, [records]);

  const recordDrop = (position: [number, number, number]) => {
    setRecords((previous) => [
      ...previous,
      {
        id: Date.now() + previous.length,
        x: round(position[0]),
        y: round(position[1]),
        z: round(position[2]),
      },
    ]);
  };

  const resetSquare = () => {
    const resetPosition: [number, number, number] = [0, SQUARE_Y, 0];
    setSquarePosition(resetPosition);
    recordDrop(resetPosition);
  };

  const clearRecords = () => {
    setRecords([]);
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  };

  const copyRecords = useCallback(async () => {
    const currentLine = `current: [${squarePosition[0]}, ${squarePosition[1]}, ${squarePosition[2]}]`;
    const lines = records.map(
      (record, index) => `${index + 1}. [${record.x}, ${record.y}, ${record.z}]`
    );
    const payload = [currentLine, "", "records:", ...lines].join("\n");
    try {
      await navigator.clipboard.writeText(payload);
      setCopyLabel("Copied");
      window.setTimeout(() => setCopyLabel("Copy Records"), 1200);
    } catch {
      setCopyLabel("Copy Failed");
      window.setTimeout(() => setCopyLabel("Copy Records"), 1500);
    }
  }, [records, squarePosition]);

  const resetCamera = () => {
    const controls = controlsRef.current;
    if (!controls) return;
    const camera = controls.object as THREE.PerspectiveCamera;
    camera.position.set(0.1, 3.4, 6.2);
    camera.fov = 46;
    camera.updateProjectionMatrix();
    controls.target.set(0, MAT_TOP_Y, 0);
    controls.update();
  };

  return (
    <div className="relative min-h-screen bg-[radial-gradient(circle_at_top,#f1faf6,#f8fffc_48%,#f3faf6)]">
      <HomeLink onBackClick={() => router.push("/lessons/development-tools")} />
      <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-6 px-6 py-10 sm:px-10">
        <header className="space-y-2 text-center">
          <p className="text-xs uppercase tracking-[0.35em] text-emerald-600">Development Tools</p>
          <h1 className="font-display text-4xl font-semibold text-slate-900">Coordinates</h1>
          <p className="text-sm text-slate-600">
            Drag the square on the playmat. Current coordinates update live, and each drop is recorded.
          </p>
        </header>

        <section className="rounded-[30px] border border-slate-200 bg-white/90 p-3 shadow-[0_35px_80px_-55px_rgba(15,23,42,0.65)] sm:p-5">
          <div className="relative h-[620px] overflow-hidden rounded-[24px] border border-slate-200 bg-[#ebe6dc]">
            <Canvas
              shadows
              camera={{ position: [0.1, 3.4, 6.2], fov: 46 }}
              onCreated={({ camera }) => {
                camera.lookAt(0, MAT_TOP_Y, 0);
              }}
            >
              <CoordinatesScene
                squarePosition={squarePosition}
                onSquareMove={setSquarePosition}
                onSquareDrop={recordDrop}
                onDragStateChange={setDragging}
              />
              <OrbitControls
                ref={controlsRef}
                enablePan
                enableZoom
                enableRotate={!dragging}
                minPolarAngle={Math.PI / 6}
                maxPolarAngle={Math.PI / 2.03}
                minDistance={3.8}
                maxDistance={11}
                target={[0, MAT_TOP_Y, 0]}
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
            <div className="pointer-events-none absolute left-1/2 top-4 -translate-x-1/2 rounded-full border border-white/80 bg-white/90 px-4 py-1 text-[10px] uppercase tracking-[0.28em] text-slate-600 shadow">
              Drag the white square to capture coordinates
            </div>
          </div>

          <div className="mt-4 grid gap-4 rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4 md:grid-cols-[1fr_auto]">
            <div className="space-y-1 text-sm text-slate-700">
              <p>
                <span className="font-semibold text-slate-900">Current Position</span>: [{squarePosition[0]},{" "}
                {squarePosition[1]}, {squarePosition[2]}]
              </p>
              <p className="text-xs text-slate-500">Records are added automatically when you release the square.</p>
            </div>
            <div className="flex items-center gap-2 md:flex-col md:justify-center">
              <button
                type="button"
                onClick={copyRecords}
                className="inline-flex min-w-[170px] items-center justify-center rounded-full border border-emerald-300 bg-emerald-500 px-5 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-emerald-600"
              >
                {copyLabel}
              </button>
              <button
                type="button"
                onClick={resetSquare}
                className="inline-flex min-w-[170px] items-center justify-center rounded-full border border-slate-300 bg-white px-5 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-700 transition hover:bg-slate-100"
              >
                Reset Square
              </button>
              <button
                type="button"
                onClick={resetCamera}
                className="inline-flex min-w-[170px] items-center justify-center rounded-full border border-slate-300 bg-white px-5 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-700 transition hover:bg-slate-100"
              >
                Reset Camera
              </button>
              <button
                type="button"
                onClick={clearRecords}
                className="inline-flex min-w-[170px] items-center justify-center rounded-full border border-rose-300 bg-rose-50 px-5 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-rose-700 transition hover:bg-rose-100"
              >
                Clear Records
              </button>
            </div>
          </div>

          <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4">
            <p className="text-xs uppercase tracking-[0.22em] text-slate-500">Recorded Coordinates ({records.length})</p>
            <div className="mt-3 max-h-44 overflow-auto rounded-xl border border-slate-200 bg-slate-50 p-2">
              {records.length === 0 ? (
                <p className="px-2 py-3 text-sm text-slate-500">No coordinates recorded yet.</p>
              ) : (
                <ul className="space-y-1 text-sm text-slate-700">
                  {records.map((record, index) => (
                    <li key={record.id} className="rounded-lg bg-white px-3 py-2">
                      {index + 1}. [{record.x}, {record.y}, {record.z}]
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
