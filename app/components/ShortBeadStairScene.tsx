"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls as DreiOrbitControls } from "@react-three/drei";
import { OrbitControls as ThreeOrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import type { OrbitControls as StdlibOrbitControls } from "three-stdlib/controls/OrbitControls";
import { useMemo, useEffect, useCallback, useRef, type MutableRefObject } from "react";
import * as THREE from "three";
import ZoomResetButton from "./ZoomResetButton";

const BEAD_DIAMETER = 0.01;
const BEAD_RADIUS = BEAD_DIAMETER / 2;
const BEAD_SPACING = 0.003;
const WIRE_LOOP_RADIUS = 0.0015;
const WIRE_LOOP_TUBE = 0.0003;

const DEFAULT_CAMERA_POSITION = new THREE.Vector3(0, 0.6, 0.4);
const CAMERA_ORIGIN_TARGET = new THREE.Vector3(0, 0, 0);

type BarDefinition = {
  id: number;
  beads: number;
  color: string;
  depth: number;
};

const BAR_LAYOUT: BarDefinition[] = [
  { id: 1, beads: 1, color: "#ef4444", depth: -0.045 },
  { id: 2, beads: 2, color: "#16a34a", depth: -0.03 },
  { id: 3, beads: 3, color: "#fec8d8", depth: -0.012 },
  { id: 4, beads: 4, color: "#fde68a", depth: 0.008 },
  { id: 5, beads: 5, color: "#93c5fd", depth: 0.027 },
  { id: 6, beads: 6, color: "#d8b4fe", depth: 0.046 },
  { id: 7, beads: 7, color: "#f8fafc", depth: 0.065 },
  { id: 8, beads: 8, color: "#7a4f31", depth: 0.084 },
  { id: 9, beads: 9, color: "#1e3a8a", depth: 0.103 },
];

export const BAR_IDS = BAR_LAYOUT.map((bar) => bar.id);

type ShiftOffset = { x: number; y: number; z: number };
type HomePositions = Record<number, THREE.Vector3[]>;

type CameraIntroConfig = {
  overviewPosition: THREE.Vector3;
  overviewTarget?: THREE.Vector3;
  panPosition: THREE.Vector3;
  focusPosition: THREE.Vector3;
  focusTarget?: THREE.Vector3;
  panDuration?: number;
  focusDuration?: number;
};

type ShortBeadStairSceneProps = {
  onHomePositions?: (positions: HomePositions) => void;
  onBarClick?: (barId: number) => void;
  barShifts?: Record<number, ShiftOffset>;
  barColorOverrides?: Record<number, string>;
  barBeadHighlights?: Record<number, number | null>;
  touchingBeads?: boolean;
  cameraIntroConfig?: CameraIntroConfig;
  cameraIntroKey?: number;
  onCameraIntroComplete?: () => void;
  focusSideOffset?: number;
  focusDepthOffset?: number;
  cameraReady?: boolean;
  showZoomReset?: boolean;
};

const ShortBeadStairScene = ({
  onHomePositions,
  barShifts = {},
  barColorOverrides = {},
  barBeadHighlights,
  onBarClick,
  touchingBeads = false,
  cameraIntroConfig,
  cameraIntroKey,
  onCameraIntroComplete,
  focusSideOffset = 0,
  focusDepthOffset = 0,
  cameraReady = false,
  showZoomReset = true,
}: ShortBeadStairSceneProps) => {
  const beadGeometry = useMemo(() => new THREE.SphereGeometry(BEAD_RADIUS, 32, 32), []);
  const wireGeometry = useMemo(() => new THREE.CylinderGeometry(1, 1, 1, 16), []);
  const loopGeometry = useMemo(() => new THREE.TorusGeometry(WIRE_LOOP_RADIUS, WIRE_LOOP_TUBE, 16, 32), []);
  const highlightMaterial = useMemo(() =>
    new THREE.MeshStandardMaterial({
      color: "#ff5c5c",
      metalness: 0.1,
      roughness: 0.2,
      envMapIntensity: 1,
    }),
    [],
  );

  const controlsRef = useRef<StdlibOrbitControls | null>(null);
  const cameraIntroTrigger = cameraIntroKey ?? 0;

  const beadMaterials = useMemo(
    () =>
      BAR_LAYOUT.reduce<Record<number, THREE.MeshStandardMaterial>>((acc, bar) => {
        acc[bar.id] = new THREE.MeshStandardMaterial({
          color: bar.color,
          metalness: 0.05,
          roughness: 0.2,
          envMapIntensity: 1,
        });
        return acc;
      }, {}),
    [],
  );

  const getMaterialForBar = useCallback(
    (barId: number) => {
      const override = barColorOverrides[barId];
      if (override) {
        return new THREE.MeshStandardMaterial({
          color: override,
          metalness: 0.05,
          roughness: 0.2,
          envMapIntensity: 1,
        });
      }
      return beadMaterials[barId];
    },
    [barColorOverrides, beadMaterials],
  );

  const homePositions = useMemo<HomePositions>(() => {
    const positions: HomePositions = {};
    BAR_LAYOUT.forEach((bar) => {
      const spacing = BEAD_DIAMETER + BEAD_SPACING;
      const startX = -((bar.beads - 1) * spacing + BEAD_DIAMETER) / 2 + BEAD_RADIUS;
      positions[bar.id] = [...Array(bar.beads)].map((_, idx) => new THREE.Vector3(startX + idx * spacing, BEAD_RADIUS, bar.depth));
    });
    return positions;
  }, []);

 useEffect(() => {
   if (onHomePositions) {
     onHomePositions(homePositions);
   }
 }, [homePositions, onHomePositions]);

  const cameraPosition = cameraIntroConfig?.overviewPosition.toArray() ?? DEFAULT_CAMERA_POSITION.toArray();
  const focusTarget = cameraIntroConfig?.focusTarget ?? CAMERA_ORIGIN_TARGET;
  const focusPositionBase = cameraIntroConfig?.focusPosition ?? DEFAULT_CAMERA_POSITION.clone();
  const focusDirection = useMemo(() => {
    const direction = focusPositionBase.clone().sub(focusTarget);
    return direction.lengthSq() === 0 ? new THREE.Vector3(0, 0, 1) : direction.normalize();
  }, [focusPositionBase, focusTarget]);

  const lateralOffset = useMemo(() => new THREE.Vector3(focusSideOffset, 0, 0), [focusSideOffset]);
  const zoomOffset = useMemo(
    () => focusDirection.clone().multiplyScalar(focusDepthOffset),
    [focusDirection, focusDepthOffset],
  );

  const focusPositionWithOffsets = useMemo(
    () => focusPositionBase.clone().add(lateralOffset).add(zoomOffset),
    [focusPositionBase, lateralOffset, zoomOffset],
  );
  const focusTargetWithOffsets = useMemo(
    () => focusTarget.clone().add(lateralOffset),
    [focusTarget, lateralOffset],
  );
  const overviewPosition = cameraIntroConfig?.overviewPosition ?? DEFAULT_CAMERA_POSITION;
  const overviewTarget = cameraIntroConfig?.overviewTarget ?? CAMERA_ORIGIN_TARGET;

  const applyFocusOffsets = useCallback(() => {
    const controls = controlsRef.current;
    if (!controls) {
      return;
    }
    const camera = controls.object as THREE.Camera;
    camera.position.copy(focusPositionWithOffsets);
    controls.target.copy(focusTargetWithOffsets);
    controls.update();
  }, [controlsRef, focusPositionWithOffsets, focusTargetWithOffsets]);

  const cameraReadyKey = cameraReady ? 1 : 0;

  useEffect(() => {
    if (!cameraReadyKey) {
      return;
    }
    applyFocusOffsets();
  }, [applyFocusOffsets, cameraReadyKey]);

  const handleZoomReset = useCallback(() => {
    const controls = controlsRef.current;
    if (!controls) return;
    const camera = controls.object as THREE.PerspectiveCamera;
    camera.position.copy(overviewPosition);
    controls.target.copy(overviewTarget);
    controls.update();
  }, [overviewPosition, overviewTarget]);

  return (
    <div className="relative h-full w-full">
      <Canvas camera={{ position: cameraPosition, fov: 38 }}>
        <color attach="background" args={["#f8f4ec"]} />
        <ambientLight intensity={0.6} />
        <directionalLight position={[0.6, 1.2, 0.4]} intensity={0.9} />

        {cameraIntroConfig && (
          <CameraIntroController
            controlsRef={controlsRef}
            config={cameraIntroConfig}
            trigger={cameraIntroTrigger}
            focusPositionTarget={focusPositionWithOffsets}
            focusTargetTarget={focusTargetWithOffsets}
            focusSideOffset={focusSideOffset}
            focusDepthOffset={focusDepthOffset}
            onComplete={onCameraIntroComplete}
          />
        )}

        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.03, 0]}>
          <planeGeometry args={[1.8, 1.4]} />
          <meshStandardMaterial color="#c8a67d" />
        </mesh>

        {BAR_LAYOUT.map((bar) => {
          const spacing = touchingBeads
            ? BEAD_DIAMETER
            : bar.id === 2
              ? BEAD_DIAMETER - 0.0004
              : BEAD_DIAMETER + BEAD_SPACING;
          const length = (bar.beads - 1) * spacing + BEAD_DIAMETER;
          const startX = -length / 2 + BEAD_RADIUS;
          const loopOffset = length / 2 + WIRE_LOOP_RADIUS * 0.8;
          const shift = barShifts[bar.id] ?? { x: 0, y: 0, z: 0 };
          const wirePosition: [number, number, number] = [shift.x, BEAD_RADIUS + shift.y, bar.depth + shift.z];

          return (
            <group key={bar.id} onPointerDown={() => onBarClick?.(bar.id)}>
              <mesh
                geometry={wireGeometry}
                rotation={[0, 0, Math.PI / 2]}
                position={wirePosition}
                scale={[WIRE_LOOP_RADIUS * 1.1, length + WIRE_LOOP_RADIUS * 2, WIRE_LOOP_RADIUS * 1.1]}
              >
                <meshStandardMaterial color="#b18b4b" metalness={0.85} roughness={0.25} />
              </mesh>

              {[...Array(bar.beads)].map((_, beadIndex) => {
                const key = `${bar.id}-${beadIndex}`;
                const scale = 1;
                const x = startX + beadIndex * spacing + shift.x;
                const y = BEAD_RADIUS + shift.y;
                const z = bar.depth + shift.z;
                const highlightIndex = barBeadHighlights?.[bar.id];
                const isHighlightedBead = highlightIndex !== undefined && highlightIndex === beadIndex;
                return (
                  <mesh
                    key={key}
                    geometry={beadGeometry}
                    material={isHighlightedBead ? highlightMaterial : getMaterialForBar(bar.id)}
                    position={[x, y, z] as [number, number, number]}
                    scale={[scale, scale, scale]}
                  />
                );
              })}

              {[-1, 1].map((direction) => {
                const loopX = direction * loopOffset + shift.x;
                const loopY = BEAD_RADIUS + shift.y;
                const loopZ = bar.depth + shift.z;
                return (
                  <mesh
                    key={`loop-${bar.id}-${direction}`}
                    geometry={loopGeometry}
                    position={[loopX, loopY, loopZ] as [number, number, number]}
                    rotation={[Math.PI / 2, 0, direction === -1 ? Math.PI : 0]}
                  >
                    <meshStandardMaterial color="#b18b4b" metalness={0.8} roughness={0.3} />
                  </mesh>
                );
              })}
            </group>
          );
        })}

        <DreiOrbitControls
          ref={controlsRef}
          enablePan={false}
          enableZoom
          maxPolarAngle={Math.PI / 2.4}
          minPolarAngle={Math.PI / 3}
          minAzimuthAngle={-Math.PI / 6}
          maxAzimuthAngle={Math.PI / 6}
          minDistance={0.3}
          maxDistance={1}
        />
      </Canvas>
      {showZoomReset ? <ZoomResetButton onClick={handleZoomReset} /> : null}
    </div>
  );
};

export default ShortBeadStairScene;

type CameraIntroControllerProps = {
  controlsRef: MutableRefObject<StdlibOrbitControls | null>;
  config: CameraIntroConfig;
  trigger: number;
  onComplete?: () => void;
  focusPositionTarget: THREE.Vector3;
  focusTargetTarget: THREE.Vector3;
  focusSideOffset?: number;
  focusDepthOffset?: number;
};

function CameraIntroController({
  controlsRef,
  config,
  trigger,
  onComplete,
  focusPositionTarget,
  focusTargetTarget,
  focusSideOffset = 0,
  focusDepthOffset = 0,
}: CameraIntroControllerProps) {
  const { camera } = useThree();
  const introState = useRef<{ key: number; stage: "idle" | "pan" | "focus"; startTime: number }>({
    key: 0,
    stage: "idle",
    startTime: 0,
  });

  const overviewTarget = config.overviewTarget ?? CAMERA_ORIGIN_TARGET;
  const focusTarget = config.focusTarget ?? overviewTarget;
  const focusPositionBase = config.focusPosition;
  const focusDirection = useMemo(() => {
    const direction = focusPositionBase.clone().sub(focusTarget);
    if (direction.lengthSq() === 0) {
      return new THREE.Vector3(0, 0, 1);
    }
    return direction.normalize();
  }, [focusPositionBase, focusTarget]);

  useEffect(() => {
    if (!controlsRef.current) {
      return;
    }
    camera.position.copy(config.overviewPosition);
    controlsRef.current.target.copy(overviewTarget);
    controlsRef.current.update();
  }, [camera, controlsRef, config.overviewPosition, overviewTarget]);

  useEffect(() => {
    if (!trigger || !controlsRef.current) {
      return;
    }
    introState.current = {
      key: trigger,
      stage: "pan",
      startTime: performance.now(),
    };
    camera.position.copy(config.overviewPosition);
    controlsRef.current.target.copy(overviewTarget);
    controlsRef.current.update();
    controlsRef.current.enabled = false;
  }, [trigger, camera, controlsRef, config.overviewPosition, overviewTarget]);

  useEffect(() => {
    if (!controlsRef.current) {
      return;
    }
    if (introState.current.key !== trigger || introState.current.stage !== "idle") {
      return;
    }
    const lateralOffset = new THREE.Vector3(focusSideOffset, 0, 0);
    const zoomOffset = focusDirection.clone().multiplyScalar(focusDepthOffset);
    const focusPosition = focusPositionBase.clone().add(lateralOffset).add(zoomOffset);
    const focusTargetPosition = focusTarget.clone().add(lateralOffset);
    camera.position.copy(focusPosition);
    controlsRef.current.target.copy(focusTargetPosition);
    controlsRef.current.update();
  }, [
    camera,
    controlsRef,
    focusDepthOffset,
    focusDirection,
    focusPositionBase,
    focusSideOffset,
    focusTarget,
    trigger,
  ]);

  useFrame((stateFrame) => {
    const current = introState.current;
    if (current.key !== trigger || current.stage === "idle" || !controlsRef.current) {
      return;
    }

    const now = stateFrame.clock.elapsedTime * 1000;
    const stageConfig =
      current.stage === "pan"
        ? {
            fromPosition: config.overviewPosition,
            toPosition: config.panPosition,
            fromTarget: overviewTarget,
            toTarget: overviewTarget,
            duration: config.panDuration ?? 1800,
          }
        : {
            fromPosition: config.panPosition,
            toPosition: focusPositionTarget,
            fromTarget: overviewTarget,
            toTarget: focusTargetTarget,
            duration: config.focusDuration ?? 1400,
          };

    const progress = Math.min((now - current.startTime) / stageConfig.duration, 1);
    camera.position.lerpVectors(stageConfig.fromPosition, stageConfig.toPosition, progress);
    controlsRef.current.target.lerpVectors(stageConfig.fromTarget, stageConfig.toTarget, progress);
    camera.lookAt(controlsRef.current.target);
    controlsRef.current.update();

        if (progress >= 1) {
          if (current.stage === "pan") {
            introState.current = { key: trigger, stage: "focus", startTime: now };
          } else {
            introState.current = { key: trigger, stage: "idle", startTime: now };
            controlsRef.current.enabled = true;
            onComplete?.();
          }
        }
  });

  return null;
}
