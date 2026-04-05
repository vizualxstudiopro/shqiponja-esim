"use client";

import { useState } from "react";
import { checkout } from "@/lib/api";
import { useI18n } from "@/lib/i18n-context";

interface Props {
  packageId: number;
  price: number;
}

export default function OrderForm({ packageId, price }: Props) {
  const { t } = useI18n();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!email.trim()) {
      setError(t("buy.emailRequired"));
      return;
    }

    setLoading(true);
    try {
      const result = await checkout(packageId, email.trim());

      // Redirect to checkout URL (Lemon Squeezy hosted page or direct order page in dev mode)
      if (result.url) {
        window.location.href = result.url;
        return;
      }

      setError(t("buy.error"));
      setLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("buy.error"));
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6 space-y-4">
      <div>
        <label
          htmlFor="email"
          className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
        >
          {t("buy.emailLabel")}
        </label>
        <input
          id="email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="emri@shembull.com"
          autoComplete="email"
          className="mt-1.5 block w-full rounded-xl border border-zinc-300 px-4 py-3 text-sm shadow-sm outline-none transition focus:border-shqiponja focus:ring-2 focus:ring-shqiponja/20 dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-100"
        />
      </div>

      {error && (
        <p className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-xl bg-shqiponja py-3.5 text-base font-semibold text-white shadow-lg shadow-shqiponja/25 transition hover:bg-shqiponja-dark disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? t("buy.processing") : `${t("buy.pay")} €${Number(price).toFixed(2)}`}
      </button>

      <p className="text-center text-xs text-zinc-400">
        {t("buy.termsNote")}
      </p>
    </form>
  );
}
