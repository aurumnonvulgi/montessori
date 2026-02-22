"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
} from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import HomeLink from "../components/HomeLink";
import { armOurPlaceGate } from "../lib/hiddenRouteGate";

type Block = {
  kind: "title" | "heading" | "paragraph" | "bullet" | "signature";
  text: string;
};

type LoveLetterId = "l" | "o" | "v" | "e";

type LoveLetterState = {
  id: LoveLetterId;
  src: string;
  x: number;
  y: number;
  dropDelayMs: number;
  dropX: number;
};

type DragState = {
  id: LoveLetterId;
  pointerId: number;
  startX: number;
  startY: number;
  originX: number;
  originY: number;
};

const ABOUT_BLOCKS: Block[] = [
  {
    kind: "title",
    text: "About Montessori Digital Studio",
  },
  {
    kind: "paragraph",
    text: "Montessori Digital Studio was built to protect what makes Montessori work, clarity, purpose, and the child's independence, while using modern tools to approach education through devices in a Montessori way.",
  },
  {
    kind: "paragraph",
    text: "I'm Erik Nuno, and for 14 years I led Montessori Research and Development, guiding the redesign of existing materials and the creation of new ones across Infant and Toddler, Early Childhood, and Elementary. In addition to leading research and redesigning materials, I was responsible for researching and synthesizing the work of dozens of leading Montessori professionals, and for participating in cross disciplinary conversations with scientists, artists, and writers, with one goal, make materials more precise, more beautiful, and more faithful to how children learn.",
  },
  {
    kind: "paragraph",
    text: "I also worked closely with MTEC SF Bay Area Montessori Training Center, which allowed me to gain experience supporting international students and understanding the challenges they face when absorbing large amounts of Montessori vocabulary, names, and concepts in a short period of time. That experience shaped how I think about clarity, sequence, and how materials can support both the adult learner and the child.",
  },
  {
    kind: "paragraph",
    text: "Through that work, I helped shape decisions grounded in core Montessori principles, including:",
  },
  {
    kind: "bullet",
    text: "Isolation of difficulty so each material teaches one key concept at a time",
  },
  {
    kind: "bullet",
    text: "Control of error so the child can self correct without adult dependence",
  },
  {
    kind: "bullet",
    text: "Repetition as the pathway to mastery, supported by materials that invite return",
  },
  {
    kind: "bullet",
    text: "Order and sequence that protect the child's ability to build knowledge step by step",
  },
  {
    kind: "bullet",
    text: "Purposeful movement and hands on intelligence, where thinking and doing work together",
  },
  {
    kind: "bullet",
    text: "Minimal adult interference, where the guide supports rather than performs",
  },
  {
    kind: "bullet",
    text: "Concentration as a developmental achievement, not something manufactured through entertainment",
  },
  {
    kind: "paragraph",
    text: "I also presented our work at more than 12 national AMS conferences, demonstrating materials, lessons, and implementation strategies to educators across the country.",
  },
  {
    kind: "heading",
    text: "A Digital Platform That Keeps the Child at the Center",
  },
  {
    kind: "paragraph",
    text: "After years of studying both Montessori materials and the modern reality of children and devices, I became convinced that most educational apps pull the child away from real learning. They rely on constant rewards, busy visuals, and shallow stimulation, training the child to chase feedback instead of building focus.",
  },
  {
    kind: "paragraph",
    text: "Montessori Digital Studio is designed to take a different approach.",
  },
  {
    kind: "paragraph",
    text: "In this platform, the child remains the orchestrator. The device is not the teacher, and it is not the entertainer. It is simply a tool, one that helps children and adults:",
  },
  {
    kind: "bullet",
    text: "Understand the mechanics of each material",
  },
  {
    kind: "bullet",
    text: "Learn the protocols and lesson flow with integrity",
  },
  {
    kind: "bullet",
    text: "See the purpose behind each presentation",
  },
  {
    kind: "bullet",
    text: "Build familiarity that supports physical interaction with real materials",
  },
  {
    kind: "heading",
    text: "Calm Design, Objective Graphics, Real Montessori Function",
  },
  {
    kind: "paragraph",
    text: "Montessori Digital Studio uses clean, objective visuals, not flashy animations and not dopamine driven rewards. The experience avoids reward loops and entertainment cues, so attention stays on the material, the sequence, and the work itself.",
  },
  {
    kind: "paragraph",
    text: "We stay loyal to Montessori not just in content, but in structure:",
  },
  {
    kind: "bullet",
    text: "Clear sequences and levels",
  },
  {
    kind: "bullet",
    text: "Simple layouts that support order",
  },
  {
    kind: "bullet",
    text: "Progress tracking that reflects repetition, mastery, and independence",
  },
  {
    kind: "bullet",
    text: "A respectful tone that supports the child's natural motivation",
  },
  {
    kind: "heading",
    text: "Why Montessori Digital Studio",
  },
  {
    kind: "paragraph",
    text: "Montessori Digital Studio exists to help families and educators experience Montessori materials from a different perspective, while keeping the work rooted in the Montessori method and the child's true work. It is not a replacement for traditional, hands on Montessori materials. The sensorial impact of wood, weight, texture, movement, and real world control of error cannot be replicated on a screen, and we do not try to. Instead, Montessori Digital Studio is a supporting tool that uses a device responsibly, to offer access to parts of Montessori that can be shared digitally, the structure, the sequences, the basic mechanics, and the presentation protocols that guide how the child meets the material.",
  },
  {
    kind: "paragraph",
    text: "The child remains the center and the device stays in a supporting role. There are no reward loops, distracting animations, or entertainment driven cues. The graphics remain clean and objective, so attention can stay on the material and the steps, not on the screen itself. Our intention is simple, to help adults and children engage with Montessori in a way that respects the prepared environment and supports the transition back to real materials, where the full sensorial experience and the child's inner construction belong.",
  },
  {
    kind: "signature",
    text: "Created by Erik Nuno",
  },
];

const LOVE_LETTER_BASE =
  "/assets/language_arts/consonant_blend/consonant_blend_moveable_alphabet/moveable_alphabet_letter_png_red";

const LOVE_LETTERS_INITIAL: LoveLetterState[] = [
  { id: "l", src: `${LOVE_LETTER_BASE}/l_moveable_alphabet_red.png`, x: 0, y: -3, dropDelayMs: 30, dropX: -16 },
  { id: "o", src: `${LOVE_LETTER_BASE}/o_moveable_alphabet_red.png`, x: 50, y: -3, dropDelayMs: 180, dropX: -6 },
  { id: "v", src: `${LOVE_LETTER_BASE}/v_moveable_alphabet_red.png`, x: 100, y: -3, dropDelayMs: 330, dropX: 6 },
  { id: "e", src: `${LOVE_LETTER_BASE}/e_moveable_alphabet_red.png`, x: 150, y: -3, dropDelayMs: 480, dropX: 16 },
];

const fractional = (value: number) => value - Math.floor(value);

const pseudoRandom = (index: number, seed: number) => {
  const raw = Math.sin((index + 1) * (seed + 3) * 12.9898) * 43758.5453;
  return fractional(raw);
};

function AnimatedText({ text, startIndex }: { text: string; startIndex: number }) {
  return (
    <>
      {text.split("").map((character, index) => {
        const globalIndex = startIndex + index;
        const fromX = (pseudoRandom(globalIndex, 11) * 260 - 130).toFixed(2);
        const fromY = (pseudoRandom(globalIndex, 23) * 280 - 140).toFixed(2);
        const rotate = (pseudoRandom(globalIndex, 37) * 1080 - 540).toFixed(2);
        const delay = Math.round(globalIndex * 6 + pseudoRandom(globalIndex, 41) * 900);
        const duration = Math.round(1300 + pseudoRandom(globalIndex, 53) * 800);

        return (
          <span
            key={`${startIndex}-${index}-${character}`}
            className="about-char"
            style={
              {
                "--from-x": `${fromX}vw`,
                "--from-y": `${fromY}vh`,
                "--from-r": `${rotate}deg`,
                "--char-delay": `${delay}ms`,
                "--char-duration": `${duration}ms`,
              } as CSSProperties
            }
          >
            {character}
          </span>
        );
      })}
    </>
  );
}

export default function AboutUsPage() {
  const router = useRouter();
  const [loveActivated, setLoveActivated] = useState(false);
  const [loveLetters, setLoveLetters] = useState<LoveLetterState[]>(LOVE_LETTERS_INITIAL);
  const dragStateRef = useRef<DragState | null>(null);
  const loveWordRef = useRef<HTMLSpanElement | null>(null);
  const whyHeadingRef = useRef<HTMLHeadingElement | null>(null);
  const secretUnlockedRef = useRef(false);

  useEffect(() => {
    const checkBottomReached = () => {
      const scrollHeight = document.documentElement.scrollHeight;
      const currentBottom = window.scrollY + window.innerHeight;
      const remaining = scrollHeight - currentBottom;
      if (remaining <= 6) {
        setLoveActivated(true);
      }
    };

    checkBottomReached();
    window.addEventListener("scroll", checkBottomReached, { passive: true });
    window.addEventListener("resize", checkBottomReached);
    return () => {
      window.removeEventListener("scroll", checkBottomReached);
      window.removeEventListener("resize", checkBottomReached);
    };
  }, []);

  const tryUnlockOurPlace = useCallback(() => {
    if (!loveActivated || secretUnlockedRef.current) return;
    const eLetter = loveLetters.find((entry) => entry.id === "e");
    if (!eLetter || !loveWordRef.current || !whyHeadingRef.current) return;
    const wCharacter = whyHeadingRef.current.querySelector(".about-char") as HTMLElement | null;
    if (!wCharacter) return;

    const loveWordRect = loveWordRef.current.getBoundingClientRect();
    const eCenterX = loveWordRect.left + eLetter.x + 25;
    const eCenterY = loveWordRect.top + eLetter.y + 25;
    const wRect = wCharacter.getBoundingClientRect();
    const isUnderWHorizontally = eCenterX >= wRect.left - 6 && eCenterX <= wRect.right + 6;
    const isUnderWVertically = eCenterY >= wRect.bottom - 8 && eCenterY <= wRect.bottom + 120;

    if (isUnderWHorizontally && isUnderWVertically) {
      secretUnlockedRef.current = true;
      armOurPlaceGate();
      router.push("/about-us/this-is-our-place");
    }
  }, [loveActivated, loveLetters, router]);

  const handleLetterPointerDown = (id: LoveLetterId, event: ReactPointerEvent<HTMLButtonElement>) => {
    const letter = loveLetters.find((entry) => entry.id === id);
    if (!letter) return;
    event.preventDefault();
    event.stopPropagation();
    event.currentTarget.setPointerCapture(event.pointerId);
    dragStateRef.current = {
      id,
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      originX: letter.x,
      originY: letter.y,
    };
  };

  const handleLetterPointerMove = (id: LoveLetterId, event: ReactPointerEvent<HTMLButtonElement>) => {
    const dragState = dragStateRef.current;
    if (!dragState || dragState.id !== id || dragState.pointerId !== event.pointerId) return;
    const nextX = dragState.originX + (event.clientX - dragState.startX);
    const nextY = dragState.originY + (event.clientY - dragState.startY);
    setLoveLetters((previous) =>
      previous.map((letter) =>
        letter.id === id
          ? {
              ...letter,
              x: nextX,
              y: nextY,
            }
          : letter,
      ),
    );
  };

  const handleLetterPointerEnd = (id: LoveLetterId, event: ReactPointerEvent<HTMLButtonElement>) => {
    const dragState = dragStateRef.current;
    if (!dragState || dragState.id !== id || dragState.pointerId !== event.pointerId) return;
    dragStateRef.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    if (id === "e") {
      window.requestAnimationFrame(() => {
        tryUnlockOurPlace();
      });
    }
  };

  const blocks = ABOUT_BLOCKS.map((block, index) => ({
    ...block,
    offset: ABOUT_BLOCKS.slice(0, index).reduce((sum, item) => sum + item.text.length + 1, 0),
  }));
  const createdByBlock = blocks.find((block) => block.kind === "signature" && block.text === "Created by Erik Nuno");
  const createdByOffset = createdByBlock?.offset ?? 0;

  return (
    <div className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top,#e6f5ff_0%,#d8eeff_45%,#cce7ff_100%)]">
      <HomeLink />
      <main className="relative z-10 mx-auto w-full max-w-4xl px-6 pb-16 pt-24 sm:px-10">
        <section className="overflow-hidden rounded-[34px] border border-slate-300/90 bg-white/78 p-6 shadow-[0_28px_85px_-60px_rgba(15,23,42,0.66)] backdrop-blur-sm sm:p-8">
          <div className="space-y-5 text-slate-800">
            {blocks.map((block, index) => {
              const content = <AnimatedText text={block.text} startIndex={block.offset} />;

              if (block.kind === "title") {
                return (
                  <h1 key={`${block.kind}-${index}`} className="break-words font-display text-4xl font-semibold leading-tight text-cyan-900">
                    {content}
                  </h1>
                );
              }

              if (block.kind === "heading") {
                const isWhyHeading = block.text === "Why Montessori Digital Studio";
                return (
                  <h2
                    key={`${block.kind}-${index}`}
                    ref={isWhyHeading ? whyHeadingRef : undefined}
                    className="break-words pt-2 font-display text-3xl font-semibold leading-tight text-cyan-800"
                  >
                    {content}
                  </h2>
                );
              }

              if (block.kind === "bullet") {
                return (
                  <p key={`${block.kind}-${index}`} className="flex items-start gap-3 break-words text-base leading-relaxed text-slate-800">
                    <span className="mt-0.5 text-cyan-700">✓</span>
                    <span>{content}</span>
                  </p>
                );
              }

              if (block.kind === "signature") {
                if (block.text === "Created by Erik Nuno") {
                  return null;
                }
                return (
                  <p key={`${block.kind}-${index}`} className="break-words pt-2 text-xl font-semibold leading-tight text-cyan-900">
                    {content}
                  </p>
                );
              }

              return (
                <p key={`${block.kind}-${index}`} className="break-words text-base leading-relaxed text-slate-800">
                  {content}
                </p>
              );
            })}

            {loveActivated ? (
              <div className="mt-16 break-words text-cyan-900">
                <div className="flex flex-wrap items-end gap-1 text-2xl font-semibold leading-tight sm:text-3xl">
                  <span>Created with</span>
                  <span ref={loveWordRef} className="love-word" aria-label="love letters">
                    {loveLetters.map((letter) => (
                      <button
                        key={letter.id}
                        type="button"
                        className={`love-letter ${loveActivated ? "love-letter-drop" : ""}`}
                        style={
                          {
                            left: `${letter.x}px`,
                            top: `${letter.y}px`,
                            "--drop-delay": `${letter.dropDelayMs}ms`,
                            "--drop-x": `${letter.dropX}px`,
                          } as CSSProperties
                        }
                        onPointerDown={(event) => handleLetterPointerDown(letter.id, event)}
                        onPointerMove={(event) => handleLetterPointerMove(letter.id, event)}
                        onPointerUp={(event) => handleLetterPointerEnd(letter.id, event)}
                        onPointerCancel={(event) => handleLetterPointerEnd(letter.id, event)}
                        onLostPointerCapture={(event) => handleLetterPointerEnd(letter.id, event)}
                      >
                        <Image
                          src={letter.src}
                          alt={letter.id.toUpperCase()}
                          width={50}
                          height={50}
                          className="love-letter-img"
                          draggable={false}
                        />
                      </button>
                    ))}
                  </span>
                  <span>by Erik Nuno</span>
                </div>
              </div>
            ) : (
              <p className="break-words pt-2 text-xl font-semibold leading-tight text-cyan-900">
                <AnimatedText text="Created by Erik Nuno" startIndex={createdByOffset} />
              </p>
            )}
          </div>
        </section>
      </main>

      <style jsx>{`
        .love-word {
          position: relative;
          display: inline-block;
          width: 205px;
          height: 56px;
          margin: 0 2px;
          vertical-align: middle;
          line-height: 1;
          touch-action: none;
        }

        .love-letter {
          position: absolute;
          width: 50px;
          height: 50px;
          padding: 0;
          margin: 0;
          border: 0;
          background: transparent;
          cursor: grab;
          touch-action: none;
        }

        .love-letter:active {
          cursor: grabbing;
        }

        .love-letter-drop {
          animation: loveDrop 1.2s cubic-bezier(0.14, 0.84, 0.26, 1) both;
          animation-delay: var(--drop-delay);
        }

        .love-letter-img {
          width: 100%;
          height: 100%;
          object-fit: contain;
          user-select: none;
          pointer-events: none;
          filter: drop-shadow(0 8px 10px rgba(0, 0, 0, 0.2));
        }

        .about-char {
          display: inline-block;
          opacity: 0;
          transform: translate3d(var(--from-x), var(--from-y), 0) rotate(var(--from-r)) scale(0.7);
          filter: blur(3px);
          animation-name: letterFallIn;
          animation-duration: var(--char-duration);
          animation-delay: var(--char-delay);
          animation-timing-function: cubic-bezier(0.12, 0.9, 0.2, 1);
          animation-fill-mode: forwards;
          will-change: transform, opacity, filter;
        }

        @keyframes letterFallIn {
          0% {
            opacity: 0;
            transform: translate3d(var(--from-x), var(--from-y), 0) rotate(var(--from-r)) scale(0.7);
            filter: blur(3px);
          }
          72% {
            opacity: 1;
            transform: translate3d(0, 6px, 0) rotate(-1deg) scale(1.01);
            filter: blur(0);
          }
          100% {
            opacity: 1;
            transform: translate3d(0, 0, 0) rotate(0deg) scale(1);
            filter: blur(0);
          }
        }

        @keyframes loveDrop {
          0% {
            opacity: 0;
            transform: translate3d(var(--drop-x), -70vh, 0) scale(0.8) rotate(-9deg);
          }
          72% {
            opacity: 1;
            transform: translate3d(0, 10px, 0) scale(1.04) rotate(0deg);
          }
          100% {
            opacity: 1;
            transform: translate3d(0, 0, 0) scale(1) rotate(0deg);
          }
        }

      `}</style>
    </div>
  );
}
