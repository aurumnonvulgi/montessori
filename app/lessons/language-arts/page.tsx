"use client";

import Link from "next/link";
import HomeLink from "../../components/HomeLink";

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

export default function LanguageArtsHub() {
  const initialSoundImages: PreviewImage[] = [
    {
      src: "/assets/language_arts/initial_sound/Initial Sound - A/a---apple___initial_sound-20260209_184849-1.png",
      alt: "apple",
    },
    {
      src: "/assets/language_arts/initial_sound/Initial Sound - A/a---ant___initial_sound-20260209_185104-1.png",
      alt: "ant",
    },
    {
      src: "/assets/language_arts/initial_sound/Initial Sound - A/a---alligator___initial_sound-20260209_185322-1.png",
      alt: "alligator",
    },
  ].map((image) => ({ ...image, src: encodeURI(image.src) }));

  const tracingImages: PreviewImage[] = [
    { src: "/assets/language_arts/initial_sound_tracing/a-image.png", alt: "letter a" },
    { src: "/assets/language_arts/initial_sound_tracing/a-path.svg", alt: "letter a outline" },
    { src: "/assets/language_arts/initial_sound_tracing/a-tracing_path.svg", alt: "letter a tracing path" },
  ];

  const conceptImages: PreviewImage[] = [
    {
      src: "/assets/language_arts/concept_development/opposites/images/big___opposites.png",
      alt: "big",
    },
    {
      src: "/assets/language_arts/concept_development/opposites/images/small___opposites.png",
      alt: "small",
    },
    {
      src: "/assets/language_arts/concept_development/association/pencil___association.png",
      alt: "pencil",
    },
  ];

  const moveableAlphabetImages: PreviewImage[] = [
    { src: "/assets/language_arts/moveable_alphabet/images/a---cat___moveable_phonics.png", alt: "cat" },
    { src: "/assets/language_arts/moveable_alphabet/images/a---bat___moveable_phonics.png", alt: "bat" },
    { src: "/assets/language_arts/moveable_alphabet/images/a---hat___moveable_phonics.png", alt: "hat" },
  ];

  return (
    <div className="relative min-h-screen bg-[radial-gradient(circle_at_top,#f5efe6,#fdfbf8_55%,#f7efe4)]">
      <HomeLink />
      <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-8 px-6 py-10">
        <div className="space-y-3 text-center">
          <p className="text-xs uppercase tracking-[0.35em] text-stone-400">Language Arts</p>
          <h1 className="font-display text-4xl font-semibold text-stone-900">Language Arts Materials</h1>
          <p className="text-sm text-stone-600">Choose a material to explore letter and phonics experiences.</p>
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          <Link
            href="/lessons/language-arts/initial-sound-cards"
            className="group flex h-56 flex-col justify-between rounded-3xl border border-stone-200 bg-gradient-to-br from-rose-50 via-white to-amber-50 p-6 shadow-[0_30px_60px_-40px_rgba(15,23,42,0.8)] transition hover:-translate-y-0.5 hover:shadow-[0_40px_90px_-50px_rgba(15,23,42,0.7)]"
          >
            <div className="flex items-center justify-between">
              <h2 className="font-display text-2xl font-semibold text-stone-900">Initial Sound Cards</h2>
              <span className="rounded-full bg-rose-100 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.35em] text-rose-700">
                Letters
              </span>
            </div>
            <ImageGridPreview images={initialSoundImages} className="bg-rose-50/70" />
            <p className="text-xs uppercase tracking-[0.35em] text-stone-500">Trace letters & match images</p>
          </Link>
          <Link
            href="/lessons/language-arts/initial-sound-tracing"
            className="group flex h-56 flex-col justify-between rounded-3xl border border-stone-200 bg-gradient-to-br from-sky-50 via-white to-emerald-50 p-6 shadow-[0_30px_60px_-40px_rgba(15,23,42,0.8)] transition hover:-translate-y-0.5 hover:shadow-[0_40px_90px_-50px_rgba(15,23,42,0.7)]"
          >
            <div className="flex items-center justify-between">
              <h2 className="font-display text-2xl font-semibold text-stone-900">Initial Sound Tracing</h2>
              <span className="rounded-full bg-sky-100 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.35em] text-sky-700">
                Dev
              </span>
            </div>
            <ImageGridPreview images={tracingImages} className="bg-sky-50/70" />
            <p className="text-xs uppercase tracking-[0.35em] text-stone-500">Sneak peek – SVG assets coming soon</p>
          </Link>
          <Link
            href="/lessons/language-arts/concept-development"
            className="group relative flex h-56 flex-col justify-between rounded-3xl border border-stone-200 bg-gradient-to-br from-amber-100 via-amber-50 to-white p-6 shadow-[0_30px_60px_-40px_rgba(15,23,42,0.8)] transition hover:-translate-y-0.5 hover:shadow-[0_40px_90px_-50px_rgba(15,23,42,0.7)]"
          >
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-2xl border border-amber-400 bg-amber-50 text-xl font-semibold text-amber-600">📁</span>
              <h2 className="font-display text-2xl font-semibold text-stone-900">Concept Development</h2>
            </div>
            <ImageGridPreview images={conceptImages} className="bg-amber-50/70" />
            <p className="text-xs uppercase tracking-[0.35em] text-stone-600">Organize playful explorations</p>
            <div className="absolute -bottom-3 right-4 rounded-full border border-amber-400 bg-amber-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.35em] text-amber-700">
              Folder
            </div>
          </Link>
          <Link
            href="/lessons/language-arts/moveable-alphabet"
            className="group flex h-56 flex-col justify-between rounded-3xl border border-stone-200 bg-gradient-to-br from-sky-100 via-sky-50 to-white p-6 shadow-[0_30px_60px_-40px_rgba(15,23,42,0.8)] transition hover:-translate-y-0.5 hover:shadow-[0_40px_90px_-50px_rgba(15,23,42,0.7)]"
          >
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-2xl border border-sky-400 bg-sky-50 text-xl font-semibold text-sky-600">✦</span>
              <h2 className="font-display text-2xl font-semibold text-stone-900">Moveable Alphabet Board</h2>
            </div>
            <ImageGridPreview images={moveableAlphabetImages} className="bg-sky-50/70" />
            <p className="text-xs uppercase tracking-[0.35em] text-sky-600">Vowel groups · drag & drop</p>
          </Link>
        </div>
      </main>
    </div>
  );
}
