import Link from "next/link";
import { notFound } from "next/navigation";
import HomeLink from "../../../../../components/HomeLink";
import InitialSoundDevBanner from "../../../../../components/InitialSoundDevBanner";
import { getInitialSoundLetterSets, initialSoundGroups } from "../../data";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export default async function InitialSoundGroupPage({ params }: PageProps) {
  const { slug } = await params;
  const group = initialSoundGroups.find((item) => item.slug === slug);
  if (!group) {
    notFound();
  }

  const letterSets = getInitialSoundLetterSets(group);

  return (
    <div className="relative min-h-screen bg-[radial-gradient(circle_at_top,#f5efe6,#fdfbf8_55%,#f7efe4)]">
      <HomeLink />
      <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-6 px-6 py-10 sm:px-10">
        <header className="space-y-3 text-center">
          <p className="text-xs uppercase tracking-[0.3em] text-stone-400">Language Arts</p>
          <h1 className="font-display text-4xl font-semibold text-stone-900">Initial Sound Cards</h1>
          <p className="text-sm text-stone-600">
            {group.label} • Pick a letter to preview image cards before starting.
          </p>
          <p className="text-xs uppercase tracking-[0.3em] text-stone-500">{group.letters.join(" · ")}</p>
        </header>
        <InitialSoundDevBanner />
        <section className="mx-auto grid w-full max-w-5xl grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {letterSets.map((set) => {
            const letterLabel = set.letter.toUpperCase();
            const previewSlides = set.slides.slice(0, 3);

            if (!set.slides.length) {
              return (
                <div
                  key={set.letter}
                  className="flex flex-col gap-4 rounded-3xl border border-stone-200 bg-stone-100/70 p-5 opacity-75"
                >
                  <div className="flex items-center justify-between">
                    <p className="text-3xl font-semibold text-stone-500">{letterLabel}</p>
                    <span className="rounded-full border border-stone-300 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.24em] text-stone-500">
                      Coming soon
                    </span>
                  </div>
                  <p className="text-sm text-stone-500">
                    No picture cards have been added for this letter yet.
                  </p>
                </div>
              );
            }

            return (
              <Link
                key={set.letter}
                href={`/lessons/language-arts/initial-sound-cards/group/${group.slug}/${set.letter}`}
                className="group rounded-3xl border border-stone-200 bg-white p-5 transition hover:-translate-y-0.5 hover:shadow-[0_20px_45px_-30px_rgba(15,23,42,0.75)]"
              >
                <div className="mb-4 flex items-center justify-between">
                  <p className="text-3xl font-semibold text-stone-900">{letterLabel}</p>
                  <span className="rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.24em] text-sky-700">
                    {set.slides.length} cards
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {previewSlides.map((slide) => (
                    <div
                      key={slide.word}
                      className="overflow-hidden rounded-xl border border-stone-200 bg-stone-100"
                    >
                      <img
                        src={slide.image}
                        alt={slide.word}
                        className="h-20 w-full object-cover"
                      />
                    </div>
                  ))}
                </div>
                <p className="mt-3 text-xs uppercase tracking-[0.2em] text-stone-500">
                  {previewSlides.map((slide) => slide.word).join(" · ")}
                </p>
              </Link>
            );
          })}
        </section>
      </main>
    </div>
  );
}
