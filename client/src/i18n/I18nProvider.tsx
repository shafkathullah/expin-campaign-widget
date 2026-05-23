import { createContext, useCallback, useContext, useEffect, useMemo } from 'react';
import { parseAsStringLiteral, useQueryState } from 'nuqs';
import { DEFAULT_LANG, LANGS, type Lang, type TKey, strings } from './strings';

const LS_KEY = 'expin.lang';

type I18nContextValue = {
  lang: Lang;
  setLang: (next: Lang) => void;
  t: (key: TKey, vars?: Record<string, string | number>) => string;
  dir: 'ltr' | 'rtl';
  /** BCP-47 locale tag for `Intl.*` formatters. */
  locale: string;
};

const I18nContext = createContext<I18nContextValue | null>(null);

function readInitialLang(): Lang {
  if (typeof window === 'undefined') return DEFAULT_LANG;
  const stored = window.localStorage.getItem(LS_KEY);
  return stored === 'ar' || stored === 'en' ? stored : DEFAULT_LANG;
}

function interpolate(template: string, vars?: Record<string, string | number>): string {
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (_, key) => {
    const v = vars[key];
    return v === undefined ? `{${key}}` : String(v);
  });
}

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [urlLang, setUrlLang] = useQueryState(
    'lang',
    parseAsStringLiteral(LANGS).withDefault(readInitialLang()),
  );

  const lang: Lang = urlLang;
  const dir = lang === 'ar' ? 'rtl' : 'ltr';
  // ar-AE with Latin digits — Gulf merchant convention. See SPEC §4 R6.
  const locale = lang === 'ar' ? 'ar-AE-u-nu-latn' : 'en-US';

  const setLang = useCallback(
    (next: Lang) => {
      // Only write to URL when diverging from default — keeps URLs clean.
      void setUrlLang(next === DEFAULT_LANG ? null : next);
      try {
        window.localStorage.setItem(LS_KEY, next);
      } catch {
        // localStorage can throw in private mode; ignore.
      }
    },
    [setUrlLang],
  );

  useEffect(() => {
    document.documentElement.dir = dir;
    document.documentElement.lang = lang;
  }, [dir, lang]);

  const t = useCallback<I18nContextValue['t']>(
    (key, vars) => interpolate(strings[lang][key] ?? strings.en[key] ?? key, vars),
    [lang],
  );

  const value = useMemo<I18nContextValue>(
    () => ({ lang, setLang, t, dir, locale }),
    [lang, setLang, t, dir, locale],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used within I18nProvider');
  return ctx;
}

export function useT() {
  return useI18n().t;
}
