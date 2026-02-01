"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";

export default function HomeLink({ className }: { className?: string }) {
  const router = useRouter();
  const handleClick = useCallback(() => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
      return;
    }
    router.push("/");
  }, [router]);

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`group z-[999] absolute top-0 left-0 inline-flex h-12 w-12 items-center justify-center rounded-none rounded-br-[28px] border border-stone-200 bg-white/90 text-stone-700 shadow-[0_14px_30px_rgba(15,23,42,0.35)] transition hover:-translate-y-0.5 hover:border-stone-300 hover:bg-white before:absolute before:-inset-2 before:rounded-br-[28px] before:bg-gradient-to-r before:from-sky-200/40 before:via-transparent before:to-emerald-200/40 before:blur-3xl before:opacity-60 before:-z-10 ${className ?? ""}`}
      aria-label="Back"
    >
      <svg viewBox="0 0 24 24" className="h-6 w-6 fill-none stroke-current" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 10.5L12 4l9 6.5" />
        <path d="M6 10.5v7.5a1 1 0 0 0 1 1h2v-4h6v4h2a1 1 0 0 0 1-1V10.5" />
      </svg>
    </button>
  );
}
