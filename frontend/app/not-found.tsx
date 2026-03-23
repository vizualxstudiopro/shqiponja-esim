"use client";

import Link from "next/link";
import { useI18n } from "@/lib/i18n-context";
import Navbar from "@/components/navbar";

export default function NotFound() {
  const { t } = useI18n();

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <Navbar />
      <div className="flex flex-col items-center justify-center px-6 py-32 text-center">
        <span className="text-8xl font-extrabold text-shqiponja">404</span>
        <h1 className="mt-4 text-2xl font-extrabold">{t("notFound.title")}</h1>
        <p className="mt-2 text-zinc-500 dark:text-zinc-400">{t("notFound.subtitle")}</p>
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
