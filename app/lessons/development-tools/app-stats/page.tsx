import HomeLink from "../../../components/HomeLink";
import statsSnapshot from "../../../data/app-stats.json";

type FileSnapshot = {
  relPath: string;
  extension: string;
  size: number;
  createdMs: number;
  modifiedMs: number;
};

const numberFormatter = new Intl.NumberFormat("en-US");
const BYTES_PER_GIB = 1024 ** 3;

const formatCount = (value: number) => numberFormatter.format(value);
const formatGigabytes = (bytes: number) => {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0.00";
  return (bytes / BYTES_PER_GIB).toFixed(2);
};

const formatBytes = (bytes: number) => {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  let value = bytes;
  let unitIndex = 0;
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }
  const decimals = value >= 10 || unitIndex === 0 ? 0 : 1;
  return `${value.toFixed(decimals)} ${units[unitIndex]}`;
};

const formatDate = (timestampMs: number) => {
  if (!Number.isFinite(timestampMs) || timestampMs <= 0) return "N/A";
  return new Date(timestampMs).toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  });
};

function StatCard({ label, value, detail }: { label: string; value: string; detail?: string }) {
  return (
    <article className="rounded-2xl border border-sky-200 bg-white/80 p-4 shadow-sm">
      <p className="text-[10px] uppercase tracking-[0.28em] text-sky-700">{label}</p>
      <p className="mt-2 text-3xl font-semibold text-slate-900">{value}</p>
      {detail ? <p className="mt-1 text-xs text-slate-600">{detail}</p> : null}
    </article>
  );
}

function FileMomentCard({ title, item }: { title: string; item: FileSnapshot | null }) {
  return (
    <article className="rounded-2xl border border-emerald-200 bg-white/85 p-4 shadow-sm">
      <p className="text-[10px] uppercase tracking-[0.28em] text-emerald-700">{title}</p>
      {item ? (
        <>
          <p className="mt-2 break-all font-mono text-xs text-slate-800">{item.relPath}</p>
          <p className="mt-2 text-xs text-slate-600">Created: {formatDate(item.createdMs)}</p>
          <p className="text-xs text-slate-600">Updated: {formatDate(item.modifiedMs)}</p>
          <p className="text-xs text-slate-600">Size: {formatBytes(item.size)}</p>
        </>
      ) : (
        <p className="mt-2 text-sm text-slate-600">No files found.</p>
      )}
    </article>
  );
}

export default function AppStatsPage() {
  const snapshot = statsSnapshot;
  const generatedAt = new Date(snapshot.generatedAtISO);

  return (
    <div className="relative min-h-screen bg-[radial-gradient(circle_at_top,#f3fbff,#f8fbff_45%,#eef5ff)]">
      <HomeLink />
      <main className="mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-8 px-6 py-10">
        <header className="space-y-3 text-center">
          <p className="text-xs uppercase tracking-[0.35em] text-sky-500">Development Tools · App Stats</p>
          <h1 className="font-display text-4xl font-semibold text-slate-900">App Statistics</h1>
          <p className="text-sm text-slate-600">
            Snapshot generated {generatedAt.toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" })}.
          </p>
        </header>

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Project Files"
            value={formatCount(snapshot.totals.files)}
            detail={`Scanned size: ${formatBytes(snapshot.totals.sizeBytes)}`}
          />
          <StatCard
            label="App Weight"
            value={`${formatGigabytes(snapshot.totals.sizeBytes)} GB`}
            detail={`Scanned size: ${formatBytes(snapshot.totals.sizeBytes)}`}
          />
          <StatCard
            label="Pages"
            value={formatCount(snapshot.pages.total)}
            detail={`Lesson pages: ${formatCount(snapshot.pages.lesson)}`}
          />
          <StatCard
            label="Media Files"
            value={formatCount(snapshot.media.total)}
            detail={`${formatCount(snapshot.media.images)} images · ${formatCount(snapshot.media.audio)} audio · ${formatCount(snapshot.media.video)} video`}
          />
          <StatCard
            label="Asset Sources"
            value={formatCount(snapshot.assets.total)}
            detail={`Public: ${formatCount(snapshot.assets.public)} · Master: ${formatCount(snapshot.assets.master)}`}
          />
          <StatCard
            label="Components"
            value={formatCount(snapshot.components.total)}
            detail={`API routes: ${formatCount(snapshot.components.apiRoutes)}`}
          />
          <StatCard
            label="Lesson Routes"
            value={formatCount(snapshot.pages.lesson)}
            detail={`Dynamic lesson routes: ${formatCount(snapshot.pages.dynamicLesson)}`}
          />
          <StatCard
            label="Public Media"
            value={formatCount(snapshot.assets.publicMedia.total)}
            detail={`${formatCount(snapshot.assets.publicMedia.images)} images · ${formatCount(snapshot.assets.publicMedia.audio)} audio`}
          />
          <StatCard
            label="Master Media"
            value={formatCount(snapshot.assets.masterMedia.total)}
            detail={`${formatCount(snapshot.assets.masterMedia.images)} images · ${formatCount(snapshot.assets.masterMedia.audio)} audio`}
          />
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <FileMomentCard title="First Created Page" item={snapshot.moments.oldestPage} />
          <FileMomentCard title="Most Recent Page" item={snapshot.moments.newestPage} />
          <FileMomentCard title="First Created Lesson Page" item={snapshot.moments.oldestLessonPage} />
          <FileMomentCard title="Most Recent Lesson Page" item={snapshot.moments.newestLessonPage} />
          <FileMomentCard title="Oldest File In Project" item={snapshot.moments.oldestFile} />
          <FileMomentCard title="Newest File In Project" item={snapshot.moments.newestFile} />
        </section>

        <section className="grid gap-4 lg:grid-cols-3">
          <article className="rounded-2xl border border-sky-200 bg-white/85 p-4 shadow-sm lg:col-span-1">
            <p className="text-[10px] uppercase tracking-[0.28em] text-sky-700">Lesson Subjects</p>
            <div className="mt-3 space-y-2">
              {snapshot.lessonSubjects.map((item) => (
                <div
                  key={item.name}
                  className="flex items-center justify-between rounded-xl border border-sky-100 bg-sky-50/60 px-3 py-2"
                >
                  <span className="text-sm text-slate-700">{item.name}</span>
                  <span className="font-mono text-xs text-sky-800">{formatCount(item.count)}</span>
                </div>
              ))}
            </div>
          </article>

          <article className="rounded-2xl border border-sky-200 bg-white/85 p-4 shadow-sm lg:col-span-1">
            <p className="text-[10px] uppercase tracking-[0.28em] text-sky-700">Top-Level Folders</p>
            <div className="mt-3 space-y-2">
              {snapshot.topLevels.map((item) => (
                <div
                  key={item.name}
                  className="flex items-center justify-between rounded-xl border border-sky-100 bg-sky-50/60 px-3 py-2"
                >
                  <span className="break-all text-sm text-slate-700">{item.name}</span>
                  <span className="font-mono text-xs text-sky-800">{formatCount(item.count)}</span>
                </div>
              ))}
            </div>
          </article>

          <article className="rounded-2xl border border-sky-200 bg-white/85 p-4 shadow-sm lg:col-span-1">
            <p className="text-[10px] uppercase tracking-[0.28em] text-sky-700">File Extensions</p>
            <div className="mt-3 max-h-[24rem] space-y-2 overflow-auto pr-1">
              {snapshot.extensions.map((item) => (
                <div
                  key={item.name}
                  className="flex items-center justify-between rounded-xl border border-sky-100 bg-sky-50/60 px-3 py-2"
                >
                  <span className="font-mono text-xs text-slate-700">{item.name}</span>
                  <span className="font-mono text-xs text-sky-800">{formatCount(item.count)}</span>
                </div>
              ))}
            </div>
          </article>
        </section>

        <section className="rounded-2xl border border-indigo-200 bg-white/85 p-4 shadow-sm">
          <p className="text-[10px] uppercase tracking-[0.28em] text-indigo-700">Largest Files</p>
          <div className="mt-3 overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="border-b border-indigo-100 text-xs uppercase tracking-[0.18em] text-indigo-700">
                  <th className="px-3 py-2">Path</th>
                  <th className="px-3 py-2">Size</th>
                  <th className="px-3 py-2">Created</th>
                  <th className="px-3 py-2">Updated</th>
                </tr>
              </thead>
              <tbody>
                {snapshot.largestFiles.map((file) => (
                  <tr key={file.relPath} className="border-b border-indigo-50 align-top">
                    <td className="px-3 py-2 font-mono text-xs text-slate-700">{file.relPath}</td>
                    <td className="px-3 py-2 font-mono text-xs text-slate-700">{formatBytes(file.size)}</td>
                    <td className="px-3 py-2 text-xs text-slate-600">{formatDate(file.createdMs)}</td>
                    <td className="px-3 py-2 text-xs text-slate-600">{formatDate(file.modifiedMs)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
}
