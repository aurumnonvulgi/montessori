"use client";

const LETTERS = ["a", "b", "c", "d", "e", "f", "g", "h", "i"];

export default function LanguageArtsPreview({ className }: { className?: string }) {
  return (
    <div
      className={`pointer-events-none grid grid-cols-9 gap-1 overflow-hidden rounded-[24px] border border-stone-200 bg-white/80 p-3 shadow-inner ${className ?? ""}`}
    >
      {LETTERS.map((letter) => (
        <span
          key={letter}
          className="flex h-9 items-center justify-center rounded-lg bg-amber-50 text-lg font-semibold uppercase text-stone-700"
        >
          {letter}
        </span>
      ))}
    </div>
  );
}
