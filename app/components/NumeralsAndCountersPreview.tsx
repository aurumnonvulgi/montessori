"use client";

import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { useMemo } from "react";
import * as THREE from "three";

type NumeralsAndCountersPreviewProps = {
  className?: string;
};

function createNumeralTexture(numeral: number): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 348;
  const ctx = canvas.getContext("2d");
  if (ctx) {
    ctx.fillStyle = "#000000";
    ctx.font = "bold 180px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(String(numeral), 128, 174);
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

function NumeralsAndCountersPreviewContent() {
  const numerals = [1, 2, 3];

  const numeralTextures = useMemo(() => {
    return numerals.map((n) => createNumeralTexture(n));
  }, []);

  // Calculate counter positions for each numeral (pairs layout)
  const counterPositions = useMemo(() => {
    const positions: { numeral: number; x: number; z: number }[] = [];

    numerals.forEach((numeral, idx) => {
      const cardX = -1.6 + idx * 1.6;
      const baseZ = 0.8;

      const pairs = Math.floor(numeral / 2);
      const hasOdd = numeral % 2 === 1;

      for (let p = 0; p < pairs; p++) {
        const pairZ = baseZ + p * 0.4;
        positions.push({ numeral, x: cardX - 0.2, z: pairZ });
        positions.push({ numeral, x: cardX + 0.2, z: pairZ });
      }

      if (hasOdd) {
        const oddZ = baseZ + pairs * 0.4;
        positions.push({ numeral, x: cardX, z: oddZ });
      }
    });

    return positions;
  }, []);

  return (
    <>
      <ambientLight intensity={0.65} />
      <directionalLight position={[3, 4, 2]} intensity={0.9} />
      <directionalLight position={[-2, 3, -2]} intensity={0.5} />

      {/* Base mat */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0.5]} receiveShadow>
        <planeGeometry args={[6, 4]} />
        <meshStandardMaterial color="#f5f1e8" />
      </mesh>

      {/* Numeral cards - laying flat on table */}
      {numerals.map((numeral, idx) => {
        const x = -1.6 + idx * 1.6;
        return (
          <group key={numeral} position={[x, 0.04, -0.3]} rotation={[-Math.PI / 2, 0, 0]}>
            <mesh castShadow>
              <boxGeometry args={[0.8, 1.1, 0.06]} />
              <meshStandardMaterial color="#ffffff" roughness={0.3} />
            </mesh>
            <mesh position={[0, 0, 0.031]}>
              <planeGeometry args={[0.75, 1.05]} />
              <meshStandardMaterial
                map={numeralTextures[idx]}
                transparent
                opacity={1}
              />
            </mesh>
          </group>
        );
      })}

      {/* Counters - flat discs on table */}
      {counterPositions.map((pos, idx) => (
        <mesh
          key={`counter-${pos.numeral}-${idx}`}
          position={[pos.x, 0.025, pos.z]}
          castShadow
        >
          <cylinderGeometry args={[0.12, 0.12, 0.05, 24]} />
          <meshStandardMaterial
            color="#d93636"
            roughness={0.4}
            metalness={0.1}
          />
        </mesh>
      ))}

      <OrbitControls
        enableZoom={false}
        enablePan={false}
        minPolarAngle={Math.PI / 4}
        maxPolarAngle={Math.PI / 3}
        minAzimuthAngle={-Math.PI / 8}
        maxAzimuthAngle={Math.PI / 8}
      />
    </>
  );
}

export default function NumeralsAndCountersPreview({
  className = "",
}: NumeralsAndCountersPreviewProps) {
  return (
    <div className={className}>
      <Canvas
        camera={{ position: [0, 0.5, 1], fov: 33 }}
        shadows
        gl={{ antialias: true }}
      >
        <NumeralsAndCountersPreviewContent />
      </Canvas>
    </div>
  );
}
