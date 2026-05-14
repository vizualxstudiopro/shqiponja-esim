"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CardCvcElement,
  CardExpiryElement,
  CardNumberElement,
  Elements,
  PaymentRequestButtonElement,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { checkout, validatePromo } from "@/lib/api";
import { useI18n } from "@/lib/i18n-context";
import Link from "next/link";
import { trackBeginCheckout } from "@/lib/analytics";
import { useRouter } from "next/navigation";

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
        onError(err instanceof Error ? err.message : "Pagesa dështoi.");
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
      onError(err instanceof Error ? err.message : "Pagesa dështoi.");
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
