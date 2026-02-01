"use client";

import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { useMemo } from "react";
import * as THREE from "three";

const BEAD_DIAMETER = 0.01; // 10 mm
const BEAD_RADIUS = BEAD_DIAMETER / 2;
const GREEN_SPACING_OFFSET = 0.0005;
const BAR_GAP = 0.045;
const WIRE_LOOP_RADIUS = 0.0015; // 3 mm diameter
const WIRE_LOOP_TUBE = 0.0003;

const BAR_LAYOUT = [
  { id: 1, beads: 1, color: "#ef4444" },
  { id: 2, beads: 2, color: "#16a34a" },
];

type ShortBeadWorkbenchProps = {
  className?: string;
};

const ShortBeadWorkbench = ({ className = "" }: ShortBeadWorkbenchProps) => {
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

  return (
    <div className={`h-full w-full ${className}`}>
      <Canvas camera={{ position: [0, 0.17, 0.4], fov: 45 }}>
        <color attach="background" args={["#f8f4ec"]} />
        <ambientLight intensity={0.6} />
        <directionalLight position={[0.5, 1, 0.3]} intensity={0.9} />

        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]}>
          <planeGeometry args={[0.6, 0.6]} />
          <meshStandardMaterial color="#c8a67d" />
        </mesh>

        {BAR_LAYOUT.map((bar, index) => {
          const spacing = bar.id === 2 ? BEAD_DIAMETER - GREEN_SPACING_OFFSET : BEAD_DIAMETER;
          const length = (bar.beads - 1) * spacing + BEAD_DIAMETER;
          const startX = -length / 2 + BEAD_RADIUS;
          const y = BEAD_RADIUS + index * BAR_GAP;
          const loopX = length / 2 + WIRE_LOOP_RADIUS * 1.5;
          return (
            <group key={bar.id} position={[0, y, 0]}>
              <mesh
                geometry={wireGeometry}
                rotation={[Math.PI / 2, 0, 0]}
                scale={[WIRE_LOOP_RADIUS, length + WIRE_LOOP_RADIUS * 2, 1]}
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
                  position={[direction * loopX, 0, 0]}
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
          maxPolarAngle={Math.PI / 2}
          minPolarAngle={Math.PI / 3}
          minAzimuthAngle={-Math.PI / 6}
          maxAzimuthAngle={Math.PI / 6}
        />
      </Canvas>
    </div>
  );
};

export default ShortBeadWorkbench;
