"use client";

import { useI18n } from "@/lib/i18n-context";
import type { EsimPackage } from "@/lib/api";
import PackageGrid from "@/components/package-grid";

import Link from "next/link";

const operators = [
  "Vodafone",
  "T-Mobile",
  "Orange",
  "Movistar",
  "3 (Three)",
  "AT&T",
  "Turkcell",
];

function StepIcon1() {
  return (
    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-label="Zgjidh paketën" role="img">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25H12" />
    </svg>
  );
}

function StepIcon2() {
  return (
    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-label="Skano QR kodin" role="img">
      <path strokeLinecap="round" strokeLinejoin="round" d="m0 10.5h4.5V19.5h-4.5V15Zm10.5-10.5h4.5v4.5h-4.5V4.5ZM12 12h1.5v1.5H12V12Zm3 3h1.5v1.5H15V15Zm3-3h1.5v1.5H18V12Zm0 6h1.5v1.5H18V18Zm-6 0h1.5v1.5H12V18Z" />
    </svg>
  );
}

function StepIcon3() {
  return (
    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-label="Lidhu me botën" role="img">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 0 0 8.716-6.747M12 21a9.004 9.004 0 0 1-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 0 1 7.843 4.582M12 3a8.997 8.997 0 0 0-7.843 4.582m15.686 0A11.953 11.953 0 0 1 12 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0 1 21 12c0 .778-.099 1.533-.284 2.253m0 0A11.978 11.978 0 0 1 12 16.5a11.978 11.978 0 0 1-8.716-2.247m0 0A8.966 8.966 0 0 1 3 12c0-1.264.26-2.467.727-3.56" />
    </svg>
  );
}

const stepIcons = [<StepIcon1 key="1" />, <StepIcon2 key="2" />, <StepIcon3 key="3" />];

export default function LandingContent({ packages }: { packages: EsimPackage[] }) {
  const { t } = useI18n();

  const steps = [
    { num: "01", titleKey: "how.step1.title" as const, descKey: "how.step1.desc" as const },
    { num: "02", titleKey: "how.step2.title" as const, descKey: "how.step2.desc" as const },
    { num: "03", titleKey: "how.step3.title" as const, descKey: "how.step3.desc" as const },
  ];

  return (
    <>
      {/* ══════════ HERO ══════════ */}
      <section className="relative overflow-hidden bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950 text-white">
        <div className="pointer-events-none absolute -top-40 -right-40 h-[500px] w-[500px] rounded-full bg-shqiponja/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-60 -left-40 h-[400px] w-[400px] rounded-full bg-shqiponja/5 blur-3xl" />

        <div className="relative mx-auto flex max-w-7xl flex-col items-center px-6 py-28 text-center lg:py-40">
          <span className="mb-6 inline-block rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs font-medium tracking-widest uppercase text-zinc-300">
            {t("hero.badge")}
          </span>

          <h1 className="max-w-3xl text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
            {t("hero.title1")}{" "}
            <span className="text-shqiponja">{t("hero.title2")}</span>
          </h1>

          <p className="mt-6 max-w-xl text-lg leading-relaxed text-zinc-400">
            {t("hero.subtitle")}
          </p>

          <div className="mt-10 flex flex-col gap-4 sm:flex-row">
            <a
              href="#packages"
              className="rounded-full bg-shqiponja px-8 py-3.5 text-base font-semibold text-white shadow-xl shadow-shqiponja/30 hover:bg-shqiponja-dark transition"
            >
              {t("hero.cta")}
            </a>
            <a
              href="#how"
              className="rounded-full border border-white/15 px-8 py-3.5 text-base font-semibold text-white hover:bg-white/5 transition"
            >
              {t("hero.howLink")}
            </a>
          </div>

          <div className="mt-16 grid grid-cols-3 gap-8 border-t border-white/10 pt-10 text-center">
            <div>
              <p className="text-2xl font-bold sm:text-3xl">190+</p>
              <p className="mt-1 text-xs text-zinc-500 uppercase tracking-wide">{t("hero.countries")}</p>
            </div>
            <div>
              <p className="text-2xl font-bold sm:text-3xl">24/7</p>
              <p className="mt-1 text-xs text-zinc-500 uppercase tracking-wide">{t("hero.support")}</p>
            </div>
            <div>
              <p className="text-2xl font-bold sm:text-3xl">99.9%</p>
              <p className="mt-1 text-xs text-zinc-500 uppercase tracking-wide">Uptime</p>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════ OPERATORS ══════════ */}
      <section id="operators" className="border-b border-zinc-100 bg-zinc-50 py-12 dark:bg-zinc-900 dark:border-zinc-800">
        <div className="mx-auto max-w-7xl px-6 text-center">
          <p className="mb-8 text-xs font-semibold uppercase tracking-widest text-zinc-400">
            {t("operators.title")}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-4">
            {operators.map((op) => (
              <span key={op} className="text-lg font-bold text-zinc-300 select-none transition hover:text-zinc-500">
                {op}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════ PACKAGES ══════════ */}
      <section id="packages" className="bg-white py-20 lg:py-28 dark:bg-zinc-950">
        <div className="mx-auto max-w-7xl px-6">
          <div className="text-center">
            <span className="inline-block rounded-full bg-shqiponja/10 px-4 py-1 text-xs font-semibold uppercase tracking-widest text-shqiponja">
              {t("packages.badge")}
            </span>
            <h2 className="mt-4 text-3xl font-extrabold tracking-tight sm:text-4xl">
              {t("packages.title")}
            </h2>
            <p className="mx-auto mt-3 max-w-lg text-zinc-500">
              {t("packages.subtitle")}
            </p>
          </div>

          <PackageGrid packages={packages} />
        </div>
      </section>

      {/* ══════════ HOW IT WORKS ══════════ */}
      <section id="how" className="bg-zinc-50 py-20 lg:py-28 dark:bg-zinc-900">
        <div className="mx-auto max-w-7xl px-6">
          <div className="text-center">
            <span className="inline-block rounded-full bg-shqiponja/10 px-4 py-1 text-xs font-semibold uppercase tracking-widest text-shqiponja">
              {t("how.badge")}
            </span>
            <h2 className="mt-4 text-3xl font-extrabold tracking-tight sm:text-4xl">
              {t("how.title")}
            </h2>
            <p className="mx-auto mt-3 max-w-lg text-zinc-500">
              {t("how.subtitle")}
            </p>
          </div>

          <div className="mt-14 grid gap-10 sm:grid-cols-3">
            {steps.map((step, i) => (
              <div
                key={step.num}
                className="relative rounded-2xl border border-zinc-200 bg-white p-8 text-center transition hover:shadow-lg dark:border-zinc-700 dark:bg-zinc-800"
              >
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-shqiponja/10 text-shqiponja">
                  {stepIcons[i]}
                </div>
                <span className="mt-5 block text-xs font-bold uppercase tracking-widest text-zinc-300">
                  {t("how.step")} {step.num}
                </span>
                <h3 className="mt-2 text-xl font-bold">{t(step.titleKey)}</h3>
                <p className="mt-2 text-sm leading-relaxed text-zinc-500">{t(step.descKey)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════ CTA BANNER ══════════ */}
      <section className="bg-gradient-to-r from-shqiponja to-shqiponja-dark py-16 text-white">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <h2 className="text-3xl font-extrabold sm:text-4xl">{t("cta.title")}</h2>
          <p className="mx-auto mt-4 max-w-md text-white/80">{t("cta.subtitle")}</p>
          <a
            href="#packages"
            className="mt-8 inline-block rounded-full bg-white px-8 py-3.5 text-base font-bold text-shqiponja shadow-lg hover:bg-zinc-100 transition"
          >
            {t("cta.btn")}
          </a>
        </div>
      </section>

      {/* ══════════ FOOTER ══════════ */}
      <footer className="border-t border-zinc-100 bg-white py-10 dark:bg-zinc-950 dark:border-zinc-800">
        <div className="mx-auto flex max-w-7xl flex-col items-center gap-4 px-6 text-center text-sm text-zinc-400 sm:flex-row sm:justify-between sm:text-left">
          <p>{t("footer.rights")}</p>
          <div className="flex gap-6">
            <Link href="/rreth" className="hover:text-shqiponja transition">{t("nav.about")}</Link>
            <Link href="/faq" className="hover:text-shqiponja transition">{t("nav.faq")}</Link>
            <Link href="/kushtet" className="hover:text-shqiponja transition">{t("footer.terms")}</Link>
            <Link href="/privatesia" className="hover:text-shqiponja transition">{t("footer.privacy")}</Link>
            <Link href="/kontakti" className="hover:text-shqiponja transition">{t("footer.contact")}</Link>
          </div>
        </div>
      </footer>
    </>
  );
}
