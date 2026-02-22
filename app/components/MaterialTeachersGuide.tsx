"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { type MaterialTeachersGuideData } from "../data/materialTeachersGuides";

type MaterialTeachersGuideProps = {
  guide: MaterialTeachersGuideData;
  className?: string;
  autoPreviewOnVisible?: boolean;
  materialPdfHref?: string;
  materialPdfLabel?: string;
  teacherGuidePdfHref?: string;
  teacherGuidePdfLabel?: string;
};

export default function MaterialTeachersGuide({
  guide,
  className = "",
  autoPreviewOnVisible = false,
  materialPdfHref,
  materialPdfLabel = "Download Material PDF",
  teacherGuidePdfHref,
  teacherGuidePdfLabel = "Download Teacher's Guide PDF",
}: MaterialTeachersGuideProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const detailsRef = useRef<HTMLDetailsElement | null>(null);
  const hasAutoPreviewPlayedRef = useRef(false);
  const timerIdsRef = useRef<number[]>([]);
  const [attentionOn, setAttentionOn] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const clearTimers = useCallback(() => {
    timerIdsRef.current.forEach((id) => window.clearTimeout(id));
    timerIdsRef.current = [];
  }, []);

  const schedule = useCallback((callback: () => void, delayMs: number) => {
    const id = window.setTimeout(callback, delayMs);
    timerIdsRef.current.push(id);
  }, []);

  useEffect(() => {
    if (!autoPreviewOnVisible) {
      return;
    }
    const node = containerRef.current;
    if (!node) {
      return;
    }

    const runAttentionSequence = () => {
      if (hasAutoPreviewPlayedRef.current) {
        return;
      }
      hasAutoPreviewPlayedRef.current = true;
      const details = detailsRef.current;
      if (!details) {
        return;
      }

      const FLASH_DURATION_MS = 1400;
      const EXPAND_DELAY_MS = 1700;
      const OPEN_HOLD_MS = 3200;

      // One slow guide highlight, then expand and softly return.
      schedule(() => setAttentionOn(true), 0);
      schedule(() => setAttentionOn(false), FLASH_DURATION_MS);
      schedule(() => {
        setIsOpen(true);
      }, EXPAND_DELAY_MS);
      schedule(() => {
        setIsOpen(false);
      }, EXPAND_DELAY_MS + OPEN_HOLD_MS);
    };

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (!entry?.isIntersecting) {
          return;
        }
        runAttentionSequence();
        observer.disconnect();
      },
      {
        // Delay trigger until the guide passes into the lower 25% zone of the viewport.
        rootMargin: "0px 0px -25% 0px",
        threshold: 0.05,
      },
    );

    observer.observe(node);

    return () => {
      observer.disconnect();
      clearTimers();
    };
  }, [autoPreviewOnVisible, clearTimers, schedule]);

  return (
    <div
      ref={containerRef}
      className={`overflow-hidden rounded-3xl border-2 border-sky-300 bg-gradient-to-br from-sky-50 via-blue-50 to-cyan-100 text-left shadow-[0_24px_70px_-40px_rgba(14,116,144,0.45)] ${className}`.trim()}
    >
      <details ref={detailsRef} className="group" open={isOpen}>
        <summary
          onClick={(event) => {
            event.preventDefault();
            setIsOpen((prev) => !prev);
          }}
          className={`flex min-h-[88px] cursor-pointer list-none items-center justify-between px-6 py-5 text-lg font-semibold tracking-[0.08em] transition-all duration-500 ease-in-out sm:text-xl ${
            attentionOn ? "bg-rose-300 text-rose-950" : "bg-sky-100/70 text-sky-950"
          }`}
        >
          <span>Teacher&apos;s Guide</span>
          <span
            className={`inline-flex h-9 w-9 items-center justify-center rounded-full transition-all duration-500 ease-in-out ${
              attentionOn
                ? "scale-125 border-rose-200 bg-white/35 text-rose-800"
                : "border-sky-300 bg-white text-sky-700"
            } ${
              isOpen ? "rotate-180" : "rotate-0"
            }`}
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.6"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-5 w-5"
              aria-hidden="true"
            >
              <path d="m6 9 6 6 6-6" />
            </svg>
          </span>
        </summary>

        <div
          className="grid border-t-2 border-sky-200 transition-[grid-template-rows] ease-in-out"
          style={{
            gridTemplateRows: isOpen ? "1fr" : "0fr",
            transitionDuration: isOpen ? "900ms" : "1850ms",
          }}
        >
          <div className="min-h-0 overflow-hidden">
          <div
            className={`space-y-5 px-7 py-8 text-base leading-relaxed text-sky-950 transition-opacity ease-in-out sm:text-lg ${
              isOpen ? "opacity-100" : "opacity-0"
            }`}
            style={{ transitionDuration: isOpen ? "500ms" : "1100ms" }}
          >
            <div className="rounded-2xl border border-sky-200/80 bg-white/75 p-5 shadow-sm">
            <h3 className="text-lg font-semibold text-sky-950 sm:text-xl">{guide.title}</h3>
            </div>

            <div className="rounded-2xl border border-sky-200/80 bg-white/75 p-5 shadow-sm">
              <h4 className="text-lg font-semibold text-sky-950 sm:text-xl">Purpose</h4>
              <p>{guide.purpose}</p>
            </div>

          <div className="rounded-2xl border border-sky-200/80 bg-white/75 p-5 shadow-sm">
            <h4 className="text-lg font-semibold text-sky-950 sm:text-xl">What&apos;s Included</h4>
            <p>{guide.whatsIncluded}</p>
          </div>

          <div className="rounded-2xl border border-sky-200/80 bg-white/75 p-5 shadow-sm">
            <h4 className="text-lg font-semibold text-sky-950 sm:text-xl">Key Language</h4>
            <ul className="mt-2 list-disc space-y-1 pl-6">
              {guide.keyLanguage.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          </div>

          <div className="rounded-2xl border border-sky-200/80 bg-white/75 p-5 shadow-sm">
            <h4 className="text-lg font-semibold text-sky-950 sm:text-xl">Presentation Notes</h4>
            <p>{guide.presentationNotes}</p>
          </div>

          <div className="rounded-2xl border border-sky-200/80 bg-white/75 p-5 shadow-sm">
            <h4 className="text-lg font-semibold text-sky-950 sm:text-xl">Control of Error</h4>
            <p>{guide.controlOfError}</p>
          </div>

          <div className="rounded-2xl border border-sky-200/80 bg-white/75 p-5 shadow-sm">
            <h4 className="text-lg font-semibold text-sky-950 sm:text-xl">Observe For</h4>
            <p>{guide.observeFor}</p>
          </div>

          <div className="rounded-2xl border border-sky-200/80 bg-white/75 p-5 shadow-sm">
            <h4 className="text-lg font-semibold text-sky-950 sm:text-xl">Extensions</h4>
            <ul className="mt-2 list-disc space-y-1 pl-6">
              {guide.extensions.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          </div>

            <div className="rounded-2xl border border-sky-200/80 bg-white/75 p-5 shadow-sm">
              <h4 className="text-lg font-semibold text-sky-950 sm:text-xl">Readiness</h4>
              <p>{guide.readiness}</p>
            </div>

            <div className="flex justify-end rounded-2xl border border-sky-200/80 bg-white/75 p-5 shadow-sm">
              {materialPdfHref || teacherGuidePdfHref ? (
                <div className="flex flex-wrap justify-end gap-2">
                  {materialPdfHref ? (
                    <a
                      href={materialPdfHref}
                      target="_blank"
                      rel="noopener noreferrer"
                      download
                      className="inline-flex items-center justify-center rounded-full border border-[#71c0ee] bg-[#e8f5fc] px-5 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#0e6798] transition hover:bg-[#d8eefb] sm:text-sm"
                    >
                      {materialPdfLabel}
                    </a>
                  ) : null}
                  {teacherGuidePdfHref ? (
                    <a
                      href={teacherGuidePdfHref}
                      target="_blank"
                      rel="noopener noreferrer"
                      download
                      className="inline-flex items-center justify-center rounded-full border border-[#71c0ee] bg-[#71c0ee] px-5 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-[#5cb6e8] sm:text-sm"
                    >
                      {teacherGuidePdfLabel}
                    </a>
                  ) : null}
                </div>
              ) : (
                <div className="group/print relative" title="Please register for an account with printing rights.">
                  <button
                    type="button"
                    disabled
                    aria-disabled="true"
                    className="pointer-events-none cursor-not-allowed rounded-full border border-stone-300 bg-stone-100 px-5 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-stone-400 sm:text-sm"
                  >
                    Print PDF Material or Guide
                  </button>
                  <div className="pointer-events-none absolute -top-11 right-0 rounded-full bg-stone-900 px-4 py-2 text-xs text-white opacity-0 transition group-hover/print:opacity-100 group-active/print:opacity-100 group-focus-within/print:opacity-100">
                    Please register for an account with printing rights.
                  </div>
                </div>
              )}
            </div>
          </div>
          </div>
        </div>
      </details>
    </div>
  );
}
