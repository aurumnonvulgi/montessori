"use client";

import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { useMemo } from "react";
import * as THREE from "three";

const BAR_DATA = [
  { number: 1, beads: 1, color: "#ef4444" },
  { number: 2, beads: 2, color: "#16a34a" },
  { number: 3, beads: 3, color: "#ec4899" },
  { number: 4, beads: 4, color: "#facc15" },
  { number: 5, beads: 5, color: "#38bdf8" },
  { number: 6, beads: 6, color: "#c084fc" },
  { number: 7, beads: 7, color: "#f8fafc" },
  { number: 8, beads: 8, color: "#7c2d12" },
  { number: 9, beads: 9, color: "#1e3a8a" },
];

const BEAD_DIAMETER = 0.1;
const BEAD_RADIUS = BEAD_DIAMETER / 2;
const BEAD_SPACING = BEAD_DIAMETER;
const Y_SPACING = 0.14;
const WIRE_EXTENSION = 0.02;
const LOOP_RADIUS = 0.035;
const LOOP_TUBE = 0.004;

type ShortBeadStairDisplayProps = {
  className?: string;
};

const ShortBeadStairDisplay = ({ className = "" }: ShortBeadStairDisplayProps) => {
  const beadGeometry = useMemo(() => new THREE.SphereGeometry(BEAD_RADIUS, 32, 32), []);
  const wireGeometry = useMemo(() => new THREE.CylinderGeometry(1, 1, 1, 16), []);
  const loopGeometry = useMemo(() => new THREE.TorusGeometry(LOOP_RADIUS, LOOP_TUBE, 16, 32), []);

  const beadMaterials = useMemo(
    () =>
      BAR_DATA.reduce<Record<number, THREE.MeshStandardMaterial>>((acc, bar) => {
        acc[bar.number] = new THREE.MeshStandardMaterial({
          color: bar.color,
          metalness: 0.05,
          roughness: 0.25,
          envMapIntensity: 1,
        });
        return acc;
      }, {}),
    [],
  );

  return (
    <div className={`h-full w-full ${className}`}>
      <Canvas camera={{ position: [0, 0.6, 1.3], fov: 42 }}>
        <color attach="background" args={["#f3eadd"]} />
        <ambientLight intensity={0.7} />
        <directionalLight position={[2, 3, 2]} intensity={0.9} />

        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]}>
          <planeGeometry args={[3, 2]} />
          <meshStandardMaterial color="#d9c7aa" />
        </mesh>

        {BAR_DATA.map((bar, index) => {
          const length = (bar.beads - 1) * BEAD_SPACING + BEAD_DIAMETER;
          const startX = -length / 2 + BEAD_RADIUS;
          const y = 0.05 + (BAR_DATA.length - index - 1) * Y_SPACING;
          const loopOffset = length / 2 + WIRE_EXTENSION;
          return (
            <group key={bar.number} position={[0, y, 0]}>
              <mesh
                geometry={wireGeometry}
                rotation={[0, 0, Math.PI / 2]}
                scale={[length + WIRE_EXTENSION * 2, 1, 1]}
              >
                <meshStandardMaterial color="#b18b4b" metalness={0.8} roughness={0.25} />
              </mesh>

              {[...Array(bar.beads)].map((_, beadIndex) => (
                <mesh
                  key={`bead-${bar.number}-${beadIndex}`}
                  geometry={beadGeometry}
                  material={beadMaterials[bar.number]}
                  position={[startX + beadIndex * BEAD_SPACING, 0, 0]}
                />
              ))}

              {[-1, 1].map((side) => (
                <mesh
                  key={`loop-${bar.number}-${side}`}
                  geometry={loopGeometry}
                  position={[side * loopOffset, 0, 0]}
                  rotation={[Math.PI / 2, 0, side === -1 ? Math.PI : 0]}
                >
                  <meshStandardMaterial color="#b18b4b" metalness={0.8} roughness={0.3} />
                </mesh>
              ))}
            </group>
          );
        })}

        <OrbitControls enableZoom={false} enablePan={false} minPolarAngle={Math.PI / 3} maxPolarAngle={Math.PI / 2} />
      </Canvas>
    </div>
  );
};

export default ShortBeadStairDisplay;
