"use client";

import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { useMemo } from "react";
import * as THREE from "three";

const BEAD_DIAMETER = 0.01; // 10 mm
const BEAD_RADIUS = BEAD_DIAMETER / 2;
const GREEN_SPACING_OFFSET = 0.0003;
const BEAD_OVERLAP = 0.00025;
const WIRE_LOOP_RADIUS = 0.0015; // 3 mm diameter
const WIRE_LOOP_TUBE = 0.0003;

const BAR_LAYOUT = [
  { id: 1, beads: 1, color: "#ef4444", depth: -0.06 },
  { id: 2, beads: 2, color: "#16a34a", depth: -0.04 },
  { id: 3, beads: 3, color: "#fec8d8", depth: -0.02 },
  { id: 4, beads: 4, color: "#fde68a", depth: 0 },
  { id: 5, beads: 5, color: "#93c5fd", depth: 0.02 },
  { id: 6, beads: 6, color: "#d8b4fe", depth: 0.04 },
  { id: 7, beads: 7, color: "#f8fafc", depth: 0.06 },
  { id: 8, beads: 8, color: "#5d4037", depth: 0.08 },
  { id: 9, beads: 9, color: "#1e3a8a", depth: 0.1 },
];

type ShortBeadWorkbenchProps = {
  className?: string;
};

const ShortBeadWorkbench = ({ className }: ShortBeadWorkbenchProps) => {
  const beadGeometry = useMemo(() => new THREE.SphereGeometry(BEAD_RADIUS, 32, 32), []);
  const wireGeometry = useMemo(() => new THREE.CylinderGeometry(1, 1, 1, 16), []);
  const loopGeometry = useMemo(() => new THREE.TorusGeometry(WIRE_LOOP_RADIUS, WIRE_LOOP_TUBE, 16, 32), []);

  const beadMaterials = useMemo(
    () =>
      BAR_LAYOUT.reduce<Record<number, THREE.MeshStandardMaterial>>((acc, bar) => {
        acc[bar.id] = new THREE.MeshStandardMaterial({
          color: bar.color,
          metalness: 0.05,
          roughness: 0.25,
          envMapIntensity: 1,
        });
        return acc;
      }, {}),
    [],
  );

  const wrapperClass = className ?? "h-[520px]";
  return (
    <div className={`w-full ${wrapperClass}`}>
      <Canvas camera={{ position: [0, 0.25, 0.12], fov: 40 }}>
        <color attach="background" args={["#f8f4ec"]} />
        <ambientLight intensity={0.6} />
        <directionalLight position={[0.5, 1, 0.3]} intensity={0.95} />

        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]}>
          <planeGeometry args={[0.6, 0.6]} />
          <meshStandardMaterial color="#c8a67d" />
        </mesh>

        {BAR_LAYOUT.map((bar) => {
          const spacing = bar.id === 2 ? BEAD_DIAMETER - GREEN_SPACING_OFFSET : BEAD_DIAMETER - BEAD_OVERLAP;
          const length = (bar.beads - 1) * spacing + BEAD_DIAMETER;
          const startX = -length / 2 + BEAD_RADIUS;
          const loopOffset = length / 2 + WIRE_LOOP_RADIUS - BEAD_RADIUS * 0.08;
          return (
            <group key={bar.id} position={[0, BEAD_RADIUS + 0.015, bar.depth]}>
              <mesh
                geometry={wireGeometry}
                rotation={[0, 0, Math.PI / 2]}
                scale={[WIRE_LOOP_RADIUS * 1.1, length + WIRE_LOOP_RADIUS * 2, WIRE_LOOP_RADIUS * 1.1]}
              >
                <meshStandardMaterial color="#b18b4b" metalness={0.85} roughness={0.25} />
              </mesh>

              {[...Array(bar.beads)].map((_, beadIndex) => (
                <mesh
                  key={`bead-${bar.id}-${beadIndex}`}
                  geometry={beadGeometry}
                  material={beadMaterials[bar.id]}
                  position={[startX + beadIndex * spacing, 0, 0]}
                />
              ))}

              {[-1, 1].map((direction) => (
                <mesh
                  key={`loop-${bar.id}-${direction}`}
                  geometry={loopGeometry}
                  position={[direction * loopOffset, 0, 0]}
                  rotation={[Math.PI / 2, 0, direction === -1 ? Math.PI : 0]}
                >
                  <meshStandardMaterial color="#b18b4b" metalness={0.8} roughness={0.3} />
                </mesh>
              ))}
            </group>
          );
        })}

        <OrbitControls
          enablePan={false}
          enableZoom
          maxPolarAngle={Math.PI / 2.4}
          minPolarAngle={Math.PI / 3}
          minAzimuthAngle={-Math.PI / 6}
          maxAzimuthAngle={Math.PI / 6}
          minDistance={0.12}
          maxDistance={0.35}
        />
      </Canvas>
    </div>
  );
};

export default ShortBeadWorkbench;
