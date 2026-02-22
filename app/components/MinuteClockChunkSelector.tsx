import Link from "next/link";
import HomeLink from "./HomeLink";
import { MINUTE_CHUNKS } from "../lib/minuteClockCards";

type MinuteClockChunkSelectorProps = {
  title: string;
  subtitle: string;
  baseHref: string;
};

export default function MinuteClockChunkSelector({
  title,
  subtitle,
  baseHref,
}: MinuteClockChunkSelectorProps) {
  return (
    <div className="relative min-h-screen bg-[radial-gradient(circle_at_top,#f5efe6,#fdfbf8_55%,#f7efe4)]">
      <HomeLink />
      <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-6 px-6 py-10 sm:px-10">
        <header className="space-y-3 text-center">
          <p className="text-xs uppercase tracking-[0.3em] text-stone-400">History &amp; Time</p>
          <h1 className="font-display text-4xl font-semibold text-stone-900">{title}</h1>
          <p className="text-sm text-stone-600">{subtitle}</p>
        </header>

        <section className="mx-auto grid w-full max-w-5xl grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {MINUTE_CHUNKS.map((chunk) => {
            const startLabel = String(chunk.startMinute).padStart(2, "0");
            const middleLabel = String(chunk.startMinute + 4).padStart(2, "0");
            const endLabel = String(chunk.endMinute).padStart(2, "0");
            const previewMinute = Math.min(chunk.endMinute, chunk.startMinute + 1);
            const previewLabel = String(previewMinute).padStart(2, "0");
            const previewImage = `/assets/time/minute_clock/minute_clock_tcp_picture/01-${previewLabel}-minute_clock_tcp_picture.png`;
            return (
              <Link
                key={chunk.slug}
                href={`${baseHref}/${chunk.slug}`}
                className="group rounded-3xl border border-stone-200 bg-white p-5 transition hover:-translate-y-0.5 hover:shadow-[0_20px_45px_-30px_rgba(15,23,42,0.75)]"
              >
                <div className="mb-4 flex items-center gap-3">
                  <div className="h-16 w-16 shrink-0 overflow-hidden rounded-2xl border border-stone-200 bg-stone-100">
                    <img src={previewImage} alt={`Clock preview 1:${previewLabel}`} className="h-full w-full object-cover" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-display text-2xl font-semibold text-stone-900">{chunk.label}</p>
                    <p className="mt-1 text-xs uppercase tracking-[0.2em] text-stone-500">
                      1:{startLabel} · 1:{middleLabel} · 1:{endLabel}
                    </p>
                  </div>
                  <span className="rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.24em] text-sky-700">
                    10 cards
                  </span>
                </div>
                <p className="text-xs uppercase tracking-[0.2em] text-stone-400">Pick this minute chunk</p>
              </Link>
            );
          })}
        </section>
      </main>
    </div>
  );
}
