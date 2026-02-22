import { notFound } from "next/navigation";
import MinuteClockThreePartCardsLesson from "../../../../../components/MinuteClockThreePartCardsLesson";
import { getMinuteChunkBySlug } from "../../../../../lib/minuteClockCards";

type PageProps = {
  params: Promise<{ chunk: string }>;
};

export default async function MinuteClockThreePartCardsChunkPage({ params }: PageProps) {
  const { chunk } = await params;
  if (!getMinuteChunkBySlug(chunk)) {
    notFound();
  }
  return <MinuteClockThreePartCardsLesson chunkSlug={chunk} />;
}
