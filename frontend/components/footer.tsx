"use client";

import Link from "next/link";
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
            <p className="text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
              Mandi &amp; Bes 2022 SHPK
            </p>
            <p className="text-xs text-zinc-400 dark:text-zinc-500">
              Kukës, Albania
            </p>
            <a
              href="mailto:suport@shqiponjaesim.com"
              className="inline-block text-xs text-shqiponja hover:underline"
            >
              suport@shqiponjaesim.com
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
            <div className="flex items-center gap-3">
              {/* Visa */}
              <svg className="h-8 w-auto text-zinc-400 dark:text-zinc-500" viewBox="0 0 48 32" fill="none">
                <rect width="48" height="32" rx="4" fill="currentColor" fillOpacity="0.08" stroke="currentColor" strokeOpacity="0.15" />
                <path d="M20.3 21H17.7L19.3 11H21.9L20.3 21ZM15.8 11L13.3 17.8L13 16.3L12.1 11.7C12.1 11.7 12 11 11.1 11H7.1L7 11.2C7 11.2 8 11.4 9.2 12.1L11.5 21H14.2L18.5 11H15.8ZM37 21H39.3L37.3 11H35.2C34.5 11 33.9 11.4 33.7 12L29.8 21H32.5L33 19.5H36.3L37 21ZM33.8 17.5L35.2 13.7L36 17.5H33.8ZM30.2 13.6L30.6 11.3C30.6 11.3 29.5 11 28.4 11C27.2 11 24.2 11.5 24.2 14.1C24.2 16.5 27.5 16.5 27.5 17.8C27.5 19.1 24.6 18.8 23.5 18L23 20.4C23 20.4 24.2 21 25.8 21C27.5 21 30.2 20.1 30.2 17.7C30.2 15.2 26.9 15 26.9 13.9C26.9 12.8 29.1 12.9 30.2 13.6Z" fill="currentColor" fillOpacity="0.6" />
              </svg>
              {/* Mastercard */}
              <svg className="h-8 w-auto text-zinc-400 dark:text-zinc-500" viewBox="0 0 48 32" fill="none">
                <rect width="48" height="32" rx="4" fill="currentColor" fillOpacity="0.08" stroke="currentColor" strokeOpacity="0.15" />
                <circle cx="20" cy="16" r="7" fill="currentColor" fillOpacity="0.2" />
                <circle cx="28" cy="16" r="7" fill="currentColor" fillOpacity="0.2" />
                <path d="M24 10.8A6.97 6.97 0 0 1 27 16a6.97 6.97 0 0 1-3 5.2A6.97 6.97 0 0 1 21 16a6.97 6.97 0 0 1 3-5.2Z" fill="currentColor" fillOpacity="0.3" />
              </svg>
            </div>

            {/* Airalo badge */}
            <div className="mt-2 flex items-center gap-2 rounded-full border border-shqiponja/20 bg-shqiponja/5 px-3 py-1.5 w-fit">
              <svg className="h-4 w-4 text-shqiponja" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" /></svg>
              <span className="text-[11px] font-semibold text-shqiponja">{t("footer.airaloPartner")}</span>
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
            shqiponjaesim.com {t("footer.operatedBy")} MANDI &amp; BES-2022 SHPK
          </p>
        </div>
      </div>
    </footer>
  );
}
