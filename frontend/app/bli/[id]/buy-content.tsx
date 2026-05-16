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
    <div className="flex flex-wrap items-center justify-center gap-2">
      {/* Visa */}
      <svg viewBox="0 0 68 42" className="h-8 w-auto drop-shadow-sm" fill="none" aria-label="Visa" role="img">
        <rect width="68" height="42" rx="9" fill="url(#visa-bg)" />
        <rect x="0.5" y="0.5" width="67" height="41" rx="8.5" stroke="white" strokeOpacity="0.12" />
        <path d="M28.3 27.5h-4.1l2.6-14.7h4.1l-2.6 14.7Zm16.4-14.3c-.8-.3-2.1-.6-3.7-.6-4 0-6.8 2-6.8 5 0 2.2 2 3.4 3.5 4.1 1.5.8 2 1.3 2 2 0 1-1.3 1.5-2.5 1.5-1.6 0-2.5-.3-3.9-.8l-.5-.2-.6 3.4c1 .4 2.7.8 4.6.8 4.3 0 7-2.1 7-5.2 0-1.7-1-3-3.4-4.1-1.2-.6-2-.9-2-1.7 0-.6.7-1.3 2.2-1.3 1.2 0 2.1.3 2.8.5l.4.2.9-3.6Zm10.6-.4h-3.1c-.9 0-1.6.3-2 1.2l-5.9 13.5h4.2l.8-2.2h5.1l.5 2.2h3.8l-3.4-14.7Zm-4.8 9.4 1.7-4.4.2-.8.4 2 .9 3.2h-3.2ZM22.1 12.8l-3.7 10.1-.5-2c-.7-2.4-2.9-5-5.4-6.3l3.6 12.9h4.3l5.9-14.7h-4.2Z" fill="white" />
        <defs>
          <linearGradient id="visa-bg" x1="0" x2="68" y1="0" y2="42" gradientUnits="userSpaceOnUse">
            <stop stopColor="#172554" />
            <stop offset="0.55" stopColor="#1D4ED8" />
            <stop offset="1" stopColor="#312E81" />
          </linearGradient>
        </defs>
      </svg>
      {/* Mastercard */}
      <svg viewBox="0 0 68 42" className="h-8 w-auto drop-shadow-sm" fill="none" aria-label="Mastercard" role="img">
        <rect width="68" height="42" rx="9" fill="#111114" />
        <rect x="0.5" y="0.5" width="67" height="41" rx="8.5" stroke="white" strokeOpacity="0.12" />
        <circle cx="29" cy="21" r="10" fill="#EB001B" />
        <circle cx="39" cy="21" r="10" fill="#F79E1B" fillOpacity="0.95" />
        <path d="M34 13.9A10 10 0 0 0 30.2 21 10 10 0 0 0 34 28.1 10 10 0 0 0 37.8 21 10 10 0 0 0 34 13.9Z" fill="#FF5F00" />
      </svg>
      {/* Apple Pay */}
      <svg viewBox="0 0 68 42" className="h-8 w-auto drop-shadow-sm" fill="none" aria-label="Apple Pay" role="img">
        <rect width="68" height="42" rx="9" fill="url(#apple-bg)" />
        <rect x="0.5" y="0.5" width="67" height="41" rx="8.5" stroke="white" strokeOpacity="0.12" />
        <path d="M20.5 16.1c.8-.9 1.3-2.2 1.2-3.4-1.1 0-2.4.7-3.2 1.6-.7.8-1.3 2.1-1.1 3.3 1.2.1 2.4-.6 3.1-1.5Zm1.1 1.2c-1.6-.1-3 .9-3.8.9s-2-.9-3.3-.9c-1.7 0-3.3 1-4.2 2.5-1.8 3-.5 7.5 1.3 10 .9 1.2 1.8 2.5 3.1 2.5 1.3-.1 1.7-.8 3.3-.8 1.5 0 1.9.8 3.3.8 1.4 0 2.2-1.2 3-2.4.9-1.4 1.3-2.8 1.4-2.9-.1 0-2.5-1-2.5-3.6 0-2.3 1.9-3.3 2-3.4-1.1-1.6-2.8-1.8-3.6-1.7Zm15.1-3h3v16.4h-3V14.3Zm11.3 4.6c3.5 0 5.8 2.3 5.8 5.7s-2.4 5.8-5.9 5.8h-3.2v4.9h-3V18.9H48Zm-3.3 8.7h2.8c2 0 3.2-1.1 3.2-3s-1.2-3-3.1-3h-2.9v6Z" fill="white" />
        <defs>
          <linearGradient id="apple-bg" x1="0" x2="68" y1="0" y2="42" gradientUnits="userSpaceOnUse">
            <stop stopColor="#09090B" />
            <stop offset="1" stopColor="#27272A" />
          </linearGradient>
        </defs>
      </svg>
      {/* Google Pay */}
      <svg viewBox="0 0 68 42" className="h-8 w-auto drop-shadow-sm" fill="none" aria-label="Google Pay" role="img">
        <rect width="68" height="42" rx="9" fill="#F8FAFC" />
        <rect x="0.5" y="0.5" width="67" height="41" rx="8.5" stroke="#CBD5E1" />
        <path d="M20.6 22.1c0-.8-.1-1.5-.2-2.1h-8v3h4.6a3.9 3.9 0 0 1-1.7 2.6v2.1h2.7c1.6-1.5 2.6-3.6 2.6-5.6Z" fill="#4285F4" />
        <path d="M12.4 30.3c2.3 0 4.2-.8 5.6-2.1l-2.7-2.1c-.8.5-1.7.8-2.9.8-2.2 0-4.1-1.5-4.7-3.5H4.9v2.2a8.5 8.5 0 0 0 7.5 4.7Z" fill="#34A853" />
        <path d="M7.7 23.4a5.1 5.1 0 0 1 0-3.2V18H4.9a8.5 8.5 0 0 0 0 7.6l2.8-2.2Z" fill="#FBBC05" />
        <path d="M12.4 16.7c1.2 0 2.4.4 3.2 1.3l2.4-2.4a8.2 8.2 0 0 0-5.6-2.2A8.5 8.5 0 0 0 4.9 18l2.8 2.2c.6-2 2.5-3.5 4.7-3.5Z" fill="#EA4335" />
        <path d="M29.5 17.3h3.7c1.1 0 2 .4 2.7 1 .7.6 1 1.4 1 2.4s-.3 1.8-1 2.4c-.7.6-1.6 1-2.7 1h-1.9v4.5h-1.8V17.3Zm1.8 5.1h1.9c.6 0 1-.2 1.4-.5.3-.3.5-.7.5-1.2s-.2-.9-.5-1.2c-.4-.3-.8-.5-1.4-.5h-1.9v3.4Zm10.7-1.2c1.1 0 2 .3 2.6.9.6.6.9 1.4.9 2.4v4.1h-1.7v-.9h-.1c-.5.7-1.3 1.1-2.4 1.1-.8 0-1.5-.2-2-.7-.5-.5-.8-1.1-.8-1.8 0-.8.3-1.4.9-1.9.6-.4 1.4-.7 2.5-.7.8 0 1.5.2 1.9.5v-.3c0-.4-.2-.8-.5-1.1-.4-.3-.8-.5-1.3-.5-.8 0-1.3.3-1.8.9l-1.5-.9c.7-.8 1.6-1.1 2.8-1.1Zm-.1 6.1c.6 0 1.1-.2 1.5-.6.4-.4.6-.8.6-1.3-.4-.3-.9-.4-1.6-.4-.5 0-1 .1-1.3.4-.3.2-.5.5-.5.9s.1.6.4.8c.2.1.5.2.9.2Zm9.8.8-3.5-6.7h2l2.4 4.7h.1l2.3-4.7h2l-5.2 11.8h-1.9l1.8-5.1Z" fill="#334155" />
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
