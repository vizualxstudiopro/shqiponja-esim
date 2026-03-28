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
  type EsimPackage,
} from "@/lib/api";
import { useToast } from "@/lib/toast-context";

const PAGE_SIZE = 50;

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
  const searchTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

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

  function activateAndEdit(pkg: EsimPackage) {
    setBrowsing(false);
    setEditing({ ...pkg, visible: true });
  }

  function openEdit(pkg: EsimPackage) {
    setEditing({ ...pkg });
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

  async function handleToggleVisible(pkg: EsimPackage) {
    if (!token) return;
    try {
      const updated = await adminTogglePackageVisible(token, pkg.id, !pkg.visible);
      setPackages((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
      toast(updated.visible ? "Paketa u shtua në Web" : "Paketa u hoq nga Web", "success");
    } catch (err) {
      toast(err instanceof Error ? err.message : "Error", "error");
    }
  }

  async function handleToggleHighlight(pkg: EsimPackage) {
    if (!token) return;
    try {
      const updated = await adminTogglePackageHighlight(token, pkg.id, !pkg.highlight);
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

      <input
        type="text"
        placeholder={t("admin.search")}
        value={search}
        onChange={(e) => handleSearch(e.target.value)}
        className="mt-4 w-full sm:max-w-xs rounded-lg border border-zinc-200 px-4 py-2.5 text-sm outline-none focus:border-shqiponja dark:border-zinc-700 dark:bg-zinc-800"
      />

      {/* Table */}
      <div className="mt-4 overflow-x-auto rounded-xl border border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-900">
        {loading ? (
          <div className="space-y-3 p-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-12 animate-pulse rounded-lg bg-zinc-200 dark:bg-zinc-700" />
            ))}
          </div>
        ) : (
        <table className="w-full text-sm">
          <thead className="border-b border-zinc-100 bg-zinc-50 text-left dark:border-zinc-700 dark:bg-zinc-800">
            <tr>
              <th className="px-4 py-3 font-semibold">#</th>
              <th className="px-4 py-3 font-semibold">{t("admin.name")}</th>
              <th className="px-4 py-3 font-semibold">{t("admin.region")}</th>
              <th className="px-4 py-3 font-semibold">{t("admin.data")}</th>
              <th className="px-4 py-3 font-semibold">{t("admin.duration")}</th>
              <th className="px-4 py-3 font-semibold">{t("admin.price")}</th>
              <th className="px-4 py-3 font-semibold">Web</th>
              <th className="px-4 py-3 font-semibold">★</th>
              <th className="px-4 py-3 font-semibold">{t("admin.actions")}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-700">
            {packages.map((p) => (
              <tr key={p.id} className="hover:bg-zinc-50 transition dark:hover:bg-zinc-800">
                <td className="px-4 py-3 font-medium">{p.id}</td>
                <td className="px-4 py-3">
                  {p.flag} {p.name} {p.highlight && <span className="ml-1 rounded-full bg-shqiponja/10 px-2 py-0.5 text-[10px] font-bold text-shqiponja">★</span>}
                </td>
                <td className="px-4 py-3">{p.region}</td>
                <td className="px-4 py-3">{p.data}</td>
                <td className="px-4 py-3">{p.duration}</td>
                <td className="px-4 py-3 font-semibold">{"\u20AC"}{p.price.toFixed(2)}</td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => handleToggleVisible(p)}
                    className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                      p.visible
                        ? "bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400"
                        : "bg-zinc-100 text-zinc-500 hover:bg-shqiponja/10 hover:text-shqiponja dark:bg-zinc-700 dark:text-zinc-400"
                    }`}
                  >
                    {p.visible ? t("admin.visibleOnWeb") : t("admin.showOnWeb")}
                  </button>
                </td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => handleToggleHighlight(p)}
                    className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                      p.highlight
                        ? "bg-yellow-100 text-yellow-700 hover:bg-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400"
                        : "bg-zinc-100 text-zinc-500 hover:bg-yellow-50 hover:text-yellow-600 dark:bg-zinc-700 dark:text-zinc-400"
                    }`}
                  >
                    {p.highlight ? "★ Popullar" : "☆"}
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
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between">
          <p className="text-sm text-zinc-500">
            Faqja {page} / {totalPages} ({total} pako)
          </p>
          <div className="flex gap-2">
            <button
              disabled={page <= 1}
              onClick={() => fetchPackages(page - 1, search)}
              className="rounded-lg border border-zinc-200 px-3 py-2 text-sm font-medium hover:bg-zinc-50 transition disabled:opacity-40 disabled:cursor-not-allowed dark:border-zinc-600 dark:hover:bg-zinc-700"
            >
              ← Para
            </button>
            <button
              disabled={page >= totalPages}
              onClick={() => fetchPackages(page + 1, search)}
              className="rounded-lg border border-zinc-200 px-3 py-2 text-sm font-medium hover:bg-zinc-50 transition disabled:opacity-40 disabled:cursor-not-allowed dark:border-zinc-600 dark:hover:bg-zinc-700"
            >
              Pas →
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
                <table className="w-full text-sm">
                  <thead className="border-b border-zinc-100 bg-zinc-50 text-left dark:border-zinc-700 dark:bg-zinc-800 sticky top-0">
                    <tr>
                      <th className="px-3 py-2 font-semibold">#</th>
                      <th className="px-3 py-2 font-semibold">{t("admin.name")}</th>
                      <th className="px-3 py-2 font-semibold">{t("admin.region")}</th>
                      <th className="px-3 py-2 font-semibold">{t("admin.data")}</th>
                      <th className="px-3 py-2 font-semibold">{t("admin.duration")}</th>
                      <th className="px-3 py-2 font-semibold">{t("admin.price")}</th>
                      <th className="px-3 py-2 font-semibold">Web</th>
                      <th className="px-3 py-2 font-semibold"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 dark:divide-zinc-700">
                    {browseResults.map((p) => (
                      <tr key={p.id} className="hover:bg-shqiponja/5 transition">
                        <td className="px-3 py-2 font-medium text-zinc-400">{p.id}</td>
                        <td className="px-3 py-2">
                          {p.flag} {p.name}
                          {p.visible && <span className="ml-1 rounded-full bg-green-100 px-1.5 py-0.5 text-[10px] font-bold text-green-700">Web</span>}
                          {p.highlight && <span className="ml-1 rounded-full bg-shqiponja/10 px-1.5 py-0.5 text-[10px] font-bold text-shqiponja">★</span>}
                        </td>
                        <td className="px-3 py-2 text-zinc-500">{p.region}</td>
                        <td className="px-3 py-2">{p.data}</td>
                        <td className="px-3 py-2">{p.duration}</td>
                        <td className="px-3 py-2 font-semibold">{"\u20AC"}{p.price.toFixed(2)}</td>
                        <td className="px-3 py-2">
                          <span className={`inline-block h-2 w-2 rounded-full ${p.visible ? "bg-green-500" : "bg-zinc-300"}`} />
                        </td>
                        <td className="px-3 py-2">
                          <button
                            onClick={() => activateAndEdit(p)}
                            className="rounded-lg bg-shqiponja px-3 py-1.5 text-xs font-semibold text-white hover:bg-shqiponja-dark transition whitespace-nowrap"
                          >
                            Zgjidh & Ndrysho
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
            {browseTotalPages > 1 && (
              <div className="p-4 border-t border-zinc-200 dark:border-zinc-700 flex items-center justify-between">
                <p className="text-sm text-zinc-500">Faqja {browsePage} / {browseTotalPages}</p>
                <div className="flex gap-2">
                  <button
                    disabled={browsePage <= 1}
                    onClick={() => fetchBrowseResults(browsePage - 1, browseSearch)}
                    className="rounded-lg border border-zinc-200 px-3 py-1.5 text-sm font-medium hover:bg-zinc-50 transition disabled:opacity-40 disabled:cursor-not-allowed dark:border-zinc-600 dark:hover:bg-zinc-700"
                  >
                    ← Para
                  </button>
                  <button
                    disabled={browsePage >= browseTotalPages}
                    onClick={() => fetchBrowseResults(browsePage + 1, browseSearch)}
                    className="rounded-lg border border-zinc-200 px-3 py-1.5 text-sm font-medium hover:bg-zinc-50 transition disabled:opacity-40 disabled:cursor-not-allowed dark:border-zinc-600 dark:hover:bg-zinc-700"
                  >
                    Pas →
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 p-0 sm:p-4">
          <div className="w-full sm:max-w-lg max-h-[85vh] overflow-y-auto rounded-t-2xl sm:rounded-2xl bg-white p-5 sm:p-6 shadow-xl dark:bg-zinc-800">
            <h2 className="text-lg font-bold">{t("admin.editPackage")}</h2>
            <p className="text-sm text-zinc-500 mt-1">{editing.flag} {editing.name}</p>
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
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={!!editing.visible} onChange={(e) => setEditing({ ...editing, visible: e.target.checked })} className="rounded border-zinc-300" />
                Aktiv në Web
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={!!editing.highlight} onChange={(e) => setEditing({ ...editing, highlight: e.target.checked })} className="rounded border-zinc-300" />
                {t("admin.popular")}
              </label>
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
