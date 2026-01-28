# CLAUDE.md - AI Assistant Guide for Montessori Studio

## Project Overview

Montessori Studio is an interactive educational web application that brings Montessori learning materials to life through 3D graphics and voice interactions. The app teaches early math concepts (counting, number recognition) through hands-on digital manipulatives like Number Rods, Sandpaper Numerals, and Spindle Boxes.

## Tech Stack

- **Framework**: Next.js 16 (App Router) with TypeScript
- **3D Graphics**: Three.js via `@react-three/fiber` and `@react-three/drei`
- **Animation**: Framer Motion for UI animations
- **Drag & Drop**: `react-draggable` for interactive elements
- **State Management**: Zustand for global state
- **Audio**: Howler.js for sound effects
- **Speech**: Web Speech API for text-to-speech and speech recognition
- **Backend**: Supabase (optional) for materials data
- **Styling**: Tailwind CSS v4

## Directory Structure

```
app/
├── components/          # React components
│   ├── *Lesson.tsx      # Full lesson wrappers with state/routing
│   ├── *Scene.tsx       # 3D Canvas scenes (react-three-fiber)
│   ├── *Preview.tsx     # Thumbnail previews for home page
│   └── *Canvas.tsx      # 2D interactive canvases
├── lessons/             # Next.js App Router pages
│   ├── number-rods/
│   ├── number-rods-presentation/
│   ├── sandpaper-numerals/
│   └── spindle-boxes/
├── lib/                 # Utility modules
│   ├── materials.ts     # Material data fetching
│   ├── sounds.ts        # Audio playback (Howler)
│   ├── speech.ts        # Text-to-speech utilities
│   └── supabaseClient.ts
├── store/               # Zustand stores
│   └── useProgressStore.ts
├── globals.css          # Global styles + Tailwind
├── layout.tsx           # Root layout with fonts
└── page.tsx             # Home page
public/
└── audio/               # Sound files (chime.wav)
```

## Key Concepts

### Lesson Structure
Each lesson follows a consistent pattern:
1. **Page Component** (`app/lessons/*/page.tsx`) - Thin wrapper importing the lesson component
2. **Lesson Component** (`*Lesson.tsx`) - Manages lesson state, navigation, completion
3. **Scene/Canvas Component** (`*Scene.tsx` or `*Canvas.tsx`) - Renders the interactive content

### Three-Period Lesson Flow
The app implements the Montessori three-period lesson:
1. **Introduction**: Teacher introduces material with speech
2. **Recognition**: Child identifies items on request ("Can you click on...")
3. **Recall**: Child names items when asked ("What is this?")

### Completion Tracking
Lesson completion is stored in `localStorage`:
- `number-rods-complete`
- `spindle-boxes-complete`
- `number-rods-presentation-complete`

## Component Patterns

### 3D Scene Components (React Three Fiber)
```tsx
"use client";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";

function SceneContent({ playing, voiceEnabled, onComplete }) {
  // useFrame for animations
  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    // Update mesh positions, materials
  });

  return (
    <group>
      <ambientLight intensity={0.6} />
      <directionalLight position={[2, 2.5, 1.8]} castShadow />
      {/* Meshes */}
    </group>
  );
}

export default function MyScene({ playing, className }) {
  return (
    <div className={`w-full rounded-[28px] ${className}`}>
      <Canvas shadows camera={{ position: [0, 0.5, 1], fov: 33 }}>
        <color attach="background" args={["#f7efe4"]} />
        <SceneContent playing={playing} />
        <OrbitControls enablePan={false} />
      </Canvas>
    </div>
  );
}
```

### Lesson Wrapper Pattern
```tsx
"use client";
import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";

export default function MyLesson() {
  const router = useRouter();
  const [lessonStarted, setLessonStarted] = useState(false);

  const handleComplete = useCallback(() => {
    localStorage.setItem("my-lesson-complete", "true");
    router.push("/");
  }, [router]);

  return (
    <div className="min-h-screen bg-[radial-gradient(...)]">
      <main className="mx-auto max-w-6xl px-6 py-12">
        <MyScene playing={lessonStarted} onComplete={handleComplete} />
        <button onClick={() => setLessonStarted(true)}>Start</button>
      </main>
    </div>
  );
}
```

## Speech and Audio

### Text-to-Speech
Use the speech utilities in `app/lib/speech.ts`:
```tsx
import { speakWithPreferredVoice, primeSpeechVoices } from "../lib/speech";

// Prime voices on mount
useEffect(() => {
  primeSpeechVoices();
}, []);

// Speak text
speakWithPreferredVoice("This is one.", { rate: 0.85, pitch: 0.95 });
```

### Sound Effects
```tsx
import { playChime } from "../lib/sounds";
playChime(); // Plays success chime
```

### Speech Recognition
The app uses the Web Speech API for microphone input:
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

### Progress Store (Zustand)
```tsx
import { useProgressStore } from "../store/useProgressStore";

const { completedIds, markComplete, setActiveMaterial } = useProgressStore();
```

### Local State Patterns
- Use `useState` for UI state (lesson phase, visibility)
- Use `useRef` for mutable values that shouldn't trigger re-renders (timers, recognition instances)
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

1. Create page in `app/lessons/[lesson-name]/page.tsx`
2. Create lesson component `app/components/[LessonName]Lesson.tsx`
3. Create scene/canvas component `app/components/[LessonName]Scene.tsx`
4. Create preview component `app/components/[LessonName]Preview.tsx`
5. Add lesson card to `MontessoriHome.tsx`
6. Add completion tracking localStorage key

## Animation Patterns

### Timeline-based Animation
The Number Rods scene uses a step-based timeline:
```tsx
const steps = [
  { id: "rod1Slide", duration: 1.5 },
  { id: "rod1Lift", duration: 0.7 },
  // ...
];
const timeline = buildTimeline(steps);
// Returns { map: { "rod1Slide": { start: 0, end: 1.5 }, ... }, total: number }
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

## Common Gotchas

1. **"use client" directive**: Required for components using hooks, browser APIs, or react-three-fiber
2. **SSR checks**: Always check `typeof window !== "undefined"` before using browser APIs
3. **Speech synthesis voices**: Must prime voices on mount as they load asynchronously
4. **Timer cleanup**: Always clear timeouts/intervals in useEffect cleanup
5. **Recognition cleanup**: Stop speech recognition instances on unmount
6. **Canvas sizing**: Use explicit height classes or aspect ratios for 3D canvases

## Deployment

Deploy to Vercel with Supabase environment variables configured in project settings. The app works without Supabase (uses fallback materials data).
