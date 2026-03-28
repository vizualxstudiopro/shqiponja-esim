"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import Link from "next/link";
import { getPackages, getFeaturedPackages, type EsimPackage } from "@/lib/api";
import { useI18n } from "@/lib/i18n-context";

const SUGGESTIONS = ["Europa", "USA", "Turqi", "Itali", "Gjermani", "Greqi", "Global"];

export default function PackageGrid() {
  const { t } = useI18n();
  const [search, setSearch] = useState("");
  const [region, setRegion] = useState("all");
  const [sort, setSort] = useState<"default" | "price-asc" | "price-desc">("default");
  const [packages, setPackages] = useState<EsimPackage[]>([]);
  const [featured, setFeatured] = useState<EsimPackage[]>([]);
  const [loading, setLoading] = useState(false);
  const [featuredLoading, setFeaturedLoading] = useState(true);
  const [error, setError] = useState(false);
  const fetchedRef = useRef(false);

  const hasFilter = search.trim() !== "" || region !== "all";

  // Fetch featured packages on mount
  useEffect(() => {
    getFeaturedPackages()
      .then((data) => setFeatured(data))
      .finally(() => setFeaturedLoading(false));
  }, []);

  // Fetch all packages once — only when user first starts filtering
  useEffect(() => {
    if (!hasFilter || fetchedRef.current) return;
    fetchedRef.current = true;
    setLoading(true);
    setError(false);
    getPackages()
      .then((data) => setPackages(data))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [hasFilter]);

  const regions = useMemo(
    () => ["all", ...Array.from(new Set(packages.map((p) => p.region)))],
    [packages]
  );

  const filtered = useMemo(() => {
    if (!hasFilter) return [];
    let result = packages;

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.region.toLowerCase().includes(q) ||
          (p.description || "").toLowerCase().includes(q)
      );
    }

    if (region !== "all") {
      result = result.filter((p) => p.region === region);
    }

    if (sort === "price-asc") result = [...result].sort((a, b) => a.price - b.price);
    if (sort === "price-desc") result = [...result].sort((a, b) => b.price - a.price);

    return result;
  }, [packages, search, region, sort, hasFilter]);

  return (
    <>
      {/* Filter bar */}
      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <svg
            className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400"
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
            className="w-full rounded-xl border border-zinc-200 bg-white py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-shqiponja focus:ring-2 focus:ring-shqiponja/20 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder-zinc-500"
          />
        </div>
        <select
          value={region}
          onChange={(e) => setRegion(e.target.value)}
          className="rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-shqiponja dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
        >
          {regions.map((r) => (
            <option key={r} value={r}>
              {r === "all" ? t("packages.allRegions") : r}
            </option>
          ))}
        </select>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as typeof sort)}
          className="rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-shqiponja dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
        >
          <option value="default">{t("packages.sortDefault")}</option>
          <option value="price-asc">{t("packages.sortPriceAsc")}</option>
          <option value="price-desc">{t("packages.sortPriceDesc")}</option>
        </select>
      </div>

      {/* Featured packages — shown before search */}
      {!hasFilter && (
        <>
          {featuredLoading ? (
            <div className="mt-12 flex justify-center py-10">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-200 border-t-shqiponja" />
            </div>
          ) : featured.length > 0 ? (
            <>
              <p className="mt-8 text-center text-sm font-semibold uppercase tracking-widest text-shqiponja">
                {t("packages.popular")}
              </p>
              <div className="mt-4 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {featured.map((pkg) => (
                  <div
                    key={pkg.id}
                    className="card-shine group relative flex flex-col rounded-2xl border border-shqiponja bg-shqiponja/[0.03] p-6 shadow-lg shadow-shqiponja/10 transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
                  >
                    <span className="absolute -top-3 right-6 rounded-full bg-shqiponja px-3 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
                      {t("packages.popular")}
                    </span>
                    <span className="text-4xl" role="img" aria-label={pkg.region}>{pkg.flag}</span>
                    <h3 className="mt-4 text-lg font-bold">{pkg.name}</h3>
                    <div className="mt-4 flex items-end gap-1">
                      <span className="text-3xl font-extrabold tracking-tight">€{pkg.price.toFixed(2)}</span>
                    </div>
                    <div className="mt-4 space-y-2 text-sm text-zinc-500">
                      <div className="flex items-center gap-2">
                        <svg className="h-4 w-4 text-shqiponja" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                        {pkg.data} {t("packages.data")}
                      </div>
                      <div className="flex items-center gap-2">
                        <svg className="h-4 w-4 text-shqiponja" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                        {t("packages.validity")}: {pkg.duration}
                      </div>
                    </div>
                    <Link
                      href={`/bli/${pkg.id}`}
                      className="mt-6 block rounded-xl bg-shqiponja py-3 text-center text-sm font-semibold text-white shadow-md shadow-shqiponja/25 hover:bg-shqiponja-dark transition"
                    >
                      {t("packages.buy")}
                    </Link>
                  </div>
                ))}
              </div>
              <div className="mt-8 flex flex-col items-center gap-3">
                <p className="text-sm text-zinc-400">{t("packages.emptySubtitle")}</p>
                <div className="flex flex-wrap justify-center gap-2">
                  {SUGGESTIONS.map((s) => (
                    <button key={s} onClick={() => setSearch(s)} className="rounded-full border border-zinc-200 bg-white px-4 py-1.5 text-sm font-medium text-zinc-600 transition hover:border-shqiponja hover:text-shqiponja dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:border-shqiponja dark:hover:text-shqiponja">{s}</button>
                  ))}
                </div>
              </div>
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
              <div className="flex flex-wrap justify-center gap-2">
                {SUGGESTIONS.map((s) => (
                  <button key={s} onClick={() => setSearch(s)} className="rounded-full border border-zinc-200 bg-white px-4 py-1.5 text-sm font-medium text-zinc-600 transition hover:border-shqiponja hover:text-shqiponja dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:border-shqiponja dark:hover:text-shqiponja">{s}</button>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Loading state */}
      {hasFilter && loading && (
        <div className="mt-12 flex justify-center py-10">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-200 border-t-shqiponja" />
        </div>
      )}

      {/* Error state */}
      {hasFilter && error && (
        <p className="mt-8 text-center text-sm text-red-400">
          {t("packages.fetchError")}
        </p>
      )}

      {/* Results grid */}
      {hasFilter && !loading && !error && (
        <>
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {filtered.map((pkg) => (
              <div
                key={pkg.id}
                className={`card-shine group relative flex flex-col rounded-2xl border p-6 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 ${
                  pkg.highlight
                    ? "border-shqiponja bg-shqiponja/[0.03] shadow-lg shadow-shqiponja/10"
                    : "border-zinc-200 bg-white hover:border-zinc-300 dark:border-zinc-700 dark:bg-zinc-800 dark:hover:border-zinc-600"
                }`}
              >
                {pkg.highlight && (
                  <span className="absolute -top-3 right-6 rounded-full bg-shqiponja px-3 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
                    {t("packages.popular")}
                  </span>
                )}

                <span className="text-4xl" role="img" aria-label={pkg.region}>{pkg.flag}</span>

                <h3 className="mt-4 text-lg font-bold">{pkg.name}</h3>

                <div className="mt-4 flex items-end gap-1">
                  <span className="text-3xl font-extrabold tracking-tight">
                    €{pkg.price.toFixed(2)}
                  </span>
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
                  className={`mt-6 block rounded-xl py-3 text-center text-sm font-semibold transition ${
                    pkg.highlight
                      ? "bg-shqiponja text-white shadow-md shadow-shqiponja/25 hover:bg-shqiponja-dark"
                      : "bg-zinc-100 text-zinc-800 hover:bg-zinc-200 dark:bg-zinc-700 dark:text-zinc-100 dark:hover:bg-zinc-600"
                  }`}
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
