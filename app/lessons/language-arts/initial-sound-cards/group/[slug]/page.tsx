import { use } from "react";
import { notFound } from "next/navigation";
import { initialSoundGroups } from "../../data";
import InitialSoundGroupLesson from "../../../../../components/InitialSoundGroupLesson";

type PageProps = {
  params: {
    slug: string | Promise<string>;
  };
};

export default function InitialSoundGroupPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const group = initialSoundGroups.find((item) => item.slug === resolvedParams.slug);
  if (!group || !group.slides.length) {
    notFound();
  }
  return (
    <InitialSoundGroupLesson slides={group.slides} groupLabel={group.letters.join(" · ")} />
  );
}
