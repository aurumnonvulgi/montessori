"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import HomeLink from "../../../../components/HomeLink";

const BOOK_PAGES = [
  { word: "cat", sentence: "The cat is on the mat." },
  { word: "hat", sentence: "I have a hat." },
  { word: "rat", sentence: "The rat can nap." },
  { word: "mat", sentence: "The mat is on the car." },
  { word: "bat", sentence: "I see a bat on the log." },
  { word: "cap", sentence: "I have a cap." },
  { word: "map", sentence: "I see a map." },
  { word: "nap", sentence: "I can nap on the mat." },
  { word: "can", sentence: "I can see the sun." },
  { word: "tan", sentence: "The pup is tan." },
  { word: "fan", sentence: "The fan is on." },
  { word: "pan", sentence: "The pan is on the bed." },
  { word: "bed", sentence: "The cat is in bed." },
  { word: "red", sentence: "The hat is red." },
  { word: "web", sentence: "The bug is on the web." },
  { word: "peg", sentence: "I see a peg in the box." },
  { word: "leg", sentence: "Mud is on my leg." },
  { word: "hen", sentence: "The hen is in the box." },
  { word: "pen", sentence: "I have a pen." },
  { word: "ten", sentence: "I see ten in the box." },
  { word: "jet", sentence: "I see a jet." },
  { word: "net", sentence: "I see a net." },
  { word: "wet", sentence: "The rug is wet." },
  { word: "wed", sentence: "It is Wed." },
  { word: "bib", sentence: "I have a bib." },
  { word: "rib", sentence: "I see a rib." },
  { word: "fig", sentence: "I see a fig." },
  { word: "pig", sentence: "The pig is big." },
  { word: "fin", sentence: "I see a fin." },
  { word: "pin", sentence: "I see a pin." },
  { word: "lid", sentence: "The lid is on the pot." },
  { word: "kid", sentence: "The kid can dig." },
  { word: "lip", sentence: "My lip is red." },
  { word: "hip", sentence: "This is my hip." },
  { word: "tin", sentence: "I see a tin can." },
  { word: "dig", sentence: "I can dig in mud." },
  { word: "dog", sentence: "The dog is on the log." },
  { word: "log", sentence: "The log is big." },
  { word: "cog", sentence: "I see a cog." },
  { word: "rod", sentence: "The rod is on the mat." },
  { word: "sob", sentence: "I sob in bed." },
  { word: "cob", sentence: "I see a cob." },
  { word: "job", sentence: "I can do my job." },
  { word: "rob", sentence: "Rob can run." },
  { word: "top", sentence: "The cap is on top." },
  { word: "pot", sentence: "The lid is on the pot." },
  { word: "fox", sentence: "The fox is on the box." },
  { word: "box", sentence: "The cat is in the box." },
  { word: "bug", sentence: "The bug is on the rug." },
  { word: "hug", sentence: "I hug my son." },
  { word: "rug", sentence: "The rug is wet." },
  { word: "cub", sentence: "The cub is little." },
  { word: "tub", sentence: "The pup is in the tub." },
  { word: "mud", sentence: "I dig in mud." },
  { word: "bud", sentence: "I see a bud." },
  { word: "sun", sentence: "The sun is up." },
  { word: "bun", sentence: "I see a bun." },
  { word: "pup", sentence: "The pup can nap." },
  { word: "cup", sentence: "I see a cup." },
  { word: "bus", sentence: "We go on the bus." },
];

const COVER_TITLE = "My First Reading Book";
const COVER_SUBTITLE = "Phonics";

const VOWEL_GROUPS = ["a", "e", "i", "o", "u"] as const;
type VowelGroup = typeof VOWEL_GROUPS[number];

const toImage = (word: string, vowel: VowelGroup) =>
  `/assets/language_arts/moveable_alphabet/phonic_pictures/${vowel}-picture-${word}.png`;

const isVowel = (letter: string) => /[aeiou]/i.test(letter);

const wordVowel = (word: string): VowelGroup => {
  const vowel = word.match(/[aeiou]/i)?.[0]?.toLowerCase();
  return (VOWEL_GROUPS.includes(vowel as VowelGroup) ? vowel : "a") as VowelGroup;
};

const renderSentence = (sentence: string, word: string) => {
  const index = sentence.toLowerCase().indexOf(word.toLowerCase());
  if (index === -1) return sentence;
  const before = sentence.slice(0, index);
  const target = sentence.slice(index, index + word.length);
  const after = sentence.slice(index + word.length);
  return (
    <>
      {before}
      <span className="font-semibold">
        {target.split("").map((char, i) => (
          <span key={`${char}-${i}`} className={isVowel(char) ? "text-sky-600" : "text-rose-600"}>
            {char}
          </span>
        ))}
      </span>
      {after}
    </>
  );
};

export default function PhonicsReadingBook() {
  const [selectedVowel, setSelectedVowel] = useState<VowelGroup | null>(null);
  const [started, setStarted] = useState(false);
  const [pageIndex, setPageIndex] = useState(0);
  const [isFlipping, setIsFlipping] = useState(false);
  const [flipDirection, setFlipDirection] = useState<"next" | "prev">("next");
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [success, setSuccess] = useState(false);
  const sentenceRef = useRef("");
  const [typedText, setTypedText] = useState("");
  const typingTimerRef = useRef<number | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [isShrinking, setIsShrinking] = useState(false);

  const pagesForVowel = useMemo(() => {
    if (!selectedVowel) return [];
    return BOOK_PAGES.filter((item) => wordVowel(item.word) === selectedVowel);
  }, [selectedVowel]);

  const page = pagesForVowel[pageIndex];
  const coverPage = pagesForVowel[0];

  const totalPages = pagesForVowel.length;

  const handleSpeak = useCallback((text: string) => {
    if (typeof window === "undefined") return;
    const utterance = new SpeechSynthesisUtterance(text);
    window.speechSynthesis?.cancel();
    window.speechSynthesis?.speak(utterance);
  }, []);

  const normalizeText = useCallback((value: string) => {
    return value
      .toLowerCase()
      .replace(/[^a-z\\s]/g, "")
      .replace(/\\s+/g, " ")
      .trim();
  }, []);

  const isTranscriptCorrect = useCallback(
    (spoken: string, expected: string) => {
      const normalizedSpoken = normalizeText(spoken);
      const normalizedExpected = normalizeText(expected);
      if (!normalizedSpoken || !normalizedExpected) return false;
      if (normalizedSpoken.includes(normalizedExpected)) return true;
      const spokenWords = new Set(normalizedSpoken.split(" "));
      const expectedWords = normalizedExpected.split(" ");
      if (!expectedWords.length) return false;
      const matched = expectedWords.filter((word) => spokenWords.has(word)).length;
      return matched / expectedWords.length >= 0.7;
    },
    [normalizeText]
  );

  const setupRecognition = useCallback(() => {
    if (typeof window === "undefined") return null;
    const SpeechRecognitionImpl =
      (window as unknown as { SpeechRecognition?: typeof SpeechRecognition }).SpeechRecognition ||
      (window as unknown as { webkitSpeechRecognition?: typeof SpeechRecognition }).webkitSpeechRecognition;
    if (!SpeechRecognitionImpl) return null;
    const recognition = new SpeechRecognitionImpl();
    recognition.lang = "en-US";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.onresult = (event) => {
      const result = event.results[0];
      if (result && result[0]) {
        const spoken = result[0].transcript;
        setTranscript(spoken);
        if (isTranscriptCorrect(spoken, sentenceRef.current)) {
          setSuccess(true);
          if (pageIndex < totalPages - 1) {
            window.setTimeout(() => {
              setSuccess(false);
              setPageIndex((prev) => Math.min(prev + 1, totalPages - 1));
            }, 900);
          }
        }
      }
    };
    recognition.onend = () => setListening(false);
    recognition.onerror = () => setListening(false);
    return recognition;
  }, [isTranscriptCorrect, pageIndex, totalPages]);

  const handleMic = useCallback(() => {
    if (listening) {
      recognitionRef.current?.stop();
      return;
    }
    if (!page) return;
    if (!recognitionRef.current) {
      recognitionRef.current = setupRecognition();
    }
    if (!recognitionRef.current) return;
    setTranscript("");
    setListening(true);
    recognitionRef.current.start();
  }, [listening, page, setupRecognition]);

  useEffect(() => {
    sentenceRef.current = page?.sentence ?? "";
  }, [page]);

  useEffect(() => {
    if (!page || !started) {
      setTypedText("");
      return;
    }
    if (typingTimerRef.current !== null) {
      window.clearTimeout(typingTimerRef.current);
      typingTimerRef.current = null;
    }
    let index = 0;
    const full = page.sentence;
    const tick = () => {
      index += 1;
      setTypedText(full.slice(0, index));
      if (index < full.length) {
        typingTimerRef.current = window.setTimeout(tick, 90);
      } else {
        setIsTyping(false);
        typingTimerRef.current = window.setTimeout(() => {
          setIsShrinking(true);
        }, 700);
      }
    };
    setTypedText("");
    setIsTyping(true);
    setIsShrinking(false);
    typingTimerRef.current = window.setTimeout(tick, 400);
    return () => {
      if (typingTimerRef.current !== null) {
        window.clearTimeout(typingTimerRef.current);
        typingTimerRef.current = null;
      }
      setIsTyping(false);
      setIsShrinking(false);
    };
  }, [page, started]);

  const goToPage = useCallback(
    (direction: "next" | "prev") => {
      if (isFlipping) return;
      if (direction === "next" && pageIndex >= totalPages - 1) return;
      if (direction === "prev" && pageIndex <= 0) return;
      setFlipDirection(direction);
      setIsFlipping(true);
      setSuccess(false);
      window.setTimeout(() => {
        setPageIndex((prev) => (direction === "next" ? prev + 1 : prev - 1));
        setIsFlipping(false);
      }, 600);
    },
    [isFlipping, pageIndex, totalPages]
  );

  const rightPageTransform = useMemo(() => {
    if (!isFlipping) return "rotateY(0deg)";
    return flipDirection === "next" ? "rotateY(-180deg)" : "rotateY(180deg)";
  }, [isFlipping, flipDirection]);

  return (
    <div className="relative min-h-screen bg-[radial-gradient(circle_at_top,#f5efe6,#fdfbf8_55%,#f7efe4)]">
      <HomeLink />
      <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-10 px-6 py-10">
        <header className="space-y-3 text-center md:space-y-3">
          <p className="hidden text-xs uppercase tracking-[0.35em] text-stone-400 md:block">Language Arts · Phonics</p>
          <h1 className="hidden font-display text-4xl font-semibold text-stone-900 md:block">Phonic Reading Books</h1>
          <p className="hidden text-sm text-stone-600 md:block">Choose a letter book and read along.</p>
        </header>

        {!selectedVowel ? (
          <div className="mx-auto grid w-full max-w-4xl gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {VOWEL_GROUPS.map((vowel) => (
              <button
                key={vowel}
                type="button"
                onClick={() => {
                  setSelectedVowel(vowel);
                  setStarted(false);
                  setPageIndex(0);
                  setTranscript("");
                }}
                className="group relative flex h-56 flex-col items-center justify-center gap-4 rounded-3xl border border-pink-200 bg-gradient-to-br from-pink-100 via-white to-rose-50 p-6 shadow-[0_25px_60px_-40px_rgba(15,23,42,0.7)] transition hover:-translate-y-1 hover:shadow-[0_35px_80px_-45px_rgba(15,23,42,0.7)]"
              >
                <div className="absolute top-5 right-5 text-xs uppercase tracking-[0.35em] text-pink-400">Book</div>
                <div className="flex h-20 w-28 items-center justify-center rounded-2xl bg-white/90 text-5xl font-semibold text-pink-700 shadow-inner">
                  {vowel}
                </div>
                <div className="text-sm font-semibold text-stone-700">Letter {vowel} book</div>
                <div className="text-xs uppercase tracking-[0.35em] text-pink-500">Open</div>
              </button>
            ))}
          </div>
        ) : (
          <div className="relative mx-auto w-full max-w-[980px]">
            {!started ? (
              <div className="relative aspect-[4/3] w-full rounded-[32px] bg-[#efe4d2] shadow-[0_40px_90px_-50px_rgba(15,23,42,0.7)] sm:aspect-[3/2]">
                <div className="absolute inset-3 rounded-[24px] border border-stone-200 bg-white/60 sm:inset-4 sm:rounded-[28px]" />
                <div className="absolute inset-5 sm:inset-8">
                  <div className="flex h-full w-full flex-col items-center justify-center gap-6 rounded-3xl bg-gradient-to-br from-rose-100 via-white to-amber-50 px-6 text-center shadow-inner">
                    {coverPage ? (
                      <>
                        <img
                          src={toImage(coverPage.word, selectedVowel)}
                          alt={coverPage.word}
                          className="h-56 w-56 object-contain sm:h-[20rem] sm:w-[20rem]"
                        />
                        <p className="text-2xl font-semibold text-stone-800">
                          {renderSentence(coverPage.sentence, coverPage.word)}
                        </p>
                      </>
                    ) : (
                      <>
                        <div className="text-3xl font-semibold text-stone-800">{COVER_TITLE}</div>
                        <div className="mt-2 text-lg uppercase tracking-[0.3em] text-stone-500">{COVER_SUBTITLE}</div>
                      </>
                    )}
                    <button
                      type="button"
                      onClick={() => setStarted(true)}
                      className="inline-flex items-center justify-center rounded-full border border-emerald-200 bg-emerald-50 px-10 py-4 text-sm uppercase tracking-[0.35em] text-emerald-700 shadow-sm transition hover:bg-emerald-100"
                    >
                      Start
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <>
                <div className="md:hidden">
                  <div className="rounded-[28px] bg-[#efe4d2] p-3 shadow-[0_30px_70px_-45px_rgba(15,23,42,0.7)]">
                    <div className="rounded-[24px] border border-stone-200 bg-white/80 p-4">
                      <div className="flex flex-col items-center gap-4 rounded-2xl bg-white/90 p-4 shadow-inner">
                        {page ? (
                          <>
                            <img
                              src={toImage(page.word, selectedVowel)}
                              alt={page.word}
                              className="h-56 w-56 object-contain"
                            />
                            <p
                              className={`font-semibold text-stone-800 text-center ${
                                isTyping ? "text-3xl" : "text-2xl"
                              }`}
                            >
                              <span
                                className={`inline-block transition-transform duration-300 ${
                                  isTyping ? "scale-[1.4]" : isShrinking ? "scale-100" : "scale-[1.15]"
                                }`}
                              >
                                {renderSentence(isTyping ? typedText : page.sentence, page.word)}
                              </span>
                            </p>
                          </>
                        ) : null}
                        <div className="mt-4 grid w-full grid-cols-1 gap-3">
                          <button
                            type="button"
                            onClick={() => page && handleSpeak(page.sentence)}
                            className="inline-flex items-center justify-center rounded-full border border-emerald-200 bg-emerald-50 px-5 py-3 text-xs uppercase tracking-[0.35em] text-emerald-700 shadow-sm"
                          >
                            🔊 Read To Me
                          </button>
                          <button
                            type="button"
                            onClick={handleMic}
                            className={`inline-flex items-center justify-center rounded-full border px-5 py-3 text-xs uppercase tracking-[0.35em] shadow-sm ${
                              listening
                                ? "border-rose-300 bg-rose-100 text-rose-700"
                                : "border-sky-200 bg-sky-50 text-sky-700"
                            }`}
                          >
                            🎤 {listening ? "Listening" : "Let Me Speak!"}
                          </button>
                        </div>
                        {transcript ? (
                          <div className="rounded-2xl border border-stone-200 bg-stone-50 p-3 text-sm text-stone-600">
                            You said: <span className="font-semibold text-stone-800">{transcript}</span>
                          </div>
                        ) : null}
                        <div className="text-[10px] uppercase tracking-[0.35em] text-stone-400">
                          Page {pageIndex + 1} of {totalPages}
                        </div>
                        {success ? (
                          <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-emerald-500/25">
                            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/90 text-3xl text-emerald-600 shadow-lg">
                              ✓
                            </div>
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="hidden md:block">
                  <div className="relative mx-auto w-full" style={{ perspective: "1800px" }}>
                    <div className="relative aspect-[3/2] w-full rounded-[32px] bg-[#efe4d2] shadow-[0_40px_90px_-50px_rgba(15,23,42,0.7)]">
                      <div className="absolute inset-y-0 left-1/2 w-[2px] -translate-x-1/2 bg-stone-200/70" />
                      <div className="absolute inset-y-4 left-4 right-4 rounded-[28px] border border-stone-200 bg-white/60" />

                      <div className="absolute inset-y-0 left-0 w-1/2 p-8">
                        <div className="flex h-full flex-col items-center justify-center gap-4">
                          {page ? (
                            <div className="flex h-full w-full flex-col items-center justify-center gap-4 rounded-3xl bg-white/90 p-6 shadow-inner">
                              <img
                                src={toImage(page.word, selectedVowel)}
                                alt={page.word}
                                className="h-[22.75rem] w-[22.75rem] object-contain"
                              />
                            </div>
                          ) : null}
                        </div>
                      </div>

                      <div
                        className="absolute inset-y-0 right-0 w-1/2 origin-left transition-transform duration-700"
                        style={{ transformStyle: "preserve-3d", transform: rightPageTransform }}
                      >
                        <div className="absolute inset-0 p-8" style={{ backfaceVisibility: "hidden" }}>
                          <div className="relative flex h-full w-full flex-col rounded-3xl bg-white/95 p-6 shadow-inner">
                            <div className="flex flex-1 items-center justify-center text-center">
                              <p
                              className={`font-semibold text-stone-800 ${
                                isTyping ? "text-3xl" : "text-2xl"
                              }`}
                              >
                                <span
                                  className={`inline-block transition-transform duration-300 ${
                                    isTyping ? "scale-[1.4]" : isShrinking ? "scale-100" : "scale-[1.15]"
                                  }`}
                                >
                                  {page ? renderSentence(isTyping ? typedText : page.sentence, page.word) : null}
                                </span>
                              </p>
                            </div>
                            <div className="flex items-center justify-center gap-3 pb-8">
                              <button
                                type="button"
                                onClick={() => page && handleSpeak(page.sentence)}
                                className="inline-flex items-center justify-center rounded-full border border-emerald-200 bg-emerald-50 px-5 py-2 text-xs uppercase tracking-[0.35em] text-emerald-700 shadow-sm transition hover:bg-emerald-100"
                              >
                                🔊 Read To Me
                              </button>
                              <button
                                type="button"
                                onClick={handleMic}
                                className={`inline-flex items-center justify-center rounded-full border px-5 py-2 text-xs uppercase tracking-[0.35em] shadow-sm transition ${
                                  listening
                                    ? "border-rose-300 bg-rose-100 text-rose-700"
                                    : "border-sky-200 bg-sky-50 text-sky-700 hover:bg-sky-100"
                                }`}
                              >
                                🎤 {listening ? "Listening" : "Let Me Speak!"}
                              </button>
                            </div>
                            {transcript ? (
                              <div className="rounded-2xl border border-stone-200 bg-stone-50 p-3 text-sm text-stone-600">
                                You said: <span className="font-semibold text-stone-800">{transcript}</span>
                              </div>
                            ) : null}
                            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 text-[10px] uppercase tracking-[0.35em] text-stone-400">
                              Page {pageIndex + 1} of {totalPages}
                            </div>
                            {success ? (
                              <div className="absolute inset-0 flex items-center justify-center rounded-3xl bg-emerald-500/25">
                                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white/90 text-4xl text-emerald-600 shadow-lg">
                                  ✓
                                </div>
                              </div>
                            ) : null}
                          </div>
                        </div>
                        <div
                          className="absolute inset-0 rounded-3xl bg-white/95"
                          style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {selectedVowel ? (
          <div className="flex flex-wrap items-center justify-center gap-4">
            <button
              type="button"
              onClick={() => goToPage("prev")}
              className="inline-flex items-center justify-center gap-2 rounded-full border border-rose-200 bg-rose-50 px-8 py-4 text-sm uppercase tracking-[0.4em] text-rose-700 shadow-sm transition hover:bg-rose-100 disabled:opacity-40"
              disabled={!started || pageIndex === 0}
            >
              ← Previous
            </button>
            <button
              type="button"
              onClick={() => goToPage("next")}
              className="inline-flex items-center justify-center gap-2 rounded-full border border-sky-200 bg-sky-50 px-8 py-4 text-sm uppercase tracking-[0.4em] text-sky-700 shadow-sm transition hover:bg-sky-100 disabled:opacity-40"
              disabled={!started || pageIndex >= totalPages - 1}
            >
              Next →
            </button>
          </div>
        ) : null}
      </main>
    </div>
  );
}
