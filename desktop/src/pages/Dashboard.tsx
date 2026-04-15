import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { adminGetStats, getHealthStatus, type AdminStats, type SyncStatus } from "@/lib/api";
import KpiCard from "@/components/KpiCard";
import StatusBadge from "@/components/StatusBadge";
import { Receipt, Users, Euro, ShoppingCart, TrendingUp, RefreshCw } from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

function timeAgo(isoDate: string): string {
  const diff = Date.now() - new Date(isoDate).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "tani";
  if (mins < 60) return `${mins} min më parë`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} orë më parë`;
  return `${Math.floor(hrs / 24)} ditë më parë`;
}

export default function Dashboard() {
  const { token } = useAuth();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [syncStatus, setSyncStatus] = useState<SyncStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    adminGetStats(token)
      .then(setStats)
      .catch(() => {})
      .finally(() => setLoading(false));
    getHealthStatus().then((h) => setSyncStatus(h.lastSync)).catch(() => {});
  }, [token]);

  if (loading)
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-28 animate-pulse rounded-xl bg-zinc-800" />
          ))}
        </div>
        <div className="h-72 animate-pulse rounded-xl bg-zinc-800" />
      </div>
    );

  if (!stats) return <p className="text-sm text-zinc-500">Nuk u ngarkuan statistikat.</p>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-extrabold">Dashboard</h1>
          <p className="text-sm text-zinc-500">Përmbledhja e platformës</p>
        </div>
        {syncStatus && (
          <div className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-xs ${syncStatus.error ? "border-red-800 bg-red-900/30 text-red-400" : "border-zinc-700 bg-zinc-800 text-zinc-300"}`}>
            <RefreshCw className="h-3.5 w-3.5" />
            <span>
              Sinkronizimi: <strong>{timeAgo(syncStatus.at)}</strong>
              {!syncStatus.error && ` · ${syncStatus.count} paketa`}
              {syncStatus.error && ` · Gabim: ${syncStatus.error}`}
            </span>
          </div>
        )}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard
          label="Porosi Totale"
          value={stats.totalOrders}
          icon={<ShoppingCart className="h-5 w-5" />}
          color="blue"
        />
        <KpiCard
          label="Paguar"
          value={stats.paidOrders}
          icon={<Receipt className="h-5 w-5" />}
          color="green"
        />
        <KpiCard
          label="Të Ardhura"
          value={`€${stats.totalRevenue.toFixed(2)}`}
          icon={<Euro className="h-5 w-5" />}
          color="amber"
        />
        <KpiCard
          label="Përdorues"
          value={stats.totalUsers}
          icon={<Users className="h-5 w-5" />}
          color="red"
        />
      </div>

      {/* Revenue Chart */}
      {stats.dailyRevenue && stats.dailyRevenue.length > 0 && (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
          <div className="mb-4 flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-shqiponja" />
            <h2 className="text-sm font-bold">Të ardhurat ditore (30 ditë)</h2>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={stats.dailyRevenue}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#C8102E" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#C8102E" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
              <XAxis
                dataKey="date"
                tick={{ fill: "#71717a", fontSize: 11 }}
                tickFormatter={(v: string) => v.slice(5)}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: "#71717a", fontSize: 11 }}
                tickFormatter={(v: number) => `€${v}`}
                axisLine={false}
                tickLine={false}
                width={55}
              />
              <Tooltip
                contentStyle={{
                  background: "#18181b",
                  border: "1px solid #27272a",
                  borderRadius: 8,
                  fontSize: 12,
                }}
                labelStyle={{ color: "#a1a1aa" }}
                itemStyle={{ color: "#C8102E" }}
                formatter={(value: number) => [`€${value.toFixed(2)}`, "Të ardhura"]}
              />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="#C8102E"
                strokeWidth={2}
                fill="url(#colorRevenue)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Recent Orders */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
        <h2 className="mb-3 text-sm font-bold">Porositë e fundit</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-800 text-left text-xs text-zinc-500">
                <th className="pb-2 font-medium">#</th>
                <th className="pb-2 font-medium">Paketa</th>
                <th className="pb-2 font-medium">Email</th>
                <th className="pb-2 font-medium">Pagesa</th>
                <th className="pb-2 font-medium">Data</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {stats.recentOrders?.map((o) => (
                <tr key={o.id} className="text-zinc-300">
                  <td className="py-2.5 font-mono text-xs text-zinc-500">{o.id}</td>
                  <td className="py-2.5">{o.package_flag} {o.package_name}</td>
                  <td className="py-2.5 text-zinc-400">{o.email}</td>
                  <td className="py-2.5"><StatusBadge status={o.payment_status} /></td>
                  <td className="py-2.5 text-xs text-zinc-500">{new Date(o.created_at).toLocaleDateString("sq-AL")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
