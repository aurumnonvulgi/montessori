"use client";

type SpindleBoxesPreviewProps = {
  className?: string;
};

export default function SpindleBoxesPreview({
  className,
}: SpindleBoxesPreviewProps) {
  const numerals = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];

  return (
    <div
      className={`flex items-center justify-center overflow-hidden rounded-[28px] bg-gradient-to-b from-[#f7efe4] to-[#ebe3d8] ${className ?? ""}`}
    >
      <div className="flex flex-col items-center gap-4 p-6">
        {/* Box A and Box B side by side */}
        <div className="flex gap-2">
          {/* Box A: 0-4 */}
          <div className="flex rounded-lg bg-[#c9a66b] p-1 shadow-md">
            {numerals.slice(0, 5).map((n) => (
              <div
                key={n}
                className="flex h-16 w-10 flex-col items-center border-r border-[#b8955a] last:border-r-0"
              >
                <span className="mt-1 font-display text-sm font-bold text-[#5a4a32]">
                  {n}
                </span>
                <div className="mt-1 flex flex-1 flex-col items-center justify-end gap-0.5 pb-1">
                  {/* Show spindles for preview */}
                  {Array.from({ length: Math.min(n, 3) }).map((_, i) => (
                    <div
                      key={i}
                      className="h-1.5 w-5 rounded-full bg-[#d4b896]"
                    />
                  ))}
                  {n > 3 && (
                    <span className="text-[8px] text-[#8b7355]">+{n - 3}</span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Box B: 5-9 */}
          <div className="flex rounded-lg bg-[#c9a66b] p-1 shadow-md">
            {numerals.slice(5, 10).map((n) => (
              <div
                key={n}
                className="flex h-16 w-10 flex-col items-center border-r border-[#b8955a] last:border-r-0"
              >
                <span className="mt-1 font-display text-sm font-bold text-[#5a4a32]">
                  {n}
                </span>
                <div className="mt-1 flex flex-1 flex-col items-center justify-end gap-0.5 pb-1">
                  {/* Show partial spindles for preview */}
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div
                      key={i}
                      className="h-1.5 w-5 rounded-full bg-[#d4b896]"
                    />
                  ))}
                  <span className="text-[8px] text-[#8b7355]">+{n - 3}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Baskets */}
        <div className="flex gap-4">
          {/* Basket with spindles */}
          <div className="flex h-8 w-16 items-end justify-center rounded-b-lg rounded-t-sm bg-[#a08060] shadow-inner">
            <div className="mb-1 flex gap-0.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className="h-4 w-1 rounded-full bg-[#d4b896]"
                  style={{ transform: `rotate(${(i - 2) * 8}deg)` }}
                />
              ))}
            </div>
          </div>

          {/* Rubber band container */}
          <div className="flex h-8 w-10 items-center justify-center rounded-lg bg-[#e8dfd4] shadow-inner">
            <div className="flex flex-wrap gap-0.5">
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="h-2 w-2 rounded-full border border-[#c45c5c] bg-transparent"
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
