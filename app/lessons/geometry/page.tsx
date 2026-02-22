import Link from "next/link";
import HomeLink from "../../components/HomeLink";
import GeometryCabinetFirstTrayScene from "../../components/GeometryCabinetFirstTrayScene";

export default function GeometryHubPage() {
  return (
    <div className="relative min-h-screen bg-[radial-gradient(circle_at_top,#ecfeff,#f7fbff_55%,#eefcff)]">
      <HomeLink />
      <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-8 px-6 py-10">
        <header className="space-y-3 text-center">
          <p className="text-xs uppercase tracking-[0.35em] text-cyan-500">Geometry</p>
          <h1 className="font-display text-4xl font-semibold text-slate-900">Geometry Materials</h1>
          <p className="text-sm text-slate-600">Open a geometry material.</p>
        </header>

        <section className="grid gap-6 md:grid-cols-2">
          <Link
            href="/lessons/geometry/geometry-cabinet"
            className="group relative flex h-56 flex-col justify-between rounded-3xl border border-cyan-200 bg-gradient-to-br from-cyan-100 via-white to-teal-50 p-6 shadow-[0_30px_60px_-40px_rgba(15,23,42,0.8)] transition hover:-translate-y-0.5 hover:shadow-[0_40px_90px_-50px_rgba(15,23,42,0.7)]"
          >
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-2xl border border-cyan-300 bg-cyan-100 text-xl font-semibold text-cyan-700">
                📁
              </span>
              <h2 className="font-display text-2xl font-semibold text-slate-900">Geometry Cabinet</h2>
            </div>

            <GeometryCabinetFirstTrayScene preview className="h-24" />

            <p className="text-xs uppercase tracking-[0.35em] text-cyan-700">Cabinet series</p>
            <div className="absolute -bottom-3 right-4 rounded-full border border-cyan-300 bg-cyan-200 px-3 py-1 text-xs font-semibold uppercase tracking-[0.35em] text-cyan-800">
              Folder
            </div>
          </Link>
        </section>
      </main>
    </div>
  );
}
