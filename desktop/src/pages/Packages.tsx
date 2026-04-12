import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/lib/auth-context";
import { adminGetPackages, type EsimPackage, type PaginatedPackages } from "@/lib/api";
import { Search, ChevronLeft, ChevronRight, Eye, EyeOff, Star } from "lucide-react";

export default function Packages() {
  const { token } = useAuth();
  const [packages, setPackages] = useState<EsimPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");

  const fetch_ = useCallback(() => {
    if (!token) return;
    setLoading(true);
    adminGetPackages(token, page, 50, search)
      .then((d: PaginatedPackages) => {
        setPackages(d.packages);
        setTotalPages(d.totalPages);
        setTotal(d.total);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [token, page, search]);

  useEffect(() => { fetch_(); }, [fetch_]);
  useEffect(() => { setPage(1); }, [search]);

  if (loading)
    return <div className="space-y-3">{[...Array(8)].map((_, i) => <div key={i} className="h-12 animate-pulse rounded-lg bg-zinc-800" />)}</div>;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-extrabold">Paketat</h1>
        <p className="text-sm text-zinc-500">{total} gjithsej</p>
      </div>

      <div className="relative max-w-xs">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
        <input type="text" placeholder="Kërko paketa..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full rounded-lg border border-zinc-700 bg-zinc-800 pl-10 pr-4 py-2 text-sm outline-none focus:border-shqiponja transition" />
      </div>

      <div className="overflow-x-auto rounded-xl border border-zinc-800 bg-zinc-900">
        <table className="w-full text-sm">
          <thead className="border-b border-zinc-800 text-left text-xs text-zinc-500">
            <tr>
              <th className="px-4 py-3 font-medium">#</th>
              <th className="px-4 py-3 font-medium">Vendi</th>
              <th className="px-4 py-3 font-medium">Emri</th>
              <th className="px-4 py-3 font-medium">Data</th>
              <th className="px-4 py-3 font-medium">Kohëzgjatja</th>
              <th className="px-4 py-3 font-medium">Çmimi</th>
              <th className="px-4 py-3 font-medium">Airalo ID</th>
              <th className="px-4 py-3 font-medium">Kategoria</th>
              <th className="px-4 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800">
            {packages.map((p) => (
              <tr key={p.id} className="text-zinc-300 hover:bg-zinc-800/50 transition">
                <td className="px-4 py-3 font-mono text-xs text-zinc-500">{p.id}</td>
                <td className="px-4 py-3 text-lg">{p.flag}</td>
                <td className="px-4 py-3 font-medium">{p.name}</td>
                <td className="px-4 py-3">{p.data}</td>
                <td className="px-4 py-3">{p.duration}</td>
                <td className="px-4 py-3 font-mono">€{p.price.toFixed(2)}</td>
                <td className="px-4 py-3 font-mono text-xs text-zinc-500">{p.airalo_package_id || "—"}</td>
                <td className="px-4 py-3">
                  {p.category ? (
                    <span className="inline-flex rounded-full bg-blue-500/10 px-2 py-0.5 text-xs font-semibold text-blue-400">{p.category}</span>
                  ) : (
                    <span className="text-zinc-600">—</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1.5">
                    {p.visible !== false ? (
                      <Eye className="h-3.5 w-3.5 text-green-400" />
                    ) : (
                      <EyeOff className="h-3.5 w-3.5 text-zinc-600" />
                    )}
                    {p.highlight && <Star className="h-3.5 w-3.5 text-amber-400 fill-amber-400" />}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {packages.length === 0 && <p className="py-8 text-center text-sm text-zinc-500">Asnjë paketë</p>}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3">
          <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="rounded-lg border border-zinc-700 p-1.5 text-zinc-400 hover:bg-zinc-800 disabled:opacity-30"><ChevronLeft className="h-4 w-4" /></button>
          <span className="text-xs text-zinc-500">{page} / {totalPages}</span>
          <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="rounded-lg border border-zinc-700 p-1.5 text-zinc-400 hover:bg-zinc-800 disabled:opacity-30"><ChevronRight className="h-4 w-4" /></button>
        </div>
      )}
    </div>
  );
}
