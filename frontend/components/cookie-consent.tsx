"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { grantConsent, revokeConsent } from "@/lib/analytics";

const COOKIE_KEY = "cookieConsent";

export default function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      if (!localStorage.getItem(COOKIE_KEY)) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setVisible(true);
      }
    } catch {
      /* localStorage unavailable */
    }
  }, []);

  function accept() {
    try {
      localStorage.setItem(COOKIE_KEY, "accepted");
    } catch {}
    setVisible(false);
    grantConsent();
  }

  function decline() {
    try {
      localStorage.setItem(COOKIE_KEY, "rejected");
    } catch {}
    setVisible(false);
    revokeConsent();
  }

  if (!visible) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-[9999] p-4 sm:p-6">
      <div className="mx-auto max-w-xl rounded-2xl border border-zinc-200 bg-white p-5 shadow-2xl dark:border-zinc-700 dark:bg-zinc-800">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 text-2xl">🍪</span>
          <div className="flex-1">
            <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Cookies</p>
            <p className="mt-1 text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
              Përdorim cookies për të përmirësuar shërbimin. Duke vazhduar, ju pranoni Cookie Policy. {" "}
              <Link
                href="/cookies"
                className="text-shqiponja underline hover:text-shqiponja-dark"
              >
                Cookie Policy
              </Link>
            </p>
            <div className="mt-4 flex items-center gap-3">
              <button
                onClick={accept}
                className="rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-emerald-700"
              >
                Prano
              </button>
              <button
                onClick={decline}
                className="rounded-lg border border-zinc-300 bg-zinc-100 px-4 py-2 text-xs font-semibold text-zinc-700 transition hover:bg-zinc-200 dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-600"
              >
                Refuzo
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
