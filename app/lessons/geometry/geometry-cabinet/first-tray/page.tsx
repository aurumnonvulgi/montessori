import Link from "next/link";
import HomeLink from "../../../../components/HomeLink";
import GeometryCabinetFirstTrayScene from "../../../../components/GeometryCabinetFirstTrayScene";

export default function GeometryCabinetFirstTrayPage() {
  return (
    <div className="relative min-h-screen bg-[radial-gradient(circle_at_top,#ecfeff,#f7fbff_55%,#eefcff)]">
      <HomeLink />
      <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-6 px-6 py-10">
        <header className="space-y-2 text-center">
          <p className="text-xs uppercase tracking-[0.35em] text-cyan-500">Geometry Cabinet</p>
          <h1 className="font-display text-4xl font-semibold text-slate-900">First Tray</h1>
          <p className="text-sm text-slate-600">3D board with draggable geometric figures.</p>
        </header>

        <GeometryCabinetFirstTrayScene />

        <div className="flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/lessons/geometry/geometry-cabinet"
            className="inline-flex items-center justify-center rounded-full border border-cyan-300 bg-cyan-50 px-5 py-2 text-xs uppercase tracking-[0.35em] text-cyan-700"
          >
            Back to Cabinet
          </Link>
          <Link
            href="/lessons/geometry"
            className="inline-flex items-center justify-center rounded-full border border-stone-300 bg-white px-5 py-2 text-xs uppercase tracking-[0.35em] text-stone-600"
          >
            Back to Geometry
          </Link>
        </div>
      </main>
    </div>
  );
}
