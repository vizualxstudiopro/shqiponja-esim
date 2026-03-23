"use client";

import { useI18n } from "@/lib/i18n-context";
import Navbar from "@/components/navbar";

export default function TermsPage() {
  const { t } = useI18n();

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <Navbar />
      <div className="mx-auto max-w-3xl px-6 py-16">
        <h1 className="text-3xl font-extrabold">{t("terms.title")}</h1>
        <p className="mt-2 text-sm text-zinc-500">{t("terms.lastUpdated")}</p>

        <div className="mt-8 space-y-6 text-sm leading-relaxed text-zinc-600 dark:text-zinc-300">
          <section>
            <h2 className="text-lg font-bold text-zinc-900 dark:text-white">{t("terms.s1.title")}</h2>
            <p className="mt-2">{t("terms.s1.text")}</p>
          </section>
          <section>
            <h2 className="text-lg font-bold text-zinc-900 dark:text-white">{t("terms.s2.title")}</h2>
            <p className="mt-2">{t("terms.s2.text")}</p>
          </section>
          <section>
            <h2 className="text-lg font-bold text-zinc-900 dark:text-white">{t("terms.s3.title")}</h2>
            <p className="mt-2">{t("terms.s3.text")}</p>
          </section>
          <section>
            <h2 className="text-lg font-bold text-zinc-900 dark:text-white">{t("terms.s4.title")}</h2>
            <p className="mt-2">{t("terms.s4.text")}</p>
          </section>
          <section>
            <h2 className="text-lg font-bold text-zinc-900 dark:text-white">{t("terms.s5.title")}</h2>
            <p className="mt-2">{t("terms.s5.text")}</p>
          </section>
        </div>
      </div>
    </div>
  );
}
