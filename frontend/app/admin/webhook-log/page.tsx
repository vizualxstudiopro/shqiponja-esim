"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/lib/auth-context";
import { useI18n } from "@/lib/i18n-context";
import { adminGetWebhookLogs, adminGetWebhookLogDetail, type WebhookLog, type PaginatedWebhookLogs } from "@/lib/api";
import { useToast } from "@/lib/toast-context";
import { Search, ChevronLeft, ChevronRight, Eye, X, Filter, Copy, Check } from "lucide-react";

function statusBadge(status: string) {
  switch (status) {
    case "success":  return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400";
    case "failed":   return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";
    case "received": return "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400";
    default:         return "bg-zinc-100 text-zinc-700 dark:bg-zinc-700 dark:text-zinc-300";
  }
}

export default function AdminWebhookLogPage() {
  const { token } = useAuth();
  const { t, locale } = useI18n();
  const { toast } = useToast();
  const [logs, setLogs] = useState<WebhookLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [statusFilter, setStatusFilter] = useState("");
  const [detail, setDetail] = useState<WebhookLog | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const fetchLogs = useCallback(() => {
    if (!token) return;
    setLoading(true);
    adminGetWebhookLogs(token, page, statusFilter || undefined)
      .then((data: PaginatedWebhookLogs) => {
        setLogs(data.logs);
        setTotalPages(data.totalPages);
        setTotal(data.total);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [token, page, statusFilter]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);
  useEffect(() => { setPage(1); }, [statusFilter]);

  async function openDetail(id: number) {
    if (!token) return;
    setDetailLoading(true);
    try {
      setDetail(await adminGetWebhookLogDetail(token, id));
    } catch (err) {
      toast(err instanceof Error ? err.message : "Error", "error");
    } finally {
      setDetailLoading(false);
    }
  }

  function copyPayload() {
    if (!detail?.payload) return;
    navigator.clipboard.writeText(detail.payload);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (loading) return <div className="space-y-3">{[...Array(5)].map((_, i) => <div key={i} className="h-14 animate-pulse rounded-lg bg-zinc-200 dark:bg-zinc-700" />)}</div>;

  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold">🔗 Webhook Log</h1>
          <p className="mt-1 text-sm text-zinc-500">{total} {locale === "sq" ? "regjistrime" : "entries"}</p>
        </div>
      </div>

      <div className="mt-4 flex items-center gap-3">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-zinc-400" />
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-shqiponja dark:border-zinc-700 dark:bg-zinc-800">
            <option value="">Të gjitha</option>
            <option value="success">✅ Success</option>
            <option value="failed">❌ Failed</option>
            <option value="received">⏳ Received</option>
          </select>
        </div>
      </div>

      <div className="mt-4 overflow-x-auto rounded-xl border border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-900">
        <table className="w-full text-sm">
          <thead className="border-b border-zinc-100 bg-zinc-50 text-left dark:border-zinc-700 dark:bg-zinc-800">
            <tr>
              <th className="px-4 py-3 font-semibold">#</th>
              <th className="px-4 py-3 font-semibold">Source</th>
              <th className="px-4 py-3 font-semibold">Event</th>
              <th className="px-4 py-3 font-semibold">Order ID</th>
              <th className="px-4 py-3 font-semibold">Status</th>
              <th className="px-4 py-3 font-semibold">Error</th>
              <th className="px-4 py-3 font-semibold">{t("admin.date")}</th>
              <th className="px-4 py-3 font-semibold">{t("admin.action")}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-700">
            {logs.map((log) => (
              <tr key={log.id} className="hover:bg-zinc-50 transition dark:hover:bg-zinc-800">
                <td className="px-4 py-3 font-mono text-xs">{log.id}</td>
                <td className="px-4 py-3 font-medium text-xs">{log.source}</td>
                <td className="px-4 py-3 font-mono text-xs">{log.event_type}</td>
                <td className="px-4 py-3 font-mono text-xs">{log.order_id || "—"}</td>
                <td className="px-4 py-3">
                  <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${statusBadge(log.status)}`}>{log.status}</span>
                </td>
                <td className="px-4 py-3 max-w-[200px] truncate text-xs text-red-600 dark:text-red-400">{log.error || "—"}</td>
                <td className="px-4 py-3 text-zinc-500 text-xs">{new Date(log.created_at).toLocaleString(locale === "sq" ? "sq-AL" : "en-US")}</td>
                <td className="px-4 py-3">
                  <button onClick={() => openDetail(log.id)} className="rounded-lg p-1.5 text-zinc-500 hover:bg-zinc-100 hover:text-shqiponja transition dark:hover:bg-zinc-700"><Eye className="h-4 w-4" /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {logs.length === 0 && <p className="py-8 text-center text-sm text-zinc-400">Asnjë webhook log</p>}
      </div>

      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-center gap-2">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-medium hover:bg-zinc-50 transition disabled:opacity-40 dark:border-zinc-600 dark:hover:bg-zinc-700"><ChevronLeft className="h-4 w-4" /></button>
          <span className="text-sm text-zinc-500">{t("admin.page")} {page} / {totalPages}</span>
          <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-medium hover:bg-zinc-50 transition disabled:opacity-40 dark:border-zinc-600 dark:hover:bg-zinc-700"><ChevronRight className="h-4 w-4" /></button>
        </div>
      )}

      {/* WEBHOOK DETAIL MODAL */}
      {(detail || detailLoading) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => !detailLoading && setDetail(null)}>
          <div className="relative max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl dark:bg-zinc-900" onClick={e => e.stopPropagation()}>
            <button onClick={() => setDetail(null)} className="absolute right-4 top-4 rounded-lg p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800"><X className="h-5 w-5" /></button>
            {detailLoading ? (
              <div className="flex h-40 items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-shqiponja border-t-transparent" /></div>
            ) : detail && (
              <div>
                <h2 className="text-lg font-extrabold">🔗 Webhook #{detail.id}</h2>
                <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                  <div><span className="text-zinc-500">Source:</span> <span className="font-medium">{detail.source}</span></div>
                  <div><span className="text-zinc-500">Event:</span> <span className="font-mono text-xs">{detail.event_type}</span></div>
                  <div><span className="text-zinc-500">Order ID:</span> <span className="font-mono">{detail.order_id || "—"}</span></div>
                  <div><span className="text-zinc-500">Status:</span> <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${statusBadge(detail.status)}`}>{detail.status}</span></div>
                  <div className="col-span-2"><span className="text-zinc-500">Date:</span> <span>{new Date(detail.created_at).toLocaleString(locale === "sq" ? "sq-AL" : "en-US")}</span></div>
                  {detail.error && <div className="col-span-2"><span className="text-zinc-500">Error:</span> <span className="text-red-600 dark:text-red-400">{detail.error}</span></div>}
                </div>

                <div className="mt-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold">Payload</h3>
                    <button onClick={copyPayload} className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs text-zinc-500 hover:bg-zinc-100 transition dark:hover:bg-zinc-800">
                      {copied ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
                      {copied ? "Kopjuar!" : "Kopjo"}
                    </button>
                  </div>
                  <pre className="mt-2 max-h-96 overflow-auto rounded-lg bg-zinc-100 p-4 text-xs font-mono leading-relaxed dark:bg-zinc-800">{(() => { try { return JSON.stringify(JSON.parse(detail.payload || ""), null, 2); } catch { return detail.payload || "—"; } })()}</pre>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
