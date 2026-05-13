"use client";

import { useCurrency, type CurrencyCode } from "@/lib/currency-context";
import { useState, useRef, useEffect } from "react";

const CURRENCIES: { code: CurrencyCode; label: string; symbol: string }[] = [
  { code: "EUR", label: "EUR", symbol: "€" },
  { code: "USD", label: "USD", symbol: "$" },
  { code: "ALL", label: "ALL", symbol: "Lek" },
  { code: "GBP", label: "GBP", symbol: "£" },
];

export default function CurrencySwitch() {
  const { currency, setCurrency } = useCurrency();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const current = CURRENCIES.find((c) => c.code === currency) || CURRENCIES[0];

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1 rounded-lg border border-zinc-200 px-2.5 py-1.5 text-xs font-semibold transition hover:bg-zinc-50 dark:border-zinc-600 dark:hover:bg-zinc-700"
        aria-label="Currency"
      >
        <span>{current.symbol}</span>
        <span className="hidden sm:inline">{current.code}</span>
        <svg className={`h-3 w-3 transition-transform ${open ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <div className="absolute right-0 top-full z-50 mt-1 w-28 rounded-lg border border-zinc-200 bg-white shadow-lg dark:border-zinc-600 dark:bg-zinc-800">
          {CURRENCIES.map((c) => (
            <button
              key={c.code}
              onClick={() => {
                setCurrency(c.code);
                setOpen(false);
              }}
              className={`flex w-full items-center gap-2 px-3 py-2 text-left text-xs font-medium transition hover:bg-zinc-50 dark:hover:bg-zinc-700 ${
                c.code === currency ? "text-shqiponja font-bold" : ""
              }`}
            >
              <span className="w-6">{c.symbol}</span>
              <span>{c.code}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
