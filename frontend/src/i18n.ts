import { createContext, useContext } from 'react';
import es from './locales/es';
import en from './locales/en';
import pt from './locales/pt';
import { loadLocaleCookie, type Locale } from './preferences';

export type { Locale };

// Idioma del navegador: el que se usa la primera vez, antes de que el usuario elija
export const browserLocale = (): Locale =>
  navigator.language?.startsWith('pt') ? 'pt' : navigator.language?.startsWith('en') ? 'en' : 'es';

export function loadLocale(): Locale {
  return loadLocaleCookie() ?? browserLocale();
}

// Textos por idioma en src/locales/{es,en,pt}.ts
export const LOCALE_MAP: Record<Locale, Record<string, string>> = { es, en, pt };
const LOCALES: Locale[] = ['es', 'en', 'pt'];
export const nextLocale = (l: Locale): Locale => LOCALES[(LOCALES.indexOf(l) + 1) % LOCALES.length];

// Etiqueta BCP 47 para Intl (números, fechas)
export const LOCALE_TAG: Record<Locale, string> = { es: 'es-ES', en: 'en-GB', pt: 'pt-PT' };

// Sustituye {n}, {v}… en una traducción
export const fill = (s: string, vars: Record<string, string | number>) =>
  s.replace(/\{(\w+)\}/g, (m, k) => (k in vars ? String(vars[k]) : m));

// Traducción fuera de React (store, api): usa el idioma guardado
export const tNow = (key: string, vars?: Record<string, string | number>) => {
  const s = LOCALE_MAP[loadLocale()][key] ?? es[key as keyof typeof es] ?? key;
  return vars ? fill(s, vars) : s;
};

// ── Valores guardados (categorías, métodos, motivos…) ────────────────
// Los datos guardan el nombre tal cual se escribió ("Comida", "Ahorro/Inversion",
// "Food"…). Se reconoce en cualquier idioma, sin tildes ni mayúsculas, para
// traducirlo y darle un color estable.
export const normText = (s: string) => (s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLowerCase();
export type RefGroup = 'categories' | 'methods' | 'motives' | 'types' | 'incomeCats' | 'goalCats';
const REF_INDEX = new Map<string, string>();
for (const dict of [es, en, pt]) {
  for (const [k, v] of Object.entries(dict)) {
    const m = /^ref\.(categories|methods|motives|types|incomeCats|goalCats)\./.exec(k);
    if (m && !REF_INDEX.has(`${m[1]}:${normText(v)}`)) REF_INDEX.set(`${m[1]}:${normText(v)}`, k);
  }
}
export const refKeyOf = (group: RefGroup, value: string) => REF_INDEX.get(`${group}:${normText(value)}`);
// Traduce un valor conocido; los personalizados se muestran tal cual
export const refLabel = (group: RefGroup, value: string, t: (key: string) => string) => {
  const key = refKeyOf(group, value);
  return key ? t(key) : value;
};

// ── Context ─────────────────────────────────────────────────────────
export interface I18nCtx {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: (key: string, fallback?: string) => string;
}

export const I18nContext = createContext<I18nCtx>({
  locale: 'es',
  setLocale: () => {},
  t: (k: string) => k,
});

export function useLocale() {
  return useContext(I18nContext);
}

export function localizeError(error: unknown, t: (key: string, fallback?: string) => string): string {
  const message = error instanceof Error ? error.message : String(error || '');
  const normalized = message.toLowerCase();
  const requestId = typeof error === 'object' && error !== null && 'requestId' in error
    ? String((error as { requestId?: string }).requestId || '') : '';
  let localized = '';
  if (normalized.includes('demo account')) localized = t('demo.readOnly');
  else if (normalized.includes('email confirmation does not match')) localized = t('account.emailMismatch');
  else if (normalized.includes('database unavailable') || normalized.includes('schema is out of date')) localized = t('error.database');
  else if (normalized.includes('internal server error')) localized = t('error.internal');
  else if (normalized.includes('incorrect email') || normalized.includes('invalid credentials')) localized = t('error.credentials');
  else if (normalized.includes('already registered')) localized = t('error.emailTaken');
  else if (normalized.includes('invalid email')) localized = t('error.invalidEmail');
  else if (normalized.includes('access denied') || normalized.includes('not enabled')) localized = t('error.accessDenied');
  else if (normalized === 'request failed') localized = t('error.requestFailed');
  else if (normalized.includes('token') || normalized.includes('authenticated')) localized = t('error.auth');
  else localized = message || t('error.generic');
  return requestId ? `${localized} (${requestId})` : localized;
}
