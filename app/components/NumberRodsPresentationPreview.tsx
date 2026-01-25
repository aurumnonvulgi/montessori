"use client";

type NumberRodsPresentationPreviewProps = {
  className?: string;
};

export default function NumberRodsPresentationPreview({
  className,
}: NumberRodsPresentationPreviewProps) {
  return (
    <div
      className={`relative h-full w-full overflow-hidden rounded-[28px] bg-[radial-gradient(circle_at_top,#f6efe4_0%,#f0e1cf_60%,#e6d4bd_100%)] ${className ?? ""}`}
    >
      <div className="absolute left-5 right-5 top-5 rounded-xl bg-white/90 px-4 py-3 text-center text-xs font-semibold text-stone-700 shadow-sm">
        I will now present the number rods
      </div>
      <div className="absolute left-1/2 top-16 w-[80%] -translate-x-1/2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-center text-[10px] font-semibold uppercase tracking-[0.12em] text-red-600">
        Please read the above sentence
      </div>

      <div className="absolute inset-x-6 bottom-8 top-28 rounded-[24px] bg-white/70">
        <div className="absolute left-6 top-8 flex flex-col gap-4">
          {[1, 2, 3].map((value) => (
            <div
              key={value}
              className="h-5 rounded-full border border-dashed border-amber-300/70 bg-white/80"
              style={{ width: 36 + value * 28 }}
            />
          ))}
        </div>

        <div className="absolute bottom-6 left-6 right-6 flex items-center justify-between">
          <div className="flex gap-3">
            {[3, 1, 2].map((value) => (
              <div
                key={value}
                className="flex h-4 rounded-full shadow"
                style={{ width: 32 + value * 28 }}
              >
                {Array.from({ length: value }).map((_, index) => (
                  <span
                    key={index}
                    className="h-full"
                    style={{
                      width: 24,
                      backgroundColor: index % 2 === 0 ? "#d14b3a" : "#2f67c1",
                      borderRadius:
                        index === 0
                          ? "999px 0 0 999px"
                          : index === value - 1
                            ? "0 999px 999px 0"
                            : "0",
                    }}
                  />
                ))}
              </div>
            ))}
          </div>
          <span className="rounded-full bg-red-600 px-3 py-1 text-[9px] font-semibold uppercase tracking-[0.2em] text-white">
            Place
          </span>
        </div>
      </div>
    </div>
  );
}
