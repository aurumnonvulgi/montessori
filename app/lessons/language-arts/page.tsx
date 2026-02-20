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
  const lilacPreviewWords = ["a", "and", "come", "look", "you"];

  const phonicsImages: PreviewImage[] = [
    { src: "/assets/language_arts/moveable_alphabet/images/a---cat___moveable_phonics.png", alt: "cat" },
    { src: "/assets/language_arts/moveable_alphabet/images/a---bat___moveable_phonics.png", alt: "bat" },
    { src: "/assets/language_arts/moveable_alphabet/images/a---hat___moveable_phonics.png", alt: "hat" },
  ];

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

  return (
    <div className="relative min-h-screen bg-[radial-gradient(circle_at_top,#f5efe6,#fdfbf8_55%,#f7efe4)]">
      <HomeLink />
      <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-8 px-6 py-10">
        <div className="space-y-3 text-center">
          <p className="text-xs uppercase tracking-[0.35em] text-stone-400">Language Arts</p>
          <h1 className="font-display text-4xl font-semibold text-stone-900">Language Arts Materials</h1>
          <p className="text-sm text-stone-600">Choose a material to explore letter and phonics experiences.</p>
          <div>
            <Link
              href="/dashboard"
              className="inline-flex items-center justify-center rounded-full border border-sky-200 bg-sky-50 px-4 py-2 text-xs uppercase tracking-[0.3em] text-sky-700"
            >
              Activity Dashboard
            </Link>
          </div>
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          <Link
            href="/lessons/language-arts/initial-sound"
            className="group relative flex h-56 flex-col justify-between rounded-3xl border border-rose-200 bg-gradient-to-br from-rose-100 via-white to-red-50 p-6 shadow-[0_30px_60px_-40px_rgba(15,23,42,0.8)] transition hover:-translate-y-0.5 hover:shadow-[0_40px_90px_-50px_rgba(15,23,42,0.7)]"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-2xl border border-rose-300 bg-rose-100 text-xl font-semibold text-rose-700">📁</span>
                <h2 className="font-display text-2xl font-semibold text-stone-900">Initial Sound</h2>
              </div>
            </div>
            <ImageGridPreview images={initialSoundImages} className="bg-rose-50/70" />
            <p className="text-xs uppercase tracking-[0.35em] text-rose-700">Cards</p>
            <div className="absolute -bottom-3 right-4 rounded-full border border-rose-300 bg-rose-200 px-3 py-1 text-xs font-semibold uppercase tracking-[0.35em] text-rose-800">
              Folder
            </div>
          </Link>
          <Link
            href="/lessons/language-arts/phonics"
            className="group relative flex h-56 flex-col justify-between rounded-3xl border border-pink-200 bg-gradient-to-br from-pink-100 via-white to-rose-50 p-6 shadow-[0_30px_60px_-40px_rgba(15,23,42,0.8)] transition hover:-translate-y-0.5 hover:shadow-[0_40px_90px_-50px_rgba(15,23,42,0.7)]"
          >
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-2xl border border-pink-300 bg-pink-100 text-xl font-semibold text-pink-700">📁</span>
              <h2 className="font-display text-2xl font-semibold text-stone-900">Phonics | Pink Series</h2>
            </div>
            <ImageGridPreview images={phonicsImages} className="bg-pink-50/70" />
            <p className="text-xs uppercase tracking-[0.35em] text-pink-700">Moveable alphabet + labels</p>
            <div className="absolute -bottom-3 right-4 rounded-full border border-pink-300 bg-pink-200 px-3 py-1 text-xs font-semibold uppercase tracking-[0.35em] text-pink-800">
              Folder
            </div>
          </Link>
          <Link
            href="/lessons/language-arts/lilac-word-lists"
            className="group relative flex h-56 flex-col justify-between rounded-3xl border border-fuchsia-200 bg-gradient-to-br from-fuchsia-100 via-violet-50 to-purple-100 p-6 shadow-[0_30px_60px_-40px_rgba(15,23,42,0.8)] transition hover:-translate-y-0.5 hover:shadow-[0_40px_90px_-50px_rgba(15,23,42,0.7)]"
          >
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-2xl border border-fuchsia-300 bg-fuchsia-100 text-xl font-semibold text-fuchsia-700">📁</span>
              <div className="flex flex-col">
                <h2 className="font-display text-2xl font-semibold text-stone-900">Lilac</h2>
                <p className="text-[11px] uppercase tracking-[0.22em] text-fuchsia-700">Most Frequently used Words</p>
              </div>
            </div>
            <div className="grid h-24 grid-cols-3 gap-2 rounded-2xl border border-fuchsia-200 bg-white/70 p-2">
              {lilacPreviewWords.map((word) => (
                <span
                  key={word}
                  className="inline-flex items-center justify-center rounded-xl border border-fuchsia-200 bg-white text-sm font-semibold text-fuchsia-700"
                >
                  {word}
                </span>
              ))}
            </div>
            <p className="text-xs uppercase tracking-[0.35em] text-fuchsia-700">Speaker + mic practice</p>
            <div className="absolute -bottom-3 right-4 rounded-full border border-fuchsia-300 bg-fuchsia-200 px-3 py-1 text-xs font-semibold uppercase tracking-[0.35em] text-fuchsia-800">
              Folder
            </div>
          </Link>
          <Link
            href="/lessons/language-arts/concept-development"
            className="group relative flex h-56 flex-col justify-between rounded-3xl border border-amber-200 bg-gradient-to-br from-amber-100 via-yellow-50 to-amber-50 p-6 shadow-[0_30px_60px_-40px_rgba(15,23,42,0.8)] transition hover:-translate-y-0.5 hover:shadow-[0_40px_90px_-50px_rgba(15,23,42,0.7)]"
          >
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-2xl border border-amber-400 bg-amber-100 text-xl font-semibold text-amber-700">📁</span>
              <h2 className="font-display text-2xl font-semibold text-stone-900">Concept Development</h2>
            </div>
            <div className="flex h-24 items-center justify-center text-sm font-semibold text-stone-600">
              Opposites · Associations · Transportation
            </div>
            <p className="text-xs uppercase tracking-[0.35em] text-amber-700">Organize playful explorations</p>
            <div className="absolute -bottom-3 right-4 rounded-full border border-amber-400 bg-amber-200 px-3 py-1 text-xs font-semibold uppercase tracking-[0.35em] text-amber-800">
              Folder
            </div>
          </Link>
        </div>
      </main>
    </div>
  );
}
