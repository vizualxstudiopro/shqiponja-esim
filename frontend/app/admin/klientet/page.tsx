"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/lib/auth-context";
import { useI18n } from "@/lib/i18n-context";
import { adminGetCustomers, adminGetCustomerDetail, type Customer, type CustomerDetail, type PaginatedCustomers } from "@/lib/api";
import { useToast } from "@/lib/toast-context";
import { Search, ChevronLeft, ChevronRight, Eye, X, ShoppingCart, Euro } from "lucide-react";

export default function AdminCustomersPage() {
  const { token } = useAuth();
  const { t, locale } = useI18n();
  const { toast } = useToast();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [detail, setDetail] = useState<CustomerDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const fetchCustomers = useCallback(() => {
    if (!token) return;
    setLoading(true);
    adminGetCustomers(token, page, search)
      .then((data: PaginatedCustomers) => {
        setCustomers(data.customers);
        setTotalPages(data.totalPages);
        setTotal(data.total);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [token, page, search]);

  useEffect(() => { fetchCustomers(); }, [fetchCustomers]);
  useEffect(() => { setPage(1); }, [search]);

  async function openDetail(id: number) {
    if (!token) return;
    setDetailLoading(true);
    try {
      setDetail(await adminGetCustomerDetail(token, id));
    } catch (err) {
      toast(err instanceof Error ? err.message : "Error", "error");
    } finally {
      setDetailLoading(false);
    }
  }

  if (loading) return <div className="space-y-3">{[...Array(5)].map((_, i) => <div key={i} className="h-14 animate-pulse rounded-lg bg-zinc-200 dark:bg-zinc-700" />)}</div>;

  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold">👤 Klientët</h1>
          <p className="mt-1 text-sm text-zinc-500">{total} {t("admin.totalSuffix")}</p>
        </div>
      </div>

      <div className="mt-4">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
          <input type="text" placeholder={t("admin.search")} value={search} onChange={(e) => setSearch(e.target.value)} className="w-full rounded-lg border border-zinc-200 pl-10 pr-4 py-2.5 text-sm outline-none focus:border-shqiponja dark:border-zinc-700 dark:bg-zinc-800" />
        </div>
      </div>

      <div className="mt-4 overflow-x-auto rounded-xl border border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-900">
        <table className="w-full text-sm">
          <thead className="border-b border-zinc-100 bg-zinc-50 text-left dark:border-zinc-700 dark:bg-zinc-800">
            <tr>
              <th className="px-4 py-3 font-semibold">#</th>
              <th className="px-4 py-3 font-semibold">{t("admin.name")}</th>
              <th className="px-4 py-3 font-semibold">{t("admin.email")}</th>
              <th className="px-4 py-3 font-semibold">Porosi</th>
              <th className="px-4 py-3 font-semibold">Shpenzuar</th>
              <th className="px-4 py-3 font-semibold">{t("admin.registered")}</th>
              <th className="px-4 py-3 font-semibold">{t("admin.action")}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-700">
            {customers.map((c) => (
              <tr key={c.id} className="hover:bg-zinc-50 transition dark:hover:bg-zinc-800">
                <td className="px-4 py-3 font-mono text-xs">{c.id}</td>
                <td className="px-4 py-3 font-medium">{c.name}</td>
                <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">{c.email}</td>
                <td className="px-4 py-3">
                  <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-xs font-semibold text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                    <ShoppingCart className="h-3 w-3" /> {c.order_count}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className="inline-flex items-center gap-1 text-sm font-medium">
                    <Euro className="h-3 w-3 text-zinc-400" /> {(c.total_spent ?? 0).toFixed(2)}
                  </span>
                </td>
                <td className="px-4 py-3 text-zinc-500 text-xs">{new Date(c.created_at).toLocaleDateString(locale === "sq" ? "sq-AL" : "en-US")}</td>
                <td className="px-4 py-3">
                  <button onClick={() => openDetail(c.id)} className="rounded-lg p-1.5 text-zinc-500 hover:bg-zinc-100 hover:text-shqiponja transition dark:hover:bg-zinc-700"><Eye className="h-4 w-4" /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {customers.length === 0 && <p className="py-8 text-center text-sm text-zinc-400">Asnjë klient ende</p>}
      </div>

      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-center gap-2">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-medium hover:bg-zinc-50 transition disabled:opacity-40 dark:border-zinc-600 dark:hover:bg-zinc-700"><ChevronLeft className="h-4 w-4" /></button>
          <span className="text-sm text-zinc-500">{t("admin.page")} {page} / {totalPages}</span>
          <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-medium hover:bg-zinc-50 transition disabled:opacity-40 dark:border-zinc-600 dark:hover:bg-zinc-700"><ChevronRight className="h-4 w-4" /></button>
        </div>
      )}

      {/* CUSTOMER DETAIL MODAL */}
      {(detail || detailLoading) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => !detailLoading && setDetail(null)}>
          <div className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl dark:bg-zinc-900" onClick={e => e.stopPropagation()}>
            <button onClick={() => setDetail(null)} className="absolute right-4 top-4 rounded-lg p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800"><X className="h-5 w-5" /></button>
            {detailLoading ? (
              <div className="flex h-40 items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-shqiponja border-t-transparent" /></div>
            ) : detail && (
              <div>
                <h2 className="text-lg font-extrabold">👤 {detail.name}</h2>
                <p className="mt-1 text-sm text-zinc-500">{detail.email}</p>
                <div className="mt-3 flex items-center gap-4">
                  <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                    <ShoppingCart className="h-3 w-3" /> {detail.orders.length} porosi
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-700 dark:bg-green-900/30 dark:text-green-400">
                    <Euro className="h-3 w-3" /> {(detail.total_spent ?? 0).toFixed(2)} shpenzuar
                  </span>
                  <span className="text-xs text-zinc-400">Regjistruar: {new Date(detail.created_at).toLocaleDateString(locale === "sq" ? "sq-AL" : "en-US")}</span>
                </div>

                <h3 className="mt-5 text-sm font-bold">Historiku i Porosive</h3>
                {detail.orders.length === 0 && <p className="mt-2 text-sm text-zinc-400">Asnjë porosi</p>}
                <div className="mt-2 space-y-2">
                  {detail.orders.map(o => (
                    <div key={o.id} className="flex items-center justify-between rounded-lg border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-700 dark:bg-zinc-800">
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-xs text-zinc-400">#{o.id}</span>
                        <span>{o.package_flag} {o.package_name}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${o.payment_status === "paid" ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"}`}>{o.payment_status}</span>
                        <span className="text-xs text-zinc-400">{new Date(o.created_at).toLocaleDateString(locale === "sq" ? "sq-AL" : "en-US")}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
