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
  stageIndex?: number; // 0 = numerals 0-4, 1 = numerals 5-9, undefined = all
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

const BACK_WALL_HEIGHT = 0.1;
const NUMBER_BACK_Y = BOX_HEIGHT / 2 + BACK_WALL_HEIGHT / 2 - 0.01;
const NUMBER_BACK_Z_OFFSET = -BOX_DEPTH / 2 + 0.025;

const BOX_A_POS = new THREE.Vector3(-0.45, 0, 0.1);
const BOX_B_POS = new THREE.Vector3(0.45, 0, 0.1);
const BASKET_1_POS = new THREE.Vector3(-1.3, 0, 0.15);
const BASKET_2_POS = new THREE.Vector3(1.3, 0, 0.15);
const SPINDLE_CONTAINER_OFFSET = 0.25; // approx. 50px worth of distance
const STAGE0_BOX_X = -0.25;
const STAGE_BASKET_LEFT = new THREE.Vector3(STAGE0_BOX_X - BOX_WIDTH / 2 - SPINDLE_CONTAINER_OFFSET, 0, 0.1);
const STAGE_BASKET_RIGHT = new THREE.Vector3(-BOX_WIDTH / 2 - SPINDLE_CONTAINER_OFFSET, 0, 0.1);
const RUBBER_BAND_BASE = new THREE.Vector3(-0.78, 0, 0.08);
const SCENE_OFFSET_STAGE0 = -0.15;
const RUBBER_BAND_CONTAINER_COLOR = WOOD_COLOR;

const getCompartmentPosition = (numeral: number, stageIndex?: number): THREE.Vector3 => {
  // When showing a single box, it's centered at (0, 0, 0.1)
  let boxPos: THREE.Vector3;
  let localIndex: number;

  if (stageIndex === 0) {
    // Stage 1: only box A, shifted left
    boxPos = new THREE.Vector3(STAGE0_BOX_X, 0, 0.1);
    localIndex = numeral;
  } else if (stageIndex === 1) {
    // Stage 2: only box B, centered
    boxPos = new THREE.Vector3(0, 0, 0.1);
    localIndex = numeral - 5;
  } else {
    // Full lesson: both boxes in original positions
    boxPos = numeral < 5 ? BOX_A_POS : BOX_B_POS;
    localIndex = numeral < 5 ? numeral : numeral - 5;
  }

  const x = boxPos.x + (localIndex - 2) * COMPARTMENT_WIDTH;
  const y = BOX_HEIGHT / 2 + 0.01;
  const z = boxPos.z;
  return new THREE.Vector3(x, y, z);
};

const getStagingPosition = (numeral: number, spindleIndex: number, total: number, stageIndex?: number): THREE.Vector3 => {
  const compPos = getCompartmentPosition(numeral, stageIndex);
  const spacing = 0.03;
  const startX = compPos.x - ((total - 1) * spacing) / 2;
  return new THREE.Vector3(startX + spindleIndex * spacing, SPINDLE_RADIUS + 0.01, compPos.z + BOX_DEPTH / 2 + 0.08);
};

function WoodenBox({ position, numerals }: { position: THREE.Vector3; numerals: number[] }) {
  const backWallHeight = BACK_WALL_HEIGHT; // Taller back wall for number backing
  return (
    <group position={position}>
      {/* Base of the box */}
      <mesh position={[0, BOX_HEIGHT / 4, 0]} receiveShadow castShadow>
        <boxGeometry args={[BOX_WIDTH, BOX_HEIGHT / 2, BOX_DEPTH]} />
        <meshStandardMaterial color={WOOD_COLOR} />
      </mesh>
      {/* Back wall - extended height for number backing */}
      <mesh position={[0, BOX_HEIGHT / 2 + backWallHeight / 2 - 0.01, -BOX_DEPTH / 2 + 0.01]} castShadow>
        <boxGeometry args={[BOX_WIDTH, backWallHeight, 0.02]} />
        <meshStandardMaterial color={WOOD_COLOR} />
      </mesh>
      {/* Dividers between compartments */}
      {[-2, -1, 0, 1].map((i) => (
        <mesh key={i} position={[(i + 0.5) * COMPARTMENT_WIDTH, BOX_HEIGHT / 2 + 0.015, 0]} castShadow>
          <boxGeometry args={[0.008, 0.05, BOX_DEPTH - 0.02]} />
          <meshStandardMaterial color={WOOD_DARK} />
        </mesh>
      ))}
      {/* Left wall */}
      <mesh position={[-BOX_WIDTH / 2 + 0.01, BOX_HEIGHT / 2 + 0.015, 0]} castShadow>
        <boxGeometry args={[0.02, 0.05, BOX_DEPTH]} />
        <meshStandardMaterial color={WOOD_COLOR} />
      </mesh>
      {/* Right wall */}
      <mesh position={[BOX_WIDTH / 2 - 0.01, BOX_HEIGHT / 2 + 0.015, 0]} castShadow>
        <boxGeometry args={[0.02, 0.05, BOX_DEPTH]} />
        <meshStandardMaterial color={WOOD_COLOR} />
      </mesh>
      {/* Numbers on the back wall - lowered position */}
      {numerals.map((n, i) => (
        <Text key={n} position={[(i - 2) * COMPARTMENT_WIDTH, BOX_HEIGHT / 2 + backWallHeight / 2 - 0.01, -BOX_DEPTH / 2 + 0.025]} fontSize={0.04} color="#5a4a32" anchorX="center" anchorY="middle">
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
        <meshStandardMaterial color={RUBBER_BAND_CONTAINER_COLOR} />
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

type SpindleBoxesContentProps = {
  playing: boolean;
  voiceEnabled: boolean;
  onComplete?: () => void;
  stageIndex?: number;
  sceneOffsetX?: number;
  rubberBandPosition?: THREE.Vector3;
};

function SpindleBoxesContent({
  playing,
  voiceEnabled,
  onComplete,
  stageIndex,
  sceneOffsetX = 0,
  rubberBandPosition,
}: SpindleBoxesContentProps) {
  // Determine which numerals to use based on stage
  const stageNumerals = stageIndex === 0 ? [0, 1, 2, 3, 4] : stageIndex === 1 ? [5, 6, 7, 8, 9] : [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
  const startNumeral = stageNumerals[0];
  const endNumeral = stageNumerals[stageNumerals.length - 1];
  const firstCountingNumeral = stageIndex === 1 ? 5 : 1; // Stage 2 starts counting at 5, stage 1 and full lesson at 1

  const [phase, setPhase] = useState<LessonPhase>("idle");
  const [namingIndex, setNamingIndex] = useState(startNumeral);
  const [countingNumeral, setCountingNumeral] = useState(firstCountingNumeral);
  const [stagedSpindles, setStagedSpindles] = useState<number[]>([]);
  const [placedBundles, setPlacedBundles] = useState<Record<number, number>>({});
  const [rubberBandsUsed, setRubberBandsUsed] = useState(0);
  const [basket1Count, setBasket1Count] = useState(stageIndex === 1 ? 0 : 10);
  const [basket2Count, setBasket2Count] = useState(stageIndex === 0 ? 0 : stageIndex === 1 ? 35 : 35);
  const [highlightedNumeral, setHighlightedNumeral] = useState<number | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);

  const phaseTimerRef = useRef<number | null>(null);
  const spokenRef = useRef<Record<string, boolean>>({});

  useEffect(() => {
    if (playing && phase === "idle") {
      setPhase("naming");
      setNamingIndex(startNumeral);
      spokenRef.current = {};
    }
  }, [playing, phase, startNumeral]);

  useEffect(() => {
    if (phase !== "naming" || !voiceEnabled) return;
    const key = "naming-" + namingIndex;
    if (spokenRef.current[key]) return;
    spokenRef.current[key] = true;
    setHighlightedNumeral(namingIndex);
    const text = namingIndex === 0 ? "This is zero." : NUMERAL_WORDS[namingIndex] + ".";
    speakWithPreferredVoice(text, { rate: 0.85, pitch: 0.95 });
    phaseTimerRef.current = window.setTimeout(() => {
      if (namingIndex < endNumeral) {
        setNamingIndex(namingIndex + 1);
      } else {
        setHighlightedNumeral(null);
        // For stage 1 (0-4), go to counting at 1. For stage 2 (5-9), go to counting at 5. For full, start at 1.
        setPhase("counting");
        setCountingNumeral(firstCountingNumeral);
      }
    }, 2000);
    return () => { if (phaseTimerRef.current) clearTimeout(phaseTimerRef.current); };
  }, [phase, namingIndex, voiceEnabled, endNumeral, firstCountingNumeral]);

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
          if (countingNumeral < endNumeral) {
            setCountingNumeral(countingNumeral + 1);
          } else {
            // Stage 1 (0-4) goes to zero phase, stage 2 (5-9) completes directly
            if (stageIndex === 1) {
              setPhase("complete");
              setHighlightedNumeral(null);
              if (onComplete) onComplete();
            } else {
              setPhase("zero");
              setHighlightedNumeral(0);
            }
          }
        }, 1500);
      }, 1000);
    }
  }, [phase, isAnimating, stagedSpindles, countingNumeral, basket1Count, basket2Count, stageIndex, endNumeral, onComplete]);

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

  const highlightPosition = useMemo(() => {
    if (highlightedNumeral === null) return null;
    const position = getCompartmentPosition(highlightedNumeral, stageIndex).clone();
    position.y = NUMBER_BACK_Y;
    position.z += NUMBER_BACK_Z_OFFSET;
    return position;
  }, [highlightedNumeral, stageIndex]);

  return (
    <group position={[sceneOffsetX, 0, 0]}>
      <ambientLight intensity={0.7} />
      <directionalLight
        position={[2, 4, 2]}
        intensity={0.7}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-bias={-0.0001}
        shadow-normalBias={0.02}
        shadow-radius={12}
      />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[3, 2]} />
        <meshStandardMaterial color="#e8dfd4" />
      </mesh>
      {(stageIndex === undefined || stageIndex === 0) && (
        <WoodenBox
          position={stageIndex === 0 ? new THREE.Vector3(STAGE0_BOX_X, 0, 0.1) : BOX_A_POS}
          numerals={[0, 1, 2, 3, 4]}
        />
      )}
      {(stageIndex === undefined || stageIndex === 1) && (
        <WoodenBox
          position={stageIndex === 1 ? new THREE.Vector3(0, 0, 0.1) : BOX_B_POS}
          numerals={[5, 6, 7, 8, 9]}
        />
      )}
      {highlightPosition && (
        <mesh position={highlightPosition}>
          <ringGeometry args={[0.03, 0.0375, 32]} />
          <meshBasicMaterial color="#ffe066" transparent opacity={0.8} />
        </mesh>
      )}
      {/* Baskets - positioned based on stage */}
      {(stageIndex === undefined || stageIndex === 0) && basket1Count > 0 && (
        <Basket position={stageIndex === 0 ? STAGE_BASKET_LEFT : BASKET_1_POS} />
      )}
      {(stageIndex === undefined || stageIndex === 1) && basket2Count > 0 && (
        <Basket position={stageIndex === 1 ? STAGE_BASKET_RIGHT : BASKET_2_POS} />
      )}
      {phase === "counting" && !isAnimating && (basket1Count > 0 || basket2Count > 0) && (
        <group>
          {basket1Count > 0 && (
            <Spindle
              position={
                stageIndex === 0
                  ? new THREE.Vector3(
                      STAGE_BASKET_LEFT.x,
                      BASKET_HEIGHT + SPINDLE_RADIUS,
                      STAGE_BASKET_LEFT.z + 0.1
                    )
                  : new THREE.Vector3(
                      BASKET_1_POS.x,
                      BASKET_HEIGHT + SPINDLE_RADIUS,
                      BASKET_1_POS.z + 0.05
                    )
              }
              isHighlighted={true}
              onClick={handleSpindlePickup}
            />
          )}
          {basket1Count === 0 && basket2Count > 0 && (
            <Spindle
              position={
                stageIndex === 1
                  ? new THREE.Vector3(
                      STAGE_BASKET_RIGHT.x,
                      BASKET_HEIGHT + SPINDLE_RADIUS,
                      STAGE_BASKET_RIGHT.z + 0.1
                    )
                  : new THREE.Vector3(
                      BASKET_2_POS.x,
                      BASKET_HEIGHT + SPINDLE_RADIUS,
                      BASKET_2_POS.z + 0.05
                    )
              }
              isHighlighted={true}
              onClick={handleSpindlePickup}
            />
          )}
        </group>
      )}
      {stagedSpindles.map((_, index) => (
        <Spindle key={index} position={getStagingPosition(countingNumeral, index, stagedSpindles.length, stageIndex)} />
      ))}
      {Object.entries(placedBundles).map(([numeral, count]) => (
        <SpindleBundle key={numeral} position={getCompartmentPosition(parseInt(numeral), stageIndex)} count={count} hasRubberBand={parseInt(numeral) >= 2} />
      ))}
      <RubberBandContainer
        position={
          rubberBandPosition ??
          (stageIndex === 0
            ? STAGE_BASKET_LEFT.clone().add(new THREE.Vector3(0, 0, 0.15))
            : stageIndex === 1
              ? STAGE_BASKET_RIGHT.clone().add(new THREE.Vector3(0, 0, 0.15))
              : RUBBER_BAND_BASE)
        }
        count={stageIndex === 0 ? 3 - rubberBandsUsed : stageIndex === 1 ? 5 - rubberBandsUsed : 9 - rubberBandsUsed}
      />
    </group>
  );
}


export default function SpindleBoxesScene({ playing, voiceEnabled, className, onLessonComplete, isMobile = false, stageIndex }: SpindleBoxesSceneProps) {
  useEffect(() => { primeSpeechVoices(); }, []);

  // For single-box stages, adjust camera to center on the relevant box
  const focusedPosition = useMemo(() => {
    const targetNumeral = stageIndex === 0 ? 2 : stageIndex === 1 ? 7 : 2;
    return getCompartmentPosition(targetNumeral, stageIndex);
  }, [stageIndex]);

  const sceneOffsetX = stageIndex === 0 ? SCENE_OFFSET_STAGE0 : 0;
  const shiftedFocusX = focusedPosition.x + sceneOffsetX;

  const cameraPosition = useMemo(() => {
    const z =
      stageIndex === 0 ? (isMobile ? 1.0 : 1.8) : stageIndex === 1 ? (isMobile ? 0.9 : 1.0) : isMobile ? 0.9 : 1.1;
    return [shiftedFocusX, isMobile ? 0.5 : 0.7, z];
  }, [shiftedFocusX, isMobile, stageIndex]) as [number, number, number];

  const cameraTarget = useMemo(
    () => [shiftedFocusX, 0.05, focusedPosition.z],
    [focusedPosition.z, shiftedFocusX],
  ) as [number, number, number];

  const rubberBandPosition = useMemo(() => {
    if (stageIndex === 0) {
      return STAGE_BASKET_LEFT.clone().add(new THREE.Vector3(0, 0, 0.15));
    }
    if (stageIndex === 1) {
      return STAGE_BASKET_RIGHT.clone().add(new THREE.Vector3(0, 0, 0.15));
    }
    return new THREE.Vector3(0, 0, RUBBER_BAND_BASE.z);
  }, [stageIndex]);

  const cameraFov = useMemo(() => {
    if (stageIndex === 0) return isMobile ? 52 : 48;
    if (stageIndex === 1) return isMobile ? 50 : 42;
    return isMobile ? 50 : 40;
  }, [isMobile, stageIndex]);

  return (
    <div className={`w-full overflow-hidden ${isMobile ? "" : "rounded-[28px]"} bg-[#f7efe4] ${className ?? "h-[420px]"}`}>
      <Canvas shadows camera={{ position: cameraPosition, fov: cameraFov }}>
        <color attach="background" args={["#f7efe4"]} />
        <SpindleBoxesContent
          playing={playing}
          voiceEnabled={voiceEnabled}
          onComplete={onLessonComplete}
          stageIndex={stageIndex}
          sceneOffsetX={sceneOffsetX}
          rubberBandPosition={rubberBandPosition}
        />
        <OrbitControls
          enablePan={false}
          enableZoom
          maxPolarAngle={Math.PI / 2.1}
          minAzimuthAngle={-Math.PI / 4}
          maxAzimuthAngle={Math.PI / 4}
          minDistance={0.7}
          maxDistance={1.25}
          target={cameraTarget}
        />
      </Canvas>
    </div>
  );
}
