"use client";

import HomeLink from "./HomeLink";
import TeenBoardScene from "./TeenBoardScene";

const steps = [
  "Place the ten bars to the upper-left of the rug and count the ten golden beads within each bar.",
  "Arrange the colored bead bars from one through nine to the right of the tens; remove each bar sequentially to count its beads before returning it to the lineup.",
  "Place a ten bar vertically on the rug and build eleven with the one-bar, narrating “Ten and one more are eleven.” Repeat with a second ten bar and the two-bar.",
  "Move into the Seguin three-period lesson using the ten-and-one and ten-and-two quantities.",
  "When the child succeeds, place the one- and two-bars on the rug for independent construction of eleven and twelve.",
  "Continue this pattern through nineteen, working at the child’s comfortable pace.",
];

export default function TeenBoardLesson() {
  return (
    <div className="relative min-h-screen bg-[radial-gradient(circle_at_top,#f5efe6_0%,#fdfbf8_45%,#f7efe4_100%)]">
      <HomeLink />
      <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-8 px-6 py-10 sm:px-10">
        <div className="space-y-3 text-center">
          <p className="text-xs uppercase tracking-[0.3em] text-stone-400">Mathematics</p>
          <h1 className="font-display text-4xl font-semibold text-stone-900">Teen Board</h1>
          <p className="text-sm text-stone-600">
            Build teen numbers with the ten stacks and number board while pacing through the Seguin three-period lesson.
          </p>
        </div>

        <section className="rounded-[36px] border border-stone-100 bg-white/90 p-6 shadow-[0_40px_70px_-50px_rgba(15,23,42,0.8)]">
          <div className="h-[520px]">
            <TeenBoardScene className="h-full" />
          </div>
          <div className="mt-6 grid gap-3 text-sm text-stone-600">
            {steps.map((step, index) => (
              <p key={index} className="text-stone-600">
                <span className="font-semibold text-stone-900">Step {index + 1}:</span> {step}
              </p>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
