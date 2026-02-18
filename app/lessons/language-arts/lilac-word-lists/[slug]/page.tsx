import { notFound } from "next/navigation";
import LilacWordSetLesson from "../../../../components/LilacWordSetLesson";
import { LILAC_WORD_SETS, getLilacSetBySlug } from "../data";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export default async function LilacWordSetPage({ params }: PageProps) {
  const { slug } = await params;
  const set = getLilacSetBySlug(slug);

  if (!set) {
    notFound();
  }

  const setIndex = LILAC_WORD_SETS.findIndex((item) => item.slug === slug);
  const nextSet = setIndex >= 0 ? LILAC_WORD_SETS[setIndex + 1] : undefined;

  return (
    <LilacWordSetLesson
      label={set.label}
      words={set.words}
      nextSetHref={
        nextSet ? `/lessons/language-arts/lilac-word-lists/${nextSet.slug}` : undefined
      }
    />
  );
}

