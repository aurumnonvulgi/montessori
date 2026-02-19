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

const cards = [
  {
    title: "Opposites",
    description: "Drag pairs to their matching opposites.",
    href: "/lessons/language-arts/concept-development/opposites",
    accent: "from-amber-100 via-yellow-50 to-amber-50",
    previewClassName: "bg-amber-50/70",
    images: [
      "/assets/language_arts/concept_development/opposites/opposites_images/open-closed____phonic_books.png",
      "/assets/language_arts/concept_development/opposites/opposites_images/big-small____phonic_books.png",
      "/assets/language_arts/concept_development/opposites/opposites_images/fast-slow____phonic_books.png",
    ],
  },
  {
    title: "Associations",
    description: "Match items that belong together.",
    href: "/lessons/language-arts/concept-development/associations",
    accent: "from-amber-100 via-yellow-50 to-amber-50",
    previewClassName: "bg-amber-50/70",
    images: [
      "/assets/language_arts/concept_development/association/school-1____association.png",
      "/assets/language_arts/concept_development/association/school-2____association.png",
      "/assets/language_arts/concept_development/association/school-3____association.png",
    ],
  },
  {
    title: "Transportation",
    description: "Sort by land, air, and water.",
    href: "/lessons/language-arts/concept-development/transportation",
    accent: "from-amber-100 via-yellow-50 to-amber-50",
    previewClassName: "bg-amber-50/70",
    images: [
      "/assets/language_arts/concept_development/transportation/land---bus___transportation.png",
      "/assets/language_arts/concept_development/transportation/air---jet-airliner___transportation.png",
      "/assets/language_arts/concept_development/transportation/water---ferry___transportation.png",
    ],
  },
  {
    title: "Parts to Whole",
    description: "Match each part image to the full whole image.",
    href: "/lessons/language-arts/concept-development/parts-to-whole",
    accent: "from-amber-100 via-yellow-50 to-amber-50",
    previewClassName: "bg-amber-50/70",
    images: [
      "/assets/language_arts/concept_development/parts-to-whole/butterfly-whole-to-part____parts-to-whole.png",
      "/assets/language_arts/concept_development/parts-to-whole/giraffe-whole-to-part____parts-to-whole.png",
      "/assets/language_arts/concept_development/parts-to-whole/tiger-whole-to-part____parts-to-whole.png",
    ],
  },
];

export default function ConceptDevelopment() {
  return (
    <div className="relative min-h-screen bg-[radial-gradient(circle_at_top,#f5efe6,#fdfbf8_55%,#f7efe4)]">
      <HomeLink />
      <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-8 px-6 py-10">
        <header className="space-y-3 text-center">
          <p className="text-xs uppercase tracking-[0.35em] text-stone-400">Language Arts · Concept Development</p>
          <h1 className="font-display text-4xl font-semibold text-stone-900">Concept Development</h1>
          <p className="text-sm text-stone-600">Choose a pocket game to explore language concepts.</p>
        </header>
        <div className="grid gap-6 md:grid-cols-2">
          {cards.map((card) => (
            <Link
              key={card.title}
              href={card.href}
              className={`group flex h-56 flex-col justify-between rounded-3xl border border-stone-200 bg-gradient-to-br ${card.accent} p-6 shadow-[0_30px_60px_-40px_rgba(15,23,42,0.8)] transition hover:-translate-y-0.5 hover:shadow-[0_40px_90px_-50px_rgba(15,23,42,0.7)]`}
            >
              <h2 className="font-display text-2xl font-semibold text-stone-900">{card.title}</h2>
              <ImageGridPreview
                images={card.images.map((src, index) => ({
                  src,
                  alt: `${card.title} preview ${index + 1}`,
                }))}
                className={card.previewClassName}
              />
              <p className="text-sm font-medium text-stone-600">{card.description}</p>
              <p className="text-xs uppercase tracking-[0.35em] text-stone-500">Drag & drop concept game</p>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
