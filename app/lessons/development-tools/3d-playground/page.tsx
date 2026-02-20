"use client";

import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import * as THREE from "three";
import HomeLink from "../../../components/HomeLink";

type CameraSnapshot = {
  position: [number, number, number];
  target: [number, number, number];
  fov: number;
};

type CoordinateLocks = {
  cameraX: boolean;
  cameraY: boolean;
  cameraZ: boolean;
  targetX: boolean;
  targetY: boolean;
  targetZ: boolean;
  fov: boolean;
};

type CoordinateKey = keyof CoordinateLocks;

type CoordinateBounds = {
  min: number;
  max: number;
  step: number;
};

type CameraPreset = {
  key: string;
  label: string;
  snapshot: CameraSnapshot;
  scene: "playmat" | "clock";
};

const round = (value: number) => Number(value.toFixed(3));
const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const DEFAULT_SNAPSHOT: CameraSnapshot = {
  position: [0.9, 2.25, 5.85],
  target: [0, 0.02, 0.2],
  fov: 47,
};

const DEFAULT_LOCKS: CoordinateLocks = {
  cameraX: false,
  cameraY: false,
  cameraZ: false,
  targetX: false,
  targetY: false,
  targetZ: false,
  fov: false,
};

const COORDINATE_BOUNDS: Record<CoordinateKey, CoordinateBounds> = {
  cameraX: { min: -6, max: 6, step: 0.001 },
  cameraY: { min: 0, max: 8, step: 0.001 },
  cameraZ: { min: -12, max: 12, step: 0.001 },
  targetX: { min: -6, max: 6, step: 0.001 },
  targetY: { min: -2, max: 6, step: 0.001 },
  targetZ: { min: -6, max: 6, step: 0.001 },
  fov: { min: 20, max: 100, step: 0.1 },
};

const COORDINATE_DESCRIPTIONS: Record<CoordinateKey, string> = {
  cameraX: "Moves the camera left and right.",
  cameraY: "Moves the camera up and down.",
  cameraZ: "Moves the camera forward and backward.",
  targetX: "Shifts what the camera looks at left and right.",
  targetY: "Shifts what the camera looks at up and down.",
  targetZ: "Shifts what the camera looks at forward and backward.",
  fov: "Changes lens width. Higher is wider; lower is zoomed-in.",
};

const PLAYMAT_PRESETS: CameraPreset[] = [
  {
    key: "playground-default",
    label: "3D Playground Default",
    snapshot: DEFAULT_SNAPSHOT,
    scene: "playmat",
  },
  {
    key: "hundred-board",
    label: "Hundred Board Playmat",
    snapshot: {
      position: [0.95, 2.35, 5.85],
      target: [0.75, 0.02, 0.3],
      fov: 47,
    },
    scene: "playmat",
  },
  {
    key: "sandpaper-numerals",
    label: "Sandpaper Numerals Playmat",
    snapshot: {
      position: [0, 4.052, 1.75],
      target: [0, 0, 0.3],
      fov: 28,
    },
    scene: "playmat",
  },
  {
    key: "hour-clock-activities",
    label: "Hour Clock Activities (cam [0, 0, 5.6] · target [0, 0, 0] · fov 34)",
    snapshot: {
      position: [0, 0, 5.6],
      target: [0, 0, 0],
      fov: 34,
    },
    scene: "clock",
  },
  {
    key: "minute-clock-activities",
    label: "Minute Clock Activities (cam [0, 0, 5.6] · target [0, 0, 0] · fov 34)",
    snapshot: {
      position: [0, 0, 5.6],
      target: [0, 0, 0],
      fov: 34,
    },
    scene: "clock",
  },
  {
    key: "clock-activities",
    label: "Clock Activities (cam [0, 0, 5.6] · target [0, 0, 0] · fov 34)",
    snapshot: {
      position: [0, 0, 5.6],
      target: [0, 0, 0],
      fov: 34,
    },
    scene: "clock",
  },
  {
    key: "coordinates-tool",
    label: "Coordinates Tool Playmat",
    snapshot: {
      position: [0.1, 3.4, 6.2],
      target: [0, 0.02, 0],
      fov: 46,
    },
    scene: "playmat",
  },
];

const parseTriple = (value: string): [number, number, number] | null => {
  const numbers = value
    .split(",")
    .map((entry) => Number(entry.trim()))
    .filter((entry) => Number.isFinite(entry));
  if (numbers.length < 3) return null;
  return [numbers[0], numbers[1], numbers[2]];
};

const toBoundedSnapshot = (snapshot: CameraSnapshot): CameraSnapshot => ({
  position: [
    clamp(snapshot.position[0], COORDINATE_BOUNDS.cameraX.min, COORDINATE_BOUNDS.cameraX.max),
    clamp(snapshot.position[1], COORDINATE_BOUNDS.cameraY.min, COORDINATE_BOUNDS.cameraY.max),
    clamp(snapshot.position[2], COORDINATE_BOUNDS.cameraZ.min, COORDINATE_BOUNDS.cameraZ.max),
  ],
  target: [
    clamp(snapshot.target[0], COORDINATE_BOUNDS.targetX.min, COORDINATE_BOUNDS.targetX.max),
    clamp(snapshot.target[1], COORDINATE_BOUNDS.targetY.min, COORDINATE_BOUNDS.targetY.max),
    clamp(snapshot.target[2], COORDINATE_BOUNDS.targetZ.min, COORDINATE_BOUNDS.targetZ.max),
  ],
  fov: clamp(snapshot.fov, COORDINATE_BOUNDS.fov.min, COORDINATE_BOUNDS.fov.max),
});

const parseSnapshotInput = (input: string, fallback: CameraSnapshot): CameraSnapshot | null => {
  const source = input.trim();
  if (!source) return null;

  const next: CameraSnapshot = {
    position: [...fallback.position],
    target: [...fallback.target],
    fov: fallback.fov,
  };
  let matchedAny = false;

  const positionMatch = source.match(/camera\.position\s*=\s*\[([^\]]+)\]/i);
  if (positionMatch) {
    const triple = parseTriple(positionMatch[1]);
    if (triple) {
      next.position = triple;
      matchedAny = true;
    }
  }

  const targetMatch = source.match(/controls\.target\s*=\s*\[([^\]]+)\]/i);
  if (targetMatch) {
    const triple = parseTriple(targetMatch[1]);
    if (triple) {
      next.target = triple;
      matchedAny = true;
    }
  }

  const fovMatch = source.match(/camera\.fov\s*=\s*(-?\d+(?:\.\d+)?)/i);
  if (fovMatch) {
    const parsedFov = Number(fovMatch[1]);
    if (Number.isFinite(parsedFov)) {
      next.fov = parsedFov;
      matchedAny = true;
    }
  }

  const axisParsers: Array<{ key: CoordinateKey; pattern: RegExp }> = [
    { key: "cameraX", pattern: /camera\.position\.x\s*=\s*(-?\d+(?:\.\d+)?)/i },
    { key: "cameraY", pattern: /camera\.position\.y\s*=\s*(-?\d+(?:\.\d+)?)/i },
    { key: "cameraZ", pattern: /camera\.position\.z\s*=\s*(-?\d+(?:\.\d+)?)/i },
    { key: "targetX", pattern: /controls\.target\.x\s*=\s*(-?\d+(?:\.\d+)?)/i },
    { key: "targetY", pattern: /controls\.target\.y\s*=\s*(-?\d+(?:\.\d+)?)/i },
    { key: "targetZ", pattern: /controls\.target\.z\s*=\s*(-?\d+(?:\.\d+)?)/i },
    { key: "fov", pattern: /(?:camera\.)?fov\s*=\s*(-?\d+(?:\.\d+)?)/i },
  ];

  axisParsers.forEach(({ key, pattern }) => {
    const match = source.match(pattern);
    if (!match) return;
    const parsed = Number(match[1]);
    if (!Number.isFinite(parsed)) return;
    if (key === "cameraX") next.position[0] = parsed;
    if (key === "cameraY") next.position[1] = parsed;
    if (key === "cameraZ") next.position[2] = parsed;
    if (key === "targetX") next.target[0] = parsed;
    if (key === "targetY") next.target[1] = parsed;
    if (key === "targetZ") next.target[2] = parsed;
    if (key === "fov") next.fov = parsed;
    matchedAny = true;
  });

  if (!matchedAny) {
    const numbers = source
      .match(/-?\d+(?:\.\d+)?/g)
      ?.map((entry) => Number(entry))
      .filter((entry) => Number.isFinite(entry));
    if (numbers && numbers.length >= 7) {
      next.position = [numbers[0], numbers[1], numbers[2]];
      next.target = [numbers[3], numbers[4], numbers[5]];
      next.fov = numbers[6];
      matchedAny = true;
    }
  }

  return matchedAny ? toBoundedSnapshot(next) : null;
};

function CoordinateChip({
  axis,
  coordinateKey,
  value,
  locked,
  onToggle,
  onSlide,
}: {
  axis: string;
  coordinateKey: CoordinateKey;
  value: number;
  locked: boolean;
  onToggle: () => void;
  onSlide: (value: number) => void;
}) {
  const bounds = COORDINATE_BOUNDS[coordinateKey];
  const description = COORDINATE_DESCRIPTIONS[coordinateKey];
  const [draft, setDraft] = useState(value.toFixed(3));
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    if (!editing) {
      setDraft(value.toFixed(3));
    }
  }, [editing, value]);

  const commitDraft = useCallback(() => {
    const parsed = Number(draft);
    if (!Number.isFinite(parsed)) {
      setDraft(value.toFixed(3));
      setEditing(false);
      return;
    }
    const clamped = clamp(parsed, bounds.min, bounds.max);
    onSlide(clamped);
    setDraft(clamped.toFixed(3));
    setEditing(false);
  }, [bounds.max, bounds.min, draft, onSlide, value]);

  return (
    <div className="rounded-xl border border-slate-200 bg-white px-3 py-2">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">{axis}</p>
          <p className="font-mono text-sm text-slate-800">[{value.toFixed(3)}]</p>
        </div>
        <button
          type="button"
          onClick={onToggle}
          className={`rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] transition ${
            locked
              ? "border-amber-300 bg-amber-100 text-amber-800 hover:bg-amber-200"
              : "border-slate-300 bg-white text-slate-700 hover:bg-slate-100"
          }`}
        >
          {locked ? "Unlock" : "Lock"}
        </button>
      </div>
      <input
        type="range"
        min={bounds.min}
        max={bounds.max}
        step={bounds.step}
        value={value}
        onChange={(event) => onSlide(Number(event.target.value))}
        className="mt-2 w-full cursor-pointer accent-cyan-600"
      />
      <div className="mt-2 flex items-center gap-2">
        <span className="text-[10px] font-semibold uppercase tracking-[0.15em] text-slate-500">Type</span>
        <input
          type="number"
          min={bounds.min}
          max={bounds.max}
          step={bounds.step}
          value={draft}
          onFocus={() => setEditing(true)}
          onChange={(event) => {
            const nextDraft = event.target.value;
            setDraft(nextDraft);
            const parsed = Number(nextDraft);
            if (!Number.isFinite(parsed)) return;
            const clamped = clamp(parsed, bounds.min, bounds.max);
            onSlide(clamped);
          }}
          onBlur={commitDraft}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              commitDraft();
              event.currentTarget.blur();
            }
            if (event.key === "Escape") {
              setDraft(value.toFixed(3));
              setEditing(false);
              event.currentTarget.blur();
            }
          }}
          className="w-full rounded-md border border-slate-300 px-2 py-1 font-mono text-xs text-slate-800"
        />
      </div>
      <p className="mt-1 text-[11px] leading-tight text-slate-500">{description}</p>
    </div>
  );
}

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

function ClockReferenceScene() {
  return (
    <>
      <ambientLight intensity={0.72} />
      <directionalLight
        position={[2.2, 3.5, 4]}
        intensity={0.82}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
      />
      <directionalLight position={[-2.8, 2.2, -3.1]} intensity={0.28} />

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.06, 0]} receiveShadow>
        <planeGeometry args={[9, 7]} />
        <meshStandardMaterial color="#ddd7cf" roughness={0.92} metalness={0} />
      </mesh>

      <mesh position={[0, 0, -0.18]} rotation={[Math.PI / 2, 0, 0]} receiveShadow>
        <cylinderGeometry args={[1.605, 1.605, 0.32, 64]} />
        <meshStandardMaterial color="#d4b487" roughness={0.9} metalness={0.01} />
      </mesh>

      <mesh position={[0, 0, -0.05]} rotation={[Math.PI / 2, 0, 0]} receiveShadow>
        <cylinderGeometry args={[1.52, 1.52, 0.1, 64]} />
        <meshStandardMaterial color="#8b5e2e" roughness={0.82} metalness={0.02} />
      </mesh>

      <mesh position={[0, 0, 0]} rotation={[Math.PI / 2, 0, 0]} receiveShadow>
        <cylinderGeometry args={[1.35, 1.35, 0.08, 64]} />
        <meshStandardMaterial color="#f9f0e1" roughness={0.88} metalness={0.01} />
      </mesh>

      {Array.from({ length: 60 }, (_, index) => {
        const angle = (index / 60) * Math.PI * 2;
        const radius = index % 5 === 0 ? 1.2 : 1.26;
        const length = index % 5 === 0 ? 0.14 : 0.08;
        const thickness = index % 5 === 0 ? 0.02 : 0.012;
        const x = Math.sin(angle) * radius;
        const y = Math.cos(angle) * radius;
        return (
          <mesh key={`tick-${index}`} position={[x, y, 0.06]} rotation={[0, 0, -angle]}>
            <boxGeometry args={[thickness, length, 0.02]} />
            <meshStandardMaterial color="#5b4120" />
          </mesh>
        );
      })}

      <group rotation={[0, 0, THREE.MathUtils.degToRad(-300)]}>
        <mesh position={[0, 0.34, 0.11]}>
          <boxGeometry args={[0.12, 0.66, 0.04]} />
          <meshStandardMaterial color="#2f261e" />
        </mesh>
      </group>
      <group rotation={[0, 0, THREE.MathUtils.degToRad(-120)]}>
        <mesh position={[0, 0.5, 0.12]}>
          <boxGeometry args={[0.07, 1, 0.03]} />
          <meshStandardMaterial color="#475569" />
        </mesh>
      </group>

      <mesh position={[0, 0, 0.14]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.08, 0.08, 0.06, 24]} />
        <meshStandardMaterial color="#f8fafc" metalness={0.2} roughness={0.45} />
      </mesh>
    </>
  );
}

export default function ThreeDPlaygroundPage() {
  const router = useRouter();
  const controlsRef = useRef<React.ElementRef<typeof OrbitControls> | null>(null);
  const [snapshot, setSnapshot] = useState<CameraSnapshot>(DEFAULT_SNAPSHOT);
  const [locks, setLocks] = useState<CoordinateLocks>(DEFAULT_LOCKS);
  const locksRef = useRef<CoordinateLocks>(DEFAULT_LOCKS);
  const snapshotRef = useRef<CameraSnapshot>(snapshot);
  const [selectedPreset, setSelectedPreset] = useState<string>("playground-default");
  const [activeScene, setActiveScene] = useState<"playmat" | "clock">("playmat");
  const [pastedValues, setPastedValues] = useState("");
  const [pasteStatus, setPasteStatus] = useState<string | null>(null);
  const [copyLabel, setCopyLabel] = useState("Copy Coordinates");

  useEffect(() => {
    locksRef.current = locks;
  }, [locks]);

  useEffect(() => {
    snapshotRef.current = snapshot;
  }, [snapshot]);

  const updateSnapshotFromControls = useCallback(() => {
    const controls = controlsRef.current;
    if (!controls) return;
    const camera = controls.object as THREE.PerspectiveCamera;
    const currentLocks = locksRef.current;
    const lockedSnapshot = snapshotRef.current;

    if (currentLocks.cameraX) camera.position.x = lockedSnapshot.position[0];
    if (currentLocks.cameraY) camera.position.y = lockedSnapshot.position[1];
    if (currentLocks.cameraZ) camera.position.z = lockedSnapshot.position[2];
    if (currentLocks.targetX) controls.target.x = lockedSnapshot.target[0];
    if (currentLocks.targetY) controls.target.y = lockedSnapshot.target[1];
    if (currentLocks.targetZ) controls.target.z = lockedSnapshot.target[2];
    if (currentLocks.fov) {
      camera.fov = lockedSnapshot.fov;
      camera.updateProjectionMatrix();
    }

    const nextSnapshot: CameraSnapshot = {
      position: [round(camera.position.x), round(camera.position.y), round(camera.position.z)],
      target: [round(controls.target.x), round(controls.target.y), round(controls.target.z)],
      fov: round(camera.fov),
    };
    setSnapshot(nextSnapshot);
  }, []);

  const toggleLock = useCallback((key: CoordinateKey) => {
    setLocks((previous) => ({ ...previous, [key]: !previous[key] }));
  }, []);

  const unlockAll = useCallback(() => {
    setLocks(DEFAULT_LOCKS);
  }, []);

  const applySnapshot = useCallback((snapshotToApply: CameraSnapshot) => {
    const bounded = toBoundedSnapshot(snapshotToApply);
    snapshotRef.current = bounded;
    setSnapshot(bounded);

    const controls = controlsRef.current;
    if (!controls) return;
    const camera = controls.object as THREE.PerspectiveCamera;
    camera.position.set(...bounded.position);
    controls.target.set(...bounded.target);
    camera.fov = bounded.fov;
    camera.updateProjectionMatrix();
    controls.update();
  }, []);

  const setCoordinateValue = useCallback((key: CoordinateKey, value: number) => {
    const rounded = round(value);
    const current = snapshotRef.current;
    const nextSnapshot: CameraSnapshot = {
      position: [...current.position],
      target: [...current.target],
      fov: current.fov,
    };

    if (key === "cameraX") nextSnapshot.position[0] = rounded;
    if (key === "cameraY") nextSnapshot.position[1] = rounded;
    if (key === "cameraZ") nextSnapshot.position[2] = rounded;
    if (key === "targetX") nextSnapshot.target[0] = rounded;
    if (key === "targetY") nextSnapshot.target[1] = rounded;
    if (key === "targetZ") nextSnapshot.target[2] = rounded;
    if (key === "fov") nextSnapshot.fov = rounded;

    applySnapshot(nextSnapshot);
    setSelectedPreset("custom");
    setPasteStatus(null);
  }, [applySnapshot]);

  const resetView = useCallback(() => {
    applySnapshot(DEFAULT_SNAPSHOT);
    setSelectedPreset("playground-default");
    setActiveScene("playmat");
    setPasteStatus(null);
  }, [applySnapshot]);

  const handlePresetChange = useCallback(
    (value: string) => {
      setSelectedPreset(value);
      setPasteStatus(null);
      if (value === "custom") return;
      const preset = PLAYMAT_PRESETS.find((item) => item.key === value);
      if (!preset) return;
      setActiveScene(preset.scene);
      applySnapshot(preset.snapshot);
    },
    [applySnapshot]
  );

  const handleApplyPastedValues = useCallback(() => {
    const parsed = parseSnapshotInput(pastedValues, snapshotRef.current);
    if (!parsed) {
      setPasteStatus("Could not parse values. Paste 7 numbers or the copied coordinate lines.");
      return;
    }
    applySnapshot(parsed);
    setSelectedPreset("custom");
    setPasteStatus("Values applied.");
  }, [applySnapshot, pastedValues]);

  const copyPayload = useMemo(() => {
    const [px, py, pz] = snapshot.position;
    const [tx, ty, tz] = snapshot.target;
    return [
      `values7 = [${px}, ${py}, ${pz}, ${tx}, ${ty}, ${tz}, ${snapshot.fov}]`,
      `camera.position = [${px}, ${py}, ${pz}]`,
      `camera.position.x = ${px}`,
      `camera.position.y = ${py}`,
      `camera.position.z = ${pz}`,
      `camera.fov = ${snapshot.fov}`,
      `controls.target = [${tx}, ${ty}, ${tz}]`,
      `controls.target.x = ${tx}`,
      `controls.target.y = ${ty}`,
      `controls.target.z = ${tz}`,
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
          <div className="mb-4 flex flex-col gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-600">Load Playmat Preset</p>
            <select
              value={selectedPreset}
              onChange={(event) => handlePresetChange(event.target.value)}
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800"
            >
              {PLAYMAT_PRESETS.map((preset) => (
                <option key={preset.key} value={preset.key}>
                  {preset.label}
                </option>
              ))}
              <option value="custom">Custom (Current)</option>
            </select>
          </div>

          <div className="relative h-[640px] overflow-hidden rounded-[24px] border border-slate-200 bg-[#ebe6dc]">
            <Canvas
              shadows
              camera={{ position: [0.9, 2.25, 5.85], fov: 47 }}
              onCreated={({ camera }) => {
                camera.lookAt(0, 0.02, 0.2);
              }}
            >
              {activeScene === "clock" ? <ClockReferenceScene /> : <PlaygroundScene />}
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
            <div className="grid gap-4 text-sm text-slate-700">
              <div className="rounded-2xl border border-slate-200 bg-slate-100/60 p-3">
                <p className="mb-2 text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">camera.position</p>
                <div className="grid gap-2 sm:grid-cols-3">
                  <CoordinateChip
                    axis="X"
                    coordinateKey="cameraX"
                    value={snapshot.position[0]}
                    locked={locks.cameraX}
                    onToggle={() => toggleLock("cameraX")}
                    onSlide={(value) => setCoordinateValue("cameraX", value)}
                  />
                  <CoordinateChip
                    axis="Y"
                    coordinateKey="cameraY"
                    value={snapshot.position[1]}
                    locked={locks.cameraY}
                    onToggle={() => toggleLock("cameraY")}
                    onSlide={(value) => setCoordinateValue("cameraY", value)}
                  />
                  <CoordinateChip
                    axis="Z"
                    coordinateKey="cameraZ"
                    value={snapshot.position[2]}
                    locked={locks.cameraZ}
                    onToggle={() => toggleLock("cameraZ")}
                    onSlide={(value) => setCoordinateValue("cameraZ", value)}
                  />
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-100/60 p-3">
                <p className="mb-2 text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">controls.target</p>
                <div className="grid gap-2 sm:grid-cols-3">
                  <CoordinateChip
                    axis="X"
                    coordinateKey="targetX"
                    value={snapshot.target[0]}
                    locked={locks.targetX}
                    onToggle={() => toggleLock("targetX")}
                    onSlide={(value) => setCoordinateValue("targetX", value)}
                  />
                  <CoordinateChip
                    axis="Y"
                    coordinateKey="targetY"
                    value={snapshot.target[1]}
                    locked={locks.targetY}
                    onToggle={() => toggleLock("targetY")}
                    onSlide={(value) => setCoordinateValue("targetY", value)}
                  />
                  <CoordinateChip
                    axis="Z"
                    coordinateKey="targetZ"
                    value={snapshot.target[2]}
                    locked={locks.targetZ}
                    onToggle={() => toggleLock("targetZ")}
                    onSlide={(value) => setCoordinateValue("targetZ", value)}
                  />
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-100/60 p-3">
                <p className="mb-2 text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">camera.fov</p>
                <div className="grid gap-3 lg:grid-cols-[minmax(0,220px)_1fr]">
                  <CoordinateChip
                    axis="FOV"
                    coordinateKey="fov"
                    value={snapshot.fov}
                    locked={locks.fov}
                    onToggle={() => toggleLock("fov")}
                    onSlide={(value) => setCoordinateValue("fov", value)}
                  />
                  <div className="rounded-xl border border-slate-200 bg-white p-3">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">Paste 7 Values</p>
                    <textarea
                      value={pastedValues}
                      onChange={(event) => setPastedValues(event.target.value)}
                      placeholder={"[camX, camY, camZ, targetX, targetY, targetZ, fov]\n\nor paste from Copy Coordinates"}
                      className="mt-2 h-28 w-full rounded-md border border-slate-300 px-2 py-1 font-mono text-xs text-slate-800"
                    />
                    <p className="mt-1 text-[11px] text-slate-500">
                      Accepts compact 7-number format or full copied coordinate lines.
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={handleApplyPastedValues}
                        className="rounded-full border border-cyan-300 bg-cyan-500 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-cyan-600"
                      >
                        Apply Pasted Values
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setPastedValues("");
                          setPasteStatus(null);
                        }}
                        className="rounded-full border border-slate-300 bg-white px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-700 transition hover:bg-slate-100"
                      >
                        Clear
                      </button>
                    </div>
                    {pasteStatus ? (
                      <p className={`mt-2 text-[11px] ${pasteStatus.includes("applied") ? "text-emerald-700" : "text-rose-600"}`}>
                        {pasteStatus}
                      </p>
                    ) : null}
                  </div>
                </div>
              </div>
              <p className="text-xs text-slate-500">Locked values stay fixed while the others continue updating.</p>
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
              <button
                type="button"
                onClick={unlockAll}
                className="inline-flex min-w-[170px] items-center justify-center rounded-full border border-amber-300 bg-amber-100 px-5 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-amber-800 transition hover:bg-amber-200"
              >
                Unlock All
              </button>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
