"use client";

import { Canvas } from "@react-three/fiber";
import { OrbitControls, Text } from "@react-three/drei";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { playChime } from "../lib/sounds";
import { primeSpeechVoices, speakWithPreferredVoice } from "../lib/speech";

type SpindleBoxesSceneProps = {
  playing: boolean;
  voiceEnabled: boolean;
  className?: string;
  onLessonComplete?: () => void;
  isMobile?: boolean;
};

type LessonPhase = "idle" | "naming" | "counting" | "zero" | "complete";

const WOOD_COLOR = "#c9a66b";
const WOOD_DARK = "#a08050";
const SPINDLE_COLOR = "#d4b896";
const RUBBER_BAND_COLOR = "#c45c5c";

const BOX_WIDTH = 0.8;
const BOX_DEPTH = 0.4;
const BOX_HEIGHT = 0.08;
const COMPARTMENT_WIDTH = BOX_WIDTH / 5;

const SPINDLE_RADIUS = 0.012;
const SPINDLE_LENGTH = 0.18;
const BASKET_HEIGHT = 0.06;

const NUMERAL_WORDS = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine"];

const BOX_A_POS = new THREE.Vector3(-0.45, 0, 0.1);
const BOX_B_POS = new THREE.Vector3(0.45, 0, 0.1);
const BASKET_1_POS = new THREE.Vector3(-0.5, 0, -0.35);
const BASKET_2_POS = new THREE.Vector3(0.5, 0, -0.35);
const RUBBER_BAND_POS = new THREE.Vector3(0, 0, -0.35);

const getCompartmentPosition = (numeral: number): THREE.Vector3 => {
  const boxPos = numeral < 5 ? BOX_A_POS : BOX_B_POS;
  const localIndex = numeral < 5 ? numeral : numeral - 5;
  const x = boxPos.x + (localIndex - 2) * COMPARTMENT_WIDTH;
  const y = BOX_HEIGHT / 2 + 0.01;
  const z = boxPos.z;
  return new THREE.Vector3(x, y, z);
};

const getStagingPosition = (numeral: number, spindleIndex: number, total: number): THREE.Vector3 => {
  const compPos = getCompartmentPosition(numeral);
  const spacing = 0.03;
  const startX = compPos.x - ((total - 1) * spacing) / 2;
  return new THREE.Vector3(startX + spindleIndex * spacing, SPINDLE_RADIUS + 0.01, compPos.z + BOX_DEPTH / 2 + 0.08);
};

function WoodenBox({ position, numerals }: { position: THREE.Vector3; numerals: number[] }) {
  return (
    <group position={position}>
      <mesh position={[0, BOX_HEIGHT / 4, 0]} receiveShadow castShadow>
        <boxGeometry args={[BOX_WIDTH, BOX_HEIGHT / 2, BOX_DEPTH]} />
        <meshStandardMaterial color={WOOD_COLOR} />
      </mesh>
      <mesh position={[0, BOX_HEIGHT / 2 + 0.02, -BOX_DEPTH / 2 + 0.01]} castShadow>
        <boxGeometry args={[BOX_WIDTH, 0.06, 0.02]} />
        <meshStandardMaterial color={WOOD_COLOR} />
      </mesh>
      {[-2, -1, 0, 1].map((i) => (
        <mesh key={i} position={[(i + 0.5) * COMPARTMENT_WIDTH, BOX_HEIGHT / 2 + 0.015, 0]} castShadow>
          <boxGeometry args={[0.008, 0.05, BOX_DEPTH - 0.02]} />
          <meshStandardMaterial color={WOOD_DARK} />
        </mesh>
      ))}
      <mesh position={[-BOX_WIDTH / 2 + 0.01, BOX_HEIGHT / 2 + 0.015, 0]} castShadow>
        <boxGeometry args={[0.02, 0.05, BOX_DEPTH]} />
        <meshStandardMaterial color={WOOD_COLOR} />
      </mesh>
      <mesh position={[BOX_WIDTH / 2 - 0.01, BOX_HEIGHT / 2 + 0.015, 0]} castShadow>
        <boxGeometry args={[0.02, 0.05, BOX_DEPTH]} />
        <meshStandardMaterial color={WOOD_COLOR} />
      </mesh>
      {numerals.map((n, i) => (
        <Text key={n} position={[(i - 2) * COMPARTMENT_WIDTH, BOX_HEIGHT + 0.06, -BOX_DEPTH / 2 + 0.02]} fontSize={0.05} color="#5a4a32" anchorX="center" anchorY="middle">
          {String(n)}
        </Text>
      ))}
    </group>
  );
}

function Basket({ position }: { position: THREE.Vector3 }) {
  return (
    <group position={position}>
      <mesh position={[0, BASKET_HEIGHT / 2, 0]} receiveShadow castShadow>
        <boxGeometry args={[0.2, BASKET_HEIGHT, 0.15]} />
        <meshStandardMaterial color="#a08060" />
      </mesh>
      <mesh position={[0, BASKET_HEIGHT + 0.005, 0]}>
        <boxGeometry args={[0.21, 0.01, 0.16]} />
        <meshStandardMaterial color="#8b7050" />
      </mesh>
    </group>
  );
}

function Spindle({ position, isHighlighted, onClick }: { position: THREE.Vector3; isHighlighted?: boolean; onClick?: () => void }) {
  return (
    <mesh position={position} rotation={[Math.PI / 2, 0, 0]} onClick={onClick} castShadow>
      <cylinderGeometry args={[SPINDLE_RADIUS, SPINDLE_RADIUS * 0.8, SPINDLE_LENGTH, 12]} />
      <meshStandardMaterial color={isHighlighted ? "#ffe066" : SPINDLE_COLOR} emissive={isHighlighted ? "#ffe066" : "#000000"} emissiveIntensity={isHighlighted ? 0.3 : 0} />
    </mesh>
  );
}

function RubberBandContainer({ position, count }: { position: THREE.Vector3; count: number }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.015, 0]} receiveShadow>
        <cylinderGeometry args={[0.06, 0.05, 0.03, 16]} />
        <meshStandardMaterial color="#e8dfd4" />
      </mesh>
      {Array.from({ length: Math.min(count, 9) }).map((_, i) => {
        const angle = (i / 9) * Math.PI * 2;
        const r = 0.025;
        return (
          <mesh key={i} position={[Math.cos(angle) * r, 0.035, Math.sin(angle) * r]} rotation={[Math.PI / 2, 0, angle]}>
            <torusGeometry args={[0.015, 0.003, 8, 16]} />
            <meshStandardMaterial color={RUBBER_BAND_COLOR} />
          </mesh>
        );
      })}
    </group>
  );
}

function SpindleBundle({ position, count, hasRubberBand }: { position: THREE.Vector3; count: number; hasRubberBand: boolean }) {
  const spacing = 0.025;
  const startX = -((count - 1) * spacing) / 2;
  return (
    <group position={position}>
      {Array.from({ length: count }).map((_, i) => (
        <mesh key={i} position={[startX + i * spacing, 0, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow>
          <cylinderGeometry args={[SPINDLE_RADIUS, SPINDLE_RADIUS * 0.8, SPINDLE_LENGTH, 12]} />
          <meshStandardMaterial color={SPINDLE_COLOR} />
        </mesh>
      ))}
      {hasRubberBand && count > 1 && (
        <mesh position={[0, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
          <torusGeometry args={[spacing * count * 0.4, 0.004, 8, 16]} />
          <meshStandardMaterial color={RUBBER_BAND_COLOR} />
        </mesh>
      )}
    </group>
  );
}

function SpindleBoxesContent({ playing, voiceEnabled, onComplete }: { playing: boolean; voiceEnabled: boolean; onComplete?: () => void }) {
  const [phase, setPhase] = useState<LessonPhase>("idle");
  const [namingIndex, setNamingIndex] = useState(0);
  const [countingNumeral, setCountingNumeral] = useState(1);
  const [stagedSpindles, setStagedSpindles] = useState<number[]>([]);
  const [placedBundles, setPlacedBundles] = useState<Record<number, number>>({});
  const [rubberBandsUsed, setRubberBandsUsed] = useState(0);
  const [basket1Count, setBasket1Count] = useState(10);
  const [basket2Count, setBasket2Count] = useState(35);
  const [highlightedNumeral, setHighlightedNumeral] = useState<number | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  
  const phaseTimerRef = useRef<number | null>(null);
  const spokenRef = useRef<Record<string, boolean>>({});

  useEffect(() => {
    if (playing && phase === "idle") {
      setPhase("naming");
      setNamingIndex(0);
      spokenRef.current = {};
    }
  }, [playing, phase]);

  useEffect(() => {
    if (phase !== "naming" || !voiceEnabled) return;
    const key = "naming-" + namingIndex;
    if (spokenRef.current[key]) return;
    spokenRef.current[key] = true;
    setHighlightedNumeral(namingIndex);
    const text = namingIndex === 0 ? "This is zero." : NUMERAL_WORDS[namingIndex] + ".";
    speakWithPreferredVoice(text, { rate: 0.85, pitch: 0.95 });
    phaseTimerRef.current = window.setTimeout(() => {
      if (namingIndex < 9) {
        setNamingIndex(namingIndex + 1);
      } else {
        setHighlightedNumeral(null);
        setPhase("counting");
        setCountingNumeral(1);
      }
    }, 2000);
    return () => { if (phaseTimerRef.current) clearTimeout(phaseTimerRef.current); };
  }, [phase, namingIndex, voiceEnabled]);

  useEffect(() => {
    if (phase !== "counting" || !voiceEnabled || isAnimating) return;
    const key = "counting-prompt-" + countingNumeral;
    if (spokenRef.current[key]) return;
    spokenRef.current[key] = true;
    setHighlightedNumeral(countingNumeral);
    speakWithPreferredVoice(NUMERAL_WORDS[countingNumeral] + ".", { rate: 0.85, pitch: 0.95 });
  }, [phase, countingNumeral, voiceEnabled, isAnimating]);

  const handleSpindlePickup = useCallback(() => {
    if (phase !== "counting" || isAnimating) return;
    if (stagedSpindles.length >= countingNumeral) return;
    if (basket1Count > 0) {
      setBasket1Count(basket1Count - 1);
    } else if (basket2Count > 0) {
      setBasket2Count(basket2Count - 1);
    } else {
      return;
    }
    const newCount = stagedSpindles.length + 1;
    setStagedSpindles([...stagedSpindles, newCount]);
    speakWithPreferredVoice(NUMERAL_WORDS[newCount] + ".", { rate: 0.85, pitch: 0.95 });
    if (newCount === countingNumeral) {
      setIsAnimating(true);
      phaseTimerRef.current = window.setTimeout(() => {
        speakWithPreferredVoice(NUMERAL_WORDS[countingNumeral] + ".", { rate: 0.8, pitch: 0.9 });
        if (countingNumeral >= 2) {
          setRubberBandsUsed(prev => prev + 1);
        }
        setPlacedBundles(prev => ({ ...prev, [countingNumeral]: countingNumeral }));
        setStagedSpindles([]);
        playChime();
        setTimeout(() => {
          setIsAnimating(false);
          if (countingNumeral < 9) {
            setCountingNumeral(countingNumeral + 1);
          } else {
            setPhase("zero");
            setHighlightedNumeral(0);
          }
        }, 1500);
      }, 1000);
    }
  }, [phase, isAnimating, stagedSpindles, countingNumeral, basket1Count, basket2Count]);

  useEffect(() => {
    if (phase !== "zero" || !voiceEnabled) return;
    const key = "zero-phase";
    if (spokenRef.current[key]) return;
    spokenRef.current[key] = true;
    setHighlightedNumeral(0);
    speakWithPreferredVoice("Zero.", { rate: 0.85, pitch: 0.95 });
    setTimeout(() => { speakWithPreferredVoice("The basket is empty.", { rate: 0.85, pitch: 0.95 }); }, 1500);
    setTimeout(() => { speakWithPreferredVoice("Zero stands for the empty set.", { rate: 0.85, pitch: 0.95 }); }, 4000);
    setTimeout(() => { setPhase("complete"); setHighlightedNumeral(null); if (onComplete) onComplete(); }, 7000);
  }, [phase, voiceEnabled, onComplete]);

  useEffect(() => { return () => { if (phaseTimerRef.current) clearTimeout(phaseTimerRef.current); }; }, []);

  return (
    <group>
      <ambientLight intensity={0.5} />
      <directionalLight position={[2, 4, 2]} intensity={1} castShadow shadow-mapSize={[1024, 1024]} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[3, 2]} />
        <meshStandardMaterial color="#e8dfd4" />
      </mesh>
      <WoodenBox position={BOX_A_POS} numerals={[0, 1, 2, 3, 4]} />
      <WoodenBox position={BOX_B_POS} numerals={[5, 6, 7, 8, 9]} />
      {highlightedNumeral !== null && (
        <mesh position={getCompartmentPosition(highlightedNumeral).clone().add(new THREE.Vector3(0, 0.08, 0))}>
          <ringGeometry args={[0.04, 0.05, 32]} />
          <meshBasicMaterial color="#ffe066" transparent opacity={0.8} />
        </mesh>
      )}
      <Basket position={BASKET_1_POS} />
      <Basket position={BASKET_2_POS} />
      {phase === "counting" && !isAnimating && (basket1Count > 0 || basket2Count > 0) && (
        <group>
          {basket1Count > 0 && (
            <Spindle position={new THREE.Vector3(BASKET_1_POS.x, BASKET_HEIGHT + SPINDLE_RADIUS, BASKET_1_POS.z)} isHighlighted={true} onClick={handleSpindlePickup} />
          )}
          {basket1Count === 0 && basket2Count > 0 && (
            <Spindle position={new THREE.Vector3(BASKET_2_POS.x, BASKET_HEIGHT + SPINDLE_RADIUS, BASKET_2_POS.z)} isHighlighted={true} onClick={handleSpindlePickup} />
          )}
        </group>
      )}
      {stagedSpindles.map((_, index) => (
        <Spindle key={index} position={getStagingPosition(countingNumeral, index, stagedSpindles.length)} />
      ))}
      {Object.entries(placedBundles).map(([numeral, count]) => (
        <SpindleBundle key={numeral} position={getCompartmentPosition(parseInt(numeral))} count={count} hasRubberBand={parseInt(numeral) >= 2} />
      ))}
      <RubberBandContainer position={RUBBER_BAND_POS} count={9 - rubberBandsUsed} />
    </group>
  );
}


export default function SpindleBoxesScene({ playing, voiceEnabled, className, onLessonComplete, isMobile = false }: SpindleBoxesSceneProps) {
  useEffect(() => { primeSpeechVoices(); }, []);

  const cameraPosition = useMemo(() => (isMobile ? [0, 0.6, 0.9] : [0, 0.8, 1.1]) as [number, number, number], [isMobile]);
  const cameraFov = isMobile ? 50 : 40;

  return (
    <div className={`w-full overflow-hidden ${isMobile ? "" : "rounded-[28px]"} bg-[#f7efe4] ${className ?? "h-[420px]"}`}>
      <Canvas shadows camera={{ position: cameraPosition, fov: cameraFov }}>
        <color attach="background" args={["#f7efe4"]} />
        <SpindleBoxesContent playing={playing} voiceEnabled={voiceEnabled} onComplete={onLessonComplete} />
        <OrbitControls enablePan={false} enableZoom maxPolarAngle={Math.PI / 2.1} minDistance={0.5} maxDistance={2} target={[0, 0.05, 0]} />
      </Canvas>
    </div>
  );
}
