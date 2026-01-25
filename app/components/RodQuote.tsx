"use client";

import { motion } from "framer-motion";

const rods = [
  { width: "40%", color: "#f16b5c" },
  { width: "46%", color: "#f59e47" },
  { width: "52%", color: "#f7c948" },
  { width: "58%", color: "#8ccf7b" },
  { width: "64%", color: "#55b6a2" },
  { width: "70%", color: "#4db3d9" },
  { width: "76%", color: "#5b7cdb" },
  { width: "82%", color: "#7c63d3" },
  { width: "88%", color: "#b46fd9" },
  { width: "94%", color: "#e27fb3" },
];

const easeInOut = [0.42, 0, 0.58, 1] as [number, number, number, number];

export default function RodQuote() {
  return (
    <section className="relative overflow-hidden rounded-[36px] border border-stone-200 bg-white/90 p-8">
      <motion.div
        className="pointer-events-none absolute -left-10 top-0 h-40 w-40 rounded-full bg-rose-200/70 blur-3xl"
        animate={{ y: [0, 16, 0], scale: [1, 1.05, 1] }}
        transition={{ duration: 6, repeat: Infinity, ease: easeInOut }}
      />
      <motion.div
        className="pointer-events-none absolute -right-8 top-10 h-48 w-48 rounded-full bg-sky-200/70 blur-3xl"
        animate={{ y: [0, -12, 0], scale: [1, 1.08, 1] }}
        transition={{ duration: 7, repeat: Infinity, ease: easeInOut }}
      />
      <motion.div
        className="pointer-events-none absolute bottom-0 left-1/3 h-44 w-44 rounded-full bg-amber-200/70 blur-3xl"
        animate={{ y: [0, 14, 0], scale: [1, 1.06, 1] }}
        transition={{ duration: 5.5, repeat: Infinity, ease: easeInOut }}
      />

      <div className="relative grid gap-10 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="flex flex-col gap-6">
          <p className="text-xs uppercase tracking-[0.2em] text-stone-400">
            Montessori moment
          </p>
          <blockquote className="font-display text-2xl leading-relaxed text-stone-900 sm:text-3xl">
            &quot;When the rods have been placed in order of gradation, we teach
            the child the numbers: one, two, three, etc. by touching the rods in
            succession, from the first up to ten.&quot;
          </blockquote>
          <p className="text-sm uppercase tracking-[0.2em] text-stone-500">
            - Maria Montessori, Dr. Montessori&apos;s Own Handbook
          </p>
          <p className="max-w-lg text-sm text-stone-600">
            This animation shows the number rods in order and highlights the
            counting sequence, making it easy to build a calm, repeatable
            lesson.
          </p>
        </div>

        <div className="rounded-[28px] border border-white/60 bg-[#f7efe4] p-6 shadow-[0_25px_60px_-40px_rgba(45,30,10,0.6)]">
          <p className="text-xs uppercase tracking-[0.2em] text-stone-400">
            Number rods
          </p>
          <div className="mt-5 flex flex-col gap-3">
            {rods.map((rod, index) => (
              <motion.div
                key={rod.color}
                className="h-3 rounded-full"
                style={{ width: rod.width, backgroundColor: rod.color }}
                initial={{ opacity: 0, x: -20 }}
                animate={{
                  opacity: 1,
                  x: 0,
                  boxShadow: [
                    "0 0 0 rgba(0,0,0,0)",
                    "0 14px 30px rgba(0,0,0,0.18)",
                    "0 0 0 rgba(0,0,0,0)",
                  ],
                  scale: [1, 1.04, 1],
                }}
                transition={{
                  opacity: { duration: 0.5, delay: index * 0.08 },
                  x: { duration: 0.5, delay: index * 0.08 },
                  boxShadow: {
                    duration: 2.4,
                    repeat: Infinity,
                    delay: index * 0.2,
                  },
                  scale: {
                    duration: 2.4,
                    repeat: Infinity,
                    delay: index * 0.2,
                  },
                }}
              />
            ))}
          </div>
          <div className="mt-6 flex items-center justify-between text-xs uppercase tracking-[0.25em] text-stone-400">
            <span>Touch and count</span>
            <span>1 - 10</span>
          </div>
        </div>
      </div>
    </section>
  );
}
