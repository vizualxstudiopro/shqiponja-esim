"use client";


import { useI18n } from "@/lib/i18n-context";
import { useCurrency } from "@/lib/currency-context";
import type { EsimPackage } from "@/lib/api";
import Navbar from "@/components/navbar";
import OrderForm from "./order-form";
import Link from "next/link";

const REGIONAL_CODES = new Set(["EU", "AS", "ME", "OC", "CB", "AF"]);
const GLOBAL_CODES = new Set(["GL"]);

function BuyFlagIcon({ countryCode, emoji }: { countryCode?: string; emoji?: string }) {
  const cc = (countryCode || "").toLowerCase();
  const upper = cc.toUpperCase();
  if (upper === "EU") {
    return <span className="fi fi-eu fis" style={{ fontSize: "2.5rem", borderRadius: "6px", display: "inline-block" }} />;
  }
  if (cc && cc.length === 2 && !REGIONAL_CODES.has(upper) && !GLOBAL_CODES.has(upper)) {
    return <span className={`fi fi-${cc} fis`} style={{ fontSize: "2.5rem", borderRadius: "6px", display: "inline-block" }} />;
  }
  return <span className="text-4xl leading-none">{emoji || "🌍"}</span>;
}

function PaymentLogos() {
  return (
    <div className="flex items-center justify-center gap-3 opacity-60">
      {/* Visa */}
      <svg viewBox="0 0 48 32" className="h-6 w-auto" fill="none">
        <rect width="48" height="32" rx="4" fill="#1A1F71" />
        <path d="M19.5 21h-3l1.9-11h3l-1.9 11zm12.3-10.7c-.6-.2-1.5-.5-2.7-.5-3 0-5 1.5-5 3.7 0 1.6 1.5 2.5 2.6 3 1.1.6 1.5 1 1.5 1.5 0 .8-1 1.2-1.8 1.2-1.2 0-1.9-.2-2.9-.6l-.4-.2-.4 2.5c.7.3 2 .6 3.4.6 3.2 0 5.2-1.5 5.2-3.8 0-1.3-.8-2.2-2.5-3-.9-.5-1.5-.8-1.5-1.3 0-.5.5-1 1.6-1 .9 0 1.6.2 2.1.4l.3.1.5-2.6zm7.9-.3h-2.3c-.7 0-1.3.2-1.6 1L32 21h3.2l.6-1.7h3.9l.4 1.7H43l-2.6-11h-0.7zm-3.3 7.1l1.2-3.3.2-.5.3 1.5.7 2.3h-2.4zM16 10l-2.8 7.5-.3-1.5c-.5-1.8-2.2-3.7-4-4.7l2.7 9.7h3.2L19.2 10H16z" fill="white" />
      </svg>
      {/* Mastercard */}
      <svg viewBox="0 0 48 32" className="h-6 w-auto" fill="none">
        <rect width="48" height="32" rx="4" fill="#252525" />
        <circle cx="19" cy="16" r="8" fill="#EB001B" />
        <circle cx="29" cy="16" r="8" fill="#F79E1B" />
        <path d="M24 10.3A8 8 0 0 0 21 16a8 8 0 0 0 3 5.7A8 8 0 0 0 27 16a8 8 0 0 0-3-5.7z" fill="#FF5F00" />
      </svg>
      {/* Apple Pay */}
      <svg viewBox="0 0 48 32" className="h-6 w-auto" fill="none">
        <rect width="48" height="32" rx="4" fill="#000" />
        <path d="M14.5 11.5c.6-.8 1-1.8.9-2.8-.9 0-2 .6-2.6 1.3-.5.6-1 1.7-.9 2.7 1 .1 2-.5 2.6-1.2zm.9.7c-1.4-.1-2.6.8-3.3.8s-1.7-.8-2.8-.7c-1.5 0-2.8.8-3.5 2.1-1.5 2.6-.4 6.5 1.1 8.6.7 1 1.5 2.2 2.6 2.1 1-.1 1.4-.7 2.7-.7 1.2 0 1.6.7 2.7.6 1.1 0 1.8-1 2.5-2.1.8-1.2 1.1-2.3 1.1-2.4-.1 0-2.1-.8-2.1-3.1 0-1.9 1.6-2.9 1.7-2.9-1-1.4-2.4-1.6-2.7-1.6v.3zm11.1-2h2.2v11.6h-2.2V10.2zm10.6 3.7c2.3 0 3.9 1.6 3.9 3.9s-1.7 3.9-4 3.9h-2.5v4h-2.2V13.9H37zm-2.6 6h2.1c1.6 0 1.8-1.2 1.8-2.1 0-.9-.2-2.1-1.8-2.1h-2.1v4.2z" fill="white" />
      </svg>
      {/* Google Pay */}
      <svg viewBox="0 0 48 32" className="h-6 w-auto" fill="none">
        <rect width="48" height="32" rx="4" fill="#fff" stroke="#ddd" strokeWidth="1" />
        <path d="M24.3 16.8v3h-1.5v-7.4h3.8c.9 0 1.7.3 2.4.9.6.6 1 1.3 1 2.1s-.3 1.5-1 2.1c-.6.6-1.4.9-2.4.9h-2.3zm0-3v1.7h2.4c.5 0 .9-.2 1.2-.5.3-.3.5-.7.5-1.1s-.2-.8-.5-1.1c-.3-.3-.7-.5-1.2-.5h-2.4zm8.1 1.1c1.1 0 2 .3 2.6.9s.9 1.4.9 2.4v4.6h-1.4v-1h-.1c-.6.9-1.4 1.3-2.4 1.3-.9 0-1.6-.3-2.2-.8-.6-.5-.9-1.1-.9-1.9 0-.8.3-1.5.9-2 .6-.5 1.4-.7 2.4-.7.9 0 1.6.2 2.1.5v-.4c0-.5-.2-1-.6-1.3-.4-.4-.9-.5-1.4-.5-.8 0-1.5.4-1.9 1l-1.3-.8c.6-1 1.6-1.5 2.8-1.5h-.1zm-1.9 5.3c0 .4.2.7.5 1 .4.3.8.4 1.2.4.7 0 1.3-.3 1.8-.8.5-.5.8-1.1.8-1.7-.4-.4-1.1-.6-1.9-.6-.6 0-1.1.1-1.5.4-.6.3-.9.7-.9 1.3zm8 5l-1.3.3-1.2-8.8h1.5l.6 5 2.4-4.2h1.3l2.3 4.2.6-5h1.5l-1.2 8.8-1.3-.3-2.6-4.7-2.6 4.7z" fill="#5F6368" />
      </svg>
    </div>
  );
}

function LockIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
    </svg>
  );
}

export default function BuyPageContent({ pkg }: { pkg: EsimPackage }) {
  const { t } = useI18n();
  const { formatPrice, currency, rates } = useCurrency();

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <Navbar />

      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
        {/* Back link */}
        <Link
          href="/#packages"
          className="mb-6 inline-flex items-center text-sm font-medium text-zinc-500 transition hover:text-shqiponja dark:text-zinc-400"
        >
          {t("buy.backToPackages")}
        </Link>

        <div className="grid gap-8 lg:grid-cols-5">
          {/* Left column - Form */}
          <div className="lg:col-span-3">
            <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-700 dark:bg-zinc-800 sm:p-8">
              <h2 className="text-xl font-bold">{t("buy.fillOrder")}</h2>
              <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                {t("buy.fillOrderSub")}
              </p>

              <OrderForm packageId={pkg.id} price={pkg.price} packageName={pkg.name} />
            </div>

            {/* Trust / secure payment */}
            <div className="mt-4 flex items-center justify-center gap-2 text-xs text-zinc-400 dark:text-zinc-500">
              <LockIcon />
              <span>{t("buy.securePayment")}</span>
            </div>
            <div className="mt-3">
              <PaymentLogos />
            </div>
          </div>

          {/* Right column - Order Summary */}
          <div className="lg:col-span-2">
            <div className="sticky top-24 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-700 dark:bg-zinc-800">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-zinc-400">
                {t("buy.orderSummary")}
              </h3>

              {/* Package info */}
              <div className="mt-4 flex items-center gap-3">
                <BuyFlagIcon countryCode={pkg.country_code} emoji={pkg.flag} />
                <div>
                  <p className="font-bold leading-tight">{pkg.name}</p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">{pkg.description}</p>
                </div>
              </div>

              {/* Details grid */}
              <div className="mt-5 space-y-3">
                <div className="flex items-center justify-between rounded-xl bg-zinc-50 px-4 py-3 dark:bg-zinc-900">
                  <span className="text-sm text-zinc-500 dark:text-zinc-400">{t("buy.data")}</span>
                  <span className="text-sm font-semibold">{pkg.data}</span>
                </div>
                <div className="flex items-center justify-between rounded-xl bg-zinc-50 px-4 py-3 dark:bg-zinc-900">
                  <span className="text-sm text-zinc-500 dark:text-zinc-400">{t("buy.duration")}</span>
                  <span className="text-sm font-semibold">{pkg.duration}</span>
                </div>
              </div>

              {/* Divider */}
              <div className="my-5 border-t border-zinc-100 dark:border-zinc-700" />

              {/* Price */}
              <div className="flex items-end justify-between">
                <span className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Total</span>
                <div className="text-right">
                  <p className="text-2xl font-extrabold text-shqiponja">
                    {formatPrice(Number(pkg.price))}
                  </p>
                </div>
              </div>

              {currency !== "EUR" && (
                <p className="mt-2 text-center text-[10px] text-zinc-400 dark:text-zinc-500">
                  {t("packages.rateNote")} 1 EUR = {rates[currency]?.toFixed(2)} {currency}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
