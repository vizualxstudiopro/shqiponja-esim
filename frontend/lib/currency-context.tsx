"use client";

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import { getExchangeRates } from "@/lib/api";

export type CurrencyCode = "EUR" | "ALL" | "USD" | "GBP";

interface CurrencyContextType {
  currency: CurrencyCode;
  setCurrency: (c: CurrencyCode) => void;
  rates: Record<string, number>;
  /** Convert a EUR price to the selected currency */
  convert: (eurPrice: number) => number;
  /** Format a EUR price in the selected currency */
  formatPrice: (eurPrice: number) => string;
  symbol: string;
}

const SYMBOLS: Record<CurrencyCode, string> = {
  EUR: "€",
  ALL: "Lek",
  USD: "$",
  GBP: "£",
};

const DEFAULT_RATES: Record<string, number> = { EUR: 1, ALL: 109, USD: 1.09, GBP: 0.86 };

const CurrencyContext = createContext<CurrencyContextType>({
  currency: "EUR",
  setCurrency: () => {},
  rates: DEFAULT_RATES,
  convert: (p) => p,
  formatPrice: (p) => `€${p.toFixed(2)}`,
  symbol: "€",
});

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [currency, setCurrencyState] = useState<CurrencyCode>("EUR");
  const [rates, setRates] = useState<Record<string, number>>(DEFAULT_RATES);

  useEffect(() => {
    // Load saved preference
    const saved = localStorage.getItem("currency") as CurrencyCode | null;
    if (saved && SYMBOLS[saved]) {
      // Keep EUR as the default storefront/checkout currency even if older sessions saved ALL.
      if (saved === "ALL") {
        localStorage.setItem("currency", "EUR");
        setCurrencyState("EUR");
      } else {
        setCurrencyState(saved);
      }
    }

    getExchangeRates()
      .then((data) => {
        if (data.rates) setRates(data.rates);
      })
      .catch(() => {});
  }, []);

  const setCurrency = useCallback((c: CurrencyCode) => {
    setCurrencyState(c);
    localStorage.setItem("currency", c);
  }, []);

  const convert = useCallback(
    (eurPrice: number) => {
      const rate = rates[currency] || 1;
      return Math.round(eurPrice * rate * 100) / 100;
    },
    [currency, rates]
  );

  const formatPrice = useCallback(
    (eurPrice: number) => {
      const converted = convert(eurPrice);
      if (currency === "ALL") return `${Math.round(converted)} Lek`;
      const sym = SYMBOLS[currency] || "€";
      return `${sym}${converted.toFixed(2)}`;
    },
    [currency, convert]
  );

  return (
    <CurrencyContext.Provider
      value={{ currency, setCurrency, rates, convert, formatPrice, symbol: SYMBOLS[currency] }}
    >
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  return useContext(CurrencyContext);
}
