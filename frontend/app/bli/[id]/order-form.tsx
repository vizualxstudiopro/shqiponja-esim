"use client";

import { useState } from "react";
import { checkout, validatePromo } from "@/lib/api";
import { useI18n } from "@/lib/i18n-context";
import Link from "next/link";
import { trackBeginCheckout } from "@/lib/analytics";

interface Props {
  packageId: number;
  price: number;
  packageName: string;
}

export default function OrderForm({ packageId, price, packageName }: Props) {
  const { t } = useI18n();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [promoCode, setPromoCode] = useState("");
  const [promoApplied, setPromoApplied] = useState<{ code: string; discountAmount: number; finalPrice: number } | null>(null);
  const [promoLoading, setPromoLoading] = useState(false);
  const [promoError, setPromoError] = useState("");
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const displayPrice = promoApplied ? promoApplied.finalPrice : price;

  async function handleApplyPromo() {
    if (!promoCode.trim()) return;
    setPromoError("");
    setPromoLoading(true);
    try {
      const result = await validatePromo(promoCode.trim(), price);
      setPromoApplied({ code: result.code, discountAmount: result.discountAmount, finalPrice: result.finalPrice });
    } catch (err) {
      setPromoError(err instanceof Error ? err.message : t("promo.invalid"));
      setPromoApplied(null);
    } finally {
      setPromoLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitted) return;
    setError("");

    if (!name.trim()) {
      setError(t("buy.nameRequired"));
      return;
    }
    if (!email.trim()) {
      setError(t("buy.emailRequired"));
      return;
    }
    if (!termsAccepted) {
      setError(t("buy.termsRequired"));
      return;
    }

    setSubmitted(true);
    setLoading(true);
    trackBeginCheckout({ value: displayPrice, currency: "EUR", packageName });
    try {
      const result = await checkout(
        packageId,
        email.trim(),
        name.trim(),
        phone.trim() || undefined,
        promoApplied?.code
      );

      // Store order token in localStorage before redirecting (LS may strip query params)
      if (result.orderId && result.accessToken) {
        try {
          localStorage.setItem(`order_token_${result.orderId}`, result.accessToken);
        } catch { /* localStorage unavailable */ }
      }

      // Redirect to checkout URL (Lemon Squeezy hosted page or direct order page in dev mode)
      if (result.url) {
        window.location.href = result.url;
        return;
      }

      setError(t("buy.error"));
      setLoading(false);
      setSubmitted(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("buy.error"));
      setLoading(false);
      setSubmitted(false);
    }
  }

  const inputClass =
    "mt-1.5 block w-full rounded-xl border border-zinc-300 px-4 py-3 text-sm shadow-sm outline-none transition focus:border-shqiponja focus:ring-2 focus:ring-shqiponja/20 dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-100";

  return (
    <form onSubmit={handleSubmit} className="mt-6 space-y-5">
      {/* Name */}
      <div>
        <label
          htmlFor="name"
          className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
        >
          {t("buy.nameLabel")} <span className="text-red-500">*</span>
        </label>
        <input
          id="name"
          type="text"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={t("buy.namePlaceholder")}
          autoComplete="name"
          className={inputClass}
        />
      </div>

      {/* Email */}
      <div>
        <label
          htmlFor="email"
          className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
        >
          {t("buy.emailLabel")} <span className="text-red-500">*</span>
        </label>
        <input
          id="email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={t("buy.emailPlaceholder")}
          autoComplete="email"
          className={inputClass}
        />
      </div>

      {/* Phone */}
      <div>
        <label
          htmlFor="phone"
          className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
        >
          {t("buy.phoneLabel")}
        </label>
        <input
          id="phone"
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder={t("buy.phonePlaceholder")}
          autoComplete="tel"
          className={inputClass}
        />
      </div>

      {/* Promo Code */}
      <div>
        <label
          htmlFor="promo"
          className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
        >
          {t("promo.label")}
        </label>
        <div className="mt-1.5 flex gap-2">
          <input
            id="promo"
            type="text"
            value={promoCode}
            onChange={(e) => {
              setPromoCode(e.target.value.toUpperCase());
              if (promoApplied) { setPromoApplied(null); setPromoError(""); }
            }}
            placeholder={t("promo.placeholder")}
            className="block flex-1 rounded-xl border border-zinc-300 px-4 py-3 text-sm shadow-sm outline-none transition focus:border-shqiponja focus:ring-2 focus:ring-shqiponja/20 dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-100"
          />
          <button
            type="button"
            onClick={handleApplyPromo}
            disabled={promoLoading || !promoCode.trim() || !!promoApplied}
            className="rounded-xl bg-zinc-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            {promoLoading ? "..." : promoApplied ? "✓" : t("promo.apply")}
          </button>
        </div>
        {promoError && (
          <p className="mt-1 text-xs text-red-500">{promoError}</p>
        )}
        {promoApplied && (
          <p className="mt-1 text-xs text-green-600 dark:text-green-400">
            {t("promo.applied")} — {t("promo.saved")} €{promoApplied.discountAmount.toFixed(2)}
          </p>
        )}
      </div>

      {/* Terms checkbox */}
      <div className="flex items-start gap-3">
        <input
          id="terms"
          type="checkbox"
          checked={termsAccepted}
          onChange={(e) => setTermsAccepted(e.target.checked)}
          className="mt-1 h-4 w-4 rounded border-zinc-300 text-shqiponja focus:ring-shqiponja/20 dark:border-zinc-600"
        />
        <label htmlFor="terms" className="text-sm text-zinc-600 dark:text-zinc-400">
          {t("buy.termsAgree")}{" "}
          <Link href="/kushtet" className="text-shqiponja underline hover:text-shqiponja-dark">
            {t("buy.termsLink")}
          </Link>{" "}
          {t("buy.andText")}{" "}
          <Link href="/privatesia" className="text-shqiponja underline hover:text-shqiponja-dark">
            {t("buy.privacyLink")}
          </Link>
        </label>
      </div>

      {error && (
        <p className="rounded-lg bg-red-50 px-4 py-2.5 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={loading || submitted}
        className="w-full rounded-xl bg-shqiponja py-3.5 text-base font-semibold text-white shadow-lg shadow-shqiponja/25 transition hover:bg-shqiponja-dark disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? t("buy.processing") : `${t("buy.pay")} €${Number(displayPrice).toFixed(2)}`}
      </button>
    </form>
  );
}
