/**
 * Tiny i18n framework.
 *
 * Dictionaries are nested objects per locale, split into namespace files
 * (common, publicPages, auth, flow, tree, media, dash). They are flattened
 * into dotted keys at startup. t() falls back to English, then to the key
 * itself, so a missing translation never renders as a blank.
 *
 * Adding a language = add src/i18n/locales/<code>/ with the same namespace
 * files, register it in LANGS below and in the locale index files.
 */
import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { loadJSON, saveJSON, KEYS } from '@/lib/storage';
import type { Lang } from '@/lib/types';
import en from './locales/en';
import hi from './locales/hi';

export const LANGS: { code: Lang; nativeName: string }[] = [
  { code: 'en', nativeName: 'English' },
  { code: 'hi', nativeName: 'हिन्दी' },
];

type Nested = { [k: string]: string | Nested };

function flatten(obj: Nested, prefix = '', out: Record<string, string> = {}): Record<string, string> {
  for (const [k, v] of Object.entries(obj)) {
    const key = prefix ? `${prefix}.${k}` : k;
    if (typeof v === 'string') out[key] = v;
    else flatten(v, key, out);
  }
  return out;
}

const DICTS: Record<Lang, Record<string, string>> = {
  en: flatten(en as Nested),
  hi: flatten(hi as Nested),
};

export type TFunc = (key: string, params?: Record<string, string | number>) => string;

interface I18nValue {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: TFunc;
}

const I18nContext = createContext<I18nValue | null>(null);

function interpolate(s: string, params?: Record<string, string | number>): string {
  if (!params) return s;
  return s.replace(/\{(\w+)\}/g, (m, name) => (name in params ? String(params[name]) : m));
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => {
    const fromHash = new URLSearchParams(window.location.search).get('lang');
    const stored = loadJSON<Lang>(KEYS.lang, 'en');
    const l = (fromHash === 'hi' || fromHash === 'en' ? fromHash : stored) as Lang;
    document.documentElement.lang = l;
    return l;
  });

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    saveJSON(KEYS.lang, l);
    document.documentElement.lang = l;
  }, []);

  const t = useCallback<TFunc>(
    (key, params) => {
      const s = DICTS[lang][key] ?? DICTS.en[key];
      if (s === undefined) {
        if (import.meta.env.DEV) console.warn(`[i18n] missing key: ${key}`);
        return key;
      }
      return interpolate(s, params);
    },
    [lang],
  );

  const value = useMemo(() => ({ lang, setLang, t }), [lang, setLang, t]);
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nValue {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used inside I18nProvider');
  return ctx;
}

/** Format an ISO date for display in the active language. */
export function formatDate(iso: string, lang: Lang, withTime = false): string {
  const d = new Date(iso);
  return d.toLocaleString(lang === 'hi' ? 'hi-IN' : 'en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    ...(withTime ? { hour: 'numeric', minute: '2-digit' } : {}),
  });
}
