"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { addUserFeedbackEntry } from "../lib/userFeedback";

const toCompressedImageDataUrl = (canvas: HTMLCanvasElement) => {
  const maxWidth = 1280;
  const maxHeight = 720;
  const scale = Math.min(1, maxWidth / canvas.width, maxHeight / canvas.height);
  if (scale >= 1) {
    return canvas.toDataURL("image/jpeg", 0.72);
  }
  const targetWidth = Math.max(1, Math.round(canvas.width * scale));
  const targetHeight = Math.max(1, Math.round(canvas.height * scale));
  const output = document.createElement("canvas");
  output.width = targetWidth;
  output.height = targetHeight;
  const context = output.getContext("2d");
  if (!context) return canvas.toDataURL("image/jpeg", 0.72);
  context.drawImage(canvas, 0, 0, targetWidth, targetHeight);
  return output.toDataURL("image/jpeg", 0.72);
};

type FeedbackWidgetProps = {
  placement?: "fixed" | "inline";
};

export default function FeedbackWidget({ placement = "fixed" }: FeedbackWidgetProps) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [comment, setComment] = useState("");
  const [screenshotDataUrl, setScreenshotDataUrl] = useState<string | null>(null);
  const [capturing, setCapturing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  const currentUrl = useMemo(
    () => (typeof window === "undefined" ? pathname : window.location.href),
    [pathname]
  );

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  const captureScreenshot = useCallback(async () => {
    if (typeof window === "undefined") return null;
    setCapturing(true);
    setStatus(null);
    try {
      const html2canvas = (await import("html2canvas")).default;
      const canvas = await html2canvas(document.body, {
        useCORS: true,
        allowTaint: false,
        backgroundColor: "#ffffff",
        logging: false,
        ignoreElements: (element) => {
          if (!(element instanceof HTMLElement)) return false;
          return element.dataset.feedbackWidget === "true";
        },
      });
      const nextDataUrl = toCompressedImageDataUrl(canvas);
      setScreenshotDataUrl(nextDataUrl);
      return nextDataUrl;
    } catch {
      setStatus("Screenshot capture failed. You can still submit text feedback.");
      return null;
    } finally {
      setCapturing(false);
    }
  }, []);

  const handleSubmit = useCallback(async () => {
    const trimmed = comment.trim();
    if (!trimmed) {
      setStatus("Please add a short comment.");
      return;
    }

    setSubmitting(true);
    setStatus(null);
    try {
      const captured = screenshotDataUrl ?? (await captureScreenshot());
      addUserFeedbackEntry({
        url: typeof window === "undefined" ? currentUrl : window.location.href,
        comment: trimmed,
        screenshotDataUrl: captured ?? undefined,
      });
      setComment("");
      setScreenshotDataUrl(null);
      setStatus("Feedback submitted.");
      setOpen(false);
    } catch {
      setStatus("Unable to submit feedback right now.");
    } finally {
      setSubmitting(false);
    }
  }, [captureScreenshot, comment, currentUrl, screenshotDataUrl]);

  return (
    <>
      <div
        data-feedback-widget="true"
        className={
          placement === "fixed"
            ? "fixed bottom-4 right-4 z-[1300]"
            : "relative z-20 flex justify-end"
        }
      >
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex items-center gap-2 rounded-full border border-cyan-200 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-cyan-700 shadow-[0_12px_30px_rgba(15,23,42,0.25)] transition hover:bg-cyan-50"
        >
          Feedback
        </button>
      </div>

      {open ? (
        <div data-feedback-widget="true" className="fixed inset-0 z-[1400] flex items-end justify-end bg-black/25 p-4 sm:items-center sm:justify-center">
          <div className="w-full max-w-xl rounded-3xl border border-stone-200 bg-white p-5 shadow-2xl">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.28em] text-cyan-700">Feedback</p>
                <h2 className="font-display text-2xl font-semibold text-stone-900">Send Feedback</h2>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-full border border-stone-200 px-3 py-1 text-xs uppercase tracking-[0.2em] text-stone-600"
              >
                Close
              </button>
            </div>

            <div className="mt-4 space-y-3">
              <div className="rounded-xl border border-stone-200 bg-stone-50 p-3">
                <p className="text-[10px] uppercase tracking-[0.2em] text-stone-500">Page URL</p>
                <p className="mt-1 break-all text-xs text-stone-700">{currentUrl}</p>
              </div>

              <label className="block">
                <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.2em] text-stone-600">
                  Comment
                </span>
                <textarea
                  value={comment}
                  onChange={(event) => setComment(event.target.value)}
                  placeholder="What happened? What should change?"
                  className="h-28 w-full rounded-xl border border-stone-300 px-3 py-2 text-sm text-stone-800 outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100"
                />
              </label>

              {screenshotDataUrl ? (
                <div className="rounded-xl border border-stone-200 bg-stone-50 p-2">
                  <img src={screenshotDataUrl} alt="Feedback screenshot preview" className="h-32 w-full rounded-lg object-cover" />
                </div>
              ) : null}

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => void captureScreenshot()}
                  disabled={capturing || submitting}
                  className="rounded-full border border-slate-300 bg-white px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-700 disabled:opacity-50"
                >
                  {capturing ? "Capturing..." : "Capture Screenshot"}
                </button>
                {screenshotDataUrl ? (
                  <button
                    type="button"
                    onClick={() => setScreenshotDataUrl(null)}
                    disabled={capturing || submitting}
                    className="rounded-full border border-rose-200 bg-rose-50 px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-rose-700 disabled:opacity-50"
                  >
                    Remove Screenshot
                  </button>
                ) : null}
                <Link
                  href="/lessons/development-tools/feedback"
                  className="rounded-full border border-cyan-200 bg-cyan-50 px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-cyan-700"
                >
                  Open Feedback Board
                </Link>
              </div>

              {status ? <p className="text-xs text-stone-600">{status}</p> : null}

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => void handleSubmit()}
                  disabled={submitting || capturing}
                  className="rounded-full border border-emerald-300 bg-emerald-500 px-5 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-white disabled:opacity-50"
                >
                  {submitting ? "Sending..." : "Send Feedback"}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
