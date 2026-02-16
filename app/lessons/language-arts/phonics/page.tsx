"use client";

import Link from "next/link";
import HomeLink from "../../../components/HomeLink";

type PreviewImage = {
  src: string;
  alt: string;
};

function ImageGridPreview({
  images,
  className,
}: {
  images: PreviewImage[];
  className?: string;
}) {
  return (
    <div
      className={`grid h-24 grid-cols-3 gap-2 rounded-2xl border border-white/70 bg-white/70 p-2 shadow-inner ${className ?? ""}`}
    >
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

export default function PhonicsHub() {
  const moveableAlphabetImages: PreviewImage[] = [
    { src: "/assets/language_arts/moveable_alphabet/images/a---cat___moveable_phonics.png", alt: "cat" },
    { src: "/assets/language_arts/moveable_alphabet/images/a---bat___moveable_phonics.png", alt: "bat" },
    { src: "/assets/language_arts/moveable_alphabet/images/a---hat___moveable_phonics.png", alt: "hat" },
  ];

  const phonicLabelImages: PreviewImage[] = [
    { src: "/assets/language_arts/moveable_alphabet/images/o---cob___moveable_phonics.png", alt: "cob" },
    { src: "/assets/language_arts/moveable_alphabet/images/o---fox___moveable_phonics.png", alt: "fox" },
    { src: "/assets/language_arts/moveable_alphabet/images/o---top___moveable_phonics.png", alt: "top" },
  ];

  const threePartCardImages: PreviewImage[] = [
    { src: "/assets/language_arts/moveable_alphabet/Phonic_picture_cards/a-tcp-bat.png", alt: "bat" },
    { src: "/assets/language_arts/moveable_alphabet/Phonic_picture_cards/a-tcp-cat.png", alt: "cat" },
    { src: "/assets/language_arts/moveable_alphabet/Phonic_picture_cards/a-tcp-hat.png", alt: "hat" },
  ];
  const threePartLabelImages: PreviewImage[] = [
    { src: "/assets/language_arts/moveable_alphabet/phonic_labels/a-bat-label.png", alt: "bat label" },
    { src: "/assets/language_arts/moveable_alphabet/phonic_labels/a-cat-label.png", alt: "cat label" },
    { src: "/assets/language_arts/moveable_alphabet/phonic_labels/a-hat-label.png", alt: "hat label" },
  ];
  const readingBookImages: PreviewImage[] = [
    { src: "/assets/language_arts/moveable_alphabet/phonic_pictures/a-picture-cat.png", alt: "cat" },
    { src: "/assets/language_arts/moveable_alphabet/phonic_pictures/a-picture-hat.png", alt: "hat" },
    { src: "/assets/language_arts/moveable_alphabet/phonic_pictures/a-picture-rat.png", alt: "rat" },
  ];

  return (
    <div className="relative min-h-screen bg-[radial-gradient(circle_at_top,#f5efe6,#fdfbf8_55%,#f7efe4)]">
      <HomeLink />
      <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-8 px-6 py-10">
        <header className="space-y-3 text-center">
          <p className="text-xs uppercase tracking-[0.35em] text-stone-400">Language Arts · Phonics</p>
          <h1 className="font-display text-4xl font-semibold text-stone-900">Phonics</h1>
          <p className="text-sm text-stone-600">Choose a phonics material to continue.</p>
        </header>
        <div className="grid gap-6 md:grid-cols-2">
          <Link
            href="/lessons/language-arts/moveable-alphabet"
            className="group flex h-56 flex-col justify-between rounded-3xl border border-pink-200 bg-gradient-to-br from-pink-100 via-white to-rose-50 p-6 shadow-[0_30px_60px_-40px_rgba(15,23,42,0.8)] transition hover:-translate-y-0.5 hover:shadow-[0_40px_90px_-50px_rgba(15,23,42,0.7)]"
          >
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-2xl border border-pink-300 bg-pink-100 text-xl font-semibold text-pink-700">✦</span>
              <h2 className="font-display text-2xl font-semibold text-stone-900">
                Phonic Picture Cards and Moveable Alphabet
              </h2>
            </div>
            <ImageGridPreview images={moveableAlphabetImages} className="bg-pink-50/70" />
            <p className="text-xs uppercase tracking-[0.35em] text-pink-700">Vowel groups · drag & drop</p>
          </Link>
          <Link
            href="/lessons/language-arts/phonic-labels"
            className="group flex h-56 flex-col justify-between rounded-3xl border border-pink-200 bg-gradient-to-br from-pink-100 via-white to-rose-50 p-6 shadow-[0_30px_60px_-40px_rgba(15,23,42,0.8)] transition hover:-translate-y-0.5 hover:shadow-[0_40px_90px_-50px_rgba(15,23,42,0.7)]"
          >
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-2xl border border-pink-300 bg-pink-100 text-xl font-semibold text-pink-700">✦</span>
              <h2 className="font-display text-2xl font-semibold text-stone-900">
                Phonic Picture Cards with Word Labels
              </h2>
            </div>
            <ImageGridPreview images={phonicLabelImages} className="bg-pink-50/70" />
            <p className="text-xs uppercase tracking-[0.35em] text-pink-700">Match labels to pictures</p>
          </Link>
          <Link
            href="/lessons/language-arts/phonic-three-part-cards"
            className="group flex h-56 flex-col justify-between rounded-3xl border border-pink-200 bg-gradient-to-br from-pink-100 via-white to-rose-50 p-6 shadow-[0_30px_60px_-40px_rgba(15,23,42,0.8)] transition hover:-translate-y-0.5 hover:shadow-[0_40px_90px_-50px_rgba(15,23,42,0.7)]"
          >
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-2xl border border-pink-300 bg-pink-100 text-xl font-semibold text-pink-700">✦</span>
              <h2 className="font-display text-2xl font-semibold text-stone-900">Phonic three-Part Cards Pictures</h2>
            </div>
            <ImageGridPreview images={threePartCardImages} className="bg-pink-50/70" />
            <p className="text-xs uppercase tracking-[0.35em] text-pink-700">Match pictures to cards</p>
          </Link>
          <Link
            href="/lessons/language-arts/phonic-three-part-cards-labels"
            className="group flex h-56 flex-col justify-between rounded-3xl border border-pink-200 bg-gradient-to-br from-pink-100 via-white to-rose-50 p-6 shadow-[0_30px_60px_-40px_rgba(15,23,42,0.8)] transition hover:-translate-y-0.5 hover:shadow-[0_40px_90px_-50px_rgba(15,23,42,0.7)]"
          >
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-2xl border border-pink-300 bg-pink-100 text-xl font-semibold text-pink-700">✦</span>
              <h2 className="font-display text-2xl font-semibold text-stone-900">
                Phonic three-Part Cards Pictures &amp; Labels
              </h2>
            </div>
            <ImageGridPreview images={threePartLabelImages} className="bg-pink-50/70" />
            <p className="text-xs uppercase tracking-[0.35em] text-pink-700">Match labels to pictures</p>
          </Link>
          <Link
            href="/lessons/language-arts/phonics/reading-book"
            className="group flex h-56 flex-col justify-between rounded-3xl border border-pink-200 bg-gradient-to-br from-pink-100 via-white to-rose-50 p-6 shadow-[0_30px_60px_-40px_rgba(15,23,42,0.8)] transition hover:-translate-y-0.5 hover:shadow-[0_40px_90px_-50px_rgba(15,23,42,0.7)]"
          >
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-2xl border border-pink-300 bg-pink-100 text-xl font-semibold text-pink-700">✦</span>
              <h2 className="font-display text-2xl font-semibold text-stone-900">Phonic Reading Books</h2>
            </div>
            <ImageGridPreview images={readingBookImages} className="bg-pink-50/70" />
            <p className="text-xs uppercase tracking-[0.35em] text-pink-700">Read along with audio</p>
          </Link>
        </div>
      </main>
    </div>
  );
}
