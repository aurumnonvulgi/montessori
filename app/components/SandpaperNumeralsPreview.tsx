"use client";

type SandpaperNumeralsPreviewProps = {
  className?: string;
};

export default function SandpaperNumeralsPreview({
  className,
}: SandpaperNumeralsPreviewProps) {
  return (
    <div
      className={`relative h-full w-full overflow-hidden rounded-[28px] bg-[radial-gradient(circle_at_top,#f6f0e6_0%,#f4ecde_55%,#eee4d2_100%)] ${className ?? ""}`}
    >
      <div className="absolute left-5 top-5 h-20 w-28 rounded-xl bg-[#d4b08a] shadow-[0_18px_30px_-22px_rgba(93,63,34,0.8)]">
        <div className="absolute bottom-2 right-2 h-12 w-14 rounded-md bg-[#1f7a3c] text-center text-3xl font-semibold text-stone-100 shadow-[0_10px_18px_-14px_rgba(0,0,0,0.8)]">
          3
        </div>
        <div className="absolute bottom-3 right-4 h-12 w-14 rounded-md bg-[#1f6f36] text-center text-3xl font-semibold text-stone-100/80 shadow-[0_10px_18px_-14px_rgba(0,0,0,0.7)]">
          2
        </div>
        <div className="absolute bottom-4 right-6 h-12 w-14 rounded-md bg-[#1b6431] text-center text-3xl font-semibold text-stone-100/70 shadow-[0_10px_18px_-14px_rgba(0,0,0,0.6)]">
          1
        </div>
      </div>

      <div className="absolute bottom-6 left-6 flex gap-3">
        {["1", "2", "3"].map((value) => (
          <div
            key={value}
            className="h-16 w-16 rounded-lg border border-emerald-800/30 bg-[#1f7a3c] text-center text-3xl font-semibold text-stone-100 shadow-[0_14px_26px_-18px_rgba(0,0,0,0.7)]"
          >
            {value}
          </div>
        ))}
      </div>
    </div>
  );
}
