"use client";

import { useI18n } from "@/lib/i18n-context";
import LegalPageShell from "@/components/legal-page-shell";

export default function TermsPage() {
  const { t } = useI18n();

  return (
    <LegalPageShell>
        <h1 className="text-3xl font-extrabold">{t("terms.title")}</h1>
        <p className="mt-2 text-sm text-zinc-500">{t("terms.lastUpdated")}</p>

        <p className="mt-4 rounded-lg border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-700 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200">
          {t("terms.operator")}
        </p>

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

          <section>
            <h2 className="text-lg font-bold text-zinc-900 dark:text-white">{t("terms.s6.title")}</h2>
            <p className="mt-2">{t("terms.s6.text")}</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-zinc-900 dark:text-white">{t("terms.disclaimer.title")}</h2>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li>{t("terms.disclaimer.item1")}</li>
              <li>{t("terms.disclaimer.item2")}</li>
              <li>{t("terms.disclaimer.item3pre")} <a href="/#compatibility" className="text-shqiponja hover:underline">{t("terms.disclaimer.item3link")}</a> {t("terms.disclaimer.item3post")}</li>
              <li>{t("terms.disclaimer.item4")}</li>
            </ul>
          </section>
        </div>
    </LegalPageShell>
  );
}
