"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { Suspense } from "react";

function AppleCallbackInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { loginWithApple } = useAuth();
  const [error, setError] = useState("");

  useEffect(() => {
    const token = searchParams.get("token");
    const err = searchParams.get("error");

    if (err) {
      setError(err);
      return;
    }

    if (token) {
      // Backend already validated Apple token — just store the session
      loginWithApple(token)
        .then(() => router.replace("/"))
        .catch((e) => setError(e instanceof Error ? e.message : "Autentifikimi dështoi"));
    } else {
      setError("Token mungon");
    }
  }, [searchParams, loginWithApple, router]);

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="rounded-lg bg-red-50 p-6 text-center dark:bg-red-900/20">
          <p className="text-red-600 dark:text-red-400">{error}</p>
          <a href="/hyr" className="mt-3 inline-block text-sm font-semibold text-shqiponja hover:underline">
            Kthehu te hyrja
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-shqiponja border-t-transparent" />
    </div>
  );
}

export default function AppleCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-shqiponja border-t-transparent" />
        </div>
      }
    >
      <AppleCallbackInner />
    </Suspense>
  );
}
