"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";

function MicrosoftCallbackInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { loginWithMicrosoft } = useAuth();
  const [error, setError] = useState("");

  useEffect(() => {
    const code = searchParams.get("code");
    if (!code) {
      setError("Authorization code mungon");
      return;
    }

    const redirectUri = `${window.location.origin}/auth/microsoft/callback`;
    loginWithMicrosoft(code, redirectUri)
      .then(() => router.push("/"))
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : "Microsoft login dështoi");
      });
  }, [searchParams, loginWithMicrosoft, router]);

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="rounded-xl border border-red-200 bg-red-50 p-8 text-center">
          <p className="text-red-600">{error}</p>
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
