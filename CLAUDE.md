# CLAUDE.md - AI Assistant Guide for Montessori Studio

## Project Overview

Montessori Studio is an interactive educational web application that brings Montessori learning materials to life through 3D graphics and voice interactions. The app teaches early math concepts (counting, number recognition) through hands-on digital manipulatives like Number Rods, Sandpaper Numerals, Numerals and Counters, and Spindle Boxes.

## Tech Stack

- **Framework**: Next.js 16 (App Router) with TypeScript
- **3D Graphics**: Three.js via `@react-three/fiber` and `@react-three/drei`
- **Animation**: Framer Motion for UI animations
- **Drag & Drop**: `react-draggable` for interactive elements
- **State Management**: Zustand (defined but localStorage primarily used)
- **Audio**: Howler.js for sound effects
- **Speech**: Web Speech API for text-to-speech and speech recognition
- **Backend**: Supabase (optional) for materials data
- **Styling**: Tailwind CSS v4

## Directory Structure

```
app/
├── components/              # React components
│   ├── *Hub.tsx             # Hub navigation for multi-stage lessons
│   ├── *Lesson.tsx          # Full lesson wrappers (single-lesson)
│   ├── *StageLesson.tsx     # Stage lesson wrappers (multi-stage)
│   ├── *Scene.tsx           # 3D Canvas scenes (react-three-fiber)
│   ├── *Canvas.tsx          # 2D interactive canvases
│   ├── *Preview.tsx         # Thumbnail previews for home page
│   ├── MontessoriHome.tsx   # Home page component
│   ├── RodQuote.tsx         # Educational quote animation section
│   └── DraggableRod.tsx     # Reusable draggable rod component
├── lessons/                 # Next.js App Router pages
│   ├── number-rods/         # Multi-stage lesson
│   │   ├── page.tsx         # Hub page
│   │   ├── stage-1/page.tsx
│   │   ├── stage-2/page.tsx
│   │   ├── stage-3/page.tsx
│   │   └── stage-4/page.tsx
│   ├── numerals-and-counters/  # Multi-stage lesson
│   │   ├── page.tsx         # Hub page
│   │   ├── stage-1/page.tsx
│   │   ├── stage-2/page.tsx
│   │   ├── stage-3/page.tsx
│   │   └── stage-4/page.tsx
│   ├── number-rods-presentation/
│   │   └── page.tsx
│   ├── sandpaper-numerals/
│   │   └── page.tsx
│   └── spindle-boxes/
│       └── page.tsx
├── lib/                     # Utility modules
│   ├── materials.ts         # Material data fetching
│   ├── sounds.ts            # Audio playback (Howler)
│   ├── speech.ts            # Text-to-speech utilities
│   └── supabaseClient.ts    # Supabase client initialization
├── store/                   # Zustand stores
│   └── useProgressStore.ts  # Global progress tracking
├── globals.css              # Global styles + Tailwind + Confetti
├── layout.tsx               # Root layout with fonts
└── page.tsx                 # Home page
public/
└── audio/                   # Sound files (chime.wav)
```

## Key Concepts

### Lesson Types

The app has two types of lessons:

#### 1. Multi-Stage Lessons (with Hub Navigation)
- Have 4 progressive stages with unlocking logic
- Stage N requires completion of Stage N-1
- Each stage covers a subset of numbers (1-3, 4-6, 7-9, 10)
- Examples: Number Rods, Numerals and Counters

#### 2. Single Lessons
- Complete lesson in one session
- No staging or hub navigation
- Examples: Sandpaper Numerals, Spindle Boxes, Number Rods Presentation

### Component Hierarchy

**Multi-Stage Lesson:**
```
Page (lessons/*/page.tsx)
  └── Hub (*Hub.tsx) - Shows 4 stage cards with lock/unlock state
        └── Stage Page (lessons/*/stage-N/page.tsx)
              └── StageLesson (*StageLesson.tsx) - Manages stage state
                    └── Scene (*Scene.tsx) - 3D interactive content
```

**Single Lesson:**
```
Page (lessons/*/page.tsx)
  └── Lesson (*Lesson.tsx) - Manages lesson state
        └── Scene/Canvas (*Scene.tsx or *Canvas.tsx) - Interactive content
```

### Three-Period Lesson Flow
All lessons implement the Montessori three-period lesson:
1. **Introduction**: Teacher introduces material with speech ("This is one.")
2. **Recognition**: Child identifies items on request ("Can you click on two?")
3. **Recall**: Child names items when asked ("What is this?")

### Completion Tracking

**Multi-Stage Lessons** (per-stage tracking):
- `number-rods-stage-1-complete`, `number-rods-stage-2-complete`, etc.
- `numerals-and-counters-stage-1-complete`, etc.

**Single Lessons:**
- `sandpaper-numerals-complete`
- `spindle-boxes-complete`
- `number-rods-presentation-complete`

**Legacy Keys** (for backward compatibility):
- `number-rods-complete` - Home page checks this for badge display
- `numerals-and-counters-complete`

## Component Patterns

### Hub Component Pattern (`*Hub.tsx`)
```tsx
"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function MyLessonHub() {
  const router = useRouter();
  const [completedStages, setCompletedStages] = useState<boolean[]>([false, false, false, false]);

  useEffect(() => {
    // Check localStorage for completed stages
    setCompletedStages([
      localStorage.getItem("my-lesson-stage-1-complete") === "true",
      localStorage.getItem("my-lesson-stage-2-complete") === "true",
      // ...
    ]);
  }, []);

  const isStageUnlocked = (index: number) => {
    if (index === 0) return true;
    return completedStages[index - 1];
  };

  return (
    <div className="grid grid-cols-2 gap-6">
      {[1, 2, 3, 4].map((stage, i) => (
        <button
          key={stage}
          disabled={!isStageUnlocked(i)}
          onClick={() => router.push(`/lessons/my-lesson/stage-${stage}`)}
        >
          Stage {stage}
          {completedStages[i] && <CheckIcon />}
          {!isStageUnlocked(i) && <LockIcon />}
        </button>
      ))}
    </div>
  );
}
```

### Stage Lesson Component Pattern (`*StageLesson.tsx`)
```tsx
"use client";
import { useCallback, useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";

interface Props {
  stageIndex: number; // 0-based index
}

export default function MyStageLesson({ stageIndex }: Props) {
  const router = useRouter();
  const [lessonStarted, setLessonStarted] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const celebrationTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (celebrationTimeout.current) clearTimeout(celebrationTimeout.current);
    };
  }, []);

  const handleStageComplete = useCallback(() => {
    localStorage.setItem(`my-lesson-stage-${stageIndex + 1}-complete`, "true");
    setShowConfetti(true);
    celebrationTimeout.current = setTimeout(() => {
      router.push("/lessons/my-lesson"); // Return to hub
    }, 2600);
  }, [stageIndex, router]);

  return (
    <div className="min-h-screen">
      <MyScene
        playing={lessonStarted}
        stageIndex={stageIndex}
        onStageComplete={handleStageComplete}
      />
      {showConfetti && <ConfettiOverlay />}
    </div>
  );
}
```

### Lesson Wrapper Pattern (`*Lesson.tsx`)
```tsx
"use client";
import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";

export default function MyLesson() {
  const router = useRouter();
  const [lessonStarted, setLessonStarted] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  const handleComplete = useCallback(() => {
    localStorage.setItem("my-lesson-complete", "true");
    setShowConfetti(true);
    setTimeout(() => router.push("/"), 2600);
  }, [router]);

  return (
    <div className="min-h-screen bg-[radial-gradient(...)]">
      <main className="mx-auto max-w-6xl px-6 py-12">
        <MyScene playing={lessonStarted} onComplete={handleComplete} />
        <button onClick={() => setLessonStarted(true)}>Start</button>
      </main>
      {showConfetti && <ConfettiOverlay />}
    </div>
  );
}
```

### 3D Scene Components (React Three Fiber)
```tsx
"use client";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";

interface Props {
  playing: boolean;
  voiceEnabled?: boolean;
  stageIndex?: number; // For multi-stage lessons
  onComplete?: () => void;
  onStageComplete?: () => void;
  className?: string;
}

function SceneContent({ playing, stageIndex, onStageComplete }: Props) {
  const startTimeRef = useRef<number | null>(null);

  useFrame((state) => {
    if (!playing) return;
    if (startTimeRef.current === null) {
      startTimeRef.current = state.clock.getElapsedTime();
    }
    const t = state.clock.getElapsedTime() - startTimeRef.current;
    // Animate based on t and stageIndex
  });

  // Determine which content to show based on stageIndex
  const getNumbersForStage = (index: number) => {
    const stages = [[1, 2, 3], [4, 5, 6], [7, 8, 9], [10]];
    return stages[index] || stages[0];
  };

  return (
    <group>
      <ambientLight intensity={0.6} />
      <directionalLight position={[2, 2.5, 1.8]} castShadow />
      {/* Render content based on stage */}
    </group>
  );
}

export default function MyScene({ playing, stageIndex = 0, className }: Props) {
  return (
    <div className={`w-full rounded-[28px] ${className}`}>
      <Canvas shadows camera={{ position: [0, 0.5, 1], fov: 33 }}>
        <color attach="background" args={["#f7efe4"]} />
        <SceneContent playing={playing} stageIndex={stageIndex} />
        <OrbitControls enablePan={false} />
      </Canvas>
    </div>
  );
}
```

### Preview Component Pattern (`*Preview.tsx`)
```tsx
"use client";
import { Canvas } from "@react-three/fiber";

interface Props {
  className?: string;
}

export default function MyPreview({ className }: Props) {
  return (
    <div className={`aspect-[4/3] ${className}`}>
      <Canvas camera={{ position: [0, 0, 2], fov: 45 }}>
        <ambientLight intensity={0.8} />
        {/* Static preview content */}
      </Canvas>
    </div>
  );
}
```

## Speech and Audio

### Text-to-Speech
Use the speech utilities in `app/lib/speech.ts`:
```tsx
import { speakWithPreferredVoice, primeSpeechVoices } from "../lib/speech";

// Prime voices on mount (required - voices load asynchronously)
useEffect(() => {
  primeSpeechVoices();
}, []);

// Speak text with options
speakWithPreferredVoice("This is one.", {
  rate: 0.85,   // Speed (default 0.9)
  pitch: 0.95,  // Pitch (default 0.95)
  volume: 0.85, // Volume (default 0.85)
  lang: "en-US" // Language (default "en-US")
});
```

Voice preference order:
1. Google US English / Google UK English
2. Siri voices
3. Samantha
4. Microsoft Neural voices
5. Language-matched fallback

### Sound Effects
```tsx
import { playChime } from "../lib/sounds";
playChime(); // Plays success chime from /public/audio/chime.wav
```

### Speech Recognition
```tsx
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const recognition = new SpeechRecognition();
recognition.lang = "en-US";
recognition.onresult = (event) => {
  const transcript = event.results[0][0].transcript;
};
recognition.start();
```

## State Management

### Local State (Primary)
Components primarily use localStorage directly for persistence:
```tsx
// Save completion
localStorage.setItem("my-lesson-stage-1-complete", "true");

// Check completion
const isComplete = localStorage.getItem("my-lesson-stage-1-complete") === "true";
```

### Zustand Store (Available)
Defined in `app/store/useProgressStore.ts` for future use:
```tsx
import { useProgressStore } from "../store/useProgressStore";

const { completedIds, markComplete, setActiveMaterial } = useProgressStore();
```

### Local State Patterns
- Use `useState` for UI state (lesson phase, visibility, confetti)
- Use `useRef` for mutable values (timers, animation start times, recognition instances)
- Use `useCallback` for stable function references passed to child components

## Styling Conventions

### Tailwind Classes
- Rounded corners: `rounded-[28px]` for cards, `rounded-[40px]` for larger containers
- Background gradients: `bg-[radial-gradient(circle_at_top,#f5efe6_0%,#fdfbf8_45%,#f7efe4_100%)]`
- Shadows: `shadow-[0_30px_80px_-50px_rgba(60,40,20,0.6)]`
- Font sizes: Use Tailwind scale (`text-2xl`, `text-sm`)
- Spacing: Use Tailwind (`px-6`, `py-12`, `gap-8`)

### Fonts
- **Display**: Fraunces (`font-display` class, `--font-fraunces` variable)
- **Body**: Manrope (`font-body` class, `--font-manrope` variable)

### Color Palette
- Warm neutrals: `#f5efe6`, `#f7efe4`, `#fdfbf8` (backgrounds)
- Stone text: `text-stone-900`, `text-stone-400`
- Accent red: `#cf5f5f`, `#d14b3a`
- Accent blue: `#2f67c1`, `#3d7dd9`
- Success green: `emerald-100`, `emerald-700`

### Confetti Animation
Defined in `globals.css`:
```css
.confetti-fall {
  animation: confetti-fall 2.6s ease-out forwards;
}

@keyframes confetti-fall {
  0% { transform: translateY(-10vh) rotate(0deg); opacity: 1; }
  100% { transform: translateY(110vh) rotate(720deg); opacity: 0; }
}
```

## Development Workflow

### Commands
```bash
npm install          # Install dependencies
npm run dev          # Start dev server (http://localhost:3000)
npm run build        # Production build
npm run lint         # Run ESLint
npm start            # Start production server
```

### Environment Variables
Create `.env.local` for Supabase (optional):
```
NEXT_PUBLIC_SUPABASE_URL=your_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

### TypeScript
- Strict mode enabled
- Use explicit types for component props
- Use `as const` for literal arrays

### ESLint
Uses `eslint-config-next` with core-web-vitals and TypeScript rules.

## Adding New Lessons

### For Single Lessons:
1. Create page in `app/lessons/[lesson-name]/page.tsx`
2. Create lesson component `app/components/[LessonName]Lesson.tsx`
3. Create scene/canvas component `app/components/[LessonName]Scene.tsx`
4. Create preview component `app/components/[LessonName]Preview.tsx`
5. Add lesson card to `MontessoriHome.tsx`
6. Add completion tracking localStorage key

### For Multi-Stage Lessons:
1. Create hub page `app/lessons/[lesson-name]/page.tsx`
2. Create stage pages `app/lessons/[lesson-name]/stage-{1,2,3,4}/page.tsx`
3. Create hub component `app/components/[LessonName]Hub.tsx`
4. Create stage lesson component `app/components/[LessonName]StageLesson.tsx`
5. Create scene component `app/components/[LessonName]Scene.tsx` with `stageIndex` prop
6. Create preview component `app/components/[LessonName]Preview.tsx`
7. Add lesson card to `MontessoriHome.tsx`
8. Add per-stage localStorage keys: `[lesson-name]-stage-{1,2,3,4}-complete`

## Animation Patterns

### Timeline-based Animation
```tsx
const steps = [
  { id: "rod1Slide", duration: 1.5 },
  { id: "rod1Lift", duration: 0.7 },
  { id: "rod1Speech", duration: 1.2 },
  // ...
];

function buildTimeline(steps: { id: string; duration: number }[]) {
  let time = 0;
  const map: Record<string, { start: number; end: number }> = {};
  for (const step of steps) {
    map[step.id] = { start: time, end: time + step.duration };
    time += step.duration;
  }
  return { map, total: time };
}
```

### Smooth Interpolation
```tsx
const smoothstep = (t: number) => t * t * (3 - 2 * t);
const clamp01 = (t: number) => Math.min(1, Math.max(0, t));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
```

### useFrame Pattern
```tsx
useFrame((state) => {
  if (!playing) return;
  if (startTimeRef.current === null) {
    startTimeRef.current = state.clock.getElapsedTime();
  }
  const t = state.clock.getElapsedTime() - startTimeRef.current;
  // Animate based on t
});
```

### Stage-Aware Animations
For multi-stage scenes, animation content varies by stage:
```tsx
const getNumbersForStage = (index: number): number[] => {
  const stages = [[1, 2, 3], [4, 5, 6], [7, 8, 9], [10]];
  return stages[index] || stages[0];
};

// Use in component
const numbers = getNumbersForStage(stageIndex);
```

## Common Gotchas

1. **"use client" directive**: Required for components using hooks, browser APIs, or react-three-fiber
2. **SSR checks**: Always check `typeof window !== "undefined"` before using browser APIs
3. **Speech synthesis voices**: Must prime voices on mount as they load asynchronously
4. **Timer cleanup**: Always clear timeouts/intervals in useEffect cleanup
5. **Recognition cleanup**: Stop speech recognition instances on unmount
6. **Canvas sizing**: Use explicit height classes or aspect ratios for 3D canvases
7. **Stage indexing**: `stageIndex` is 0-based, but stage numbers in URLs/localStorage are 1-based
8. **Confetti timing**: Celebration overlays show for 2.6s before navigation
9. **Hub navigation**: Always return to hub after stage completion, not home page

## Existing Lessons Reference

| Lesson | Type | Components | localStorage Keys |
|--------|------|------------|-------------------|
| Number Rods | Multi-stage | `NumberRodsHub`, `NumberRodsStageLesson`, `NumberRodsScene` | `number-rods-stage-{1-4}-complete` |
| Numerals and Counters | Multi-stage | `NumeralsAndCountersHub`, `NumeralsAndCountersStagelesson`, `NumeralsAndCountersScene` | `numerals-and-counters-stage-{1-4}-complete` |
| Sandpaper Numerals | Single | `SandpaperNumeralsLesson`, `SandpaperNumeralsScene` | `sandpaper-numerals-complete` |
| Spindle Boxes | Single | `SpindleBoxesLesson`, `SpindleBoxesScene` | `spindle-boxes-complete` |
| Number Rods Presentation | Single | `NumberRodsPresentationLesson`, `NumberRodsPresentationCanvas` | `number-rods-presentation-complete` |

## Deployment

Deploy to Vercel with Supabase environment variables configured in project settings. The app works without Supabase (uses fallback materials data).
