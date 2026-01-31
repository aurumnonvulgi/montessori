"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { primeSpeechVoices, speakWithPreferredVoice } from "../lib/speech";
import { playChime } from "../lib/sounds";

// ============================================================================
// TYPES
// ============================================================================

type NumeralsAndCountersSceneProps = {
  playing: boolean;
  voiceEnabled: boolean;
  stageIndex?: number;
  onComplete?: () => void;
  onStageComplete?: () => void;
  className?: string;
};

type Step = {
  id: string;
  duration: number;
};

type Timeline = {
  map: Record<string, { start: number; end: number }>;
  total: number;
};

type VoiceCue = {
  id: string;
  text: string;
  offset?: number;
};

type QuizPhase = "click" | "name" | null;

// ============================================================================
// CONSTANTS
// ============================================================================

export const NUMERALS_AND_COUNTERS_STAGES = [
  [1, 2, 3],
  [4, 5, 6],
  [7, 8, 9],
  [10],
];

const numberWords = [
  "one", "two", "three", "four", "five",
  "six", "seven", "eight", "nine", "ten",
];

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function buildTimeline(steps: Step[]): Timeline {
  const map: Record<string, { start: number; end: number }> = {};
  let total = 0;

  for (const step of steps) {
    map[step.id] = { start: total, end: total + step.duration };
    total += step.duration;
  }

  return { map, total };
}

function buildAnimationSteps(numerals: number[]): Step[] {
  const steps: Step[] = [];

  for (const numeral of numerals) {
    steps.push({ id: `card${numeral}Slide`, duration: 1.5 });
    steps.push({ id: `card${numeral}Stop`, duration: 0.5 });
    steps.push({ id: `card${numeral}Intro`, duration: 2.0 });

    for (let i = 0; i < numeral; i++) {
      steps.push({ id: `counter${numeral}_${i}Drop`, duration: 1.2 });
    }

    steps.push({ id: `card${numeral}Pause`, duration: 1.0 });
  }

  return steps;
}

function buildVoiceCues(timeline: Timeline, numerals: number[]): VoiceCue[] {
  const cues: VoiceCue[] = [];

  for (const numeral of numerals) {
    const introId = `card${numeral}Intro`;
    if (timeline.map[introId]) {
      cues.push({ id: introId, text: `This is ${numberWords[numeral - 1]}`, offset: 0.3 });
    }

    for (let i = 0; i < numeral; i++) {
      const dropId = `counter${numeral}_${i}Drop`;
      if (timeline.map[dropId]) {
        cues.push({ id: dropId, text: numberWords[i], offset: 0.4 });
      }
    }
  }

  return cues;
}

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

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

function smoothstep(t: number): number {
  return t * t * (3 - 2 * t);
}

function easeOutBounce(t: number): number {
  if (t < 1 / 2.75) {
    return 7.5625 * t * t;
  } else if (t < 2 / 2.75) {
    const t2 = t - 1.5 / 2.75;
    return 7.5625 * t2 * t2 + 0.75;
  } else if (t < 2.5 / 2.75) {
    const t2 = t - 2.25 / 2.75;
    return 7.5625 * t2 * t2 + 0.9375;
  } else {
    const t2 = t - 2.625 / 2.75;
    return 7.5625 * t2 * t2 + 0.984375;
  }
}

const speakText = (text: string) => {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) {
    return;
  }
  speakWithPreferredVoice(text, { rate: 0.85, pitch: 0.95, volume: 0.8 });
};

// ============================================================================
// SCENE CONTENT
// ============================================================================

type NumeralsAndCountersContentProps = {
  playing: boolean;
  voiceEnabled: boolean;
  numerals: number[];
  stageKey: number;
  onComplete?: () => void;
  onStageComplete?: () => void;
};

function NumeralsAndCountersContent({
  playing,
  voiceEnabled,
  numerals,
  stageKey,
  onStageComplete,
}: NumeralsAndCountersContentProps) {
  const startTimeRef = useRef<number | null>(null);
  const completedRef = useRef(false);
  const spokenRef = useRef<Record<string, boolean>>({});
  const quizDoneRef = useRef(false);
  const quizCompleteRef = useRef(false);
  const promptRef = useRef<Record<string, boolean>>({});
  const timeoutRef = useRef<number | null>(null);
  const recognitionRef = useRef<any>(null);
  const awaitingAnswerRef = useRef(false);

  const [quizPhase, setQuizPhase] = useState<QuizPhase>(null);
  const [quizIndex, setQuizIndex] = useState<number | null>(null);
  const [quizLiftCard, setQuizLiftCard] = useState<number | null>(null);

  // For counter group animation
  const [groupingNumeral, setGroupingNumeral] = useState<number | null>(null);
  const groupingStartTimeRef = useRef<number | null>(null);
  const GROUP_ANIMATION_DURATION = 0.8;

  // Build timeline and voice cues
  const timeline = useMemo(() => {
    const steps = buildAnimationSteps(numerals);
    return buildTimeline(steps);
  }, [numerals]);

  const voiceCues = useMemo(() => {
    return buildVoiceCues(timeline, numerals);
  }, [timeline, numerals]);

  // Quiz orders
  const clickOrder = useMemo(() => [...numerals].reverse(), [numerals]);
  const nameOrder = useMemo(() => [...numerals], [numerals]);

  const currentTarget = useMemo(() => {
    if (quizIndex === null) return null;
    if (quizPhase === "click") return clickOrder[quizIndex];
    if (quizPhase === "name") return nameOrder[quizIndex];
    return null;
  }, [quizIndex, quizPhase, clickOrder, nameOrder]);

  // Create textures
  const numeralTextures = useMemo(() => {
    return numerals.map((n) => createNumeralTexture(n));
  }, [numerals]);

  // Calculate counter positions and center points for each numeral
  const counterData = useMemo(() => {
    const data: Record<number, {
      startX: number;
      startZ: number;
      finalX: number;
      finalZ: number;
      centerX: number;
      centerZ: number;
    }[]> = {};
    const cardSpacing = 1.6;
    const baseX = -((numerals.length - 1) * cardSpacing) / 2;

    numerals.forEach((numeral, idx) => {
      const cardX = baseX + idx * cardSpacing;
      const baseZ = 0.9;
      const counters: { startX: number; startZ: number; finalX: number; finalZ: number; centerX: number; centerZ: number }[] = [];

      const pairs = Math.floor(numeral / 2);
      const hasOdd = numeral % 2 === 1;

      // Calculate all positions first to find center
      const allPositions: { x: number; z: number }[] = [];

      for (let p = 0; p < pairs; p++) {
        const pairZ = baseZ + p * 0.35;
        allPositions.push({ x: cardX - 0.18, z: pairZ });
        allPositions.push({ x: cardX + 0.18, z: pairZ });
      }
      if (hasOdd) {
        const oddZ = baseZ + pairs * 0.35;
        // Odd counter always goes on the left
        allPositions.push({ x: cardX - 0.18, z: oddZ });
      }

      // Calculate center of all counters
      const centerX = allPositions.reduce((sum, p) => sum + p.x, 0) / allPositions.length;
      const centerZ = allPositions.reduce((sum, p) => sum + p.z, 0) / allPositions.length;

      // Create counter data with center reference
      for (let p = 0; p < pairs; p++) {
        const pairZ = baseZ + p * 0.35;
        counters.push({
          startX: cardX,
          startZ: -1,
          finalX: cardX - 0.18,
          finalZ: pairZ,
          centerX,
          centerZ,
        });
        counters.push({
          startX: cardX,
          startZ: -1,
          finalX: cardX + 0.18,
          finalZ: pairZ,
          centerX,
          centerZ,
        });
      }

      if (hasOdd) {
        const oddZ = baseZ + pairs * 0.35;
        // Odd counter always goes on the left
        counters.push({
          startX: cardX,
          startZ: -1,
          finalX: cardX - 0.18,
          finalZ: oddZ,
          centerX,
          centerZ,
        });
      }

      data[numeral] = counters;
    });

    return data;
  }, [numerals]);

  // Refs for 3D objects
  const cardRefs = useRef<Record<number, THREE.Group | null>>({});
  const cardMaterialRefs = useRef<Record<number, THREE.MeshStandardMaterial | null>>({});
  const counterRefs = useRef<Record<number, (THREE.Mesh | null)[]>>({});

  // Initialize counter refs
  useEffect(() => {
    numerals.forEach((numeral) => {
      if (!counterRefs.current[numeral]) {
        counterRefs.current[numeral] = [];
      }
    });
  }, [numerals]);

  // Reset state when playing changes or stage changes
  useEffect(() => {
    startTimeRef.current = null;
    completedRef.current = false;
    spokenRef.current = {};
    quizDoneRef.current = false;
    quizCompleteRef.current = false;
    promptRef.current = {};
    awaitingAnswerRef.current = false;
    setQuizPhase(null);
    setQuizIndex(null);
    setQuizLiftCard(null);
    setGroupingNumeral(null);
    groupingStartTimeRef.current = null;

    if (timeoutRef.current) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // ignore
      }
      recognitionRef.current = null;
    }

    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
  }, [playing, stageKey]);

  // Start click quiz after presentation completes
  const handleSequenceComplete = useCallback(() => {
    if (!quizDoneRef.current) {
      quizDoneRef.current = true;
      setQuizPhase("click");
      setQuizIndex(0);
    }
  }, []);

  // Start speech recognition for name quiz
  const startRecognition = useCallback((onFinished: () => void) => {
    if (typeof window === "undefined") return false;

    const speechWindow = window as unknown as {
      SpeechRecognition?: new () => any;
      webkitSpeechRecognition?: new () => any;
    };
    const SpeechRecognition = speechWindow.SpeechRecognition || speechWindow.webkitSpeechRecognition;

    if (!SpeechRecognition) return false;

    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // ignore
      }
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      recognitionRef.current = null;
      onFinished();
    };

    recognition.onresult = finish;
    recognition.onerror = finish;
    recognition.onend = finish;

    recognitionRef.current = recognition;
    recognition.start();
    return true;
  }, []);

  // Handle click on card or counter during click quiz
  const handleItemClick = useCallback((numeral: number, isCounter: boolean) => {
    if (currentTarget === null || quizPhase !== "click") return;
    if (awaitingAnswerRef.current) return;
    if (groupingNumeral !== null) return; // Already animating

    if (numeral !== currentTarget) {
      if (voiceEnabled) {
        speakText("Oh no, try again.");
      }
      return;
    }

    // Start group animation for counters if numeral > 1
    if (numeral > 1) {
      setGroupingNumeral(numeral);
      groupingStartTimeRef.current = null;
      // Speak the number word while grouping
      speakText(numberWords[numeral - 1]);
    }

    playChime();
    setQuizLiftCard(numeral);

    if (timeoutRef.current) {
      window.clearTimeout(timeoutRef.current);
    }

    // Wait longer if grouping animation is happening
    const delay = numeral > 1 ? 2000 : 1800;

    timeoutRef.current = window.setTimeout(() => {
      setQuizLiftCard(null);
      setGroupingNumeral(null);
      groupingStartTimeRef.current = null;
      setQuizIndex((prev) => {
        if (prev === null) return null;
        const next = prev + 1;
        if (next < clickOrder.length) {
          return next;
        }
        setQuizPhase("name");
        return 0;
      });
    }, delay);
  }, [currentTarget, quizPhase, voiceEnabled, clickOrder.length, groupingNumeral]);

  // Voice prompts for quiz phases
  useEffect(() => {
    if (currentTarget === null || !voiceEnabled || quizPhase === null) {
      // Stop recognition when quiz phase ends
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {
          // ignore
        }
        recognitionRef.current = null;
      }
      return;
    }

    const promptKey = `${quizPhase}-${currentTarget}`;
    if (promptRef.current[promptKey]) return;
    promptRef.current[promptKey] = true;

    if (quizPhase === "click") {
      speakText(`Can you click on ${numberWords[currentTarget - 1]}?`);
      return;
    }

    if (quizPhase === "name") {
      awaitingAnswerRef.current = true;
      setQuizLiftCard(currentTarget);
      speakText("What is this?");

      const advance = () => {
        awaitingAnswerRef.current = false;
        setQuizLiftCard(null);
        setQuizIndex((prev) => {
          if (prev === null) return null;
          const next = prev + 1;
          if (next < nameOrder.length) {
            return next;
          }
          setQuizPhase(null);
          return null;
        });
      };

      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
      }

      const minDelayMs = 2200;
      const startedAt = performance.now();
      const finishAfterDelay = () => {
        const elapsed = performance.now() - startedAt;
        const wait = Math.max(0, minDelayMs - elapsed);
        timeoutRef.current = window.setTimeout(advance, wait);
      };

      const startedRecognition = startRecognition(finishAfterDelay);
      if (!startedRecognition) {
        finishAfterDelay();
      }
    }
  }, [currentTarget, quizPhase, voiceEnabled, nameOrder.length, startRecognition]);

  // Fire onStageComplete when quiz finishes
  useEffect(() => {
    if (quizPhase !== null) return;
    if (!quizDoneRef.current || quizCompleteRef.current) return;
    quizCompleteRef.current = true;
    if (onStageComplete) {
      onStageComplete();
    }
  }, [onStageComplete, quizPhase]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
      }
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {
          // ignore
        }
        recognitionRef.current = null;
      }
    };
  }, []);

  // Animation loop
  useFrame((state) => {
    const now = state.clock.getElapsedTime();
    const cardSpacing = 1.6;
    const baseX = -((numerals.length - 1) * cardSpacing) / 2;

    if (!playing) {
      // Reset positions when not playing
      numerals.forEach((numeral, idx) => {
        const card = cardRefs.current[numeral];
        if (card) {
          const finalX = baseX + idx * cardSpacing;
          card.position.set(finalX, 0.04, -0.2);
          card.visible = true;
        }

        const counters = counterRefs.current[numeral] || [];
        const counterInfo = counterData[numeral] || [];
        counters.forEach((counter, cIdx) => {
          if (counter && counterInfo[cIdx]) {
            counter.position.set(counterInfo[cIdx].finalX, 0.025, counterInfo[cIdx].finalZ);
            counter.visible = true;
          }
        });

        const cardMat = cardMaterialRefs.current[numeral];
        if (cardMat) {
          cardMat.emissiveIntensity = 0;
        }
      });
      return;
    }

    if (startTimeRef.current === null) {
      startTimeRef.current = now;
      spokenRef.current = {};
      completedRef.current = false;
    }

    const t = now - startTimeRef.current;

    // Check for sequence completion
    if (!completedRef.current && t >= timeline.total) {
      completedRef.current = true;
      handleSequenceComplete();
    }

    // Voice cues
    if (voiceEnabled && !quizPhase) {
      voiceCues.forEach((cue) => {
        const cueTime = timeline.map[cue.id].start + (cue.offset || 0);
        if (t >= cueTime && !spokenRef.current[cue.id]) {
          spokenRef.current[cue.id] = true;
          speakText(cue.text);
        }
      });
    }

    // Track grouping animation time
    if (groupingNumeral !== null && groupingStartTimeRef.current === null) {
      groupingStartTimeRef.current = now;
    }

    // Animate cards and counters
    numerals.forEach((numeral, idx) => {
      const card = cardRefs.current[numeral];
      const cardMat = cardMaterialRefs.current[numeral];
      const counters = counterRefs.current[numeral] || [];
      const counterInfo = counterData[numeral] || [];

      if (!card) return;

      const finalX = baseX + idx * cardSpacing;
      const cardY = 0.04;
      const cardZ = -0.2;

      // Card slide animation with lift-over-land arc
      const slideRange = timeline.map[`card${numeral}Slide`];
      if (slideRange) {
        const slideProgress = smoothstep(clamp01((t - slideRange.start) / (slideRange.end - slideRange.start)));
        const startX = -4;
        const currentX = lerp(startX, finalX, slideProgress);

        // Arc motion: lift up, stay elevated, then land
        // Use a parabola that peaks in the middle of the slide
        const liftHeight = 0.5; // How high the card lifts
        const arcProgress = slideProgress; // 0 to 1
        // Parabola: 4 * p * (1 - p) gives 0 at start, 1 at middle, 0 at end
        const arc = 4 * arcProgress * (1 - arcProgress);
        const currentY = cardY + (liftHeight * arc);

        card.position.x = currentX;
        card.position.y = currentY;
        card.position.z = cardZ;
        card.visible = t >= slideRange.start - 0.1;
      }

      // Card glow during intro
      const introRange = timeline.map[`card${numeral}Intro`];
      if (cardMat && introRange) {
        const inIntro = t >= introRange.start && t <= introRange.end;
        cardMat.emissive.setHex(0xffd966);
        cardMat.emissiveIntensity = inIntro ? 0.3 : 0;
      }

      // Quiz lift animation
      if (quizLiftCard === numeral) {
        card.position.y = cardY + 0.15 + Math.sin(now * 3) * 0.03;
      }

      // Animate counters
      counters.forEach((counter, cIdx) => {
        if (!counter || !counterInfo[cIdx]) return;

        const dropRange = timeline.map[`counter${numeral}_${cIdx}Drop`];
        if (!dropRange) {
          counter.visible = false;
          return;
        }

        // Base drop animation
        const dropProgress = easeOutBounce(clamp01((t - dropRange.start) / (dropRange.end - dropRange.start)));
        const startZ = counterInfo[cIdx].startZ;
        const finalZ = counterInfo[cIdx].finalZ;
        const startX = counterInfo[cIdx].startX;
        const finalXPos = counterInfo[cIdx].finalX;

        let currentZ = lerp(startZ, finalZ, dropProgress);
        let currentX = lerp(startX, finalXPos, dropProgress);
        let dropY = 0.025 + (1 - dropProgress) * 1.5;

        // Grouping animation - move counters toward center
        if (groupingNumeral === numeral && groupingStartTimeRef.current !== null) {
          const groupT = (now - groupingStartTimeRef.current) / GROUP_ANIMATION_DURATION;
          const groupProgress = smoothstep(clamp01(groupT));

          // Move toward center, then back
          const toCenter = groupProgress < 0.5 ? groupProgress * 2 : (1 - groupProgress) * 2;
          const centerX = counterInfo[cIdx].centerX;
          const centerZ = counterInfo[cIdx].centerZ;

          currentX = lerp(finalXPos, centerX, toCenter * 0.7);
          currentZ = lerp(finalZ, centerZ, toCenter * 0.7);
          // Slight lift during grouping
          dropY = 0.025 + toCenter * 0.1;
        }

        counter.position.set(currentX, Math.max(0.025, dropY), currentZ);
        counter.visible = t >= dropRange.start - 0.05;
      });
    });
  });

  return (
    <>
      <ambientLight intensity={1.3} />
      <directionalLight position={[3, 5, 3]} intensity={0.5} />
      <directionalLight position={[-2, 4, -2]} intensity={0.3} />

      {/* Base mat/table */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0.5]}>
        <planeGeometry args={[8, 5]} />
        <meshStandardMaterial color="#faf6f0" roughness={0.9} metalness={0} />
      </mesh>

      {/* Numeral cards - laying flat on table */}
      {numerals.map((numeral, idx) => {
        const cardSpacingLocal = 1.6;
        const baseXLocal = -((numerals.length - 1) * cardSpacingLocal) / 2;
        const x = baseXLocal + idx * cardSpacingLocal;

        return (
          <group
            key={numeral}
            ref={(ref) => {
              cardRefs.current[numeral] = ref;
            }}
            position={[x, 0.04, -0.2]}
            rotation={[-Math.PI / 2, 0, 0]}
            onClick={(e) => {
              e.stopPropagation();
              handleItemClick(numeral, false);
            }}
          >
            <mesh>
              <boxGeometry args={[0.9, 1.2, 0.06]} />
              <meshStandardMaterial
                ref={(ref) => {
                  cardMaterialRefs.current[numeral] = ref;
                }}
                color="#f5e6c8"
                roughness={0.4}
                emissive="#ffd966"
                emissiveIntensity={0}
              />
            </mesh>
            <mesh position={[0, 0, 0.031]}>
              <planeGeometry args={[0.85, 1.15]} />
              <meshStandardMaterial
                map={numeralTextures[idx]}
                transparent
                opacity={1}
              />
            </mesh>
          </group>
        );
      })}

      {/* Counters - flat discs on table (no rotation needed for cylinder laying flat) */}
      {numerals.map((numeral) => {
        const countersInfo = counterData[numeral] || [];

        return countersInfo.map((info, cIdx) => (
          <mesh
            key={`counter-${numeral}-${cIdx}`}
            ref={(ref) => {
              if (!counterRefs.current[numeral]) {
                counterRefs.current[numeral] = [];
              }
              counterRefs.current[numeral][cIdx] = ref;
            }}
            position={[info.finalX, 0.025, info.finalZ]}
            onClick={(e) => {
              e.stopPropagation();
              handleItemClick(numeral, true);
            }}
          >
            <cylinderGeometry args={[0.12, 0.12, 0.05, 24]} />
            <meshStandardMaterial
              color="#e85a5a"
              roughness={0.35}
              metalness={0.05}
            />
          </mesh>
        ));
      })}

      <OrbitControls
        enableZoom
        enablePan={false}
        minPolarAngle={Math.PI / 4}
        maxPolarAngle={Math.PI / 2.1}
        minAzimuthAngle={-Math.PI / 4}
        maxAzimuthAngle={Math.PI / 4}
        target={[0, 0, 0.3]}
        minDistance={3.0}
        maxDistance={5.0}
      />
    </>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function NumeralsAndCountersScene({
  playing,
  voiceEnabled,
  stageIndex = 0,
  onComplete,
  onStageComplete,
  className = "",
}: NumeralsAndCountersSceneProps) {
  const numerals = NUMERALS_AND_COUNTERS_STAGES[stageIndex] || [1, 2, 3];

  useEffect(() => {
    primeSpeechVoices();
  }, []);

  return (
    <div className={`w-full overflow-hidden rounded-[28px] bg-[#fdfbf8] ${className}`}>
      <Canvas
        shadows={false}
        camera={{ position: [0, 3.2, 4.5], fov: 35 }}
      >
        <color attach="background" args={["#fdfbf8"]} />
        <NumeralsAndCountersContent
          playing={playing}
          voiceEnabled={voiceEnabled}
          numerals={numerals}
          stageKey={stageIndex}
          onComplete={onComplete}
          onStageComplete={onStageComplete}
        />
      </Canvas>
    </div>
  );
}
