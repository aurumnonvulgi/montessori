"use client";

import Link from "next/link";
import HomeLink from "../../../components/HomeLink";
import { MATERIAL_ACTIVITY_STYLES } from "../../../lib/materialActivityKinds";

type PreviewImage = {
  src: string;
  alt: string;
};

const PREVIEW_IMAGES: PreviewImage[] = [
  {
    src: "/assets/language_arts/consonant_blend/consonant_blend_picture_cards/bl-blab-1-blab____consonant_blends.png",
    alt: "blab",
  },
  {
    src: "/assets/language_arts/consonant_blend/consonant_blend_picture_cards/cl-clap-1-clap____consonant_blends.png",
    alt: "clap",
  },
  {
    src: "/assets/language_arts/consonant_blend/consonant_blend_picture_cards/dr-drab-1-drab____consonant_blends.png",
    alt: "drab",
  },
];

const ILLUSTRATED_PREVIEW_IMAGES: PreviewImage[] = [
  {
    src: "/assets/language_arts/consonant_blend/consonant_blend_picture_cards_drawings/bl-blab-1-blab____consonant_blends_illustrations.png",
    alt: "blab illustration",
  },
  {
    src: "/assets/language_arts/consonant_blend/consonant_blend_picture_cards_drawings/cl-clap-1-clap____consonant_blends_illustrations.png",
    alt: "clap illustration",
  },
  {
    src: "/assets/language_arts/consonant_blend/consonant_blend_picture_cards_drawings/dr-drab-1-drab____consonant_blends_illustrations.png",
    alt: "drab illustration",
  },
];

function ImageGridPreview({ images }: { images: PreviewImage[] }) {
  return (
    <div className="grid h-24 grid-cols-3 gap-2 rounded-2xl border border-white/70 bg-white/70 p-2 shadow-inner">
      {images.map((image, index) => (
        <div
          key={`${image.alt}-${index}`}
          className="flex items-center justify-center overflow-hidden rounded-xl border border-white/80 bg-white/90"
        >
          <img src={image.src} alt={image.alt} className="h-full w-full object-contain" />
        </div>
      ))}
    </div>
  );
}

export default function ConsonantBlendsHub() {
  const labelToPictureTag = MATERIAL_ACTIVITY_STYLES["tcp-label-to-picture"];
  const doubleAlphabetTag = MATERIAL_ACTIVITY_STYLES["moveable-alphabet"];
  const bookletTag = MATERIAL_ACTIVITY_STYLES.booklet;
  return (
    <div className="relative min-h-screen bg-[radial-gradient(circle_at_top,#eef6ff,#f9fcff_55%,#f3f8ff)]">
      <HomeLink />
      <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-8 px-6 py-10">
        <header className="space-y-3 text-center">
          <p className="text-xs uppercase tracking-[0.35em] text-stone-400">Language Arts · Consonant Blends | Blue Series</p>
          <h1 className="font-display text-4xl font-semibold text-stone-900">Consonant Blends | Blue Series</h1>
          <p className="text-sm text-stone-600">Choose a material to practice beginning blends.</p>
        </header>

        <section className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Link
            href="/lessons/language-arts/consonant-blends/double-alphabet"
            className="group flex min-h-56 flex-col justify-between rounded-3xl border border-sky-200 bg-gradient-to-br from-sky-100 via-white to-blue-50 p-6 shadow-[0_30px_60px_-40px_rgba(15,23,42,0.8)] transition hover:-translate-y-0.5 hover:shadow-[0_40px_90px_-50px_rgba(15,23,42,0.7)]"
          >
            <div className="flex items-start gap-3">
              <span className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-sky-300 bg-sky-100 text-xl font-semibold text-sky-700">
                ✦
              </span>
              <div className="min-w-0">
                <h2 className="font-display text-2xl font-semibold text-stone-900">Consonant Blend Picture Cards</h2>
                <span
                  className={`mt-2 inline-flex rounded-xl border px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] ${doubleAlphabetTag.className}`}
                >
                  Moveable Alphabet
                </span>
              </div>
            </div>
            <ImageGridPreview
              images={[
                {
                  src: "/assets/Boards/2_moveable_alphabets_board_5_letters_1_picture.svg",
                  alt: "Double alphabet board",
                },
                {
                  src: "/assets/language_arts/consonant_blend/consonant_blend_moveable_alphabet/moveable_alphabet_letter_png_red/a_moveable_alphabet_red.png",
                  alt: "Red letter a",
                },
                {
                  src: "/assets/language_arts/consonant_blend/consonant_blend_moveable_alphabet/moveable_alphabet_letter_png_black/a_moveable_alphabet_black.png",
                  alt: "Black letter a",
                },
              ]}
            />
            <p className="text-xs uppercase tracking-[0.28em] leading-relaxed text-sky-700">Build words with red blend letters and black endings</p>
          </Link>

          <Link
            href="/lessons/language-arts/consonant-blends/phonic-labels"
            className="group flex min-h-56 flex-col justify-between rounded-3xl border border-sky-200 bg-gradient-to-br from-sky-100 via-white to-blue-50 p-6 shadow-[0_30px_60px_-40px_rgba(15,23,42,0.8)] transition hover:-translate-y-0.5 hover:shadow-[0_40px_90px_-50px_rgba(15,23,42,0.7)]"
          >
            <div className="flex items-start gap-3">
              <span className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-sky-300 bg-sky-100 text-xl font-semibold text-sky-700">
                ✦
              </span>
              <div className="min-w-0">
                <h2 className="font-display text-2xl font-semibold text-stone-900">Consonant Blend Picture Cards</h2>
                <span
                  className={`mt-2 inline-flex rounded-xl border px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] ${labelToPictureTag.className}`}
                >
                  Label to Picture
                </span>
              </div>
            </div>
            <ImageGridPreview images={PREVIEW_IMAGES} />
            <p className="text-xs uppercase tracking-[0.28em] leading-relaxed text-sky-700">Match labels to the correct blend picture</p>
          </Link>

          <Link
            href="/lessons/language-arts/consonant-blends/double-alphabet-illustrated"
            className="group flex min-h-56 flex-col justify-between rounded-3xl border border-sky-200 bg-gradient-to-br from-sky-100 via-white to-blue-50 p-6 shadow-[0_30px_60px_-40px_rgba(15,23,42,0.8)] transition hover:-translate-y-0.5 hover:shadow-[0_40px_90px_-50px_rgba(15,23,42,0.7)]"
          >
            <div className="flex items-start gap-3">
              <span className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-sky-300 bg-sky-100 text-xl font-semibold text-sky-700">
                ✦
              </span>
              <div className="min-w-0">
                <h2 className="font-display text-2xl font-semibold text-stone-900">Consonant Blend Illustrated Cards</h2>
                <span
                  className={`mt-2 inline-flex rounded-xl border px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] ${doubleAlphabetTag.className}`}
                >
                  Moveable Alphabet
                </span>
              </div>
            </div>
            <ImageGridPreview
              images={[
                {
                  src: "/assets/Boards/2_moveable_alphabets_board_5_letters_1_picture.svg",
                  alt: "Double alphabet board",
                },
                {
                  src: "/assets/language_arts/consonant_blend/consonant_blend_picture_cards_drawings/bl-blob-2-blob____consonant_blends_illustrations.png",
                  alt: "blob illustration",
                },
                {
                  src: "/assets/language_arts/consonant_blend/consonant_blend_moveable_alphabet/moveable_alphabet_letter_png_red/b_moveable_alphabet_red.png",
                  alt: "Red letter b",
                },
              ]}
            />
            <p className="text-xs uppercase tracking-[0.28em] leading-relaxed text-sky-700">Build words from illustrated blend cards</p>
          </Link>

          <Link
            href="/lessons/language-arts/consonant-blends/phonic-labels-illustrated"
            className="group flex min-h-56 flex-col justify-between rounded-3xl border border-sky-200 bg-gradient-to-br from-sky-100 via-white to-blue-50 p-6 shadow-[0_30px_60px_-40px_rgba(15,23,42,0.8)] transition hover:-translate-y-0.5 hover:shadow-[0_40px_90px_-50px_rgba(15,23,42,0.7)]"
          >
            <div className="flex items-start gap-3">
              <span className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-sky-300 bg-sky-100 text-xl font-semibold text-sky-700">
                ✦
              </span>
              <div className="min-w-0">
                <h2 className="font-display text-2xl font-semibold text-stone-900">Consonant Blend Illustrated Cards</h2>
                <span
                  className={`mt-2 inline-flex rounded-xl border px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] ${labelToPictureTag.className}`}
                >
                  Label to Picture
                </span>
              </div>
            </div>
            <ImageGridPreview images={ILLUSTRATED_PREVIEW_IMAGES} />
            <p className="text-xs uppercase tracking-[0.28em] leading-relaxed text-sky-700">Match labels to the correct blend illustration</p>
          </Link>

          <Link
            href="/lessons/language-arts/consonant-blends/reading-book"
            className="group flex min-h-56 flex-col justify-between rounded-3xl border border-sky-200 bg-gradient-to-br from-sky-100 via-white to-blue-50 p-6 shadow-[0_30px_60px_-40px_rgba(15,23,42,0.8)] transition hover:-translate-y-0.5 hover:shadow-[0_40px_90px_-50px_rgba(15,23,42,0.7)]"
          >
            <div className="flex items-start gap-3">
              <span className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-sky-300 bg-sky-100 text-xl font-semibold text-sky-700">
                ✦
              </span>
              <div className="min-w-0">
                <h2 className="font-display text-2xl font-semibold text-stone-900">Consonant Blend Illustrated Cards</h2>
                <span
                  className={`mt-2 inline-flex rounded-xl border px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] ${bookletTag.className}`}
                >
                  {bookletTag.label}
                </span>
              </div>
            </div>
            <ImageGridPreview
              images={[
                {
                  src: "/assets/language_arts/consonant_blend/consonant_blend_picture_cards_drawings/br-brag-1-brag____consonant_blends_illustrations.png",
                  alt: "brag illustration",
                },
                {
                  src: "/assets/language_arts/consonant_blend/consonant_blend_picture_cards_drawings/fl-flip-3-flip____consonant_blends_illustrations.png",
                  alt: "flip illustration",
                },
                {
                  src: "/assets/language_arts/consonant_blend/consonant_blend_picture_cards_drawings/st-step-1-step____consonant_blends_illustrations.png",
                  alt: "step illustration",
                },
              ]}
            />
            <p className="text-xs uppercase tracking-[0.28em] leading-relaxed text-sky-700">Read blend books with illustrated pages</p>
          </Link>
        </section>
      </main>
    </div>
  );
}
