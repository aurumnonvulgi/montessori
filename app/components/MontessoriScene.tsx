"use client";

import { Canvas } from "@react-three/fiber";
import { Float, OrbitControls, RoundedBox } from "@react-three/drei";

const towerSizes = [1.6, 1.35, 1.1, 0.9, 0.7, 0.55, 0.4, 0.3];

type MontessoriSceneProps = {
  accentColor?: string;
};

function TowerBlock({ size, position, color }: { size: number; position: number; color: string }) {
  return (
    <RoundedBox
      args={[size, size * 0.4, size]}
      radius={0.08}
      position={[0, position, 0]}
      castShadow
      receiveShadow
    >
      <meshStandardMaterial color={color} roughness={0.35} metalness={0.05} />
    </RoundedBox>
  );
}

export default function MontessoriScene({ accentColor = "#e8b7bf" }: MontessoriSceneProps) {
  return (
    <div className="h-[360px] w-full overflow-hidden rounded-[20px] bg-[#f7efe4]">
      <Canvas
        shadows
        camera={{ position: [2.4, 2.2, 3.2], fov: 45 }}
        dpr={[1, 2]}
      >
        <color attach="background" args={["#f7efe4"]} />
        <ambientLight intensity={0.6} />
        <directionalLight
          position={[4, 6, 2]}
          intensity={1.1}
          castShadow
          shadow-mapSize-width={1024}
          shadow-mapSize-height={1024}
        />
        <Float speed={1.1} rotationIntensity={0.2} floatIntensity={0.3}>
          {towerSizes.map((size, index) => (
            <TowerBlock
              key={size}
              size={size}
              position={-0.45 + index * 0.18}
              color={index === 0 ? accentColor : "#f0c5c8"}
            />
          ))}
        </Float>
        <mesh
          rotation={[-Math.PI / 2, 0, 0]}
          position={[0, -0.65, 0]}
          receiveShadow
        >
          <planeGeometry args={[6, 6]} />
          <meshStandardMaterial color="#efe1cf" />
        </mesh>
        <OrbitControls enablePan={false} maxPolarAngle={Math.PI / 2.1} />
      </Canvas>
    </div>
  );
}
