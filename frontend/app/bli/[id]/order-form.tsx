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

/* â”€â”€â”€ Faza 2: Formulari i pagesës â”€â”€â”€ */
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
    } else if (paymentIntent?.status === "requires_payment_method") {
      onError("Pagesa u refuzua. Kontrollo kartën ose provo një metodë tjetër pagese.");
      setLoading(false);
    } else if (paymentIntent?.status === "requires_action") {
      onError("Pagesa kërkon verifikim shtesë. Provo përsëri.");
      setLoading(false);
    } else {
      onError("Pagesa nuk u krye. Provo përsëri.");
      setLoading(false);
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

      <p className="text-center text-xs text-zinc-500">🔒 Pagesa procesohet nga Stripe • SSL • PCI DSS</p>
    </div>
  );
}

/* â”€â”€â”€ Komponenti kryesor â”€â”€â”€ */
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

  /* â”€â”€â”€ Faza 2: PaymentElement â”€â”€â”€ */
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

  /* â”€â”€â”€ Faza 1: Email + Telefon + Promo â”€â”€â”€ */
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

      <p className="text-center text-xs text-zinc-500">🔒 Pagesa procesohet nga Stripe • SSL • PCI DSS</p>
    </form>
  );
}
