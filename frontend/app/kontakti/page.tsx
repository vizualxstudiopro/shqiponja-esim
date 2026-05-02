"use client";

import { useI18n } from "@/lib/i18n-context";
import Navbar from "@/components/navbar";
import ContactForm from "@/components/contact-form";

export default function ContactPage() {
  const { t } = useI18n();

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <Navbar />
      <div className="mx-auto max-w-5xl px-6 py-16">
        <h1 className="text-3xl font-extrabold">{t("contact.title")}</h1>
        <p className="mt-2 text-zinc-500 dark:text-zinc-400">{t("contact.subtitle")}</p>

        <div className="mt-8 grid gap-8 lg:grid-cols-2">
          <div>
            <ContactForm />
          </div>

          <aside className="space-y-4 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-700 dark:bg-zinc-900">
            <h2 className="text-lg font-bold text-zinc-900 dark:text-white">Contact Us - United States</h2>
            <a
              href="https://www.google.com/maps/search/?api=1&query=2232+Dell+Range+Blvd%2C+Suite+303+1440%2C+Cheyenne%2C+WY+82009"
              target="_blank"
              rel="noopener noreferrer"
              className="block text-sm text-zinc-600 transition hover:text-shqiponja dark:text-zinc-300"
            >
              2232 Dell Range Blvd, Suite 303 1440<br />
              Cheyenne, WY 82009, United States
            </a>
            <a
              href="tel:+13072262252"
              className="block text-sm font-semibold text-shqiponja hover:underline"
            >
              +1 307 226 2252
            </a>

            <div className="overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-700">
              <iframe
                title="VALA TECH 2026 LLC - Cheyenne, WY"
                src="https://www.google.com/maps?q=2232+Dell+Range+Blvd,+Suite+303+1440,+Cheyenne,+WY+82009&output=embed"
                width="100%"
                height="280"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                className="w-full"
              />
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
