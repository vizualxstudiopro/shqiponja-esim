"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/lib/auth-context";
import { useI18n } from "@/lib/i18n-context";
import {
  adminGetOrders,
  adminUpdateOrderStatus,
  adminGetOrderDetail,
  adminResendEsim,
  adminFulfillEsim,
  type Order,
  type OrderDetail,
  type PaginatedOrders,
} from "@/lib/api";
import { useToast } from "@/lib/toast-context";
import { Download, Search, ChevronLeft, ChevronRight, Eye, CheckCircle, Send, X, Copy, Wrench } from "lucide-react";

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
  const [detail, setDetail] = useState<OrderDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [fulfillOpen, setFulfillOpen] = useState(false);
  const [fulfilling, setFulfilling] = useState(false);
  const [fulfillForm, setFulfillForm] = useState({ iccid: "", qr_data: "", qr_code_url: "", activation_code: "" });

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
  useEffect(() => { setPage(1); }, [statusFilter, paymentFilter, search]);

  async function togglePaid(o: Order) {
    if (!token) return;
    const newStatus = o.payment_status === "paid" ? "unpaid" : "paid";
    const newOrderStatus = newStatus === "paid" ? "completed" : "pending";
    try {
      const updated = await adminUpdateOrderStatus(token, o.id, { payment_status: newStatus, status: newOrderStatus });
      setOrders((prev) => prev.map((x) => (x.id === updated.id ? { ...x, ...updated } : x)));
    } catch (err) {
      toast(err instanceof Error ? err.message : "Error", "error");
    }
  }

  async function markCompleted(o: Order) {
    if (!token) return;
    try {
      const updated = await adminUpdateOrderStatus(token, o.id, { status: "completed", payment_status: "paid" });
      setOrders((prev) => prev.map((x) => (x.id === updated.id ? { ...x, ...updated } : x)));
      toast("Porosia u shënua si e kompletuar", "success");
    } catch (err) {
      toast(err instanceof Error ? err.message : "Error", "error");
    }
  }

  async function openDetail(id: number) {
    if (!token) return;
    setDetailLoading(true);
    try {
      setDetail(await adminGetOrderDetail(token, id));
    } catch (err) {
      toast(err instanceof Error ? err.message : "Error", "error");
    } finally {
      setDetailLoading(false);
    }
  }

  async function handleResendEsim() {
    if (!token || !detail) return;
    setResending(true);
    try {
      await adminResendEsim(token, detail.id);
      toast("eSIM u ridërgua me sukses!", "success");
    } catch (err) {
      toast(err instanceof Error ? err.message : "Error", "error");
    } finally {
      setResending(false);
    }
  }

  async function handleFulfillEsim() {
    if (!token || !detail) return;
    if (!fulfillForm.iccid && !fulfillForm.qr_data && !fulfillForm.qr_code_url) {
      toast("Duhet të paktën ICCID, QR Data ose QR URL", "error");
      return;
    }
    setFulfilling(true);
    try {
      const result = await adminFulfillEsim(token, detail.id, {
        iccid: fulfillForm.iccid || undefined,
        qr_data: fulfillForm.qr_data || undefined,
        qr_code_url: fulfillForm.qr_code_url || undefined,
        activation_code: fulfillForm.activation_code || undefined,
      });
      setDetail(prev => prev ? { ...prev, ...result.order, esim_status: "active", status: "completed" } : null);
      setOrders(prev => prev.map(o => o.id === detail.id ? { ...o, status: "completed", esim_status: "active" } : o));
      setFulfillOpen(false);
      setFulfillForm({ iccid: "", qr_data: "", qr_code_url: "", activation_code: "" });
      toast("eSIM u provizionua dhe email-i u dërgua!", "success");
    } catch (err) {
      toast(err instanceof Error ? err.message : "Error", "error");
    } finally {
      setFulfilling(false);
    }
  }

  function exportCSV() {
    const header = ["ID", "Package", "Email", "Payment", "Status", "ICCID", "eSIM Status", "Date"];
    const rows = orders.map((o) => [o.id, o.package_name, o.email, o.payment_status, o.status, o.iccid || "", o.esim_status || "", new Date(o.created_at).toISOString().split("T")[0]]);
    const csv = [header, ...rows].map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `orders-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function statusBadge(status: string) {
    const colors: Record<string, string> = {
      paid: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
      completed: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
      unpaid: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
      pending: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
      cancelled: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
      failed: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
      refunded: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
      awaiting_esim: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
      active: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
      provisioning_failed: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
    };
    return <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${colors[status] || "bg-zinc-100 text-zinc-600"}`}>{status}</span>;
  }

  if (loading) return <div className="space-y-3">{[...Array(5)].map((_, i) => <div key={i} className="h-14 animate-pulse rounded-lg bg-zinc-200 dark:bg-zinc-700" />)}</div>;

  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold">{t("admin.orders")}</h1>
          <p className="mt-1 text-sm text-zinc-500">{total} {t("admin.totalSuffix")}</p>
        </div>
        <button onClick={exportCSV} className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-lg border border-zinc-200 px-4 py-2.5 text-sm font-medium hover:bg-zinc-50 transition dark:border-zinc-700 dark:hover:bg-zinc-800">
          <Download className="h-4 w-4" /> {t("admin.exportCSV")}
        </button>
      </div>

      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
          <input type="text" placeholder={t("admin.search")} value={search} onChange={(e) => setSearch(e.target.value)} className="w-full rounded-lg border border-zinc-200 pl-10 pr-4 py-2.5 text-sm outline-none focus:border-shqiponja dark:border-zinc-700 dark:bg-zinc-800" />
        </div>
        <div className="flex gap-3">
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="flex-1 sm:flex-none rounded-lg border border-zinc-200 px-3 py-2.5 text-sm outline-none focus:border-shqiponja dark:border-zinc-700 dark:bg-zinc-800">
            <option value="">{t("admin.allStatuses")}</option>
            <option value="pending">{t("admin.pendingStatus")}</option>
            <option value="completed">{t("admin.completed")}</option>
            <option value="cancelled">{t("admin.cancelled")}</option>
          </select>
          <select value={paymentFilter} onChange={(e) => setPaymentFilter(e.target.value)} className="flex-1 sm:flex-none rounded-lg border border-zinc-200 px-3 py-2.5 text-sm outline-none focus:border-shqiponja dark:border-zinc-700 dark:bg-zinc-800">
            <option value="">{t("admin.allStatuses")}</option>
            <option value="unpaid">{t("admin.unpaid")}</option>
            <option value="paid">{t("admin.paid")}</option>
            <option value="refunded">{t("admin.refunded")}</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="mt-4 overflow-x-auto rounded-xl border border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-900">
        <table className="w-full text-sm">
          <thead className="border-b border-zinc-100 bg-zinc-50 text-left dark:border-zinc-700 dark:bg-zinc-800">
            <tr>
              <th className="px-4 py-3 font-semibold">#</th>
              <th className="px-4 py-3 font-semibold">{t("admin.package")}</th>
              <th className="px-4 py-3 font-semibold">{t("admin.email")}</th>
              <th className="px-4 py-3 font-semibold">{t("admin.payment")}</th>
              <th className="px-4 py-3 font-semibold">{t("admin.status")}</th>
              <th className="px-4 py-3 font-semibold">ICCID</th>
              <th className="px-4 py-3 font-semibold">{t("admin.date")}</th>
              <th className="px-4 py-3 font-semibold">{t("admin.actions")}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-700">
            {orders.map((o) => (
              <tr key={o.id} className="hover:bg-zinc-50 transition dark:hover:bg-zinc-800">
                <td className="px-4 py-3 font-mono text-xs font-medium">{o.id}</td>
                <td className="px-4 py-3"><span className="mr-1">{o.package_flag}</span><span className="font-medium">{o.package_name}</span></td>
                <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">{o.email}</td>
                <td className="px-4 py-3">{statusBadge(o.payment_status)}</td>
                <td className="px-4 py-3">{statusBadge(o.status)}</td>
                <td className="px-4 py-3 font-mono text-xs text-zinc-500">{o.iccid || "—"}</td>
                <td className="px-4 py-3 text-zinc-500 text-xs">{new Date(o.created_at).toLocaleDateString(locale === "sq" ? "sq-AL" : "en-US")}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1">
                    <button onClick={() => openDetail(o.id)} title="View" className="rounded-lg p-1.5 text-zinc-500 hover:bg-zinc-100 hover:text-shqiponja transition dark:hover:bg-zinc-700"><Eye className="h-4 w-4" /></button>
                    {o.status !== "completed" && (
                      <button onClick={() => markCompleted(o)} title="Mark completed" className="rounded-lg p-1.5 text-zinc-500 hover:bg-green-50 hover:text-green-600 transition dark:hover:bg-green-900/20"><CheckCircle className="h-4 w-4" /></button>
                    )}
                    <button onClick={() => togglePaid(o)} className="rounded-lg border border-zinc-200 px-2 py-1 text-[10px] font-medium hover:bg-zinc-50 transition dark:border-zinc-600 dark:hover:bg-zinc-700">
                      {o.payment_status === "paid" ? "Unpaid" : t("admin.markPaid")}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {orders.length === 0 && <p className="py-8 text-center text-sm text-zinc-400">{t("admin.noOrders")}</p>}
      </div>

      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-center gap-2">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-medium hover:bg-zinc-50 transition disabled:opacity-40 dark:border-zinc-600 dark:hover:bg-zinc-700"><ChevronLeft className="h-4 w-4" /></button>
          <span className="text-sm text-zinc-500">{t("admin.page")} {page} / {totalPages}</span>
          <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-medium hover:bg-zinc-50 transition disabled:opacity-40 dark:border-zinc-600 dark:hover:bg-zinc-700"><ChevronRight className="h-4 w-4" /></button>
        </div>
      )}

      {/* ═══════ ORDER DETAIL MODAL ═══════ */}
      {(detail || detailLoading) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => !detailLoading && setDetail(null)}>
          <div className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl dark:bg-zinc-900" onClick={e => e.stopPropagation()}>
            <button onClick={() => setDetail(null)} className="absolute right-4 top-4 rounded-lg p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800"><X className="h-5 w-5" /></button>
            {detailLoading ? (
              <div className="flex h-40 items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-shqiponja border-t-transparent" /></div>
            ) : detail && (
              <div>
                <h2 className="text-lg font-extrabold">Porosi #{detail.id}</h2>
                <p className="mt-1 text-sm text-zinc-500">{new Date(detail.created_at).toLocaleString(locale === "sq" ? "sq-AL" : "en-US")}</p>
                <div className="mt-5 grid grid-cols-2 gap-4">
                  <InfoField label="Email" value={detail.email} />
                  <InfoField label={t("admin.package")} value={`${detail.package_flag} ${detail.package_name}`} />
                  <InfoField label={t("admin.data")} value={detail.package_data} />
                  <InfoField label={t("admin.duration")} value={detail.package_duration} />
                  <InfoField label={t("admin.price")} value={`€${Number(detail.package_price).toFixed(2)}`} />
                  <InfoField label={t("admin.payment")} value={detail.payment_status} badge />
                  <InfoField label={t("admin.status")} value={detail.status} badge />
                </div>
                <div className="mt-5 rounded-xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-700 dark:bg-zinc-800">
                  <h3 className="text-sm font-bold">📲 eSIM Info</h3>
                  <div className="mt-3 grid grid-cols-2 gap-3">
                    <InfoField label="ICCID" value={detail.iccid || "—"} mono copyable />
                    <InfoField label="eSIM Status" value={detail.esim_status || "—"} badge />
                    <InfoField label="Airalo Order ID" value={detail.airalo_order_id || "—"} mono />
                    <InfoField label="Activation Code" value={detail.activation_code ? "✓ Available" : "—"} />
                  </div>
                  {detail.qr_code_url && (
                    <div className="mt-3">
                      <p className="text-xs font-medium text-zinc-500 mb-1">QR Code URL</p>
                      <a href={detail.qr_code_url} target="_blank" rel="noopener noreferrer" className="text-xs text-shqiponja hover:underline break-all">{detail.qr_code_url}</a>
                    </div>
                  )}
                </div>
                {detail.user_name && (
                  <div className="mt-4 rounded-xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-700 dark:bg-zinc-800">
                    <h3 className="text-sm font-bold">👤 Klienti</h3>
                    <div className="mt-2 grid grid-cols-2 gap-3">
                      <InfoField label={t("admin.name")} value={detail.user_name} />
                      <InfoField label={t("admin.email")} value={detail.user_email || "—"} />
                    </div>
                  </div>
                )}
                <div className="mt-5 flex flex-wrap gap-3">
                  {detail.status !== "completed" && (
                    <button onClick={async () => { await markCompleted(detail as Order); setDetail(prev => prev ? { ...prev, status: "completed", payment_status: "paid" } : null); }} className="flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 transition">
                      <CheckCircle className="h-4 w-4" /> Mark as Completed
                    </button>
                  )}
                  {(detail.esim_status === "awaiting_esim" || detail.esim_status === "provisioning_failed" || !detail.iccid) && (
                    <button onClick={() => setFulfillOpen(true)} className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition">
                      <Wrench className="h-4 w-4" /> Fulfill eSIM
                    </button>
                  )}
                  <button onClick={handleResendEsim} disabled={resending || (!detail.qr_data && !detail.qr_code_url)} className="flex items-center gap-2 rounded-lg bg-shqiponja px-4 py-2 text-sm font-semibold text-white hover:bg-shqiponja/90 transition disabled:opacity-50">
                    <Send className="h-4 w-4" /> {resending ? "Duke dërguar..." : "Resend eSIM"}
                  </button>
                </div>

                {/* Fulfill eSIM mini-form */}
                {fulfillOpen && (
                  <div className="mt-5 rounded-xl border border-blue-200 bg-blue-50 p-4 dark:border-blue-700 dark:bg-blue-950/30">
                    <h3 className="text-sm font-bold text-blue-800 dark:text-blue-300 mb-3">📲 Fulfill eSIM — Shto të dhënat manualisht</h3>
                    <div className="space-y-2">
                      {(["iccid", "qr_data", "qr_code_url", "activation_code"] as const).map(field => (
                        <div key={field}>
                          <label className="text-xs font-semibold text-zinc-500 uppercase">{field.replace(/_/g, " ")}</label>
                          <input
                            type="text"
                            value={fulfillForm[field]}
                            onChange={e => setFulfillForm(f => ({ ...f, [field]: e.target.value }))}
                            className="mt-0.5 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm font-mono outline-none focus:border-blue-500 dark:border-zinc-600 dark:bg-zinc-800"
                            placeholder={field === "iccid" ? "89000..." : field === "qr_code_url" ? "https://..." : ""}
                          />
                        </div>
                      ))}
                      <div className="flex gap-2 pt-1">
                        <button onClick={handleFulfillEsim} disabled={fulfilling} className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition disabled:opacity-50">
                          {fulfilling ? "Duke dërguar..." : "Konfirmo & Dërgo Email"}
                        </button>
                        <button onClick={() => setFulfillOpen(false)} className="rounded-lg border border-zinc-200 px-4 py-2 text-sm font-medium hover:bg-zinc-50 dark:border-zinc-600 dark:hover:bg-zinc-700">
                          Anulo
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function InfoField({ label, value, mono, badge, copyable }: { label: string; value: string; mono?: boolean; badge?: boolean; copyable?: boolean }) {
  const colors: Record<string, string> = {
    paid: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
    completed: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
    unpaid: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
    pending: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
    active: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
    failed: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
    provisioning_failed: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
    awaiting_esim: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  };
  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">{label}</p>
      {badge ? (
        <span className={`mt-0.5 inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${colors[value] || "bg-zinc-100 text-zinc-600"}`}>{value}</span>
      ) : (
        <div className="mt-0.5 flex items-center gap-1">
          <p className={`text-sm font-medium ${mono ? "font-mono text-xs" : ""}`}>{value}</p>
          {copyable && value !== "—" && (
            <button onClick={() => navigator.clipboard.writeText(value)} className="rounded p-0.5 text-zinc-400 hover:text-shqiponja"><Copy className="h-3 w-3" /></button>
          )}
        </div>
      )}
    </div>
  );
}
