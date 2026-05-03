"use client";

import { useState, type FormEvent } from "react";
import { useAuth } from "@/lib/auth-context";
import { useI18n } from "@/lib/i18n-context";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import OAuthButtons from "@/components/oauth-buttons";
import Logo from "@/components/logo";

export default function LoginPage() {
  const { login } = useAuth();
  const { t } = useI18n();
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawNext = searchParams.get("next");
  const nextPath = rawNext && rawNext.startsWith("/") && !rawNext.startsWith("//") ? rawNext : null;
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [totpCode, setTotpCode] = useState("");
  const [needs2FA, setNeeds2FA] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const result = await login(email, password, needs2FA ? totpCode : undefined);
      if (result.requires2FA) {
        setNeeds2FA(true);
        setLoading(false);
        return;
      }
      if (nextPath) {
        router.push(nextPath);
        return;
      }

      // Get fresh user to check role for redirect
      const saved = localStorage.getItem("token");
      if (saved) {
        try {
          const payload = JSON.parse(atob(saved.split(".")[1]));
          if (payload.role === "admin") {
            router.push("/admin");
            return;
          }
        } catch {}
      }
      router.push("/");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Diçka shkoi keq");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 px-4 dark:bg-zinc-950">
      <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-8 shadow-lg dark:border-zinc-700 dark:bg-zinc-800">
        <div className="text-center">
          <Logo size={80} variant="icon" className="mx-auto" />
          <h1 className="mt-2 text-2xl font-extrabold tracking-tight">
            {t("auth.loginTitle")}
          </h1>
          <p className="mt-1 text-sm text-zinc-500">
            {t("auth.loginSubtitle")}
          </p>
        </div>

        {error && (
          <div className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600 border border-red-100">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              {t("auth.email")}
            </label>
            <input
              id="email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="emri@email.com"
              className="mt-1 w-full rounded-lg border border-zinc-300 px-4 py-2.5 text-sm outline-none transition focus:border-shqiponja focus:ring-2 focus:ring-shqiponja/20 dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-100"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              {t("auth.password")}
            </label>
            <input
              id="password"
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="mt-1 w-full rounded-lg border border-zinc-300 px-4 py-2.5 text-sm outline-none transition focus:border-shqiponja focus:ring-2 focus:ring-shqiponja/20 dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-100"
            />
          </div>

          {needs2FA && (
            <div>
              <label htmlFor="totpCode" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                {t("auth.totpCode")}
              </label>
              <p className="mt-0.5 text-xs text-zinc-500">{t("auth.totpHint")}</p>
              <input
                id="totpCode"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                required
                autoFocus
                autoComplete="one-time-code"
                value={totpCode}
                onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, ""))}
                placeholder="000000"
                className="mt-1 w-full rounded-lg border border-zinc-300 px-4 py-2.5 text-center text-lg font-mono tracking-[0.3em] outline-none transition focus:border-shqiponja focus:ring-2 focus:ring-shqiponja/20 dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-100"
              />
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-shqiponja py-3 text-sm font-semibold text-white shadow-md shadow-shqiponja/25 transition hover:bg-shqiponja-dark disabled:opacity-50"
          >
            {loading ? t("auth.loggingIn") : t("auth.loginBtn")}
          </button>
        </form>

        <OAuthButtons mode="login" />

        <p className="mt-4 text-center">
          <Link href="/harrova-fjalekalimin" className="text-sm text-shqiponja hover:underline">
            {t("auth.forgotLink")}
          </Link>
        </p>

        <p className="mt-4 text-center text-sm text-zinc-500">
          {t("auth.noAccount")}{" "}
          <Link href="/regjistrohu" className="font-semibold text-shqiponja hover:underline">
            {t("nav.register")}
          </Link>
        </p>
      </div>
    </div>
  );
}
