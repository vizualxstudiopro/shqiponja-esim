"use client";

import { useI18n } from "@/lib/i18n-context";
import LegalPageShell from "@/components/legal-page-shell";

export default function PrivacyPage() {
  const { t } = useI18n();

  return (
    <LegalPageShell>
        <h1 className="text-3xl font-extrabold">{t("privacy.title")}</h1>
        <p className="mt-2 text-sm text-zinc-500">{t("privacy.lastUpdated")}</p>

        <div className="mt-8 space-y-6 text-sm leading-relaxed text-zinc-600 dark:text-zinc-300">
          <section>
            <h2 className="text-lg font-bold text-zinc-900 dark:text-white">{t("privacy.s1.title")}</h2>
            <p className="mt-2">{t("privacy.s1.text")}</p>
          </section>
          <section>
            <h2 className="text-lg font-bold text-zinc-900 dark:text-white">{t("privacy.s2.title")}</h2>
            <p className="mt-2">{t("privacy.s2.text")}</p>
            <p className="mt-2"><strong>{t("privacy.s2.legal")}</strong></p>
          </section>
          <section>
            <h2 className="text-lg font-bold text-zinc-900 dark:text-white">{t("privacy.s3.title")}</h2>
            <p className="mt-2">{t("privacy.s3.text")}</p>
          </section>
          <section>
            <h2 className="text-lg font-bold text-zinc-900 dark:text-white">{t("privacy.s4.title")}</h2>
            <p className="mt-2">{t("privacy.s4.text")}</p>
          </section>
          <section>
            <h2 className="text-lg font-bold text-zinc-900 dark:text-white">{t("privacy.s5.title")}</h2>
            <p className="mt-2"><a href="mailto:info@shqiponjaesim.com" className="text-shqiponja hover:underline">info@shqiponjaesim.com</a></p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-zinc-900 dark:text-white">{t("privacy.controller.title")}</h2>
            <p className="mt-2">{t("privacy.controller.text")}</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-zinc-900 dark:text-white">{t("privacy.transfer.title")}</h2>
            <p className="mt-2">{t("privacy.transfer.text")}</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-zinc-900 dark:text-white">{t("privacy.gdpr.title")}</h2>
            <p className="mt-2">{t("privacy.gdpr.text")} <a href="mailto:info@shqiponjaesim.com" className="text-shqiponja hover:underline">info@shqiponjaesim.com</a>.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-zinc-900 dark:text-white">{t("privacy.retention.title")}</h2>
            <p className="mt-2">{t("privacy.retention.text")}</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-zinc-900 dark:text-white">{t("privacy.children.title")}</h2>
            <p className="mt-2">{t("privacy.children.text")}</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-zinc-900 dark:text-white">{t("privacy.payments.title")}</h2>
            <p className="mt-2">{t("privacy.payments.text")}</p>
            <p className="mt-2">{t("privacy.payments.nosell")}</p>
          </section>
        </div>
    </LegalPageShell>
  );
}
