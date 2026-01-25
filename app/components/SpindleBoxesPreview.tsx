"use client";

type SpindleBoxesPreviewProps = {
  className?: string;
};

export default function SpindleBoxesPreview({ className }: SpindleBoxesPreviewProps) {
  return (
    <div
      className={`relative h-full w-full overflow-hidden rounded-[28px] bg-[radial-gradient(circle_at_top,#f7f1e7_0%,#f0e5d6_70%,#e9dcc9_100%)] ${className ?? ""}`}
    >
      <div className="absolute left-6 right-6 top-8 rounded-2xl bg-[#d7b58d] px-4 py-6 shadow-[0_18px_28px_-18px_rgba(60,40,20,0.6)]">
        <div className="absolute left-4 right-4 top-2 flex justify-between text-xl font-semibold text-stone-900">
          {["0", "1", "2", "3", "4"].map((value) => (
            <span key={value} className="w-6 text-center">
              {value}
            </span>
          ))}
        </div>
        <div className="mt-6 grid grid-cols-5 gap-2">
          {Array.from({ length: 5 }).map((_, index) => (
            <div
              key={index}
              className="h-16 rounded-lg bg-[#f2e6d7] shadow-inner"
            />
          ))}
        </div>
      </div>

      <div className="absolute bottom-8 left-8 rounded-2xl bg-[#c48a58] px-5 py-4 shadow-[0_16px_24px_-18px_rgba(60,40,20,0.6)]">
        <div className="flex gap-1">
          {Array.from({ length: 10 }).map((_, index) => (
            <span
              key={index}
              className="h-10 w-1 rounded-full bg-[#e7c8a2]"
            />
          ))}
        </div>
      </div>
    </div>
  );
}
