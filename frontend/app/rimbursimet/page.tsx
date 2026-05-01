"use client";

import { useI18n } from "@/lib/i18n-context";
import LegalPageShell from "@/components/legal-page-shell";

export default function RefundPage() {
  const { t } = useI18n();

  return (
    <LegalPageShell>
        <h1 className="text-3xl font-extrabold">{t("refund.title")}</h1>
        <p className="mt-2 text-sm text-zinc-500">{t("refund.lastUpdated")}</p>
        <p className="mt-4 text-sm leading-relaxed text-zinc-600 dark:text-zinc-300">{t("refund.intro")}</p>

        <div className="mt-8 space-y-6 text-sm leading-relaxed text-zinc-600 dark:text-zinc-300">
          <section>
            <h2 className="text-lg font-bold text-zinc-900 dark:text-white">{t("refund.s1.title")}</h2>
            <p className="mt-2">{t("refund.s1.text")}</p>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li>{t("refund.s1.item1")}</li>
              <li>{t("refund.s1.item2")}</li>
              <li>{t("refund.s1.item3")}</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-zinc-900 dark:text-white">{t("refund.s2.title")}</h2>
            <p className="mt-2">{t("refund.s2.text")}</p>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li><strong>{t("refund.s2.item1")}</strong></li>
              <li>{t("refund.s2.item2")}</li>
              <li>{t("refund.s2.item3")}</li>
              <li>{t("refund.s2.item4")}</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-zinc-900 dark:text-white">{t("refund.s3.title")}</h2>
            <p className="mt-2">{t("refund.s3.text")}</p>
            <p className="mt-2">Email: <a href="mailto:info@shqiponjaesim.com" className="text-shqiponja hover:underline">info@shqiponjaesim.com</a></p>
            <p className="mt-2">{t("refund.s3.processing")}</p>
          </section>
        </div>
    </LegalPageShell>
  );
}
