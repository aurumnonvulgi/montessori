"use client";

import Image from "next/image";
import Link from "next/link";
import { type FormEvent, useRef, useState } from "react";

type Plan = {
  name: string;
  price: string;
  cycle: string;
  badge: string;
  description: string;
  perks: string[];
};

const PLANS: Plan[] = [
  {
    name: "Family",
    price: "$6.99",
    cycle: "per month",
    badge: "Monthly",
    description: "Up to two children with activity tracking.",
    perks: ["Up to 2 children", "Progress tracking", "Access to all available materials"],
  },
  {
    name: "Family Yearly",
    price: "$64.99",
    cycle: "per year",
    badge: "Yearly",
    description: "Annual family access with savings compared to monthly billing.",
    perks: ["Up to 2 children", "Progress tracking", "Full material access for 12 months"],
  },
];

export default function RegisterPage() {
  const interestFormRef = useRef<HTMLDivElement | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [interestSubmitted, setInterestSubmitted] = useState(false);

  const openInterestForm = (planName: string) => {
    setSelectedPlan(planName);
    setInterestSubmitted(false);
    window.setTimeout(() => {
      interestFormRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 80);
  };

  const handleInterestSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setInterestSubmitted(true);
    (event.currentTarget as HTMLFormElement).reset();
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,#eaf7ff_0%,#f9fcff_55%,#eff8ff_100%)] px-6 py-8 sm:px-10">
      <main className="mx-auto w-full max-w-6xl">
        <header className="text-center">
          <Image
            src="/MDS_fv.png"
            alt="Montessori Digital Studio"
            width={132}
            height={132}
            priority
            className="mx-auto h-28 w-28 object-contain sm:h-32 sm:w-32"
          />
          <p className="mt-3 text-sm font-semibold uppercase tracking-[0.34em] text-cyan-700 sm:text-base">
            Montessori Digital Studio
          </p>
          <h1 className="mt-3 font-display text-4xl font-semibold text-slate-900 sm:text-5xl">
            Register for an Account
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-base text-slate-600">
            Montessori Digital Studio is a comprehensive set of digital Montessori materials that faithfully mimic
            real Montessori materials, helping students become familiar with names and presentation protocols. A tool
            for children, parents, and teachers.
          </p>
        </header>

        <section className="mt-10 grid gap-5 md:grid-cols-2">
          {PLANS.map((plan) => (
            <article
              key={plan.name}
              className="rounded-3xl border border-cyan-100 bg-white/95 p-6 shadow-[0_26px_70px_-45px_rgba(14,116,144,0.45)]"
            >
              <p className="inline-flex rounded-full border border-cyan-200 bg-cyan-50 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-cyan-700">
                {plan.badge}
              </p>
              <h2 className="mt-4 font-display text-3xl font-semibold text-slate-900">{plan.name}</h2>
              <p className="mt-4 text-4xl font-semibold text-cyan-700">{plan.price}</p>
              <p className="text-sm uppercase tracking-[0.2em] text-slate-500">{plan.cycle}</p>
              <p className="mt-4 text-sm text-slate-600">{plan.description}</p>

              <ul className="mt-6 space-y-2 text-sm text-slate-700">
                {plan.perks.map((perk) => (
                  <li key={perk} className="flex items-start gap-2">
                    <span className="mt-0.5 text-cyan-700">•</span>
                    <span>{perk}</span>
                  </li>
                ))}
              </ul>

              <button
                type="button"
                onClick={() => openInterestForm(plan.name)}
                className="mt-8 inline-flex w-full items-center justify-center rounded-full border border-cyan-300 bg-cyan-500 px-5 py-3 text-sm font-semibold uppercase tracking-[0.22em] text-white transition hover:bg-cyan-600"
              >
                Select Plan
              </button>
            </article>
          ))}
        </section>

        {selectedPlan ? (
          <section
            ref={interestFormRef}
            className="mt-8 rounded-3xl border border-cyan-200 bg-white/95 p-6 shadow-[0_26px_70px_-45px_rgba(14,116,144,0.45)]"
          >
            <div className="max-w-3xl">
              <p className="inline-flex rounded-full border border-cyan-200 bg-cyan-50 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-cyan-700">
                Selected Plan: {selectedPlan}
              </p>
              <h2 className="mt-4 font-display text-3xl font-semibold text-slate-900 sm:text-4xl">
                Thank you for your interest.
              </h2>
              <p className="mt-3 text-sm text-slate-700 sm:text-base">
                We are getting ready to launch. Please leave your information below and we will contact you to get
                you started.
              </p>
            </div>

            <form onSubmit={handleInterestSubmit} className="mt-6 grid gap-4 md:grid-cols-2">
              <input type="hidden" name="plan" value={selectedPlan} />

              <label className="flex flex-col gap-2 text-sm text-slate-700">
                Full Name
                <input
                  type="text"
                  name="full-name"
                  className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-200"
                  placeholder="Your name"
                  required
                />
              </label>

              <label className="flex flex-col gap-2 text-sm text-slate-700">
                Email
                <input
                  type="email"
                  name="email"
                  className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-200"
                  placeholder="name@email.com"
                  required
                />
              </label>

              <label className="flex flex-col gap-2 text-sm text-slate-700">
                Phone
                <input
                  type="tel"
                  name="phone"
                  className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-200"
                  placeholder="(000) 000-0000"
                />
              </label>

              <label className="flex flex-col gap-2 text-sm text-slate-700">
                Children
                <input
                  type="number"
                  name="children"
                  min={1}
                  className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-200"
                  placeholder="How many children?"
                />
              </label>

              <label className="md:col-span-2 flex flex-col gap-2 text-sm text-slate-700">
                Notes
                <textarea
                  name="notes"
                  rows={4}
                  className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-200"
                  placeholder="Anything you want us to know..."
                />
              </label>

              <div className="md:col-span-2 flex flex-wrap items-center gap-3">
                <button
                  type="submit"
                  className="inline-flex items-center justify-center rounded-full border border-cyan-300 bg-cyan-500 px-8 py-3 text-sm font-semibold uppercase tracking-[0.22em] text-white transition hover:bg-cyan-600"
                >
                  Send Request
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedPlan(null);
                    setInterestSubmitted(false);
                  }}
                  className="inline-flex items-center justify-center rounded-full border border-slate-300 bg-white px-6 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-slate-700 transition hover:bg-slate-50"
                >
                  Close Form
                </button>
                {interestSubmitted ? (
                  <p className="text-sm font-semibold text-emerald-700">Thanks. We received your interest request.</p>
                ) : null}
              </div>
            </form>
          </section>
        ) : null}

        <section className="mt-8 rounded-3xl border border-sky-100 bg-white/95 p-6 shadow-[0_26px_70px_-45px_rgba(14,116,144,0.45)]">
          <div className="max-w-3xl">
            <h2 className="font-display text-4xl font-bold text-slate-900 sm:text-5xl">Schools and Institutions</h2>
            <p className="mt-2 text-lg font-semibold text-slate-800">Please contact us.</p>
            <p className="mt-3 text-sm text-slate-600">
              Track student progress across all subjects, assign materials by classroom, restrict access by role, and
              request companion printed physical materials for your environment.
            </p>
          </div>

          <form className="mt-6 grid gap-4 md:grid-cols-2">
            <label className="flex flex-col gap-2 text-sm text-slate-700">
              Email
              <input
                type="email"
                name="email"
                className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-200"
                placeholder="name@school.org"
                required
              />
            </label>

            <label className="flex flex-col gap-2 text-sm text-slate-700">
              Phone
              <input
                type="tel"
                name="phone"
                className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-200"
                placeholder="(000) 000-0000"
                required
              />
            </label>

            <label className="flex flex-col gap-2 text-sm text-slate-700">
              Number of Students
              <input
                type="number"
                name="students"
                min={1}
                className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-200"
                placeholder="0"
                required
              />
            </label>

            <label className="flex flex-col gap-2 text-sm text-slate-700">
              Number of Staff
              <input
                type="number"
                name="staff"
                min={1}
                className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-200"
                placeholder="0"
                required
              />
            </label>

            <label className="md:col-span-2 flex flex-col gap-2 text-sm text-slate-700">
              Interested in Printed Accompanying Materials
              <select
                name="printed-materials"
                className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-200"
                defaultValue=""
                required
              >
                <option value="" disabled>
                  Select an option
                </option>
                <option value="yes">Yes</option>
                <option value="no">No</option>
                <option value="maybe">Maybe</option>
              </select>
            </label>

            <div className="md:col-span-2">
              <button
                type="submit"
                className="inline-flex items-center justify-center rounded-full border border-cyan-300 bg-cyan-500 px-8 py-3 text-sm font-semibold uppercase tracking-[0.22em] text-white transition hover:bg-cyan-600"
              >
                Send Contact Request
              </button>
            </div>
          </form>
        </section>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-full border border-slate-300 bg-white px-6 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-slate-700 transition hover:bg-slate-50"
          >
            Back to Landing
          </Link>
          <Link
            href="/login"
            className="inline-flex items-center justify-center rounded-full border border-cyan-300 bg-cyan-500 px-6 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-white transition hover:bg-cyan-600"
          >
            Login
          </Link>
        </div>
      </main>
    </div>
  );
}
