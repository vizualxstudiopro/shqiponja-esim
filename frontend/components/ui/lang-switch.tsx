"use client";

import { useI18n } from "@/lib/i18n-context";

export default function LangSwitch() {
  const { locale, setLocale } = useI18n();

  return (
    <button
      onClick={() => setLocale(locale === "sq" ? "en" : "sq")}
      className="rounded-full border border-zinc-200 px-3 py-1.5 text-xs font-semibold text-zinc-600 hover:bg-zinc-50 transition"
      title={locale === "sq" ? "Switch to English" : "Kalo në Shqip"}
    >
      {locale === "sq" ? "EN" : "SQ"}
    </button>
  );
}
