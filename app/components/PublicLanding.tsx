import Image from "next/image";
import Link from "next/link";
import MaterialTeachersGuide from "./MaterialTeachersGuide";
import MoveableAlphabetLandingDemo from "./MoveableAlphabetLandingDemo";
import NumberRodsLandingDemo from "./NumberRodsLandingDemo";
import NumberRodsTeachersGuide from "./NumberRodsTeachersGuide";
import { PHONIC_PICTURE_CARDS_MOVEABLE_ALPHABET_PINK_TEACHERS_GUIDE } from "../data/languageArtsTeachersGuides";

export default function PublicLanding() {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,#f5efe6_0%,#fdfbf8_45%,#f7efe4_100%)]">
      <main className="relative mx-auto flex min-h-screen w-full max-w-7xl flex-col items-center px-6 py-10 text-center sm:px-10">
        <Link
          href="/login"
          aria-label="Go to login page"
          className="absolute right-2 top-2 inline-flex rounded-full bg-white/90 p-1.5 shadow-[0_8px_20px_-8px_rgba(15,23,42,0.55)] transition hover:scale-105 hover:bg-white sm:right-6 sm:top-6"
        >
          <Image
            src="/login_icon.png"
            alt="Login"
            width={42}
            height={42}
            className="h-10 w-10 object-contain sm:h-11 sm:w-11"
          />
        </Link>

        <Image
          src="/MDS_fv.png"
          alt="Montessori Digital Studio"
          width={180}
          height={180}
          priority
          className="mx-auto h-36 w-36 object-contain sm:h-44 sm:w-44"
        />

        <h1 className="mt-4 font-display text-4xl font-semibold text-stone-900 sm:text-5xl">
          Montessori Digital Studio
        </h1>
        <p className="mx-auto mt-3 max-w-3xl text-base text-stone-600 sm:text-lg">
          A calm digital companion for Montessori materials, lessons, and guided practice.
        </p>

        <p className="mx-auto mt-8 w-full max-w-6xl text-left text-base leading-relaxed text-stone-700 sm:text-lg">
          Montessori Digital Studio is a complete, calm, and faithful Montessori lesson library, spanning all subject
          areas with hundreds of clean, Montessori-like presentations that honor the most respected manuals used in the
          U.S. and worldwide. It helps children learn with clarity and independence, while giving parents, teachers,
          and institutions a reliable reference for precise sequencing, language, and purpose. With PDF companion
          materials and consistent terminology, it&apos;s especially powerful for current and future guides, quickly
          building confidence by helping them recognize the names of materials, understand what each one isolates, and
          deliver lessons with accuracy, continuity, and professionalism.
        </p>

        <section className="mt-8 w-full max-w-6xl">
          <div className="overflow-hidden rounded-3xl border border-stone-200 bg-white/65 p-4 shadow-[0_24px_70px_-50px_rgba(15,23,42,0.55)] sm:p-6">
            <p className="text-center text-xs font-semibold uppercase tracking-[0.3em] text-[#0e6798]">Sample Lesson</p>
            <h2 className="mb-4 mt-2 text-center font-display text-3xl font-semibold text-stone-900 sm:text-4xl">
              The Number Rods
            </h2>
            <NumberRodsLandingDemo />
            <NumberRodsTeachersGuide className="mt-6" autoPreviewOnVisible />
          </div>

          <div className="mt-8 overflow-hidden rounded-3xl border border-stone-200 bg-white/65 p-4 shadow-[0_24px_70px_-50px_rgba(15,23,42,0.55)] sm:p-6">
            <p className="text-center text-xs font-semibold uppercase tracking-[0.3em] text-[#0e6798]">Sample Lesson</p>
            <h2 className="mb-4 mt-2 text-center font-display text-3xl font-semibold text-stone-900 sm:text-4xl">
              Phonic Picture Cards with Moveable Alphabet — E
            </h2>
            <MoveableAlphabetLandingDemo />
            <MaterialTeachersGuide
              className="mt-6"
              guide={PHONIC_PICTURE_CARDS_MOVEABLE_ALPHABET_PINK_TEACHERS_GUIDE}
              defaultOpen
              materialPdfHref="/downloads/Phonic_Picture_Cards_Pink_Series_Pictures.pdf"
              materialPdfLabel="Download Pink Series Pictures PDF"
              teacherGuidePdfHref="/downloads/Phonic_Picture_Cards_Pink_Series_Teachers_Guide.pdf"
              teacherGuidePdfLabel="Download Teacher's Guide PDF"
            />
          </div>

          <div className="mt-6 overflow-hidden rounded-3xl border-2 border-[#71c0ee] bg-[#1f4f8a] text-left shadow-[0_24px_70px_-40px_rgba(30,64,175,0.65)]">
            <div className="border-b border-[#71c0ee] bg-white/10 px-6 py-4">
              <p className="text-xs font-semibold uppercase tracking-[0.26em] text-[#71c0ee]">Sign Up</p>
              <h3 className="mt-1 font-display text-2xl font-semibold text-white sm:text-3xl">
                Unlock Full Montessori Digital Studio Access
              </h3>
              <p className="mt-2 max-w-4xl text-sm text-blue-50/95 sm:text-base">
                Register to access guided materials with precise Montessori naming, progress tracking, and teacher-ready
                support tools.
              </p>
            </div>

            <div className="grid gap-3 px-6 py-5 sm:grid-cols-2">
              <div className="rounded-2xl border border-[#71c0ee] bg-white/85 p-4">
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#0e6798]">Progress Tracking</p>
                <p className="mt-1 text-sm text-stone-700">
                  Track attempts and completion by lesson so adults and educators can follow progress clearly.
                </p>
              </div>
              <div className="rounded-2xl border border-[#71c0ee] bg-white/85 p-4">
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#0e6798]">Precise Naming</p>
                <p className="mt-1 text-sm text-stone-700">
                  Helps Montessori training students get familiar with naming, pronunciation, and presentation of materials.
                </p>
              </div>
              <div className="rounded-2xl border border-[#71c0ee] bg-white/85 p-4">
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#0e6798]">Teacher Guides</p>
                <p className="mt-1 text-sm text-stone-700">
                  Built-in guides for presentation flow, control of error, observation, and extensions.
                </p>
              </div>
              <div className="rounded-2xl border border-[#71c0ee] bg-white/85 p-4">
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#0e6798]">PDF Companion</p>
                <p className="mt-1 text-sm text-stone-700">
                  Material companions are available in PDF for offline printing and reference.
                </p>
              </div>
            </div>
          </div>
        </section>

        <div className="mt-10 grid w-full max-w-2xl gap-4 sm:grid-cols-2">
          <Link
            href="/login"
            className="inline-flex items-center justify-center rounded-full border border-[#71c0ee] bg-white/95 px-8 py-3 text-sm font-semibold uppercase tracking-[0.24em] text-[#0e6798] shadow-sm transition hover:bg-[#e8f5fc]"
          >
            Login
          </Link>
          <Link
            href="/register"
            className="inline-flex items-center justify-center rounded-full border border-[#71c0ee] bg-[#71c0ee] px-8 py-3 text-sm font-semibold uppercase tracking-[0.24em] text-white shadow-md transition hover:bg-[#5cb6e8]"
          >
            Register for an Account
          </Link>
        </div>

        <div className="mt-14 w-full max-w-5xl pb-3 sm:mt-16">
          <div className="mx-auto flex w-fit flex-col items-center justify-center gap-3">
            <Link
              href="/about-us"
              aria-label="Open About Us page"
              className="group flex w-fit flex-col items-center justify-center gap-2 transition"
            >
              <span className="text-base font-semibold uppercase tracking-[0.34em] text-stone-400 transition group-hover:text-stone-500">
                About Us
              </span>
              <Image
                src="/MDS_fv.png"
                alt=""
                width={46}
                height={46}
                className="h-[46px] w-[46px] object-contain opacity-65 transition group-hover:opacity-90"
              />
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
