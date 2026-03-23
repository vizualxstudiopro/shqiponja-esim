"use client";

import { useState, type FormEvent } from "react";
import { useI18n } from "@/lib/i18n-context";
import { useToast } from "@/lib/toast-context";
import Navbar from "@/components/navbar";
import { submitContact } from "@/lib/api";

export default function ContactPage() {
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

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <Navbar />
      <div className="mx-auto max-w-xl px-6 py-16">
        <h1 className="text-3xl font-extrabold">{t("contact.title")}</h1>
        <p className="mt-2 text-zinc-500 dark:text-zinc-400">{t("contact.subtitle")}</p>

        {sent ? (
          <div className="mt-10 rounded-2xl border-2 border-dashed border-green-300 bg-green-50 py-12 text-center dark:border-green-700 dark:bg-green-950">
            <p className="text-lg font-bold text-green-700 dark:text-green-300">{t("contact.sent")}</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium">{t("contact.name")}</label>
              <input
                name="name"
                type="text"
                maxLength={100}
                className="w-full rounded-lg border border-zinc-300 bg-white px-4 py-2.5 text-sm outline-none focus:border-shqiponja dark:border-zinc-600 dark:bg-zinc-800"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">{t("contact.email")}</label>
              <input
                name="email"
                type="email"
                maxLength={200}
                className="w-full rounded-lg border border-zinc-300 bg-white px-4 py-2.5 text-sm outline-none focus:border-shqiponja dark:border-zinc-600 dark:bg-zinc-800"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">{t("contact.message")}</label>
              <textarea
                name="message"
                rows={5}
                maxLength={2000}
                className="w-full rounded-lg border border-zinc-300 bg-white px-4 py-2.5 text-sm outline-none focus:border-shqiponja dark:border-zinc-600 dark:bg-zinc-800"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-shqiponja px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-shqiponja/25 hover:bg-shqiponja-dark transition disabled:opacity-50"
            >
              {loading ? "..." : t("contact.send")}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
