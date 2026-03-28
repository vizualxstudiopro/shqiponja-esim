"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useAuth } from "@/lib/auth-context";
import { useI18n } from "@/lib/i18n-context";
import {
  adminGetPackages,
  adminCreatePackage,
  adminUpdatePackage,
  adminDeletePackage,
  adminTogglePackageVisible,
  adminTogglePackageHighlight,
  type EsimPackage,
} from "@/lib/api";
import { useToast } from "@/lib/toast-context";

const emptyPkg = { name: "", region: "", flag: "", data: "", duration: "", price: 0, currency: "EUR", highlight: false, description: "" };
const PAGE_SIZE = 50;

export default function AdminPackagesPage() {
  const { token } = useAuth();
  const { t } = useI18n();
  const { toast } = useToast();
  const [packages, setPackages] = useState<EsimPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Partial<EsimPackage> & typeof emptyPkg | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

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

  function openNew() {
    setEditing({ ...emptyPkg });
    setIsNew(true);
  }

  function openEdit(pkg: EsimPackage) {
    setEditing({ ...pkg });
    setIsNew(false);
  }

  async function handleSave() {
    if (!token || !editing) return;
    if (!editing.name.trim() || !editing.region.trim() || !editing.data.trim() || !editing.duration.trim()) {
      toast("Plotëso fushat e detyrueshme", "error");
      return;
    }
    if (!Number.isFinite(editing.price) || editing.price < 0) {
      toast("Çmimi duhet të jetë numër pozitiv", "error");
      return;
    }
    try {
      if (isNew) {
        await adminCreatePackage(token, editing as Omit<EsimPackage, "id">);
      } else {
        await adminUpdatePackage(token, (editing as EsimPackage).id, editing as Omit<EsimPackage, "id">);
      }
      setEditing(null);
      toast(isNew ? "Paketa u shtua" : "Paketa u përditësua", "success");
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
          onClick={openNew}
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

      {/* Modal */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 p-0 sm:p-4">
          <div className="w-full sm:max-w-lg max-h-[85vh] overflow-y-auto rounded-t-2xl sm:rounded-2xl bg-white p-5 sm:p-6 shadow-xl dark:bg-zinc-800">
            <h2 className="text-lg font-bold">{isNew ? t("admin.addPackageTitle") : t("admin.editPackage")}</h2>
            <div className="mt-4 grid gap-3 grid-cols-1 sm:grid-cols-2">
              <input required placeholder={t("admin.name")} value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} className="rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-shqiponja dark:border-zinc-600 dark:bg-zinc-700" />
              <input required placeholder={t("admin.region")} value={editing.region} onChange={(e) => setEditing({ ...editing, region: e.target.value })} className="rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-shqiponja dark:border-zinc-600 dark:bg-zinc-700" />
              <input placeholder="Flag emoji" value={editing.flag} onChange={(e) => setEditing({ ...editing, flag: e.target.value })} className="rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-shqiponja dark:border-zinc-600 dark:bg-zinc-700" />
              <input required placeholder={t("admin.data")} value={editing.data} onChange={(e) => setEditing({ ...editing, data: e.target.value })} className="rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-shqiponja dark:border-zinc-600 dark:bg-zinc-700" />
              <input required placeholder={t("admin.duration")} value={editing.duration} onChange={(e) => setEditing({ ...editing, duration: e.target.value })} className="rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-shqiponja dark:border-zinc-600 dark:bg-zinc-700" />
              <input required min="0" step="0.01" placeholder={t("admin.price")} type="number" value={editing.price} onChange={(e) => setEditing({ ...editing, price: parseFloat(e.target.value) || 0 })} className="rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-shqiponja dark:border-zinc-600 dark:bg-zinc-700" />
              <input placeholder={t("admin.description")} value={editing.description} onChange={(e) => setEditing({ ...editing, description: e.target.value })} className="sm:col-span-2 rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-shqiponja dark:border-zinc-600 dark:bg-zinc-700" />
              <label className="sm:col-span-2 flex items-center gap-2 text-sm">
                <input type="checkbox" checked={editing.highlight} onChange={(e) => setEditing({ ...editing, highlight: e.target.checked })} className="rounded border-zinc-300" />
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
