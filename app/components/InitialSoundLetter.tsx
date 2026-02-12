"use client";

import { useEffect, useMemo, useRef } from "react";

const LETTER_PATH_A = "M30 150 Q70 50 110 150";
const DOT_RADIUS = 6;
const TRACE_DURATION = 4000;

export default function InitialSoundLetter({
  startKey,
  onComplete,
  className,
}: {
  startKey?: number;
  onComplete?: () => void;
  className?: string;
}) {
  const svgRef = useRef<SVGPathElement | null>(null);
  const dotRef = useRef<HTMLDivElement | null>(null);
  const cleanupRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (cleanupRef.current) window.clearTimeout(cleanupRef.current);
    };
  }, []);

  useEffect(() => {
    if (!startKey) return;
    const path = svgRef.current;
    const dot = dotRef.current;
    if (!path || !dot) return;
    const length = path.getTotalLength();
    let start: number | null = null;
    const step = (timestamp: number) => {
      if (start === null) start = timestamp;
      const progress = Math.min((timestamp - start) / TRACE_DURATION, 1);
      const point = path.getPointAtLength(progress * length);
      dot.style.transform = `translate(${point.x - DOT_RADIUS}px, ${point.y - DOT_RADIUS}px)`;
      if (progress < 1) {
        requestAnimationFrame(step);
      } else {
        onComplete?.();
      }
    };
    requestAnimationFrame(step);
  }, [startKey, onComplete]);

  return (
    <div className="relative h-full w-full bg-transparent">
      <svg viewBox="0 0 140 200" className="h-full w-full">
        <path
          ref={svgRef}
          d={LETTER_PATH_A}
          stroke="#f3e4cd"
          strokeWidth={8}
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <div
        ref={dotRef}
        className="pointer-events-none absolute rounded-full bg-red-600"
        style={{ width: DOT_RADIUS * 2, height: DOT_RADIUS * 2 }}
      />
    </div>
  );
}
