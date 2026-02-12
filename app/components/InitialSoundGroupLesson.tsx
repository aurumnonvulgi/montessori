"use client";

import InitialSoundLesson, { InitialSoundSlide } from "./InitialSoundLesson";

type InitialSoundGroupLessonProps = {
  slides: InitialSoundSlide[];
  groupLabel: string;
};

export default function InitialSoundGroupLesson({ slides, groupLabel }: InitialSoundGroupLessonProps) {
  return <InitialSoundLesson slides={slides} groupLabel={groupLabel} />;
}
