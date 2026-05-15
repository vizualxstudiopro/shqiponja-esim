"use client";

import { useEffect, useState, useRef, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";

function MicrosoftCallbackInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { loginWithMicrosoft } = useAuth();
  const [error, setError] = useState("");
  const attempted = useRef(false);
  const code = searchParams.get("code");

  useEffect(() => {
    if (attempted.current) return;
    attempted.current = true;
    if (!code) return;

    const redirectUri = `${window.location.origin}/auth/microsoft/callback`;
    loginWithMicrosoft(code, redirectUri)
      .then(() => router.push("/"))
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : "Microsoft login dështoi");
      });
  }, [code, loginWithMicrosoft, router]);

  const resolvedError = error || (!code ? "Authorization code mungon" : "");

  if (resolvedError) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="max-w-md w-full rounded-xl border border-red-200 bg-red-50 p-8 text-center dark:bg-red-900/20 dark:border-red-800">
          <p className="text-red-600 dark:text-red-400 font-medium">Autentifikimi me Microsoft dështoi</p>
          <p className="mt-2 text-sm text-red-500 dark:text-red-400/80 break-words">{resolvedError}</p>
          <a href="/hyr" className="mt-4 inline-block text-shqiponja hover:underline">
            Kthehu te hyrja
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-shqiponja border-t-transparent mx-auto" />
        <p className="mt-4 text-zinc-500">Po hyni me Microsoft...</p>
      </div>
    </div>
  );
}

export default function MicrosoftCallbackPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-shqiponja border-t-transparent" /></div>}>
      <MicrosoftCallbackInner />
    </Suspense>
  );
}
