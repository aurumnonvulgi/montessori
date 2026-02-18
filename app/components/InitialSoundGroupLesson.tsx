"use client";

import InitialSoundLesson, { InitialSoundSlide } from "./InitialSoundLesson";

type InitialSoundGroupLessonProps = {
  slides: InitialSoundSlide[];
  groupLabel: string;
  groupSlug: string;
};

export default function InitialSoundGroupLesson({ slides, groupLabel, groupSlug }: InitialSoundGroupLessonProps) {
  return <InitialSoundLesson slides={slides} groupLabel={groupLabel} groupSlug={groupSlug} />;
}
