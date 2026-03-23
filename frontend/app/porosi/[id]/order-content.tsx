"use client";

import { useI18n } from "@/lib/i18n-context";
import type { Order } from "@/lib/api";
import QrCodeDisplay from "@/components/qr-code";
import Navbar from "@/components/navbar";
import Link from "next/link";

export default function OrderPageContent({ order }: { order: Order }) {
  const { t, locale } = useI18n();

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
          </div>
        </div>

        {/* QR Code */}
        <div className="mt-8 rounded-2xl border-2 border-dashed border-zinc-200 bg-white p-8 dark:border-zinc-700 dark:bg-zinc-800">
          {order.qr_data ? (
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
              <div className="mx-auto flex h-40 w-40 items-center justify-center rounded-xl bg-zinc-100" aria-label="QR placeholder">
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
