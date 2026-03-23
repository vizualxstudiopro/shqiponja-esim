"use client";

import Link from "next/link";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 px-4 dark:bg-zinc-950">
      <div className="text-center">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
          <svg className="h-10 w-10 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
          </svg>
        </div>
        <h1 className="mt-6 text-2xl font-extrabold dark:text-white">Diçka shkoi keq!</h1>
        <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
          Ndodhi një gabim i papritur. Provo përsëri.
        </p>
        {error.digest && (
          <p className="mt-1 text-xs text-zinc-400 dark:text-zinc-500">
            Kodi: {error.digest}
          </p>
        )}
        <div className="mt-6 flex justify-center gap-3">
          <button
            onClick={reset}
            className="rounded-full bg-shqiponja px-6 py-2.5 text-sm font-semibold text-white hover:bg-shqiponja-dark transition"
          >
            Provo Përsëri
          </button>
          <Link
            href="/"
            className="rounded-full border border-zinc-200 px-6 py-2.5 text-sm font-semibold text-zinc-700 hover:bg-zinc-100 transition dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            Faqja Kryesore
          </Link>
        </div>
      </div>
    </div>
  );
}
