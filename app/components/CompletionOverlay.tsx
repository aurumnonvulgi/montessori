"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

type CompletionAction = {
  label: string;
  href?: string;
  onClick?: () => void;
};

type CompletionOverlayProps = {
  open: boolean;
  title: string;
  message: string;
  primaryAction?: CompletionAction;
  secondaryAction?: CompletionAction;
};

export default function CompletionOverlay({
  open,
  title,
  message,
  primaryAction,
  secondaryAction,
}: CompletionOverlayProps) {
  const router = useRouter();

  useEffect(() => {
    if (!open || !primaryAction) return;
    const timer = window.setTimeout(() => {
      if (primaryAction.onClick) {
        primaryAction.onClick();
        return;
      }
      if (primaryAction.href) {
        router.push(primaryAction.href);
      }
    }, 5000);
    return () => window.clearTimeout(timer);
  }, [open, primaryAction, router]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[1200] flex items-center justify-center bg-gradient-to-br from-emerald-500 via-green-500 to-emerald-600 p-6">
      <div className="w-full max-w-xl rounded-3xl border border-emerald-200 bg-white/95 p-8 text-center shadow-[0_40px_120px_-50px_rgba(0,0,0,0.8)]">
        <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-emerald-600 text-6xl text-white shadow-lg">
          ✓
        </div>
        <h2 className="mt-6 font-display text-4xl font-semibold text-emerald-800">{title}</h2>
        <p className="mt-3 text-sm text-emerald-900/80">{message}</p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          {primaryAction ? (
            primaryAction.href ? (
              <Link
                href={primaryAction.href}
                className="inline-flex items-center justify-center rounded-full bg-emerald-600 px-8 py-4 text-sm font-semibold uppercase tracking-[0.3em] text-white transition hover:bg-emerald-700"
              >
                {primaryAction.label}
              </Link>
            ) : (
              <button
                type="button"
                onClick={primaryAction.onClick}
                className="inline-flex items-center justify-center rounded-full bg-emerald-600 px-8 py-4 text-sm font-semibold uppercase tracking-[0.3em] text-white transition hover:bg-emerald-700"
              >
                {primaryAction.label}
              </button>
            )
          ) : null}
          {secondaryAction ? (
            secondaryAction.href ? (
              <Link
                href={secondaryAction.href}
                className="inline-flex items-center justify-center rounded-full border border-emerald-400 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.22em] text-emerald-700 transition hover:bg-emerald-50"
              >
                {secondaryAction.label}
              </Link>
            ) : (
              <button
                type="button"
                onClick={secondaryAction.onClick}
                className="inline-flex items-center justify-center rounded-full border border-emerald-400 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.22em] text-emerald-700 transition hover:bg-emerald-50"
              >
                {secondaryAction.label}
              </button>
            )
          ) : null}
        </div>
        {primaryAction ? (
          <p className="mt-4 text-[11px] uppercase tracking-[0.2em] text-emerald-800/70">Auto-advancing in 5s</p>
        ) : null}
      </div>
    </div>
  );
}
