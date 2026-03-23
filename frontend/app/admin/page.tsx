"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { useI18n } from "@/lib/i18n-context";
import { adminGetStats } from "@/lib/api";

interface Stats {
  totalOrders: number;
  paidOrders: number;
  totalRevenue: number;
  totalUsers: number;
  totalPackages: number;
  monthlyRevenue: { month: string; revenue: number; orders: number }[];
  monthlyUsers: { month: string; users: number }[];
}

function BarChart({ data, valueKey, label, color, noDataLabel }: { data: { month: string; [k: string]: unknown }[]; valueKey: string; label: string; color: string; noDataLabel: string }) {
  if (!data.length) return <p className="text-sm text-zinc-400">{noDataLabel}</p>;
  const max = Math.max(...data.map((d) => Number(d[valueKey]) || 0), 1);
  return (
    <div>
      <h3 className="text-sm font-bold">{label}</h3>
      <div className="mt-3 flex items-end gap-2" style={{ height: 140 }}>
        {data.map((d) => {
          const val = Number(d[valueKey]) || 0;
          const pct = Math.max((val / max) * 100, 4);
          return (
            <div key={d.month} className="flex flex-1 flex-col items-center gap-1">
              <span className="text-[10px] font-semibold">{valueKey === "revenue" ? `€${val.toFixed(0)}` : val}</span>
              <div className={`w-full rounded-t ${color}`} style={{ height: `${pct}%` }} />
              <span className="text-[10px] text-zinc-400">{d.month.slice(5)}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const { token } = useAuth();
  const { t } = useI18n();
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    if (token) adminGetStats(token).then(setStats).catch(() => {});
  }, [token]);

  if (!stats) {
    return <div className="animate-pulse space-y-4">{[...Array(4)].map((_, i) => <div key={i} className="h-24 rounded-xl bg-zinc-200" />)}</div>;
  }

  const cards = [
    { label: t("admin.totalOrders"), value: stats.totalOrders, color: "bg-blue-50 text-blue-700" },
    { label: t("admin.paidOrders"), value: stats.paidOrders, color: "bg-green-50 text-green-700" },
    { label: t("admin.revenue"), value: `€${stats.totalRevenue.toFixed(2)}`, color: "bg-shqiponja/10 text-shqiponja" },
    { label: t("admin.usersCount"), value: stats.totalUsers, color: "bg-purple-50 text-purple-700" },
    { label: t("admin.packagesCount"), value: stats.totalPackages, color: "bg-amber-50 text-amber-700" },
  ];

  return (
    <div>
      <h1 className="text-2xl font-extrabold">{t("admin.dashboard")}</h1>
      <p className="mt-1 text-sm text-zinc-500">{t("admin.summary")}</p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {cards.map((c) => (
          <div key={c.label} className={`rounded-xl border border-zinc-200 p-5 dark:border-zinc-700 ${c.color}`}>
            <p className="text-xs font-semibold uppercase tracking-wider opacity-70">{c.label}</p>
            <p className="mt-2 text-2xl font-extrabold">{c.value}</p>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        <div className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-700 dark:bg-zinc-900">
          <BarChart data={stats.monthlyRevenue} valueKey="revenue" label={t("admin.monthlyRevenue")} color="bg-shqiponja" noDataLabel={t("admin.noData")} />
        </div>
        <div className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-700 dark:bg-zinc-900">
          <BarChart data={stats.monthlyRevenue} valueKey="orders" label={t("admin.monthlyOrders")} color="bg-blue-500" noDataLabel={t("admin.noData")} />
        </div>
        <div className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-700 dark:bg-zinc-900">
          <BarChart data={stats.monthlyUsers} valueKey="users" label={t("admin.monthlyUsers")} color="bg-purple-500" noDataLabel={t("admin.noData")} />
        </div>
      </div>
    </div>
  );
}
