"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/lib/auth-context";
import { useI18n } from "@/lib/i18n-context";
import {
  adminGetOrders,
  adminUpdateOrderStatus,
  type Order,
  type PaginatedOrders,
} from "@/lib/api";
import { useToast } from "@/lib/toast-context";

export default function AdminOrdersPage() {
  const { token } = useAuth();
  const { t, locale } = useI18n();
  const { toast } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [paymentFilter, setPaymentFilter] = useState("");

  const fetchOrders = useCallback(() => {
    if (!token) return;
    setLoading(true);
    adminGetOrders(token, page, {
      status: statusFilter,
      payment_status: paymentFilter,
      q: search,
    })
      .then((data: PaginatedOrders) => {
        setOrders(data.orders);
        setTotalPages(data.totalPages);
        setTotal(data.total);
      })
      .finally(() => setLoading(false));
  }, [token, page, statusFilter, paymentFilter, search]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  // Reset page when filters change
  useEffect(() => { setPage(1); }, [statusFilter, paymentFilter, search]);

  async function togglePaid(o: Order) {
    if (!token) return;
    const newStatus = o.payment_status === "paid" ? "unpaid" : "paid";
    const newOrderStatus = newStatus === "paid" ? "completed" : "pending";
    try {
      const updated = await adminUpdateOrderStatus(token, o.id, {
        payment_status: newStatus,
        status: newOrderStatus,
      });
      setOrders((prev) => prev.map((x) => (x.id === updated.id ? { ...x, ...updated } : x)));
    } catch (err) {
      toast(err instanceof Error ? err.message : "Error", "error");
    }
  }

  function exportCSV() {
    const header = ["ID", "Package", "Email", "Payment", "Status", "Date"];
    const rows = orders.map((o) => [
      o.id,
      o.package_name,
      o.email,
      o.payment_status,
      o.status,
      new Date(o.created_at).toISOString().split("T")[0],
    ]);
    const csv = [header, ...rows].map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `orders-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  if (loading)
    return (
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-14 animate-pulse rounded-lg bg-zinc-200" />
        ))}
      </div>
    );

  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold">{t("admin.orders")}</h1>
          <p className="mt-1 text-sm text-zinc-500">{total} {t("admin.totalSuffix")}</p>
        </div>
        <button onClick={exportCSV} className="w-full sm:w-auto rounded-lg border border-zinc-200 px-4 py-2.5 text-sm font-medium hover:bg-zinc-50 transition dark:border-zinc-700 dark:hover:bg-zinc-800">
          {t("admin.exportCSV")}
        </button>
      </div>

      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        <input
          type="text"
          placeholder={t("admin.search")}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full sm:max-w-xs rounded-lg border border-zinc-200 px-4 py-2.5 text-sm outline-none focus:border-shqiponja dark:border-zinc-700 dark:bg-zinc-800"
        />
        <div className="flex gap-3">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="flex-1 sm:flex-none rounded-lg border border-zinc-200 px-3 py-2.5 text-sm outline-none focus:border-shqiponja dark:border-zinc-700 dark:bg-zinc-800"
        >
          <option value="">{t("admin.allStatuses")}</option>
          <option value="pending">{t("admin.pendingStatus")}</option>
          <option value="completed">{t("admin.completed")}</option>
          <option value="cancelled">{t("admin.cancelled")}</option>
        </select>
        <select
          value={paymentFilter}
          onChange={(e) => setPaymentFilter(e.target.value)}
          className="flex-1 sm:flex-none rounded-lg border border-zinc-200 px-3 py-2.5 text-sm outline-none focus:border-shqiponja dark:border-zinc-700 dark:bg-zinc-800"
        >
          <option value="">{t("admin.allStatuses")}</option>
          <option value="unpaid">{t("admin.unpaid")}</option>
          <option value="paid">{t("admin.paid")}</option>
          <option value="refunded">{t("admin.refunded")}</option>
        </select>
        </div>
      </div>

      <div className="mt-4 overflow-x-auto rounded-xl border border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-900">
        <table className="w-full text-sm">
          <thead className="border-b border-zinc-100 bg-zinc-50 text-left dark:border-zinc-700 dark:bg-zinc-800">
            <tr>
              <th className="px-4 py-3 font-semibold">#</th>
              <th className="px-4 py-3 font-semibold">{t("admin.package")}</th>
              <th className="px-4 py-3 font-semibold">{t("admin.email")}</th>
              <th className="px-4 py-3 font-semibold">{t("admin.payment")}</th>
              <th className="px-4 py-3 font-semibold">{t("admin.status")}</th>
              <th className="px-4 py-3 font-semibold">{t("admin.date")}</th>
              <th className="px-4 py-3 font-semibold">{t("admin.action")}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-700">
            {orders.map((o) => (
              <tr key={o.id} className="hover:bg-zinc-50 transition dark:hover:bg-zinc-800">
                <td className="px-4 py-3 font-medium">{o.id}</td>
                <td className="px-4 py-3">
                  {o.package_flag} {o.package_name}
                </td>
                <td className="px-4 py-3">{o.email}</td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${
                      o.payment_status === "paid"
                        ? "bg-green-100 text-green-700"
                        : "bg-amber-100 text-amber-700"
                    }`}
                  >
                    {o.payment_status === "paid" ? t("admin.paid") : t("admin.unpaid")}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${
                      o.status === "completed"
                        ? "bg-green-100 text-green-700"
                        : "bg-amber-100 text-amber-700"
                    }`}
                  >
                    {o.status === "completed" ? t("admin.completed") : t("admin.pendingStatus")}
                  </span>
                </td>
                <td className="px-4 py-3 text-zinc-500">
                  {new Date(o.created_at).toLocaleDateString(locale === "sq" ? "sq-AL" : "en-US")}
                </td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => togglePaid(o)}
                    className="rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-medium hover:bg-zinc-50 transition dark:border-zinc-600 dark:hover:bg-zinc-700"
                  >
                    {o.payment_status === "paid" ? t("admin.markUnpaid") : t("admin.markPaid")}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {orders.length === 0 && (
          <p className="py-8 text-center text-sm text-zinc-400">{t("admin.noOrders")}</p>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-center gap-2">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
            className="rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-medium hover:bg-zinc-50 transition disabled:opacity-40 dark:border-zinc-600 dark:hover:bg-zinc-700">◀</button>
          <span className="text-sm text-zinc-500">{t("admin.page")} {page} / {totalPages}</span>
          <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
            className="rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-medium hover:bg-zinc-50 transition disabled:opacity-40 dark:border-zinc-600 dark:hover:bg-zinc-700">▶</button>
        </div>
      )}
    </div>
  );
}
