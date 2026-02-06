"use client";

import SandpaperNumeralsScene from "./SandpaperNumeralsScene";

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
      <div className="absolute inset-0">
        <SandpaperNumeralsScene
          playing={false}
          voiceEnabled={false}
          className="h-full w-full"
        />
      </div>
    </div>
  );
}
