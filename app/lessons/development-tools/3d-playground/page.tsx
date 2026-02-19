"use client";

import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { useCallback, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import * as THREE from "three";
import HomeLink from "../../../components/HomeLink";

type CameraSnapshot = {
  position: [number, number, number];
  target: [number, number, number];
  fov: number;
};

const round = (value: number) => Number(value.toFixed(3));

function PlaygroundScene() {
  return (
    <>
      <ambientLight intensity={0.72} />
      <directionalLight
        position={[2.2, 4.6, 2.4]}
        intensity={0.86}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
      />
      <directionalLight position={[-2.5, 4.0, -2.0]} intensity={0.26} />

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]} receiveShadow>
        <planeGeometry args={[11, 8]} />
        <meshStandardMaterial color="#d6d0c2" roughness={0.9} metalness={0} />
      </mesh>

      <mesh position={[0, 0.015, 0]} castShadow receiveShadow>
        <boxGeometry args={[6.5, 0.03, 4.6]} />
        <meshStandardMaterial color="#b7b1a5" roughness={0.85} metalness={0.02} />
      </mesh>

      <mesh position={[0, 0.03, 0]}>
        <boxGeometry args={[4.9, 0.045, 3.35]} />
        <meshStandardMaterial color="#ae8040" roughness={0.8} metalness={0.04} />
      </mesh>
      <mesh position={[0, 0.034, 0]}>
        <boxGeometry args={[4.45, 0.01, 2.9]} />
        <meshStandardMaterial color="#b7a178" roughness={0.84} metalness={0} />
      </mesh>

      {Array.from({ length: 11 }, (_, index) => {
        const minX = -2.225;
        const minZ = -1.45;
        const pitchX = 4.45 / 10;
        const pitchZ = 2.9 / 10;
        const x = minX + index * pitchX;
        const z = minZ + index * pitchZ;
        return (
          <group key={`grid-${index}`}>
            <mesh position={[x, 0.04, 0]}>
              <boxGeometry args={[0.006, 0.002, 2.9]} />
              <meshStandardMaterial color="#6f5a44" roughness={0.9} metalness={0} />
            </mesh>
            <mesh position={[0, 0.04, z]}>
              <boxGeometry args={[4.45, 0.002, 0.006]} />
              <meshStandardMaterial color="#6f5a44" roughness={0.9} metalness={0} />
            </mesh>
          </group>
        );
      })}
    </>
  );
}

export default function ThreeDPlaygroundPage() {
  const router = useRouter();
  const controlsRef = useRef<React.ElementRef<typeof OrbitControls> | null>(null);
  const [snapshot, setSnapshot] = useState<CameraSnapshot>({
    position: [0.9, 2.25, 5.85],
    target: [0, 0.02, 0.2],
    fov: 47,
  });
  const [copyLabel, setCopyLabel] = useState("Copy Coordinates");

  const updateSnapshotFromControls = useCallback(() => {
    const controls = controlsRef.current;
    if (!controls) return;
    const camera = controls.object as THREE.PerspectiveCamera;
    setSnapshot({
      position: [round(camera.position.x), round(camera.position.y), round(camera.position.z)],
      target: [round(controls.target.x), round(controls.target.y), round(controls.target.z)],
      fov: round(camera.fov),
    });
  }, []);

  const resetView = useCallback(() => {
    const controls = controlsRef.current;
    if (!controls) return;
    const camera = controls.object as THREE.PerspectiveCamera;
    camera.position.set(0.9, 2.25, 5.85);
    camera.fov = 47;
    camera.updateProjectionMatrix();
    controls.target.set(0, 0.02, 0.2);
    controls.update();
    updateSnapshotFromControls();
  }, [updateSnapshotFromControls]);

  const copyPayload = useMemo(() => {
    const [px, py, pz] = snapshot.position;
    const [tx, ty, tz] = snapshot.target;
    return [
      `camera.position = [${px}, ${py}, ${pz}]`,
      `camera.fov = ${snapshot.fov}`,
      `controls.target = [${tx}, ${ty}, ${tz}]`,
      `Canvas camera={{ position: [${px}, ${py}, ${pz}], fov: ${snapshot.fov} }}`,
      `OrbitControls target={[${tx}, ${ty}, ${tz}]}`,
    ].join("\n");
  }, [snapshot]);

  const copyCoordinates = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(copyPayload);
      setCopyLabel("Copied");
      window.setTimeout(() => setCopyLabel("Copy Coordinates"), 1200);
    } catch {
      setCopyLabel("Copy Failed");
      window.setTimeout(() => setCopyLabel("Copy Coordinates"), 1500);
    }
  }, [copyPayload]);

  return (
    <div className="relative min-h-screen bg-[radial-gradient(circle_at_top,#f4f7ff,#fafcff_45%,#f5f9ff)]">
      <HomeLink onBackClick={() => router.push("/lessons/development-tools")} />
      <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-6 px-6 py-10 sm:px-10">
        <header className="space-y-2 text-center">
          <p className="text-xs uppercase tracking-[0.35em] text-sky-500">Development Tools</p>
          <h1 className="font-display text-4xl font-semibold text-slate-900">3D Playground</h1>
          <p className="text-sm text-slate-600">
            Rotate, pan, and zoom. Live coordinates update as you move so you can share exact values.
          </p>
        </header>

        <section className="rounded-[30px] border border-slate-200 bg-white/90 p-3 shadow-[0_35px_80px_-55px_rgba(15,23,42,0.65)] sm:p-5">
          <div className="relative h-[640px] overflow-hidden rounded-[24px] border border-slate-200 bg-[#ebe6dc]">
            <Canvas
              shadows
              camera={{ position: [0.9, 2.25, 5.85], fov: 47 }}
              onCreated={({ camera }) => {
                camera.lookAt(0, 0.02, 0.2);
              }}
            >
              <PlaygroundScene />
              <OrbitControls
                ref={controlsRef}
                enablePan
                enableZoom
                enableRotate
                minPolarAngle={Math.PI / 5}
                maxPolarAngle={Math.PI / 2.02}
                minDistance={3.2}
                maxDistance={10.5}
                target={[0, 0.02, 0.2]}
                onChange={updateSnapshotFromControls}
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
              Left drag rotate · right drag pan · wheel zoom
            </div>
          </div>

          <div className="mt-4 grid gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 md:grid-cols-[1fr_auto]">
            <div className="grid gap-2 text-sm text-slate-700">
              <p>
                <span className="font-semibold text-slate-900">camera.position</span>:{" "}
                [{snapshot.position[0]}, {snapshot.position[1]}, {snapshot.position[2]}]
              </p>
              <p>
                <span className="font-semibold text-slate-900">camera.fov</span>: {snapshot.fov}
              </p>
              <p>
                <span className="font-semibold text-slate-900">controls.target</span>: [{snapshot.target[0]},{" "}
                {snapshot.target[1]}, {snapshot.target[2]}]
              </p>
            </div>
            <div className="flex items-center gap-2 md:flex-col md:justify-center">
              <button
                type="button"
                onClick={copyCoordinates}
                className="inline-flex min-w-[170px] items-center justify-center rounded-full border border-cyan-300 bg-cyan-500 px-5 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-cyan-600"
              >
                {copyLabel}
              </button>
              <button
                type="button"
                onClick={resetView}
                className="inline-flex min-w-[170px] items-center justify-center rounded-full border border-slate-300 bg-white px-5 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-700 transition hover:bg-slate-100"
              >
                Reset View
              </button>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
