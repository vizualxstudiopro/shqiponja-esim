"use client";

import { useState, type FormEvent } from "react";
import { forgotPassword } from "@/lib/api";
import { useI18n } from "@/lib/i18n-context";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const { t } = useI18n();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    await forgotPassword(email);
    setSent(true);
    setLoading(false);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 px-4 dark:bg-zinc-950">
      <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-8 shadow-lg dark:border-zinc-800 dark:bg-zinc-900">
        <div className="text-center">
          <span className="text-4xl">🦅</span>
          <h1 className="mt-2 text-2xl font-extrabold tracking-tight dark:text-white">
            {t("auth.forgotTitle")}
          </h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            {t("auth.forgotSubtitle")}
          </p>
        </div>

        {sent ? (
          <div className="mt-6 rounded-lg bg-green-50 px-4 py-4 text-sm text-green-700 border border-green-100 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800">
            {t("auth.forgotSent")}
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                {t("auth.email")}
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="emri@email.com"
                className="mt-1 w-full rounded-lg border border-zinc-300 px-4 py-2.5 text-sm outline-none transition focus:border-shqiponja focus:ring-2 focus:ring-shqiponja/20 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-shqiponja py-3 text-sm font-semibold text-white shadow-md shadow-shqiponja/25 transition hover:bg-shqiponja-dark disabled:opacity-50"
            >
              {loading ? "..." : t("auth.forgotBtn")}
            </button>
          </form>
        )}

        <p className="mt-6 text-center text-sm text-zinc-500 dark:text-zinc-400">
          <Link href="/hyr" className="font-semibold text-shqiponja hover:underline">
            {t("nav.login")}
          </Link>
        </p>
      </div>
    </div>
  );
}
