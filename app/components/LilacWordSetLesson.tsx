"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import HomeLink from "./HomeLink";

type LilacWordSetLessonProps = {
  label: string;
  words: string[];
  nextSetHref?: string;
};

const WORDS_PER_PAGE = 10;

const normalizeWord = (value: string) => value.toLowerCase().replace(/[^a-z]/g, "");

function SpeakerIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 5 6 9H3v6h3l5 4V5z" />
      <path d="M15.5 8.5a5 5 0 0 1 0 7" />
      <path d="M18.5 6a9 9 0 0 1 0 12" />
    </svg>
  );
}

function MicIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="3" width="6" height="11" rx="3" />
      <path d="M5 11a7 7 0 1 0 14 0" />
      <path d="M12 18v3" />
      <path d="M8 21h8" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12l5 5L20 7" />
    </svg>
  );
}

export default function LilacWordSetLesson({
  label,
  words,
  nextSetHref,
}: LilacWordSetLessonProps) {
  const pages = useMemo(() => {
    const nextPages: string[][] = [];
    for (let index = 0; index < words.length; index += WORDS_PER_PAGE) {
      nextPages.push(words.slice(index, index + WORDS_PER_PAGE));
    }
    return nextPages;
  }, [words]);

  const [pageIndex, setPageIndex] = useState(0);
  const [completedWords, setCompletedWords] = useState<Record<string, boolean>>({});
  const [listeningWord, setListeningWord] = useState<string | null>(null);
  const [feedbackWord, setFeedbackWord] = useState<string | null>(null);
  const [flashWord, setFlashWord] = useState<string | null>(null);
  const [speechAvailable, setSpeechAvailable] = useState(true);

  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const activeWordRef = useRef<string>("");
  const feedbackTimerRef = useRef<number | null>(null);
  const flashTimerRef = useRef<number | null>(null);

  const currentPageWords = pages[pageIndex] ?? [];
  const isCurrentPageComplete =
    currentPageWords.length > 0 &&
    currentPageWords.every((word) => completedWords[word]);
  const isSetComplete = words.every((word) => completedWords[word]);

  const clearFeedbackTimer = useCallback(() => {
    if (feedbackTimerRef.current !== null) {
      window.clearTimeout(feedbackTimerRef.current);
      feedbackTimerRef.current = null;
    }
  }, []);

  const clearFlashTimer = useCallback(() => {
    if (flashTimerRef.current !== null) {
      window.clearTimeout(flashTimerRef.current);
      flashTimerRef.current = null;
    }
  }, []);

  const speakWord = useCallback((word: string) => {
    if (typeof window === "undefined") return;
    const utterance = new SpeechSynthesisUtterance(word);
    utterance.lang = "en-US";
    utterance.rate = 0.85;
    window.speechSynthesis?.cancel();
    window.speechSynthesis?.speak(utterance);
  }, []);

  const stopListening = useCallback(() => {
    const recognition = recognitionRef.current;
    if (!recognition) return;
    try {
      recognition.stop();
    } catch {
      // Ignore browser stop errors.
    }
  }, []);

  const startListening = useCallback(
    (word: string) => {
      if (completedWords[word]) return;
      if (typeof window === "undefined") return;
      setFlashWord(word);
      clearFlashTimer();
      flashTimerRef.current = window.setTimeout(() => {
        setFlashWord((current) => (current === word ? null : current));
      }, 380);

      const SpeechRecognitionImpl =
        (window as unknown as { SpeechRecognition?: typeof SpeechRecognition }).SpeechRecognition ||
        (window as unknown as { webkitSpeechRecognition?: typeof SpeechRecognition }).webkitSpeechRecognition;

      if (!SpeechRecognitionImpl) {
        setSpeechAvailable(false);
        return;
      }

      if (!recognitionRef.current) {
        const recognition = new SpeechRecognitionImpl();
        recognition.lang = "en-US";
        recognition.interimResults = false;
        recognition.maxAlternatives = 3;

        recognition.onresult = (event) => {
          const expected = normalizeWord(activeWordRef.current);
          const result = event.results[0];
          const heard = Array.from({ length: result.length }, (_, index) =>
            normalizeWord(result[index]?.transcript ?? "")
          );
          const matched = heard.some((value) => value === expected);

          if (matched && activeWordRef.current) {
            const correctWord = activeWordRef.current;
            setCompletedWords((prev) => ({ ...prev, [correctWord]: true }));
            setFeedbackWord(correctWord);
            clearFeedbackTimer();
            feedbackTimerRef.current = window.setTimeout(() => {
              setFeedbackWord(null);
            }, 900);
          }
        };

        recognition.onend = () => {
          setListeningWord(null);
        };

        recognition.onerror = () => {
          setListeningWord(null);
        };

        recognitionRef.current = recognition;
      }

      const recognition = recognitionRef.current;
      if (!recognition) return;

      activeWordRef.current = word;
      setListeningWord(word);
      clearFeedbackTimer();
      setFeedbackWord(null);

      try {
        recognition.start();
      } catch {
        try {
          recognition.stop();
        } catch {
          // Ignore browser stop errors.
        }
        window.setTimeout(() => {
          try {
            recognition.start();
          } catch {
            setListeningWord(null);
          }
        }, 120);
      }
    },
    [clearFeedbackTimer, clearFlashTimer, completedWords]
  );

  useEffect(() => {
    if (!isCurrentPageComplete) return;
    if (pageIndex >= pages.length - 1) return;
    const timer = window.setTimeout(() => {
      setPageIndex((prev) => Math.min(prev + 1, pages.length - 1));
    }, 700);
    return () => {
      window.clearTimeout(timer);
    };
  }, [isCurrentPageComplete, pageIndex, pages.length]);

  useEffect(() => {
    return () => {
      clearFeedbackTimer();
      clearFlashTimer();
      stopListening();
      if (typeof window !== "undefined") {
        window.speechSynthesis?.cancel();
      }
    };
  }, [clearFeedbackTimer, clearFlashTimer, stopListening]);

  return (
    <div className="relative min-h-screen bg-[radial-gradient(circle_at_top,#f5efe6,#fdfbf8_55%,#f7efe4)]">
      <HomeLink />
      <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col gap-6 px-6 py-10">
        <header className="space-y-2 text-center">
          <p className="text-xs uppercase tracking-[0.35em] text-stone-400">Language Arts · Lilac Word Lists</p>
          <h1 className="font-display text-4xl font-semibold text-stone-900">Set {label}</h1>
          <p className="text-sm text-stone-600">
            Page {pageIndex + 1} of {pages.length} · 10 words per page
          </p>
        </header>

        {!speechAvailable ? (
          <div className="rounded-2xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            Speech recognition is not available in this browser. Try Chrome or Safari on device.
          </div>
        ) : null}

        <div className="mx-auto w-full max-w-xl rounded-3xl bg-[#D5C5E0] p-3 sm:p-4">
          <section className="mx-auto w-full max-w-lg space-y-3">
            {currentPageWords.map((word) => {
              const complete = Boolean(completedWords[word]);
              const listening = listeningWord === word;
              const justChecked = feedbackWord === word;
              const flashing = flashWord === word;

              return (
                <div
                  key={`${label}-${word}`}
                  className={`relative flex min-h-16 items-stretch overflow-hidden rounded-2xl border transition ${
                    flashing
                      ? "border-emerald-400 bg-emerald-100"
                      : complete
                      ? "border-emerald-400 bg-white"
                      : "border-fuchsia-200 bg-white"
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => speakWord(word)}
                  className={`inline-flex w-14 items-center justify-center border-r transition ${
                    complete
                      ? "border-emerald-300 bg-emerald-500 text-white hover:bg-emerald-600"
                      : "border-blue-200 bg-blue-400 text-white hover:bg-blue-500"
                  }`}
                    aria-label={`Speak ${word}`}
                  >
                    <SpeakerIcon />
                  </button>

                  <p className="flex flex-1 items-center justify-center px-3 text-center text-2xl font-semibold text-stone-900">
                    {word}
                  </p>

                  <button
                    type="button"
                    onClick={() => startListening(word)}
                    disabled={complete}
                  className={`inline-flex w-14 items-center justify-center border-l transition ${
                    complete
                      ? "cursor-default border-emerald-300 bg-emerald-500 text-white"
                      : listening
                        ? "border-rose-200 bg-rose-500 text-white"
                        : "border-rose-200 bg-rose-400 text-white hover:bg-rose-500"
                  }`}
                    aria-label={`Record ${word}`}
                  >
                    {complete ? <CheckIcon /> : <MicIcon />}
                  </button>

                  {justChecked ? (
                    <span className="absolute -right-2 -top-2 inline-flex h-7 w-7 items-center justify-center rounded-full bg-emerald-600 text-white shadow-lg">
                      <CheckIcon />
                    </span>
                  ) : null}
                </div>
              );
            })}
          </section>
        </div>

        <div className="mt-auto flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs uppercase tracking-[0.3em] text-stone-500">
            Completed {Object.values(completedWords).filter(Boolean).length} of {words.length}
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setPageIndex((prev) => Math.max(prev - 1, 0))}
              className="rounded-full border border-stone-300 px-4 py-2 text-xs uppercase tracking-[0.3em] text-stone-600 disabled:opacity-40"
              disabled={pageIndex === 0}
            >
              Previous
            </button>
            <button
              type="button"
              onClick={() => setPageIndex((prev) => Math.min(prev + 1, pages.length - 1))}
              className="rounded-full border border-stone-300 px-4 py-2 text-xs uppercase tracking-[0.3em] text-stone-600 disabled:opacity-40"
              disabled={pageIndex >= pages.length - 1}
            >
              Next
            </button>
          </div>
        </div>

        {isSetComplete ? (
          <div className="rounded-2xl border border-emerald-300 bg-emerald-50 px-5 py-4 text-center">
            <p className="font-semibold text-emerald-700">Set complete</p>
            <div className="mt-3 flex flex-wrap items-center justify-center gap-3">
              {nextSetHref ? (
                <Link
                  href={nextSetHref}
                  className="rounded-full bg-emerald-600 px-4 py-2 text-xs uppercase tracking-[0.3em] text-white"
                >
                  Next Set
                </Link>
              ) : null}
              <Link
                href="/lessons/language-arts/lilac-word-lists"
                className="rounded-full border border-emerald-400 px-4 py-2 text-xs uppercase tracking-[0.3em] text-emerald-700"
              >
                Back to Sets
              </Link>
            </div>
          </div>
        ) : null}
      </main>
    </div>
  );
}
