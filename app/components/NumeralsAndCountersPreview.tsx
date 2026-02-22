"use client";

import { Canvas } from "@react-three/fiber";
import { useMemo } from "react";
import * as THREE from "three";

const PREVIEW_NUMERALS = [1, 2, 3] as const;

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
  const numeralTextures = useMemo(() => {
    return PREVIEW_NUMERALS.map((n) => createNumeralTexture(n));
  }, []);

  // Calculate counter positions for each numeral (pairs layout)
  const counterPositions = useMemo(() => {
    const positions: { numeral: number; x: number; z: number }[] = [];

    PREVIEW_NUMERALS.forEach((numeral, idx) => {
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
        // Odd counter always goes on the left
        positions.push({ numeral, x: cardX - 0.2, z: oddZ });
      }
    });

    return positions;
  }, []);

  return (
    <>
      <ambientLight intensity={1.3} />
      <directionalLight position={[3, 5, 3]} intensity={0.5} />
      <directionalLight position={[-2, 4, -2]} intensity={0.3} />

      {/* Base mat */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0.5]}>
        <planeGeometry args={[6, 4]} />
        <meshStandardMaterial color="#faf6f0" />
      </mesh>

      {/* Numeral cards - laying flat on table */}
      {PREVIEW_NUMERALS.map((numeral, idx) => {
        const x = -1.6 + idx * 1.6;
        return (
          <group key={numeral} position={[x, 0.04, -0.3]} rotation={[-Math.PI / 2, 0, 0]}>
            <mesh>
              <boxGeometry args={[0.8, 1.1, 0.06]} />
              <meshStandardMaterial color="#f5e6c8" roughness={0.4} />
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
        >
          <cylinderGeometry args={[0.12, 0.12, 0.05, 24]} />
          <meshStandardMaterial
            color="#e85a5a"
            roughness={0.35}
            metalness={0.05}
          />
        </mesh>
      ))}
    </>
  );
}

export default function NumeralsAndCountersPreview({
  className = "",
}: NumeralsAndCountersPreviewProps) {
  return (
    <div className={`pointer-events-none select-none ${className}`}>
      <Canvas
        camera={{ position: [0, 1.5, 2.2], fov: 35 }}
        shadows={false}
        gl={{ antialias: true }}
        frameloop="demand"
      >
        <NumeralsAndCountersPreviewContent />
      </Canvas>
    </div>
  );
}
