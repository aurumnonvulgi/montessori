import { notFound } from "next/navigation";
import MinuteClockThreePartCardsPicturesLabelsLesson from "../../../../../components/MinuteClockThreePartCardsPicturesLabelsLesson";
import { getMinuteChunkBySlug } from "../../../../../lib/minuteClockCards";

type PageProps = {
  params: Promise<{ chunk: string }>;
};

export default async function MinuteClockThreePartCardsPicturesLabelsChunkPage({ params }: PageProps) {
  const { chunk } = await params;
  if (!getMinuteChunkBySlug(chunk)) {
    notFound();
  }
  return <MinuteClockThreePartCardsPicturesLabelsLesson chunkSlug={chunk} />;
}
