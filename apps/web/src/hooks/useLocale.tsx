import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import type { Locale } from "@nst/shared";

/**
 * Locale provider — a single app-wide language switch (EN/TH/CN), persisted to
 * localStorage so the mayor's choice survives reloads. Defaults to "en" so the
 * existing English contracts (and Playwright assertions) stay green.
 *
 * Panels consume it via {@link useLocale}; the `t()` helper selects the active
 * language from a localizable object. The shared `IBM Plex Sans Thai` font
 * (loaded in main.tsx) makes Thai render natively with no extra wiring.
 */
const KEY = "nst:locale";

/**
 * A piece of copy that can be localized. Only `en` is required — panels
 * translate as many of {th, zh} as they need and fall back to English for any
 * missing locale. This keeps the EN/TH work here from forcing zh everywhere.
 */
export type LocalizableText = { en: string; th?: string; zh?: string };

interface LocaleContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  /** Convenience flip between the dashboard's two primary languages (en/th). */
  toggle: () => void;
  /** Translate a localizable string to the active locale (falls back to en). */
  t: (text: LocalizableText) => string;
}

const LocaleContext = createContext<LocaleContextValue | null>(null);

function readStoredLocale(): Locale {
  try {
    const v = localStorage.getItem(KEY);
    if (v === "en" || v === "th" || v === "zh") return v;
  } catch {
    /* localStorage may be unavailable (private mode / SSR guard) */
  }
  return "en";
}

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(readStoredLocale);

  useEffect(() => {
    try {
      localStorage.setItem(KEY, locale);
    } catch {
      /* ignore persistence failure */
    }
  }, [locale]);

  const setLocale = useCallback((l: Locale) => setLocaleState(l), []);
  const toggle = useCallback(
    () => setLocaleState((prev) => (prev === "en" ? "th" : "en")),
    [],
  );
  const t = useCallback(
    (text: LocalizableText) => text[locale] ?? text.en,
    [locale],
  );

  return (
    <LocaleContext.Provider value={{ locale, setLocale, toggle, t }}>
      {children}
    </LocaleContext.Provider>
  );
}

export function useLocale(): LocaleContextValue {
  const ctx = useContext(LocaleContext);
  if (!ctx) throw new Error("useLocale must be used within a <LocaleProvider>");
  return ctx;
}
