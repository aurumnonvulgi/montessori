"use client";

import TimeClockScene from "./TimeClockScene";
import { type ClockMode, type TimeValue } from "../lib/timeMath";

type HistoryTimeClockPreviewProps = {
  mode: ClockMode;
  value: TimeValue;
  className?: string;
  viewportClassName?: string;
};

export default function HistoryTimeClockPreview({
  mode,
  value,
  className,
  viewportClassName,
}: HistoryTimeClockPreviewProps) {
  return (
    <div className={className}>
      <div className="pointer-events-none">
        <TimeClockScene
          mode={mode}
          value={value}
          minuteStage="one"
          onChange={() => {}}
          draggable={false}
          showCheckOverlay={false}
          frozen
          className={viewportClassName ?? "h-36"}
        />
      </div>
    </div>
  );
}
