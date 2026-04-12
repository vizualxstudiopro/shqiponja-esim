import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/lib/auth-context";
import {
  adminGetWebhookLogs,
  adminGetWebhookLogDetail,
  type WebhookLog,
  type PaginatedWebhookLogs,
} from "@/lib/api";
import StatusBadge from "@/components/StatusBadge";
import {
  ChevronLeft,
  ChevronRight,
  Eye,
  X,
  Filter,
  Copy,
  Check,
  Loader2,
} from "lucide-react";

export default function WebhookLogs() {
  const { token } = useAuth();
  const [logs, setLogs] = useState<WebhookLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [statusFilter, setStatusFilter] = useState("");
  const [detail, setDetail] = useState<WebhookLog | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const fetch_ = useCallback(() => {
    if (!token) return;
    setLoading(true);
    adminGetWebhookLogs(token, page, statusFilter)
      .then((d: PaginatedWebhookLogs) => {
        setLogs(d.logs);
        setTotalPages(d.totalPages);
        setTotal(d.total);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [token, page, statusFilter]);

  useEffect(() => { fetch_(); }, [fetch_]);
  useEffect(() => { setPage(1); }, [statusFilter]);

  async function openDetail(id: number) {
    if (!token) return;
    setDetailLoading(true);
    try { setDetail(await adminGetWebhookLogDetail(token, id)); } catch {}
    setDetailLoading(false);
  }

  function copyPayload() {
    if (!detail?.payload) return;
    navigator.clipboard.writeText(detail.payload);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (loading)
    return <div className="space-y-3">{[...Array(6)].map((_, i) => <div key={i} className="h-12 animate-pulse rounded-lg bg-zinc-800" />)}</div>;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-extrabold">Webhook Log</h1>
        <p className="text-sm text-zinc-500">{total} regjistrime</p>
      </div>

      <div className="flex items-center gap-2">
        <Filter className="h-4 w-4 text-zinc-500" />
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm outline-none focus:border-shqiponja transition">
          <option value="">Të gjitha</option>
          <option value="success">✅ Success</option>
          <option value="failed">❌ Failed</option>
          <option value="received">⏳ Received</option>
        </select>
      </div>

      <div className="overflow-x-auto rounded-xl border border-zinc-800 bg-zinc-900">
        <table className="w-full text-sm">
          <thead className="border-b border-zinc-800 text-left text-xs text-zinc-500">
            <tr>
              <th className="px-4 py-3 font-medium">#</th>
              <th className="px-4 py-3 font-medium">Source</th>
              <th className="px-4 py-3 font-medium">Event</th>
              <th className="px-4 py-3 font-medium">Order ID</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Error</th>
              <th className="px-4 py-3 font-medium">Data</th>
              <th className="px-4 py-3 font-medium">Veprime</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800">
            {logs.map((log) => (
              <tr key={log.id} className="text-zinc-300 hover:bg-zinc-800/50 transition">
                <td className="px-4 py-3 font-mono text-xs text-zinc-500">{log.id}</td>
                <td className="px-4 py-3 text-xs font-medium">{log.source}</td>
                <td className="px-4 py-3 font-mono text-xs">{log.event_type}</td>
                <td className="px-4 py-3 font-mono text-xs">{log.order_id || "—"}</td>
                <td className="px-4 py-3"><StatusBadge status={log.status} /></td>
                <td className="px-4 py-3 max-w-[200px] truncate text-xs text-red-400">{log.error || "—"}</td>
                <td className="px-4 py-3 text-xs text-zinc-500">{new Date(log.created_at).toLocaleString("sq-AL")}</td>
                <td className="px-4 py-3">
                  <button onClick={() => openDetail(log.id)} className="rounded-lg p-1.5 text-zinc-500 hover:bg-zinc-700 hover:text-blue-400 transition"><Eye className="h-4 w-4" /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {logs.length === 0 && <p className="py-8 text-center text-sm text-zinc-500">Asnjë webhook log</p>}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3">
          <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="rounded-lg border border-zinc-700 p-1.5 text-zinc-400 hover:bg-zinc-800 disabled:opacity-30"><ChevronLeft className="h-4 w-4" /></button>
          <span className="text-xs text-zinc-500">{page} / {totalPages}</span>
          <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="rounded-lg border border-zinc-700 p-1.5 text-zinc-400 hover:bg-zinc-800 disabled:opacity-30"><ChevronRight className="h-4 w-4" /></button>
        </div>
      )}

      {/* Detail Modal */}
      {(detail || detailLoading) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => !detailLoading && setDetail(null)}>
          <div className="relative max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-zinc-800 bg-zinc-900 p-6" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setDetail(null)} className="absolute right-4 top-4 rounded-lg p-1 text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300"><X className="h-5 w-5" /></button>
            {detailLoading ? (
              <div className="flex h-40 items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-shqiponja" /></div>
            ) : detail && (
              <div className="space-y-4">
                <h2 className="text-lg font-extrabold">Webhook #{detail.id}</h2>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div><span className="text-zinc-500">Source:</span> <span className="text-zinc-200">{detail.source}</span></div>
                  <div><span className="text-zinc-500">Event:</span> <span className="font-mono text-xs text-zinc-200">{detail.event_type}</span></div>
                  <div><span className="text-zinc-500">Order ID:</span> <span className="font-mono text-zinc-200">{detail.order_id || "—"}</span></div>
                  <div><span className="text-zinc-500">Status:</span> <StatusBadge status={detail.status} /></div>
                  <div className="col-span-2"><span className="text-zinc-500">Data:</span> <span className="text-zinc-200">{new Date(detail.created_at).toLocaleString("sq-AL")}</span></div>
                  {detail.error && <div className="col-span-2"><span className="text-zinc-500">Error:</span> <span className="text-red-400">{detail.error}</span></div>}
                </div>

                <div>
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold">Payload</h3>
                    <button onClick={copyPayload} className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs text-zinc-500 hover:bg-zinc-800 transition">
                      {copied ? <Check className="h-3 w-3 text-green-400" /> : <Copy className="h-3 w-3" />}
                      {copied ? "Kopjuar!" : "Kopjo"}
                    </button>
                  </div>
                  <pre className="mt-2 max-h-80 overflow-auto rounded-lg bg-zinc-800 p-4 text-xs font-mono leading-relaxed text-zinc-300">
                    {(() => { try { return JSON.stringify(JSON.parse(detail.payload || ""), null, 2); } catch { return detail.payload || "—"; } })()}
                  </pre>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
