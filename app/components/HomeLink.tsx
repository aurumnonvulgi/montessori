"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";

type HomeLinkProps = {
  className?: string;
  onBackClick?: () => void;
  onHomeClick?: () => void;
  onClick?: () => void;
};

export default function HomeLink({ className, onBackClick, onHomeClick, onClick }: HomeLinkProps) {
  const router = useRouter();
  const handleBack = useCallback(() => {
    const callback = onBackClick ?? onClick;
    if (callback) {
      callback();
      return;
    }
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
      return;
    }
    router.push("/");
  }, [onBackClick, onClick, router]);

  const handleHome = useCallback(() => {
    if (onHomeClick) {
      onHomeClick();
      return;
    }
    router.push("/");
  }, [onHomeClick, router]);

  return (
    <div
      className={`fixed left-4 top-4 z-[999] flex items-center gap-2 rounded-full border border-stone-200/80 bg-white/90 p-2 shadow-[0_14px_30px_rgba(15,23,42,0.25)] backdrop-blur-sm ${className ?? ""}`}
    >
      <button
        type="button"
        onClick={handleBack}
        className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-stone-200 bg-white text-stone-700 transition hover:-translate-y-0.5 hover:border-stone-300 hover:bg-stone-50"
        aria-label="Back"
      >
        <svg viewBox="0 0 24 24" className="h-6 w-6 fill-none stroke-current" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
          <path d="M15 18 9 12l6-6" />
        </svg>
      </button>

      <button
        type="button"
        onClick={handleHome}
        className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-stone-200 bg-white text-stone-700 transition hover:-translate-y-0.5 hover:border-stone-300 hover:bg-stone-50"
        aria-label="Home"
      >
        <svg viewBox="0 0 24 24" className="h-6 w-6 fill-none stroke-current" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 10.5L12 4l9 6.5" />
          <path d="M6 10.5v7.5a1 1 0 0 0 1 1h2v-4h6v4h2a1 1 0 0 0 1-1V10.5" />
        </svg>
      </button>
    </div>
  );
}
