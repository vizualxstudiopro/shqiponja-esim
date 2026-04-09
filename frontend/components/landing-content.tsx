"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import { useI18n } from "@/lib/i18n-context";
import PackageGrid from "@/components/package-grid";
import PackageFinder from "@/components/package-finder";
import TouristCards from "@/components/tourist-cards";
import WorldCupSection from "@/components/world-cup-section";
import { Smartphone, Search, CheckCircle, XCircle, ChevronDown, X, ListChecks } from "lucide-react";

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

/* ═══ Real eSIM-compatible devices database (grouped by brand) ═══ */
const ESIM_DEVICES: Record<string, string[]> = {
  Apple: [
    "iPhone XR",
    "iPhone XS",
    "iPhone XS Max",
    "iPhone 11",
    "iPhone 11 Pro",
    "iPhone 11 Pro Max",
    "iPhone SE (2020)",
    "iPhone 12 mini",
    "iPhone 12",
    "iPhone 12 Pro",
    "iPhone 12 Pro Max",
    "iPhone 13 mini",
    "iPhone 13",
    "iPhone 13 Pro",
    "iPhone 13 Pro Max",
    "iPhone SE (2022)",
    "iPhone 14",
    "iPhone 14 Plus",
    "iPhone 14 Pro",
    "iPhone 14 Pro Max",
    "iPhone 15",
    "iPhone 15 Plus",
    "iPhone 15 Pro",
    "iPhone 15 Pro Max",
    "iPhone 16",
    "iPhone 16 Plus",
    "iPhone 16 Pro",
    "iPhone 16 Pro Max",
    "iPad Pro (2018+)",
    "iPad Air (2019+)",
    "iPad mini (2019+)",
    "iPad (2019+)",
    "Apple Watch Series 3+",
  ],
  Samsung: [
    "Galaxy S20",
    "Galaxy S20+",
    "Galaxy S20 Ultra",
    "Galaxy S20 FE",
    "Galaxy S21",
    "Galaxy S21+",
    "Galaxy S21 Ultra",
    "Galaxy S21 FE",
    "Galaxy S22",
    "Galaxy S22+",
    "Galaxy S22 Ultra",
    "Galaxy S23",
    "Galaxy S23+",
    "Galaxy S23 Ultra",
    "Galaxy S23 FE",
    "Galaxy S24",
    "Galaxy S24+",
    "Galaxy S24 Ultra",
    "Galaxy S24 FE",
    "Galaxy S25",
    "Galaxy S25+",
    "Galaxy S25 Ultra",
    "Galaxy Note 20",
    "Galaxy Note 20 Ultra",
    "Galaxy Z Flip",
    "Galaxy Z Flip3",
    "Galaxy Z Flip4",
    "Galaxy Z Flip5",
    "Galaxy Z Flip6",
    "Galaxy Z Fold2",
    "Galaxy Z Fold3",
    "Galaxy Z Fold4",
    "Galaxy Z Fold5",
    "Galaxy Z Fold6",
    "Galaxy A54 5G",
    "Galaxy A55 5G",
    "Galaxy A35 5G",
    "Galaxy A34 5G",
    "Galaxy A25 5G",
    "Galaxy A15 5G",
  ],
  Google: [
    "Pixel 2",
    "Pixel 2 XL",
    "Pixel 3",
    "Pixel 3 XL",
    "Pixel 3a",
    "Pixel 3a XL",
    "Pixel 4",
    "Pixel 4 XL",
    "Pixel 4a",
    "Pixel 4a 5G",
    "Pixel 5",
    "Pixel 5a",
    "Pixel 6",
    "Pixel 6 Pro",
    "Pixel 6a",
    "Pixel 7",
    "Pixel 7 Pro",
    "Pixel 7a",
    "Pixel 8",
    "Pixel 8 Pro",
    "Pixel 8a",
    "Pixel 9",
    "Pixel 9 Pro",
    "Pixel 9 Pro Fold",
  ],
  Huawei: [
    "P40",
    "P40 Pro",
    "P40 Pro+",
    "P50 Pro",
    "P50 Pocket",
    "Mate 40 Pro",
    "Mate 40 Pro+",
    "Mate 50 Pro",
    "Nova 8i",
  ],
  Motorola: [
    "Razr (2019)",
    "Razr 5G",
    "Razr (2022)",
    "Razr+ (2023)",
    "Razr (2023)",
    "Razr+ (2024)",
    "Razr (2024)",
    "Edge 40",
    "Edge 40 Pro",
    "Edge 40 Neo",
    "Edge 30 Fusion",
    "Edge+ (2023)",
    "Moto G84 5G",
    "Moto G54 5G",
    "Moto G53 5G",
  ],
  Xiaomi: [
    "12T Pro",
    "13",
    "13 Lite",
    "13 Pro",
    "13T",
    "13T Pro",
    "14",
    "14 Pro",
    "14 Ultra",
    "14T",
    "14T Pro",
    "Mix Fold 3",
    "Redmi Note 13 Pro 5G",
    "Poco F6 Pro",
  ],
  OnePlus: [
    "12",
    "12R",
    "11",
    "11R",
    "Open (Fold)",
    "Nord 3",
    "Nord CE3 Lite",
  ],
  Oppo: [
    "Find X5 Pro",
    "Find X5",
    "Find X6 Pro",
    "Find N2 Flip",
    "Find N3",
    "Find N3 Flip",
    "Reno 10 Pro+",
    "A79 5G",
  ],
  Sony: [
    "Xperia 1 IV",
    "Xperia 1 V",
    "Xperia 1 VI",
    "Xperia 5 IV",
    "Xperia 5 V",
    "Xperia 10 IV",
    "Xperia 10 V",
    "Xperia 10 VI",
  ],
  Nokia: [
    "G60 5G",
    "X30 5G",
    "XR21",
  ],
  Honor: [
    "Magic 4 Pro",
    "Magic 5 Pro",
    "Magic 6 Pro",
    "90",
    "Magic V2",
    "Magic V3",
  ],
  Microsoft: [
    "Surface Duo",
    "Surface Duo 2",
    "Surface Pro X",
    "Surface Pro 9 5G",
    "Surface Pro 10",
  ],
  Nothing: [
    "Phone (2)",
    "Phone (2a)",
  ],
};

/* Flatten all devices into a searchable array with brand prefix */
const ALL_DEVICES: { brand: string; model: string; searchKey: string }[] = [];
for (const [brand, models] of Object.entries(ESIM_DEVICES)) {
  for (const model of models) {
    ALL_DEVICES.push({
      brand,
      model,
      searchKey: `${brand} ${model}`.toLowerCase(),
    });
  }
}

export default function LandingContent() {
  const { t } = useI18n();
  const touristRef = useReveal();
  const packagesRef = useReveal();
  const finderRef = useReveal();
  const howRef = useReveal();
  const compatRef = useReveal();
  const ctaRef = useReveal();
  const trustRef = useReveal();

  const [deviceQuery, setDeviceQuery] = useState("");
  const [compatResult, setCompatResult] = useState<"idle" | "compatible" | "unknown">("idle");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showAllModal, setShowAllModal] = useState(false);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  const suggestions = useMemo(() => {
    if (deviceQuery.trim().length < 1) return [];
    const q = deviceQuery.toLowerCase().trim();
    return ALL_DEVICES.filter((d) => d.searchKey.includes(q)).slice(0, 20);
  }, [deviceQuery]);

  function handleDeviceInput(q: string) {
    setDeviceQuery(q);
    setShowSuggestions(true);
    if (q.trim().length < 2) { setCompatResult("idle"); return; }
    const lower = q.toLowerCase().trim();
    const exact = ALL_DEVICES.some((d) => d.searchKey === lower);
    if (exact) { setCompatResult("compatible"); setShowSuggestions(false); return; }
    setCompatResult(suggestions.length > 0 ? "idle" : "unknown");
  }

  function selectDevice(brand: string, model: string) {
    setDeviceQuery(`${brand} ${model}`);
    setCompatResult("compatible");
    setShowSuggestions(false);
  }

  // Close suggestions on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (suggestionsRef.current && !suggestionsRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

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

      {/* ══════════ WORLD CUP 2026 ══════════ */}
      <WorldCupSection />

      {/* ══════════ TOURIST DESTINATIONS ══════════ */}
      <section className="bg-white py-20 lg:py-28 dark:bg-zinc-950">
        <div ref={touristRef} className="reveal mx-auto max-w-7xl px-6">
          <div className="text-center">
            <span className="inline-block rounded-full bg-shqiponja/10 px-4 py-1 text-xs font-semibold uppercase tracking-widest text-shqiponja">
              ✈️ {t("tourist.badge")}
            </span>
            <h2 className="mt-4 text-3xl font-extrabold tracking-tight sm:text-4xl">
              {t("tourist.title")}
            </h2>
            <p className="mx-auto mt-3 max-w-lg text-zinc-500">
              {t("tourist.subtitle")}
            </p>
          </div>

          <div className="mt-12">
            <TouristCards />
          </div>
        </div>
      </section>

      {/* ══════════ PACKAGES ══════════ */}
      <section id="packages" className="bg-zinc-50 py-20 lg:py-28 dark:bg-zinc-900">
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

      {/* ══════════ PACKAGE FINDER ══════════ */}
      <section id="finder" className="bg-zinc-50 py-20 lg:py-28 dark:bg-zinc-900">
        <div ref={finderRef} className="reveal mx-auto max-w-7xl px-6">
          <div className="text-center">
            <span className="inline-block rounded-full bg-shqiponja/10 px-4 py-1 text-xs font-semibold uppercase tracking-widest text-shqiponja">
              {t("finder.badge")}
            </span>
            <h2 className="mt-4 text-3xl font-extrabold tracking-tight sm:text-4xl">
              {t("finder.title")}
            </h2>
            <p className="mx-auto mt-3 max-w-lg text-zinc-500">
              {t("finder.subtitle")}
            </p>
          </div>

          <div className="mt-12">
            <PackageFinder />
          </div>
        </div>
      </section>

      {/* ══════════ HOW IT WORKS ══════════ */}
      <section id="how" className="bg-white py-20 lg:py-28 dark:bg-zinc-950">
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

            {/* Search input + autocomplete */}
            <div className="mt-8 relative mx-auto max-w-md" ref={suggestionsRef}>
              <Smartphone className="absolute left-4 top-[18px] h-5 w-5 text-zinc-400 pointer-events-none z-10" />
              <input
                type="text"
                value={deviceQuery}
                onChange={(e) => handleDeviceInput(e.target.value)}
                onFocus={() => deviceQuery.length >= 1 && setShowSuggestions(true)}
                placeholder={t("compat.placeholder")}
                className="w-full rounded-2xl border border-zinc-200 bg-zinc-50 py-4 pl-12 pr-12 text-base outline-none transition focus:border-shqiponja focus:ring-2 focus:ring-shqiponja/20 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
              />
              <Search className="absolute right-4 top-[18px] h-5 w-5 text-zinc-300 pointer-events-none" />

              {/* Dropdown suggestions */}
              {showSuggestions && suggestions.length > 0 && (
                <div className="absolute left-0 right-0 top-full z-30 mt-2 max-h-64 overflow-y-auto rounded-xl border border-zinc-200 bg-white shadow-xl dark:border-zinc-700 dark:bg-zinc-800">
                  {suggestions.map((d) => (
                    <button
                      key={`${d.brand}-${d.model}`}
                      onClick={() => selectDevice(d.brand, d.model)}
                      className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm hover:bg-shqiponja/5 transition-colors dark:hover:bg-shqiponja/10"
                    >
                      <Smartphone className="h-4 w-4 shrink-0 text-shqiponja" />
                      <span className="font-semibold text-zinc-700 dark:text-zinc-200">{d.brand}</span>
                      <span className="text-zinc-500 dark:text-zinc-400">{d.model}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Result */}
            {compatResult === "compatible" && (
              <div className="mt-5 inline-flex items-center gap-2 rounded-xl bg-green-50 px-5 py-3 text-green-700 dark:bg-green-900/20 dark:text-green-400 animate-fade-up">
                <CheckCircle className="h-5 w-5 shrink-0" />
                <span className="text-sm font-semibold">{t("compat.yes")}</span>
              </div>
            )}
            {compatResult === "unknown" && deviceQuery.trim().length >= 2 && suggestions.length === 0 && (
              <div className="mt-5 inline-flex items-center gap-2 rounded-xl bg-amber-50 px-5 py-3 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400 animate-fade-up">
                <XCircle className="h-5 w-5 shrink-0" />
                <span className="text-sm font-semibold">{t("compat.unknown")}</span>
              </div>
            )}

            {/* Show all devices button */}
            <div className="mt-6">
              <button
                onClick={() => setShowAllModal(true)}
                className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-zinc-50 px-5 py-2.5 text-sm font-semibold text-zinc-600 transition hover:bg-shqiponja/5 hover:border-shqiponja/30 hover:text-shqiponja dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-shqiponja/10"
              >
                <ListChecks className="h-4 w-4" />
                {t("compat.showAll")}
              </button>
            </div>

            <p className="mt-4 text-xs text-zinc-400">{t("compat.hint")}</p>
          </div>
        </div>
      </section>

      {/* ══════════ SHOW ALL DEVICES MODAL ══════════ */}
      {showAllModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={() => setShowAllModal(false)}>
          <div
            className="relative w-full max-w-3xl max-h-[85vh] overflow-y-auto rounded-2xl bg-white shadow-2xl dark:bg-zinc-900"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-zinc-200 bg-white/95 backdrop-blur-sm px-6 py-4 dark:border-zinc-700 dark:bg-zinc-900/95">
              <h3 className="text-lg font-bold">{t("compat.modalTitle")}</h3>
              <button onClick={() => setShowAllModal(false)} className="rounded-full p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="grid gap-6 p-6 sm:grid-cols-2 lg:grid-cols-3">
              {Object.entries(ESIM_DEVICES).map(([brand, models]) => (
                <div key={brand}>
                  <h4 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-shqiponja">
                    <Smartphone className="h-4 w-4" /> {brand}
                  </h4>
                  <ul className="mt-2 space-y-1">
                    {models.map((model) => (
                      <li key={model} className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
                        <CheckCircle className="h-3 w-3 shrink-0 text-green-500" />
                        {model}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

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

      {/* ══════════ TRUST BADGES ══════════ */}
      <section className="bg-zinc-50 py-20 lg:py-28 dark:bg-zinc-900">
        <div ref={trustRef} className="reveal mx-auto max-w-7xl px-6">
          <div className="text-center">
            <span className="inline-block rounded-full bg-shqiponja/10 px-4 py-1 text-xs font-semibold uppercase tracking-widest text-shqiponja">
              ✓ {t("trust.title")}
            </span>
            <h2 className="mt-4 text-3xl font-extrabold tracking-tight sm:text-4xl">
              {t("trust.title")}
            </h2>
            <p className="mx-auto mt-3 max-w-lg text-zinc-500">
              {t("trust.subtitle")}
            </p>
          </div>

          <div className="mt-14 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { icon: <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" /></svg>, titleKey: "trust.instant" as const, descKey: "trust.instantDesc" as const },
              { icon: <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.623 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" /></svg>, titleKey: "trust.secure" as const, descKey: "trust.secureDesc" as const },
              { icon: <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A11.978 11.978 0 0112 16.5a11.978 11.978 0 01-8.716-2.247m0 0A8.966 8.966 0 013 12c0-1.264.26-2.467.727-3.56" /></svg>, titleKey: "trust.global" as const, descKey: "trust.globalDesc" as const },
              { icon: <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" /></svg>, titleKey: "trust.noHidden" as const, descKey: "trust.noHiddenDesc" as const },
            ].map((b, i) => (
              <div key={i} className="rounded-2xl border border-zinc-200 bg-white p-6 text-center transition-all duration-300 hover:shadow-lg hover:-translate-y-1 dark:border-zinc-700 dark:bg-zinc-800">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-shqiponja/10 text-shqiponja">
                  {b.icon}
                </div>
                <h3 className="mt-4 text-lg font-bold">{t(b.titleKey)}</h3>
                <p className="mt-2 text-sm leading-relaxed text-zinc-500">{t(b.descKey)}</p>
              </div>
            ))}
          </div>
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

          {/* Social media */}
          <div className="mt-6 flex justify-center gap-4">
            {[
              { label: "Facebook", href: "#", icon: <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z"/></svg> },
              { label: "Instagram", href: "#", icon: <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 1.17.054 1.97.24 2.43.403a4.088 4.088 0 0 1 1.523.994 4.088 4.088 0 0 1 .994 1.523c.163.46.349 1.26.403 2.43.058 1.266.07 1.646.07 4.85s-.012 3.584-.07 4.85c-.054 1.17-.24 1.97-.403 2.43a4.088 4.088 0 0 1-.994 1.523 4.088 4.088 0 0 1-1.523.994c-.46.163-1.26.349-2.43.403-1.266.058-1.646.07-4.85.07s-3.584-.012-4.85-.07c-1.17-.054-1.97-.24-2.43-.403a4.088 4.088 0 0 1-1.523-.994 4.088 4.088 0 0 1-.994-1.523c-.163-.46-.349-1.26-.403-2.43C2.175 15.584 2.163 15.204 2.163 12s.012-3.584.07-4.85c.054-1.17.24-1.97.403-2.43a4.088 4.088 0 0 1 .994-1.523A4.088 4.088 0 0 1 5.153 2.3c.46-.163 1.26-.349 2.43-.403C8.849 1.838 9.229 1.826 12 1.826V2.163zm0 1.802c-3.148 0-3.504.012-4.743.068-1.145.052-1.766.244-2.18.405a3.64 3.64 0 0 0-1.353.88 3.64 3.64 0 0 0-.88 1.353c-.161.414-.353 1.035-.405 2.18C2.383 9.09 2.37 9.446 2.37 12.594v-.001c0 3.148.013 3.504.069 4.743.052 1.145.244 1.766.405 2.18.192.501.437.914.88 1.353.44.443.852.688 1.353.88.414.161 1.035.353 2.18.405 1.24.056 1.596.069 4.744.069 3.149 0 3.505-.013 4.744-.069 1.145-.052 1.766-.244 2.18-.405a3.64 3.64 0 0 0 1.353-.88c.443-.44.688-.852.88-1.353.161-.414.353-1.035.405-2.18.056-1.24.069-1.596.069-4.744 0-3.148-.013-3.504-.069-4.743-.052-1.145-.244-1.766-.405-2.18a3.64 3.64 0 0 0-.88-1.353 3.64 3.64 0 0 0-1.353-.88c-.414-.161-1.035-.353-2.18-.405C15.504 3.977 15.148 3.965 12 3.965zm0 3.066a4.969 4.969 0 1 1 0 9.937 4.969 4.969 0 0 1 0-9.937zm0 8.192a3.223 3.223 0 1 0 0-6.446 3.223 3.223 0 0 0 0 6.446zm6.406-8.39a1.16 1.16 0 1 1-2.32 0 1.16 1.16 0 0 1 2.32 0z"/></svg> },
              { label: "TikTok", href: "#", icon: <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1 0-5.78c.27 0 .54.04.8.1v-3.5a6.37 6.37 0 0 0-.8-.05A6.34 6.34 0 0 0 3.15 15.2a6.34 6.34 0 0 0 10.86 4.43V13a8.28 8.28 0 0 0 4.83 1.56v-3.44a4.85 4.85 0 0 1-.75.06 4.83 4.83 0 0 1-2.5-.7v6.15"/></svg> },
              { label: "LinkedIn", href: "#", icon: <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 1 1 0-4.125 2.062 2.062 0 0 1 0 4.125zM7.119 20.452H3.555V9h3.564v11.452z"/></svg> },
              { label: "X", href: "#", icon: <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg> },
              { label: "WhatsApp", href: "#", icon: <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/></svg> },
            ].map((s) => (
              <a
                key={s.label}
                href={s.href}
                aria-label={s.label}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-full border border-zinc-200 p-2.5 text-zinc-400 transition hover:border-shqiponja/30 hover:text-shqiponja dark:border-zinc-700 dark:hover:border-shqiponja/30"
              >
                {s.icon}
              </a>
            ))}
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
