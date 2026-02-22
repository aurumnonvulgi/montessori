"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import HomeLink from "../../components/HomeLink";
import { ENABLE_FEEDBACK } from "../../lib/featureFlags";

export default function DevelopmentToolsHub() {
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    if (loggingOut) return;
    setLoggingOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {
      // Continue redirecting even if request fails.
    }
    router.replace("/login");
    router.refresh();
    setLoggingOut(false);
  };

  return (
    <div className="relative min-h-screen bg-[radial-gradient(circle_at_top,#eef6ff,#f8fbff_45%,#f3f7ff)]">
      <HomeLink />
      <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-8 px-6 py-10">
        <div className="space-y-3 text-center">
          <p className="text-xs uppercase tracking-[0.35em] text-sky-500">Development Tools</p>
          <h1 className="font-display text-4xl font-semibold text-slate-900">Development Tools</h1>
          <p className="text-sm text-slate-600">Utility pages to capture exact values and speed up iteration.</p>
          <div className="flex justify-center pt-2">
            <button
              type="button"
              onClick={handleLogout}
              disabled={loggingOut}
              className="inline-flex items-center justify-center rounded-full border border-rose-300 bg-white px-6 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-rose-700 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loggingOut ? "Logging Out..." : "Log Out"}
            </button>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Link
            href="/lessons/development-tools/3d-playground"
            className="group relative flex h-56 flex-col justify-between rounded-3xl border border-cyan-200 bg-gradient-to-br from-cyan-100 via-white to-sky-50 p-6 shadow-[0_30px_60px_-40px_rgba(15,23,42,0.8)] transition hover:-translate-y-0.5 hover:shadow-[0_40px_90px_-50px_rgba(15,23,42,0.7)]"
          >
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-2xl border border-cyan-300 bg-cyan-100 text-xl font-semibold text-cyan-700">
                🛠️
              </span>
              <h2 className="font-display text-2xl font-semibold text-slate-900">3D Playground</h2>
            </div>

            <div className="rounded-2xl border border-cyan-200 bg-white/80 p-3">
              <p className="text-xs uppercase tracking-[0.25em] text-cyan-700">Live Coordinates</p>
              <p className="mt-2 text-sm text-slate-700">Move the view and copy camera + target values.</p>
            </div>

            <p className="text-xs uppercase tracking-[0.35em] text-cyan-700">Perspective helper</p>
            <div className="absolute -bottom-3 right-4 rounded-full border border-cyan-300 bg-cyan-200 px-3 py-1 text-xs font-semibold uppercase tracking-[0.35em] text-cyan-800">
              Tool
            </div>
          </Link>

          <Link
            href="/lessons/development-tools/coordinates"
            className="group relative flex h-56 flex-col justify-between rounded-3xl border border-emerald-200 bg-gradient-to-br from-emerald-100 via-white to-teal-50 p-6 shadow-[0_30px_60px_-40px_rgba(15,23,42,0.8)] transition hover:-translate-y-0.5 hover:shadow-[0_40px_90px_-50px_rgba(15,23,42,0.7)]"
          >
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-2xl border border-emerald-300 bg-emerald-100 text-xl font-semibold text-emerald-700">
                📍
              </span>
              <h2 className="font-display text-2xl font-semibold text-slate-900">Coordinates</h2>
            </div>

            <div className="rounded-2xl border border-emerald-200 bg-white/80 p-3">
              <p className="text-xs uppercase tracking-[0.25em] text-emerald-700">Drag + Record</p>
              <p className="mt-2 text-sm text-slate-700">Move a 3D square on the mat and capture exact positions.</p>
            </div>

            <p className="text-xs uppercase tracking-[0.35em] text-emerald-700">Position tracker</p>
            <div className="absolute -bottom-3 right-4 rounded-full border border-emerald-300 bg-emerald-200 px-3 py-1 text-xs font-semibold uppercase tracking-[0.35em] text-emerald-800">
              Tool
            </div>
          </Link>
          {ENABLE_FEEDBACK ? (
            <Link
              href="/lessons/development-tools/feedback"
              className="group relative flex h-56 flex-col justify-between rounded-3xl border border-sky-200 bg-gradient-to-br from-sky-100 via-white to-indigo-50 p-6 shadow-[0_30px_60px_-40px_rgba(15,23,42,0.8)] transition hover:-translate-y-0.5 hover:shadow-[0_40px_90px_-50px_rgba(15,23,42,0.7)]"
            >
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-2xl border border-sky-300 bg-sky-100 text-xl font-semibold text-sky-700">
                  💬
                </span>
                <h2 className="font-display text-2xl font-semibold text-slate-900">Feedback</h2>
              </div>

              <div className="rounded-2xl border border-sky-200 bg-white/80 p-3">
                <p className="text-xs uppercase tracking-[0.25em] text-sky-700">Anonymized Feed</p>
                <p className="mt-2 text-sm text-slate-700">Review URL + screenshot + comment submissions.</p>
              </div>

              <p className="text-xs uppercase tracking-[0.35em] text-sky-700">Feedback board</p>
              <div className="absolute -bottom-3 right-4 rounded-full border border-sky-300 bg-sky-200 px-3 py-1 text-xs font-semibold uppercase tracking-[0.35em] text-sky-800">
                Tool
              </div>
            </Link>
          ) : null}

          <Link
            href="/lessons/development-tools/app-stats"
            className="group relative flex h-56 flex-col justify-between rounded-3xl border border-indigo-200 bg-gradient-to-br from-indigo-100 via-white to-blue-50 p-6 shadow-[0_30px_60px_-40px_rgba(15,23,42,0.8)] transition hover:-translate-y-0.5 hover:shadow-[0_40px_90px_-50px_rgba(15,23,42,0.7)]"
          >
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-2xl border border-indigo-300 bg-indigo-100 text-xl font-semibold text-indigo-700">
                📊
              </span>
              <h2 className="font-display text-2xl font-semibold text-slate-900">App Stats</h2>
            </div>

            <div className="rounded-2xl border border-indigo-200 bg-white/80 p-3">
              <p className="text-xs uppercase tracking-[0.25em] text-indigo-700">Live File Scan</p>
              <p className="mt-2 text-sm text-slate-700">View counts, dates, media totals, and route timelines.</p>
            </div>

            <p className="text-xs uppercase tracking-[0.35em] text-indigo-700">Project analytics</p>
            <div className="absolute -bottom-3 right-4 rounded-full border border-indigo-300 bg-indigo-200 px-3 py-1 text-xs font-semibold uppercase tracking-[0.35em] text-indigo-800">
              Tool
            </div>
          </Link>
        </div>
      </main>
    </div>
  );
}
