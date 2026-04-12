import type { ReactNode } from "react";

interface KpiCardProps {
  label: string;
  value: string | number;
  icon: ReactNode;
  trend?: string;
  color?: "red" | "green" | "blue" | "amber";
}

const colorMap = {
  red: "bg-shqiponja/10 text-shqiponja",
  green: "bg-green-500/10 text-green-400",
  blue: "bg-blue-500/10 text-blue-400",
  amber: "bg-amber-500/10 text-amber-400",
};

export default function KpiCard({ label, value, icon, trend, color = "red" }: KpiCardProps) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">{label}</p>
          <p className="mt-2 text-2xl font-extrabold text-zinc-100">{value}</p>
          {trend && <p className="mt-1 text-xs text-zinc-500">{trend}</p>}
        </div>
        <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${colorMap[color]}`}>
          {icon}
        </div>
      </div>
    </div>
  );
}
