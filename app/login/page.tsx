"use client";

import { Suspense, type FormEvent, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

function LoginCard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const nextPath = useMemo(() => {
    const raw = searchParams.get("next");
    if (!raw || !raw.startsWith("/")) return "/";
    if (raw === "/login") return "/";
    return raw;
  }, [searchParams]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setError("");

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (!response.ok) {
        setError("Incorrect password.");
        return;
      }
      router.replace(nextPath);
      router.refresh();
    } catch {
      setError("Unable to log in right now.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="w-full rounded-[32px] border border-stone-200 bg-white/95 p-8 shadow-[0_30px_80px_-55px_rgba(15,23,42,0.55)]">
      <p className="text-xs uppercase tracking-[0.35em] text-stone-500">Montessori Digital Studio</p>
      <h1 className="mt-3 font-display text-3xl font-semibold text-stone-900">Login</h1>
      <p className="mt-2 text-sm text-stone-600">Enter your password to open the materials home.</p>

      <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
        <label className="block">
          <span className="mb-2 block text-xs uppercase tracking-[0.3em] text-stone-500">Password</span>
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="current-password"
            className="w-full rounded-2xl border border-stone-300 bg-white px-4 py-3 text-base text-stone-900 outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-200"
            placeholder="Enter password"
            required
          />
        </label>

        {error ? <p className="text-sm font-medium text-rose-700">{error}</p> : null}

        <button
          type="submit"
          disabled={submitting}
          className="inline-flex w-full items-center justify-center rounded-full border border-cyan-300 bg-cyan-500 px-6 py-3 text-sm font-semibold uppercase tracking-[0.24em] text-white shadow-md transition hover:bg-cyan-600 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? "Checking..." : "Enter Studio"}
        </button>
      </form>

      <Link
        href="/"
        className="mt-4 inline-flex w-full items-center justify-center rounded-full border border-stone-300 bg-white px-6 py-3 text-xs font-semibold uppercase tracking-[0.24em] text-stone-700 transition hover:bg-stone-50"
      >
        Back To Landing
      </Link>
    </section>
  );
}

function LoginFallback() {
  return (
    <section className="w-full rounded-[32px] border border-stone-200 bg-white/95 p-8 shadow-[0_30px_80px_-55px_rgba(15,23,42,0.55)]">
      <p className="text-xs uppercase tracking-[0.35em] text-stone-500">Montessori Digital Studio</p>
      <h1 className="mt-3 font-display text-3xl font-semibold text-stone-900">Login</h1>
      <p className="mt-2 text-sm text-stone-600">Loading login...</p>
    </section>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,#f5efe6_0%,#fdfbf8_48%,#f7efe4_100%)]">
      <main className="mx-auto flex min-h-screen w-full max-w-xl items-center justify-center px-6 py-12 sm:px-10">
        <Suspense fallback={<LoginFallback />}>
          <LoginCard />
        </Suspense>
      </main>
    </div>
  );
}
