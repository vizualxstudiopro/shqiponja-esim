"use client";

import { useEffect, useRef, useState } from "react";
import { useI18n } from "@/lib/i18n-context";
import PackageGrid from "@/components/package-grid";
import { Smartphone, Search, CheckCircle, XCircle } from "lucide-react";

import Link from "next/link";

/* Scroll-reveal hook */
function useReveal() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { el.classList.add("visible"); observer.unobserve(el); } },
      { threshold: 0.15 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  return ref;
}

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

/* eSIM-compatible device patterns (case-insensitive partial match) */
const ESIM_DEVICES = [
  // Apple
  "iphone xr", "iphone xs", "iphone xs max",
  "iphone 11", "iphone 11 pro", "iphone 11 pro max",
  "iphone 12", "iphone 12 mini", "iphone 12 pro", "iphone 12 pro max",
  "iphone 13", "iphone 13 mini", "iphone 13 pro", "iphone 13 pro max",
  "iphone 14", "iphone 14 plus", "iphone 14 pro", "iphone 14 pro max",
  "iphone 15", "iphone 15 plus", "iphone 15 pro", "iphone 15 pro max",
  "iphone 16", "iphone 16 plus", "iphone 16 pro", "iphone 16 pro max",
  "iphone se 2", "iphone se 3",
  "ipad pro", "ipad air", "ipad mini", "ipad 10",
  "apple watch",
  // Samsung
  "galaxy s20", "galaxy s21", "galaxy s22", "galaxy s23", "galaxy s24", "galaxy s25",
  "galaxy s20 fe", "galaxy s21 fe", "galaxy s23 fe", "galaxy s24 fe",
  "galaxy s20+", "galaxy s20 plus", "galaxy s20 ultra",
  "galaxy s21+", "galaxy s21 plus", "galaxy s21 ultra",
  "galaxy s22+", "galaxy s22 plus", "galaxy s22 ultra",
  "galaxy s23+", "galaxy s23 plus", "galaxy s23 ultra",
  "galaxy s24+", "galaxy s24 plus", "galaxy s24 ultra",
  "galaxy s25+", "galaxy s25 plus", "galaxy s25 ultra",
  "galaxy note 20", "galaxy note 20 ultra",
  "galaxy z flip", "galaxy z flip3", "galaxy z flip4", "galaxy z flip5", "galaxy z flip6",
  "galaxy z fold", "galaxy z fold2", "galaxy z fold3", "galaxy z fold4", "galaxy z fold5", "galaxy z fold6",
  "galaxy a54", "galaxy a55", "galaxy a35", "galaxy a34",
  // Google
  "pixel 2", "pixel 3", "pixel 3a", "pixel 4", "pixel 4a", "pixel 5", "pixel 5a",
  "pixel 6", "pixel 6a", "pixel 6 pro", "pixel 7", "pixel 7a", "pixel 7 pro",
  "pixel 8", "pixel 8a", "pixel 8 pro", "pixel 9", "pixel 9 pro",
  // Huawei
  "huawei p40", "huawei p40 pro", "huawei p50", "huawei p50 pro", "huawei mate 40",
  // Motorola
  "motorola razr", "moto g", "edge 40", "edge 30",
  // Xiaomi
  "xiaomi 12t", "xiaomi 13", "xiaomi 13 pro", "xiaomi 14",
  // OnePlus / Oppo
  "oneplus 12", "oneplus 11", "oppo find x5", "oppo find x6", "oppo find n",
  // Sony
  "xperia 1 iv", "xperia 1 v", "xperia 5 iv", "xperia 5 v", "xperia 10 iv", "xperia 10 v",
  // Other
  "surface duo", "surface pro",
];

export default function LandingContent() {
  const { t } = useI18n();
  const packagesRef = useReveal();
  const howRef = useReveal();
  const compatRef = useReveal();
  const ctaRef = useReveal();

  const [deviceQuery, setDeviceQuery] = useState("");
  const [compatResult, setCompatResult] = useState<"idle" | "compatible" | "unknown">("idle");

  function checkDevice(q: string) {
    setDeviceQuery(q);
    if (q.trim().length < 2) { setCompatResult("idle"); return; }
    const lower = q.toLowerCase().trim();
    const found = ESIM_DEVICES.some((d) => lower.includes(d) || d.includes(lower));
    setCompatResult(found ? "compatible" : "unknown");
  }

  const steps = [
    { num: "01", titleKey: "how.step1.title" as const, descKey: "how.step1.desc" as const },
    { num: "02", titleKey: "how.step2.title" as const, descKey: "how.step2.desc" as const },
    { num: "03", titleKey: "how.step3.title" as const, descKey: "how.step3.desc" as const },
  ];

  return (
    <>
      {/* ══════════ HERO ══════════ */}
      <section className="relative overflow-hidden bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950 text-white">
        {/* Subtle grid background */}
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(255,255,255,.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.02)_1px,transparent_1px)] bg-[size:64px_64px]" />
        <div className="pointer-events-none absolute -top-40 -right-40 h-[500px] w-[500px] rounded-full bg-shqiponja/10 blur-3xl animate-glow" />
        <div className="pointer-events-none absolute -bottom-60 -left-40 h-[400px] w-[400px] rounded-full bg-shqiponja/5 blur-3xl animate-glow delay-300" />

        <div className="relative mx-auto flex max-w-7xl flex-col items-center px-6 py-28 text-center lg:py-40">
          <span className="animate-fade-up mb-6 inline-block rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs font-medium tracking-widest uppercase text-zinc-300">
            {t("hero.badge")}
          </span>

          <h1 className="animate-fade-up delay-100 max-w-3xl text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
            {t("hero.title1")}{" "}
            <span className="text-shqiponja">{t("hero.title2")}</span>
          </h1>

          <p className="animate-fade-up delay-200 mt-6 max-w-xl text-lg leading-relaxed text-zinc-400">
            {t("hero.subtitle")}
          </p>

          <div className="animate-fade-up delay-300 mt-10 flex flex-col gap-4 sm:flex-row">
            <a
              href="#packages"
              className="group rounded-full bg-shqiponja px-8 py-3.5 text-base font-semibold text-white shadow-xl shadow-shqiponja/30 hover:bg-shqiponja-dark hover:shadow-shqiponja/50 transition-all duration-300 hover:scale-105"
            >
              {t("hero.cta")}
            </a>
            <a
              href="#how"
              className="rounded-full border border-white/15 px-8 py-3.5 text-base font-semibold text-white hover:bg-white/5 hover:border-white/30 transition-all duration-300"
            >
              {t("hero.howLink")}
            </a>
          </div>

          <div className="animate-fade-up delay-500 mt-16 grid grid-cols-3 gap-8 border-t border-white/10 pt-10 text-center">
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

      {/* ══════════ OPERATORS (Marquee) ══════════ */}
      <section id="operators" className="border-b border-zinc-100 bg-zinc-50 py-12 dark:bg-zinc-900 dark:border-zinc-800 overflow-hidden">
        <div className="mx-auto max-w-7xl px-6 text-center">
          <p className="mb-8 text-xs font-semibold uppercase tracking-widest text-zinc-400">
            {t("operators.title")}
          </p>
          <div className="relative">
            <div className="pointer-events-none absolute left-0 top-0 z-10 h-full w-20 bg-gradient-to-r from-zinc-50 dark:from-zinc-900" />
            <div className="pointer-events-none absolute right-0 top-0 z-10 h-full w-20 bg-gradient-to-l from-zinc-50 dark:from-zinc-900" />
            <div className="flex animate-marquee whitespace-nowrap">
              {[...operators, ...operators].map((op, i) => (
                <span key={`${op}-${i}`} className="mx-8 text-lg font-bold text-zinc-300 select-none transition hover:text-zinc-500 dark:text-zinc-500 dark:hover:text-zinc-300">
                  {op}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ══════════ PACKAGES ══════════ */}
      <section id="packages" className="bg-white py-20 lg:py-28 dark:bg-zinc-950">
        <div ref={packagesRef} className="reveal mx-auto max-w-7xl px-6">
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

          <PackageGrid />
        </div>
      </section>

      {/* ══════════ HOW IT WORKS ══════════ */}
      <section id="how" className="bg-zinc-50 py-20 lg:py-28 dark:bg-zinc-900">
        <div ref={howRef} className="reveal mx-auto max-w-7xl px-6">
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
                className="card-shine relative rounded-2xl border border-zinc-200 bg-white p-8 text-center transition-all duration-300 hover:shadow-xl hover:-translate-y-1 dark:border-zinc-700 dark:bg-zinc-800"
              >
                {/* Connector line between cards */}
                {i < steps.length - 1 && (
                  <div className="hidden sm:block absolute top-1/2 -right-5 w-10 border-t-2 border-dashed border-zinc-200 dark:border-zinc-700" />
                )}
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

      {/* ══════════ DEVICE COMPATIBILITY CHECK ══════════ */}
      <section className="bg-white py-20 lg:py-28 dark:bg-zinc-950">
        <div ref={compatRef} className="reveal mx-auto max-w-7xl px-6">
          <div className="mx-auto max-w-2xl text-center">
            <span className="inline-block rounded-full bg-shqiponja/10 px-4 py-1 text-xs font-semibold uppercase tracking-widest text-shqiponja">
              {t("compat.badge")}
            </span>
            <h2 className="mt-4 text-3xl font-extrabold tracking-tight sm:text-4xl">
              {t("compat.title")}
            </h2>
            <p className="mx-auto mt-3 max-w-lg text-zinc-500">
              {t("compat.subtitle")}
            </p>

            <div className="mt-8 relative mx-auto max-w-md">
              <Smartphone className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-400 pointer-events-none" />
              <input
                type="text"
                value={deviceQuery}
                onChange={(e) => checkDevice(e.target.value)}
                placeholder={t("compat.placeholder")}
                className="w-full rounded-2xl border border-zinc-200 bg-zinc-50 py-4 pl-12 pr-12 text-base outline-none transition focus:border-shqiponja focus:ring-2 focus:ring-shqiponja/20 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
              />
              <Search className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-300 pointer-events-none" />
            </div>

            {/* Result */}
            {compatResult === "compatible" && (
              <div className="mt-5 inline-flex items-center gap-2 rounded-xl bg-green-50 px-5 py-3 text-green-700 dark:bg-green-900/20 dark:text-green-400 animate-fade-up">
                <CheckCircle className="h-5 w-5 shrink-0" />
                <span className="text-sm font-semibold">{t("compat.yes")}</span>
              </div>
            )}
            {compatResult === "unknown" && (
              <div className="mt-5 inline-flex items-center gap-2 rounded-xl bg-amber-50 px-5 py-3 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400 animate-fade-up">
                <XCircle className="h-5 w-5 shrink-0" />
                <span className="text-sm font-semibold">{t("compat.unknown")}</span>
              </div>
            )}

            <p className="mt-6 text-xs text-zinc-400">{t("compat.hint")}</p>
          </div>
        </div>
      </section>

      {/* ══════════ CTA BANNER ══════════ */}
      <section className="relative overflow-hidden bg-gradient-to-r from-shqiponja to-shqiponja-dark py-16 text-white">
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(255,255,255,.04)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.04)_1px,transparent_1px)] bg-[size:32px_32px]" />
        <div ref={ctaRef} className="reveal relative mx-auto max-w-3xl px-6 text-center">
          <h2 className="text-3xl font-extrabold sm:text-4xl">{t("cta.title")}</h2>
          <p className="mx-auto mt-4 max-w-md text-white/80">{t("cta.subtitle")}</p>
          <a
            href="#packages"
            className="mt-8 inline-block rounded-full bg-white px-8 py-3.5 text-base font-bold text-shqiponja shadow-lg hover:bg-zinc-100 hover:scale-105 transition-all duration-300"
          >
            {t("cta.btn")}
          </a>
        </div>
      </section>

      {/* ══════════ FOOTER ══════════ */}
      <footer className="border-t border-zinc-100 bg-white py-12 dark:bg-zinc-950 dark:border-zinc-800">
        <div className="mx-auto max-w-7xl px-6">
          <div className="flex flex-col items-center gap-6 text-center sm:flex-row sm:justify-between sm:text-left">
            <div>
              <p className="text-sm font-semibold text-zinc-600 dark:text-zinc-300">Shqiponja eSIM</p>
              <p className="mt-1 text-xs text-zinc-400">{t("footer.rights")}</p>
            </div>
            <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-zinc-400">
              <Link href="/rreth" className="hover:text-shqiponja transition">{t("nav.about")}</Link>
              <Link href="/faq" className="hover:text-shqiponja transition">{t("nav.faq")}</Link>
              <Link href="/kushtet" className="hover:text-shqiponja transition">{t("footer.terms")}</Link>
              <Link href="/privatesia" className="hover:text-shqiponja transition">{t("footer.privacy")}</Link>
              <Link href="/kontakti" className="hover:text-shqiponja transition">{t("footer.contact")}</Link>
            </div>
          </div>
          {/* Payment methods */}
          <div className="mt-8 flex flex-col items-center gap-3 border-t border-zinc-100 pt-6 dark:border-zinc-800">
            <p className="text-[11px] font-medium uppercase tracking-wider text-zinc-400">{t("footer.payWith")}</p>
            <div className="flex items-center gap-4">
              {/* Visa */}
              <svg className="h-8 w-auto text-zinc-400 dark:text-zinc-500" viewBox="0 0 48 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect width="48" height="32" rx="4" fill="currentColor" fillOpacity="0.08" stroke="currentColor" strokeOpacity="0.15"/>
                <path d="M20.3 21H17.7L19.3 11H21.9L20.3 21ZM15.8 11L13.3 17.8L13 16.3L13 16.3L12.1 11.7C12.1 11.7 12 11 11.1 11H7.1L7 11.2C7 11.2 8 11.4 9.2 12.1L11.5 21H14.2L18.5 11H15.8ZM37 21H39.3L37.3 11H35.2C34.5 11 33.9 11.4 33.7 12L29.8 21H32.5L33 19.5H36.3L37 21ZM33.8 17.5L35.2 13.7L36 17.5H33.8ZM30.2 13.6L30.6 11.3C30.6 11.3 29.5 11 28.4 11C27.2 11 24.2 11.5 24.2 14.1C24.2 16.5 27.5 16.5 27.5 17.8C27.5 19.1 24.6 18.8 23.5 18L23 20.4C23 20.4 24.2 21 25.8 21C27.5 21 30.2 20.1 30.2 17.7C30.2 15.2 26.9 15 26.9 13.9C26.9 12.8 29.1 12.9 30.2 13.6Z" fill="currentColor" fillOpacity="0.6"/>
              </svg>
              {/* Mastercard */}
              <svg className="h-8 w-auto text-zinc-400 dark:text-zinc-500" viewBox="0 0 48 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect width="48" height="32" rx="4" fill="currentColor" fillOpacity="0.08" stroke="currentColor" strokeOpacity="0.15"/>
                <circle cx="20" cy="16" r="7" fill="currentColor" fillOpacity="0.2"/>
                <circle cx="28" cy="16" r="7" fill="currentColor" fillOpacity="0.2"/>
                <path d="M24 10.8A6.97 6.97 0 0 1 27 16a6.97 6.97 0 0 1-3 5.2A6.97 6.97 0 0 1 21 16a6.97 6.97 0 0 1 3-5.2Z" fill="currentColor" fillOpacity="0.3"/>
              </svg>
              {/* Apple Pay */}
              <svg className="h-8 w-auto text-zinc-400 dark:text-zinc-500" viewBox="0 0 48 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect width="48" height="32" rx="4" fill="currentColor" fillOpacity="0.08" stroke="currentColor" strokeOpacity="0.15"/>
                <path d="M16.2 12.1c.4-.5.7-1.2.6-1.9-.6 0-1.4.4-1.8.9-.4.4-.7 1.1-.6 1.8.7.1 1.3-.3 1.8-.8Zm.6 1c-1 0-1.8.6-2.3.6-.5 0-1.2-.5-2-.5-1 0-2 .6-2.5 1.5-1.1 1.9-.3 4.6.8 6.1.5.8 1.1 1.6 1.9 1.5.8 0 1-.5 2-.5.9 0 1.1.5 2 .5.8 0 1.3-.7 1.8-1.5.6-.8.8-1.7.8-1.7-1.7-.7-2-3.1-.3-4.5-.7-.8-1.3-1.5-2.2-1.5Z" fill="currentColor" fillOpacity="0.6"/>
                <path d="M23.5 12.5h2.3c1.6 0 2.7 1.1 2.7 2.7 0 1.6-1.1 2.7-2.7 2.7h-1.5v2.8h-1.8v-8.2Zm1.8 4h1.2c1.1 0 1.7-.6 1.7-1.4 0-.8-.6-1.3-1.7-1.3h-1.2v2.7Zm6 4.4c-1.2 0-2-.7-2-1.7 0-1 .7-1.6 2.2-1.7l1.6-.1v-.4c0-.7-.4-1-1.2-1-.6 0-1.1.3-1.2.7h-1c0-1 .9-1.8 2.3-1.8s2.2.8 2.2 2v4.1h-1.1v-1h0c-.4.7-1 1-1.8 1Zm.3-1.2c.8 0 1.4-.5 1.4-1.3v-.5l-1.4.1c-.8.1-1.1.4-1.1.8 0 .5.4.9 1.1.9Zm4 3.1c-.2 0-.4 0-.5 0v-1.1h.4c.6 0 .9-.2 1.1-.9l.1-.3-2.2-6.1h1.4l1.5 5h0l1.5-5h1.4l-2.3 6.5c-.5 1.4-1 1.9-2.4 1.9Z" fill="currentColor" fillOpacity="0.6"/>
              </svg>
              {/* PayPal */}
              <svg className="h-8 w-auto text-zinc-400 dark:text-zinc-500" viewBox="0 0 48 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect width="48" height="32" rx="4" fill="currentColor" fillOpacity="0.08" stroke="currentColor" strokeOpacity="0.15"/>
                <path d="M19.4 22.5h-2l.2-1.3h1.1c1.4 0 2.5-.4 2.8-2 .3-1.3-.4-2-1.8-2h-3.2l-2 10h2l.8-4h.8c2.3 0 3.9-1 4.3-3.1.3-1.5-.3-2.8-2-3.2-.2 0 0 0 0 0-.5-.1.7.2-.5.1l-.5 5.5Z" fill="currentColor" fillOpacity="0.35"/>
                <path d="M30 10.5h-3.3c-.3 0-.5.2-.5.4l-2 10c0 .2.1.3.3.3h1.7c.2 0 .4-.1.4-.3l.6-3c0-.3.3-.4.5-.4h1.2c2.5 0 3.9-1.2 4.3-3.5.2-.9 0-1.7-.4-2.3-.5-.6-1.5-1-2.8-1.2Zm.4 3.5c-.2 1.3-1.2 1.3-2.2 1.3h-.6l.4-2.5c0-.1.1-.2.3-.2h.3c.7 0 1.3 0 1.6.4.2.2.3.6.2 1Z" fill="currentColor" fillOpacity="0.6"/>
              </svg>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}
