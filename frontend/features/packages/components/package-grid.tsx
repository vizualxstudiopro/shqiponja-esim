"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import Link from "next/link";
import { getPackages, searchPackages, type EsimPackage } from "@/lib/api";
import { useI18n } from "@/lib/i18n-context";
import { useCurrency } from "@/lib/currency-context";

type Tab = "popular" | "balkans" | "europe" | "asia" | "middle_east" | "africa" | "americas" | "oceania" | "global";

function FlagIcon({ countryCode, emoji, size = "2.5rem" }: { countryCode?: string; emoji?: string; size?: string }) {
  const cc = (countryCode || "").toLowerCase();
  const upper = cc.toUpperCase();

  // Known flag-icons codes (single countries + EU)
  if (cc && cc.length === 2 && !["GL", "AS", "ME", "OC", "CB", "AF"].includes(upper)) {
    return <span className={`fi fi-${cc} fis`} style={{ fontSize: size, borderRadius: "6px", display: "inline-block" }} />;
  }

  // Regional/global icons (use a globe/region icon for these)
  const regionEmoji: Record<string, string> = {
    GL: "🌍", AS: "🌏", ME: "🌎", OC: "🌊", CB: "🏝️", AF: "🌍",
  };

  return <span style={{ fontSize: size }} className="leading-none">{regionEmoji[upper] || emoji || "🌍"}</span>;
}

const TAB_CONFIG: { key: Tab; icon: React.ReactNode; filterKey?: string }[] = [
  {
    key: "popular",
    icon: <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15.362 5.214A8.252 8.252 0 0112 21 8.25 8.25 0 016.038 7.048 8.287 8.287 0 009 9.6a8.983 8.983 0 013.361-6.867 8.21 8.21 0 003 2.48z" /><path strokeLinecap="round" strokeLinejoin="round" d="M12 18a3.75 3.75 0 00.495-7.467 5.99 5.99 0 00-1.925 3.546 5.974 5.974 0 01-2.133-1A3.75 3.75 0 0012 18z" /></svg>,
  },
  {
    key: "balkans",
    filterKey: "balkans",
    icon: <span className="fi fi-al fis" style={{ fontSize: "0.9rem", borderRadius: "2px" }} />,
  },
  {
    key: "europe",
    filterKey: "europe",
    icon: <span className="fi fi-eu fis" style={{ fontSize: "0.9rem", borderRadius: "2px" }} />,
  },
  {
    key: "asia",
    filterKey: "asia",
    icon: <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" /></svg>,
  },
  {
    key: "middle_east",
    filterKey: "middle_east",
    icon: <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" /></svg>,
  },
  {
    key: "africa",
    filterKey: "africa",
    icon: <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" /></svg>,
  },
  {
    key: "americas",
    filterKey: "americas",
    icon: <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" /></svg>,
  },
  {
    key: "oceania",
    filterKey: "oceania",
    icon: <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" /></svg>,
  },
  {
    key: "global",
    filterKey: "global",
    icon: <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" /></svg>,
  },
];

export default function PackageGrid() {
  const { t } = useI18n();
  const { formatPrice, currency } = useCurrency();
  const [tab, setTab] = useState<Tab>("popular");
  const [search, setSearch] = useState("");
  const [packages, setPackages] = useState<EsimPackage[]>([]);
  const [searchResults, setSearchResults] = useState<EsimPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchLoading, setSearchLoading] = useState(false);
  const [error, setError] = useState(false);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    getPackages()
      .then((data) => setPackages(data))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  // Group packages by category
  const grouped = useMemo(() => {
    const groups: Record<string, EsimPackage[]> = {
      popular: [],
      balkans: [],
      europe: [],
      asia: [],
      middle_east: [],
      africa: [],
      americas: [],
      oceania: [],
      global: [],
    };

    for (const pkg of packages) {
      if (pkg.highlight) groups.popular.push(pkg);
      const cat = pkg.category || "europe";
      if (groups[cat]) groups[cat].push(pkg);
    }

    // Sort each group by price
    for (const key of Object.keys(groups)) {
      groups[key].sort((a, b) => a.price - b.price);
    }

    return groups;
  }, [packages]);

  const hasSearch = search.trim().length > 0;

  // Server-side search with debounce
  function handleSearchChange(value: string) {
    setSearch(value);
    clearTimeout(searchTimer.current);
    if (value.trim().length >= 2) {
      setSearchLoading(true);
      searchTimer.current = setTimeout(async () => {
        const results = await searchPackages(value);
        setSearchResults(results);
        setSearchLoading(false);
      }, 400);
    } else {
      setSearchResults([]);
      setSearchLoading(false);
    }
  }

  const displayPackages = hasSearch ? searchResults : (grouped[tab] || []);

  const tabDescriptions: Record<Tab, string> = {
    popular: t("packages.popularDesc"),
    balkans: t("packages.balkansDesc"),
    europe: t("packages.europeDesc"),
    asia: t("packages.asiaDesc"),
    middle_east: t("packages.middle_eastDesc"),
    africa: t("packages.africaDesc"),
    americas: t("packages.americasDesc"),
    oceania: t("packages.oceaniaDesc"),
    global: t("packages.globalDesc"),
  };
  const tabDesc = tabDescriptions[tab];

  const tabLabels: Record<Tab, string> = {
    popular: t("packages.popular"),
    balkans: t("packages.balkans"),
    europe: t("packages.europe"),
    asia: t("packages.asia"),
    middle_east: t("packages.middle_east"),
    africa: t("packages.africa"),
    americas: t("packages.americas"),
    oceania: t("packages.oceania"),
    global: t("packages.global"),
  };

  const tabs = TAB_CONFIG.map((tc) => ({
    ...tc,
    label: tabLabels[tc.key],
    count: (grouped[tc.key] || []).length,
  }));

  return (
    <>
      {/* Search bar */}
      <div className="mt-8">
        <div className="relative mx-auto max-w-xl">
          <svg className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
          </svg>
          <input
            type="text"
            placeholder={t("packages.searchPlaceholder")}
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="w-full rounded-2xl border border-zinc-200 bg-white py-3.5 pl-12 pr-4 text-base outline-none transition focus:border-shqiponja focus:ring-2 focus:ring-shqiponja/20 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder-zinc-500"
          />
          {hasSearch && (
            <button onClick={() => { setSearch(""); setSearchResults([]); }} className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-zinc-400 hover:text-zinc-600 transition">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
        {hasSearch && (
          <p className="mt-2 text-center text-xs text-zinc-400">
            {t("packages.searchAll")}
          </p>
        )}
      </div>

      {/* Tab bar */}
      {!hasSearch && (
        <div className="mt-8 flex justify-center">
          <div className="inline-flex flex-wrap justify-center gap-1 rounded-2xl border border-zinc-200 bg-white p-1 dark:border-zinc-700 dark:bg-zinc-800">
            {tabs.map((tb) => (
              <button
                key={tb.key}
                onClick={() => setTab(tb.key)}
                className={`flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-semibold transition ${
                  tab === tb.key
                    ? "bg-shqiponja text-white shadow-sm"
                    : "text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200"
                }`}
              >
                {tb.icon}
                <span>{tb.label}</span>
                {tb.count > 0 && (
                  <span className={`ml-0.5 rounded-full px-1.5 py-0.5 text-xs ${
                    tab === tb.key ? "bg-white/20 text-white" : "bg-zinc-100 text-zinc-500 dark:bg-zinc-700 dark:text-zinc-400"
                  }`}>
                    {tb.count}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Section heading */}
      {!hasSearch && (
        <div className="mt-6 text-center">
          <p className="text-sm text-zinc-500">{tabDesc}</p>
        </div>
      )}

      {/* Loading */}
      {(loading || searchLoading) && (
        <div className="mt-8 flex justify-center py-10">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-200 border-t-shqiponja" />
        </div>
      )}

      {/* Error */}
      {error && (
        <p className="mt-8 text-center text-sm text-red-400">{t("packages.fetchError")}</p>
      )}

      {/* Package grid */}
      {!loading && !searchLoading && !error && displayPackages.length > 0 && (
        <>
          {hasSearch && (
            <p className="mt-4 text-center text-sm text-zinc-500">
              {displayPackages.length} {displayPackages.length === 1 ? "paketë" : "paketa"}
            </p>
          )}
          <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {displayPackages.map((pkg) => (
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
                  <FlagIcon countryCode={pkg.country_code} emoji={pkg.flag} />
                  <h3 className="mt-3 text-base font-bold text-zinc-900 dark:text-zinc-100 line-clamp-2">
                    {pkg.name}
                  </h3>
                  <span className="mt-2 text-2xl font-extrabold tracking-tight text-shqiponja">
                    {formatPrice(Number(pkg.price))}
                  </span>
                </div>

                <div className="mt-4 space-y-2 text-sm text-zinc-500">
                  <div className="flex items-center gap-2">
                    <svg className="h-4 w-4 flex-shrink-0 text-shqiponja" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    {pkg.data} {t("packages.data")}
                  </div>
                  <div className="flex items-center gap-2">
                    <svg className="h-4 w-4 flex-shrink-0 text-shqiponja" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    {t("packages.validity")}: {pkg.duration}
                  </div>
                </div>

                <Link
                  href={`/bli/${pkg.id}`}
                  aria-label={`Bli tani paketën ${pkg.name}`}
                  className="mt-auto pt-5 block rounded-xl bg-shqiponja py-3 text-center text-sm font-semibold text-white shadow-md shadow-shqiponja/25 hover:bg-shqiponja-dark transition"
                >
                  {t("packages.buy")}
                </Link>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Currency info */}
      {!loading && !error && displayPackages.length > 0 && currency !== "EUR" && (
        <p className="mt-6 text-center text-xs text-zinc-400 dark:text-zinc-500">
          {t("packages.rateNote")} ({currency})
        </p>
      )}

      {/* Empty state */}
      {!loading && !searchLoading && !error && displayPackages.length === 0 && (
        <div className="mt-8 flex flex-col items-center gap-4 py-10 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-zinc-100 text-zinc-400 dark:bg-zinc-800">
            <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
            </svg>
          </div>
          <p className="text-sm text-zinc-400">
            {hasSearch ? t("packages.noResults") : t("packages.emptySubtitle")}
          </p>
        </div>
      )}
    </>
  );
}
