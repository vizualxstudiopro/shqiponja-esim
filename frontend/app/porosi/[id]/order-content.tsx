"use client";

import { useI18n } from "@/lib/i18n-context";
import type { Order } from "@/lib/api";
import { getOrderById, getOrderUsage } from "@/lib/api";
import type { UsageData } from "@/lib/api";
import { generateInvoicePDF } from "@/lib/generate-invoice";
import QrCodeDisplay from "@/components/qr-code";
import Navbar from "@/components/navbar";
import Link from "next/link";
import { useState, useEffect } from "react";

export default function OrderPageContent({ order: initialOrder, token: urlToken, orderId }: { order: Order | null; token?: string; orderId: number }) {
  const { t, locale } = useI18n();
  const [order, setOrder] = useState(initialOrder);
  const [loading, setLoading] = useState(!initialOrder);
  const [usage, setUsage] = useState<UsageData | null>(null);
  const [failed, setFailed] = useState(false);

  // Resolve token: URL param first, then localStorage fallback
  const [token] = useState(() => {
    if (urlToken) return urlToken;
    if (typeof window !== "undefined") {
      try {
        return localStorage.getItem(`order_token_${orderId}`) || undefined;
      } catch { /* */ }
    }
    return undefined;
  });

  // Fetch order client-side if server-side fetch failed, and poll for updates
  useEffect(() => {
    if (order?.status === "completed" && (order.qr_data || order.qr_code_url)) return;

    // Try immediately on mount (JWT auth may work even without token)
    let attempts = 0;
    const tryFetch = async () => {
      try {
        const updated = await getOrderById(orderId, token);
        if (updated) {
          setOrder(updated);
          setLoading(false);
          setFailed(false);
          if (updated.status === "completed" && (updated.qr_data || updated.qr_code_url)) {
            return true; // done
          }
        } else {
          attempts++;
          if (attempts >= 10 && !order) {
            setLoading(false);
            setFailed(true);
            return true; // give up
          }
        }
      } catch { /* silent */ }
      return false;
    };

    // Immediate first attempt
    tryFetch();

    const interval = setInterval(async () => {
      const done = await tryFetch();
      if (done) clearInterval(interval);
    }, 3000);
    return () => clearInterval(interval);
  }, [orderId, order?.status, order?.qr_data, order?.qr_code_url, token, order]);

  // Fetch data usage when order has ICCID
  useEffect(() => {
    if (!order?.iccid || order.status !== "completed") return;
    getOrderUsage(orderId).then(setUsage).catch(() => {});
  }, [orderId, order?.iccid, order?.status]);

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
        <Navbar />
        <div className="flex flex-col items-center justify-center px-6 py-32 text-center">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-shqiponja border-t-transparent" />
          <p className="mt-4 text-zinc-500">{t("order.loading")}</p>
        </div>
      </div>
    );
  }

  if (failed || !order) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
        <Navbar />
        <div className="flex flex-col items-center justify-center px-6 py-32 text-center">
          <span className="text-6xl">⚠️</span>
          <h1 className="mt-4 text-2xl font-extrabold">{t("order.notFound")}</h1>
          <Link
            href="/"
            className="mt-8 inline-block rounded-full bg-shqiponja px-8 py-3 text-sm font-semibold text-white shadow-lg shadow-shqiponja/25 hover:bg-shqiponja-dark transition"
          >
            {t("notFound.home")}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <Navbar />

      <div className="mx-auto max-w-lg px-6 py-16 text-center">
        {/* Success icon */}
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-green-100" aria-label="Success">
          <svg
            className="h-10 w-10 text-green-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>

        <h1 className="mt-6 text-3xl font-extrabold">{t("order.title")}</h1>
        <p className="mt-3 text-zinc-500">{t("order.subtitle")}</p>

        {/* Order details card */}
        <div className="mt-8 rounded-2xl border border-zinc-200 bg-white p-6 text-left dark:border-zinc-700 dark:bg-zinc-800">
          <div className="flex items-center gap-3">
            <span className="text-3xl">{order.package_flag}</span>
            <div>
              <p className="font-bold">{order.package_name}</p>
              <p className="text-sm text-zinc-500">{t("order.orderId")} #{order.id}</p>
            </div>
          </div>

          <div className="mt-4 space-y-3 border-t border-zinc-100 pt-4 text-sm">
            <div className="flex justify-between">
              <span className="text-zinc-500">{t("order.email")}</span>
              <span className="font-medium">{order.email}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">{t("order.payment")}</span>
              <span
                className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                  order.payment_status === "paid"
                    ? "bg-green-100 text-green-700"
                    : "bg-amber-100 text-amber-700"
                }`}
              >
                {order.payment_status === "paid" ? t("order.paid") : t("order.pending")}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">{t("order.status")}</span>
              <span
                className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                  order.status === "completed"
                    ? "bg-green-100 text-green-700"
                    : "bg-amber-100 text-amber-700"
                }`}
              >
                {order.status === "completed" ? t("order.completed") : t("order.pending")}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">{t("order.date")}</span>
              <span className="font-medium">
                {new Date(order.created_at).toLocaleDateString(locale === "sq" ? "sq-AL" : "en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </span>
            </div>
            {order.iccid && (
              <div className="flex justify-between">
                <span className="text-zinc-500">ICCID</span>
                <span className="font-mono text-xs font-medium">{order.iccid}</span>
              </div>
            )}
            {order.esim_status && (
              <div className="flex justify-between">
                <span className="text-zinc-500">eSIM Status</span>
                <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold bg-blue-100 text-blue-700">
                  {order.esim_status}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Download Invoice */}
        {order.payment_status === "paid" && (
          <button
            onClick={() => generateInvoicePDF(order, locale)}
            className="mt-4 inline-flex items-center gap-2 rounded-full border border-zinc-200 px-5 py-2.5 text-sm font-semibold text-zinc-700 hover:bg-zinc-100 transition dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            {t("order.downloadInvoice")}
          </button>
        )}

        {/* Data Usage */}
        {usage && (
          <div className="mt-6 rounded-2xl border border-zinc-200 bg-white p-6 text-left dark:border-zinc-700 dark:bg-zinc-800">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-zinc-400">
              {t("order.dataUsage")}
            </h3>
            <div className="mt-4">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-zinc-500">{t("order.used")}</span>
                <span className="font-semibold">
                  {typeof usage.used === "number" ? `${(usage.used / 1024).toFixed(1)} MB` : "—"} / {typeof usage.total === "number" ? `${(usage.total / 1024 / 1024).toFixed(1)} GB` : "—"}
                </span>
              </div>
              <div className="h-3 rounded-full bg-zinc-100 dark:bg-zinc-700 overflow-hidden">
                <div
                  className="h-full rounded-full bg-shqiponja transition-all"
                  style={{ width: `${usage.total ? Math.min(100, ((usage.used || 0) / usage.total) * 100) : 0}%` }}
                />
              </div>
              <p className="mt-2 text-xs text-zinc-400">
                {typeof usage.remaining === "number" ? `${(usage.remaining / 1024 / 1024).toFixed(2)} GB ${locale === "sq" ? "mbetur" : "remaining"}` : ""}
              </p>
            </div>
          </div>
        )}

        {/* Apple direct install link */}
        {order.activation_code && (
          <a
            href={order.activation_code}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-zinc-900 px-6 py-3 text-sm font-semibold text-white hover:bg-zinc-800 transition dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/></svg>
            {locale === "sq" ? "Instalo në iPhone" : "Install on iPhone"}
          </a>
        )}

        {/* QR Code */}
        <div className="mt-8 rounded-2xl border-2 border-dashed border-zinc-200 bg-white p-8 dark:border-zinc-700 dark:bg-zinc-800">
          {order.qr_code_url ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={order.qr_code_url} alt="eSIM QR Code" className="mx-auto h-48 w-48 rounded-xl" />
              <p className="mt-4 text-sm text-zinc-500">
                {t("order.scanQr")}
              </p>
            </>
          ) : order.qr_data ? (
            <>
              <QrCodeDisplay data={order.qr_data} />
              <p className="mt-4 text-xs text-zinc-400 break-all font-mono">
                {order.qr_data}
              </p>
              <p className="mt-2 text-sm text-zinc-500">
                {t("order.scanQr")}
              </p>
            </>
          ) : (
            <>
              <div className="mx-auto flex h-40 w-40 items-center justify-center rounded-xl bg-zinc-100 animate-pulse" aria-label="QR placeholder">
                <svg
                  className="h-16 w-16 text-zinc-300"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1}
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3.75 4.5h4.5v4.5h-4.5V4.5Zm0 10.5h4.5V19.5h-4.5V15Zm10.5-10.5h4.5v4.5h-4.5V4.5ZM12 12h1.5v1.5H12V12Zm3 3h1.5v1.5H15V15Zm3-3h1.5v1.5H18V12Zm0 6h1.5v1.5H18V18Zm-6 0h1.5v1.5H12V18Z"
                  />
                </svg>
              </div>
              <p className="mt-4 text-sm text-zinc-400">
                {t("order.qrPending")}
              </p>
              <p className="mt-1 text-xs text-zinc-300">
                {locale === "sq" ? "Duke kontrolluar automatikisht..." : "Checking automatically..."}
              </p>
            </>
          )}
        </div>

        <Link
          href="/"
          className="mt-8 inline-block rounded-full bg-zinc-900 px-8 py-3 text-sm font-semibold text-white hover:bg-zinc-800 transition dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          {t("order.backHome")}
        </Link>
      </div>
    </div>
  );
}
