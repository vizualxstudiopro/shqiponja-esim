"use client";

import { useState, type FormEvent } from "react";
import { useI18n } from "@/lib/i18n-context";
import { useToast } from "@/lib/toast-context";
import { submitContact } from "@/lib/api";

export default function ContactForm() {
  const { t } = useI18n();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    const name = (fd.get("name") as string).trim();
    const email = (fd.get("email") as string).trim();
    const message = (fd.get("message") as string).trim();

    if (!name || !email || !message) {
      toast(t("contact.required"), "error");
      setLoading(false);
      return;
    }

    try {
      await submitContact(name, email, message);
      setSent(true);
      toast(t("contact.success"), "success");
    } catch {
      toast(t("contact.error"), "error");
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <div className="mt-10 rounded-2xl border-2 border-dashed border-green-300 bg-green-50 py-12 text-center dark:border-green-700 dark:bg-green-950">
        <div className="text-4xl mb-3">✉️</div>
        <p className="text-lg font-bold text-green-700 dark:text-green-300">
          {t("contact.sent")}
        </p>
        <p className="mt-2 text-sm text-green-600 dark:text-green-400">
          {t("contact.confirmEmail")}
        </p>
        <button
          onClick={() => setSent(false)}
          className="mt-6 text-sm font-medium text-shqiponja hover:underline"
        >
          {t("contact.sendAnother")}
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mt-8 space-y-5">
      <div>
        <label htmlFor="contact-name" className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
          {t("contact.name")}
        </label>
        <input
          id="contact-name"
          name="name"
          type="text"
          required
          maxLength={100}
          placeholder={t("contact.namePlaceholder")}
          className="w-full rounded-xl border border-zinc-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-shqiponja focus:ring-2 focus:ring-shqiponja/20 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white dark:placeholder-zinc-500 dark:focus:border-shqiponja"
        />
      </div>
      <div>
        <label htmlFor="contact-email" className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
          {t("contact.email")}
        </label>
        <input
          id="contact-email"
          name="email"
          type="email"
          required
          maxLength={200}
          placeholder={t("contact.emailPlaceholder")}
          className="w-full rounded-xl border border-zinc-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-shqiponja focus:ring-2 focus:ring-shqiponja/20 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white dark:placeholder-zinc-500 dark:focus:border-shqiponja"
        />
      </div>
      <div>
        <label htmlFor="contact-message" className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
          {t("contact.message")}
        </label>
        <textarea
          id="contact-message"
          name="message"
          required
          rows={5}
          maxLength={2000}
          placeholder={t("contact.messagePlaceholder")}
          className="w-full rounded-xl border border-zinc-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-shqiponja focus:ring-2 focus:ring-shqiponja/20 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white dark:placeholder-zinc-500 dark:focus:border-shqiponja"
        />
      </div>
      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-xl bg-shqiponja px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-shqiponja/25 hover:bg-shqiponja-dark transition disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            {t("contact.sending")}
          </span>
        ) : (
          t("contact.send")
        )}
      </button>
    </form>
  );
}
