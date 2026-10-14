import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { dictionaries, interpolate, type Dictionary, type Lang } from './translations.js';

const STORAGE_KEY = 'tma-shop:lang';

function detectLang(): Lang {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'uz' || stored === 'ru') return stored;
  } catch {
    // localStorage unavailable (e.g. private mode) — fall through to detection.
  }
  const nav = typeof navigator !== 'undefined' ? navigator.language.toLowerCase() : '';
  return nav.startsWith('ru') ? 'ru' : 'uz';
}

interface LanguageValue {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: (key: keyof Dictionary, params?: Record<string, string | number>) => string;
}

const LanguageContext = createContext<LanguageValue | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }): React.JSX.Element {
  const [lang, setLangState] = useState<Lang>(detectLang);

  const setLang = useCallback((next: Lang) => {
    setLangState(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // ignore persistence failures
    }
  }, []);

  const t = useCallback(
    (key: keyof Dictionary, params?: Record<string, string | number>) =>
      interpolate(dictionaries[lang][key], params),
    [lang],
  );

  const value = useMemo<LanguageValue>(() => ({ lang, setLang, t }), [lang, setLang, t]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLang(): LanguageValue {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLang must be used within a LanguageProvider');
  return ctx;
}
