"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  PaymentElement,
  Elements,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { checkout, validatePromo } from "@/lib/api";
import { useI18n } from "@/lib/i18n-context";
import Link from "next/link";
import { trackBeginCheckout } from "@/lib/analytics";

interface Props {
  packageId: number;
  price: number;
  packageName: string;
}

const stripePromise = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
  ? loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)
  : null;

const appearance = {
  theme: "night" as const,
  variables: {
    colorPrimary: "#D8001E",
    colorBackground: "#161616",
    colorText: "#F5F0EB",
    colorDanger: "#FF4444",
    colorTextPlaceholder: "#666",
    fontFamily: "DM Sans, var(--font-geist-sans), sans-serif",
    borderRadius: "10px",
    spacingUnit: "4px",
  },
  rules: {
    ".Input": {
      border: "1px solid #2a2a2a",
      backgroundColor: "#1A1A1A",
      padding: "12px 14px",
      boxShadow: "none",
    },
    ".Input:focus": {
      border: "1px solid #D8001E",
      boxShadow: "0 0 0 2px rgba(216,0,30,0.18)",
    },
    ".Label": {
      color: "#888",
      fontSize: "11px",
      letterSpacing: "0.1em",
      textTransform: "uppercase",
      fontWeight: "600",
    },
    ".Tab": { border: "1px solid #2a2a2a", backgroundColor: "#1A1A1A" },
    ".Tab:hover": { backgroundColor: "#222" },
    ".Tab--selected": { border: "1px solid #D8001E", backgroundColor: "#1A1A1A" },
    ".TabIcon--selected": { fill: "#D8001E" },
    ".TabLabel--selected": { color: "#D8001E" },
  },
};

/* ─── Faza 2: Formulari i pagesës ─── */
interface PaymentStepProps {
  orderId: number;
  accessToken: string;
  email: string;
  displayPrice: number;
  packageName: string;
  onError: (msg: string) => void;
  onBack: () => void;
}

function PaymentStep({ orderId, accessToken, email, displayPrice, packageName, onError, onBack }: PaymentStepProps) {
  const stripe = useStripe();
  const elements = useElements();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [elementReady, setElementReady] = useState(false);

  async function handlePay() {
    if (!stripe || !elements) return;
    if (!termsAccepted) {
      onError("Duhet të pranoni Kushtet e Shërbimit para pagesës.");
      return;
    }
    onError("");
    setLoading(true);

    const origin = typeof window !== "undefined" ? window.location.origin : "https://shqiponjaesim.com";
    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${origin}/porosi/${orderId}?token=${accessToken}&checkout=success`,
        receipt_email: email,
      },
      redirect: "if_required",
    });

    if (error) {
      onError(error.message || "Pagesa dështoi. Provo përsëri.");
      setLoading(false);
    } else if (paymentIntent?.status === "succeeded" || paymentIntent?.status === "processing") {
      // Pagesa nuk kërkoi redirect — navigoj manualisht
      router.push(`/porosi/${orderId}?token=${accessToken}&checkout=success`);
    }
  }

  return (
    <div className="space-y-4">
      {/* Emri i paketës */}
      <div className="rounded-xl border border-white/10 bg-zinc-800/40 px-4 py-3 flex items-center justify-between">
        <div>
          <p className="text-xs text-zinc-500 uppercase tracking-wider">Paketë</p>
          <p className="text-sm font-semibold text-white">{packageName}</p>
          <p className="text-xs text-zinc-400">{email}</p>
        </div>
        <div className="text-right">
          <p className="text-lg font-bold text-white">€{Number(displayPrice).toFixed(2)}</p>
          <button onClick={onBack} className="text-xs text-zinc-500 hover:text-white transition mt-0.5">
            ← Ndrysho
          </button>
        </div>
      </div>

      {/* Stripe PaymentElement: GPay / Apple Pay / Kartë */}
      {!elementReady && (
        <div className="flex items-center justify-center rounded-xl border border-white/10 bg-zinc-800/40 py-8">
          <svg className="h-5 w-5 animate-spin text-zinc-400" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <span className="ml-2 text-sm text-zinc-400">Duke ngarkuar formularin e pagesës...</span>
        </div>
      )}
      <PaymentElement
        onReady={() => setElementReady(true)}
        onLoadError={(e) => onError("Gabim duke ngarkuar pagesën: " + (e.error?.message || "Provo të rifreskosh faqen."))}
        options={{
          layout: "tabs",
          fields: {
            billingDetails: {
              name: "auto",
              email: "never",
            },
          },
          wallets: { googlePay: "auto", applePay: "auto" },
        }}
      />

      {/* Kushtet */}
      <div className="flex items-start gap-3 rounded-xl border border-white/10 bg-zinc-800/30 px-4 py-3">
        <input
          id="terms-pay"
          type="checkbox"
          checked={termsAccepted}
          onChange={(e) => setTermsAccepted(e.target.checked)}
          className="mt-0.5 h-4 w-4 cursor-pointer rounded border-zinc-600 accent-[#D8001E]"
        />
        <label htmlFor="terms-pay" className="cursor-pointer text-sm text-zinc-400 leading-relaxed">
          Duke klikuar <strong className="text-white">Bli Tani</strong>, pranoj{" "}
          <Link href="/kushtet" className="text-[#D8001E] hover:underline" target="_blank">
            Kushtet e Shërbimit
          </Link>{" "}
          dhe{" "}
          <Link href="/privatesia" className="text-[#D8001E] hover:underline" target="_blank">
            Politikën e Privatësisë
          </Link>.
        </label>
      </div>

      {/* Butoni Bli Tani */}
      <button
        type="button"
        onClick={handlePay}
        disabled={loading || !stripe || !elements}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#D8001E] px-4 py-4 text-base font-bold text-white shadow-lg shadow-[#D8001E]/20 transition hover:bg-[#b80019] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
        <span>{loading ? "Duke procesuar..." : `Bli Tani — €${Number(displayPrice).toFixed(2)}`}</span>
      </button>

      <p className="text-center text-xs text-zinc-500">🔒 Pagesa procësohet nga Stripe • SSL • PCI DSS</p>
    </div>
  );
}

/* ─── Komponenti kryesor ─── */
export default function OrderForm({ packageId, price, packageName }: Props) {
  const { t } = useI18n();

  // Faza 1: info
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [promoCode, setPromoCode] = useState("");
  const [promoApplied, setPromoApplied] = useState<{ code: string; discountAmount: number; finalPrice: number } | null>(null);
  const [promoLoading, setPromoLoading] = useState(false);
  const [promoError, setPromoError] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Faza 2: pagesa
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [orderId, setOrderId] = useState<number | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);

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

  async function handleContinue(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) {
      setError(t("buy.emailRequired") || "Email-i është i detyrueshëm.");
      return;
    }
    setError("");
    setLoading(true);
    trackBeginCheckout({ value: displayPrice, currency: "EUR", packageName });

    try {
      const result = await checkout(packageId, email.trim(), undefined, phone.trim() || undefined, promoApplied?.code);
      if (!result.clientSecret || !result.orderId || !result.accessToken) {
        throw new Error("Gabim gjatë inicializimit të pagesës. Provo përsëri.");
      }
      try { localStorage.setItem(`order_token_${result.orderId}`, result.accessToken); } catch {}
      setClientSecret(result.clientSecret);
      setOrderId(result.orderId);
      setAccessToken(result.accessToken);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gabim. Provo përsëri.");
    } finally {
      setLoading(false);
    }
  }

  const inputClass =
    "mt-1.5 block w-full rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-3 text-sm text-zinc-100 placeholder:text-zinc-500 shadow-sm outline-none transition focus:border-[#D8001E] focus:ring-2 focus:ring-[#D8001E]/20";

  /* ─── Faza 2: PaymentElement ─── */
  if (clientSecret && orderId && accessToken && stripePromise) {
    return (
      <div className="mt-6 space-y-4">
        {error && (
          <div className="rounded-xl border border-[#D8001E]/30 bg-[#D8001E]/10 px-4 py-3 text-sm text-[#D8001E]">
            {error}
          </div>
        )}
        <Elements stripe={stripePromise} options={{ clientSecret, appearance }}>
          <PaymentStep
            orderId={orderId}
            accessToken={accessToken}
            email={email}
            displayPrice={displayPrice}
            packageName={packageName}
            onError={setError}
            onBack={() => { setClientSecret(null); setOrderId(null); setAccessToken(null); setError(""); }}
          />
        </Elements>
      </div>
    );
  }

  /* ─── Faza 1: Email + Telefon + Promo ─── */
  return (
    <form onSubmit={handleContinue} className="mt-6 space-y-5">

      {/* Email */}
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-zinc-300">
          {t("buy.emailLabel")} <span className="text-[#D8001E]">*</span>
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
        <p className="mt-1 text-xs text-zinc-500">
          {t("buy.emailHint") || "eSIM-i dhe QR kodi do të dërgohen në këtë adresë."}
        </p>
      </div>

      {/* Telefon */}
      <div>
        <label htmlFor="phone" className="block text-sm font-medium text-zinc-300">
          {t("buy.phoneLabel")}
          <span className="ml-1 text-xs font-normal text-zinc-500">({t("buy.optional") || "opsional"})</span>
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

      {/* Kodi i zbritjes */}
      <div>
        <label htmlFor="promo" className="block text-sm font-medium text-zinc-300">
          {t("promo.label")}
          <span className="ml-1 text-xs font-normal text-zinc-500">({t("buy.optional") || "opsional"})</span>
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
            disabled={!!promoApplied}
            className="block flex-1 rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-3 text-sm text-zinc-100 placeholder:text-zinc-500 outline-none transition focus:border-[#D8001E] focus:ring-2 focus:ring-[#D8001E]/20 disabled:opacity-50"
          />
          <button
            type="button"
            onClick={handleApplyPromo}
            disabled={promoLoading || !promoCode.trim() || !!promoApplied}
            className="rounded-xl bg-zinc-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-zinc-600 disabled:opacity-50"
          >
            {promoLoading ? "..." : promoApplied ? "✓" : t("promo.apply")}
          </button>
        </div>
        {promoError && <p className="mt-1.5 text-xs text-[#D8001E]">{promoError}</p>}
        {promoApplied && (
          <p className="mt-1.5 text-xs text-emerald-400">
            ✓ {t("promo.applied")} — {t("promo.saved")} €{promoApplied.discountAmount.toFixed(2)}
          </p>
        )}
      </div>

      {/* Çmimi (me zbritje) */}
      {promoApplied && (
        <div className="rounded-xl border border-emerald-800/40 bg-emerald-900/20 px-4 py-3 space-y-1 text-sm">
          <div className="flex justify-between text-zinc-400">
            <span>Çmimi bazë</span>
            <span className="line-through">€{price.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-emerald-400">
            <span>Zbritje ({promoApplied.code})</span>
            <span>-€{promoApplied.discountAmount.toFixed(2)}</span>
          </div>
          <div className="flex justify-between font-bold text-white pt-1 border-t border-emerald-800/40">
            <span>Totali</span>
            <span>€{promoApplied.finalPrice.toFixed(2)}</span>
          </div>
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-[#D8001E]/30 bg-[#D8001E]/10 px-4 py-3 text-sm text-[#D8001E]">
          {error}
        </div>
      )}

      {!stripePromise && (
        <div className="rounded-xl border border-yellow-800/40 bg-yellow-900/20 px-4 py-3 text-sm text-yellow-400">
          Pagesa është e paaktivizuar. Kontakto support.
        </div>
      )}

      <button
        type="submit"
        disabled={loading || !stripePromise}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#D8001E] px-4 py-4 text-base font-bold text-white shadow-lg shadow-[#D8001E]/20 transition hover:bg-[#b80019] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
        <span>
          {loading ? "Duke inicializuar..." : `Vazhdo me Pagesën — €${Number(displayPrice).toFixed(2)}`}
        </span>
      </button>

      <p className="text-center text-xs text-zinc-500">🔒 Pagesa procësohet nga Stripe • SSL • PCI DSS</p>
    </form>
  );
}


interface Props {
  packageId: number;
  price: number;
  packageName: string;
}

function LockIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
    </svg>
  );
}

export default function OrderForm({ packageId, price, packageName }: Props) {
  const { t } = useI18n();
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [promoCode, setPromoCode] = useState("");
  const [promoApplied, setPromoApplied] = useState<{ code: string; discountAmount: number; finalPrice: number } | null>(null);
  const [promoLoading, setPromoLoading] = useState(false);
  const [promoError, setPromoError] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

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
    if (!email.trim()) {
      setError(t("buy.emailRequired") || "Email-i është i detyrueshëm.");
      return;
    }
    setError("");
    setLoading(true);

    trackBeginCheckout({ value: displayPrice, currency: "EUR", packageName });

    try {
      const result = await checkout(
        packageId,
        email.trim(),
        undefined,
        phone.trim() || undefined,
        promoApplied?.code
      );

      if (!result.url) throw new Error("URL e Stripe Checkout mungon.");

      // Ruaj tokenin vendor para redirect-it
      if (result.orderId && result.accessToken) {
        try { localStorage.setItem(`order_token_${result.orderId}`, result.accessToken); } catch {}
      }

      window.location.href = result.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Pagesa dështoi. Provo përsëri.");
      setLoading(false);
    }
  }

  const inputClass =
    "mt-1.5 block w-full rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-3 text-sm text-zinc-100 placeholder:text-zinc-500 shadow-sm outline-none transition focus:border-[#D8001E] focus:ring-2 focus:ring-[#D8001E]/20";

  return (
    <form onSubmit={handleSubmit} className="mt-6 space-y-5">

      {/* Email */}
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-zinc-300">
          {t("buy.emailLabel")} <span className="text-[#D8001E]">*</span>
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
        <p className="mt-1 text-xs text-zinc-500">
          {t("buy.emailHint") || "eSIM-i dhe QR kodi do të dërgohen në këtë adresë."}
        </p>
      </div>

      {/* Phone */}
      <div>
        <label htmlFor="phone" className="block text-sm font-medium text-zinc-300">
          {t("buy.phoneLabel")}{" "}
          <span className="text-zinc-500 font-normal text-xs">({t("buy.optional") || "opsional"})</span>
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
        <label htmlFor="promo" className="block text-sm font-medium text-zinc-300">
          {t("promo.label")}{" "}
          <span className="text-zinc-500 font-normal text-xs">({t("buy.optional") || "opsional"})</span>
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
            disabled={!!promoApplied}
            className="block flex-1 rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-3 text-sm text-zinc-100 placeholder:text-zinc-500 outline-none transition focus:border-[#D8001E] focus:ring-2 focus:ring-[#D8001E]/20 disabled:opacity-50"
          />
          <button
            type="button"
            onClick={handleApplyPromo}
            disabled={promoLoading || !promoCode.trim() || !!promoApplied}
            className="rounded-xl bg-zinc-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-zinc-600 disabled:opacity-50"
          >
            {promoLoading ? "..." : promoApplied ? "✓" : t("promo.apply")}
          </button>
        </div>
        {promoError && <p className="mt-1.5 text-xs text-[#D8001E]">{promoError}</p>}
        {promoApplied && (
          <p className="mt-1.5 text-xs text-emerald-400">
            ✓ {t("promo.applied")} — {t("promo.saved")} €{promoApplied.discountAmount.toFixed(2)}
          </p>
        )}
      </div>

      {/* Divider */}
      <div className="relative py-1">
        <div className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-white/10" />
        <span className="relative z-10 bg-[#0F0F0F] px-3 text-xs uppercase tracking-widest text-zinc-500">
          Pagesa e sigurt
        </span>
      </div>

      {/* Payment methods hint */}
      <div className="rounded-xl border border-zinc-700/50 bg-zinc-800/50 px-4 py-3">
        <p className="text-xs text-zinc-400 text-center mb-2">Metodat e pagesës</p>
        <div className="flex items-center justify-center gap-4 flex-wrap">
          {/* Visa */}
          <svg viewBox="0 0 48 32" className="h-6 w-auto opacity-80" fill="none"><rect width="48" height="32" rx="4" fill="#1A1F71"/><path d="M19.5 21h-3l1.9-11h3l-1.9 11zm12.3-10.7c-.6-.2-1.5-.5-2.7-.5-3 0-5 1.5-5 3.7 0 1.6 1.5 2.5 2.6 3 1.1.6 1.5 1 1.5 1.5 0 .8-1 1.2-1.8 1.2-1.2 0-1.9-.2-2.9-.6l-.4-.2-.4 2.5c.7.3 2 .6 3.4.6 3.2 0 5.2-1.5 5.2-3.8 0-1.3-.8-2.2-2.5-3-.9-.5-1.5-.8-1.5-1.3 0-.5.5-1 1.6-1 .9 0 1.6.2 2.1.4l.3.1.5-2.6zm7.9-.3h-2.3c-.7 0-1.3.2-1.6 1L32 21h3.2l.6-1.7h3.9l.4 1.7H43l-2.6-11h-0.7zm-3.3 7.1l1.2-3.3.2-.5.3 1.5.7 2.3h-2.4zM16 10l-2.8 7.5-.3-1.5c-.5-1.8-2.2-3.7-4-4.7l2.7 9.7h3.2L19.2 10H16z" fill="white"/></svg>
          {/* Mastercard */}
          <svg viewBox="0 0 48 32" className="h-6 w-auto opacity-80" fill="none"><rect width="48" height="32" rx="4" fill="#252525"/><circle cx="19" cy="16" r="8" fill="#EB001B"/><circle cx="29" cy="16" r="8" fill="#F79E1B"/><path d="M24 10.3A8 8 0 0 0 21 16a8 8 0 0 0 3 5.7A8 8 0 0 0 27 16a8 8 0 0 0-3-5.7z" fill="#FF5F00"/></svg>
          {/* Apple Pay */}
          <svg viewBox="0 0 50 20" className="h-5 w-auto opacity-80" fill="white"><text x="2" y="15" fontFamily="sans-serif" fontSize="14" fontWeight="600"> Pay</text></svg>
          {/* Google Pay */}
          <span className="text-xs font-semibold text-zinc-300 opacity-80 tracking-tight">G Pay</span>
        </div>
        <p className="mt-2.5 text-center text-xs text-zinc-500">
          Emri, karta dhe kushtet do të plotësohen në faqen e Stripe
        </p>
      </div>

      {error && (
        <div className="rounded-xl border border-[#D8001E]/30 bg-[#D8001E]/10 px-4 py-3 text-sm text-[#D8001E]">
          {error}
        </div>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={loading}
        className="flex w-full items-center justify-center gap-2.5 rounded-xl bg-[#D8001E] px-4 py-4 text-base font-bold text-white shadow-lg shadow-[#D8001E]/20 transition hover:bg-[#b80019] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
      >
        <LockIcon />
        <span>
          {loading
            ? "Duke hapur Stripe..."
            : `Bli Tani — €${Number(displayPrice).toFixed(2)}`}
        </span>
      </button>

      <p className="text-center text-xs text-zinc-500">
        Do të ridrejtohesh te Stripe për pagesë të sigurt. 🔒 SSL
      </p>

      <p className="text-center text-xs text-zinc-500">
        Ke nevojë për ndihmë?{" "}
        <Link href="/kontakti" className="text-[#D8001E] hover:underline">
          Na kontakto
        </Link>
      </p>
    </form>
  );
}


interface Props {
  packageId: number;
  price: number;
  packageName: string;
}

const stripePromise = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
  ? loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)
  : null;

const elementStyle = {
  base: {
    color: "#F5F0EB",
    fontFamily: "DM Sans, var(--font-geist-sans), sans-serif",
    fontSize: "16px",
    "::placeholder": { color: "#666" },
    backgroundColor: "transparent",
  },
  invalid: { color: "#FF4444" },
};

const appearance = {
  theme: "night" as const,
  variables: {
    colorPrimary: "#D8001E",
    colorBackground: "#1A1A1A",
    colorText: "#F5F0EB",
    colorDanger: "#FF4444",
    fontFamily: "DM Sans, var(--font-geist-sans), sans-serif",
    borderRadius: "8px",
    spacingUnit: "4px",
  },
  rules: {
    ".Input": {
      border: "1px solid #333",
      backgroundColor: "#1A1A1A",
      padding: "12px 16px",
    },
    ".Input:focus": {
      border: "1px solid #D8001E",
      boxShadow: "0 0 0 2px rgba(216,0,30,0.2)",
    },
    ".Label": {
      color: "#888",
      fontSize: "12px",
      letterSpacing: "0.08em",
      textTransform: "uppercase",
    },
  },
};

interface PaymentFieldsProps {
  packageId: number;
  packageName: string;
  name: string;
  email: string;
  phone: string;
  promoCode?: string;
  displayPrice: number;
  termsAccepted: boolean;
  onError: (message: string) => void;
  onLoading: (loading: boolean) => void;
  loading: boolean;
}

function getCheckoutErrorMessage(error: unknown) {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  if (
    typeof error === "object" &&
    error !== null &&
    "message" in error &&
    typeof (error as { message?: unknown }).message === "string"
  ) {
    return (error as { message: string }).message;
  }

  return "Pagesa dështoi.";
}

function PaymentFields({
  packageId,
  packageName,
  name,
  email,
  phone,
  promoCode,
  displayPrice,
  termsAccepted,
  onError,
  onLoading,
  loading,
}: PaymentFieldsProps) {
  const stripe = useStripe();
  const elements = useElements();
  const router = useRouter();
  const [paymentRequest, setPaymentRequest] = useState<Awaited<ReturnType<NonNullable<typeof stripe>["paymentRequest"]>> | null>(null);
  const [canMakePayment, setCanMakePayment] = useState(false);

  const amountInCents = Math.round(Number(displayPrice) * 100);

  useEffect(() => {
    if (!stripe || !amountInCents) return;

    const request = stripe.paymentRequest({
      country: "US",
      currency: "eur",
      total: { label: "Shqiponja eSIM", amount: amountInCents },
      requestPayerName: false,
      requestPayerEmail: true,
    });

    request.canMakePayment().then((result) => {
      setCanMakePayment(!!result);
      setPaymentRequest(result ? request : null);
    }).catch(() => {
      setCanMakePayment(false);
      setPaymentRequest(null);
    });
  }, [stripe, amountInCents]);

  useEffect(() => {
    if (!paymentRequest || !stripe) return;

    const handlePaymentMethod = async (event: {
      complete: (status: "success" | "fail") => void;
      paymentMethod: { id: string };
      payerEmail?: string;
    }) => {
      if (!name.trim()) {
        onError("Emri në kartë është i detyrueshëm.");
        event.complete("fail");
        return;
      }
      if (!email.trim()) {
        onError("Email-i është i detyrueshëm.");
        event.complete("fail");
        return;
      }
      if (!termsAccepted) {
        onError("Duhet të pranoni kushtet para pagesës.");
        event.complete("fail");
        return;
      }

      onError("");
      onLoading(true);
      trackBeginCheckout({ value: displayPrice, currency: "EUR", packageName });

      try {
        const result = await checkout(packageId, email.trim() || event.payerEmail || "", name.trim(), phone.trim() || undefined, promoCode);
        console.log("API response:", result);
        console.log("Client secret:", result.clientSecret);
        if (!result.clientSecret || !result.orderId || !result.accessToken) {
          throw new Error("Pagesa nuk mund të inicializohet.");
        }

        try {
          localStorage.setItem(`order_token_${result.orderId}`, result.accessToken);
        } catch {}

        const confirmation = await stripe.confirmCardPayment(result.clientSecret, {
          payment_method: event.paymentMethod.id,
        }, {
          handleActions: false,
        });

        if (confirmation.error) {
          event.complete("fail");
          throw confirmation.error;
        }

        if (confirmation.paymentIntent?.status === "requires_action") {
          const actionResult = await stripe.confirmCardPayment(result.clientSecret);
          if (actionResult.error) {
            event.complete("fail");
            throw actionResult.error;
          }
        }

        event.complete("success");
        router.push(`/porosi/${result.orderId}/${result.accessToken}`);
      } catch (err) {
        onError(getCheckoutErrorMessage(err));
      } finally {
        onLoading(false);
      }
    };

    paymentRequest.on("paymentmethod", handlePaymentMethod);
    return () => {
      paymentRequest.off("paymentmethod", handlePaymentMethod);
    };
  }, [displayPrice, email, name, onError, onLoading, packageId, packageName, paymentRequest, phone, promoCode, router, stripe, termsAccepted]);

  async function handleCardSubmit() {
    if (!stripe || !elements) {
      onError("Stripe nuk është gati ende.");
      return;
    }
    if (!name.trim()) {
      onError("Emri në kartë është i detyrueshëm.");
      return;
    }
    if (!email.trim()) {
      onError("Email-i është i detyrueshëm.");
      return;
    }
    if (!termsAccepted) {
      onError("Duhet të pranoni kushtet para pagesës.");
      return;
    }

    const cardNumber = elements.getElement(CardNumberElement);
    if (!cardNumber) {
      onError("Fusha e kartës nuk u inicializua.");
      return;
    }

    onError("");
    onLoading(true);
    trackBeginCheckout({ value: displayPrice, currency: "EUR", packageName });

    try {
      const result = await checkout(packageId, email.trim(), name.trim(), phone.trim() || undefined, promoCode);
      console.log("API response:", result);
      console.log("Client secret:", result.clientSecret);
      if (!result.clientSecret || !result.orderId || !result.accessToken) {
        throw new Error("Pagesa nuk mund të inicializohet.");
      }

      try {
        localStorage.setItem(`order_token_${result.orderId}`, result.accessToken);
      } catch {}

      const confirmation = await stripe.confirmCardPayment(result.clientSecret, {
        payment_method: {
          card: cardNumber,
          billing_details: {
            name: name.trim(),
            email: email.trim(),
            phone: phone.trim() || undefined,
          },
        },
      });

      if (confirmation.error) {
        throw confirmation.error;
      }

      router.push(`/porosi/${result.orderId}/${result.accessToken}`);
    } catch (err) {
      onError(getCheckoutErrorMessage(err));
    } finally {
      onLoading(false);
    }
  }

  const fieldClass = "rounded-[8px] border border-[#333] bg-[#1A1A1A] px-4 py-3 text-[#F5F0EB] transition focus-within:border-[#D8001E] focus-within:shadow-[0_0_0_2px_rgba(216,0,30,0.2)]";

  return (
    <div className="space-y-4 rounded-xl border border-white/10 bg-[#0C0C0C] p-5 text-[#F5F0EB] shadow-[0_20px_60px_rgba(0,0,0,0.35)]">
      <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.14em] text-[#F5F0EB]">
        <span>🔒</span>
        <span>Pagesa e sigurt</span>
      </div>

      <div className="space-y-3">
        <div>
          <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.16em] text-[#888]">
            Numri i kartës
          </label>
          <div className={fieldClass}>
            <CardNumberElement options={{ style: elementStyle, showIcon: true }} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.16em] text-[#888]">
              MM/YY
            </label>
            <div className={fieldClass}>
              <CardExpiryElement options={{ style: elementStyle }} />
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.16em] text-[#888]">
              CVC
            </label>
            <div className={fieldClass}>
              <CardCvcElement options={{ style: elementStyle }} />
            </div>
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.16em] text-[#888]">
            Name on card
          </label>
          <div className="rounded-[8px] border border-[#333] bg-[#1A1A1A] px-4 py-3 text-sm text-[#F5F0EB]">
            {name.trim() || "Përdor emrin që plotësove më sipër"}
          </div>
        </div>
      </div>

      {canMakePayment && paymentRequest && (
        <>
          <div className="relative py-1 text-center text-xs uppercase tracking-[0.18em] text-[#888]">
            <span className="relative z-10 bg-[#0C0C0C] px-3">ose</span>
            <div className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-white/10" />
          </div>
          <div className="overflow-hidden rounded-[8px] border border-white/10">
            <PaymentRequestButtonElement
              options={{
                paymentRequest,
                style: {
                  paymentRequestButton: {
                    type: "buy",
                    theme: "dark",
                    height: "52px",
                  },
                },
              }}
            />
          </div>
        </>
      )}

      <button
        type="button"
        onClick={handleCardSubmit}
        disabled={loading || !stripe || !elements}
        className="flex w-full items-center justify-center gap-2 rounded-[8px] bg-[#D8001E] px-4 py-3.5 text-base font-semibold text-white transition hover:bg-[#b80019] disabled:cursor-not-allowed disabled:opacity-60"
      >
        <span>{loading ? "Duke procesuar..." : `Paguaj €${Number(displayPrice).toFixed(2)}`}</span>
        <span>🔒</span>
      </button>

      <div className="flex items-center justify-between text-xs text-[#888]">
        <span>Visa  MC  Maestro</span>
        <span>🔒 SSL</span>
      </div>
    </div>
  );
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

  const displayPrice = promoApplied ? promoApplied.finalPrice : price;

  const elementsOptions = useMemo(() => ({ appearance }), []);

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

  const inputClass =
    "mt-1.5 block w-full rounded-xl border border-zinc-300 px-4 py-3 text-sm shadow-sm outline-none transition focus:border-shqiponja focus:ring-2 focus:ring-shqiponja/20 dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-100";

  return (
    <div className="mt-6 space-y-5">
      {/* Name */}
      <div>
        <label
          htmlFor="name"
          className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
        >
          Name on card <span className="text-red-500">*</span>
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
          <Link href="/terms" className="text-shqiponja underline hover:text-shqiponja-dark">
            {t("buy.termsLink")}
          </Link>{" "}
          {t("buy.andText")}{" "}
          <Link href="/privacy" className="text-shqiponja underline hover:text-shqiponja-dark">
            {t("buy.privacyLink")}
          </Link>
        </label>
      </div>

      {error && (
        <p className="rounded-lg bg-red-50 px-4 py-2.5 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
          {error}
        </p>
      )}

      {!stripePromise && (
        <p className="rounded-lg bg-red-50 px-4 py-2.5 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
          Stripe publishable key mungon në frontend.
        </p>
      )}

      <Elements stripe={stripePromise} options={elementsOptions}>
        <PaymentFields
          packageId={packageId}
          packageName={packageName}
          name={name}
          email={email}
          phone={phone}
          promoCode={promoApplied?.code}
          displayPrice={displayPrice}
          termsAccepted={termsAccepted}
          onError={setError}
          onLoading={setLoading}
          loading={loading}
        />
      </Elements>
    </div>
  );
}
