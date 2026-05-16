"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import translations, { type Locale, type TranslationKey } from "../i18n/translations";

interface I18nContextType {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: (key: TranslationKey) => string;
}

const I18nContext = createContext<I18nContextType>({
  locale: "sq",
  setLocale: () => {},
  t: (key) => key,
});

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("sq");
  const [mounted, setMounted] = useState(false);

  // Initialize locale from localStorage after mount (client-side only)
  useEffect(() => {
    const saved = localStorage.getItem("locale") as Locale | null;
    const initialLocale = saved && translations[saved] ? saved : "sq";
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLocaleState(initialLocale);
    setMounted(true);
  }, []);

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l);
    localStorage.setItem("locale", l);
  }, []);

  const t = useCallback(
    (key: TranslationKey) => translations[locale][key] ?? key,
    [locale]
  );

  return (
    <I18nContext value={{ locale, setLocale, t }}>
      {children}
    </I18nContext>
  );
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  return ctx;
}
