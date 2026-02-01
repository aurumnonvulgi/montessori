"use client";

import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { useMemo } from "react";
import * as THREE from "three";

const BEAD_DIAMETER = 0.01; // 10 mm
const BEAD_RADIUS = BEAD_DIAMETER / 2;

type ShortBeadWorkbenchProps = {
  className?: string;
};

const ShortBeadWorkbench = ({ className = "" }: ShortBeadWorkbenchProps) => {
  const beadGeometry = useMemo(() => new THREE.SphereGeometry(BEAD_RADIUS, 32, 32), []);
  const beadMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#ef4444",
        metalness: 0.1,
        roughness: 0.3,
        envMapIntensity: 0.7,
      }),
    [],
  );
  const planeGeometry = useMemo(() => new THREE.PlaneGeometry(0.4, 0.5), []);

  return (
    <div className={`h-full w-full ${className}`}>
      <Canvas camera={{ position: [0, 0.09, 0.25], fov: 45 }}>
        <color attach="background" args={["#f6efe6"]} />
        <ambientLight intensity={0.5} />
        <directionalLight position={[0.4, 1, 0.5]} intensity={0.8} />
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
          <primitive object={planeGeometry} />
          <meshStandardMaterial color="#bb9a6d" />
        </mesh>
        <mesh geometry={beadGeometry} material={beadMaterial} position={[0, BEAD_RADIUS, 0]} castShadow />
        <OrbitControls enablePan={false} enableZoom={false} minPolarAngle={Math.PI / 3} maxPolarAngle={Math.PI / 2} />
      </Canvas>
    </div>
  );
};

export default ShortBeadWorkbench;
