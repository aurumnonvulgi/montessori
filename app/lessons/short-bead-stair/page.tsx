import HomeLink from "../../components/HomeLink";
import ShortBeadWorkbench from "../../components/ShortBeadWorkbench";

export default function ShortBeadStairPage() {
  return (
    <div className="relative min-h-screen bg-[radial-gradient(circle_at_top,#f5efe6_0%,#fdfbf8_45%,#f7efe4_100%)]">
      <HomeLink />
      <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col items-center justify-center px-6 py-10 sm:px-10">
        <div className="w-full rounded-[36px] border border-stone-100 bg-white/90 p-6 shadow-[0_40px_70px_-50px_rgba(15,23,42,0.8)]">
          <ShortBeadWorkbench className="h-[420px]" />
        </div>
      </main>
    </div>
  );
}
