"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { adminGetWebhookLog, adminGetWebhookLogs, adminResendEsim, type AdminWebhookLog } from "@/lib/api";
import { useToast } from "@/lib/toast-context";
import { ChevronLeft, ChevronRight, Eye, Webhook, AlertTriangle, CheckCircle2, Clock3, Send } from "lucide-react";

export default function AdminWebhookLogsPage() {
  const { token } = useAuth();
  const { toast } = useToast();
  const [logs, setLogs] = useState<AdminWebhookLog[]>([]);
  const [selectedLog, setSelectedLog] = useState<AdminWebhookLog | null>(null);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [resendingOrderId, setResendingOrderId] = useState<number | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [statusFilter, setStatusFilter] = useState("");
  const [error, setError] = useState("");

  const loadLogs = useCallback(() => {
    if (!token) return;
    setLoading(true);
    setError("");
    adminGetWebhookLogs(token, page, statusFilter)
      .then((data) => {
        setLogs(data.logs);
        setTotal(data.total);
        setTotalPages(data.totalPages);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Gabim gjatë marrjes së log-eve"))
      .finally(() => setLoading(false));
  }, [token, page, statusFilter]);

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  useEffect(() => {
    setPage(1);
  }, [statusFilter]);

  async function openLog(logId: number) {
    if (!token) return;
    setDetailLoading(true);
    try {
      const log = await adminGetWebhookLog(token, logId);
      setSelectedLog(log);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gabim gjatë hapjes së log-ut");
    } finally {
      setDetailLoading(false);
    }
  }

  async function handleResendEsim(orderId: number) {
    if (!token) return;
    setResendingOrderId(orderId);
    try {
      await adminResendEsim(token, orderId);
      toast("eSIM email u ridërgua me sukses!", "success");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Ridërgimi dështoi";
      setError(message);
      toast(message, "error");
    } finally {
      setResendingOrderId(null);
    }
  }

  const statusStyles: Record<string, string> = {
    success: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
    failed: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
    received: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  };

  return (
    <div>
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Stripe Webhook Logs</h1>
          <p className="text-sm text-zinc-500">Shfaq event-et e webhook-ut Stripe dhe statusin e përpunimit të tyre.</p>
        </div>
        <div className="rounded-xl border border-zinc-200 bg-white px-4 py-3 text-right dark:border-zinc-800 dark:bg-zinc-900">
          <p className="text-xs uppercase tracking-wide text-zinc-400">Totali</p>
          <p className="text-2xl font-bold">{total}</p>
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-900/10 dark:text-red-300">
          {error}
        </div>
      )}

      <div className="mb-4 flex items-center gap-3">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-lg border border-zinc-200 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800"
        >
          <option value="">Të gjitha statuset</option>
          <option value="received">Received</option>
          <option value="success">Success</option>
          <option value="failed">Failed</option>
        </select>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.45fr)_minmax(340px,0.9fr)]">
        <div className="rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-100 text-left text-xs font-medium uppercase tracking-wider text-zinc-400 dark:border-zinc-800">
                  <th className="px-4 py-3">Event</th>
                  <th className="px-4 py-3">Order</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Koha</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={5} className="px-4 py-8 text-center text-zinc-400">Duke ngarkuar...</td></tr>
                ) : logs.length === 0 ? (
                  <tr><td colSpan={5} className="px-4 py-8 text-center text-zinc-400">Nuk ka log-e për këtë filtër.</td></tr>
                ) : logs.map((log) => (
                  <tr key={log.id} className="border-b border-zinc-50 dark:border-zinc-800/50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Webhook className="h-4 w-4 text-shqiponja" />
                        <div>
                          <p className="font-medium">{log.event_type || "—"}</p>
                          <p className="text-xs text-zinc-400">#{log.id} • {log.source}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-zinc-600 dark:text-zinc-300">{log.order_id || "—"}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${statusStyles[log.status] || "bg-zinc-100 text-zinc-700"}`}>
                        {log.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-zinc-500">{new Date(log.created_at).toLocaleString()}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-2">
                        {log.order_id ? (
                          <button
                            onClick={() => handleResendEsim(log.order_id as number)}
                            disabled={resendingOrderId === log.order_id}
                            className="inline-flex items-center gap-1 rounded-lg border border-shqiponja/20 bg-shqiponja/10 px-3 py-1.5 text-xs font-medium text-shqiponja hover:bg-shqiponja/20 disabled:opacity-50"
                          >
                            <Send className="h-3.5 w-3.5" />
                            {resendingOrderId === log.order_id ? "Duke dërguar..." : "Retry eSIM"}
                          </button>
                        ) : null}
                        <button
                          onClick={() => openLog(log.id)}
                          className="inline-flex items-center gap-1 rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-medium hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          Hap
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-zinc-100 px-4 py-3 dark:border-zinc-800">
              <button disabled={page <= 1} onClick={() => setPage(page - 1)} className="rounded-lg p-1 transition hover:bg-zinc-100 disabled:opacity-30 dark:hover:bg-zinc-800">
                <ChevronLeft className="h-5 w-5" />
              </button>
              <span className="text-xs text-zinc-500">{page}/{totalPages}</span>
              <button disabled={page >= totalPages} onClick={() => setPage(page + 1)} className="rounded-lg p-1 transition hover:bg-zinc-100 disabled:opacity-30 dark:hover:bg-zinc-800">
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          )}
        </div>

        <div className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="mb-4 flex items-center gap-2 text-sm font-bold">
            <Eye className="h-4 w-4 text-shqiponja" />
            Detajet e log-ut
          </div>

          {detailLoading ? (
            <p className="text-sm text-zinc-400">Duke hapur log-un...</p>
          ) : !selectedLog ? (
            <p className="text-sm text-zinc-400">Zgjidh një rresht për të parë payload-in dhe gabimet.</p>
          ) : (
            <div className="space-y-4 text-sm">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-lg bg-zinc-50 p-3 dark:bg-zinc-800">
                  <p className="mb-1 text-xs uppercase tracking-wide text-zinc-400">Status</p>
                  <div className="flex items-center gap-2 font-medium">
                    {selectedLog.status === "success" ? <CheckCircle2 className="h-4 w-4 text-emerald-500" /> : selectedLog.status === "failed" ? <AlertTriangle className="h-4 w-4 text-red-500" /> : <Clock3 className="h-4 w-4 text-amber-500" />}
                    {selectedLog.status}
                  </div>
                </div>
                <div className="rounded-lg bg-zinc-50 p-3 dark:bg-zinc-800">
                  <p className="mb-1 text-xs uppercase tracking-wide text-zinc-400">External Event ID</p>
                  <p className="break-all font-mono text-xs">{selectedLog.external_event_id || "—"}</p>
                </div>
              </div>

              <div className="rounded-lg bg-zinc-50 p-3 dark:bg-zinc-800">
                <p className="mb-1 text-xs uppercase tracking-wide text-zinc-400">Error</p>
                <p className="whitespace-pre-wrap break-words text-sm">{selectedLog.error || "—"}</p>
              </div>

              {selectedLog.order_id ? (
                <button
                  onClick={() => handleResendEsim(selectedLog.order_id as number)}
                  disabled={resendingOrderId === selectedLog.order_id}
                  className="inline-flex items-center gap-2 rounded-lg bg-shqiponja px-4 py-2 text-sm font-semibold text-white hover:bg-shqiponja/90 disabled:opacity-50"
                >
                  <Send className="h-4 w-4" />
                  {resendingOrderId === selectedLog.order_id ? "Duke dërguar..." : "Retry resend eSIM email"}
                </button>
              ) : null}

              <div className="rounded-lg bg-zinc-950 p-3 text-zinc-100">
                <p className="mb-2 text-xs uppercase tracking-wide text-zinc-400">Payload</p>
                <pre className="max-h-[480px] overflow-auto whitespace-pre-wrap break-words text-xs">{selectedLog.payload || selectedLog.payload_preview || "—"}</pre>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}