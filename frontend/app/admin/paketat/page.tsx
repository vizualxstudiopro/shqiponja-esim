"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useAuth } from "@/lib/auth-context";
import { useI18n } from "@/lib/i18n-context";
import {
  adminGetPackages,
  adminUpdatePackage,
  adminDeletePackage,
  adminTogglePackageVisible,
  adminTogglePackageHighlight,
  adminSetCategory,
  type EsimPackage,
} from "@/lib/api";
import { useToast } from "@/lib/toast-context";

const PAGE_SIZE = 50;

function AdminFlagIcon({ countryCode, emoji }: { countryCode?: string; emoji?: string }) {
  const cc = (countryCode || "").toLowerCase();
  const upper = cc.toUpperCase();
  const REGIONAL = new Set(["EU", "AS", "ME", "OC", "CB", "AF"]);
  const GLOBAL = new Set(["GL"]);
  if (upper === "EU") {
    return <span className="fi fi-eu fis" style={{ fontSize: "1.25rem", borderRadius: "3px", display: "inline-block", verticalAlign: "middle" }} />;
  }
  if (cc && cc.length === 2 && !REGIONAL.has(upper) && !GLOBAL.has(upper)) {
    return <span className={`fi fi-${cc} fis`} style={{ fontSize: "1.25rem", borderRadius: "3px", display: "inline-block", verticalAlign: "middle" }} />;
  }
  return <span className="text-lg leading-none">{emoji || "🌍"}</span>;
}

type QuickFilter = "all" | "visible" | "hidden" | "highlighted" | "local" | "regional" | "global";

export default function AdminPackagesPage() {
  const { token } = useAuth();
  const { t } = useI18n();
  const { toast } = useToast();
  const [packages, setPackages] = useState<EsimPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Partial<EsimPackage> | null>(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [quickFilter, setQuickFilter] = useState<QuickFilter>("all");
  const searchTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const stats = {
    total,
    visible: packages.filter((p) => p.visible).length,
    highlighted: packages.filter((p) => p.highlight).length,
  };

  // Browse modal state
  const [browsing, setBrowsing] = useState(false);
  const [browseSearch, setBrowseSearch] = useState("");
  const [browseResults, setBrowseResults] = useState<EsimPackage[]>([]);
  const [browseLoading, setBrowseLoading] = useState(false);
  const [browsePage, setBrowsePage] = useState(1);
  const [browseTotalPages, setBrowseTotalPages] = useState(1);
  const [browseTotal, setBrowseTotal] = useState(0);
  const browseTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const fetchPackages = useCallback(async (p: number, q: string) => {
    if (!token) return;
    setLoading(true);
    try {
      const data = await adminGetPackages(token, p, PAGE_SIZE, q);
      setPackages(data.packages);
      setTotalPages(data.totalPages);
      setTotal(data.total);
      setPage(data.page);
    } catch {
      toast("Gabim gjatë ngarkimit", "error");
    } finally {
      setLoading(false);
    }
  }, [token, toast]);

  useEffect(() => {
    fetchPackages(1, "");
  }, [fetchPackages]);

  function handleSearch(value: string) {
    setSearch(value);
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      fetchPackages(1, value);
    }, 400);
  }

  function handleQuickFilter(f: QuickFilter) {
    setQuickFilter(f);
  }

  const filteredPackages = packages.filter((p) => {
    if (quickFilter === "visible") return p.visible;
    if (quickFilter === "hidden") return !p.visible;
    if (quickFilter === "highlighted") return p.highlight;
    if (quickFilter === "local") return p.category === "local" || !p.category;
    if (quickFilter === "regional") return p.category === "regional";
    if (quickFilter === "global") return p.category === "global";
    return true;
  });

  // Browse modal functions
  const fetchBrowseResults = useCallback(async (p: number, q: string) => {
    if (!token) return;
    setBrowseLoading(true);
    try {
      const data = await adminGetPackages(token, p, PAGE_SIZE, q);
      setBrowseResults(data.packages);
      setBrowseTotalPages(data.totalPages);
      setBrowseTotal(data.total);
      setBrowsePage(data.page);
    } catch {
      toast("Gabim gjatë ngarkimit", "error");
    } finally {
      setBrowseLoading(false);
    }
  }, [token, toast]);

  function openBrowse() {
    setBrowsing(true);
    setBrowseSearch("");
    fetchBrowseResults(1, "");
  }

  function handleBrowseSearch(value: string) {
    setBrowseSearch(value);
    clearTimeout(browseTimer.current);
    browseTimer.current = setTimeout(() => {
      fetchBrowseResults(1, value);
    }, 400);
  }

  function openEdit(pkg: EsimPackage) {
    setEditing({ ...pkg });
  }

  async function handleSetCategory(pkg: EsimPackage, category: string, source: "main" | "browse") {
    if (!token) return;
    try {
      const updated = await adminSetCategory(token, pkg.id, category);
      if (source === "browse") {
        setBrowseResults((prev) => prev.map((x) => (x.id === updated.id ? updated : x)));
      }
      setPackages((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
      toast(`Kategoria u ndryshua: ${category === "local" ? "Lokale" : category === "regional" ? "Rajonale" : "Globale"}`, "success");
    } catch (err) {
      toast(err instanceof Error ? err.message : "Gabim", "error");
    }
  }

  async function handleSave() {
    if (!token || !editing || !editing.id) return;
    if (!editing.name?.trim() || !editing.region?.trim() || !editing.data?.trim() || !editing.duration?.trim()) {
      toast("Plotëso fushat e detyrueshme", "error");
      return;
    }
    if (!Number.isFinite(editing.price) || (editing.price ?? 0) < 0) {
      toast("Çmimi duhet të jetë numër pozitiv", "error");
      return;
    }
    try {
      await adminUpdatePackage(token, editing.id, editing as Omit<EsimPackage, "id">);
      setEditing(null);
      toast("Paketa u përditësua", "success");
      fetchPackages(page, search);
    } catch (err) {
      toast(err instanceof Error ? err.message : "Error", "error");
    }
  }

  async function handleToggleVisible(pkg: EsimPackage, source: "main" | "browse" = "main") {
    if (!token) return;
    try {
      const updated = await adminTogglePackageVisible(token, pkg.id, !pkg.visible);
      if (source === "browse") {
        setBrowseResults((prev) => prev.map((x) => (x.id === updated.id ? updated : x)));
      }
      setPackages((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
      toast(updated.visible ? "Paketa u shtua në Web" : "Paketa u hoq nga Web", "success");
    } catch (err) {
      toast(err instanceof Error ? err.message : "Error", "error");
    }
  }

  async function handleToggleHighlight(pkg: EsimPackage, source: "main" | "browse" = "main") {
    if (!token) return;
    try {
      const updated = await adminTogglePackageHighlight(token, pkg.id, !pkg.highlight);
      if (source === "browse") {
        setBrowseResults((prev) => prev.map((x) => (x.id === updated.id ? updated : x)));
      }
      setPackages((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
      toast(updated.highlight ? "Paketa u bë e popullarizuar" : "Paketa nuk është më e popullarizuar", "success");
    } catch (err) {
      toast(err instanceof Error ? err.message : "Error", "error");
    }
  }

  async function handleDelete(id: number) {
    if (!token) return;
    if (!confirm(t("admin.confirmDeletePkg"))) return;
    try {
      await adminDeletePackage(token, id);
      toast("Paketa u fshi", "success");
      fetchPackages(page, search);
    } catch (err) {
      toast(err instanceof Error ? err.message : "Error", "error");
    }
  }

  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold">{t("admin.packages")}</h1>
          <p className="mt-1 text-sm text-zinc-500">{total} {t("admin.totalSuffix")}</p>
        </div>
        <button
          onClick={openBrowse}
          className="w-full sm:w-auto rounded-lg bg-shqiponja px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-shqiponja/25 hover:bg-shqiponja-dark transition"
        >
          {t("admin.addPackage")}
        </button>
      </div>

      {/* Stats cards */}
      <div className="mt-4 grid grid-cols-3 gap-3">
        <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-800">
          <p className="text-2xl font-extrabold text-zinc-900 dark:text-zinc-100">{stats.total}</p>
          <p className="text-xs text-zinc-500 mt-1">Gjithsej</p>
        </div>
        <div className="rounded-xl border border-green-200 bg-green-50 p-4 dark:border-green-900 dark:bg-green-900/20">
          <p className="text-2xl font-extrabold text-green-700 dark:text-green-400">{stats.visible}</p>
          <p className="text-xs text-green-600 dark:text-green-500 mt-1">Aktive në Web</p>
        </div>
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-900 dark:bg-amber-900/20">
          <p className="text-2xl font-extrabold text-amber-700 dark:text-amber-400">{stats.highlighted}</p>
          <p className="text-xs text-amber-600 dark:text-amber-500 mt-1">★ Populare</p>
        </div>
      </div>

      {/* Search + Quick filters */}
      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <input
          type="text"
          placeholder={t("admin.search")}
          value={search}
          onChange={(e) => handleSearch(e.target.value)}
          className="w-full sm:max-w-xs rounded-lg border border-zinc-200 px-4 py-2.5 text-sm outline-none focus:border-shqiponja dark:border-zinc-700 dark:bg-zinc-800"
        />
        <div className="flex gap-1.5 overflow-x-auto pb-1 -mb-1 no-scrollbar">
          {([
            { key: "all" as QuickFilter, label: "Të gjitha" },
            { key: "visible" as QuickFilter, label: "Aktive" },
            { key: "hidden" as QuickFilter, label: "Jo aktive" },
            { key: "highlighted" as QuickFilter, label: "★" },
            { key: "local" as QuickFilter, label: "Lok" },
            { key: "regional" as QuickFilter, label: "Raj" },
            { key: "global" as QuickFilter, label: "Glo" },
          ]).map((f) => (
            <button
              key={f.key}
              onClick={() => handleQuickFilter(f.key)}
              className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                quickFilter === f.key
                  ? "bg-shqiponja text-white"
                  : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-600"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Package list */}
      <div className="mt-4 rounded-xl border border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-900">
        {loading ? (
          <div className="space-y-3 p-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-12 animate-pulse rounded-lg bg-zinc-200 dark:bg-zinc-700" />
            ))}
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <table className="hidden md:table w-full text-sm">
              <thead className="border-b border-zinc-100 bg-zinc-50 text-left dark:border-zinc-700 dark:bg-zinc-800">
                <tr>
                  <th className="px-4 py-3 font-semibold">#</th>
                  <th className="px-4 py-3 font-semibold">{t("admin.name")}</th>
                  <th className="px-4 py-3 font-semibold">{t("admin.region")}</th>
                  <th className="px-4 py-3 font-semibold">Kat.</th>
                  <th className="px-4 py-3 font-semibold">{t("admin.data")}</th>
                  <th className="px-4 py-3 font-semibold">{t("admin.duration")}</th>
                  <th className="px-4 py-3 font-semibold">{t("admin.price")}</th>
                  <th className="px-4 py-3 font-semibold">Web</th>
                  <th className="px-4 py-3 font-semibold">{t("admin.actions")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-700">
                {filteredPackages.map((p) => (
                  <tr key={p.id} className="hover:bg-zinc-50 transition dark:hover:bg-zinc-800">
                    <td className="px-4 py-3 font-medium">{p.id}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <AdminFlagIcon countryCode={p.country_code} emoji={p.flag} />
                        <span>{p.name}</span>
                        {p.highlight && <span className="rounded-full bg-shqiponja/10 px-2 py-0.5 text-[10px] font-bold text-shqiponja">★</span>}
                      </div>
                    </td>
                    <td className="px-4 py-3">{p.region}</td>
                    <td className="px-4 py-3">
                      <select
                        value={p.category || "local"}
                        onChange={(e) => handleSetCategory(p, e.target.value, "main")}
                        className={`rounded-full px-2 py-0.5 text-[11px] font-bold border-0 outline-none cursor-pointer ${
                          p.category === "regional" ? "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400"
                          : p.category === "global" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                          : "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                        }`}
                      >
                        <option value="local">Lok</option>
                        <option value="regional">Raj</option>
                        <option value="global">Glo</option>
                      </select>
                    </td>
                    <td className="px-4 py-3">{p.data}</td>
                    <td className="px-4 py-3">{p.duration}</td>
                    <td className="px-4 py-3 font-semibold">{"\u20AC"}{p.price.toFixed(2)}</td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleToggleVisible(p, "main")}
                        className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                          p.visible
                            ? "bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400"
                            : "bg-zinc-100 text-zinc-500 hover:bg-shqiponja/10 hover:text-shqiponja dark:bg-zinc-700 dark:text-zinc-400"
                        }`}
                      >
                        {p.visible ? t("admin.visibleOnWeb") : t("admin.showOnWeb")}
                      </button>
                    </td>
                    <td className="px-4 py-3 flex gap-2">
                      <button onClick={() => openEdit(p)} className="rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-medium hover:bg-zinc-50 transition dark:border-zinc-600 dark:hover:bg-zinc-700">{t("admin.edit")}</button>
                      <button onClick={() => handleDelete(p.id)} className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 transition dark:border-red-800 dark:hover:bg-red-900/30">{t("admin.delete")}</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Mobile cards */}
            <div className="md:hidden divide-y divide-zinc-100 dark:divide-zinc-700">
              {filteredPackages.map((p) => (
                <div key={p.id} className="p-3 space-y-2">
                  {/* Row 1: Flag + Name + Price */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <AdminFlagIcon countryCode={p.country_code} emoji={p.flag} />
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{p.name}</p>
                        <p className="text-[11px] text-zinc-400">{p.data} · {p.duration} · {p.region}</p>
                      </div>
                    </div>
                    <span className="text-sm font-bold shrink-0">{"\u20AC"}{p.price.toFixed(2)}</span>
                  </div>
                  {/* Row 2: Badges + toggles + actions */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {p.highlight && <span className="rounded-full bg-shqiponja/10 px-2 py-0.5 text-[10px] font-bold text-shqiponja">★</span>}
                    <select
                      value={p.category || "local"}
                      onChange={(e) => handleSetCategory(p, e.target.value, "main")}
                      className={`rounded-full px-2 py-0.5 text-[11px] font-bold border-0 outline-none cursor-pointer ${
                        p.category === "regional" ? "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400"
                        : p.category === "global" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                        : "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                      }`}
                    >
                      <option value="local">Lok</option>
                      <option value="regional">Raj</option>
                      <option value="global">Glo</option>
                    </select>
                    <button
                      onClick={() => handleToggleVisible(p, "main")}
                      className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold transition ${
                        p.visible
                          ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                          : "bg-zinc-100 text-zinc-500 dark:bg-zinc-700 dark:text-zinc-400"
                      }`}
                    >
                      {p.visible ? "Web ✓" : "Web ✕"}
                    </button>
                    <div className="ml-auto flex gap-1.5">
                      <button onClick={() => openEdit(p)} className="rounded-lg border border-zinc-200 px-2.5 py-1 text-[11px] font-medium dark:border-zinc-600">{t("admin.edit")}</button>
                      <button onClick={() => handleDelete(p.id)} className="rounded-lg border border-red-200 px-2.5 py-1 text-[11px] font-medium text-red-600 dark:border-red-800">{t("admin.delete")}</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between">
          <p className="text-xs sm:text-sm text-zinc-500">
            {page} / {totalPages} ({total})
          </p>
          <div className="flex gap-2">
            <button
              disabled={page <= 1}
              onClick={() => fetchPackages(page - 1, search)}
              className="rounded-lg border border-zinc-200 px-3 py-2 text-sm font-medium hover:bg-zinc-50 transition disabled:opacity-40 disabled:cursor-not-allowed dark:border-zinc-600 dark:hover:bg-zinc-700"
            >
              ←
            </button>
            <button
              disabled={page >= totalPages}
              onClick={() => fetchPackages(page + 1, search)}
              className="rounded-lg border border-zinc-200 px-3 py-2 text-sm font-medium hover:bg-zinc-50 transition disabled:opacity-40 disabled:cursor-not-allowed dark:border-zinc-600 dark:hover:bg-zinc-700"
            >
              →
            </button>
          </div>
        </div>
      )}

      {/* Browse Modal - Select from existing packages */}
      {browsing && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 p-0 sm:p-4">
          <div className="w-full sm:max-w-4xl max-h-[90vh] overflow-hidden rounded-t-2xl sm:rounded-2xl bg-white shadow-xl dark:bg-zinc-800 flex flex-col">
            <div className="p-5 border-b border-zinc-200 dark:border-zinc-700">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold">Zgjedh Paketë nga Databaza</h2>
                  <p className="mt-1 text-sm text-zinc-500">{browseTotal} paketa gjithsej</p>
                </div>
                <button onClick={() => setBrowsing(false)} className="rounded-lg border border-zinc-200 px-3 py-1.5 text-sm font-medium hover:bg-zinc-50 transition dark:border-zinc-600 dark:hover:bg-zinc-700">✕</button>
              </div>
              <input
                type="text"
                placeholder="Kërko sipas emrit, rajonit, vendit..."
                value={browseSearch}
                onChange={(e) => handleBrowseSearch(e.target.value)}
                autoFocus
                className="mt-3 w-full rounded-lg border border-zinc-300 px-3 py-2.5 text-sm outline-none focus:border-shqiponja dark:border-zinc-600 dark:bg-zinc-700"
              />
            </div>
            <div className="flex-1 overflow-y-auto">
              {browseLoading ? (
                <div className="space-y-3 p-4">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="h-12 animate-pulse rounded-lg bg-zinc-200 dark:bg-zinc-700" />
                  ))}
                </div>
              ) : browseResults.length === 0 ? (
                <p className="text-center text-zinc-500 py-8">Asnjë paketë nuk u gjet. Provo një kërkim tjetër.</p>
              ) : (
                <>
                  {/* Desktop browse table */}
                  <table className="hidden md:table w-full text-sm">
                    <thead className="border-b border-zinc-100 bg-zinc-50 text-left dark:border-zinc-700 dark:bg-zinc-800 sticky top-0">
                      <tr>
                        <th className="px-3 py-2 font-semibold">{t("admin.name")}</th>
                        <th className="px-3 py-2 font-semibold">{t("admin.data")}</th>
                        <th className="px-3 py-2 font-semibold">{t("admin.price")}</th>
                        <th className="px-3 py-2 font-semibold">Kat.</th>
                        <th className="px-3 py-2 font-semibold">Web</th>
                        <th className="px-3 py-2 font-semibold">★</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100 dark:divide-zinc-700">
                      {browseResults.map((p) => (
                        <tr key={p.id} className="hover:bg-shqiponja/5 transition">
                          <td className="px-3 py-2">
                            <div className="flex items-center gap-2">
                              <AdminFlagIcon countryCode={p.country_code} emoji={p.flag} />
                              <div className="min-w-0">
                                <span className="block truncate max-w-[200px]">{p.name}</span>
                                <span className="text-[10px] text-zinc-400">{p.region} · {p.duration}</span>
                              </div>
                            </div>
                          </td>
                          <td className="px-3 py-2">{p.data}</td>
                          <td className="px-3 py-2 font-semibold">{"\u20AC"}{p.price.toFixed(2)}</td>
                          <td className="px-3 py-2">
                            <select
                              value={p.category || "local"}
                              onChange={(e) => handleSetCategory(p, e.target.value, "browse")}
                              className={`rounded-full px-2 py-0.5 text-[11px] font-bold border-0 outline-none cursor-pointer ${
                                p.category === "regional" ? "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400"
                                : p.category === "global" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                                : "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                              }`}
                            >
                              <option value="local">Lok</option>
                              <option value="regional">Raj</option>
                              <option value="global">Glo</option>
                            </select>
                          </td>
                          <td className="px-3 py-2">
                            <button
                              onClick={() => handleToggleVisible(p, "browse")}
                              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ${
                                p.visible ? "bg-green-500" : "bg-zinc-300 dark:bg-zinc-600"
                              }`}
                            >
                              <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ${
                                p.visible ? "translate-x-5" : "translate-x-0"
                              }`} />
                            </button>
                          </td>
                          <td className="px-3 py-2">
                            <button
                              onClick={() => handleToggleHighlight(p, "browse")}
                              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ${
                                p.highlight ? "bg-amber-500" : "bg-zinc-300 dark:bg-zinc-600"
                              }`}
                            >
                              <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ${
                                p.highlight ? "translate-x-5" : "translate-x-0"
                              }`} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {/* Mobile browse cards */}
                  <div className="md:hidden divide-y divide-zinc-100 dark:divide-zinc-700">
                    {browseResults.map((p) => (
                      <div key={p.id} className="px-4 py-3 space-y-2">
                        {/* Row 1: flag + name + price */}
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <AdminFlagIcon countryCode={p.country_code} emoji={p.flag} />
                            <div className="min-w-0">
                              <p className="text-sm font-medium truncate">{p.name}</p>
                              <p className="text-[11px] text-zinc-400">{p.data} · {p.duration} · {p.region}</p>
                            </div>
                          </div>
                          <span className="text-sm font-bold shrink-0">{"\u20AC"}{p.price.toFixed(2)}</span>
                        </div>
                        {/* Row 2: category + toggles */}
                        <div className="flex items-center gap-3">
                          <select
                            value={p.category || "local"}
                            onChange={(e) => handleSetCategory(p, e.target.value, "browse")}
                            className={`rounded-full px-2 py-0.5 text-[11px] font-bold border-0 outline-none cursor-pointer ${
                              p.category === "regional" ? "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400"
                              : p.category === "global" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                              : "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                            }`}
                          >
                            <option value="local">Lok</option>
                            <option value="regional">Raj</option>
                            <option value="global">Glo</option>
                          </select>
                          <div className="flex items-center gap-1.5 ml-auto">
                            <span className="text-[11px] text-zinc-400">Web</span>
                            <button
                              onClick={() => handleToggleVisible(p, "browse")}
                              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ${
                                p.visible ? "bg-green-500" : "bg-zinc-300 dark:bg-zinc-600"
                              }`}
                            >
                              <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ${
                                p.visible ? "translate-x-5" : "translate-x-0"
                              }`} />
                            </button>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-[11px] text-zinc-400">★</span>
                            <button
                              onClick={() => handleToggleHighlight(p, "browse")}
                              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ${
                                p.highlight ? "bg-amber-500" : "bg-zinc-300 dark:bg-zinc-600"
                              }`}
                            >
                              <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ${
                                p.highlight ? "translate-x-5" : "translate-x-0"
                              }`} />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
            <div className="p-4 border-t border-zinc-200 dark:border-zinc-700 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              {browseTotalPages > 1 ? (
                <>
                  <p className="text-sm text-zinc-500 text-center sm:text-left">Faqja {browsePage} / {browseTotalPages}</p>
                  <div className="flex items-center gap-2 justify-center sm:justify-end">
                    <button
                      disabled={browsePage <= 1}
                      onClick={() => fetchBrowseResults(browsePage - 1, browseSearch)}
                      className="rounded-lg border border-zinc-200 px-3 py-1.5 text-sm font-medium hover:bg-zinc-50 transition disabled:opacity-40 disabled:cursor-not-allowed dark:border-zinc-600 dark:hover:bg-zinc-700"
                    >
                      ←
                    </button>
                    <button
                      disabled={browsePage >= browseTotalPages}
                      onClick={() => fetchBrowseResults(browsePage + 1, browseSearch)}
                      className="rounded-lg border border-zinc-200 px-3 py-1.5 text-sm font-medium hover:bg-zinc-50 transition disabled:opacity-40 disabled:cursor-not-allowed dark:border-zinc-600 dark:hover:bg-zinc-700"
                    >
                      →
                    </button>
                    <button
                      onClick={() => { setBrowsing(false); fetchPackages(page, search); }}
                      className="rounded-lg bg-shqiponja px-5 py-1.5 text-sm font-semibold text-white hover:bg-shqiponja-dark transition shadow-md shadow-shqiponja/25"
                    >
                      OK
                    </button>
                  </div>
                </>
              ) : (
                <button
                  onClick={() => { setBrowsing(false); fetchPackages(page, search); }}
                  className="w-full sm:w-auto sm:ml-auto rounded-lg bg-shqiponja px-5 py-2 text-sm font-semibold text-white hover:bg-shqiponja-dark transition shadow-md shadow-shqiponja/25"
                >
                  OK — Ruaj & Mbyll
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 p-0 sm:p-4">
          <div className="w-full sm:max-w-lg max-h-[85vh] overflow-y-auto rounded-t-2xl sm:rounded-2xl bg-white p-5 sm:p-6 shadow-xl dark:bg-zinc-800">
            <h2 className="text-lg font-bold">{t("admin.editPackage")}</h2>
            <p className="text-sm text-zinc-500 mt-1 flex items-center gap-2">
              <AdminFlagIcon countryCode={editing.country_code} emoji={editing.flag} />
              {editing.name}
            </p>
            <div className="mt-4 grid gap-3 grid-cols-1 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-zinc-500 mb-1">Emri</label>
                <input value={editing.name || ""} onChange={(e) => setEditing({ ...editing, name: e.target.value })} className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-shqiponja dark:border-zinc-600 dark:bg-zinc-700" />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-500 mb-1">{t("admin.region")}</label>
                <input value={editing.region || ""} onChange={(e) => setEditing({ ...editing, region: e.target.value })} className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-shqiponja dark:border-zinc-600 dark:bg-zinc-700" />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-500 mb-1">Flag</label>
                <input value={editing.flag || ""} onChange={(e) => setEditing({ ...editing, flag: e.target.value })} className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-shqiponja dark:border-zinc-600 dark:bg-zinc-700" />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-500 mb-1">{t("admin.data")}</label>
                <input value={editing.data || ""} onChange={(e) => setEditing({ ...editing, data: e.target.value })} className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-shqiponja dark:border-zinc-600 dark:bg-zinc-700" />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-500 mb-1">{t("admin.duration")}</label>
                <input value={editing.duration || ""} onChange={(e) => setEditing({ ...editing, duration: e.target.value })} className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-shqiponja dark:border-zinc-600 dark:bg-zinc-700" />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-500 mb-1">{t("admin.price")} (EUR)</label>
                <input type="number" min="0" step="0.01" value={editing.price ?? 0} onChange={(e) => setEditing({ ...editing, price: parseFloat(e.target.value) || 0 })} className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-shqiponja dark:border-zinc-600 dark:bg-zinc-700" />
              </div>
              {editing.net_price != null && (
                <div>
                  <label className="block text-xs font-medium text-zinc-500 mb-1">Çmimi origjinal (Airalo)</label>
                  <p className="rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-500 dark:border-zinc-700 dark:bg-zinc-900">{"\u20AC"}{editing.net_price.toFixed(2)}</p>
                </div>
              )}
              <input placeholder={t("admin.description")} value={editing.description || ""} onChange={(e) => setEditing({ ...editing, description: e.target.value })} className="sm:col-span-2 rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-shqiponja dark:border-zinc-600 dark:bg-zinc-700" />
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-zinc-500 mb-1.5">Kategoria</label>
                <select
                  value={editing.category || "local"}
                  onChange={(e) => setEditing({ ...editing, category: e.target.value })}
                  className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-shqiponja dark:border-zinc-600 dark:bg-zinc-700"
                >
                  <option value="local">Lokale</option>
                  <option value="regional">Rajonale</option>
                  <option value="global">Globale</option>
                </select>
              </div>
              <div className="sm:col-span-2 flex flex-wrap gap-4 mt-1">
                <label className="flex items-center gap-3 text-sm cursor-pointer" onClick={() => setEditing({ ...editing, visible: !editing.visible })}>
                  <span className={`relative inline-flex h-6 w-11 shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 ${editing.visible ? "bg-green-500" : "bg-zinc-300 dark:bg-zinc-600"}`}>
                    <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ${editing.visible ? "translate-x-5" : "translate-x-0"}`} />
                  </span>
                  <span className="flex items-center gap-1.5">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3" /></svg>
                    Aktiv në Web
                  </span>
                </label>
                <label className="flex items-center gap-3 text-sm cursor-pointer" onClick={() => setEditing({ ...editing, highlight: !editing.highlight })}>
                  <span className={`relative inline-flex h-6 w-11 shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 ${editing.highlight ? "bg-amber-500" : "bg-zinc-300 dark:bg-zinc-600"}`}>
                    <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ${editing.highlight ? "translate-x-5" : "translate-x-0"}`} />
                  </span>
                  <span className="flex items-center gap-1.5">
                    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z" /></svg>
                    {t("admin.popular")}
                  </span>
                </label>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button onClick={() => setEditing(null)} className="rounded-lg border border-zinc-200 px-4 py-2 text-sm font-medium hover:bg-zinc-50 transition dark:border-zinc-600 dark:hover:bg-zinc-700">{t("admin.cancel")}</button>
              <button onClick={handleSave} className="rounded-lg bg-shqiponja px-4 py-2 text-sm font-semibold text-white hover:bg-shqiponja-dark transition">{t("admin.save")}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
