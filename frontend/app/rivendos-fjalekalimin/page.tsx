"use client";

import { useState, type FormEvent } from "react";
import { resetPassword } from "@/lib/api";
import { useI18n } from "@/lib/i18n-context";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";
import Logo from "@/components/logo";

function ResetForm() {
  const { t } = useI18n();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    if (password !== confirm) { setError(t("auth.passwordMismatch")); return; }
    setLoading(true);
    try {
      await resetPassword(token, password);
      setDone(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error");
    } finally {
      setLoading(false);
    }
  }

  if (!token) {
    return <p className="text-center text-red-500 mt-8">{t("auth.resetNoToken")}</p>;
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 px-4 dark:bg-zinc-950">
      <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-8 shadow-lg dark:border-zinc-800 dark:bg-zinc-900">
        <div className="text-center">
          <Logo size={48} className="mx-auto" />
          <h1 className="mt-2 text-2xl font-extrabold tracking-tight dark:text-white">
            {t("auth.resetTitle")}
          </h1>
        </div>

        {done ? (
          <div className="mt-6 rounded-lg bg-green-50 px-4 py-4 text-sm text-green-700 border border-green-100 text-center dark:bg-green-900/20 dark:text-green-400 dark:border-green-800">
            {t("auth.resetSuccess")}
            <Link href="/hyr" className="mt-3 block font-semibold text-shqiponja hover:underline">
              {t("nav.login")}
            </Link>
          </div>
        ) : (
          <>
            {error && (
              <div className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600 border border-red-100 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800">
                {error}
              </div>
            )}
            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">{t("auth.newPassword")}</label>
                <input
                  type="password" required minLength={6}
                  value={password} onChange={(e) => setPassword(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-zinc-300 px-4 py-2.5 text-sm outline-none transition focus:border-shqiponja focus:ring-2 focus:ring-shqiponja/20 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">{t("auth.confirmPassword")}</label>
                <input
                  type="password" required minLength={6}
                  value={confirm} onChange={(e) => setConfirm(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-zinc-300 px-4 py-2.5 text-sm outline-none transition focus:border-shqiponja focus:ring-2 focus:ring-shqiponja/20 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                />
              </div>
              <button type="submit" disabled={loading}
                className="w-full rounded-lg bg-shqiponja py-3 text-sm font-semibold text-white shadow-md shadow-shqiponja/25 transition hover:bg-shqiponja-dark disabled:opacity-50">
                {loading ? "..." : t("auth.resetBtn")}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-shqiponja border-t-transparent" /></div>}>
      <ResetForm />
    </Suspense>
  );
}
