"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import Link from "next/link";
import { getPackages, getDestinations, type EsimPackage, type Destination } from "@/lib/api";
import { useI18n } from "@/lib/i18n-context";

export default function PackageGrid() {
  const { t } = useI18n();
  const [search, setSearch] = useState("");
  const [packages, setPackages] = useState<EsimPackage[]>([]);
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [loading, setLoading] = useState(false);
  const [destLoading, setDestLoading] = useState(true);
  const [error, setError] = useState(false);
  const fetchedRef = useRef(false);

  const hasSearch = search.trim() !== "";

  // Fetch destination cards on mount
  useEffect(() => {
    getDestinations()
      .then((data) => setDestinations(data))
      .finally(() => setDestLoading(false));
  }, []);

  // Fetch all visible packages once — only when user starts searching
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

  const popularDests = destinations.filter(d => d.popular);
  const otherDests = destinations.filter(d => !d.popular);

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

      {/* ═══ Destination cards (VIA-style) — shown when not searching ═══ */}
      {!hasSearch && (
        <>
          {destLoading ? (
            <div className="mt-12 flex justify-center py-10">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-200 border-t-shqiponja" />
            </div>
          ) : destinations.length > 0 ? (
            <>
              {/* Popular destinations */}
              {popularDests.length > 0 && (
                <div className="mt-10">
                  <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                    {t("packages.popular")}
                  </h3>
                  <p className="mt-1 text-sm text-zinc-500">
                    {t("packages.emptySubtitle")}
                  </p>
                  <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {popularDests.map((dest) => (
                      <button
                        key={dest.destination_id}
                        onClick={() => handleDestinationClick(dest)}
                        className="flex items-center justify-between rounded-xl border border-shqiponja/20 bg-shqiponja/[0.03] px-4 py-3.5 text-left transition hover:border-shqiponja/40 hover:bg-shqiponja/[0.06] hover:shadow-md group"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <span className="text-2xl flex-shrink-0">{dest.flag}</span>
                          <span className="font-semibold text-zinc-900 truncate dark:text-zinc-100">{dest.name}</span>
                        </div>
                        <span className="text-sm font-bold text-shqiponja whitespace-nowrap ml-3">
                          {dest.min_price.toFixed(2)} €
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Other destinations */}
              {otherDests.length > 0 && (
                <div className="mt-8">
                  {popularDests.length === 0 && (
                    <>
                      <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                        {t("packages.emptyTitle")}
                      </h3>
                      <p className="mt-1 text-sm text-zinc-500">
                        {t("packages.emptySubtitle")}
                      </p>
                    </>
                  )}
                  <div className={`${popularDests.length > 0 ? 'mt-4' : 'mt-4'} grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3`}>
                    {otherDests.map((dest) => (
                      <button
                        key={dest.destination_id}
                        onClick={() => handleDestinationClick(dest)}
                        className="flex items-center justify-between rounded-xl border border-zinc-200 bg-white px-4 py-3.5 text-left transition hover:border-shqiponja/30 hover:shadow-md group dark:border-zinc-700 dark:bg-zinc-800"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <span className="text-2xl flex-shrink-0">{dest.flag}</span>
                          <span className="font-semibold text-zinc-900 truncate dark:text-zinc-100">{dest.name}</span>
                        </div>
                        <span className="text-sm font-bold text-zinc-600 whitespace-nowrap ml-3 dark:text-zinc-300">
                          {dest.min_price.toFixed(2)} €
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="mt-12 flex flex-col items-center gap-5 py-10 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-shqiponja/10 text-shqiponja">
                <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
                </svg>
              </div>
              <div>
                <p className="text-base font-semibold text-zinc-700 dark:text-zinc-200">{t("packages.emptyTitle")}</p>
                <p className="mt-1 text-sm text-zinc-400">{t("packages.emptySubtitle")}</p>
              </div>
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
              {filtered.length} {filtered.length === 1 ? "paketë" : "paketa"} u gjetën
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
