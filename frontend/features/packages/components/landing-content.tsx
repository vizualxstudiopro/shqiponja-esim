"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import dynamic from "next/dynamic";
import { useI18n } from "@/lib/i18n-context";
import { Smartphone, Search, CheckCircle, XCircle, ChevronDown, X, ListChecks, Mail } from "lucide-react";
import { subscribeNewsletter, type EsimPackage } from "@/lib/api";

import Link from "next/link";

const PackageGrid = dynamic(() => import("@/components/package-grid"));
const PackageFinder = dynamic(() => import("@/components/package-finder"));
const Footer = dynamic(() => import("@/components/footer"));
const TouristCards = dynamic(() => import("@/components/tourist-cards"));
const WorldCupSection = dynamic(() => import("@/components/world-cup-section"));
const CoverageMap = dynamic(() => import("@/components/coverage-map"), { ssr: false });

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

type LandingContentProps = {
  initialPackages?: EsimPackage[];
};

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

export default function LandingContent({ initialPackages }: LandingContentProps) {
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

  const installPreviewSteps = [
    "Bli paketën dhe hap email-in e konfirmimit.",
    "Skano QR kodin nga Settings > Cellular/SIM.",
    "Aktivizo Data Roaming kur mbërrin në destinacion.",
  ];

  const installPhoneStates = [
    {
      badge: "Order Ready",
      title: "Europe 10GB / 30 ditë",
      action: "Konfirmimi me email",
      button: "Shiko email-in",
      cards: ["Data: 10GB", "Roaming: OFF", "Signal: --", "Country: --"],
    },
    {
      badge: "QR Ready",
      title: "Skano eSIM tani",
      action: "Instalimi",
      button: "Shiko QR Kodin",
      cards: ["Data: 10GB", "Roaming: OFF", "Signal: 4G", "Country: AL"],
    },
    {
      badge: "Connected",
      title: "Paketa aktive",
      action: "Network live",
      button: "Hap panelin",
      cards: ["Data: 7.5GB", "Roaming: ON", "Signal: 4G", "Country: IT"],
    },
  ];

  const [activeInstallStep, setActiveInstallStep] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveInstallStep((prev) => (prev + 1) % installPreviewSteps.length);
    }, 2800);
    return () => clearInterval(timer);
  }, [installPreviewSteps.length]);

  const activePhoneState = installPhoneStates[activeInstallStep];

  return (
    <>
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

          <PackageGrid initialPackages={initialPackages} />
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
      <section id="compatibility" className="bg-white py-20 lg:py-28 dark:bg-zinc-950">
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

      {/* ══════════ INSTALL PREVIEW (ALT) ══════════ */}
      <section className="bg-zinc-50 py-16 lg:py-20 dark:bg-zinc-900">
        <div className="mx-auto grid max-w-7xl items-center gap-10 px-6 lg:grid-cols-2">
          <div>
            <span className="inline-block rounded-full bg-shqiponja/10 px-4 py-1 text-xs font-semibold uppercase tracking-widest text-shqiponja">
              Udhëzues i shpejtë
            </span>
            <h3 className="mt-4 text-2xl font-extrabold tracking-tight sm:text-3xl">
              Instalimi në telefon, hap pas hapi
            </h3>
            <p className="mt-3 max-w-xl text-zinc-500 dark:text-zinc-400">
              Pasi pajisja del kompatibile, ndiq këtë flow të shkurtër për aktivizim. Është version i shpejtë i udhëzuesit me pamje reale.
            </p>

            <div className="mt-6 space-y-3">
              {installPreviewSteps.map((item, i) => (
                <div
                  key={item}
                  className={`flex items-start gap-3 rounded-xl border p-4 transition-all duration-300 ${
                    activeInstallStep === i
                      ? "border-shqiponja/40 bg-shqiponja/5 dark:bg-shqiponja/10"
                      : "border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-800"
                  }`}
                >
                  <span className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white ${activeInstallStep === i ? "bg-shqiponja" : "bg-zinc-400"}`}>
                    {i + 1}
                  </span>
                  <p className="text-sm text-zinc-600 dark:text-zinc-300">{item}</p>
                </div>
              ))}
            </div>

            <a
              href="/instalimi"
              className="mt-6 inline-flex items-center rounded-full bg-shqiponja px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-shqiponja/20 transition hover:bg-shqiponja-dark"
            >
              Hap guidën e plotë
            </a>
          </div>

          <div className="relative mx-auto w-fit">
            <div className="pointer-events-none absolute left-1/2 top-1/2 h-[420px] w-[420px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-shqiponja/10 blur-3xl" />

            <div
              className="relative h-[610px] w-[300px] overflow-hidden rounded-[48px] border-[7px] border-zinc-900 bg-zinc-950 shadow-[0_30px_80px_rgba(0,0,0,0.35)]"
              style={{ transform: "perspective(1200px) rotateY(-12deg) rotateX(4deg)" }}
            >
              <div className="absolute left-1/2 top-0 z-20 h-7 w-28 -translate-x-1/2 rounded-b-3xl bg-zinc-900" />

              <div className="relative flex h-full flex-col p-4 pt-10">
                <div className="rounded-2xl border border-white/10 bg-zinc-900/90 p-3">
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-zinc-400">Shqiponja eSIM</p>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${activeInstallStep === 2 ? "bg-emerald-500/20 text-emerald-400" : "bg-amber-500/20 text-amber-300"}`}>
                      {activePhoneState.badge}
                    </span>
                  </div>
                  <p className="mt-2 text-sm font-bold text-zinc-100">{activePhoneState.title}</p>
                </div>

                <div className="mt-3 rounded-2xl border border-white/10 bg-zinc-900/80 p-3">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-[10px] uppercase tracking-[0.15em] text-zinc-500">{activePhoneState.action}</span>
                    <span className={`h-2 w-2 rounded-full ${activeInstallStep === 2 ? "bg-emerald-400" : "bg-shqiponja"}`} />
                  </div>
                  <div className="space-y-2">
                    <div className={`h-2 rounded-full transition-all duration-500 ${activeInstallStep >= 0 ? "bg-shqiponja/50" : "bg-white/10"}`} />
                    <div className={`h-2 w-4/5 rounded-full transition-all duration-500 ${activeInstallStep >= 1 ? "bg-shqiponja/50" : "bg-white/10"}`} />
                    <div className={`h-2 w-2/3 rounded-full transition-all duration-500 ${activeInstallStep >= 2 ? "bg-emerald-500/50" : "bg-white/10"}`} />
                  </div>
                  <div className="mt-4 rounded-xl bg-shqiponja px-3 py-2 text-center text-xs font-semibold text-white">
                    {activePhoneState.button}
                  </div>
                </div>

                <div className="mt-3 flex-1 rounded-2xl border border-white/10 bg-zinc-900/80 p-3">
                  <p className="text-[10px] uppercase tracking-[0.15em] text-zinc-500">Status i rrjetit</p>
                  <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                    {activePhoneState.cards.map((card) => (
                      <div key={card} className="rounded-lg border border-white/10 bg-white/5 p-2 text-zinc-300 transition-colors duration-300">
                        {card}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pointer-events-none absolute inset-[7px] rounded-[40px] overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-white/15 via-transparent to-transparent" />
                  <div className="absolute -left-24 top-12 h-52 w-28 rotate-12 bg-white/10 blur-2xl" />
                </div>
              </div>
            </div>
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
          <Link
            href="/#packages"
            className="mt-8 inline-block rounded-full bg-white px-8 py-3.5 text-base font-bold text-shqiponja shadow-lg hover:bg-zinc-100 hover:scale-105 transition-all duration-300"
          >
            {t("cta.btn")}
          </Link>
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

          <div className="mt-14 grid gap-8 sm:grid-cols-2 lg:grid-cols-5">
            {[
              { icon: <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" /></svg>, titleKey: "trust.instant" as const, descKey: "trust.instantDesc" as const },
              { icon: <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.623 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" /></svg>, titleKey: "trust.secure" as const, descKey: "trust.secureDesc" as const },
              { icon: <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A11.978 11.978 0 0112 16.5a11.978 11.978 0 01-8.716-2.247m0 0A8.966 8.966 0 013 12c0-1.264.26-2.467.727-3.56" /></svg>, titleKey: "trust.global" as const, descKey: "trust.globalDesc" as const },
              { icon: <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" /></svg>, titleKey: "trust.noHidden" as const, descKey: "trust.noHiddenDesc" as const },
              { icon: <svg className="h-7 w-7" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" /></svg>, titleKey: "trust.airalo" as const, descKey: "trust.airaloDesc" as const },
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

      {/* ══════════ TESTIMONIALS ══════════ */}
      <section className="bg-zinc-50 py-20 dark:bg-zinc-900">
        <div className="mx-auto max-w-7xl px-6">
          <h2 className="text-center text-3xl font-extrabold tracking-tight sm:text-4xl">
            {t("testimonials.title")}
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-center text-zinc-500">
            {t("testimonials.subtitle")}
          </p>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {([
              { name: "Arben K.", location: "🇦🇱 Tiranë", rating: 5, textKey: "testimonials.review1" as const },
              { name: "Elira M.", location: "🇽🇰 Prishtinë", rating: 5, textKey: "testimonials.review2" as const },
              { name: "Dritan B.", location: "🇩🇪 München", rating: 5, textKey: "testimonials.review3" as const },
              { name: "Blerta H.", location: "🇨🇭 Zürich", rating: 4, textKey: "testimonials.review4" as const },
              { name: "Faton R.", location: "🇮🇹 Milano", rating: 5, textKey: "testimonials.review5" as const },
              { name: "Liridona S.", location: "🇬🇧 London", rating: 5, textKey: "testimonials.review6" as const },
            ]).map((review, i) => (
              <div
                key={i}
                className="rounded-2xl border border-zinc-200 bg-white p-6 transition-all duration-300 hover:shadow-lg dark:border-zinc-700 dark:bg-zinc-800"
              >
                <div className="flex items-center gap-1 text-amber-400">
                  {Array.from({ length: 5 }).map((_, s) => (
                    <svg key={s} className={`h-4 w-4 ${s < review.rating ? "fill-current" : "fill-zinc-200 dark:fill-zinc-600"}`} viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <p className="mt-4 text-sm leading-relaxed text-zinc-600 dark:text-zinc-300">
                  &ldquo;{t(review.textKey)}&rdquo;
                </p>
                <div className="mt-4 flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-shqiponja/10 text-sm font-bold text-shqiponja">
                    {review.name.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-semibold">{review.name}</p>
                    <p className="text-xs text-zinc-400">{review.location}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <NewsletterSection />
      <CoverageMap />
      <Footer />
    </>
  );
}

/* ─── Newsletter Section (used inside LandingContent) ─── */
function NewsletterSection() {
  const { t, locale } = useI18n();
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [error, setError] = useState("");
  const ref = useReveal();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setStatus("loading");
    setError("");
    try {
      await subscribeNewsletter(email.trim(), locale);
      setStatus("success");
      setEmail("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gabim");
      setStatus("error");
    }
  }

  return (
    <section className="py-20 bg-gradient-to-br from-shqiponja/5 via-transparent to-shqiponja/5 dark:from-shqiponja/10 dark:to-shqiponja/10">
      <div ref={ref} className="reveal-on-scroll mx-auto max-w-2xl px-4 text-center">
        <div className="inline-flex items-center gap-2 rounded-full bg-shqiponja/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-shqiponja mb-6">
          <Mail className="h-3.5 w-3.5" />
          {locale === "sq" ? "Newsletter" : "Newsletter"}
        </div>
        <h2 className="text-2xl font-extrabold sm:text-3xl">
          {locale === "sq" ? "Merr ofertat e para 🦅" : "Get the best deals first 🦅"}
        </h2>
        <p className="mt-3 text-zinc-500 dark:text-zinc-400">
          {locale === "sq"
            ? "Regjistrohu dhe merr oferta ekskluzive, paketa të reja dhe lajme të udhëtimit direkt në email."
            : "Subscribe and get exclusive deals, new packages, and travel news straight to your inbox."}
        </p>

        {status === "success" ? (
          <div className="mt-8 flex items-center justify-center gap-2 text-green-600 font-semibold">
            <CheckCircle className="h-5 w-5" />
            {locale === "sq" ? "U regjistrove me sukses! 🎉" : "You're subscribed! 🎉"}
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
            <input
              type="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder={locale === "sq" ? "email@yt.com" : "your@email.com"}
              className="w-full sm:max-w-xs rounded-full border border-zinc-200 px-5 py-3 text-sm outline-none focus:border-shqiponja dark:border-zinc-600 dark:bg-zinc-800 dark:text-white"
            />
            <button
              type="submit"
              disabled={status === "loading"}
              className="rounded-full bg-shqiponja px-7 py-3 text-sm font-bold text-white hover:bg-shqiponja/90 transition disabled:opacity-60 whitespace-nowrap"
            >
              {status === "loading"
                ? (locale === "sq" ? "Duke dërguar..." : "Subscribing...")
                : (locale === "sq" ? "Abonohu falas" : "Subscribe free")}
            </button>
          </form>
        )}
        {status === "error" && <p className="mt-2 text-sm text-red-500">{error}</p>}
        <p className="mt-4 text-xs text-zinc-400">
          {locale === "sq" ? "Pa spam. Çregjistrohu kurdo." : "No spam. Unsubscribe anytime."}
        </p>
      </div>
    </section>
  );
}
