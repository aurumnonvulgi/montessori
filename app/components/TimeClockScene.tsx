"use client";

import { Canvas, type ThreeEvent } from "@react-three/fiber";
import { Text } from "@react-three/drei";
import { useMemo, useRef, useState } from "react";
import * as THREE from "three";
import {
  type ClockMode,
  type MinuteStage,
  type TimeValue,
  handAnglesToTime,
  normalizeAngle,
  timeToHandAngles,
} from "../lib/timeMath";

type TimeClockSceneProps = {
  mode: ClockMode;
  value: TimeValue;
  minuteStage: MinuteStage;
  onChange: (next: TimeValue) => void;
  draggable?: boolean;
  contrast?: boolean;
  showCheckOverlay?: boolean;
  checkTime?: TimeValue | null;
  highlightPart?: "hour" | "minute" | "track" | null;
  className?: string;
  cameraPositionZ?: number;
  frozen?: boolean;
};

const FACE_RADIUS = 1.35;
const INNER_RING_RADIUS = 1.52;
const OUTER_FRAME_RADIUS = INNER_RING_RADIUS + (INNER_RING_RADIUS - FACE_RADIUS) / 2;

const toClockAngleFromPoint = (point: THREE.Vector3) => {
  const radians = Math.atan2(point.x, point.y);
  return normalizeAngle(THREE.MathUtils.radToDeg(radians));
};

function ClockHands({
  mode,
  value,
  minuteStage,
  onChange,
  draggable = true,
  contrast = false,
  showCheckOverlay = false,
  checkTime,
  highlightPart,
}: Omit<TimeClockSceneProps, "className">) {
  const [dragging, setDragging] = useState<"hour" | "minute" | null>(null);
  const dragPlaneRef = useRef(new THREE.Plane(new THREE.Vector3(0, 0, 1), 0));
  const dragPointRef = useRef(new THREE.Vector3());
  const angles = useMemo(() => timeToHandAngles(value), [value]);
  const checkAngles = useMemo(
    () => (checkTime ? timeToHandAngles(checkTime) : null),
    [checkTime]
  );

  const minuteVisible = true;
  const hourVisible = true;
  const minuteLocked = mode === "hours";
  const hourLocked = mode === "minutes";
  const displayedHourAngle = mode === "minutes" ? 30 : angles.hourAngle;
  const displayedMinuteAngle = mode === "hours" ? 0 : angles.minuteAngle;

  const baseWood = contrast ? "#f2e7d0" : "#d4b487";
  const ringWood = contrast ? "#7c5528" : "#8b5e2e";
  const faceColor = contrast ? "#fffaf1" : "#f9f0e1";
  const tickColor = contrast ? "#111111" : "#5b4120";
  const activeRed = contrast ? "#b91c1c" : "#dc2626";
  const guideBlue = "#2579d9";
  const hourGuideTransparent = mode === "minutes";
  const hourOpacity = hourGuideTransparent ? 0.62 : 1;
  const hourColor = mode === "hours" ? activeRed : mode === "minutes" ? guideBlue : contrast ? "#111111" : "#2f261e";
  const minuteColor = mode === "minutes" ? activeRed : contrast ? "#1f2937" : "#475569";
  const pulseOn = highlightPart ? 1 : 0;
  const pulseScale = pulseOn ? 1.05 : 1;

  const getDragPoint = (event: ThreeEvent<PointerEvent>) => {
    const hit = event.ray.intersectPlane(dragPlaneRef.current, dragPointRef.current);
    if (hit) return hit;
    return event.point;
  };

  const updateFromDrag = (hand: "hour" | "minute", point: THREE.Vector3) => {
    if (!draggable) return;
    const draggedAngle = toClockAngleFromPoint(point);

    if (hand === "hour") {
      if (hourLocked) return;
      if (mode === "hours") {
        const next = handAnglesToTime(
          { hourAngle: draggedAngle, minuteAngle: 0 },
          { mode: "hours", minuteSnap: "locked", hourSnap: "hour", lockedMinute: 0 }
        );
        onChange({ h: next.h, m: 0 });
        return;
      }

      const next = handAnglesToTime(
        { hourAngle: draggedAngle, minuteAngle: angles.minuteAngle },
        {
          mode: "both",
          minuteSnap: minuteStage,
          hourSnap: "drift",
        }
      );
      onChange(next);
      return;
    }

    if (minuteLocked) return;
    const next = handAnglesToTime(
      {
        hourAngle: angles.hourAngle,
        minuteAngle: draggedAngle,
      },
      {
        mode: mode === "minutes" ? "minutes" : "both",
        minuteSnap: minuteStage,
        hourSnap: mode === "minutes" ? "locked" : "drift",
        lockedHour: mode === "minutes" ? 12 : undefined,
      }
    );
    onChange(next);
  };

  const handleDown = (
    hand: "hour" | "minute",
    event: ThreeEvent<PointerEvent>
  ) => {
    if (!draggable) return;
    if ((hand === "hour" && hourLocked) || (hand === "minute" && minuteLocked)) return;
    event.nativeEvent.preventDefault();
    event.stopPropagation();
    const pointerTarget = event.nativeEvent.target as
      | (EventTarget & {
          setPointerCapture?: (pointerId: number) => void;
        })
      | null;
    pointerTarget?.setPointerCapture?.(event.pointerId);
    setDragging(hand);
    updateFromDrag(hand, getDragPoint(event));
  };

  const handleMove = (event: ThreeEvent<PointerEvent>) => {
    if (!dragging) return;
    event.nativeEvent.preventDefault();
    event.stopPropagation();
    updateFromDrag(dragging, getDragPoint(event));
  };

  const handleUp = (event: ThreeEvent<PointerEvent>) => {
    if (!dragging) return;
    event.nativeEvent.preventDefault();
    event.stopPropagation();
    const pointerTarget = event.nativeEvent.target as
      | (EventTarget & {
          releasePointerCapture?: (pointerId: number) => void;
        })
      | null;
    pointerTarget?.releasePointerCapture?.(event.pointerId);
    setDragging(null);
  };

  return (
    <group>
      <ambientLight intensity={0.72} />
      <directionalLight position={[2.2, 3.5, 4]} intensity={0.82} castShadow />
      <directionalLight position={[-2.8, 2.2, -3.1]} intensity={0.28} />

      <mesh position={[0, 0, -0.18]} rotation={[Math.PI / 2, 0, 0]} receiveShadow>
        <cylinderGeometry args={[OUTER_FRAME_RADIUS, OUTER_FRAME_RADIUS, 0.32, 64]} />
        <meshStandardMaterial color={baseWood} roughness={0.9} metalness={0.01} />
      </mesh>

      <mesh position={[0, 0, -0.05]} rotation={[Math.PI / 2, 0, 0]} receiveShadow>
        <cylinderGeometry args={[INNER_RING_RADIUS, INNER_RING_RADIUS, 0.1, 64]} />
        <meshStandardMaterial color={ringWood} roughness={0.82} metalness={0.02} />
      </mesh>

      <mesh position={[0, 0, 0]} rotation={[Math.PI / 2, 0, 0]} receiveShadow>
        <cylinderGeometry args={[FACE_RADIUS, FACE_RADIUS, 0.08, 64]} />
        <meshStandardMaterial color={faceColor} roughness={0.88} metalness={0.01} />
      </mesh>

      <group scale={[pulseScale, pulseScale, pulseScale]}>
        {Array.from({ length: 60 }, (_, index) => {
          const angle = (index / 60) * Math.PI * 2;
          const radius = index % 5 === 0 ? 1.2 : 1.26;
          const length = index % 5 === 0 ? 0.14 : 0.08;
          const thickness = index % 5 === 0 ? 0.02 : 0.012;
          const x = Math.sin(angle) * radius;
          const y = Math.cos(angle) * radius;
          return (
            <mesh
              key={`tick-${index}`}
              position={[x, y, 0.06]}
              rotation={[0, 0, -angle]}
            >
              <boxGeometry args={[thickness, length, 0.02]} />
              <meshStandardMaterial
                color={tickColor}
                emissive={highlightPart === "track" ? "#f59e0b" : "#000000"}
                emissiveIntensity={highlightPart === "track" ? 0.24 : 0}
              />
            </mesh>
          );
        })}
      </group>

      {Array.from({ length: 12 }, (_, index) => {
        const number = index === 0 ? 12 : index;
        const angle = (index / 12) * Math.PI * 2;
        const x = Math.sin(angle) * 0.98;
        const y = Math.cos(angle) * 0.98;
        return (
          <Text
            key={`numeral-${number}`}
            position={[x, y, 0.085]}
            fontSize={0.18}
            color={tickColor}
            anchorX="center"
            anchorY="middle"
          >
            {number}
          </Text>
        );
      })}

      {showCheckOverlay && checkAngles ? (
        <>
          <group rotation={[0, 0, THREE.MathUtils.degToRad(-checkAngles.hourAngle)]}>
            <mesh position={[0, 0.34, 0.095]}>
              <boxGeometry args={[0.1, 0.68, 0.015]} />
              <meshStandardMaterial color="#94a3b8" opacity={0.33} transparent />
            </mesh>
          </group>
          <group rotation={[0, 0, THREE.MathUtils.degToRad(-checkAngles.minuteAngle)]}>
            <mesh position={[0, 0.52, 0.092]}>
              <boxGeometry args={[0.06, 1.04, 0.012]} />
              <meshStandardMaterial color="#60a5fa" opacity={0.33} transparent />
            </mesh>
          </group>
        </>
      ) : null}

      {hourVisible ? (
        <group rotation={[0, 0, THREE.MathUtils.degToRad(-displayedHourAngle)]}>
          <mesh
            position={[0, 0.33, 0.11]}
          >
            <boxGeometry args={[0.12, 0.66, 0.04]} />
            <meshStandardMaterial
              color={hourColor}
              emissive={highlightPart === "hour" ? "#f59e0b" : "#000000"}
              emissiveIntensity={highlightPart === "hour" ? 0.35 : 0}
              transparent={hourGuideTransparent}
              opacity={hourOpacity}
            />
          </mesh>
          <mesh
            position={[0, 0.67, 0.115]}
          >
            <sphereGeometry args={[0.07, 16, 16]} />
            <meshStandardMaterial color={hourColor} transparent={hourGuideTransparent} opacity={hourOpacity} />
          </mesh>
          {!hourLocked ? (
            <mesh
              position={[0, 0.38, 0.125]}
              onPointerDown={(event) => handleDown("hour", event)}
            >
              <boxGeometry args={[0.34, 0.82, 0.12]} />
              <meshBasicMaterial transparent opacity={0} depthWrite={false} />
            </mesh>
          ) : null}
        </group>
      ) : null}

      {minuteVisible ? (
        <group rotation={[0, 0, THREE.MathUtils.degToRad(-displayedMinuteAngle)]}>
          <mesh
            position={[0, 0.5, 0.12]}
          >
            <boxGeometry args={[0.07, 1, 0.03]} />
            <meshStandardMaterial
              color={minuteColor}
              emissive={highlightPart === "minute" ? "#38bdf8" : "#000000"}
              emissiveIntensity={highlightPart === "minute" ? 0.35 : 0}
            />
          </mesh>
          <mesh
            position={[0, 1.02, 0.122]}
          >
            <sphereGeometry args={[0.055, 16, 16]} />
            <meshStandardMaterial color={minuteColor} />
          </mesh>
          {!minuteLocked ? (
            <mesh
              position={[0, 0.56, 0.13]}
              onPointerDown={(event) => handleDown("minute", event)}
            >
              <boxGeometry args={[0.3, 1.16, 0.12]} />
              <meshBasicMaterial transparent opacity={0} depthWrite={false} />
            </mesh>
          ) : null}
        </group>
      ) : null}

      {dragging ? (
        <mesh
          position={[0, 0, 0.3]}
          onPointerMove={handleMove}
          onPointerUp={handleUp}
          onPointerLeave={handleUp}
        >
          <planeGeometry args={[8, 8]} />
          <meshBasicMaterial transparent opacity={0} depthWrite={false} />
        </mesh>
      ) : null}

      <mesh position={[0, 0, 0.14]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.08, 0.08, 0.06, 24]} />
        <meshStandardMaterial color="#f8fafc" metalness={0.2} roughness={0.45} />
      </mesh>
    </group>
  );
}

export default function TimeClockScene({
  mode,
  value,
  minuteStage,
  onChange,
  draggable = true,
  contrast = false,
  showCheckOverlay = false,
  checkTime = null,
  highlightPart = null,
  className,
  cameraPositionZ = 5.6,
  frozen = false,
}: TimeClockSceneProps) {
  return (
    <div
      className={`relative w-full overflow-hidden rounded-[26px] border border-stone-200 bg-[radial-gradient(circle_at_top,#fbf7f2_0%,#f2ebe3_55%,#ece2d6_100%)] ${frozen ? "" : "touch-none overscroll-contain"} ${className ?? "h-[420px]"}`}
      style={frozen ? undefined : { touchAction: "none" }}
    >
      <Canvas
        camera={{ position: [0, 0, cameraPositionZ], fov: 34 }}
        shadows
        frameloop={frozen ? "demand" : "always"}
      >
        <ClockHands
          mode={mode}
          value={value}
          minuteStage={minuteStage}
          onChange={onChange}
          draggable={draggable}
          contrast={contrast}
          showCheckOverlay={showCheckOverlay}
          checkTime={checkTime}
          highlightPart={highlightPart}
        />
      </Canvas>
    </div>
  );
}
