import { type MaterialTeachersGuideData } from "../data/materialTeachersGuides";

type MaterialTeachersGuideProps = {
  guide: MaterialTeachersGuideData;
  className?: string;
};

export default function MaterialTeachersGuide({ guide, className = "" }: MaterialTeachersGuideProps) {
  return (
    <div
      className={`overflow-hidden rounded-3xl border-2 border-sky-300 bg-gradient-to-br from-sky-50 via-blue-50 to-cyan-100 text-left shadow-[0_24px_70px_-40px_rgba(14,116,144,0.45)] ${className}`.trim()}
    >
      <details className="group">
        <summary className="flex min-h-[88px] cursor-pointer list-none items-center justify-between bg-sky-100/70 px-6 py-5 text-lg font-semibold tracking-[0.08em] text-sky-950 sm:text-xl">
          <span>Teacher&apos;s Guide</span>
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-sky-300 bg-white text-sky-700 transition group-open:rotate-180">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.6"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-5 w-5"
              aria-hidden="true"
            >
              <path d="m6 9 6 6 6-6" />
            </svg>
          </span>
        </summary>

        <div className="space-y-5 border-t-2 border-sky-200 px-7 py-8 text-base leading-relaxed text-sky-950 sm:text-lg">
          <div className="rounded-2xl border border-sky-200/80 bg-white/75 p-5 shadow-sm">
            <h3 className="text-lg font-semibold text-sky-950 sm:text-xl">{guide.title}</h3>
          </div>

          <div className="rounded-2xl border border-sky-200/80 bg-white/75 p-5 shadow-sm">
            <h4 className="text-lg font-semibold text-sky-950 sm:text-xl">Purpose</h4>
            <p>{guide.purpose}</p>
          </div>

          <div className="rounded-2xl border border-sky-200/80 bg-white/75 p-5 shadow-sm">
            <h4 className="text-lg font-semibold text-sky-950 sm:text-xl">What&apos;s Included</h4>
            <p>{guide.whatsIncluded}</p>
          </div>

          <div className="rounded-2xl border border-sky-200/80 bg-white/75 p-5 shadow-sm">
            <h4 className="text-lg font-semibold text-sky-950 sm:text-xl">Key Language</h4>
            <ul className="mt-2 list-disc space-y-1 pl-6">
              {guide.keyLanguage.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          </div>

          <div className="rounded-2xl border border-sky-200/80 bg-white/75 p-5 shadow-sm">
            <h4 className="text-lg font-semibold text-sky-950 sm:text-xl">Presentation Notes</h4>
            <p>{guide.presentationNotes}</p>
          </div>

          <div className="rounded-2xl border border-sky-200/80 bg-white/75 p-5 shadow-sm">
            <h4 className="text-lg font-semibold text-sky-950 sm:text-xl">Control of Error</h4>
            <p>{guide.controlOfError}</p>
          </div>

          <div className="rounded-2xl border border-sky-200/80 bg-white/75 p-5 shadow-sm">
            <h4 className="text-lg font-semibold text-sky-950 sm:text-xl">Observe For</h4>
            <p>{guide.observeFor}</p>
          </div>

          <div className="rounded-2xl border border-sky-200/80 bg-white/75 p-5 shadow-sm">
            <h4 className="text-lg font-semibold text-sky-950 sm:text-xl">Extensions</h4>
            <ul className="mt-2 list-disc space-y-1 pl-6">
              {guide.extensions.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          </div>

          <div className="rounded-2xl border border-sky-200/80 bg-white/75 p-5 shadow-sm">
            <h4 className="text-lg font-semibold text-sky-950 sm:text-xl">Readiness</h4>
            <p>{guide.readiness}</p>
          </div>

          <div className="flex justify-end rounded-2xl border border-sky-200/80 bg-white/75 p-5 shadow-sm">
            <div className="group/print relative" title="Please register for an account with printing rights.">
              <button
                type="button"
                disabled
                aria-disabled="true"
                className="pointer-events-none cursor-not-allowed rounded-full border border-stone-300 bg-stone-100 px-5 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-stone-400 sm:text-sm"
              >
                Print PDF Material or Guide
              </button>
              <div className="pointer-events-none absolute -top-11 right-0 rounded-full bg-stone-900 px-4 py-2 text-xs text-white opacity-0 transition group-hover/print:opacity-100 group-active/print:opacity-100 group-focus-within/print:opacity-100">
                Please register for an account with printing rights.
              </div>
            </div>
          </div>
        </div>
      </details>
    </div>
  );
}
