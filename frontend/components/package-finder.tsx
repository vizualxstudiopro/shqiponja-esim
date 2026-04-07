"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  getCountriesByContinent,
  getPackages,
  getExchangeRates,
  type CountryInfo,
  type EsimPackage,
} from "@/lib/api";
import { useI18n } from "@/lib/i18n-context";

type Continent =
  | "global"
  | "balkans"
  | "europe"
  | "asia"
  | "middle_east"
  | "africa"
  | "americas"
  | "oceania";

const CONTINENTS: { key: Continent; emoji: string }[] = [
  { key: "global", emoji: "🌍" },
  { key: "balkans", emoji: "🇦🇱" },
  { key: "europe", emoji: "🇪🇺" },
  { key: "asia", emoji: "🌏" },
  { key: "middle_east", emoji: "🕌" },
  { key: "africa", emoji: "🌍" },
  { key: "americas", emoji: "🌎" },
  { key: "oceania", emoji: "🌊" },
];

function FlagIcon({
  countryCode,
  size = "1.5rem",
}: {
  countryCode?: string;
  size?: string;
}) {
  const cc = (countryCode || "").toLowerCase();
  if (cc && cc.length === 2) {
    return (
      <span
        className={`fi fi-${cc} fis`}
        style={{ fontSize: size, borderRadius: "4px", display: "inline-block" }}
      />
    );
  }
  return <span style={{ fontSize: size }}>🌍</span>;
}

export default function PackageFinder() {
  const { t } = useI18n();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [countriesByContinent, setCountriesByContinent] = useState<
    Record<string, CountryInfo[]>
  >({});
  const [globalCount, setGlobalCount] = useState(0);
  const [allPackages, setAllPackages] = useState<EsimPackage[]>([]);
  const [eurToAll, setEurToAll] = useState(109);
  const [loading, setLoading] = useState(true);

  const [selectedContinent, setSelectedContinent] = useState<Continent | null>(
    null
  );
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  const [selectedCountryName, setSelectedCountryName] = useState("");

  useEffect(() => {
    Promise.all([getCountriesByContinent(), getPackages(), getExchangeRates()])
      .then(([data, pkgs, rates]) => {
        setCountriesByContinent(data.countries);
        setGlobalCount(data.global_count);
        setAllPackages(pkgs);
        setEurToAll(rates.eur_to_all);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Get countries for selected continent
  const countries = useMemo(() => {
    if (!selectedContinent || selectedContinent === "global") return [];
    return (countriesByContinent[selectedContinent] || []).sort((a, b) =>
      a.name.localeCompare(b.name)
    );
  }, [selectedContinent, countriesByContinent]);

  // Get packages for selected country or global
  const resultPackages = useMemo(() => {
    if (selectedContinent === "global") {
      return allPackages
        .filter(
          (p) =>
            p.category === "global" ||
            !p.country_code ||
            p.country_code === ""
        )
        .sort((a, b) => a.price - b.price);
    }
    if (selectedCountry) {
      return allPackages
        .filter(
          (p) =>
            p.country_code?.toUpperCase() === selectedCountry.toUpperCase()
        )
        .sort((a, b) => a.price - b.price);
    }
    return [];
  }, [selectedContinent, selectedCountry, allPackages]);

  function handleContinentSelect(c: Continent) {
    setSelectedContinent(c);
    setSelectedCountry(null);
    setSelectedCountryName("");
    if (c === "global") {
      setStep(3);
    } else {
      setStep(2);
    }
  }

  function handleCountrySelect(country: CountryInfo) {
    setSelectedCountry(country.country_code);
    setSelectedCountryName(country.name);
    setStep(3);
  }

  function goBack() {
    if (step === 3) {
      if (selectedContinent === "global") {
        setStep(1);
        setSelectedContinent(null);
      } else {
        setStep(2);
        setSelectedCountry(null);
        setSelectedCountryName("");
      }
    } else if (step === 2) {
      setStep(1);
      setSelectedContinent(null);
    }
  }

  function reset() {
    setStep(1);
    setSelectedContinent(null);
    setSelectedCountry(null);
    setSelectedCountryName("");
  }

  const continentLabels: Record<Continent, string> = {
    global: t("finder.global"),
    balkans: t("finder.balkans"),
    europe: t("finder.europe"),
    asia: t("finder.asia"),
    middle_east: t("finder.middle_east"),
    africa: t("finder.africa"),
    americas: t("finder.americas"),
    oceania: t("finder.oceania"),
  };

  if (loading) {
    return (
      <div className="flex justify-center py-10">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-200 border-t-shqiponja" />
      </div>
    );
  }

  return (
    <div>
      {/* Step indicator */}
      <div className="mb-8 flex items-center justify-center gap-2 text-sm">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex items-center gap-2">
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-colors ${
                step >= s
                  ? "bg-shqiponja text-white"
                  : "bg-zinc-100 text-zinc-400 dark:bg-zinc-800"
              }`}
            >
              {s}
            </div>
            <span
              className={`hidden sm:inline text-xs font-medium ${
                step >= s
                  ? "text-zinc-700 dark:text-zinc-200"
                  : "text-zinc-400"
              }`}
            >
              {s === 1 ? t("finder.step1") : s === 2 ? t("finder.step2") : t("finder.step3")}
            </span>
            {s < 3 && (
              <div
                className={`h-px w-8 sm:w-12 ${
                  step > s ? "bg-shqiponja" : "bg-zinc-200 dark:bg-zinc-700"
                }`}
              />
            )}
          </div>
        ))}
      </div>

      {/* Back button */}
      {step > 1 && (
        <button
          onClick={goBack}
          className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-zinc-500 hover:text-shqiponja transition"
        >
          <svg
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15.75 19.5L8.25 12l7.5-7.5"
            />
          </svg>
          {t("finder.back")}
        </button>
      )}

      {/* ── STEP 1: Select Continent ── */}
      {step === 1 && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {CONTINENTS.map((c) => {
            const countryCount =
              c.key === "global"
                ? globalCount
                : (countriesByContinent[c.key] || []).length;
            return (
              <button
                key={c.key}
                onClick={() => handleContinentSelect(c.key)}
                className="group flex items-center gap-4 rounded-2xl border border-zinc-200 bg-white p-5 text-left transition-all duration-200 hover:border-shqiponja/40 hover:shadow-lg hover:-translate-y-0.5 dark:border-zinc-700 dark:bg-zinc-800 dark:hover:border-shqiponja/40"
              >
                <span className="text-3xl">{c.emoji}</span>
                <div>
                  <p className="text-sm font-bold text-zinc-800 dark:text-zinc-100">
                    {continentLabels[c.key]}
                  </p>
                  <p className="text-xs text-zinc-400">
                    {c.key === "global"
                      ? t("finder.globalDesc")
                      : `${countryCount} ${countryCount === 1 ? "vend" : "vende"}`}
                  </p>
                </div>
                <svg
                  className="ml-auto h-5 w-5 text-zinc-300 group-hover:text-shqiponja transition"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M8.25 4.5l7.5 7.5-7.5 7.5"
                  />
                </svg>
              </button>
            );
          })}
        </div>
      )}

      {/* ── STEP 2: Select Country ── */}
      {step === 2 && selectedContinent && selectedContinent !== "global" && (
        <div>
          <p className="mb-4 text-center text-sm text-zinc-500">
            {continentLabels[selectedContinent]} — {t("finder.selectCountry")}
          </p>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {countries.map((c) => (
              <button
                key={c.country_code}
                onClick={() => handleCountrySelect(c)}
                className="group flex items-center gap-3 rounded-xl border border-zinc-200 bg-white px-4 py-3 text-left transition-all duration-200 hover:border-shqiponja/40 hover:shadow-md dark:border-zinc-700 dark:bg-zinc-800 dark:hover:border-shqiponja/40"
              >
                <FlagIcon countryCode={c.country_code} size="1.6rem" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-100 truncate">
                    {c.name}
                  </p>
                  <p className="text-xs text-zinc-400">
                    {c.package_count} {t("finder.packages")} · {t("finder.from")}{" "}
                    €{c.min_price.toFixed(2)}
                  </p>
                </div>
                <svg
                  className="h-4 w-4 shrink-0 text-zinc-300 group-hover:text-shqiponja transition"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M8.25 4.5l7.5 7.5-7.5 7.5"
                  />
                </svg>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── STEP 3: Show matching packages ── */}
      {step === 3 && (
        <div>
          <p className="mb-4 text-center text-sm font-medium text-zinc-600 dark:text-zinc-300">
            {t("finder.resultsFor")}{" "}
            <span className="text-shqiponja font-bold">
              {selectedContinent === "global"
                ? t("finder.global")
                : selectedCountryName}
            </span>
          </p>

          {resultPackages.length > 0 ? (
            <>
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {resultPackages.map((pkg) => (
                  <div
                    key={pkg.id}
                    className="group relative flex flex-col rounded-2xl border border-zinc-200 bg-white p-5 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 dark:border-zinc-700 dark:bg-zinc-800"
                  >
                    {pkg.highlight && (
                      <span className="absolute top-3 right-3 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                        ★ {t("packages.popular")}
                      </span>
                    )}
                    <div className="flex flex-col items-center text-center">
                      <FlagIcon countryCode={pkg.country_code} size="2.5rem" />
                      <h3 className="mt-3 text-base font-bold text-zinc-900 dark:text-zinc-100 line-clamp-2">
                        {pkg.name}
                      </h3>
                      <span className="mt-2 text-2xl font-extrabold tracking-tight text-shqiponja">
                        €{Number(pkg.price).toFixed(2)}
                      </span>
                      <span className="text-xs text-zinc-400 dark:text-zinc-500">
                        ~{Math.round(Number(pkg.price) * eurToAll)} Lek
                      </span>
                    </div>
                    <div className="mt-4 space-y-2 text-sm text-zinc-500">
                      <div className="flex items-center gap-2">
                        <svg
                          className="h-4 w-4 flex-shrink-0 text-shqiponja"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={2}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                        {pkg.data} {t("packages.data")}
                      </div>
                      <div className="flex items-center gap-2">
                        <svg
                          className="h-4 w-4 flex-shrink-0 text-shqiponja"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={2}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                        {t("packages.validity")}: {pkg.duration}
                      </div>
                    </div>
                    <Link
                      href={`/bli/${pkg.id}`}
                      className="mt-auto pt-5 block rounded-xl bg-shqiponja py-3 text-center text-sm font-semibold text-white shadow-md shadow-shqiponja/25 hover:bg-shqiponja-dark transition"
                    >
                      {t("packages.buy")}
                    </Link>
                  </div>
                ))}
              </div>

              {/* Exchange rate note */}
              <p className="mt-6 text-center text-xs text-zinc-400 dark:text-zinc-500">
                {t("packages.rateNote")} 1 EUR = {eurToAll.toFixed(2)} ALL
              </p>
            </>
          ) : (
            <div className="flex flex-col items-center gap-3 py-10 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-zinc-100 text-zinc-400 dark:bg-zinc-800">
                <svg
                  className="h-7 w-7"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
                  />
                </svg>
              </div>
              <p className="text-sm text-zinc-400">{t("finder.noPackages")}</p>
            </div>
          )}

          {/* Reset button */}
          <div className="mt-6 text-center">
            <button
              onClick={reset}
              className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-zinc-50 px-5 py-2.5 text-sm font-semibold text-zinc-600 transition hover:bg-shqiponja/5 hover:border-shqiponja/30 hover:text-shqiponja dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-shqiponja/10"
            >
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182"
                />
              </svg>
              {t("finder.step1")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
