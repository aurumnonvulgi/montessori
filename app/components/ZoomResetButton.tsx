"use client";

type ZoomResetButtonProps = {
  onClick: () => void;
  className?: string;
};

export default function ZoomResetButton({ onClick, className }: ZoomResetButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`absolute bottom-4 left-1/2 z-30 -translate-x-1/2 rounded-full border border-stone-300/90 bg-white/92 px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.24em] text-stone-700 shadow-lg backdrop-blur-sm transition hover:bg-white ${className ?? ""}`}
    >
      Zoom Reset
    </button>
  );
}
