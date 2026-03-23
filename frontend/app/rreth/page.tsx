"use client";

import Navbar from "@/components/navbar";
import { useI18n } from "@/lib/i18n-context";

export default function AboutPage() {
  const { t } = useI18n();

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <Navbar />

      <div className="mx-auto max-w-3xl px-6 py-16">
        <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
          {t("about.title")}
        </h1>

        <p className="mt-6 text-lg leading-relaxed text-zinc-600 dark:text-zinc-400">
          {t("about.mission")}
        </p>

        <p className="mt-4 text-lg leading-relaxed text-zinc-600 dark:text-zinc-400">
          {t("about.story")}
        </p>

        <h2 className="mt-12 text-2xl font-extrabold">{t("about.values.title")}</h2>
        <ul className="mt-6 space-y-4">
          {(["about.values.1", "about.values.2", "about.values.3"] as const).map((key) => (
            <li key={key} className="flex items-start gap-3">
              <span className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-shqiponja/10 text-shqiponja text-sm font-bold">✓</span>
              <span className="text-zinc-600 dark:text-zinc-400">{t(key)}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
