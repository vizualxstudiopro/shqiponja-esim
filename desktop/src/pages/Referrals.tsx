import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/lib/auth-context";
import {
  adminGetReferrals,
  adminUpdateReferralStatus,
  type AdminReferral,
} from "@/lib/api";
import { ChevronLeft, ChevronRight, Users, CheckCircle, DollarSign } from "lucide-react";

export default function Referrals() {
  const { token } = useAuth();
  const [referrals, setReferrals] = useState<AdminReferral[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [statusFilter, setStatusFilter] = useState("");
  const [summary, setSummary] = useState({ totalReferrals: 0, completed: 0, totalRewards: 0 });

  const fetchReferrals = useCallback(() => {
    if (!token) return;
    setLoading(true);
    adminGetReferrals(token, page, statusFilter)
      .then((data) => {
        setReferrals(data.referrals);
        setTotalPages(data.totalPages);
        setTotal(data.total);
        setSummary(data.summary);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [token, page, statusFilter]);

  useEffect(() => { fetchReferrals(); }, [fetchReferrals]);
  useEffect(() => { setPage(1); }, [statusFilter]);

  async function updateStatus(id: number, status: string) {
    if (!token) return;
    try {
      const updated = await adminUpdateReferralStatus(token, id, status);
      setReferrals((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
      fetchReferrals();
    } catch {}
  }

  const statusColor: Record<string, string> = {
    pending: "bg-amber-900/30 text-amber-400",
    completed: "bg-emerald-900/30 text-emerald-400",
    cancelled: "bg-red-900/30 text-red-400",
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl font-bold text-zinc-100">Referimet</h1>
        <p className="text-sm text-zinc-500">Menaxho referimet dhe shpërblimet</p>
      </div>

      {/* Summary cards */}
      <div className="mb-6 grid grid-cols-3 gap-4">
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-blue-900/30 p-2 text-blue-400"><Users className="h-5 w-5" /></div>
            <div>
              <p className="text-2xl font-bold text-zinc-100">{summary.totalReferrals}</p>
              <p className="text-xs text-zinc-500">Gjithsej Referime</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-emerald-900/30 p-2 text-emerald-400"><CheckCircle className="h-5 w-5" /></div>
            <div>
              <p className="text-2xl font-bold text-zinc-100">{summary.completed}</p>
              <p className="text-xs text-zinc-500">Të Kompletuara</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-shqiponja/10 p-2 text-shqiponja"><DollarSign className="h-5 w-5" /></div>
            <div>
              <p className="text-2xl font-bold text-zinc-100">€{summary.totalRewards.toFixed(2)}</p>
              <p className="text-xs text-zinc-500">Gjithsej Shpërblimet</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-4 flex items-center gap-3">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-200 focus:border-shqiponja focus:outline-none"
        >
          <option value="">Të gjitha statuset</option>
          <option value="pending">Pending</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
        <span className="text-sm text-zinc-500">{total} gjithsej</span>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-800 text-left text-xs font-medium uppercase tracking-wider text-zinc-500">
                <th className="px-4 py-3">Referuesi</th>
                <th className="px-4 py-3">I Referuari</th>
                <th className="px-4 py-3">Shpërblimi</th>
                <th className="px-4 py-3">Statusi</th>
                <th className="px-4 py-3">Data</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-zinc-500">Duke ngarkuar...</td></tr>
              ) : referrals.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-zinc-500">Nuk ka referime</td></tr>
              ) : referrals.map((r) => (
                <tr key={r.id} className="border-b border-zinc-800/50 transition hover:bg-zinc-800/30">
                  <td className="px-4 py-3">
                    <p className="font-medium text-zinc-200">{r.referrer_name || "—"}</p>
                    <p className="text-xs text-zinc-500">{r.referrer_email}</p>
                    <p className="font-mono text-[10px] text-shqiponja">{r.referrer_code}</p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-zinc-200">{r.referred_name || "—"}</p>
                    <p className="text-xs text-zinc-500">{r.referred_email}</p>
                  </td>
                  <td className="px-4 py-3 font-medium text-zinc-200">€{r.reward_value.toFixed(2)}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${statusColor[r.status] || "bg-zinc-700 text-zinc-400"}`}>
                      {r.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-zinc-500">{new Date(r.created_at).toLocaleDateString()}</td>
                  <td className="px-4 py-3">
                    <select
                      value={r.status}
                      onChange={(e) => updateStatus(r.id, e.target.value)}
                      className="rounded border border-zinc-700 bg-zinc-800 px-2 py-1 text-xs text-zinc-200 focus:border-shqiponja focus:outline-none"
                    >
                      <option value="pending">Pending</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-zinc-800 px-4 py-3">
            <button disabled={page <= 1} onClick={() => setPage(page - 1)} className="rounded-lg p-1 text-zinc-400 transition hover:bg-zinc-800 disabled:opacity-30">
              <ChevronLeft className="h-5 w-5" />
            </button>
            <span className="text-xs text-zinc-500">{page}/{totalPages}</span>
            <button disabled={page >= totalPages} onClick={() => setPage(page + 1)} className="rounded-lg p-1 text-zinc-400 transition hover:bg-zinc-800 disabled:opacity-30">
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
