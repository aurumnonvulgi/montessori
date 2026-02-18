"use client";

import Link from "next/link";
import HomeLink from "../../../components/HomeLink";
import InitialSoundDevBanner from "../../../components/InitialSoundDevBanner";

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

export default function InitialSoundHub() {
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
        <header className="space-y-3 text-center">
          <p className="text-xs uppercase tracking-[0.35em] text-stone-400">Language Arts · Initial Sound</p>
          <h1 className="font-display text-4xl font-semibold text-stone-900">Initial Sound</h1>
          <p className="text-sm text-stone-600">Choose a material to explore initial sounds.</p>
        </header>
        <InitialSoundDevBanner />
        <div className="grid gap-6">
          <Link
            href="/lessons/language-arts/initial-sound-cards"
            className="group flex h-56 flex-col justify-between rounded-3xl border border-rose-200 bg-gradient-to-br from-rose-100 via-white to-red-50 p-6 shadow-[0_30px_60px_-40px_rgba(15,23,42,0.8)] transition hover:-translate-y-0.5 hover:shadow-[0_40px_90px_-50px_rgba(15,23,42,0.7)]"
          >
            <div className="flex items-center justify-between">
              <h2 className="font-display text-2xl font-semibold text-stone-900">Initial Sound Cards</h2>
              <span className="rounded-full bg-rose-200 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.35em] text-rose-800">
                Letters
              </span>
            </div>
            <ImageGridPreview images={initialSoundImages} className="bg-rose-50/70" />
            <p className="text-xs uppercase tracking-[0.35em] text-rose-700">Trace letters & match images</p>
          </Link>
        </div>
      </main>
    </div>
  );
}
