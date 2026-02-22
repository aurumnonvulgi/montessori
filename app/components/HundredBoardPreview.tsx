"use client";

import { Canvas } from "@react-three/fiber";
import { Text } from "@react-three/drei";

type HundredBoardPreviewProps = {
  className?: string;
};

const GRID_SIZE = 10;
const SLOT_SIZE = 0.18;
const SLOT_GAP = 0.024;
const SLOT_PITCH = SLOT_SIZE + SLOT_GAP;
const BOARD_SPAN = GRID_SIZE * SLOT_SIZE + (GRID_SIZE - 1) * SLOT_GAP;
const BOARD_HALF = BOARD_SPAN / 2;
const BOARD_TOP_Y = 0.018;

const BOARD_CENTER_X = 0.26;
const BOARD_CENTER_Z = 0.02;
const BOARD_ORIGIN_X = BOARD_CENTER_X - BOARD_HALF + SLOT_SIZE / 2;
const BOARD_ORIGIN_Z = BOARD_CENTER_Z - BOARD_HALF + SLOT_SIZE / 2;

const GRID_LINE_Y = BOARD_TOP_Y + 0.003;
const TILE_SIZE = SLOT_SIZE * 0.8;
const TILE_HEIGHT = 0.026;

const PREVIEW_TILES: Array<{ n: number; x: number; z: number }> = [
  { n: 1, x: -1.04, z: -0.42 },
  { n: 2, x: -0.83, z: -0.42 },
  { n: 3, x: -0.62, z: -0.42 },
  { n: 4, x: -1.04, z: -0.21 },
  { n: 5, x: -0.83, z: -0.21 },
  { n: 6, x: -0.62, z: -0.21 },
  { n: 7, x: -1.04, z: 0 },
  { n: 8, x: -0.83, z: 0 },
  { n: 9, x: -0.62, z: 0 },
  { n: 10, x: -0.83, z: 0.22 },
];

function PreviewTile({ number, x, z }: { number: number; x: number; z: number }) {
  return (
    <group position={[x, BOARD_TOP_Y + TILE_HEIGHT / 2 + 0.02, z]}>
      <mesh castShadow receiveShadow>
        <boxGeometry args={[TILE_SIZE, TILE_HEIGHT, TILE_SIZE]} />
        <meshStandardMaterial
          color="#ffffff"
          roughness={0.2}
          metalness={0.02}
          emissive="#ffffff"
          emissiveIntensity={0.04}
        />
      </mesh>
      <Text
        position={[0, TILE_HEIGHT / 2 + 0.003, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        fontSize={0.06}
        maxWidth={0.18}
        anchorX="center"
        anchorY="middle"
        color="#111111"
      >
        {String(number)}
      </Text>
    </group>
  );
}

export default function HundredBoardPreview({ className }: HundredBoardPreviewProps) {
  return (
    <div className={`pointer-events-none w-full select-none overflow-hidden rounded-[24px] bg-[#efe6d8] ${className ?? "h-36"}`}>
      <Canvas
        shadows
        camera={{ position: [0.32, 0.98, 2.38], fov: 42 }}
        frameloop="demand"
        onCreated={({ camera }) => camera.lookAt(0.2, 0.03, 0.24)}
      >
        <ambientLight intensity={0.72} />
        <directionalLight
          position={[2.1, 3.8, 2.2]}
          intensity={0.8}
          castShadow
          shadow-mapSize-width={1024}
          shadow-mapSize-height={1024}
          shadow-bias={-0.0005}
          shadow-normalBias={0.02}
        />
        <directionalLight position={[-2.4, 3.4, -2]} intensity={0.24} />

        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.018, 0]} receiveShadow>
          <planeGeometry args={[5.8, 3.7]} />
          <meshStandardMaterial color="#e2d6bf" roughness={0.9} metalness={0} />
        </mesh>

        <mesh position={[BOARD_CENTER_X, BOARD_TOP_Y - 0.13, BOARD_CENTER_Z]} castShadow>
          <boxGeometry args={[BOARD_SPAN + 0.7, 0.28, BOARD_SPAN + 0.7]} />
          <meshStandardMaterial color="#c59a60" roughness={0.82} metalness={0.05} />
        </mesh>

        <mesh position={[BOARD_CENTER_X, BOARD_TOP_Y + 0.002, BOARD_CENTER_Z]}>
          <boxGeometry args={[BOARD_SPAN + 0.02, 0.004, BOARD_SPAN + 0.02]} />
          <meshStandardMaterial color="#d8bd8f" roughness={0.86} metalness={0} />
        </mesh>

        <mesh position={[BOARD_CENTER_X, BOARD_TOP_Y + 0.03, BOARD_CENTER_Z - (BOARD_SPAN + 0.17) / 2]}>
          <boxGeometry args={[BOARD_SPAN + 0.34, 0.058, 0.17]} />
          <meshStandardMaterial color="#b6894a" roughness={0.8} metalness={0.04} />
        </mesh>
        <mesh position={[BOARD_CENTER_X, BOARD_TOP_Y + 0.03, BOARD_CENTER_Z + (BOARD_SPAN + 0.17) / 2]}>
          <boxGeometry args={[BOARD_SPAN + 0.34, 0.058, 0.17]} />
          <meshStandardMaterial color="#b6894a" roughness={0.8} metalness={0.04} />
        </mesh>
        <mesh position={[BOARD_CENTER_X - (BOARD_SPAN + 0.17) / 2, BOARD_TOP_Y + 0.03, BOARD_CENTER_Z]}>
          <boxGeometry args={[0.17, 0.058, BOARD_SPAN]} />
          <meshStandardMaterial color="#b6894a" roughness={0.8} metalness={0.04} />
        </mesh>
        <mesh position={[BOARD_CENTER_X + (BOARD_SPAN + 0.17) / 2, BOARD_TOP_Y + 0.03, BOARD_CENTER_Z]}>
          <boxGeometry args={[0.17, 0.058, BOARD_SPAN]} />
          <meshStandardMaterial color="#b6894a" roughness={0.8} metalness={0.04} />
        </mesh>

        {Array.from({ length: GRID_SIZE + 1 }, (_, index) => {
          const minX = BOARD_ORIGIN_X - SLOT_SIZE / 2;
          const minZ = BOARD_ORIGIN_Z - SLOT_SIZE / 2;
          const lineX = minX + index * SLOT_PITCH;
          const lineZ = minZ + index * SLOT_PITCH;
          return (
            <group key={`preview-grid-line-${index}`}>
              <mesh position={[lineX, GRID_LINE_Y, BOARD_CENTER_Z]}>
                <boxGeometry args={[0.006, 0.0018, BOARD_SPAN]} />
                <meshStandardMaterial color="#6b5643" roughness={0.85} metalness={0} />
              </mesh>
              <mesh position={[BOARD_CENTER_X, GRID_LINE_Y, lineZ]}>
                <boxGeometry args={[BOARD_SPAN, 0.0018, 0.006]} />
                <meshStandardMaterial color="#6b5643" roughness={0.85} metalness={0} />
              </mesh>
            </group>
          );
        })}

        {PREVIEW_TILES.map((tile) => (
          <PreviewTile key={`preview-tile-${tile.n}`} number={tile.n} x={tile.x} z={tile.z} />
        ))}
      </Canvas>
    </div>
  );
}
