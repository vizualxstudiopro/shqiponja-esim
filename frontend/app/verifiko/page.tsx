"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { verifyEmail } from "@/lib/api";
import Link from "next/link";
import { Suspense } from "react";

function VerifyContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("Token mungon nga URL-ja");
      return;
    }
    verifyEmail(token)
      .then((res) => {
        setStatus("success");
        setMessage(res.message);
      })
      .catch((err) => {
        setStatus("error");
        setMessage(err instanceof Error ? err.message : "Verifikimi dështoi");
      });
  }, [token]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 px-4 dark:bg-zinc-950">
      <div className="w-full max-w-sm rounded-2xl border border-zinc-200 bg-white p-8 text-center shadow-lg dark:border-zinc-800 dark:bg-zinc-900">
        {status === "loading" && (
          <>
            <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-shqiponja border-t-transparent" />
            <p className="mt-4 text-sm text-zinc-500 dark:text-zinc-400">Duke verifikuar...</p>
          </>
        )}

        {status === "success" && (
          <>
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
              <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="mt-4 text-xl font-extrabold dark:text-white">Email u Verifikua!</h1>
            <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">{message}</p>
            <Link
              href="/"
              className="mt-6 inline-block rounded-full bg-shqiponja px-6 py-2.5 text-sm font-semibold text-white hover:bg-shqiponja-dark transition"
            >
              Kthehu në Faqe
            </Link>
          </>
        )}

        {status === "error" && (
          <>
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
              <svg className="h-8 w-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h1 className="mt-4 text-xl font-extrabold dark:text-white">Verifikimi Dështoi</h1>
            <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">{message}</p>
            <Link
              href="/"
              className="mt-6 inline-block rounded-full bg-zinc-100 px-6 py-2.5 text-sm font-semibold text-zinc-700 hover:bg-zinc-200 transition dark:bg-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-600"
            >
              Kthehu në Faqe
            </Link>
          </>
        )}
      </div>
    </div>
  );
}

export default function VerifyPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center dark:bg-zinc-950">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-shqiponja border-t-transparent" />
        </div>
      }
    >
      <VerifyContent />
    </Suspense>
  );
}
