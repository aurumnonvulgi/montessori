"use client";

const LETTER_ROWS = [
  ["a", "b", "c", "d", "e", "f", "g"],
  ["h", "i", "j", "k", "l", "m"],
  ["n", "o", "p", "q", "r", "s", "t"],
  ["u", "v", "w", "x", "y", "z"],
];

const VOWELS = new Set(["a", "e", "i", "o", "u"]);

export default function LanguageArtsPreview({ className }: { className?: string }) {
  return (
    <div
      className={`pointer-events-none overflow-hidden rounded-[24px] border border-stone-200 bg-[radial-gradient(circle_at_top,_#f9f4ed,_#f2e7d3)] p-4 shadow-inner ${className ?? ""}`}
    >
      <div className="grid gap-1">
        {LETTER_ROWS.map((row, rowIndex) => (
          <div key={`row-${rowIndex}`} className="flex justify-between gap-1">
            {row.map((letter) => (
              <span
                key={letter}
                className={`flex h-10 w-10 items-center justify-center rounded-lg border border-stone-100 bg-white text-lg font-semibold uppercase tracking-wide ${
                  VOWELS.has(letter) ? "text-sky-600" : "text-rose-600"
                }`}
              >
                {letter}
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
