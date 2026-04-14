"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/lib/auth-context";
import { useI18n } from "@/lib/i18n-context";
import { useToast } from "@/lib/toast-context";
import {
  adminGetReferrals,
  adminUpdateReferralStatus,
  type AdminReferral,
} from "@/lib/api";
import { ChevronLeft, ChevronRight, Users, CheckCircle, DollarSign } from "lucide-react";

export default function AdminReferralsPage() {
  const { token } = useAuth();
  const { t } = useI18n();
  const { toast } = useToast();
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
      .finally(() => setLoading(false));
  }, [token, page, statusFilter]);

  useEffect(() => { fetchReferrals(); }, [fetchReferrals]);
  useEffect(() => { setPage(1); }, [statusFilter]);

  async function updateStatus(id: number, status: string) {
    if (!token) return;
    try {
      const updated = await adminUpdateReferralStatus(token, id, status);
      setReferrals((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
      toast(t("admin.ref.updated"), "success");
      fetchReferrals(); // refresh summary
    } catch (err) {
      toast(err instanceof Error ? err.message : "Gabim", "error");
    }
  }

  const statusColor: Record<string, string> = {
    pending: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
    completed: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
    cancelled: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">{t("admin.ref.title")}</h1>
        <p className="text-sm text-zinc-500">{t("admin.ref.subtitle")}</p>
      </div>

      {/* Summary cards */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-blue-50 p-2 text-blue-600 dark:bg-blue-900/30"><Users className="h-5 w-5" /></div>
            <div>
              <p className="text-2xl font-bold">{summary.totalReferrals}</p>
              <p className="text-xs text-zinc-500">{t("admin.ref.totalReferrals")}</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-emerald-50 p-2 text-emerald-600 dark:bg-emerald-900/30"><CheckCircle className="h-5 w-5" /></div>
            <div>
              <p className="text-2xl font-bold">{summary.completed}</p>
              <p className="text-xs text-zinc-500">{t("admin.ref.completedReferrals")}</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-shqiponja/10 p-2 text-shqiponja"><DollarSign className="h-5 w-5" /></div>
            <div>
              <p className="text-2xl font-bold">€{summary.totalRewards.toFixed(2)}</p>
              <p className="text-xs text-zinc-500">{t("admin.ref.totalRewards")}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-4 flex items-center gap-3">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-lg border border-zinc-200 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800"
        >
          <option value="">{t("admin.ref.allStatuses")}</option>
          <option value="pending">Pending</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
        <span className="text-sm text-zinc-400">{total} {t("admin.ref.total")}</span>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-100 text-left text-xs font-medium uppercase tracking-wider text-zinc-400 dark:border-zinc-800">
                <th className="px-4 py-3">{t("admin.ref.referrer")}</th>
                <th className="px-4 py-3">{t("admin.ref.referred")}</th>
                <th className="px-4 py-3">{t("admin.ref.reward")}</th>
                <th className="px-4 py-3">{t("admin.ref.status")}</th>
                <th className="px-4 py-3">{t("admin.ref.date")}</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-zinc-400">...</td></tr>
              ) : referrals.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-zinc-400">{t("admin.ref.empty")}</td></tr>
              ) : referrals.map((r) => (
                <tr key={r.id} className="border-b border-zinc-50 transition hover:bg-zinc-50 dark:border-zinc-800/50 dark:hover:bg-zinc-800/30">
                  <td className="px-4 py-3">
                    <p className="font-medium">{r.referrer_name || "—"}</p>
                    <p className="text-xs text-zinc-400">{r.referrer_email}</p>
                    <p className="font-mono text-[10px] text-shqiponja">{r.referrer_code}</p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium">{r.referred_name || "—"}</p>
                    <p className="text-xs text-zinc-400">{r.referred_email}</p>
                  </td>
                  <td className="px-4 py-3 font-medium">€{r.reward_value.toFixed(2)}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${statusColor[r.status] || "bg-zinc-100 text-zinc-600"}`}>
                      {r.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-zinc-500">{new Date(r.created_at).toLocaleDateString()}</td>
                  <td className="px-4 py-3">
                    <select
                      value={r.status}
                      onChange={(e) => updateStatus(r.id, e.target.value)}
                      className="rounded border border-zinc-200 px-2 py-1 text-xs dark:border-zinc-700 dark:bg-zinc-800"
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
    </div>
  );
}
