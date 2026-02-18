"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import HomeLink from "../../../../components/HomeLink";

const BOOK_PAGES = [
  { word: "cat", sentence: "Can the cat nap on the mat?" },
  { word: "hat", sentence: "Take the hat, please." },
  { word: "rat", sentence: "The rat ran under the mat." },
  { word: "mat", sentence: "Put the mat on the car." },
  { word: "bat", sentence: "The bat can fly up." },
  { word: "cap", sentence: "Put the cap on me." },
  { word: "map", sentence: "Where is the map?" },
  { word: "nap", sentence: "I will nap now." },
  { word: "can", sentence: "Put it in the can." },
  { word: "tan", sentence: "Make it tan." },
  { word: "fan", sentence: "The fan came on." },
  { word: "pan", sentence: "Take the pan to me." },
  { word: "bed", sentence: "We can make the bed." },
  { word: "red", sentence: "Make it red." },
  { word: "web", sentence: "The bug went into the web." },
  { word: "peg", sentence: "Put one peg in." },
  { word: "leg", sentence: "My leg is in mud." },
  { word: "hen", sentence: "The hen ran away." },
  { word: "pen", sentence: "Make the pen red." },
  { word: "ten", sentence: "Put ten in the box." },
  { word: "jet", sentence: "The jet can fly over me." },
  { word: "net", sentence: "Put the net over it." },
  { word: "wet", sentence: "Get it wet." },
  { word: "wed", sentence: "I saw them wed." },
  { word: "bib", sentence: "Put the bib on the kid." },
  { word: "rib", sentence: "My rib is under my lip." },
  { word: "fig", sentence: "I can eat a fig." },
  { word: "pig", sentence: "The pig ran in mud." },
  { word: "fin", sentence: "Look at the fin." },
  { word: "pin", sentence: "Put the pin in the box." },
  { word: "lid", sentence: "Put the lid on the cup." },
  { word: "kid", sentence: "The kid can run and jump." },
  { word: "lip", sentence: "My lip is red." },
  { word: "hip", sentence: "My hip is under my rib." },
  { word: "tin", sentence: "Put the lid on the tin." },
  { word: "dig", sentence: "Dig in the mud, then stop." },
  { word: "dog", sentence: "The dog ran to the log." },
  { word: "log", sentence: "Put the log in the box." },
  { word: "cog", sentence: "Put the cog in the box." },
  { word: "rod", sentence: "Take the rod out." },
  { word: "sob", sentence: "Do not sob; I can help." },
  { word: "cob", sentence: "I ate the cob." },
  { word: "job", sentence: "They all have a job." },
  { word: "rob", sentence: "He will not rob." },
  { word: "top", sentence: "This top is brown." },
  { word: "pot", sentence: "Put the pot down." },
  { word: "fox", sentence: "The fox ran into the box." },
  { word: "box", sentence: "Can you open the box?" },
  { word: "bug", sentence: "The bug can fly away." },
  { word: "hug", sentence: "Come here and hug me." },
  { word: "rug", sentence: "Put the rug down, please." },
  { word: "cub", sentence: "The cub is little." },
  { word: "tub", sentence: "Put the pup in the tub." },
  { word: "mud", sentence: "We can dig in mud." },
  { word: "bud", sentence: "The bud will be big." },
  { word: "sun", sentence: "The sun is up." },
  { word: "bun", sentence: "I ate a bun." },
  { word: "pup", sentence: "The pup can run." },
  { word: "cup", sentence: "I want my cup, too." },
  { word: "bus", sentence: "We ride the bus." },
];

const COVER_TITLE = "Booklets Cartoon Images";
const COVER_SUBTITLE = "Phonics";
const BOOKLET_SPEED_OPTIONS = [
  { value: 0.9, label: "Normal" },
  { value: 0.8, label: "Slower" },
  { value: 0.7, label: "Slow" },
  { value: 0.6, label: "Turtle Speed" },
] as const;

const VOWEL_GROUPS = ["a", "e", "i", "o", "u"] as const;
type VowelGroup = typeof VOWEL_GROUPS[number];

const toBookletImage = (word: string) =>
  `/assets/language_arts/phonic_booklets/${word}____phonic_books.png`;

const toBookletLegacyImage = (word: string, vowel: VowelGroup) =>
  `/assets/language_arts/phonic_booklets/${vowel}-picture-${word}.png`;

const toFallbackImage = (word: string, vowel: VowelGroup) =>
  `/assets/language_arts/moveable_alphabet/phonic_pictures/${vowel}-picture-${word}.png`;

function ReadingBookImage({
  word,
  vowel,
  alt,
  className,
}: {
  word: string;
  vowel: VowelGroup;
  alt: string;
  className: string;
}) {
  const sources = useMemo(
    () => [toBookletImage(word), toBookletLegacyImage(word, vowel), toFallbackImage(word, vowel)],
    [word, vowel]
  );
  const [sourceIndex, setSourceIndex] = useState(0);

  useEffect(() => {
    setSourceIndex(0);
  }, [word, vowel]);

  return (
    <img
      src={sources[sourceIndex] ?? sources[sources.length - 1]}
      alt={alt}
      className={className}
      onError={() => {
        setSourceIndex((current) => Math.min(current + 1, sources.length - 1));
      }}
    />
  );
}

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
  const router = useRouter();
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
  const [holdLargeAfterTyping, setHoldLargeAfterTyping] = useState(false);
  const [playbackRate, setPlaybackRate] = useState<number>(0.9);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const settingsRef = useRef<HTMLDivElement | null>(null);

  const pagesForVowel = useMemo(() => {
    if (!selectedVowel) return [];
    return BOOK_PAGES.filter((item) => wordVowel(item.word) === selectedVowel);
  }, [selectedVowel]);

  const page = pagesForVowel[pageIndex];
  const coverPage = pagesForVowel[0];

  const totalPages = pagesForVowel.length;

  useEffect(() => {
    if (typeof window === "undefined") return;
    const saved = Number(window.localStorage.getItem("phonic-booklets-playback-rate"));
    if (!Number.isFinite(saved)) return;
    const allowed = BOOKLET_SPEED_OPTIONS.some((option) => option.value === saved);
    if (allowed) {
      setPlaybackRate(saved);
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem("phonic-booklets-playback-rate", String(playbackRate));
  }, [playbackRate]);

  useEffect(() => {
    if (!settingsOpen) return;
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node | null;
      if (!settingsRef.current || !target) return;
      if (!settingsRef.current.contains(target)) {
        setSettingsOpen(false);
      }
    };
    window.addEventListener("pointerdown", onPointerDown);
    return () => {
      window.removeEventListener("pointerdown", onPointerDown);
    };
  }, [settingsOpen]);

  const stopBookletAudio = useCallback(() => {
    if (!audioRef.current) return;
    audioRef.current.pause();
    audioRef.current.currentTime = 0;
    audioRef.current = null;
  }, []);

  const playBookletAudio = useCallback((word: string, fallbackText: string) => {
    if (typeof window === "undefined") return;
    stopBookletAudio();
    window.speechSynthesis?.cancel();

    const sources = [
      `/audio/phonic_booklets_audio/${word}____phonic_books.m4a`,
      `/audio/phonic_booklets_audio/${word}____phonic_books.mp3`,
    ];

    let sourceIndex = 0;
    const tryPlay = () => {
      const source = sources[sourceIndex];
      if (!source) {
        const utterance = new SpeechSynthesisUtterance(fallbackText);
        utterance.rate = playbackRate;
        window.speechSynthesis?.speak(utterance);
        return;
      }

      const audio = new Audio(source);
      audioRef.current = audio;
      audio.preload = "auto";
      audio.playbackRate = playbackRate;
      audio.onended = () => {
        if (audioRef.current === audio) {
          audioRef.current = null;
        }
      };
      audio.onerror = () => {
        if (audioRef.current === audio) {
          audioRef.current = null;
        }
        sourceIndex += 1;
        tryPlay();
      };
      audio.play().catch(() => {
        sourceIndex += 1;
        tryPlay();
      });
    };

    tryPlay();
  }, [playbackRate, stopBookletAudio]);

  const normalizeText = useCallback((value: string) => {
    return value
      .toLowerCase()
      .replace(/[^a-z\s]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }, []);

  const isTranscriptCorrect = useCallback(
    (spoken: string, expected: string) => {
      const normalizedSpoken = normalizeText(spoken);
      const normalizedExpected = normalizeText(expected);
      if (!normalizedSpoken || !normalizedExpected) return false;
      if (normalizedSpoken.includes(normalizedExpected)) return true;

      const spokenWordsArray = normalizedSpoken.split(" ").filter(Boolean);
      const expectedWords = normalizedExpected.split(" ").filter(Boolean);
      if (!expectedWords.length) return false;

      const spokenWords = new Set(spokenWordsArray);
      const matched = expectedWords.filter((word) => spokenWords.has(word)).length;
      const overlap = matched / expectedWords.length;

      // Be tolerant for speech-to-text variance on short children's sentences.
      if (overlap >= 0.7) return true;
      if (expectedWords.length >= 6 && overlap >= 0.6) return true;

      return false;
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
    setSuccess(false);
    setTranscript("");
    setListening(true);
    recognitionRef.current.start();
  }, [listening, page, setupRecognition]);

  useEffect(() => {
    sentenceRef.current = page?.sentence ?? "";
  }, [page]);

  useEffect(() => {
    return () => {
      stopBookletAudio();
      if (typeof window !== "undefined") {
        window.speechSynthesis?.cancel();
      }
    };
  }, [stopBookletAudio]);

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
        setHoldLargeAfterTyping(true);
        typingTimerRef.current = window.setTimeout(() => {
          setHoldLargeAfterTyping(false);
        }, 1500);
      }
    };
    setTypedText("");
    setIsTyping(true);
    setHoldLargeAfterTyping(false);
    typingTimerRef.current = window.setTimeout(tick, 400);
    return () => {
      if (typingTimerRef.current !== null) {
        window.clearTimeout(typingTimerRef.current);
        typingTimerRef.current = null;
      }
      setIsTyping(false);
      setHoldLargeAfterTyping(false);
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
  const isLargeTypedText = isTyping || holdLargeAfterTyping;

  const handleBookHome = useCallback(() => {
    const hasActiveBookState = Boolean(
      selectedVowel || started || pageIndex > 0 || transcript || listening || success
    );

    if (!hasActiveBookState) {
      router.replace("/lessons/language-arts/phonics");
      return;
    }

    try {
      recognitionRef.current?.stop();
    } catch {
      // Ignore browser recognition stop errors.
    }
    stopBookletAudio();
    if (typeof window !== "undefined") {
      window.speechSynthesis?.cancel();
    }
    setListening(false);
    setTranscript("");
    setSuccess(false);
    setStarted(false);
    setPageIndex(0);
    setSelectedVowel(null);
  }, [listening, pageIndex, router, selectedVowel, started, stopBookletAudio, success, transcript]);

  return (
    <div className="relative min-h-screen bg-[radial-gradient(circle_at_top,#f5efe6,#fdfbf8_55%,#f7efe4)]">
      <HomeLink onClick={handleBookHome} />
      <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-10 px-6 py-10">
        <header className="space-y-3 text-center md:space-y-3">
          <p className="hidden text-xs uppercase tracking-[0.35em] text-stone-400 md:block">Language Arts · Phonics</p>
          <h1 className="hidden font-display text-4xl font-semibold text-stone-900 md:block">Booklets Cartoon Images</h1>
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
                        <ReadingBookImage
                          word={coverPage.word}
                          vowel={selectedVowel}
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
                            <ReadingBookImage
                              word={page.word}
                              vowel={selectedVowel}
                              alt={page.word}
                              className="h-56 w-56 object-contain"
                            />
                            <p
                              className={`font-semibold text-stone-800 text-center ${
                                isLargeTypedText ? "text-3xl" : "text-2xl"
                              }`}
                            >
                              <span
                                className={`inline-block transition-transform duration-300 ${
                                  isLargeTypedText ? "scale-[1.4]" : "scale-100"
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
                            onClick={() => page && playBookletAudio(page.word, page.sentence)}
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
                              <ReadingBookImage
                                word={page.word}
                                vowel={selectedVowel}
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
                                isLargeTypedText ? "text-3xl" : "text-2xl"
                              }`}
                              >
                                <span
                                  className={`inline-block transition-transform duration-300 ${
                                    isLargeTypedText ? "scale-[1.4]" : "scale-100"
                                  }`}
                                >
                                  {page ? renderSentence(isTyping ? typedText : page.sentence, page.word) : null}
                                </span>
                              </p>
                            </div>
                            <div className="flex items-center justify-center gap-3 pb-8">
                              <button
                                type="button"
                                onClick={() => page && playBookletAudio(page.word, page.sentence)}
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

            <div ref={settingsRef} className="absolute right-3 bottom-3 z-40">
              <button
                type="button"
                onClick={() => setSettingsOpen((open) => !open)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-stone-300 bg-white/95 text-stone-700 shadow-lg backdrop-blur-sm transition hover:bg-white"
                aria-label="Reading speed settings"
              >
                <svg
                  viewBox="0 0 24 24"
                  className="h-5 w-5 fill-none stroke-current"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="3" />
                  <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33h.01A1.65 1.65 0 0 0 10.58 3V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51h.01a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82v.01a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z" />
                </svg>
              </button>

              {settingsOpen ? (
                <div className="absolute right-0 bottom-12 w-52 rounded-2xl border border-stone-200 bg-white/95 p-2 shadow-xl backdrop-blur-sm">
                  <p className="px-2 py-1 text-[10px] uppercase tracking-[0.25em] text-stone-500">
                    Reading Speed
                  </p>
                  <div className="mt-1 space-y-1">
                    {BOOKLET_SPEED_OPTIONS.map((option) => {
                      const active = playbackRate === option.value;
                      return (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => {
                            setPlaybackRate(option.value);
                            setSettingsOpen(false);
                          }}
                          className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-sm transition ${
                            active
                              ? "bg-sky-100 text-sky-800"
                              : "text-stone-700 hover:bg-stone-100"
                          }`}
                        >
                          <span>{option.label}</span>
                          <span className="font-semibold">{option.value.toFixed(1)}x</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        )}

        {selectedVowel ? (
          <div className="flex flex-wrap items-center justify-center gap-4">
            <button
              type="button"
              onClick={() => goToPage("prev")}
              className="inline-flex items-center justify-center gap-2 rounded-full border border-rose-200 bg-rose-50 px-8 py-4 text-sm uppercase tracking-[0.4em] text-rose-700 shadow-sm transition hover:bg-rose-100 disabled:opacity-40"
              disabled={!started || isTyping || pageIndex === 0}
            >
              ← Previous
            </button>
            <button
              type="button"
              onClick={() => goToPage("next")}
              className="inline-flex items-center justify-center gap-2 rounded-full border border-sky-200 bg-sky-50 px-8 py-4 text-sm uppercase tracking-[0.4em] text-sky-700 shadow-sm transition hover:bg-sky-100 disabled:opacity-40"
              disabled={!started || isTyping || pageIndex >= totalPages - 1}
            >
              Next →
            </button>
          </div>
        ) : null}
      </main>
    </div>
  );
}
