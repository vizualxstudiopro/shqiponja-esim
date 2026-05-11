"use client";

import { useI18n } from "@/lib/i18n-context";
import LegalPageShell from "@/components/legal-page-shell";

export default function CookiesPage() {
  const { t } = useI18n();

  return (
    <LegalPageShell contentClassName="mx-auto max-w-3xl px-6 py-16 text-zinc-700 dark:text-zinc-300">
        <h1 className="text-3xl font-extrabold text-zinc-900 dark:text-white">{t("cookies.title")}</h1>
        <p className="mt-2 text-sm text-zinc-500">{t("cookies.lastUpdated")}</p>

        <section className="mt-8 space-y-3">
          <h2 className="text-xl font-bold text-zinc-900 dark:text-white">{t("cookies.s1.title")}</h2>
          <p>{t("cookies.s1.intro")}</p>
          <ul className="list-disc space-y-1 pl-5">
            <li>{t("cookies.s1.item1")}</li>
            <li>{t("cookies.s1.item2")}</li>
            <li>{t("cookies.s1.item3")}</li>
            <li>{t("cookies.s1.item4")}</li>
          </ul>
        </section>

        <section className="mt-8 space-y-3">
          <h2 className="text-xl font-bold text-zinc-900 dark:text-white">{t("cookies.s2.title")}</h2>
          <p>{t("cookies.s2.text")}</p>
        </section>

        <section className="mt-8 space-y-3">
          <h2 className="text-xl font-bold text-zinc-900 dark:text-white">{t("cookies.s3.title")}</h2>
          <p>{t("cookies.s3.text")}</p>
          <ul className="list-disc space-y-1 pl-5">
            <li>Google</li>
            <li>Meta</li>
            <li>Airalo</li>
          </ul>
        </section>

        <section className="mt-8 space-y-2">
          <h2 className="text-xl font-bold text-zinc-900 dark:text-white">{t("cookies.s4.title")}</h2>
          <p>Email: <a href="mailto:info@shqiponjaesim.com" className="text-shqiponja hover:underline">info@shqiponjaesim.com</a></p>
          <p>{t("cookies.contact.address")}</p>
        </section>
    </LegalPageShell>
  );
}
