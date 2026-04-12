import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/lib/auth-context";
import {
  adminGetCustomers,
  adminGetCustomerDetail,
  type Customer,
  type CustomerDetail,
  type PaginatedCustomers,
} from "@/lib/api";
import StatusBadge from "@/components/StatusBadge";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  Eye,
  X,
  ShoppingCart,
  Euro,
  Loader2,
} from "lucide-react";

export default function Customers() {
  const { token } = useAuth();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [detail, setDetail] = useState<CustomerDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const fetch_ = useCallback(() => {
    if (!token) return;
    setLoading(true);
    adminGetCustomers(token, page, search)
      .then((d: PaginatedCustomers) => {
        setCustomers(d.customers);
        setTotalPages(d.totalPages);
        setTotal(d.total);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [token, page, search]);

  useEffect(() => { fetch_(); }, [fetch_]);
  useEffect(() => { setPage(1); }, [search]);

  async function openDetail(id: number) {
    if (!token) return;
    setDetailLoading(true);
    try { setDetail(await adminGetCustomerDetail(token, id)); } catch {}
    setDetailLoading(false);
  }

  if (loading)
    return <div className="space-y-3">{[...Array(6)].map((_, i) => <div key={i} className="h-12 animate-pulse rounded-lg bg-zinc-800" />)}</div>;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-extrabold">Klientët</h1>
        <p className="text-sm text-zinc-500">{total} gjithsej</p>
      </div>

      <div className="relative max-w-xs">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
        <input type="text" placeholder="Kërko me emër ose email..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full rounded-lg border border-zinc-700 bg-zinc-800 pl-10 pr-4 py-2 text-sm outline-none focus:border-shqiponja transition" />
      </div>

      <div className="overflow-x-auto rounded-xl border border-zinc-800 bg-zinc-900">
        <table className="w-full text-sm">
          <thead className="border-b border-zinc-800 text-left text-xs text-zinc-500">
            <tr>
              <th className="px-4 py-3 font-medium">#</th>
              <th className="px-4 py-3 font-medium">Emri</th>
              <th className="px-4 py-3 font-medium">Email</th>
              <th className="px-4 py-3 font-medium">Porosi</th>
              <th className="px-4 py-3 font-medium">Shpenzuar</th>
              <th className="px-4 py-3 font-medium">Regjistruar</th>
              <th className="px-4 py-3 font-medium">Veprime</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800">
            {customers.map((c) => (
              <tr key={c.id} className="text-zinc-300 hover:bg-zinc-800/50 transition">
                <td className="px-4 py-3 font-mono text-xs text-zinc-500">{c.id}</td>
                <td className="px-4 py-3 font-medium">{c.name}</td>
                <td className="px-4 py-3 text-zinc-400">{c.email}</td>
                <td className="px-4 py-3">
                  <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/10 px-2 py-0.5 text-xs font-semibold text-blue-400">
                    <ShoppingCart className="h-3 w-3" /> {c.order_count}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className="inline-flex items-center gap-1 text-sm font-medium">
                    <Euro className="h-3 w-3 text-zinc-500" /> {(c.total_spent ?? 0).toFixed(2)}
                  </span>
                </td>
                <td className="px-4 py-3 text-xs text-zinc-500">{new Date(c.created_at).toLocaleDateString("sq-AL")}</td>
                <td className="px-4 py-3">
                  <button onClick={() => openDetail(c.id)} className="rounded-lg p-1.5 text-zinc-500 hover:bg-zinc-700 hover:text-blue-400 transition"><Eye className="h-4 w-4" /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {customers.length === 0 && <p className="py-8 text-center text-sm text-zinc-500">Asnjë klient ende</p>}
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
                <div>
                  <h2 className="text-lg font-extrabold">{detail.name}</h2>
                  <p className="text-sm text-zinc-400">{detail.email}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/10 px-3 py-1 text-xs font-semibold text-blue-400">
                    <ShoppingCart className="h-3 w-3" /> {detail.orders.length} porosi
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-green-500/10 px-3 py-1 text-xs font-semibold text-green-400">
                    <Euro className="h-3 w-3" /> {(detail.total_spent ?? 0).toFixed(2)} shpenzuar
                  </span>
                  <span className="text-xs text-zinc-500">Regjistruar: {new Date(detail.created_at).toLocaleDateString("sq-AL")}</span>
                </div>

                <h3 className="text-sm font-bold">Historiku i Porosive</h3>
                {detail.orders.length === 0 && <p className="text-sm text-zinc-500">Asnjë porosi</p>}
                <div className="space-y-2">
                  {detail.orders.map((o) => (
                    <div key={o.id} className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-800/50 p-3">
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-xs text-zinc-500">#{o.id}</span>
                        <span className="text-sm">{o.package_flag} {o.package_name}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <StatusBadge status={o.payment_status} />
                        <span className="text-xs text-zinc-500">{new Date(o.created_at).toLocaleDateString("sq-AL")}</span>
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
