/* ── Proveedor de idioma: guarda el idioma elegido y expone t() ─────────── */
import { useState, useCallback, type ReactNode } from 'react';
import { I18nContext, LOCALE_MAP, LOCALE_STORAGE_KEY, loadLocale, type Locale } from '../i18n';

export default function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(loadLocale);

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l);
    localStorage.setItem(LOCALE_STORAGE_KEY, l);
    document.documentElement.lang = l;
  }, []);

  const t = useCallback((key: string, fallback?: string): string => {
    return LOCALE_MAP[locale]?.[key] ?? fallback ?? key;
  }, [locale]);

  return (
    <I18nContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </I18nContext.Provider>
  );
}
