"use client";

type SandpaperNumeralsPreviewProps = {
  className?: string;
};

const cardNumbers = ["1", "2", "3", "4", "5"];

export default function SandpaperNumeralsPreview({
  className,
}: SandpaperNumeralsPreviewProps) {
  return (
    <div
      className={`relative h-full w-full overflow-hidden rounded-[28px] bg-[radial-gradient(circle_at_top,#f8f3ee_0%,#f1eadf_55%,#e9dfd2_100%)] ${className ?? ""}`}
    >
      <div className="absolute inset-0 bg-gradient-to-t from-[#f5e9dd] to-transparent" />
      <div className="absolute inset-x-5 top-6 flex items-end justify-center gap-2">
        {cardNumbers.map((value, index) => (
          <div
            key={value}
            className="relative h-12 w-10 rounded-sm border border-stone-200 bg-stone-50 text-center text-lg font-semibold text-stone-900 shadow-[0_8px_18px_-14px_rgba(0,0,0,0.8)]"
          >
            <span className="absolute inset-0 flex items-center justify-center">
              {value}
            </span>
            <span className="absolute left-1 top-1 text-[10px] uppercase tracking-[0.2em] text-stone-400">
              1
            </span>
          </div>
        ))}
      </div>
      <div className="absolute inset-x-4 bottom-6 flex justify-center">
        <div className="flex gap-3 rounded-2xl bg-white/70 p-3 shadow-[0_10px_25px_-20px_rgba(0,0,0,0.7)]">
          {["1", "2", "3"].map((value) => (
            <div
              key={value}
              className="flex h-12 w-12 items-center justify-center rounded-xl border border-emerald-900/25 bg-emerald-700/80 text-2xl font-semibold text-white shadow-[0_12px_20px_-16px_rgba(0,0,0,0.6)]"
            >
              {value}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
