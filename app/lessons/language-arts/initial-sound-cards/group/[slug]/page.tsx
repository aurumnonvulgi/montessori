import { notFound } from "next/navigation";
import { initialSoundGroups } from "../../data";
import InitialSoundGroupLesson from "../../../../../components/InitialSoundGroupLesson";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export default async function InitialSoundGroupPage({ params }: PageProps) {
  const { slug } = await params;
  const group = initialSoundGroups.find((item) => item.slug === slug);
  if (!group || !group.slides.length) {
    notFound();
  }
  return (
    <InitialSoundGroupLesson
      slides={group.slides}
      groupLabel={group.letters.join(" · ")}
      groupSlug={group.slug}
    />
  );
}
