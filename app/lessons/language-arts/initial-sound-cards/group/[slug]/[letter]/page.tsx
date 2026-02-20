import { notFound } from "next/navigation";
import InitialSoundLesson from "../../../../../../components/InitialSoundLesson";
import { getInitialSoundLetterSet, initialSoundGroups } from "../../../data";

type PageProps = {
  params: Promise<{ slug: string; letter: string }>;
};

export default async function InitialSoundLetterPage({ params }: PageProps) {
  const { slug, letter } = await params;
  const group = initialSoundGroups.find((item) => item.slug === slug);
  if (!group) {
    notFound();
  }

  const letterSet = getInitialSoundLetterSet(group, letter);
  if (!letterSet || !letterSet.slides.length) {
    notFound();
  }

  return (
    <InitialSoundLesson
      slides={letterSet.slides.map((slide) => ({ ...slide, letter: letterSet.letter }))}
      groupLabel={`${group.label} · ${letterSet.letter.toUpperCase()}`}
      groupSlug={group.slug}
      telemetryPageOffset={letterSet.offset}
      telemetryTotalPages={group.slides.length}
    />
  );
}
