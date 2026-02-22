"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import HomeLink from "../../../components/HomeLink";
import { ENABLE_FEEDBACK } from "../../../lib/featureFlags";
import {
  clearUserFeedbackEntries,
  getUserFeedbackEntries,
  USER_FEEDBACK_STORAGE_KEY,
  USER_FEEDBACK_UPDATED_EVENT,
  type UserFeedbackEntry,
} from "../../../lib/userFeedback";

const formatDateTime = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
};

export default function FeedbackBoardPage() {
  const router = useRouter();
  const [entries, setEntries] = useState<UserFeedbackEntry[]>([]);

  const refreshEntries = useCallback(() => {
    if (!ENABLE_FEEDBACK) return;
    setEntries(getUserFeedbackEntries());
  }, []);

  useEffect(() => {
    if (!ENABLE_FEEDBACK) return;
    refreshEntries();
    const onStorage = (event: StorageEvent) => {
      if (event.key && event.key !== USER_FEEDBACK_STORAGE_KEY) return;
      refreshEntries();
    };
    const onFeedbackUpdated = () => {
      refreshEntries();
    };
    window.addEventListener("storage", onStorage);
    window.addEventListener(USER_FEEDBACK_UPDATED_EVENT, onFeedbackUpdated);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener(USER_FEEDBACK_UPDATED_EVENT, onFeedbackUpdated);
    };
  }, [refreshEntries]);

  const totalWithScreenshot = useMemo(
    () => entries.filter((entry) => Boolean(entry.screenshotDataUrl)).length,
    [entries]
  );

  const clearAll = () => {
    if (!ENABLE_FEEDBACK) return;
    if (!window.confirm("Clear all feedback entries?")) return;
    if (!window.confirm("Are you sure? This cannot be undone.")) return;
    clearUserFeedbackEntries();
    refreshEntries();
  };

  if (!ENABLE_FEEDBACK) {
    return (
      <div className="relative min-h-screen bg-[radial-gradient(circle_at_top,#f2fbff,#fbfeff_45%,#f6fcff)]">
        <HomeLink onBackClick={() => router.push("/lessons/development-tools")} />
        <main className="mx-auto flex min-h-screen w-full max-w-4xl flex-col items-center justify-center gap-4 px-6 py-10 text-center sm:px-10">
          <p className="text-xs uppercase tracking-[0.35em] text-cyan-600">Development Tools</p>
          <h1 className="font-display text-4xl font-semibold text-stone-900">Feedback Hidden</h1>
          <p className="max-w-xl text-sm text-stone-600">Feedback is temporarily hidden and can be re-enabled later.</p>
        </main>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-[radial-gradient(circle_at_top,#f2fbff,#fbfeff_45%,#f6fcff)]">
      <HomeLink onBackClick={() => router.push("/lessons/development-tools")} />
      <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-6 px-6 py-10 sm:px-10">
        <header className="space-y-2 text-center">
          <p className="text-xs uppercase tracking-[0.35em] text-cyan-600">Development Tools</p>
          <h1 className="font-display text-4xl font-semibold text-stone-900">Feedback Board</h1>
          <p className="text-sm text-stone-600">Anonymized feedback feed with URL, comments, and screenshots.</p>
        </header>

        <section className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-stone-200 bg-white/90 p-4 shadow-sm">
            <p className="text-[11px] uppercase tracking-[0.24em] text-stone-500">Total Entries</p>
            <p className="mt-2 text-3xl font-semibold text-stone-900">{entries.length}</p>
          </div>
          <div className="rounded-2xl border border-stone-200 bg-white/90 p-4 shadow-sm">
            <p className="text-[11px] uppercase tracking-[0.24em] text-stone-500">With Screenshot</p>
            <p className="mt-2 text-3xl font-semibold text-stone-900">{totalWithScreenshot}</p>
          </div>
          <div className="rounded-2xl border border-stone-200 bg-white/90 p-4 shadow-sm">
            <p className="text-[11px] uppercase tracking-[0.24em] text-stone-500">Storage</p>
            <p className="mt-2 text-xs uppercase tracking-[0.2em] text-stone-600">Local Device</p>
          </div>
        </section>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={refreshEntries}
            className="rounded-full border border-stone-300 bg-white px-4 py-2 text-xs uppercase tracking-[0.22em] text-stone-700"
          >
            Refresh
          </button>
          <button
            type="button"
            onClick={clearAll}
            className="rounded-full border border-rose-200 bg-rose-50 px-4 py-2 text-xs uppercase tracking-[0.22em] text-rose-700"
          >
            Clear Feedback
          </button>
        </div>

        <section className="rounded-3xl border border-cyan-200 bg-white/90 p-4 shadow-sm sm:p-5">
          {entries.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-cyan-300 bg-cyan-50 p-6 text-sm text-cyan-800">
              No feedback yet. Use the floating Feedback button on any page to submit one.
            </div>
          ) : (
            <div className="space-y-4">
              {entries.map((entry) => (
                <article
                  key={entry.id}
                  className="rounded-2xl border border-stone-200 bg-stone-50/70 p-4 shadow-sm"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-cyan-700">{entry.alias}</p>
                    <p className="text-xs text-stone-500">{formatDateTime(entry.createdAt)}</p>
                  </div>
                  <a
                    href={entry.url}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-2 block break-all text-xs text-sky-700 underline decoration-sky-300 underline-offset-2"
                  >
                    {entry.url}
                  </a>
                  <p className="mt-3 rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm text-stone-800">
                    {entry.comment}
                  </p>
                  {entry.screenshotDataUrl ? (
                    <div className="mt-3 overflow-hidden rounded-xl border border-stone-200 bg-white">
                      <img
                        src={entry.screenshotDataUrl}
                        alt="User feedback screenshot"
                        className="h-52 w-full object-cover"
                      />
                    </div>
                  ) : null}
                </article>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
