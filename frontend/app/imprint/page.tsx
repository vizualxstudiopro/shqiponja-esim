"use client";

import { useI18n } from "@/lib/i18n-context";
import LegalPageShell from "@/components/legal-page-shell";

export default function ImprintPage() {
  const { t } = useI18n();

  return (
    <LegalPageShell contentClassName="mx-auto max-w-3xl px-6 py-16 text-zinc-700 dark:text-zinc-300">
        <h1 className="text-3xl font-extrabold text-zinc-900 dark:text-white">{t("imprint.title")}</h1>

        <section className="mt-8 space-y-3">
          <h2 className="text-xl font-bold text-zinc-900 dark:text-white">{t("imprint.legal.title")}</h2>
          <ul className="list-disc space-y-1 pl-5">
            <li>{t("imprint.legal.item1")}</li>
            <li>{t("imprint.legal.item2")}</li>
            <li>{t("imprint.legal.item3")}</li>
            <li>{t("imprint.legal.item4")}</li>
            <li>{t("imprint.legal.item5")}</li>
          </ul>
        </section>

        <section className="mt-8 space-y-3">
          <h2 className="text-xl font-bold text-zinc-900 dark:text-white">{t("imprint.contact.title")}</h2>
          <p>{t("imprint.contact.address")}</p>
          <p>
            Email: <a href="mailto:info@shqiponjaesim.com" className="text-shqiponja hover:underline">info@shqiponjaesim.com</a>
          </p>
          <p>
            Tel: <a href="tel:+13072262252" className="text-shqiponja hover:underline">+1 307 226 2252</a>
          </p>
          <p>
            Website: <a href="https://shqiponjaesim.com" className="text-shqiponja hover:underline">https://shqiponjaesim.com</a>
          </p>
        </section>

        <section className="mt-8 space-y-3">
          <h2 className="text-xl font-bold text-zinc-900 dark:text-white">{t("imprint.dispute.title")}</h2>
          <p>
            {t("imprint.dispute.text")} <a href="mailto:info@shqiponjaesim.com" className="text-shqiponja hover:underline">info@shqiponjaesim.com</a>.
            {" "}{t("imprint.dispute.suffix")}
          </p>
        </section>
    </LegalPageShell>
  );
}
