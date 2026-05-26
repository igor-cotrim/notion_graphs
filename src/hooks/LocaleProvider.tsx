"use client";

import { useState, useCallback, useMemo } from "react";
import type { ReactNode } from "react";
import { locales, defaultLocale, localeLabels } from "@/lib/locale";
import type { Locale, Translations, TranslationKey } from "@/lib/locale";
import { LocaleContext } from "./useLocale";

const STORAGE_KEY = "notion-graphs:locale";

function getInitialLocale(): Locale {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && stored in locales) return stored as Locale;
  } catch {
    // SSR or storage unavailable
  }
  return defaultLocale;
}

function getNestedValue(obj: Translations, path: string): unknown {
  let current: unknown = obj;
  for (const key of path.split(".")) {
    if (
      current === null ||
      current === undefined ||
      typeof current !== "object"
    ) {
      return path;
    }
    current = (current as Record<string, unknown>)[key];
  }
  return current ?? path;
}

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(getInitialLocale);

  const setLocale = useCallback((newLocale: Locale) => {
    setLocaleState(newLocale);
    try {
      localStorage.setItem(STORAGE_KEY, newLocale);
    } catch {
      // Storage unavailable
    }
  }, []);

  const toggleLocale = useCallback(() => {
    setLocale(locale === "en" ? "pt-BR" : "en");
  }, [locale, setLocale]);

  const translations = locales[locale];

  const t = useCallback(
    (key: TranslationKey): string => {
      const value = getNestedValue(translations, key);
      return typeof value === "string" ? value : key;
    },
    [translations],
  );

  const value = useMemo(
    () => ({
      locale,
      setLocale,
      toggleLocale,
      t,
      localeLabel: localeLabels[locale],
    }),
    [locale, setLocale, toggleLocale, t],
  );

  return (
    <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>
  );
}
