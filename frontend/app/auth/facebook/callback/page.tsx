"use client";

import { useEffect, useState, useRef, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";

function FacebookCallbackInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { loginWithFacebook } = useAuth();
  const [error, setError] = useState("");
  const attempted = useRef(false);

  useEffect(() => {
    if (attempted.current) return;
    attempted.current = true;

    const code = searchParams.get("code");
    const fbError = searchParams.get("error_description") || searchParams.get("error");
    
    if (fbError) {
      setError(fbError);
      return;
    }

    if (!code) {
      setError("Authorization code mungon");
      return;
    }

    const redirectUri = `${window.location.origin}/auth/facebook/callback`;
    loginWithFacebook(code, redirectUri)
      .then(() => router.push("/"))
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : "Facebook login dështoi");
      });
  }, [searchParams, loginWithFacebook, router]);

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="max-w-md w-full rounded-xl border border-red-200 bg-red-50 p-8 text-center dark:bg-red-900/20 dark:border-red-800">
          <p className="text-red-600 dark:text-red-400 font-medium">Autentifikimi me Facebook dështoi</p>
          <p className="mt-2 text-sm text-red-500 dark:text-red-400/80 break-words">{error}</p>
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
        <p className="mt-4 text-zinc-500">Po hyni me Facebook...</p>
      </div>
    </div>
  );
}

export default function FacebookCallbackPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-shqiponja border-t-transparent" /></div>}>
      <FacebookCallbackInner />
    </Suspense>
  );
}
