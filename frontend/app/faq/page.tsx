"use client";

import Navbar from "@/components/navbar";
import { useI18n } from "@/lib/i18n-context";
import { useState } from "react";

const faqKeys = [
  { q: "faq.q1" as const, a: "faq.a1" as const },
  { q: "faq.q2" as const, a: "faq.a2" as const },
  { q: "faq.q3" as const, a: "faq.a3" as const },
  { q: "faq.q4" as const, a: "faq.a4" as const },
  { q: "faq.q5" as const, a: "faq.a5" as const },
];

export default function FaqPage() {
  const { t } = useI18n();
  const [openIdx, setOpenIdx] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <Navbar />

      <div className="mx-auto max-w-3xl px-6 py-16">
        <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
          {t("faq.title")}
        </h1>

        <div className="mt-10 space-y-3">
          {faqKeys.map((faq, i) => (
            <div
              key={i}
              className="rounded-xl border border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-800 transition-shadow hover:shadow-md"
            >
              <button
                onClick={() => setOpenIdx(openIdx === i ? null : i)}
                className="flex w-full items-center justify-between px-6 py-4 text-left text-sm font-semibold"
              >
                <span>{t(faq.q)}</span>
                <svg
                  className={`h-5 w-5 shrink-0 text-zinc-400 transition-transform duration-300 ${openIdx === i ? "rotate-180" : ""}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="m19 9-7 7-7-7" />
                </svg>
              </button>
              <div className={`accordion-content ${openIdx === i ? "open" : ""}`}>
                <div className="accordion-inner">
                  <div className="border-t border-zinc-100 px-6 py-4 text-sm leading-relaxed text-zinc-600 dark:border-zinc-700 dark:text-zinc-400">
                    {t(faq.a)}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
