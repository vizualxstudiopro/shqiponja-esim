"use client";

import { useI18n } from "@/lib/i18n-context";
import Navbar from "@/components/navbar";
import ContactForm from "@/components/contact-form";

export default function ContactPage() {
  const { t } = useI18n();

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <Navbar />
      <div className="mx-auto max-w-xl px-6 py-16">
        <h1 className="text-3xl font-extrabold">{t("contact.title")}</h1>
        <p className="mt-2 text-zinc-500 dark:text-zinc-400">{t("contact.subtitle")}</p>
        <ContactForm />
      </div>
    </div>
  );
}
