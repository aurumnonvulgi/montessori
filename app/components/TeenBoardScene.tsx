"use client";

import { Canvas, ThreeEvent, useThree, useFrame } from "@react-three/fiber";
import { OrbitControls as DreiOrbitControls } from "@react-three/drei";
import { useRef, useState, useEffect, useCallback } from "react";
import * as THREE from "three";
import ZoomResetButton from "./ZoomResetButton";
import { speakWithPreferredVoice } from "../lib/speech";

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
const START_TEN5_POSITION: [number, number, number] = [0.1348647988627374, BEAD_RADIUS, 0.2044872045820188];

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
  cameraSettings?: { x: number; y: number; z: number; fov: number };
  cameraTarget?: { x: number; y: number; z: number };
  startAnimationKey?: number;
  onStartComplete?: () => void;
  onCameraChange?: (settings: { x: number; y: number; z: number; fov: number }) => void;
  showZoomReset?: boolean;
};

const dragPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
const pointer = new THREE.Vector2();
const raycaster = new THREE.Raycaster();

const speakText = (text: string) => {
  speakWithPreferredVoice(text, { rate: 0.9, pitch: 1, volume: 0.9, lang: "en-US" });
};

function SceneContent({
  interactive,
  onPositionsChange,
  startAnimationKey,
  onStartComplete,
  cameraSettings,
  cameraTarget,
  onCameraChange,
  controlsRef,
}: {
  interactive: boolean;
  onPositionsChange?: (positions: Record<string, [number, number, number]>) => void;
  startAnimationKey?: number;
  onStartComplete?: () => void;
  cameraSettings?: { x: number; y: number; z: number; fov: number };
  cameraTarget?: { x: number; y: number; z: number };
  onCameraChange?: (settings: { x: number; y: number; z: number; fov: number }) => void;
  controlsRef: React.MutableRefObject<React.ElementRef<typeof DreiOrbitControls> | null>;
}) {
  const { camera, gl } = useThree();
  const orbitRef = controlsRef;
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
    if (!interactive) {
      return;
    }
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
  }, [interactive, gl.domElement, pointerMove]);

  const handleDown = useCallback(
    (id: string) => (event: ThreeEvent<PointerEvent>) => {
      if (!interactive) return;
      event.stopPropagation();
      const current = new THREE.Vector3(...(barPositions[id] ?? [0, 0, 0]));
      setDragTarget({ id, offset: event.point.clone().sub(current) });
      if (orbitRef.current) orbitRef.current.enabled = false;
    },
    [barPositions, interactive],
  );

  const [animationActive, setAnimationActive] = useState(false);
  const animationRef = useRef({ elapsed: 0, duration: 1500 });
  const [unitAnimationActive, setUnitAnimationActive] = useState(false);
  const unitAnimationRef = useRef({ elapsed: 0, duration: 1000, start: [0, 0, 0], target: START_TEN5_POSITION });
  const prevStartKey = useRef<number | null>(null);

  const speechTimers = useRef<number[]>([]);
  const actionTimers = useRef<number[]>([]);

  const queueSpeech = useCallback(
    (text: string, delay: number) => {
      if (typeof window === "undefined") return;
      const timer = window.setTimeout(() => speakText(text), delay);
      speechTimers.current.push(timer);
    },
    [],
  );

  const queueAction = useCallback((callback: () => void, delay: number) => {
    if (typeof window === "undefined") return;
    const timer = window.setTimeout(callback, delay);
    actionTimers.current.push(timer);
  }, []);

  const clearSpeechTimers = useCallback(() => {
    speechTimers.current.forEach((timer) => window.clearTimeout(timer));
    speechTimers.current = [];
    if (typeof window !== "undefined") window.speechSynthesis?.cancel();
  }, []);

  const clearActionTimers = useCallback(() => {
    actionTimers.current.forEach((timer) => window.clearTimeout(timer));
    actionTimers.current = [];
  }, []);

  const [highlightCircle, setHighlightCircle] = useState<
    | null
    | { position: [number, number, number]; radius: number }
  >(null);

  const triggerAnimation = useCallback(() => {
    clearSpeechTimers();
    clearActionTimers();
    setUnitAnimationActive(false);
    setHighlightCircle(null);
    setAnimationActive(true);
    animationRef.current.elapsed = 0;
    setBarPositions((prev) => ({ ...prev, ["ten-5"]: TEN_BAR_POSITIONS[4] }));
    console.log("Teen Board start animation triggered");
  }, [clearActionTimers, clearSpeechTimers]);

  useEffect(() => {
    if (!startAnimationKey || startAnimationKey === prevStartKey.current) return;
    prevStartKey.current = startAnimationKey;
    triggerAnimation();
  }, [startAnimationKey, triggerAnimation]);

  useFrame((_, delta) => {
    if (!animationActive) return;
    const state = animationRef.current;
    state.elapsed += delta * 1000;
    const t = Math.min(state.elapsed / state.duration, 1);
    const eased = 0.5 - 0.5 * Math.cos(Math.PI * t);
    const home = TEN_BAR_POSITIONS[4];
    const target = START_TEN5_POSITION;
    const newX = THREE.MathUtils.lerp(home[0], target[0], eased);
    const newZ = THREE.MathUtils.lerp(home[2], target[2], eased);
    const newY = BEAD_RADIUS + Math.sin(Math.PI * t) * 0.04;
    setBarPositions((prev) => ({ ...prev, ["ten-5"]: [newX, newY, newZ] }));
    if (t >= 1) {
      setAnimationActive(false);
      onStartComplete?.();
    onCameraChange?.({ x: 0, y: 0.35, z: -0.8, fov: 45 });
      console.log("Teen Board start animation completed");
      queueSpeech("Ten", 0);
      queueAction(() => {
        const startPos = barPositions["unit-1"] ?? UNIT_BAR_POSITIONS[0];
        unitAnimationRef.current.elapsed = 0;
        unitAnimationRef.current.start = startPos;
        unitAnimationRef.current.target = [0.09980412168875688, 0.01, 0.15851754700455564];
        setUnitAnimationActive(true);
      }, 2000);
    }
  });

  useFrame((_, delta) => {
    if (!unitAnimationActive) return;
    const state = unitAnimationRef.current;
    state.elapsed += delta * 1000;
    const tt = Math.min(state.elapsed / state.duration, 1);
    const eased = 0.5 - 0.5 * Math.cos(Math.PI * tt);
    const interpolated: [number, number, number] = [
      THREE.MathUtils.lerp(state.start[0], state.target[0], eased),
      THREE.MathUtils.lerp(state.start[1], state.target[1], eased),
      THREE.MathUtils.lerp(state.start[2], state.target[2], eased),
    ];
    setBarPositions((prev) => ({ ...prev, ["unit-1"]: interpolated }));
    if (tt >= 1) {
      setUnitAnimationActive(false);
      queueSpeech("And one more are", 500);
      queueSpeech("Eleven", 2000);
      queueAction(() => setHighlightCircle({ position: state.target, radius: 0.08 }), 500);
    }
  });

  useEffect(() => {
    onPositionsChange?.(barPositions);
  }, [barPositions, onPositionsChange]);

  useEffect(() => {
    if (!cameraSettings) return;
    const cam = camera as THREE.PerspectiveCamera;
    cam.position.set(cameraSettings.x, cameraSettings.y, cameraSettings.z);
    // eslint-disable-next-line react-hooks/immutability
    cam.fov = cameraSettings.fov;
    cam.updateProjectionMatrix();
  }, [cameraSettings, camera]);

  useEffect(() => {
    if (!cameraTarget || !orbitRef.current) return;
    orbitRef.current.target.set(cameraTarget.x, cameraTarget.y, cameraTarget.z);
    orbitRef.current.update();
  }, [cameraTarget, orbitRef]);

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
      <DreiOrbitControls
        ref={orbitRef}
        maxPolarAngle={Math.PI / 2}
        minDistance={0.2}
        maxDistance={3}
        enablePan={interactive}
        enableZoom={interactive}
        enableRotate={interactive}
      />
    </>
  );
}

export default function TeenBoardScene({
  className,
  interactive = true,
  onPositionsChange,
  startAnimationKey,
  onStartComplete,
  cameraSettings,
  cameraTarget,
  onCameraChange,
  showZoomReset,
}: TeenBoardSceneProps) {
  type OrbitControlsHandle = React.ElementRef<typeof DreiOrbitControls>;
  const controlsRef = useRef<OrbitControlsHandle | null>(null);
  const shouldShowZoomReset = showZoomReset ?? interactive;

  const handleZoomReset = useCallback(() => {
    const controls = controlsRef.current;
    if (!controls) return;
    const camera = controls.object as THREE.PerspectiveCamera;
    camera.position.set(0, 0.35, 0.8);
    camera.fov = 45;
    camera.updateProjectionMatrix();
    controls.target.set(0, 0, 0);
    controls.update();
  }, []);

  return (
    <div className={`relative ${interactive ? "" : "pointer-events-none select-none"} ${className ?? "h-full w-full"}`}>
      <Canvas frameloop={interactive ? "always" : "demand"}>
        <SceneContent
          interactive={interactive}
          onPositionsChange={onPositionsChange}
          startAnimationKey={startAnimationKey}
          onStartComplete={onStartComplete}
          cameraSettings={cameraSettings}
          cameraTarget={cameraTarget}
          onCameraChange={onCameraChange}
          controlsRef={controlsRef}
        />
      </Canvas>
      {shouldShowZoomReset ? <ZoomResetButton onClick={handleZoomReset} /> : null}
    </div>
  );
}
