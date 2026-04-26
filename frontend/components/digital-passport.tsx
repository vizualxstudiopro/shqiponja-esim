"use client";

import type { Order } from "@/lib/api";

interface PassportStamp {
  id: string;
  label: string;
  flag: string;
  date: string;
}

function normalizeLabel(name: string): string {
  return name
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 20);
}

function toPassportStamps(orders: Order[]): PassportStamp[] {
  const completed = orders
    .filter((order) => order.status === "completed")
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  const seen = new Set<string>();
  const unique: PassportStamp[] = [];

  for (const order of completed) {
    const label = normalizeLabel(order.package_name || "Destinacion");
    const key = `${order.package_flag || ""}-${label}`;
    if (seen.has(key)) continue;
    seen.add(key);

    unique.push({
      id: key,
      label,
      flag: order.package_flag || "🌍",
      date: new Date(order.created_at).toLocaleDateString("sq-AL", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      }),
    });

    if (unique.length >= 10) break;
  }

  return unique;
}

export default function DigitalPassport({ orders }: { orders: Order[] }) {
  const stamps = toPassportStamps(orders);

  return (
    <section className="mt-6 rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-700 dark:bg-zinc-800">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-extrabold text-zinc-900 dark:text-zinc-100">🛂 Pasaporta Digjitale</h2>
          <p className="mt-1 text-sm text-zinc-500">Vulat fitohen automatikisht kur aktivizon pako te reja eSIM.</p>
        </div>
        <span className="rounded-full bg-shqiponja/10 px-3 py-1 text-xs font-semibold text-shqiponja">
          {stamps.length} vula
        </span>
      </div>

      {stamps.length === 0 ? (
        <div className="mt-4 rounded-xl border border-dashed border-zinc-300 bg-zinc-50 px-4 py-5 text-sm text-zinc-500 dark:border-zinc-600 dark:bg-zinc-900/40 dark:text-zinc-400">
          Ende s'ke vula. Sapo te perfundosh porosine e pare, Pasaporta nis te mbushet.
        </div>
      ) : (
        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {stamps.map((stamp) => (
            <article
              key={stamp.id}
              className="rounded-2xl border border-zinc-200 bg-zinc-50 p-3 text-center shadow-sm dark:border-zinc-600 dark:bg-zinc-900/40"
            >
              <div className="text-2xl">{stamp.flag}</div>
              <p className="mt-1 line-clamp-1 text-xs font-semibold text-zinc-800 dark:text-zinc-200">{stamp.label}</p>
              <p className="mt-1 text-[11px] text-zinc-500 dark:text-zinc-400">{stamp.date}</p>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
