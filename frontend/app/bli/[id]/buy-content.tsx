"use client";

import { useState, useEffect } from "react";
import { useI18n } from "@/lib/i18n-context";
import type { EsimPackage } from "@/lib/api";
import { getExchangeRates } from "@/lib/api";
import Navbar from "@/components/navbar";
import OrderForm from "./order-form";

const REGIONAL_CODES = new Set(["EU", "AS", "ME", "OC", "CB", "AF"]);
const GLOBAL_CODES = new Set(["GL"]);

function BuyFlagIcon({ countryCode, emoji }: { countryCode?: string; emoji?: string }) {
  const cc = (countryCode || "").toLowerCase();
  const upper = cc.toUpperCase();
  if (upper === "EU") {
    return <span className="fi fi-eu fis" style={{ fontSize: "3rem", borderRadius: "6px", display: "inline-block" }} />;
  }
  if (cc && cc.length === 2 && !REGIONAL_CODES.has(upper) && !GLOBAL_CODES.has(upper)) {
    return <span className={`fi fi-${cc} fis`} style={{ fontSize: "3rem", borderRadius: "6px", display: "inline-block" }} />;
  }
  return <span className="text-5xl leading-none">{emoji || "🌍"}</span>;
}

export default function BuyPageContent({ pkg }: { pkg: EsimPackage }) {
  const { t } = useI18n();
  const [eurToAll, setEurToAll] = useState(109);

  useEffect(() => {
    getExchangeRates().then(r => setEurToAll(r.eur_to_all)).catch(() => {});
  }, []);

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <Navbar />

      <div className="mx-auto max-w-2xl px-6 py-16">
        <div className="rounded-2xl border border-zinc-200 bg-white p-8 dark:border-zinc-700 dark:bg-zinc-800">
          <div className="flex items-center gap-4">
            <BuyFlagIcon countryCode={pkg.country_code} emoji={pkg.flag} />
            <div>
              <h1 className="text-2xl font-extrabold">{pkg.name}</h1>
              <p className="text-sm text-zinc-500">{pkg.description}</p>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-3 gap-4 text-center">
            <div className="rounded-xl bg-zinc-50 p-4 dark:bg-zinc-900">
              <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                {t("buy.data")}
              </p>
              <p className="mt-1 text-lg font-bold">{pkg.data}</p>
            </div>
            <div className="rounded-xl bg-zinc-50 p-4 dark:bg-zinc-900">
              <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                {t("buy.duration")}
              </p>
              <p className="mt-1 text-lg font-bold">{pkg.duration}</p>
            </div>
            <div className="rounded-xl bg-zinc-50 p-4 dark:bg-zinc-900">
              <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                {t("buy.price")}
              </p>
              <p className="mt-1 text-lg font-bold text-shqiponja">
                €{Number(pkg.price).toFixed(2)}
              </p>
              <p className="text-xs text-zinc-400">~{Math.round(Number(pkg.price) * eurToAll)} Lek</p>
            </div>
          </div>

          <div className="my-8 border-t border-zinc-100" />

          <h2 className="text-lg font-bold">{t("buy.fillOrder")}</h2>
          <p className="mt-1 text-sm text-zinc-500">
            {t("buy.fillOrderSub")}
          </p>

          <OrderForm packageId={pkg.id} price={pkg.price} />
        </div>
      </div>
    </div>
  );
}
