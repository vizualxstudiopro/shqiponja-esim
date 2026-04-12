import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/lib/auth-context";
import {
  adminGetOrders,
  adminGetOrderDetail,
  adminUpdateOrderStatus,
  adminResendEsim,
  type Order,
  type OrderDetail,
  type PaginatedOrders,
} from "@/lib/api";
import StatusBadge from "@/components/StatusBadge";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  Eye,
  X,
  CheckCircle,
  Send,
  Copy,
  Check,
  Loader2,
} from "lucide-react";

export default function Orders() {
  const { token } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [detail, setDetail] = useState<OrderDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState("");
  const [copied, setCopied] = useState("");

  const fetchOrders = useCallback(() => {
    if (!token) return;
    setLoading(true);
    adminGetOrders(token, page, search ? { q: search } : undefined)
      .then((d: PaginatedOrders) => {
        setOrders(d.orders);
        setTotalPages(d.totalPages);
        setTotal(d.total);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [token, page, search]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);
  useEffect(() => { setPage(1); }, [search]);

  async function openDetail(id: number) {
    if (!token) return;
    setDetailLoading(true);
    try { setDetail(await adminGetOrderDetail(token, id)); } catch {}
    setDetailLoading(false);
  }

  async function markCompleted(id: number) {
    if (!token) return;
    setActionLoading("complete-" + id);
    try {
      await adminUpdateOrderStatus(token, id, { status: "completed" });
      fetchOrders();
      if (detail?.id === id) setDetail({ ...detail, status: "completed" });
    } catch {}
    setActionLoading("");
  }

  async function resendEsim(id: number) {
    if (!token) return;
    setActionLoading("resend-" + id);
    try { await adminResendEsim(token, id); } catch {}
    setActionLoading("");
  }

  function copyText(text: string, key: string) {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(""), 2000);
  }

  if (loading)
    return <div className="space-y-3">{[...Array(8)].map((_, i) => <div key={i} className="h-12 animate-pulse rounded-lg bg-zinc-800" />)}</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-extrabold">Porositë</h1>
          <p className="text-sm text-zinc-500">{total} gjithsej</p>
        </div>
      </div>

      <div className="relative max-w-xs">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
        <input
          type="text"
          placeholder="Kërko me email, emër pakete..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-lg border border-zinc-700 bg-zinc-800 pl-10 pr-4 py-2 text-sm outline-none focus:border-shqiponja transition"
        />
      </div>

      <div className="overflow-x-auto rounded-xl border border-zinc-800 bg-zinc-900">
        <table className="w-full text-sm">
          <thead className="border-b border-zinc-800 text-left text-xs text-zinc-500">
            <tr>
              <th className="px-4 py-3 font-medium">#</th>
              <th className="px-4 py-3 font-medium">Paketa</th>
              <th className="px-4 py-3 font-medium">Email</th>
              <th className="px-4 py-3 font-medium">Pagesa</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">ICCID</th>
              <th className="px-4 py-3 font-medium">Data</th>
              <th className="px-4 py-3 font-medium">Veprime</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800">
            {orders.map((o) => (
              <tr key={o.id} className="text-zinc-300 hover:bg-zinc-800/50 transition">
                <td className="px-4 py-3 font-mono text-xs text-zinc-500">{o.id}</td>
                <td className="px-4 py-3">{o.package_flag} {o.package_name}</td>
                <td className="px-4 py-3 text-zinc-400">{o.email}</td>
                <td className="px-4 py-3"><StatusBadge status={o.payment_status} /></td>
                <td className="px-4 py-3"><StatusBadge status={o.status} /></td>
                <td className="px-4 py-3 font-mono text-xs text-zinc-500">{o.iccid || "—"}</td>
                <td className="px-4 py-3 text-xs text-zinc-500">{new Date(o.created_at).toLocaleDateString("sq-AL")}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1">
                    <button onClick={() => openDetail(o.id)} title="Shiko" className="rounded-lg p-1.5 text-zinc-500 hover:bg-zinc-700 hover:text-blue-400 transition"><Eye className="h-4 w-4" /></button>
                    {o.status !== "completed" && (
                      <button onClick={() => markCompleted(o.id)} title="Shëno si kompletuar" disabled={actionLoading === "complete-" + o.id} className="rounded-lg p-1.5 text-zinc-500 hover:bg-zinc-700 hover:text-green-400 transition disabled:opacity-40">
                        {actionLoading === "complete-" + o.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
                      </button>
                    )}
                    {o.iccid && (
                      <button onClick={() => resendEsim(o.id)} title="Ridërgo eSIM" disabled={actionLoading === "resend-" + o.id} className="rounded-lg p-1.5 text-zinc-500 hover:bg-zinc-700 hover:text-shqiponja transition disabled:opacity-40">
                        {actionLoading === "resend-" + o.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {orders.length === 0 && <p className="py-8 text-center text-sm text-zinc-500">Asnjë porosi</p>}
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
          <div className="relative max-h-[85vh] w-full max-w-xl overflow-y-auto rounded-2xl border border-zinc-800 bg-zinc-900 p-6" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setDetail(null)} className="absolute right-4 top-4 rounded-lg p-1 text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300"><X className="h-5 w-5" /></button>
            {detailLoading ? (
              <div className="flex h-40 items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-shqiponja" /></div>
            ) : detail && (
              <div className="space-y-4">
                <h2 className="text-lg font-extrabold">Porosi #{detail.id}</h2>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div><span className="text-zinc-500">Email:</span> <span className="text-zinc-200">{detail.email}</span></div>
                  <div><span className="text-zinc-500">Paketa:</span> <span className="text-zinc-200">{detail.package_flag} {detail.package_name}</span></div>
                  <div><span className="text-zinc-500">Pagesa:</span> <StatusBadge status={detail.payment_status} /></div>
                  <div><span className="text-zinc-500">Status:</span> <StatusBadge status={detail.status} /></div>
                  {detail.package_price && <div><span className="text-zinc-500">Çmimi:</span> <span className="text-zinc-200">€{detail.package_price}</span></div>}
                  {detail.package_data && <div><span className="text-zinc-500">Data:</span> <span className="text-zinc-200">{detail.package_data}</span></div>}
                  {detail.package_duration && <div><span className="text-zinc-500">Kohëzgjatja:</span> <span className="text-zinc-200">{detail.package_duration}</span></div>}
                </div>

                {/* eSIM Info */}
                {detail.iccid && (
                  <div className="rounded-lg border border-zinc-800 bg-zinc-800/50 p-4">
                    <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-zinc-400">eSIM Info</h3>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="col-span-2 flex items-center gap-2">
                        <span className="text-zinc-500">ICCID:</span>
                        <span className="font-mono text-xs text-zinc-200">{detail.iccid}</span>
                        <button onClick={() => copyText(detail.iccid!, "iccid")} className="text-zinc-500 hover:text-zinc-300">
                          {copied === "iccid" ? <Check className="h-3 w-3 text-green-400" /> : <Copy className="h-3 w-3" />}
                        </button>
                      </div>
                      {detail.esim_status && <div><span className="text-zinc-500">eSIM Status:</span> <StatusBadge status={detail.esim_status} /></div>}
                      {detail.airalo_order_id && <div><span className="text-zinc-500">Airalo Order:</span> <span className="font-mono text-xs text-zinc-300">{detail.airalo_order_id}</span></div>}
                      {detail.qr_code_url && <div className="col-span-2"><span className="text-zinc-500">QR:</span> <a href={detail.qr_code_url} className="text-xs text-shqiponja hover:underline" target="_blank" rel="noopener noreferrer">Shiko QR kodin</a></div>}
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2 pt-2">
                  {detail.status !== "completed" && (
                    <button onClick={() => markCompleted(detail.id)} disabled={!!actionLoading} className="flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-xs font-bold text-white hover:bg-green-700 disabled:opacity-40 transition">
                      <CheckCircle className="h-3.5 w-3.5" /> Shëno Kompletuar
                    </button>
                  )}
                  {detail.iccid && (
                    <button onClick={() => resendEsim(detail.id)} disabled={!!actionLoading} className="flex items-center gap-2 rounded-lg bg-shqiponja px-4 py-2 text-xs font-bold text-white hover:bg-shqiponja-dark disabled:opacity-40 transition">
                      <Send className="h-3.5 w-3.5" /> Ridërgo eSIM
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
