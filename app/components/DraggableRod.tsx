"use client";

import { useRef } from "react";
import Draggable from "react-draggable";

export default function DraggableRod() {
  const nodeRef = useRef<HTMLDivElement>(null);

  return (
    <div className="relative h-28 w-full overflow-hidden rounded-2xl border border-dashed border-amber-300 bg-[#fff9ee]">
      <Draggable bounds="parent" nodeRef={nodeRef}>
        <div
          ref={nodeRef}
          className="absolute left-6 top-1/2 h-6 w-44 -translate-y-1/2 cursor-grab rounded-full bg-gradient-to-r from-amber-300 via-amber-400 to-amber-500 shadow-md active:cursor-grabbing"
        />
      </Draggable>
      <div className="pointer-events-none absolute bottom-3 right-4 text-[10px] uppercase tracking-[0.3em] text-amber-700">
        Drag
      </div>
    </div>
  );
}
