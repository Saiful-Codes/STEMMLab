import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { LanguageCode, translate } from '../i18n/translations';
import { loadPreferences, savePreferences } from '../storage/preferences';

type LanguageContextValue = {
  language: LanguageCode;
  loading: boolean;
  setLanguage: (code: LanguageCode) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
};

const LanguageContext = createContext<LanguageContextValue | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<LanguageCode>('en');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const prefs = await loadPreferences();
      if (cancelled) return;
      setLanguageState(prefs.language);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const setLanguage = useCallback((code: LanguageCode) => {
    setLanguageState(code);
    void savePreferences({ language: code });
  }, []);

  const t = useCallback(
    (key: string, params?: Record<string, string | number>) =>
      translate(language, key, params),
    [language]
  );

  const value = useMemo<LanguageContextValue>(
    () => ({ language, loading, setLanguage, t }),
    [language, loading, setLanguage, t]
  );

  return (
    <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
  );
}

export function useTranslation(): LanguageContextValue {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useTranslation must be used within a LanguageProvider');
  return ctx;
}
