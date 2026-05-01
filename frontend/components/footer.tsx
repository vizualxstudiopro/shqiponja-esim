"use client";

import Link from "next/link";
import Image from "next/image";
import { useI18n } from "@/lib/i18n-context";

export default function Footer() {
  const { t } = useI18n();

  return (
    <footer className="border-t border-zinc-100 bg-white dark:border-zinc-800 dark:bg-zinc-950">
      <div className="mx-auto max-w-7xl px-6 py-12">
        {/* Main grid */}
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          {/* Company info */}
          <div className="space-y-3">
            <p className="text-sm font-bold text-zinc-900 dark:text-white">Shqiponja eSIM</p>
            <div className="space-y-1">
              <span className="block text-[10px] uppercase tracking-wider text-zinc-400 dark:text-zinc-500">Operated by</span>
              <img
                src="/vala-tech-optimized.svg"
                alt="Vala Tech 2026 LLC"
                className="h-12 w-auto object-contain"
                loading="lazy"
                decoding="async"
              />
            </div>
            <p className="text-xs leading-relaxed text-zinc-400 dark:text-zinc-500">
              2232 Dell Range Blvd, Suite 303 1440<br />
              Cheyenne, WY 82009<br />
              United States
            </p>
            <a
              href="tel:+13072262252"
              className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-shqiponja dark:text-zinc-500 transition"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-3.5 w-3.5"
                aria-hidden="true"
              >
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.79 19.79 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.12.9.34 1.78.65 2.62a2 2 0 0 1-.45 2.11L8.03 9.73a16 16 0 0 0 6.24 6.24l1.28-1.28a2 2 0 0 1 2.11-.45c.84.31 1.72.53 2.62.65A2 2 0 0 1 22 16.92z" />
              </svg>
              +1 307 226 2252
            </a>
            <a
              href="mailto:info@shqiponjaesim.com"
              className="flex items-center gap-1.5 text-xs text-shqiponja hover:underline"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-3.5 w-3.5"
                aria-hidden="true"
              >
                <rect x="2" y="4" width="20" height="16" rx="2" />
                <path d="m22 7-10 7L2 7" />
              </svg>
              info@shqiponjaesim.com
            </a>
          </div>

          {/* Navigation */}
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
              {t("footer.navigation")}
            </p>
            <nav className="flex flex-col gap-2 text-sm text-zinc-500 dark:text-zinc-400">
              <Link href="/rreth" className="transition hover:text-shqiponja">{t("nav.about")}</Link>
              <Link href="/faq" className="transition hover:text-shqiponja">{t("nav.faq")}</Link>
              <Link href="/blog" className="transition hover:text-shqiponja">{t("nav.blog")}</Link>
              <Link href="/kontakti" className="transition hover:text-shqiponja">{t("footer.contact")}</Link>
            </nav>
          </div>

          {/* Legal */}
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
              {t("footer.legal")}
            </p>
            <nav className="flex flex-col gap-2 text-sm text-zinc-500 dark:text-zinc-400">
              <Link href="/kushtet" className="transition hover:text-shqiponja">{t("footer.terms")}</Link>
              <Link href="/privatesia" className="transition hover:text-shqiponja">{t("footer.privacy")}</Link>
              <Link href="/rimbursimet" className="transition hover:text-shqiponja">{t("footer.refund")}</Link>
            </nav>
          </div>

          {/* Payment methods */}
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
              {t("footer.payWith")}
            </p>
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-2">
              {[
                { name: "Visa", src: "/payments/visa.svg" },
                { name: "Mastercard", src: "/payments/mastercard.svg" },
                { name: "Maestro", src: "/payments/maestro.svg" },
                { name: "PayPal", src: "/payments/paypal.svg" },
                { name: "Stripe", src: "/payments/stripe.svg" },
              ].map((payment) => (
                <div
                  key={payment.name}
                  className="rounded-xl border border-zinc-200/80 bg-white p-1.5 shadow-sm dark:border-zinc-700 dark:bg-zinc-900"
                  title={payment.name}
                >
                  <Image
                    src={payment.src}
                    alt={payment.name}
                    width={96}
                    height={56}
                    className="h-8 w-auto"
                  />
                </div>
              ))}
            </div>

            {/* Airalo badge */}
            <div className="mt-2 flex items-center gap-2 rounded-full border border-zinc-700 bg-zinc-900 px-3 py-1.5 w-fit dark:border-zinc-600 dark:bg-zinc-800">
              <span className="text-[11px] font-semibold text-white/90">{t("footer.airaloPartner")}</span>
              <img
                src="/idk7pi9b2j_1777631151716.svg"
                alt="Partner logo"
                className="h-4 w-auto"
                loading="lazy"
              />
            </div>
          </div>
        </div>

        {/* Social + copyright */}
        <div className="mt-10 flex flex-col items-center gap-4 border-t border-zinc-100 pt-8 dark:border-zinc-800 sm:flex-row sm:justify-between">
          {/* Social icons */}
          <div className="flex gap-3">
            {[
              { label: "Facebook", href: "#", d: "M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" },
              { label: "Instagram", href: "#", d: "M12 2.163c3.204 0 3.584.012 4.85.07 1.17.054 1.97.24 2.43.403a4.088 4.088 0 0 1 1.523.994 4.088 4.088 0 0 1 .994 1.523c.163.46.349 1.26.403 2.43.058 1.266.07 1.646.07 4.85s-.012 3.584-.07 4.85c-.054 1.17-.24 1.97-.403 2.43a4.088 4.088 0 0 1-.994 1.523 4.088 4.088 0 0 1-1.523.994c-.46.163-1.26.349-2.43.403-1.266.058-1.646.07-4.85.07s-3.584-.012-4.85-.07c-1.17-.054-1.97-.24-2.43-.403a4.088 4.088 0 0 1-1.523-.994 4.088 4.088 0 0 1-.994-1.523c-.163-.46-.349-1.26-.403-2.43C2.175 15.584 2.163 15.204 2.163 12s.012-3.584.07-4.85c.054-1.17.24-1.97.403-2.43a4.088 4.088 0 0 1 .994-1.523A4.088 4.088 0 0 1 5.153 2.3c.46-.163 1.26-.349 2.43-.403C8.849 1.838 9.229 1.826 12 1.826V2.163zm0 1.802c-3.148 0-3.504.012-4.743.068-1.145.052-1.766.244-2.18.405a3.64 3.64 0 0 0-1.353.88 3.64 3.64 0 0 0-.88 1.353c-.161.414-.353 1.035-.405 2.18C2.383 9.09 2.37 9.446 2.37 12.594v-.001c0 3.148.013 3.504.069 4.743.052 1.145.244 1.766.405 2.18.192.501.437.914.88 1.353.44.443.852.688 1.353.88.414.161 1.035.353 2.18.405 1.24.056 1.596.069 4.744.069 3.149 0 3.505-.013 4.744-.069 1.145-.052 1.766-.244 2.18-.405a3.64 3.64 0 0 0 1.353-.88c.443-.44.688-.852.88-1.353.161-.414.353-1.035.405-2.18.056-1.24.069-1.596.069-4.744 0-3.148-.013-3.504-.069-4.743-.052-1.145-.244-1.766-.405-2.18a3.64 3.64 0 0 0-.88-1.353 3.64 3.64 0 0 0-1.353-.88c-.414-.161-1.035-.353-2.18-.405C15.504 3.977 15.148 3.965 12 3.965zm0 3.066a4.969 4.969 0 1 1 0 9.937 4.969 4.969 0 0 1 0-9.937zm0 8.192a3.223 3.223 0 1 0 0-6.446 3.223 3.223 0 0 0 0 6.446zm6.406-8.39a1.16 1.16 0 1 1-2.32 0 1.16 1.16 0 0 1 2.32 0z" },
              { label: "TikTok", href: "#", d: "M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1 0-5.78c.27 0 .54.04.8.1v-3.5a6.37 6.37 0 0 0-.8-.05A6.34 6.34 0 0 0 3.15 15.2a6.34 6.34 0 0 0 10.86 4.43V13a8.28 8.28 0 0 0 4.83 1.56v-3.44a4.85 4.85 0 0 1-.75.06 4.83 4.83 0 0 1-2.5-.7v6.15" },
              { label: "WhatsApp", href: "#", d: "M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z" },
            ].map((s) => (
              <a
                key={s.label}
                href={s.href}
                aria-label={s.label}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-full border border-zinc-200 p-2 text-zinc-400 transition hover:border-shqiponja/30 hover:text-shqiponja dark:border-zinc-700 dark:hover:border-shqiponja/30"
              >
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d={s.d} /></svg>
              </a>
            ))}
          </div>

          <p className="text-xs text-zinc-400 dark:text-zinc-500">
            {t("footer.rights")}
          </p>
          <p className="text-[11px] text-zinc-400 dark:text-zinc-500">
            {t("footer.operatedBy")} VALA TECH 2026 LLC
          </p>
        </div>
      </div>
    </footer>
  );
}
