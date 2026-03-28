"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import Link from "next/link";
import { getPackages, getDestinations, type EsimPackage, type Destination } from "@/lib/api";
import { useI18n } from "@/lib/i18n-context";

// Multi-country / regional country codes from Airalo
const REGIONAL_CODES = new Set(["EU", "AS", "ME", "OC", "CB", "AF"]);
const GLOBAL_CODES = new Set(["GL"]);

type Tab = "popular" | "local" | "regional" | "global";

function classifyDestination(d: Destination): "local" | "regional" | "global" {
  if (GLOBAL_CODES.has(d.destination_id)) return "global";
  if (REGIONAL_CODES.has(d.destination_id)) return "regional";
  return "local";
}

export default function PackageGrid() {
  const { t } = useI18n();
  const [tab, setTab] = useState<Tab>("popular");
  const [search, setSearch] = useState("");
  const [packages, setPackages] = useState<EsimPackage[]>([]);
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [loading, setLoading] = useState(false);
  const [destLoading, setDestLoading] = useState(true);
  const [error, setError] = useState(false);
  const fetchedRef = useRef(false);

  const hasSearch = search.trim() !== "";

  // Fetch destinations on mount
  useEffect(() => {
    getDestinations()
      .then((data) => setDestinations(data))
      .finally(() => setDestLoading(false));
  }, []);

  // Fetch all visible packages once — only when user searches
  useEffect(() => {
    if (!hasSearch || fetchedRef.current) return;
    fetchedRef.current = true;
    setLoading(true);
    setError(false);
    getPackages()
      .then((data) => setPackages(data))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [hasSearch]);

  // Categorize destinations
  const { popularDests, localDests, regionalDests, globalDests } = useMemo(() => {
    const popular: Destination[] = [];
    const local: Destination[] = [];
    const regional: Destination[] = [];
    const global: Destination[] = [];

    for (const d of destinations) {
      if (d.popular) popular.push(d);
      const type = classifyDestination(d);
      if (type === "global") global.push(d);
      else if (type === "regional") regional.push(d);
      else local.push(d);
    }

    return {
      popularDests: popular,
      localDests: local.sort((a, b) => a.min_price - b.min_price),
      regionalDests: regional.sort((a, b) => a.min_price - b.min_price),
      globalDests: global.sort((a, b) => a.min_price - b.min_price),
    };
  }, [destinations]);

  const activeDests =
    tab === "popular" ? popularDests :
    tab === "local" ? localDests :
    tab === "regional" ? regionalDests :
    globalDests;

  const tabDesc =
    tab === "popular" ? t("packages.popularDesc") :
    tab === "local" ? t("packages.localDesc") :
    tab === "regional" ? t("packages.regionalDesc") :
    t("packages.globalDesc");

  // Search results
  const filtered = useMemo(() => {
    if (!hasSearch) return [];
    const q = search.toLowerCase();
    return packages
      .filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.region.toLowerCase().includes(q) ||
          (p.country_code || "").toLowerCase().includes(q) ||
          (p.description || "").toLowerCase().includes(q)
      )
      .sort((a, b) => a.price - b.price);
  }, [packages, search, hasSearch]);

  function handleDestinationClick(dest: Destination) {
    setSearch(dest.name);
  }

  const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    {
      key: "popular",
      label: t("packages.popular"),
      icon: <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15.362 5.214A8.252 8.252 0 0112 21 8.25 8.25 0 016.038 7.048 8.287 8.287 0 009 9.6a8.983 8.983 0 013.361-6.867 8.21 8.21 0 003 2.48z" /><path strokeLinecap="round" strokeLinejoin="round" d="M12 18a3.75 3.75 0 00.495-7.467 5.99 5.99 0 00-1.925 3.546 5.974 5.974 0 01-2.133-1A3.75 3.75 0 0012 18z" /></svg>,
    },
    {
      key: "local",
      label: t("packages.local"),
      icon: <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" /></svg>,
    },
    {
      key: "regional",
      label: t("packages.regional"),
      icon: <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498l4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 00-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0z" /></svg>,
    },
    {
      key: "global",
      label: t("packages.global"),
      icon: <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" /></svg>,
    },
  ];

  return (
    <>
      {/* Search bar */}
      <div className="mt-8">
        <div className="relative mx-auto max-w-xl">
          <svg
            className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-zinc-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
          </svg>
          <input
            type="text"
            placeholder={t("packages.searchPlaceholder")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-2xl border border-zinc-200 bg-white py-3.5 pl-12 pr-4 text-base outline-none transition focus:border-shqiponja focus:ring-2 focus:ring-shqiponja/20 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder-zinc-500"
          />
          {hasSearch && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-zinc-400 hover:text-zinc-600 transition"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* ═══ Tabs + Destination cards — shown when not searching ═══ */}
      {!hasSearch && (
        <>
          {/* Tab bar */}
          <div className="mt-8 flex justify-center">
            <div className="inline-flex rounded-full border border-zinc-200 bg-white p-1 dark:border-zinc-700 dark:bg-zinc-800">
              {tabs.map((tb) => (
                <button
                  key={tb.key}
                  onClick={() => setTab(tb.key)}
                  className={`flex items-center gap-1.5 rounded-full px-5 py-2 text-sm font-semibold transition ${
                    tab === tb.key
                      ? "bg-shqiponja text-white shadow-sm"
                      : "text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200"
                  }`}
                >
                  {tb.icon}
                  {tb.label}
                </button>
              ))}
            </div>
          </div>

          {/* Section heading */}
          <div className="mt-8">
            <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
              {t("packages.emptyTitle")}
            </h3>
            <p className="mt-1 text-sm text-zinc-500">{tabDesc}</p>
          </div>

          {destLoading ? (
            <div className="mt-8 flex justify-center py-10">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-200 border-t-shqiponja" />
            </div>
          ) : activeDests.length > 0 ? (
            <>
              {/* Destination card grid */}
              <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {activeDests.map((dest) => (
                  <button
                    key={dest.destination_id}
                    onClick={() => handleDestinationClick(dest)}
                    className="flex items-center justify-between rounded-xl border border-zinc-200 bg-white px-4 py-3.5 text-left transition hover:border-shqiponja/30 hover:shadow-md dark:border-zinc-700 dark:bg-zinc-800"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="text-2xl flex-shrink-0">{dest.flag}</span>
                      <span className="font-semibold text-zinc-900 truncate dark:text-zinc-100">
                        {dest.name}
                      </span>
                    </div>
                    <span className="text-sm font-bold text-shqiponja whitespace-nowrap ml-3">
                      {dest.min_price.toFixed(2)} €
                    </span>
                  </button>
                ))}
              </div>

              {/* View all button */}
              {tab === "popular" && localDests.length > 0 && (
                <div className="mt-6 flex justify-center">
                  <button
                    onClick={() => setTab("local")}
                    className="rounded-full border border-zinc-200 bg-white px-8 py-2.5 text-sm font-semibold text-zinc-700 transition hover:border-shqiponja hover:text-shqiponja dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:border-shqiponja dark:hover:text-shqiponja"
                  >
                    {t("packages.viewAll")}
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="mt-8 flex flex-col items-center gap-4 py-10 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-zinc-100 text-zinc-400 dark:bg-zinc-800">
                <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
                </svg>
              </div>
              <p className="text-sm text-zinc-400">{t("packages.emptySubtitle")}</p>
            </div>
          )}
        </>
      )}

      {/* ═══ Search results — individual package cards ═══ */}
      {hasSearch && loading && (
        <div className="mt-12 flex justify-center py-10">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-200 border-t-shqiponja" />
        </div>
      )}

      {hasSearch && error && (
        <p className="mt-8 text-center text-sm text-red-400">
          {t("packages.fetchError")}
        </p>
      )}

      {hasSearch && !loading && !error && (
        <>
          {filtered.length > 0 && (
            <p className="mt-6 text-sm text-zinc-500">
              {filtered.length} {filtered.length === 1 ? "paketë" : "paketa"}
            </p>
          )}
          <div className="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((pkg) => (
              <div
                key={pkg.id}
                className="card-shine group relative flex flex-col rounded-2xl border border-zinc-200 bg-white p-5 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 dark:border-zinc-700 dark:bg-zinc-800"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-3xl">{pkg.flag}</span>
                    <h3 className="mt-2 text-base font-bold">{pkg.name}</h3>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-extrabold tracking-tight text-shqiponja">
                      €{pkg.price.toFixed(2)}
                    </span>
                  </div>
                </div>

                <div className="mt-4 space-y-2 text-sm text-zinc-500">
                  <div className="flex items-center gap-2">
                    <svg className="h-4 w-4 text-shqiponja" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    {pkg.data} {t("packages.data")}
                  </div>
                  <div className="flex items-center gap-2">
                    <svg className="h-4 w-4 text-shqiponja" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    {t("packages.validity")}: {pkg.duration}
                  </div>
                </div>

                <Link
                  href={`/bli/${pkg.id}`}
                  className="mt-5 block rounded-xl bg-shqiponja py-3 text-center text-sm font-semibold text-white shadow-md shadow-shqiponja/25 hover:bg-shqiponja-dark transition"
                >
                  {t("packages.buy")}
                </Link>
              </div>
            ))}
          </div>

          {filtered.length === 0 && packages.length > 0 && (
            <p className="mt-8 text-center text-sm text-zinc-400">
              {t("packages.noResults")}
            </p>
          )}
        </>
      )}
    </>
  );
}
