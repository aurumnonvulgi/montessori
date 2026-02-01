"use client";

import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { useMemo, useEffect } from "react";
import * as THREE from "three";

const BEAD_DIAMETER = 0.01;
const BEAD_RADIUS = BEAD_DIAMETER / 2;
const WIRE_LOOP_RADIUS = 0.0015;
const WIRE_LOOP_TUBE = 0.0003;
const GREEN_OFFSET = 0.0003;

type BarDefinition = {
  id: number;
  beads: number;
  color: string;
  depth: number;
};

const BAR_LAYOUT: BarDefinition[] = [
  { id: 1, beads: 1, color: "#ef4444", depth: -0.08 },
  { id: 2, beads: 2, color: "#16a34a", depth: -0.05 },
  { id: 3, beads: 3, color: "#fec8d8", depth: -0.03 },
  { id: 4, beads: 4, color: "#fde68a", depth: -0.005 },
  { id: 5, beads: 5, color: "#93c5fd", depth: 0.02 },
  { id: 6, beads: 6, color: "#d8b4fe", depth: 0.045 },
  { id: 7, beads: 7, color: "#f8fafc", depth: 0.07 },
  { id: 8, beads: 8, color: "#5d4037", depth: 0.095 },
  { id: 9, beads: 9, color: "#1e3a8a", depth: 0.12 },
];

type HomePositions = Record<number, THREE.Vector3[]>;

type ShortBeadStairSceneProps = {
  onHomePositions?: (positions: HomePositions) => void;
};

const ShortBeadStairScene = ({ onHomePositions }: ShortBeadStairSceneProps) => {
  const beadGeometry = useMemo(() => new THREE.SphereGeometry(BEAD_RADIUS, 32, 32), []);
  const wireGeometry = useMemo(() => new THREE.CylinderGeometry(1, 1, 1, 16), []);
  const loopGeometry = useMemo(() => new THREE.TorusGeometry(WIRE_LOOP_RADIUS, WIRE_LOOP_TUBE, 16, 32), []);

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

  const homePositions = useMemo<HomePositions>(() => {
    const result: HomePositions = {};
    BAR_LAYOUT.forEach((bar) => {
      const spacing = bar.id === 2 ? BEAD_DIAMETER - GREEN_OFFSET : BEAD_DIAMETER - 0.00025;
      const startX = -((bar.beads - 1) * spacing + BEAD_DIAMETER) / 2 + BEAD_RADIUS;
      result[bar.id] = [...Array(bar.beads)].map((_, idx) => {
        return new THREE.Vector3(startX + idx * spacing, BEAD_RADIUS, bar.depth);
      });
    });
    return result;
  }, []);

  useEffect(() => {
    if (onHomePositions) {
      onHomePositions(homePositions);
    }
  }, [homePositions, onHomePositions]);

  return (
    <Canvas camera={{ position: [0, 0.35, 0.05], fov: 40 }}>
      <color attach="background" args={["#f8f4ec"]} />
      <ambientLight intensity={0.6} />
      <directionalLight position={[0.6, 1.2, 0.4]} intensity={0.9} />

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]}>
        <planeGeometry args={[0.6, 0.6]} />
        <meshStandardMaterial color="#c8a67d" />
      </mesh>

      {BAR_LAYOUT.map((bar) => {
        const spacing = bar.id === 2 ? BEAD_DIAMETER - GREEN_OFFSET : BEAD_DIAMETER - 0.0002;
        const length = (bar.beads - 1) * spacing + BEAD_DIAMETER;
        const startX = -length / 2 + BEAD_RADIUS;
        const loopOffset = length / 2 + WIRE_LOOP_RADIUS * 0.8;
        return (
          <group key={bar.id} position={[0, BEAD_RADIUS + 0.01, bar.depth]}>
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
        minDistance={0.15}
        maxDistance={0.4}
      />
    </Canvas>
  );
};

export default ShortBeadStairScene;
