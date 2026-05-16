"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { useI18n } from "@/lib/i18n-context";
import { adminGetCronStatus, adminGetStats, adminGetTwilioBalance, type AdminCronStatus, type TwilioBalance } from "@/lib/api";
import { ShoppingCart, CreditCard, Euro, Users, Package, RefreshCw, MessageSquare, type LucideIcon } from "lucide-react";

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

function timeAgo(isoDate: string): string {
  const diff = Date.now() - new Date(isoDate).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "tani";
  if (mins < 60) return `${mins} min më parë`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} orë më parë`;
  return `${Math.floor(hrs / 24)} ditë më parë`;
}

function timeUntil(timestamp: number): string {
  const diff = timestamp - Date.now();
  if (diff <= 0) return "tani";
  const mins = Math.ceil(diff / 60_000);
  if (mins < 60) return `pas ${mins} min`;
  const hrs = Math.floor(mins / 60);
  const remMins = mins % 60;
  if (!remMins) return `pas ${hrs} orë`;
  return `pas ${hrs} orë ${remMins} min`;
}

export default function AdminDashboard() {
  const { token } = useAuth();
  const { t } = useI18n();
  const [stats, setStats] = useState<Stats | null>(null);
  const [cronStatus, setCronStatus] = useState<AdminCronStatus | null>(null);
  const [twilioBalance, setTwilioBalance] = useState<TwilioBalance | null>(null);
  const [twilioBalanceError, setTwilioBalanceError] = useState(false);

  useEffect(() => {
    if (!token) return;
    adminGetStats(token).then(setStats).catch(() => {});
    adminGetCronStatus(token).then(setCronStatus).catch(() => {});
    adminGetTwilioBalance(token).then(setTwilioBalance).catch(() => setTwilioBalanceError(true));
  }, [token]);

  if (!stats) {
    return <div className="animate-pulse space-y-4">{[...Array(4)].map((_, i) => <div key={i} className="h-24 rounded-xl bg-zinc-200" />)}</div>;
  }

  const cards: { label: string; value: string | number; color: string; icon: LucideIcon; iconColor: string }[] = [
    { label: t("admin.totalOrders"), value: stats.totalOrders, color: "bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400", icon: ShoppingCart, iconColor: "text-blue-500 dark:text-blue-400" },
    { label: t("admin.paidOrders"), value: stats.paidOrders, color: "bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400", icon: CreditCard, iconColor: "text-green-500 dark:text-green-400" },
    { label: t("admin.revenue"), value: `€${stats.totalRevenue.toFixed(2)}`, color: "bg-shqiponja/10 text-shqiponja", icon: Euro, iconColor: "text-shqiponja" },
    { label: t("admin.usersCount"), value: stats.totalUsers, color: "bg-purple-50 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400", icon: Users, iconColor: "text-purple-500 dark:text-purple-400" },
    { label: t("admin.packagesCount"), value: stats.totalPackages, color: "bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400", icon: Package, iconColor: "text-amber-500 dark:text-amber-400" },
  ];
  const syncStatus = cronStatus?.lastSync || null;
  const intervalMinutes = cronStatus ? Math.round(cronStatus.intervalMs / 60000) : null;
  // eslint-disable-next-line react-hooks/purity
  const lastSyncAgeMs = syncStatus ? Date.now() - new Date(syncStatus.at).getTime() : Number.POSITIVE_INFINITY;
  const isStale = !!cronStatus && (!cronStatus.enabled || !syncStatus || !!syncStatus.error || lastSyncAgeMs > cronStatus.staleAfterMs);
  const nextSyncAt = syncStatus && cronStatus ? new Date(syncStatus.at).getTime() + cronStatus.intervalMs : null;
  const healthLabel = !cronStatus ? null : !cronStatus.enabled ? "joaktiv" : syncStatus?.error ? "gabim" : isStale ? "stale" : "healthy";
  const cronTone = syncStatus?.error || !cronStatus?.enabled
    ? "border-red-300 bg-red-50 text-red-600 dark:border-red-800 dark:bg-red-900/30 dark:text-red-400"
    : isStale
      ? "border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-900/30 dark:text-amber-300"
      : "border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300";

  return (
    <div>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold">{t("admin.dashboard")}</h1>
          <p className="mt-1 text-sm text-zinc-500">{t("admin.summary")}</p>
        </div>
        {cronStatus && (
          <div className={`rounded-lg border px-3 py-2 text-xs ${cronTone}`}>
            <div className="flex items-center gap-2">
            <RefreshCw className="h-3.5 w-3.5" />
            <span>
              Cron: <strong>{cronStatus.enabled ? "aktiv" : "joaktiv"}</strong>
              {intervalMinutes && ` · çdo ${intervalMinutes} min`}
              {healthLabel && ` · ${healthLabel}`}
              {syncStatus && ` · sinkronizimi ${timeAgo(syncStatus.at)}`}
              {syncStatus && !syncStatus.error && ` · ${syncStatus.count} paketa`}
              {syncStatus?.error && ` · Gabim: ${syncStatus.error}`}
            </span>
            </div>
            {cronStatus.enabled && !syncStatus?.error && nextSyncAt && (
              <p className="mt-1 pl-5 text-[11px] opacity-85">
                Sync-i i ardhshëm pritet {timeUntil(nextSyncAt)}
              </p>
            )}
          </div>
        )}
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-5">
        {cards.map((c) => {
          const Icon = c.icon;
          return (
            <div key={c.label} className={`rounded-xl border border-zinc-200 p-4 sm:p-5 dark:border-zinc-700 ${c.color}`}>
              <div className="flex items-center justify-between">
                <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider opacity-70">{c.label}</p>
                <Icon className={`h-5 w-5 opacity-60 ${c.iconColor}`} />
              </div>
              <p className="mt-1 sm:mt-2 text-xl sm:text-2xl font-extrabold">{c.value}</p>
            </div>
          );
        })}
      </div>

      {/* Twilio Balance */}
      <div className="mt-4">
        <div className="inline-flex items-center gap-3 rounded-xl border border-zinc-200 bg-white px-5 py-3 dark:border-zinc-700 dark:bg-zinc-900">
          <MessageSquare className="h-5 w-5 text-shqiponja" />
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">{t("admin.twilioBalance")}</p>
            {twilioBalanceError ? (
              <p className="text-sm font-semibold text-red-500">{t("admin.twilioBalanceError")}</p>
            ) : twilioBalance ? (
              <p className="text-lg font-extrabold">
                {twilioBalance.balance.toFixed(2)} {twilioBalance.currency.toUpperCase()}
              </p>
            ) : (
              <p className="text-sm text-zinc-400">{t("admin.twilioBalanceLoading")}</p>
            )}
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="mt-6 sm:mt-8 grid gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-3">
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
